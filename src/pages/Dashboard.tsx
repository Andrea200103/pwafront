import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import InviteModal from "../components/InviteModal";
import CollaboratorProfile from "../components/CollaboratorProfile";
import { api, setAuth } from "../api";
import {
  cacheTasks,
  getAllTasksLocal,
  putTaskLocal,
  removeTaskLocal,
  queue,
  type OutboxOp,
} from "../offline/db";
import { syncNow, setupOnlineSync } from "../offline/sync";

type Status = "Pendiente" | "En Progreso" | "Completada";

type Task = {
  _id: string;
  title: string;
  description?: string;
  status: Status;
  clienteId?: string;
  createdAt?: string;
  deleted?: boolean;
  pending?: boolean;
  assignedTo?: { _id: string; name: string; email: string } | null; // <- nuevo
};

const isLocalId = (id: string) => !/^[a-f0-9]{24}$/i.test(id);

function normalizeTask(x: any): Task {
  return {
    _id: String(x?._id ?? x?.id),
    title: String(x?.title ?? "(sin título)"),
    description: x?.description ?? "",
    status:
      x?.status === "Completada" ||
      x?.status === "En Progreso" ||
      x?.status === "Pendiente"
        ? x.status
        : "Pendiente",
    clienteId: x?.clienteId,
    createdAt: x?.createdAt,
    deleted: !!x?.deleted,
    pending: !!x?.pending,
    assignedTo: x?.assignedTo ?? null, // <- nuevo
  };
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [online, setOnline] = useState<boolean>(navigator.onLine);
  const { projectId } = useParams();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const [project, setProject] = useState<any>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [profileUser, setProfileUser] = useState<any>(null);

  useEffect(() => {
    if (projectId) {
      api.get(`/projects/${projectId}`).then(({ data }) => {
        setProject(data.project);
        if (searchParams.get("newMember")) {
          const me = data.project.members.at(-1);
          if (me) setProfileUser(me);
        }
      });
    }
    setAuth(localStorage.getItem("token"));

    const unsubscribe = setupOnlineSync();

    const on = async () => {
      setOnline(true);
      await syncNow();
      await loadFromServer();
    };
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);

    (async () => {
      const local = await getAllTasksLocal();
      if (local?.length) setTasks(local.map(normalizeTask));
      await loadFromServer();
      await syncNow();
      await loadFromServer();
    })();

    return () => {
      unsubscribe?.();
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, [projectId]);

  async function loadFromServer() {
    try {
      const url = projectId ? `/tasks?project=${projectId}` : "/tasks";
      const { data } = await api.get(url);
      const raw = Array.isArray(data?.items) ? data.items : [];
      const list = raw.map(normalizeTask);
      setTasks(list);
      await cacheTasks(list);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    const d = description.trim();
    if (!t) return;

    const clienteId = crypto.randomUUID();
    const localTask = normalizeTask({
      _id: clienteId,
      title: t,
      description: d,
      status: "Pendiente" as Status,
      pending: !navigator.onLine,
    });

    setTasks((prev) => [localTask, ...prev]);
    await putTaskLocal(localTask);
    setTitle("");
    setDescription("");

    if (!navigator.onLine) {
      const op: OutboxOp = {
        id: "op-" + clienteId,
        op: "create",
        clienteId,
        data: localTask,
        ts: Date.now(),
      };
      await queue(op);
      return;
    }

    try {
      const { data } = await api.post("/tasks", {
        title: t,
        description: d,
        project: projectId || undefined,
      });
      const created = normalizeTask(data?.task ?? data);
      setTasks((prev) => prev.map((x) => (x._id === clienteId ? created : x)));
      await putTaskLocal(created);
    } catch {
      const op: OutboxOp = {
        id: "op-" + clienteId,
        op: "create",
        clienteId,
        data: localTask,
        ts: Date.now(),
      };
      await queue(op);
    }
  }

  // <- función nueva para asignar tarea
  async function assignTask(taskId: string, memberId: string) {
    try {
      await api.put(`/tasks/${taskId}`, { assignedTo: memberId || null });
      setTasks((prev) =>
        prev.map((t) =>
          t._id === taskId
            ? {
                ...t,
                assignedTo: memberId
                  ? project?.members.find((m: any) => m._id === memberId) ?? null
                  : null,
              }
            : t
        )
      );
    } catch {
      alert("Error al asignar tarea");
    }
  }

  function startEdit(task: Task) {
    setEditingId(task._id);
    setEditingTitle(task.title);
    setEditingDescription(task.description ?? "");
  }

  async function saveEdit(taskId: string) {
    const newTitle = editingTitle.trim();
    const newDesc = editingDescription.trim();
    if (!newTitle) return;

    const before = tasks.find((t) => t._id === taskId);
    const patched = { ...before, title: newTitle, description: newDesc } as Task;

    setTasks((prev) => prev.map((t) => (t._id === taskId ? patched : t)));
    await putTaskLocal(patched);
    setEditingId(null);

    if (!navigator.onLine) {
      await queue({
        id: "upd-" + taskId,
        op: "update",
        clienteId: isLocalId(taskId) ? taskId : undefined,
        serverId: isLocalId(taskId) ? undefined : taskId,
        data: { title: newTitle, description: newDesc },
        ts: Date.now(),
      } as OutboxOp);
      return;
    }

    try {
      await api.put(`/tasks/${taskId}`, { title: newTitle, description: newDesc });
    } catch {
      await queue({
        id: "upd-" + taskId,
        op: "update",
        serverId: taskId,
        data: { title: newTitle, description: newDesc },
        ts: Date.now(),
      } as OutboxOp);
    }
  }

  async function handleStatusChange(task: Task, newStatus: Status) {
    const updated = { ...task, status: newStatus };
    setTasks((prev) => prev.map((x) => (x._id === task._id ? updated : x)));
    await putTaskLocal(updated);

    if (!navigator.onLine) {
      await queue({
        id: "upd-" + task._id,
        op: "update",
        serverId: isLocalId(task._id) ? undefined : task._id,
        clienteId: isLocalId(task._id) ? task._id : undefined,
        data: { status: newStatus },
        ts: Date.now(),
      });
      return;
    }

    try {
      await api.put(`/tasks/${task._id}`, { status: newStatus });
    } catch {
      await queue({
        id: "upd-" + task._id,
        op: "update",
        serverId: task._id,
        data: { status: newStatus },
        ts: Date.now(),
      });
    }
  }

  async function removeTask(taskId: string) {
    const backup = tasks;
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
    await removeTaskLocal(taskId);

    if (!navigator.onLine) {
      await queue({ id: "del-" + taskId, op: "delete", serverId: isLocalId(taskId) ? undefined : taskId, clienteId: isLocalId(taskId) ? taskId : undefined, ts: Date.now() });
      return;
    }

    try {
      await api.delete(`/tasks/${taskId}`);
    } catch {
      setTasks(backup);
      for (const t of backup) await putTaskLocal(t);
      await queue({ id: "del-" + taskId, op: "delete", serverId: taskId, clienteId: isLocalId(taskId) ? taskId : undefined, ts: Date.now() });
    }
  }

  function logout() {
    localStorage.removeItem("token");
    setAuth(null);
    window.location.href = "/";
  }

  const filtered = useMemo(() => {
    let list = tasks;
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (t) =>
          (t.title || "").toLowerCase().includes(s) ||
          (t.description || "").toLowerCase().includes(s)
      );
    }
    if (filter === "active") list = list.filter((t) => t.status !== "Completada");
    if (filter === "completed") list = list.filter((t) => t.status === "Completada");
    return list;
  }, [tasks, search, filter]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "Completada").length;
    return { total, done, pending: total - done };
  }, [tasks]);

  return (
    <div className="wrap">
      <header className="topbar">
        <h1>
          {project ? (
            <>
              <span
                className="muted"
                style={{ cursor: "pointer", fontSize: 14 }}
                onClick={() => nav("/projects")}
              >
                ← Proyectos
              </span>
              {" / "}
              {project.name}
            </>
          ) : (
            "To-Do PWA"
          )}
        </h1>
        <div className="spacer" />
        <div className="stats">
          <span>Total: {stats.total}</span>
          <span>Hechas: {stats.done}</span>
          <span>Pendientes: {stats.pending}</span>
          <span className="badge" style={{ marginLeft: 8, background: online ? "#1f6feb" : "#b45309" }}>
            {online ? "Online" : "Offline"}
          </span>
        </div>
        {project && (
          <>
            <div className="members-row">
              {project.members?.map((m: any) => (
                <span
                  key={m._id}
                  className="avatar-chip"
                  title={m.name}
                  style={{ cursor: "pointer" }}
                  onClick={() => setProfileUser(m)}
                >
                  {m.name.slice(0, 2).toUpperCase()}
                </span>
              ))}
            </div>
            <button className="btn" onClick={() => setShowInvite(true)}>
              + Invitar
            </button>
          </>
        )}
        <button className="btn danger" onClick={logout}>Salir</button>
      </header>

      <main>
        <form className="add add-grid" onSubmit={addTask}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título de la tarea…"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción (opcional)…"
            rows={2}
          />
          <button className="btn">Agregar</button>
        </form>

        <div className="toolbar">
          <input
            className="search"
            placeholder="Buscar por título o descripción…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="filters">
            <button className={filter === "all" ? "chip active" : "chip"} onClick={() => setFilter("all")} type="button">Todas</button>
            <button className={filter === "active" ? "chip active" : "chip"} onClick={() => setFilter("active")} type="button">Activas</button>
            <button className={filter === "completed" ? "chip active" : "chip"} onClick={() => setFilter("completed")} type="button">Hechas</button>
          </div>
        </div>

        {loading ? (
          <p>Cargando…</p>
        ) : filtered.length === 0 ? (
          <p className="empty">Sin tareas</p>
        ) : (
          <ul className="list">
            {filtered.map((t) => (
              <li key={t._id} className={t.status === "Completada" ? "item done" : "item"}>
                <select
                  value={t.status}
                  onChange={(e) => handleStatusChange(t, e.target.value as Status)}
                  className="status-select"
                  title="Estado"
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="En Progreso">En Progreso</option>
                  <option value="Completada">Completada</option>
                </select>

                <div className="content">
                  {editingId === t._id ? (
                    <>
                      <input className="edit" value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} placeholder="Título" autoFocus />
                      <textarea className="edit" value={editingDescription} onChange={(e) => setEditingDescription(e.target.value)} placeholder="Descripción" rows={2} />
                    </>
                  ) : (
                    <>
                      <span className="title" onDoubleClick={() => startEdit(t)}>{t.title}</span>
                      {t.description && <p className="desc">{t.description}</p>}

                      {/* <- dropdown de asignación */}
                      {project && !isLocalId(t._id) && (
                        <select
                          className="status-select"
                          value={t.assignedTo?._id ?? ""}
                          onChange={(e) => assignTask(t._id, e.target.value)}
                          style={{ marginTop: 6, fontSize: 12 }}
                          title="Asignar a"
                        >
                          <option value="">👤 Sin asignar</option>
                          {project.members?.map((m: any) => (
                            <option key={m._id} value={m._id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      )}

                      {(t.pending || isLocalId(t._id)) && (
                        <span className="badge" title="Aún no sincronizada" style={{ background: "#b45309", width: "fit-content" }}>
                          Falta sincronizar
                        </span>
                      )}
                    </>
                  )}
                </div>

                <div className="actions">
                  {editingId === t._id ? (
                    <button className="btn" onClick={() => saveEdit(t._id)}>Guardar</button>
                  ) : (
                    <button className="icon" title="Editar" onClick={() => startEdit(t)}>✏️</button>
                  )}
                  <button className="icon danger" title="Eliminar" onClick={() => removeTask(t._id)}>🗑️</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {showInvite && project && (
        <InviteModal project={project} onClose={() => setShowInvite(false)} />
      )}
      {profileUser && (
        <CollaboratorProfile user={profileUser} onClose={() => setProfileUser(null)} />
      )}
    </div>
  );
}