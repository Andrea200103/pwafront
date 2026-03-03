import { useState } from "react";
import { api } from "../api";

export default function InviteModal({ project, onClose }: any) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteLink, setInviteLink] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/invitations", {
        email,
        projectId: project._id,
      });
      setInviteLink(data.inviteLink);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al enviar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>Invitar a {project.name}</h2>
        {!inviteLink ? (
          <form className="form" onSubmit={handleSubmit}>
            <label>Correo del colaborador</label>
            <input
              type="email"
              placeholder="colaborador@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {error && <p className="alert">{error}</p>}
            <div className="modal-actions">
              <button type="button" className="btn ghost" onClick={onClose}>
                Cancelar
              </button>
              <button className="btn primary" disabled={loading}>
                {loading ? "Enviando…" : "Enviar invitación"}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <p>✅ Invitación creada para <strong>{email}</strong></p>
            <p className="muted">Comparte este enlace:</p>
            <input
              className="input-copy"
              readOnly
              value={inviteLink}
              onClick={(e) => {
                (e.target as HTMLInputElement).select();
                navigator.clipboard.writeText(inviteLink);
              }}
            />
            <p className="muted" style={{ fontSize: 12 }}>Click para copiar</p>
            <button className="btn primary" onClick={onClose}>
              Listo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}