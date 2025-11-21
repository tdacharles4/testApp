import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
import MainPage from "./pages/MainPage.jsx";
import Login from "./pages/Login.jsx";
import Registro from "./pages/Registro.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Historial from "./pages/Historial.jsx";
import Inventario from "./pages/Inventario.jsx";

// Components
import TopBar from "./components/TopBar.jsx";

//import logo from './logo.svg';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  return (
    <BrowserRouter>
    <>
      <TopBar user={user} setUser={setUser}/>

      <div style={{ marginTop: "85px" }}>
        <Routes>
          <Route path="/" element={<MainPage user={user} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/historial" element={<Historial />} />
          <Route path="/inventario" element={<Inventario />} />
        </Routes>
      </div>
    </>
  </BrowserRouter>
  );
}

export default App;
