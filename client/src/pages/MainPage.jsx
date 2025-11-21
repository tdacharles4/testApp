import { useNavigate } from "react-router-dom";
import "./MainPage.css";

export default function MainPage({user}) {
  const navigate = useNavigate();

  return (
    <div className="main-container">


      <div className="button-grid">

        <button
          className="main-btn"
          disabled={!user}
          onClick={() => user && navigate("/registro")}
        >
          Registro
        </button>

        <button className="main-btn" onClick={() => navigate("/dashboard")}>
          Dashboard
        </button>

        <button className="main-btn" onClick={() => navigate("/historial")}>
          Historial
        </button>

        <button className="main-btn" onClick={() => navigate("/inventario")}>
          Inventario
        </button>

        {/*End Button Grid*/}
      </div>

        {/*End Main Container*/}
    </div>
  );
}