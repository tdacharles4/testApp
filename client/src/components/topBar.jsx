import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./TopBar.css";
import logo1 from "../assets/images/SgtTuco.png";
import logo2 from "../assets/images/WakandoCatalino.png";

export default function TopBar({ user, setUser }) {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredStores, setFilteredStores] = useState([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (user) {
      fetchStores();
    }
  }, [user]);

  const fetchStores = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/tiendas");
      const data = await response.json();
      setStores(data);
      setFilteredStores(data);
    } catch (error) {
      console.error("Error fetching stores:", error);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim() === "") {
      setFilteredStores(stores);
      setShowResults(false);
    } else {
      const filtered = stores.filter(store => 
        store.name.toLowerCase().includes(query.toLowerCase()) ||
        (store.tag && store.tag.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredStores(filtered);
      setShowResults(true);
    }
  };

  const handleStoreSelect = (store) => {
    console.log("Selected store:", store);
    setSearchQuery("");
    setShowResults(false);
    setFilteredStores(stores);

    navigate(`/${store.tag}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (filteredStores.length > 0) {
      handleStoreSelect(filteredStores[0]);
    }
  };

  const handleSearchBlur = () => {
    // Delay hiding results to allow for clicking on them
    setTimeout(() => setShowResults(false), 200);
  };

  const handleSearchFocus = () => {
    if (searchQuery && filteredStores.length > 0) {
      setShowResults(true);
    }
  };

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

      {/* Middle section with Logo2 AND Search Bar when logged in */}
      <div className="topbar-center">
        {/* Logo2 → clickable → returns to main page - Always visible */}
        <img
          src={logo2}
          alt="Logo2"
          className="logo2"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        />

        {/* Search Bar - Only shows when user is logged in */}
        {user && (
          <form onSubmit={handleSearchSubmit} className="search-form">
            <div className="search-container">
              <input
                type="text"
                placeholder="Buscar marca/tienda..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                className="search-input"
              />
              <button 
                type="submit" 
                className="search-button"
                disabled={filteredStores.length === 0}
              >
                Buscar
              </button>
            </div>
            
            {/* Dropdown results */}
            {showResults && searchQuery && filteredStores.length > 0 && (
              <div className="search-results">
                {filteredStores.slice(0, 5).map(store => (
                  <div 
                    key={store._id} 
                    className="search-result-item"
                    onClick={() => handleStoreSelect(store)}
                    onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
                  >
                    <div className="store-name">{store.name}</div>
                    <div className="store-tag">{store.tag}</div>
                  </div>
                ))}
                {filteredStores.length > 5 && (
                  <div className="search-result-more">
                    +{filteredStores.length - 5} más resultados
                  </div>
                )}
              </div>
            )}
            
            {showResults && searchQuery && filteredStores.length === 0 && (
              <div className="search-results">
                <div className="search-result-item no-results">
                  No se encontraron tiendas
                </div>
              </div>
            )}
          </form>
        )}
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