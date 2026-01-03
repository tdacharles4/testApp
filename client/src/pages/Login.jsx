import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function LoginPage({ setUser }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  async function handleLogin(e) {
  e.preventDefault();

  try {
    console.log("API_URL:", API_URL);
    console.log("Attempting login to:", `${API_URL}/api/login`);
    
    const res = await fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    console.log("Response status:", res.status);
    console.log("Response headers:", Object.fromEntries(res.headers.entries()));
    
    const data = await res.json();
    console.log("Response data:", data);

    if (!res.ok) {
      setError(data.message || "Error en login");
      return;
    }

    // ✅ Store token
    localStorage.setItem("token", data.token);

    // Store user in React state
    setUser(data.user);
    localStorage.setItem("user", JSON.stringify(data.user));
    navigate("/");
  } catch (err) {
    console.error("Full error:", err);
    console.error("Error message:", err.message);
    setError("No se pudo conectar al servidor");
  }
}

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2>Iniciar Sesión</h2>

        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="error">{error}</p>}

          <button type="submit">Entrar</button>
        </form>
      </div>
    </div>
  );
}