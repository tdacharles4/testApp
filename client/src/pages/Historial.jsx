import React, { useEffect, useState } from "react";

const Historial = ({ user }) => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedMonto, setExpandedMonto] = useState({});
  const [expandedDescuento, setExpandedDescuento] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

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

  const toggleExpandMonto = (id) => {
    setExpandedMonto(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleExpandDescuento = (id) => {
    setExpandedDescuento(prev => ({
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

  const handleDeleteSale = async (ventaId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/ventas/${ventaId}`, {
        method: 'DELETE',
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (response.ok) {
        // Remove the sale from the local state
        setVentas(prev => prev.filter(venta => venta._id !== ventaId));
        alert("Venta eliminada exitosamente");
      } else {
        alert("Error al eliminar la venta");
      }
    } catch (error) {
      console.error("Error deleting sale:", error);
      alert("Error al eliminar la venta");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const confirmDelete = (venta) => {
    setDeleteConfirm(venta);
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  // Check if user is admin (you might want to adjust this based on your user structure)
  const isAdmin = user?.role === 'admin' || user?.isAdmin;

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
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        position: "relative"
      }}>
        <div style={{ 
          padding: "20px", 
          background: "#f8f9fa",
          borderBottom: "1px solid #ddd",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <h2 style={{ margin: 0, color: "#333" }}>
            Total de Ventas: {ventas.length}
          </h2>
          
          {isAdmin && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {editMode && (
                <span style={{ 
                  color: "#dc3545", 
                  fontSize: "14px", 
                  fontWeight: "bold",
                  padding: "4px 8px",
                  background: "#ffe6e6",
                  borderRadius: "4px"
                }}>
                  Modo Edición Activado
                </span>
              )}
              <button
                onClick={() => setEditMode(!editMode)}
                style={{
                  background: editMode ? "#dc3545" : "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 16px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px"
                }}
              >
                {editMode ? "✕ Cancelar" : "✏️ Editar"}
              </button>
            </div>
          )}
        </div>

        {ventas.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ 
              width: "100%", 
              borderCollapse: "collapse",
              minWidth: editMode ? "900px" : "800px"
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
                  {editMode && (
                    <th style={{ 
                      padding: "12px", 
                      textAlign: "center", 
                      borderBottom: "1px solid #ddd",
                      fontWeight: "bold",
                      width: "100px"
                    }}>
                      Acciones
                    </th>
                  )}
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
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px" }}>
                          <div>
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
                          </div>
                          <button
                            onClick={() => toggleExpandMonto(venta._id)}
                            style={{
                              background: expandedMonto[venta._id] ? "#6c757d" : "#007bff",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              padding: "4px 8px",
                              cursor: "pointer",
                              fontSize: "10px",
                              fontWeight: "bold",
                              minWidth: "60px"
                            }}
                          >
                            {expandedMonto[venta._id] ? "Ocultar" : "Expandir"}
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
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
                          {venta.discountType && venta.discountType !== "none" && (
                            <button
                              onClick={() => toggleExpandDescuento(venta._id)}
                              style={{
                                background: expandedDescuento[venta._id] ? "#6c757d" : "#dc3545",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                padding: "4px 8px",
                                cursor: "pointer",
                                fontSize: "10px",
                                fontWeight: "bold",
                                minWidth: "60px"
                              }}
                            >
                              {expandedDescuento[venta._id] ? "Ocultar" : "Expandir"}
                            </button>
                          )}
                        </div>
                      </td>
                      {editMode && (
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          <button
                            onClick={() => confirmDelete(venta)}
                            style={{
                              background: "#dc3545",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              padding: "6px 12px",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "bold",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                            title="Eliminar venta"
                          >
                            🗑️ Eliminar
                          </button>
                        </td>
                      )}
                    </tr>

                    {/* Expanded Payment Methods Details */}
                    {expandedMonto[venta._id] && (
                      <tr>
                        <td colSpan={editMode ? "7" : "6"} style={{ padding: "0" }}>
                          <div style={{ 
                            background: "#e7f3ff", 
                            padding: "15px",
                            borderBottom: "1px solid #b3d9ff"
                          }}>
                            <h4 style={{ 
                              margin: "0 0 10px 0", 
                              color: "#0066cc",
                              fontSize: "16px"
                            }}>
                              Detalles de Formas de Pago
                            </h4>
                            <div style={{ 
                              display: "grid", 
                              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
                              gap: "15px"
                            }}>
                              <div>
                                <strong>Distribución de Pagos:</strong>
                                <div style={{ 
                                  padding: "12px", 
                                  background: "white", 
                                  borderRadius: "6px",
                                  marginTop: "8px",
                                  border: "1px solid #b3d9ff"
                                }}>
                                  {venta.amountEfectivo > 0 && (
                                    <div style={{ 
                                      display: "flex", 
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      marginBottom: "8px",
                                      paddingBottom: "8px",
                                      borderBottom: "1px solid #f1f1f1"
                                    }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <div style={{
                                          width: "12px",
                                          height: "12px",
                                          borderRadius: "50%",
                                          backgroundColor: "#28a745"
                                        }}></div>
                                        <span>Efectivo:</span>
                                      </div>
                                      <span style={{ fontWeight: "bold", color: "#28a745" }}>
                                        {formatCurrency(venta.amountEfectivo)}
                                      </span>
                                    </div>
                                  )}
                                  {venta.amountTarjeta > 0 && (
                                    <div style={{ 
                                      display: "flex", 
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      marginBottom: "8px",
                                      paddingBottom: "8px",
                                      borderBottom: "1px solid #f1f1f1"
                                    }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <div style={{
                                          width: "12px",
                                          height: "12px",
                                          borderRadius: "50%",
                                          backgroundColor: "#007bff"
                                        }}></div>
                                        <span>Tarjeta:</span>
                                      </div>
                                      <span style={{ fontWeight: "bold", color: "#007bff" }}>
                                        {formatCurrency(venta.amountTarjeta)}
                                      </span>
                                    </div>
                                  )}
                                  {venta.amountTransferencia > 0 && (
                                    <div style={{ 
                                      display: "flex", 
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      marginBottom: "8px",
                                      paddingBottom: "8px",
                                      borderBottom: "1px solid #f1f1f1"
                                    }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <div style={{
                                          width: "12px",
                                          height: "12px",
                                          borderRadius: "50%",
                                          backgroundColor: "#6f42c1"
                                        }}></div>
                                        <span>Transferencia:</span>
                                      </div>
                                      <span style={{ fontWeight: "bold", color: "#6f42c1" }}>
                                        {formatCurrency(venta.amountTransferencia)}
                                      </span>
                                    </div>
                                  )}
                                  <div style={{ 
                                    display: "flex", 
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginTop: "8px",
                                    paddingTop: "8px",
                                    borderTop: "2px solid #dee2e6",
                                    fontWeight: "bold",
                                    fontSize: "16px"
                                  }}>
                                    <span>Total:</span>
                                    <span style={{ color: "#28a745" }}>{formatCurrency(venta.amount)}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <strong>Resumen:</strong>
                                <div style={{ 
                                  padding: "12px", 
                                  background: "white", 
                                  borderRadius: "6px",
                                  marginTop: "8px",
                                  border: "1px solid #b3d9ff"
                                }}>
                                  <div style={{ marginBottom: "6px" }}>
                                    <strong>Métodos utilizados:</strong> {[
                                      venta.amountEfectivo > 0 && "Efectivo",
                                      venta.amountTarjeta > 0 && "Tarjeta", 
                                      venta.amountTransferencia > 0 && "Transferencia"
                                    ].filter(Boolean).join(", ")}
                                  </div>
                                  <div>
                                    <strong>Total métodos:</strong> {
                                      [venta.amountEfectivo, venta.amountTarjeta, venta.amountTransferencia]
                                        .filter(amount => amount > 0).length
                                    }
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Expanded Discount Details */}
                    {expandedDescuento[venta._id] && venta.discountType && venta.discountType !== "none" && (
                      <tr>
                        <td colSpan={editMode ? "7" : "6"} style={{ padding: "0" }}>
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "white",
            borderRadius: "8px",
            padding: "30px",
            width: "90%",
            maxWidth: "500px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
          }}>
            <h2 style={{ 
              margin: "0 0 20px 0", 
              color: "#dc3545",
              fontSize: "24px",
              textAlign: "center"
            }}>
              Confirmar Eliminación
            </h2>

            <div style={{ 
              background: "#f8f9fa", 
              borderRadius: "6px", 
              padding: "20px",
              marginBottom: "20px"
            }}>
              <p style={{ margin: "0 0 15px 0", fontWeight: "bold" }}>
                ¿Estás seguro de que deseas eliminar esta venta?
              </p>
              
              <div style={{ 
                background: "#ffe6e6", 
                borderRadius: "4px", 
                padding: "15px",
                border: "1px solid #dc3545"
              }}>
                <div style={{ marginBottom: "8px" }}>
                  <strong>Fecha:</strong> {deleteConfirm.date}
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <strong>Producto:</strong> {deleteConfirm.item}
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <strong>Tienda:</strong> {deleteConfirm.store}
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <strong>Monto:</strong> {formatCurrency(deleteConfirm.amount)}
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <strong>Usuario:</strong> {deleteConfirm.user?.name || deleteConfirm.user?.username || "Usuario"}
                </div>
              </div>
              
              <p style={{ margin: "15px 0 0 0", color: "#dc3545", fontSize: "14px", fontWeight: "bold" }}>
                ⚠️ Esta acción no se puede deshacer
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: "15px" }}>
              <button
                style={{
                  flex: 1,
                  background: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "12px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold"
                }}
                onClick={() => handleDeleteSale(deleteConfirm._id)}
              >
                Sí, Eliminar
              </button>
              <button
                style={{
                  flex: 1,
                  background: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "12px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold"
                }}
                onClick={cancelDelete}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

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