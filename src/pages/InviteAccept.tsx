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
      window.location.href = "/";
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

  function handleRegister() {
    localStorage.setItem("pendingInvite", token!);
    window.location.href = "/register";
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
          <div style={{
            background: "#1a1a2e",
            border: "1px solid #2a2a3a",
            borderRadius: 10,
            padding: "16px 18px",
            marginTop: 16,
            marginBottom: 8,
          }}>
            <p style={{ margin: "0 0 6px", color: "#f0eeff", fontWeight: 600 }}>
              ¿Ya tienes cuenta?
            </p>
            <p style={{ margin: "0 0 14px", color: "#888", fontSize: 13 }}>
              Inicia sesión para aceptar la invitación.
            </p>
            <button className="btn primary" onClick={handleAccept} disabled={loading} style={{ width: "100%", marginBottom: 10 }}>
              Iniciar sesión →
            </button>

            <hr style={{ border: "none", borderTop: "1px solid #2a2a3a", margin: "12px 0" }} />

            <p style={{ margin: "0 0 6px", color: "#f0eeff", fontWeight: 600 }}>
              ¿No tienes cuenta?
            </p>
            <p style={{ margin: "0 0 14px", color: "#888", fontSize: 13 }}>
              Regístrate con el correo al que llegó la invitación:<br />
              <strong style={{ color: "#1f6feb" }}>{invitation.email}</strong>
            </p>
            <button
              className="btn"
              onClick={handleRegister}
              style={{ width: "100%", background: "#2a2a3a", color: "#f0eeff" }}
            >
              Crear cuenta →
            </button>
          </div>
        )}

        {isLoggedIn && (
          <>
            {error && <p className="alert">{error}</p>}
            <button className="btn primary" onClick={handleAccept} disabled={loading} style={{ width: "100%", marginTop: 16 }}>
              {loading ? "Procesando…" : "Aceptar y colaborar →"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}