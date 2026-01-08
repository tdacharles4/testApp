import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Pages
import MainPage from "./pages/MainPage.jsx";
import Login from "./pages/Login.jsx";
import Venta from "./pages/Venta.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Historial from "./pages/Historial.jsx";
import Inventario from "./pages/Inventario.jsx";
import CrearMarca from "./pages/CrearMarca.jsx";
import MarcaProfile from "./pages/MarcaProfile.jsx";
import Salida from "./pages/Salida.jsx";
import Marcas from "./pages/Marcas.jsx";
import CrearUsuario from "./pages/CrearUsuario.jsx";
import Corte from "./pages/Corte.jsx";

// Components
import TopBar from "./components/TopBar.jsx";
import RequireAdmin from "./components/RequireAdmin.jsx";

import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = "Estetica Unisex";
  }, []);

  // Check for existing user session on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  // Update localStorage when user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontSize: "18px",
        color: "#666"
      }}>
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <>
        <TopBar user={user} setUser={setUser} />

        {/* GLOBAL CENTERING WRAPPER */}
        <div
          style={{
            marginTop: "85px",
            display: "flex",
            justifyContent: "center",
            width: "100%",
          }}
        >
          {/* MAX WIDTH FOR ALL PAGES */}
          <div style={{ width: "100%"}}>
            <Routes>
              {/* Default route: redirect to login or main based on auth state */}
              <Route 
                path="/" 
                element={
                  user ? <Navigate to="/main" replace /> : <Navigate to="/login" replace />
                } 
              />

              {/* Login route */}
              <Route
                path="/login"
                element={
                  user ? (
                    <Navigate to="/main" replace />
                  ) : (
                    <Login user={user} setUser={setUser} />
                  )
                }
              />

              {/* Main page route - protected */}
              <Route
                path="/main"
                element={
                  user ? (
                    <MainPage user={user} />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />

              {/* Protected routes */}
              <Route
                path="/vender"
                element={
                  user ? <Venta user={user} /> : <Navigate to="/login" replace />
                }
              />

              <Route
                path="/salidas"
                element={
                  user ? <Salida user={user} /> : <Navigate to="/login" replace />
                }
              />

              <Route
                path="/corte"
                element={
                  user ? <Corte user={user} /> : <Navigate to="/login" replace />
                }
              />

              <Route
                path="/dashboard"
                element={
                  user ? <Dashboard user={user} /> : <Navigate to="/login" replace />
                }
              />

              <Route
                path="/marcas"
                element={
                  user ? <Marcas user={user} /> : <Navigate to="/login" replace />
                }
              />

              <Route
                path="/historial"
                element={
                  user ? <Historial user={user} /> : <Navigate to="/login" replace />
                }
              />

              <Route
                path="/inventario"
                element={
                  user ? <Inventario user={user} /> : <Navigate to="/login" replace />
                }
              />

              <Route
                path="/crearMarca"
                element={
                  user ? (
                    <RequireAdmin user={user}>
                      <CrearMarca user={user} />
                    </RequireAdmin>
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />

              <Route
                path="/crearUsuario"
                element={
                  user ? (
                    <RequireAdmin user={user}>
                      <CrearUsuario user={user} />
                    </RequireAdmin>
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />

              <Route
                path="/:storeName"
                element={
                  user ? <MarcaProfile user={user} /> : <Navigate to="/login" replace />
                }
              />
            </Routes>
            
          </div>
        </div>
      </>
    </BrowserRouter>
  );
}

export default App;