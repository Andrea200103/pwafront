import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import InviteAccept from "./pages/InviteAccept";

function Guard({ children }: { children: React.ReactNode }) {
  return localStorage.getItem("token") ? <>{children}</> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/invite/:token" element={<InviteAccept />} />
        <Route path="/projects" element={<Guard><Projects /></Guard>} />
        <Route path="/projects/:projectId" element={<Guard><Dashboard /></Guard>} />
        <Route path="/dashboard" element={<Guard><Dashboard /></Guard>} />
      </Routes>
    </BrowserRouter>
  )
};

