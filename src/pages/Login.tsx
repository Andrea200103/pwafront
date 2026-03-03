import { useState } from "react";
import { Link } from "react-router-dom";
import { api, setAuth } from "../api";
import logo from '../assets/logo.png';

export default function Login() {
    
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const { data } = await api.post("/auth/login", { email, password });
            localStorage.setItem("token", data.token);
            setAuth(data.token);
            console.log("Login OK, redirigiendo...");
            window.location.href = "/projects";
        } catch (err: any) {
            setError(err.response?.data?.message || "Error al iniciar sesión");
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
                    <p className="muted">Bienvenido, Inicia sesión para continuar</p>
                </div>
                <form className="form" onSubmit={onSubmit}>
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
                            placeholder="Ingresa tu contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            className="ghost"
                            onClick={() => setShow((s) => !s)}
                            aria-label="Mostrar/ocultar contraseña"
                        />
                    </div>
                    {error && <p className="alert">{error}</p>}
                    <button className="btn primary" disabled={loading}>
                        {loading ? "Cargando..." : "Iniciar sesión"}
                    </button>
                </form>
                <div className="footer-links">
                    <span className="muted">¿No tienes cuenta?</span>
                    <Link to="/register">Crear una cuenta</Link>
                </div>
            </div>
        </div>
    );
}