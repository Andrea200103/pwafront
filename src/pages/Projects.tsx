import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setAuth } from "../api";

interface Project {
  _id: string;
  name: string;
  owner: { _id: string; name: string };
  members: { _id: string; name: string; email: string }[];
}

export default function Projects() {
  const nav = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setAuth(localStorage.getItem("token"));
    api.get("/projects").then(({ data }) => setProjects(data.projects));
  }, []);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post("/projects", { name: name.trim() });
      setProjects((p) => [...p, data.project]);
      setName("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al crear");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    window.location.href = "/";
  }

  return (
    <div className="wrap">
      <header className="topbar">
        <h1>Mis Proyectos</h1>
        <button className="btn danger" onClick={logout}>Salir</button>
      </header>

      <main>
        <form className="add add-grid" onSubmit={createProject}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del nuevo proyecto…"
          />
          {error && <p className="alert">{error}</p>}
          <button className="btn" disabled={loading}>
            {loading ? "Creando…" : "Crear proyecto"}
          </button>
        </form>

        {/* Tareas personales */}
        <div className="project-card personal" onClick={() => nav("/dashboard")}>
          <span>📋</span>
          <div>
            <strong>Mis tareas personales</strong>
            <p className="muted">Sin proyecto asignado</p>
          </div>
        </div>

        {projects.map((p) => (
          <div key={p._id} className="project-card" onClick={() => nav(`/projects/${p._id}`)}>
            <span>📁</span>
            <div>
              <strong>{p.name}</strong>
              <p className="muted">{p.members?.length ?? 0} miembro(s)</p>
            </div>
            <div className="members-row">
              {(p.members ?? []).slice(0, 4).map((m) => (
                <span key={m._id} className="avatar-chip" title={m.name}>
                  {m.name?.slice(0, 2).toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        ))}

        {projects.length === 0 && (
          <p className="empty">No tienes proyectos aún. ¡Crea uno arriba!</p>
        )}
      </main>
    </div>
  );
}