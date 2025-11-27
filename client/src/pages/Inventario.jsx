import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Inventario = ({ user }) => {
  const [stores, setStores] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/api/tiendas")
      .then((res) => res.json())
      .then((data) => {
        setStores(data);
        
        // Flatten all products from all stores
        const products = data.flatMap(store => 
          store.products?.map(product => ({
            ...product,
            storeName: store.name,
            storeTag: store.tag,
            storeId: store._id,
            contractType: store.contractType,
            contractValue: store.contractValue
          })) || []
        );
        
        setAllProducts(products);
        setFilteredProducts(products);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    const filtered = allProducts.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.clave.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.storeName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchTerm, allProducts]);

  const closePreview = () => {
    setSelectedProduct(null);
  };

  const handleStoreClick = (storeTag) => {
    navigate(`/${storeTag}`);
  };

  const calculateParticipacion = (product) => {
    if (product.contractType === "Porcentaje" && product.contractValue) {
      return 100 - parseFloat(product.contractValue);
    }
    return 100; // For DCE, Estetica, Piso
  };

  const calculateTotalParticipante = (product, participacion) => {
    const price = parseFloat(product.price) || 0;
    return (price * participacion) / 100;
  };

  const calculateTotalEstetica = (product, totalParticipante) => {
    const price = parseFloat(product.price) || 0;
    return price - totalParticipante;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX');
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
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
          Vista global de todos los productos en todas las tiendas
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
            Buscar Producto:
          </span>
          <input
            type="text"
            placeholder="Buscar por producto, clave o tienda..."
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

            {selectedProduct.imageUrl && (
              <img
                src={`http://localhost:5000${selectedProduct.imageUrl}`}
                alt="producto"
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  marginBottom: "15px"
                }}
              />
            )}

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
                <strong>Tienda:</strong>
                <span 
                  style={{
                    cursor: "pointer",
                    color: "#007bff",
                    textDecoration: "underline"
                  }}
                  onClick={() => handleStoreClick(selectedProduct.storeTag)}
                >
                  {selectedProduct.storeName}
                </span>
              </div>
              {selectedProduct.description && (
                <div style={{ marginTop: "10px" }}>
                  <strong>Descripción:</strong>
                  <p style={{ 
                    margin: "5px 0 0 0", 
                    fontSize: "14px",
                    color: "#666",
                    lineHeight: "1.4"
                  }}>
                    {selectedProduct.description}
                  </p>
                </div>
              )}
            </div>
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
            <div style={{ overflowX: "auto" }}>
              <table style={{ 
                width: "100%", 
                borderCollapse: "collapse",
                minWidth: "1200px"
              }}>
                <thead>
                  <tr style={{ background: "#f8f9fa" }}>
                    <th style={{ 
                      padding: "12px", 
                      textAlign: "center", 
                      borderBottom: "2px solid #ddd",
                      fontWeight: "bold",
                      color: "#333"
                    }}>
                      Activo
                    </th>
                    <th style={{ 
                      padding: "12px", 
                      textAlign: "left", 
                      borderBottom: "2px solid #ddd",
                      fontWeight: "bold",
                      color: "#333"
                    }}>
                      Producto
                    </th>
                    <th style={{ 
                      padding: "12px", 
                      textAlign: "center", 
                      borderBottom: "2px solid #ddd",
                      fontWeight: "bold",
                      color: "#333"
                    }}>
                      Precio de Venta
                    </th>
                    <th style={{ 
                      padding: "12px", 
                      textAlign: "center", 
                      borderBottom: "2px solid #ddd",
                      fontWeight: "bold",
                      color: "#333"
                    }}>
                      % Participante
                    </th>
                    <th style={{ 
                      padding: "12px", 
                      textAlign: "center", 
                      borderBottom: "2px solid #ddd",
                      fontWeight: "bold",
                      color: "#333"
                    }}>
                      Total Participante
                    </th>
                    <th style={{ 
                      padding: "12px", 
                      textAlign: "center", 
                      borderBottom: "2px solid #ddd",
                      fontWeight: "bold",
                      color: "#333"
                    }}>
                      # de Piezas
                    </th>
                    <th style={{ 
                      padding: "12px", 
                      textAlign: "center", 
                      borderBottom: "2px solid #ddd",
                      fontWeight: "bold",
                      color: "#333"
                    }}>
                      Total Estetica
                    </th>
                    <th style={{ 
                      padding: "12px", 
                      textAlign: "center", 
                      borderBottom: "2px solid #ddd",
                      fontWeight: "bold",
                      color: "#333"
                    }}>
                      Fecha Recepción
                    </th>
                    <th style={{ 
                      padding: "12px", 
                      textAlign: "center", 
                      borderBottom: "2px solid #ddd",
                      fontWeight: "bold",
                      color: "#333"
                    }}>
                      Marca
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product, index) => {
                    const participacion = calculateParticipacion(product);
                    const totalParticipante = calculateTotalParticipante(product, participacion);
                    const totalEstetica = calculateTotalEstetica(product, totalParticipante);
                    const isActive = product.quantity > 0;
                    
                    return (
                      <tr key={`${product.storeId}-${product.clave}-${index}`} style={{ 
                        backgroundColor: index % 2 === 0 ? "#fafafa" : "white"
                      }}>
                        <td style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid #eee" }}>
                          <span
                            style={{
                              padding: "4px 8px",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: "bold",
                              backgroundColor: isActive ? "#d4edda" : "#f8d7da",
                              color: isActive ? "#155724" : "#721c24",
                              border: `1px solid ${isActive ? "#c3e6cb" : "#f5c6cb"}`
                            }}
                          >
                            {isActive ? "Sí" : "No"}
                          </span>
                        </td>
                        <td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
                          <span
                            style={{
                              cursor: "pointer",
                              color: "#007bff",
                              fontWeight: "bold",
                              textDecoration: "underline"
                            }}
                            onClick={() => setSelectedProduct(product)}
                          >
                            {product.name}
                          </span>
                          <div style={{ fontSize: "12px", color: "#666" }}>
                            {product.clave}
                          </div>
                        </td>
                        <td style={{ 
                          padding: "12px", 
                          textAlign: "center", 
                          borderBottom: "1px solid #eee", 
                          fontWeight: "bold", 
                          color: "#28a745" 
                        }}>
                          ${parseFloat(product.price || 0).toFixed(2)}
                        </td>
                        <td style={{ 
                          padding: "12px", 
                          textAlign: "center", 
                          borderBottom: "1px solid #eee", 
                          fontWeight: "bold" 
                        }}>
                          {participacion}%
                        </td>
                        <td style={{ 
                          padding: "12px", 
                          textAlign: "center", 
                          borderBottom: "1px solid #eee", 
                          fontWeight: "bold", 
                          color: "#007bff" 
                        }}>
                          ${totalParticipante.toFixed(2)}
                        </td>
                        <td style={{ 
                          padding: "12px", 
                          textAlign: "center", 
                          borderBottom: "1px solid #eee", 
                          fontWeight: "bold" 
                        }}>
                          {product.quantity}
                        </td>
                        <td style={{ 
                          padding: "12px", 
                          textAlign: "center", 
                          borderBottom: "1px solid #eee", 
                          fontWeight: "bold", 
                          color: "#6f42c1" 
                        }}>
                          ${totalEstetica.toFixed(2)}
                        </td>
                        <td style={{ 
                          padding: "12px", 
                          textAlign: "center", 
                          borderBottom: "1px solid #eee" 
                        }}>
                          {formatDate(product.fechaRecepcion)}
                        </td>
                        <td style={{ 
                          padding: "12px", 
                          textAlign: "center", 
                          borderBottom: "1px solid #eee" 
                        }}>
                          <span
                            style={{
                              cursor: "pointer",
                              color: "#007bff",
                              fontWeight: "bold",
                              textDecoration: "underline"
                            }}
                            onClick={() => handleStoreClick(product.storeTag)}
                            onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                            onMouseLeave={(e) => e.target.style.textDecoration = "underline"}
                          >
                            {product.storeName}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredProducts.length === 0 && (
              <div style={{ 
                padding: "40px", 
                textAlign: "center", 
                color: "#666",
                background: "white"
              }}>
                {searchTerm ? "No se encontraron productos que coincidan con la búsqueda." : "No hay productos registrados en el inventario."}
              </div>
            )}
          </div>

          {/* Summary Statistics */}
          {filteredProducts.length > 0 && (
            <div style={{
              marginTop: "20px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "15px"
            }}>
              <div style={{
                background: "white",
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "20px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                textAlign: "center"
              }}>
                <h3 style={{ margin: "0 0 10px 0", color: "#333", fontSize: "16px" }}>
                  Total Productos
                </h3>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#007bff" }}>
                  {filteredProducts.length}
                </div>
              </div>

              <div style={{
                background: "white",
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "20px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                textAlign: "center"
              }}>
                <h3 style={{ margin: "0 0 10px 0", color: "#333", fontSize: "16px" }}>
                  Productos Activos
                </h3>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#28a745" }}>
                  {filteredProducts.filter(p => p.quantity > 0).length}
                </div>
              </div>

              <div style={{
                background: "white",
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "20px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                textAlign: "center"
              }}>
                <h3 style={{ margin: "0 0 10px 0", color: "#333", fontSize: "16px" }}>
                  Total Tiendas
                </h3>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#6f42c1" }}>
                  {new Set(filteredProducts.map(p => p.storeId)).size}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inventario;