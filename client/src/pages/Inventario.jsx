import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Inventario = ({ user }) => {
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingQuantity, setEditingQuantity] = useState(false);
  const [tempQuantity, setTempQuantity] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/api/tiendas")
      .then((res) => res.json())
      .then((data) => {
        setStores(data);
        setFilteredStores(data);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    const filtered = stores.filter(store =>
      store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.tag.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStores(filtered);
  }, [searchTerm, stores]);

  const toggleExpand = (id) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const closePreview = () => {
    setSelectedProduct(null);
  };

  const handleStoreClick = (store) => {
    const storeIdentifier = store.tag;
    navigate(`/${storeIdentifier}`);
  };

  const calculateTotalItems = (store) => {
    if (!store.products) return 0;
    return store.products.reduce((total, product) => total + product.quantity, 0);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ 
          margin: "0 0 10px 0", 
          color: "#333",
          fontSize: "28px",
          fontWeight: "bold"
        }}>
          Inventario General
        </h1>
        <p style={{ color: "#666", margin: 0 }}>
          Gestiona y visualiza el inventario de todas las tiendas
        </p>
      </div>

      {/* Search Bar */}
      <div style={{
        background: "white",
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "20px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "20px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontWeight: "bold", color: "#333", minWidth: "120px" }}>
            Buscar Tienda:
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre o clave de tienda..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              fontSize: "16px"
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              style={{
                background: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                padding: "8px 12px",
                cursor: "pointer"
              }}
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: "20px" }}>
        {/* LEFT PANEL FOR PRODUCT PREVIEW */}
        {selectedProduct && (
          <div style={{
            width: "350px",
            background: "white",
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "20px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            height: "fit-content",
            position: "sticky",
            top: "20px"
          }}>
            {/* CLOSE BUTTON */}
            <button
              onClick={closePreview}
              style={{
                position: "absolute",
                top: "12px",
                left: "12px",
                background: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                padding: "4px 8px",
                fontSize: "12px"
              }}
            >
              X
            </button>

            <h3 style={{ 
              margin: "30px 0 15px 0", 
              color: "#333",
              fontSize: "20px",
              textAlign: "center"
            }}>
              {selectedProduct.name}
            </h3>

            <img
              src={`http://localhost:5000${selectedProduct.imageUrl}`}
              alt="producto"
              style={{
                width: "100%",
                borderRadius: "8px",
                marginBottom: "15px"
              }}
            />

            {/* PRODUCT DETAILS */}
            <div style={{
              background: "#f8f9fa",
              border: "1px solid #e9ecef",
              borderRadius: "6px",
              padding: "15px",
              marginBottom: "15px"
            }}>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between",
                marginBottom: "8px"
              }}>
                <strong>Clave:</strong>
                <span>{selectedProduct.clave}</span>
              </div>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between",
                marginBottom: "8px"
              }}>
                <strong>Precio:</strong>
                <span style={{ fontWeight: "bold", color: "#28a745" }}>
                  ${selectedProduct.price?.toFixed(2) || "0.00"}
                </span>
              </div>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between",
                marginBottom: "8px"
              }}>
                <strong>Cantidad:</strong>
                <span style={{ 
                  fontWeight: "bold",
                  color: selectedProduct.quantity === 0 ? "#dc3545" : "#28a745"
                }}>
                  {editingQuantity ? tempQuantity : selectedProduct.quantity}
                </span>
              </div>
            </div>

            {/* ADMIN-ONLY CONTROLS */}
            {user?.role === "admin" && (
              <div style={{ borderTop: "2px solid #f0f0f0", paddingTop: "15px" }}>
                {!editingQuantity ? (
                  <button
                    style={{
                      width: "100%",
                      background: "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      padding: "10px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "bold"
                    }}
                    onClick={() => {
                      setEditingQuantity(true);
                      setTempQuantity(selectedProduct.quantity);
                    }}
                  >
                    Editar Cantidad
                  </button>
                ) : (
                  <>
                    <div style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center",
                      marginBottom: "15px"
                    }}>
                      <button
                        style={{
                          background: "#6c757d",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          padding: "8px 15px",
                          cursor: "pointer",
                          fontSize: "18px",
                          fontWeight: "bold"
                        }}
                        onClick={() => setTempQuantity(q => Math.max(0, q - 1))}
                      >
                        -
                      </button>
                      
                      <span style={{ 
                        fontSize: "18px", 
                        fontWeight: "bold",
                        color: "#333"
                      }}>
                        {tempQuantity}
                      </span>
                      
                      <button
                        style={{
                          background: "#6c757d",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          padding: "8px 15px",
                          cursor: "pointer",
                          fontSize: "18px",
                          fontWeight: "bold"
                        }}
                        onClick={() => setTempQuantity(q => q + 1)}
                      >
                        +
                      </button>
                    </div>
                    
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        style={{
                          flex: 1,
                          background: "#28a745",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          padding: "10px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "bold"
                        }}
                        onClick={() => {
                          selectedProduct.quantity = tempQuantity;
                          setEditingQuantity(false);
                        }}
                      >
                        Guardar
                      </button>
                      
                      <button
                        style={{
                          flex: 1,
                          background: "#6c757d",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          padding: "10px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "bold"
                        }}
                        onClick={() => setEditingQuantity(false)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* INVENTORY TABLE */}
        <div style={{ flexGrow: 1 }}>
          <div style={{
            background: "white",
            border: "1px solid #ddd",
            borderRadius: "8px",
            overflow: "hidden",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}>
            <table style={{ 
              width: "100%", 
              borderCollapse: "collapse",
              minWidth: "600px"
            }}>
              <thead>
                <tr style={{ background: "#f8f9fa" }}>
                  <th style={{ 
                    padding: "15px", 
                    textAlign: "left", 
                    borderBottom: "2px solid #ddd",
                    fontWeight: "bold",
                    color: "#333"
                  }}>
                    Tienda
                  </th>
                  <th style={{ 
                    padding: "15px", 
                    textAlign: "center", 
                    borderBottom: "2px solid #ddd",
                    fontWeight: "bold",
                    color: "#333"
                  }}>
                    Productos
                  </th>
                  <th style={{ 
                    padding: "15px", 
                    textAlign: "center", 
                    borderBottom: "2px solid #ddd",
                    fontWeight: "bold",
                    color: "#333"
                  }}>
                    Items en Stock
                  </th>
                  <th style={{ 
                    padding: "15px", 
                    textAlign: "center", 
                    borderBottom: "2px solid #ddd",
                    fontWeight: "bold",
                    color: "#333"
                  }}>
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredStores.map((store, index) => (
                  <React.Fragment key={store._id}>
                    <tr style={{ 
                      borderBottom: "1px solid #eee",
                      backgroundColor: index % 2 === 0 ? "#fafafa" : "white"
                    }}>
                      <td style={{ padding: "15px" }}>
                        <span 
                          style={{
                            cursor: "pointer",
                            color: "#007bff",
                            fontWeight: "bold",
                            fontSize: "16px"
                          }}
                          onClick={() => handleStoreClick(store)}
                          onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                          onMouseLeave={(e) => e.target.style.textDecoration = "none"}
                        >
                          {store.name}
                        </span>
                        <div style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>
                          Clave: {store.tag}
                        </div>
                      </td>
                      <td style={{ padding: "15px", textAlign: "center", fontWeight: "bold" }}>
                        {store.products?.length || 0}
                      </td>
                      <td style={{ padding: "15px", textAlign: "center", fontWeight: "bold" }}>
                        {calculateTotalItems(store)}
                      </td>
                      <td style={{ padding: "15px", textAlign: "center" }}>
                        <button
                          onClick={() => toggleExpand(store._id)}
                          style={{
                            background: expanded[store._id] ? "#6c757d" : "#007bff",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            padding: "8px 16px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "bold"
                          }}
                        >
                          {expanded[store._id] ? "Ocultar" : "Expandir"}
                        </button>
                      </td>
                    </tr>

                    {expanded[store._id] && (
                      <tr>
                        <td colSpan="4" style={{ padding: "0" }}>
                          <div style={{ 
                            background: "#f8f9fa", 
                            padding: "20px",
                            borderBottom: "1px solid #ddd"
                          }}>
                            <h4 style={{ 
                              margin: "0 0 15px 0", 
                              color: "#333",
                              fontSize: "16px"
                            }}>
                              Productos en {store.name}:
                            </h4>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                              {store.products.map((p, index) => (
                                <div
                                  key={index}
                                  style={{
                                    cursor: "pointer",
                                    background: "white",
                                    border: "1px solid #ddd",
                                    borderRadius: "6px",
                                    padding: "12px",
                                    minWidth: "150px",
                                    transition: "all 0.2s ease",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                                  }}
                                  onClick={() => setSelectedProduct(p)}
                                  onMouseEnter={(e) => {
                                    e.target.style.background = "#007bff";
                                    e.target.style.color = "white";
                                    e.target.style.transform = "translateY(-2px)";
                                    e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.background = "white";
                                    e.target.style.color = "inherit";
                                    e.target.style.transform = "translateY(0)";
                                    e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
                                  }}
                                >
                                  <div style={{ 
                                    fontWeight: "bold",
                                    fontSize: "14px",
                                    marginBottom: "4px"
                                  }}>
                                    {p.name}
                                  </div>
                                  <div style={{ 
                                    fontSize: "12px", 
                                    color: "#666",
                                    opacity: 0.7
                                  }}>
                                    {p.clave}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {filteredStores.length === 0 && (
              <div style={{ 
                padding: "40px", 
                textAlign: "center", 
                color: "#666",
                background: "white"
              }}>
                {searchTerm ? "No se encontraron tiendas que coincidan con la búsqueda." : "No hay tiendas registradas."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventario;