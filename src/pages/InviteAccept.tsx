import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, setAuth } from "../api";
import logo from "../assets/logo.png";

export default function InviteAccept() {
  const { token } = useParams();
  const nav = useNavigate();
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isLoggedIn = !!localStorage.getItem("token");

  useEffect(() => {
    setAuth(localStorage.getItem("token"));
    api
      .get(`/invitations/${token}`)
      .then(({ data }) => setInvitation(data.invitation))
      .catch(() => setError("Invitación no válida o expirada"));
  }, [token]);

  async function handleAccept() {
   if (!isLoggedIn) {
  localStorage.setItem("pendingInvite", token!);
  window.location.href = "/";  // <- cambia nav() por window.location.href
  return;
}
    setLoading(true);
    try {
      const { data } = await api.post(`/invitations/${token}/accept`);
      nav(`/projects/${data.project._id}?newMember=true`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al aceptar");
    } finally {
      setLoading(false);
    }
  }

  if (error)
    return (
      <div className="auth-wrap">
        <div className="card">
          <p className="alert">{error}</p>
          <a href="/">Ir al inicio</a>
        </div>
      </div>
    );

  if (!invitation)
    return (
      <div className="auth-wrap">
        <p>Cargando…</p>
      </div>
    );

  return (
    <div className="auth-wrap">
      <div className="card">
        <div className="brand">
          <img src={logo} alt="Logo" className="logo-img" />
          <h2>TO-DO PWA</h2>
        </div>
        <p>Te han invitado a colaborar en:</p>
        <div className="project-highlight">
          <strong>{invitation.project.name}</strong>
          <p className="muted">Invitado por {invitation.invitedBy.name}</p>
        </div>
        {!isLoggedIn && (
          <p className="muted">Necesitas iniciar sesión para aceptar.</p>
        )}
        {error && <p className="alert">{error}</p>}
        <button className="btn primary" onClick={handleAccept} disabled={loading}>
          {loading
            ? "Procesando…"
            : isLoggedIn
            ? "Aceptar y colaborar →"
            : "Iniciar sesión para aceptar"}
        </button>
      </div>
    </div>
  );
}