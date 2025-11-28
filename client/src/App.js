import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
import MainPage from "./pages/MainPage.jsx";
import Login from "./pages/Login.jsx";
import Entrada from "./pages/Entrada.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Historial from "./pages/Historial.jsx";
import Inventario from "./pages/Inventario.jsx";
import CrearTienda from "./pages/CrearTienda.jsx";
import TiendaProfile from "./pages/TiendaProfile.jsx"; // Add this import

// Components
import TopBar from "./components/TopBar.jsx";
import RequireAdmin from "./components/RequireAdmin.jsx";

import './App.css';

function App() {
  const [user, setUser] = useState(null);

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

              <Route path="/" element={<MainPage user={user} />} />

              <Route
                path="/login"
                element={<Login user={user} setUser={setUser} />}
              />

              <Route
                path="/registroEntrada"
                element={<Entrada user={user} />}
              />

              <Route
                path="/dashboard"
                element={<Dashboard user={user} />}
              />

              <Route
                path="/historial"
                element={<Historial user={user} />}
              />

              <Route
                path="/inventario"
                element={<Inventario user={user} />}
              />

              <Route
                path="/crearTienda"
                element={
                  <RequireAdmin user={user}>
                    <CrearTienda user={user} />
                  </RequireAdmin>
                }
              />

              {/* Add the new store profile route */}
              <Route
                path="/:storeName"
                element={<TiendaProfile user={user} />}
              />

            </Routes>
          </div>
        </div>
      </>
    </BrowserRouter>
  );
}

export default App;