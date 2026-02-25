import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setAuth } from "../api";
import logo from "../assets/logo.png";

export default function Register() {

  const nav = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try{
      const { data } = await api.post ("auth/register", {name, email, password});
      localStorage.setItem("token", data.token);
      setAuth(data.token);
      nav("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al registrar usuario");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="card">
        <div className="brand">
          <img src={logo} alt="Logo" className="logo-img" />
          <h2>TO-DO PWA</h2>
          <p className="muted">Crea una cuenta para comenzar</p>
        </div>

        <form className="form" onSubmit={onSubmit}>
          <label>Nombre</label>
          <input
            type="text"
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label>Email</label>
          <input
            type="email"
            placeholder="tucorreo@dominio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Contraseña</label>
          <div className="pass">
            <input
              type={show ? "text" : "password"}
              placeholder="Crea una contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="ghost"
              onClick={() => setShow((s) => !s)}
              aria-label="Mostrar/Ocultar contraseña"
            />
          </div>

          <label>Confirmar contraseña</label>
          <input
            type={show ? "text" : "password"}
            placeholder="Repite tu contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {error && <p className="alert">{error}</p>}

          <button className="btn primary" disabled={loading}>
            {loading ? "Creando cuenta..." : "Registrarse"}
          </button>
        </form>

        <div className="footer-links">
          <span className="muted">¿Ya tienes cuenta?</span>
          <Link to="/">Inicia sesión</Link>
        </div>
      </div>
    </div>
  );
}
