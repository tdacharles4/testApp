import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Marcas({ user }) {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Use the full backend URL with port 5000
      const response = await fetch("http://localhost:5000/api/tiendas");
      
      // Check if response is OK
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setBrands(data);
    } catch (err) {
      console.error("Error fetching brands:", err);
      setError(err.message || "Error al cargar las marcas");
    } finally {
      setLoading(false);
    }
  };

  const handleBrandClick = (brand) => {
    // Navigate using the store tag instead of name for more reliable routing
    navigate(`/${brand.tag}`);
  };

  const formatContractType = (type) => {
    const contractTypes = {
      "DCE": "DCE",
      "Porcentaje": "Porcentaje",
      "Piso": "Piso",
      "Estetica Unisex": "Estética Unisex"
    };
    return contractTypes[type] || type;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ marginBottom: "30px", textAlign: "center" }}>
          <h1 style={{ margin: "0 0 10px 0", color: "#333", fontSize: "28px", fontWeight: "bold" }}>
            Listado de Marcas
          </h1>
        </div>
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          Cargando marcas...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ marginBottom: "30px", textAlign: "center" }}>
          <h1 style={{ margin: "0 0 10px 0", color: "#333", fontSize: "28px", fontWeight: "bold" }}>
            Listado de Marcas
          </h1>
        </div>
        <div style={{ 
          textAlign: "center", 
          padding: "40px", 
          color: "#dc3545",
          background: "#f8d7da",
          border: "1px solid #f5c6cb",
          borderRadius: "8px",
          margin: "20px 0"
        }}>
          <h3 style={{ margin: "0 0 15px 0" }}>Error al cargar marcas</h3>
          <p style={{ margin: "0 0 20px 0" }}>{error}</p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
            <button 
              onClick={fetchBrands}
              style={{
                background: "#007bff",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Reintentar
            </button>
            {user?.role === "admin" && (
              <button 
                onClick={() => navigate("/crearTienda")}
                style={{
                  background: "#28a745",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                Crear Primera Marca
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "30px", textAlign: "center" }}>
        <h1 style={{ 
          margin: "0 0 10px 0", 
          color: "#333",
          fontSize: "28px",
          fontWeight: "bold"
        }}>
          Listado de Marcas
        </h1>
        <p style={{ color: "#666", margin: 0, fontSize: "16px" }}>
          {brands.length} {brands.length === 1 ? 'marca' : 'marcas'} registradas
        </p>
      </div>

      <div style={{
        background: "white",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
        overflow: "hidden"
      }}>
        {brands.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ 
              width: "100%", 
              borderCollapse: "collapse",
              minWidth: "800px"
            }}>
              <thead>
                <tr style={{ background: "#f8f9fa" }}>
                  <th style={{ padding: "16px", textAlign: "left", borderBottom: "2px solid #e9ecef", fontWeight: "600", color: "#333" }}>
                    Tag
                  </th>
                  <th style={{ padding: "16px", textAlign: "left", borderBottom: "2px solid #e9ecef", fontWeight: "600", color: "#333" }}>
                    Nombre
                  </th>
                  <th style={{ padding: "16px", textAlign: "left", borderBottom: "2px solid #e9ecef", fontWeight: "600", color: "#333" }}>
                    Tipo de Contrato
                  </th>
                  <th style={{ padding: "16px", textAlign: "left", borderBottom: "2px solid #e9ecef", fontWeight: "600", color: "#333" }}>
                    Valor del Contrato
                  </th>
                  <th style={{ padding: "16px", textAlign: "center", borderBottom: "2px solid #e9ecef", fontWeight: "600", color: "#333" }}>
                    Productos
                  </th>
                  <th style={{ padding: "16px", textAlign: "left", borderBottom: "2px solid #e9ecef", fontWeight: "600", color: "#333" }}>
                    Contacto
                  </th>
                </tr>
              </thead>
              <tbody>
                {brands.map((brand, index) => (
                  <tr 
                    key={brand._id || index}
                    style={{ 
                      borderBottom: "1px solid #e9ecef",
                      backgroundColor: index % 2 === 0 ? "white" : "#fafafa",
                      cursor: "pointer",
                      transition: "background-color 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f8f9fa";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = index % 2 === 0 ? "white" : "#fafafa";
                    }}
                    onClick={() => handleBrandClick(brand)}
                  >
                    <td style={{ padding: "16px" }}>
                      <span style={{
                        backgroundColor: "#007bff",
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        display: "inline-block"
                      }}>
                        {brand.tag}
                      </span>
                    </td>
                    <td style={{ padding: "16px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <strong style={{ color: "#333", fontSize: "16px" }}>
                          {brand.name}
                        </strong>
                        {brand.description && (
                          <span style={{ color: "#666", fontSize: "0.85rem", lineHeight: "1.4" }}>
                            {brand.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "16px", fontWeight: "500" }}>
                      {formatContractType(brand.contractType)}
                    </td>
                    <td style={{ 
                      padding: "16px", 
                      fontFamily: "'Courier New', monospace", 
                      fontWeight: "600", 
                      color: "#28a745" 
                    }}>
                      {brand.contractValue ? formatCurrency(brand.contractValue) : "N/A"}
                    </td>
                    <td style={{ padding: "16px", textAlign: "center" }}>
                      <span style={{
                        backgroundColor: "#6c757d",
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        minWidth: "30px",
                        display: "inline-block"
                      }}>
                        {brand.products?.length || 0}
                      </span>
                    </td>
                    <td style={{ padding: "16px", color: "#666" }}>
                      {brand.contacto || "No especificado"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#666" }}>
            <p style={{ fontSize: "18px", marginBottom: "20px" }}>No hay marcas registradas aún.</p>
            {user?.role === "admin" && (
              <button 
                onClick={() => navigate("/crearMarca")}
                style={{
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold"
                }}
              >
                Crear Primera Marca
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}