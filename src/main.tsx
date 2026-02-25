import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./routes/ProtectedRoute";

import "./index.css";


ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
).render(
  <React.StrictMode>
    <BrowserRouter>
    <Routes>
    {/* Públicas */}
    <Route path="/" element={<Login />} />
    <Route path="/register" element={<Register />} />
    {/*Privadas*/}
      <Route path="/dashboard" element={
         <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
    {/* Fallback */}
    <Route path="*" element={<Navigate to="/" replace />} />
    
    </Routes>
    </BrowserRouter>
  </React.StrictMode>
);