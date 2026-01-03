import React, { useState, useEffect, useCallback } from "react";

const Salida = ({ user }) => {
  const [exits, setExits] = useState([]);
  const [filteredExits, setFilteredExits] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({
    monto: "",
    concepto: "",
    pago: "",
    fecha: new Date().toISOString().split('T')[0],
    isToday: true
  });
  
  // Confirmation modal state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editMode, setEditMode] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    date: { startDate: "", endDate: "" },
    monto: { order: "desc" }, // "asc" or "desc"
    pago: { search: "" }
  });

  const isAdmin = user?.role === 'admin' || user?.isAdmin;

  useEffect(() => {
    fetchExits();
  }, []);

  const fetchExits = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/salidas");
      const data = await response.json();
      setExits(data);
      setFilteredExits(data);
    } catch (error) {
      console.error("Error fetching exits:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX');
  };

  // Apply all filters
  const applyFilters = useCallback(() => {
    let filtered = [...exits];

    // Date filter
    if (filters.date.startDate || filters.date.endDate) {
      filtered = filtered.filter(exit => {
        const exitDate = new Date(exit.fecha);
        const startDate = filters.date.startDate ? new Date(filters.date.startDate) : null;
        const endDate = filters.date.endDate ? new Date(filters.date.endDate) : null;

        if (startDate && endDate) {
          return exitDate >= startDate && exitDate <= endDate;
        } else if (startDate) {
          return exitDate >= startDate;
        } else if (endDate) {
          return exitDate <= endDate;
        }
        return true;
      });
    }

    // Pago search filter
    if (filters.pago.search) {
      filtered = filtered.filter(exit => 
        exit.pago.toLowerCase().includes(filters.pago.search.toLowerCase())
      );
    }

    // Monto sort
    filtered.sort((a, b) => {
      if (filters.monto.order === "asc") {
        return a.monto - b.monto;
      } else {
        return b.monto - a.monto;
      }
    });

    // Always sort by date (most recent first) as secondary sort
    filtered.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    setFilteredExits(filtered);
  }, [exits, filters]);

  // Run applyFilters when dependencies change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'isToday' && checked && { fecha: new Date().toISOString().split('T')[0] })
    }));
  };

  const handleDateChange = (e) => {
    setFormData(prev => ({
      ...prev,
      fecha: e.target.value,
      isToday: false
    }));
  };

  const validateForm = () => {
    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      alert("Por favor ingresa un monto válido");
      return false;
    }
    if (!formData.concepto.trim()) {
      alert("Por favor ingresa un concepto");
      return false;
    }
    if (!formData.pago.trim()) {
      alert("Por favor ingresa pago");
      return false;
    }
    if (!formData.fecha) {
      alert("Por favor selecciona una fecha");
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      setShowConfirmation(true);
    }
  };

  const confirmSubmit = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/salidas/crear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          monto: parseFloat(formData.monto),
          concepto: formData.concepto,
          pago: formData.pago,
          fecha: formData.fecha,
          user: user._id
        })
      });

      if (response.ok) {
        alert("Salida registrada exitosamente");
        setFormData({
          monto: "",
          concepto: "",
          pago: "",
          fecha: new Date().toISOString().split('T')[0],
          isToday: true
        });
        setShowConfirmation(false);
        fetchExits(); // Refresh the list
      } else {
        alert("Error al registrar la salida");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al registrar la salida");
    }
  };

  const handleDeleteExit = async (salidaId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/salidas/${salidaId}`, {
        method: 'DELETE',
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (response.ok) {
        setExits(prev => prev.filter(exit => exit._id !== salidaId));
        alert("Salida eliminada exitosamente");
      } else {
        alert("Error al eliminar la salida");
      }
    } catch (error) {
      console.error("Error deleting exit:", error);
      alert("Error al eliminar la salida");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const confirmDelete = (exit) => {
    setDeleteConfirm(exit);
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const updateDateFilter = (startDate, endDate) => {
    setFilters(prev => ({
      ...prev,
      date: { startDate, endDate }
    }));
  };

  const updateMontoFilter = (order) => {
    setFilters(prev => ({
      ...prev,
      monto: { order }
    }));
  };

  const updatePagoFilter = (search) => {
    setFilters(prev => ({
      ...prev,
      pago: { search }
    }));
  };

  if (loading) return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <div>Cargando salidas...</div>
    </div>
  );

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
          Registro de Salidas
        </h1>
        <p style={{ color: "#666", margin: 0 }}>
          Registro de salidas de dinero del sistema
        </p>
      </div>

      <div style={{ display: "flex", gap: "30px", minHeight: "600px" }}>
        {/* Left side - Table (2/3 width) */}
        <div style={{ flex: 2, display: "flex", flexDirection: "column" }}>
          <div style={{
            background: "white",
            border: "1px solid #ddd",
            borderRadius: "8px",
            overflow: "hidden",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            flex: 1,
            display: "flex",
            flexDirection: "column"
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
                Historial de Salidas ({filteredExits.length})
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
                    {editMode ? "✕ Cancelar" : "✏️ Editar Salidas"}
                  </button>
                </div>
              )}
            </div>

            {/* Filters */}
            <div style={{ 
              padding: "15px", 
              background: "#f8f9fa",
              borderBottom: "1px solid #ddd",
              display: "flex",
              gap: "15px",
              flexWrap: "wrap"
            }}>
              {/* Date Filter */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontWeight: "bold", fontSize: "14px" }}>Fecha:</span>
                <input
                  type="date"
                  value={filters.date.startDate}
                  onChange={(e) => updateDateFilter(e.target.value, filters.date.endDate)}
                  style={{ padding: "5px", fontSize: "12px", borderRadius: "4px", border: "1px solid #ccc" }}
                />
                <span>a</span>
                <input
                  type="date"
                  value={filters.date.endDate}
                  onChange={(e) => updateDateFilter(filters.date.startDate, e.target.value)}
                  style={{ padding: "5px", fontSize: "12px", borderRadius: "4px", border: "1px solid #ccc" }}
                />
                {(filters.date.startDate || filters.date.endDate) && (
                  <button
                    onClick={() => updateDateFilter("", "")}
                    style={{
                      background: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "5px 10px",
                      cursor: "pointer",
                      fontSize: "12px"
                    }}
                  >
                    Limpiar
                  </button>
                )}
              </div>

              {/* Monto Filter */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontWeight: "bold", fontSize: "14px" }}>Monto:</span>
                <button
                  onClick={() => updateMontoFilter(filters.monto.order === "asc" ? "desc" : "asc")}
                  style={{
                    background: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    padding: "5px 10px",
                    cursor: "pointer",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px"
                  }}
                >
                  {filters.monto.order === "asc" ? "↑ Asc" : "↓ Desc"}
                </button>
              </div>

              {/* Pago Filter */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontWeight: "bold", fontSize: "14px" }}>Pago:</span>
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={filters.pago.search}
                  onChange={(e) => updatePagoFilter(e.target.value)}
                  style={{ 
                    padding: "5px 10px", 
                    fontSize: "12px", 
                    borderRadius: "4px", 
                    border: "1px solid #ccc",
                    width: "200px"
                  }}
                />
                {filters.pago.search && (
                  <button
                    onClick={() => updatePagoFilter("")}
                    style={{
                      background: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "5px 10px",
                      cursor: "pointer",
                      fontSize: "12px"
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Table Container */}
            <div style={{ overflow: "auto", flex: 1 }}>
              {filteredExits.length > 0 ? (
                <table style={{ 
                  width: "100%", 
                  borderCollapse: "collapse",
                  minWidth: editMode ? "800px" : "700px"
                }}>
                  <thead>
                    <tr style={{ background: "#f8f9fa", position: "sticky", top: 0 }}>
                      <th style={{ 
                        padding: "12px", 
                        textAlign: "left", 
                        borderBottom: "1px solid #ddd",
                        fontWeight: "bold"
                      }}>
                        ID
                      </th>
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
                        textAlign: "right", 
                        borderBottom: "1px solid #ddd",
                        fontWeight: "bold"
                      }}>
                        Monto
                      </th>
                      <th style={{ 
                        padding: "12px", 
                        textAlign: "left", 
                        borderBottom: "1px solid #ddd",
                        fontWeight: "bold"
                      }}>
                        Concepto
                      </th>
                      <th style={{ 
                        padding: "12px", 
                        textAlign: "left", 
                        borderBottom: "1px solid #ddd",
                        fontWeight: "bold"
                      }}>
                        Pago
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
                    {filteredExits.map((exit, index) => (
                      <tr key={exit._id} style={{ 
                        borderBottom: "1px solid #eee",
                        backgroundColor: index % 2 === 0 ? "#fafafa" : "white"
                      }}>
                        <td style={{ padding: "12px", fontFamily: "monospace", fontWeight: "bold" }}>
                          {exit.salidaId}
                        </td>
                        <td style={{ padding: "12px" }}>
                          {formatDate(exit.fecha)}
                        </td>
                        <td style={{ padding: "12px", textAlign: "right", fontWeight: "bold", color: "#dc3545" }}>
                          {formatCurrency(exit.monto)}
                        </td>
                        <td style={{ padding: "12px" }}>
                          {exit.concepto}
                        </td>
                        <td style={{ padding: "12px" }}>
                          {exit.pago}
                        </td>
                        {editMode && (
                          <td style={{ padding: "12px", textAlign: "center" }}>
                            <button
                              onClick={() => confirmDelete(exit)}
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
                              title="Eliminar salida"
                            >
                              🗑️
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ 
                  padding: "40px", 
                  textAlign: "center", 
                  color: "#666"
                }}>
                  {exits.length === 0 ? "No hay salidas registradas en el sistema." : "No hay salidas que coincidan con los filtros aplicados."}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Form (1/3 width) */}
        <div style={{ flex: 1 }}>
          <div style={{
            background: "white",
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "25px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            height: "fit-content"
          }}>
            <h2 style={{ 
              margin: "0 0 20px 0", 
              color: "#333",
              fontSize: "20px",
              textAlign: "center"
            }}>
              Registrar Nueva Salida
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Monto */}
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontWeight: "bold",
                  color: "#333"
                }}>
                  Monto de Salida *
                </label>
                <input
                  type="number"
                  name="monto"
                  value={formData.monto}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    fontSize: "16px",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              {/* Concepto */}
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontWeight: "bold",
                  color: "#333"
                }}>
                  Concepto *
                </label>
                <textarea
                  name="concepto"
                  value={formData.concepto}
                  onChange={handleInputChange}
                  placeholder="Descripción de la salida..."
                  rows="3"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    resize: "vertical"
                  }}
                />
              </div>

              {/* Pago */}
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontWeight: "bold",
                  color: "#333"
                }}>
                  Pago *
                </label>
                <input
                  type="text"
                  name="pago"
                  value={formData.pago}
                  onChange={handleInputChange}
                  placeholder="Pago..."
                  maxLength="140"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box"
                  }}
                />
                <div style={{ 
                  fontSize: "12px", 
                  color: "#666", 
                  textAlign: "right",
                  marginTop: "5px"
                }}>
                  {formData.pago.length}/140 caracteres
                </div>
              </div>

              {/* Fecha */}
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontWeight: "bold",
                  color: "#333"
                }}>
                  Fecha *
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <input
                    type="checkbox"
                    name="isToday"
                    checked={formData.isToday}
                    onChange={handleInputChange}
                    style={{ width: "16px", height: "16px" }}
                  />
                  <span>La fecha de registro es hoy</span>
                </div>
                {!formData.isToday && (
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={handleDateChange}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                      fontSize: "14px",
                      boxSizing: "border-box"
                    }}
                  />
                )}
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={!user}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: user ? "#28a745" : "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: user ? "pointer" : "not-allowed",
                  marginTop: "10px"
                }}
              >
                {user ? "Registrar Salida" : "Inicia sesión para registrar"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
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
              color: "#333",
              fontSize: "24px",
              textAlign: "center"
            }}>
              Confirmar Salida
            </h2>

            <div style={{ 
              background: "#f8f9fa", 
              borderRadius: "6px", 
              padding: "20px",
              marginBottom: "20px"
            }}>
              <p style={{ margin: "0 0 15px 0", fontWeight: "bold", textAlign: "center" }}>
                ¿Estás seguro de que deseas registrar esta salida?
              </p>
              
              <div style={{ 
                background: "white", 
                borderRadius: "4px", 
                padding: "15px",
                border: "1px solid #dee2e6"
              }}>
                <div style={{ marginBottom: "10px" }}>
                  <strong>Monto:</strong> {formatCurrency(parseFloat(formData.monto))}
                </div>
                <div style={{ marginBottom: "10px" }}>
                  <strong>Concepto:</strong> {formData.concepto}
                </div>
                <div style={{ marginBottom: "10px" }}>
                  <strong>Pago:</strong> {formData.pago}
                </div>
                <div style={{ marginBottom: "10px" }}>
                  <strong>Fecha:</strong> {formatDate(formData.fecha)}
                </div>
                <div>
                  <strong>Registrado por:</strong> {user?.name || user?.username}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: "15px" }}>
              <button
                style={{
                  flex: 1,
                  background: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "12px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold"
                }}
                onClick={confirmSubmit}
              >
                Sí, Registrar
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
                onClick={() => setShowConfirmation(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

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
                ¿Estás seguro de que deseas eliminar esta salida?
              </p>
              
              <div style={{ 
                background: "#ffe6e6", 
                borderRadius: "4px", 
                padding: "15px",
                border: "1px solid #dc3545"
              }}>
                <div style={{ marginBottom: "8px" }}>
                  <strong>ID:</strong> {deleteConfirm.salidaId}
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <strong>Fecha:</strong> {formatDate(deleteConfirm.fecha)}
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <strong>Monto:</strong> {formatCurrency(deleteConfirm.monto)}
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <strong>Concepto:</strong> {deleteConfirm.concepto}
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <strong>Pago:</strong> {deleteConfirm.pago}
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
                onClick={() => handleDeleteExit(deleteConfirm._id)}
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
    </div>
  );
};

export default Salida;