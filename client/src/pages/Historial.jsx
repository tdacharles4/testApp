import React, { useEffect, useState } from "react";

const Historial = ({ user }) => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState({});

  useEffect(() => {
    fetchVentas();
  }, []);

  const fetchVentas = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/ventas");
      const data = await response.json();
      setVentas(data);
    } catch (error) {
      console.error("Error fetching ventas:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  if (loading) return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <div>Cargando historial...</div>
    </div>
  );

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
          Historial de Ventas
        </h1>
        <p style={{ color: "#666", margin: 0 }}>
          Registro completo de todas las ventas realizadas en el sistema
        </p>
      </div>

      {/* Sales Table */}
      <div style={{
        background: "white",
        border: "1px solid #ddd",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <div style={{ 
          padding: "20px", 
          background: "#f8f9fa",
          borderBottom: "1px solid #ddd"
        }}>
          <h2 style={{ margin: 0, color: "#333" }}>
            Total de Ventas: {ventas.length}
          </h2>
        </div>

        {ventas.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ 
              width: "100%", 
              borderCollapse: "collapse",
              minWidth: "800px"
            }}>
              <thead>
                <tr style={{ background: "#f8f9fa" }}>
                  <th style={{ 
                    padding: "12px", 
                    textAlign: "left", 
                    borderBottom: "1px solid #ddd",
                    fontWeight: "bold"
                  }}>
                    Fecha
                  </th>
                  <th style={{ 
                    padding: "12px", 
                    textAlign: "left", 
                    borderBottom: "1px solid #ddd",
                    fontWeight: "bold"
                  }}>
                    Usuario
                  </th>
                  <th style={{ 
                    padding: "12px", 
                    textAlign: "left", 
                    borderBottom: "1px solid #ddd",
                    fontWeight: "bold"
                  }}>
                    Producto
                  </th>
                  <th style={{ 
                    padding: "12px", 
                    textAlign: "left", 
                    borderBottom: "1px solid #ddd",
                    fontWeight: "bold"
                  }}>
                    Tienda
                  </th>
                  <th style={{ 
                    padding: "12px", 
                    textAlign: "right", 
                    borderBottom: "1px solid #ddd",
                    fontWeight: "bold"
                  }}>
                    Monto
                  </th>
                  <th style={{ 
                    padding: "12px", 
                    textAlign: "center", 
                    borderBottom: "1px solid #ddd",
                    fontWeight: "bold"
                  }}>
                    Descuento
                  </th>
                  <th style={{ 
                    padding: "12px", 
                    textAlign: "center", 
                    borderBottom: "1px solid #ddd",
                    fontWeight: "bold"
                  }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((venta, index) => (
                  <React.Fragment key={venta._id}>
                    <tr style={{ 
                      borderBottom: "1px solid #eee",
                      backgroundColor: index % 2 === 0 ? "#fafafa" : "white"
                    }}>
                      <td style={{ padding: "12px" }}>
                        <div style={{ fontWeight: "bold" }}>
                          {venta.date}
                        </div>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div>
                          <div style={{ fontWeight: "bold" }}>
                            {venta.user?.name || venta.user?.username || "Usuario"}
                          </div>
                          <div style={{ fontSize: "12px", color: "#666" }}>
                            {venta.user?.email || ""}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div style={{ fontWeight: "bold" }}>
                          {venta.item}
                        </div>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div style={{ fontWeight: "bold" }}>
                          {venta.store}
                        </div>
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <div style={{ 
                          fontSize: "16px", 
                          fontWeight: "bold",
                          color: "#28a745"
                        }}>
                          {formatCurrency(venta.amount)}
                        </div>
                        {venta.originalPrice && (
                          <div style={{ 
                            fontSize: "12px", 
                            color: "#666",
                            textDecoration: "line-through"
                          }}>
                            {formatCurrency(venta.originalPrice)}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "bold",
                            backgroundColor: venta.discountType && venta.discountType !== "none" ? "#fff3cd" : "#e9ecef",
                            color: venta.discountType && venta.discountType !== "none" ? "#856404" : "#495057",
                            border: `1px solid ${venta.discountType && venta.discountType !== "none" ? "#ffeaa7" : "#dee2e6"}`
                          }}
                        >
                          {venta.discountType && venta.discountType !== "none" ? "SÍ" : "NO"}
                        </span>
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {venta.discountType && venta.discountType !== "none" && (
                          <button
                            onClick={() => toggleExpand(venta._id)}
                            style={{
                              background: expandedRows[venta._id] ? "#6c757d" : "#007bff",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              padding: "6px 12px",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "bold"
                            }}
                          >
                            {expandedRows[venta._id] ? "Ocultar" : "Detalles"}
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Expanded Discount Details */}
                    {expandedRows[venta._id] && venta.discountType && venta.discountType !== "none" && (
                      <tr>
                        <td colSpan="7" style={{ padding: "0" }}>
                          <div style={{ 
                            background: "#fff3cd", 
                            padding: "15px",
                            borderBottom: "1px solid #ffeaa7"
                          }}>
                            <h4 style={{ 
                              margin: "0 0 10px 0", 
                              color: "#856404",
                              fontSize: "16px"
                            }}>
                              Detalles del Descuento
                            </h4>
                            <div style={{ 
                              display: "grid", 
                              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
                              gap: "15px"
                            }}>
                              <div>
                                <strong>Tipo de Descuento:</strong>
                                <div style={{ 
                                  padding: "4px 8px", 
                                  background: "white", 
                                  borderRadius: "4px",
                                  marginTop: "4px",
                                  border: "1px solid #ffeaa7"
                                }}>
                                  {venta.discountType === "percentage" ? "Porcentaje" : 
                                   venta.discountType === "fixed" ? "Monto Fijo" : 
                                   venta.discountType}
                                </div>
                              </div>
                              
                              {venta.discountAmount > 0 && (
                                <div>
                                  <strong>Monto Descontado:</strong>
                                  <div style={{ 
                                    padding: "4px 8px", 
                                    background: "white", 
                                    borderRadius: "4px",
                                    marginTop: "4px",
                                    border: "1px solid #ffeaa7",
                                    color: "#dc3545",
                                    fontWeight: "bold"
                                  }}>
                                    {formatCurrency(venta.discountAmount)}
                                  </div>
                                </div>
                              )}
                              
                              {venta.discountPercentage > 0 && (
                                <div>
                                  <strong>Porcentaje Descontado:</strong>
                                  <div style={{ 
                                    padding: "4px 8px", 
                                    background: "white", 
                                    borderRadius: "4px",
                                    marginTop: "4px",
                                    border: "1px solid #ffeaa7",
                                    color: "#dc3545",
                                    fontWeight: "bold"
                                  }}>
                                    {venta.discountPercentage}%
                                  </div>
                                </div>
                              )}
                              
                              <div>
                                <strong>Precio Original:</strong>
                                <div style={{ 
                                  padding: "4px 8px", 
                                  background: "white", 
                                  borderRadius: "4px",
                                  marginTop: "4px",
                                  border: "1px solid #ffeaa7",
                                  textDecoration: "line-through"
                                }}>
                                  {formatCurrency(venta.originalPrice)}
                                </div>
                              </div>
                              
                              <div>
                                <strong>Precio Final:</strong>
                                <div style={{ 
                                  padding: "4px 8px", 
                                  background: "white", 
                                  borderRadius: "4px",
                                  marginTop: "4px",
                                  border: "1px solid #28a745",
                                  color: "#28a745",
                                  fontWeight: "bold"
                                }}>
                                  {formatCurrency(venta.amount)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ 
            padding: "40px", 
            textAlign: "center", 
            color: "#666",
            background: "white"
          }}>
            No hay ventas registradas en el sistema.
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      {ventas.length > 0 && (
        <div style={{
          marginTop: "20px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
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
              Ventas con Descuento
            </h3>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#007bff" }}>
              {ventas.filter(v => v.discountType && v.discountType !== "none").length}
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
              Total Recaudado
            </h3>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#28a745" }}>
              {formatCurrency(ventas.reduce((total, venta) => total + venta.amount, 0))}
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
              Total Descuentos
            </h3>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#dc3545" }}>
              {formatCurrency(ventas.reduce((total, venta) => total + (venta.discountAmount || 0), 0))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Historial;