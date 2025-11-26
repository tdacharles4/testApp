import React from "react";
import { useNavigate } from "react-router-dom";
import "./TopBar.css";
import logo1 from "../assets/images/SgtTuco.png";
import logo2 from "../assets/images/WakandoCatalino.png";


export default function TopBar({ user, setUser }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="topbar">
      
      {/* Logo1 (not clickable) */}
      <div className="topbar-left">
      <img src={logo1} alt="Logo1" className="logo1" />
    </div>

      {/* Logo2 → clickable → returns to main page */}
      <div className="topbar-center">
      <img
        src={logo2}
        alt="Logo2"
        className="logo2"
        onClick={() => navigate("/")}
        style={{ cursor: "pointer" }}
      />
    </div>

      {/* Right dropdown with currentUser */}
      <div className="right-side">
        {!user ? (
          <button className="login-btn" onClick={() => navigate("/login")}>
            Log In
          </button>
        ) : (
          <select
            className="user-dropdown"
            value={user.username}
            onChange={(e) => {
              if (e.target.value === "logout") handleLogout();
              if (e.target.value === "profile") navigate("/profile");
            }}
          >
            <option value={user.username}>
              {user.username}
            </option>
            <option value="profile">Profile</option>
            <option value="logout">Log Out</option>
          </select>
        )}
      </div>

      {/* End TopBar */}
    </div>
  );
}