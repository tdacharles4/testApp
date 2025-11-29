import React, { useEffect, useState } from "react";

const Historial = ({ user }) => {
  const [ventas, setVentas] = useState([]);
  const [filteredVentas, setFilteredVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPagos, setExpandedPagos] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    date: { active: false, startDate: "", endDate: "" },
    codigo: { active: false, selected: [] },
    marca: { active: false, selected: [] },
    tipoPago: { active: false, selected: [] },
    contrato: { active: false, selected: [] },
    registra: { active: false, selected: [] } // New filter for registra
  });

  const [showFilter, setShowFilter] = useState({
    date: false,
    codigo: false,
    marca: false,
    tipoPago: false,
    contrato: false,
    registra: false // New filter toggle for registra
  });

  useEffect(() => {
    fetchVentas();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [ventas, filters]);

  const fetchVentas = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/ventas");
      const data = await response.json();
      setVentas(data);
      setFilteredVentas(data);
    } catch (error) {
      console.error("Error fetching ventas:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandPagos = (id) => {
    setExpandedPagos(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleFilter = (filterType) => {
    setShowFilter(prev => ({
      ...prev,
      [filterType]: !prev[filterType]
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  // Calculate post-comision amount
  const calculatePostComision = (venta) => {
    const tarjetaAmount = venta.amountTarjeta || 0;
    const comision = tarjetaAmount * 0.046; // 4.6% commission
    return venta.amount - comision;
  };

  // Calculate dinero marca using stored contract data
  const calculateDineroMarca = (venta) => {
    const postComision = calculatePostComision(venta);
    const contrato = venta.storeContractType || 'DCE';
    const contractValue = venta.storeContractValue || 0;
    
    if (contrato === 'DCE' || contrato === 'Piso') {
      return postComision; // 100% for marca
    } else if (contrato === 'Porcentaje') {
      return postComision * (1 - contractValue/100); // (100 - percentage)% for marca
    } else if (contrato === 'Estetica Unisex') {
      return postComision; // 100% for marca
    }
    return postComision;
  };

  // Calculate dinero tienda using stored contract data
  const calculateDineroTienda = (venta) => {
    const postComision = calculatePostComision(venta);
    const contrato = venta.storeContractType || 'DCE';
    const contractValue = venta.storeContractValue || 0;
    
    if (contrato === 'DCE' || contrato === 'Piso') {
      return 0; // 0% for tienda
    } else if (contrato === 'Porcentaje') {
      return postComision * (contractValue/100); // percentage% for tienda
    } else if (contrato === 'Estetica Unisex') {
      return postComision; // 100% for tienda
    }
    return 0;
  };

  // Get payment method display
  const getPaymentMethodDisplay = (venta) => {
    const methods = [];
    if (venta.amountEfectivo > 0) methods.push('Efectivo');
    if (venta.amountTarjeta > 0) methods.push('Tarjeta');
    if (venta.amountTransferencia > 0) methods.push('Transferencia');
    
    if (methods.length === 1) {
      return methods[0];
    } else if (methods.length > 1) {
      return "Múltiple";
    }
    return "No especificado";
  };

  // Get unique values for filters
  const getUniqueValues = (field) => {
    const values = ventas.map(venta => {
      if (field === 'codigo') return venta.item.clave;
      if (field === 'marca') return venta.store.name;
      if (field === 'contrato') return venta.storeContractType;
      if (field === 'registra') {
        const user = venta.user;
        let registeredBy = 'No especificado';

        if (typeof user === 'object' && user !== null) {
          registeredBy = user.name || user.username || 'No especificado';
        } else if (typeof user === 'string') {
          registeredBy = user;
        }
        return registeredBy; // FIXED: return registeredBy instead of user
      }
      return null;
    }).filter(Boolean);
    
    return [...new Set(values)].sort();
  };

  // Get unique payment methods
  const getUniquePaymentMethods = () => {
    const methods = ventas.map(venta => getPaymentMethodDisplay(venta));
    return [...new Set(methods)].sort();
  };

  // Apply all filters
  const applyFilters = () => {
    let filtered = [...ventas];

    // Date filter
    if (filters.date.active && (filters.date.startDate || filters.date.endDate)) {
      filtered = filtered.filter(venta => {
        const saleDate = new Date(venta.date.split('/').reverse().join('-'));
        const startDate = filters.date.startDate ? new Date(filters.date.startDate) : null;
        const endDate = filters.date.endDate ? new Date(filters.date.endDate) : null;

        if (startDate && endDate) {
          return saleDate >= startDate && saleDate <= endDate;
        } else if (startDate) {
          return saleDate >= startDate;
        } else if (endDate) {
          return saleDate <= endDate;
        }
        return true;
      });
    }

    // Codigo filter
    if (filters.codigo.active && filters.codigo.selected.length > 0) {
      filtered = filtered.filter(venta => 
        filters.codigo.selected.includes(venta.item.clave)
      );
    }

    // Marca filter
    if (filters.marca.active && filters.marca.selected.length > 0) {
      filtered = filtered.filter(venta => 
        filters.marca.selected.includes(venta.store.name)
      );
    }

    // Tipo Pago filter
    if (filters.tipoPago.active && filters.tipoPago.selected.length > 0) {
      filtered = filtered.filter(venta => {
        const paymentMethod = getPaymentMethodDisplay(venta);
        // If "Transferencia" is selected, include both "Transferencia" and "Múltiple" that contain transferencia
        if (filters.tipoPago.selected.includes('Transferencia')) {
          return filters.tipoPago.selected.includes(paymentMethod) || 
                 (paymentMethod === 'Múltiple' && venta.amountTransferencia > 0);
        }
        return filters.tipoPago.selected.includes(paymentMethod);
      });
    }

    // Contrato filter
    if (filters.contrato.active && filters.contrato.selected.length > 0) {
      filtered = filtered.filter(venta => 
        filters.contrato.selected.includes(venta.storeContractType)
      );
    }

    // Registra filter
    if (filters.registra.active && filters.registra.selected.length > 0) {
      filtered = filtered.filter(venta => {
        const user = venta.user;
        let registeredBy = 'No especificado';
        
        if (typeof user === 'object' && user !== null) {
          registeredBy = user.name || user.username || 'No especificado';
        } else if (typeof user === 'string') {
          registeredBy = user;
        }
        
        return filters.registra.selected.includes(registeredBy);
      });
    }

    setFilteredVentas(filtered);
  };

  // Update filter functions
  const updateDateFilter = (startDate, endDate) => {
    setFilters(prev => ({
      ...prev,
      date: {
        active: !!(startDate || endDate),
        startDate,
        endDate
      }
    }));
  };

  const updateCodigoFilter = (selected) => {
    setFilters(prev => ({
      ...prev,
      codigo: {
        active: selected.length > 0,
        selected
      }
    }));
  };

  const updateMarcaFilter = (selected) => {
    setFilters(prev => ({
      ...prev,
      marca: {
        active: selected.length > 0,
        selected
      }
    }));
  };

  const updateTipoPagoFilter = (selected) => {
    setFilters(prev => ({
      ...prev,
      tipoPago: {
        active: selected.length > 0,
        selected
      }
    }));
  };

  const updateContratoFilter = (selected) => {
    setFilters(prev => ({
      ...prev,
      contrato: {
        active: selected.length > 0,
        selected
      }
    }));
  };

  const updateRegistraFilter = (selected) => {
    setFilters(prev => ({
      ...prev,
      registra: {
        active: selected.length > 0,
        selected
      }
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      date: { active: false, startDate: "", endDate: "" },
      codigo: { active: false, selected: [] },
      marca: { active: false, selected: [] },
      tipoPago: { active: false, selected: [] },
      contrato: { active: false, selected: [] },
      registra: { active: false, selected: [] }
    });
    setShowFilter({
      date: false,
      codigo: false,
      marca: false,
      tipoPago: false,
      contrato: false,
      registra: false
    });
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

  const isAdmin = user?.role === 'admin' || user?.isAdmin;

  if (loading) return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <div>Cargando historial...</div>
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
          Historial de Ventas
        </h1>
        <p style={{ color: "#666", margin: 0 }}>
          Registro completo de todas las ventas realizadas en el sistema
        </p>
      </div>

      {/* Filters Summary */}
      {(filters.date.active || filters.codigo.active || filters.marca.active || filters.tipoPago.active || filters.contrato.active || filters.registra.active) && (
        <div style={{
          background: "#e7f3ff",
          border: "1px solid #b3d9ff",
          borderRadius: "8px",
          padding: "15px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <strong style={{ color: "#0066cc" }}>Filtros activos:</strong>
            {filters.date.active && (
              <span style={{ marginLeft: "15px", padding: "4px 8px", background: "white", borderRadius: "4px", fontSize: "12px" }}>
                📅 Fecha: {filters.date.startDate || "Inicio"} - {filters.date.endDate || "Fin"}
              </span>
            )}
            {filters.codigo.active && (
              <span style={{ marginLeft: "15px", padding: "4px 8px", background: "white", borderRadius: "4px", fontSize: "12px" }}>
                🔢 Código: {filters.codigo.selected.length} seleccionados
              </span>
            )}
            {filters.marca.active && (
              <span style={{ marginLeft: "15px", padding: "4px 8px", background: "white", borderRadius: "4px", fontSize: "12px" }}>
                🏪 Marca: {filters.marca.selected.length} seleccionadas
              </span>
            )}
            {filters.tipoPago.active && (
              <span style={{ marginLeft: "15px", padding: "4px 8px", background: "white", borderRadius: "4px", fontSize: "12px" }}>
                💳 Pago: {filters.tipoPago.selected.join(", ")}
              </span>
            )}
            {filters.contrato.active && (
              <span style={{ marginLeft: "15px", padding: "4px 8px", background: "white", borderRadius: "4px", fontSize: "12px" }}>
                📝 Contrato: {filters.contrato.selected.join(", ")}
              </span>
            )}
            {filters.registra.active && (
              <span style={{ marginLeft: "15px", padding: "4px 8px", background: "white", borderRadius: "4px", fontSize: "12px" }}>
                👤 Registra: {filters.registra.selected.length} seleccionados
              </span>
            )}
          </div>
          <button
            onClick={clearAllFilters}
            style={{
              background: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              padding: "6px 12px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "bold"
            }}
          >
            Limpiar Filtros
          </button>
        </div>
      )}

      {/* Sales Table */}
      <div style={{
        background: "white",
        border: "1px solid #ddd",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        position: "relative",
        height: "500px", // Fixed height for the entire table container
        display: "flex",
        flexDirection: "column"
      }}>
        <div style={{ 
          padding: "20px", 
          background: "#f8f9fa",
          borderBottom: "1px solid #ddd",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0 // Prevent header from shrinking
        }}>
          <h2 style={{ margin: 0, color: "#333" }}>
            Total de Ventas: {filteredVentas.length} {filteredVentas.length !== ventas.length && `(de ${ventas.length})`}
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

        {/* Table Container with Fixed Height */}
        <div style={{ 
          overflow: "auto", 
          flex: 1, // Take up remaining space
          position: "relative"
        }}>
          {filteredVentas.length > 0 ? (
            <table style={{ 
              width: "100%", 
              borderCollapse: "collapse",
              minWidth: editMode ? "1300px" : "1200px"
            }}>
              <thead>
                <tr style={{ background: "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>
                  {/* Fecha Column with Filter */}
                  <th style={{ 
                    padding: "12px", 
                    textAlign: "left", 
                    borderBottom: "1px solid #ddd",
                    fontWeight: "bold",
                    position: "relative",
                    background: "#f8f9fa"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>Fecha</span>
                      <button
                        onClick={() => toggleFilter('date')}
                        style={{
                          background: filters.date.active ? "#007bff" : "transparent",
                          color: filters.date.active ? "white" : "#666",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                          padding: "2px 6px",
                          cursor: "pointer",
                          fontSize: "10px"
                        }}
                      >
                        {showFilter.date ? "▲" : "▼"}
                      </button>
                    </div>
                    {showFilter.date && (
                      <div style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        background: "white",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        padding: "15px",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                        zIndex: 1000,
                        marginTop: "5px",
                        minWidth: "250px"
                      }}>
                        <div style={{ marginBottom: "10px" }}>
                          <label style={{ fontSize: "12px", fontWeight: "bold" }}>Desde:</label>
                          <input
                            type="date"
                            value={filters.date.startDate}
                            onChange={(e) => updateDateFilter(e.target.value, filters.date.endDate)}
                            style={{ width: "100%", padding: "5px", fontSize: "12px" }}
                          />
                        </div>
                        <div style={{ marginBottom: "10px" }}>
                          <label style={{ fontSize: "12px", fontWeight: "bold" }}>Hasta:</label>
                          <input
                            type="date"
                            value={filters.date.endDate}
                            onChange={(e) => updateDateFilter(filters.date.startDate, e.target.value)}
                            style={{ width: "100%", padding: "5px", fontSize: "12px" }}
                          />
                        </div>
                      </div>
                    )}
                  </th>

                  {/* Código Column with Filter */}
                  <th style={{ 
                    padding: "12px", 
                    textAlign: "left", 
                    borderBottom: "1px solid #ddd",
                    fontWeight: "bold",
                    position: "relative",
                    background: "#f8f9fa"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>Código</span>
                      <button
                        onClick={() => toggleFilter('codigo')}
                        style={{
                          background: filters.codigo.active ? "#007bff" : "transparent",
                          color: filters.codigo.active ? "white" : "#666",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                          padding: "2px 6px",
                          cursor: "pointer",
                          fontSize: "10px"
                        }}
                      >
                        {showFilter.codigo ? "▲" : "▼"}
                      </button>
                    </div>
                    {showFilter.codigo && (
                      <div style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        background: "white",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        padding: "15px",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                        zIndex: 1000,
                        marginTop: "5px",
                        maxHeight: "200px",
                        overflowY: "auto",
                        minWidth: "200px"
                      }}>
                        {getUniqueValues('codigo').map(codigo => (
                          <label key={codigo} style={{ display: "block", marginBottom: "8px", fontSize: "12px" }}>
                            <input
                              type="checkbox"
                              checked={filters.codigo.selected.includes(codigo)}
                              onChange={(e) => {
                                const newSelected = e.target.checked
                                  ? [...filters.codigo.selected, codigo]
                                  : filters.codigo.selected.filter(item => item !== codigo);
                                updateCodigoFilter(newSelected);
                              }}
                              style={{ marginRight: "8px" }}
                            />
                            {codigo}
                          </label>
                        ))}
                      </div>
                    )}
                  </th>

                  {/* Marca Column with Filter */}
                  <th style={{ 
                    padding: "12px", 
                    textAlign: "left", 
                    borderBottom: "1px solid #ddd",
                    fontWeight: "bold",
                    position: "relative",
                    background: "#f8f9fa"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>Marca</span>
                      <button
                        onClick={() => toggleFilter('marca')}
                        style={{
                          background: filters.marca.active ? "#007bff" : "transparent",
                          color: filters.marca.active ? "white" : "#666",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                          padding: "2px 6px",
                          cursor: "pointer",
                          fontSize: "10px"
                        }}
                      >
                        {showFilter.marca ? "▲" : "▼"}
                      </button>
                    </div>
                    {showFilter.marca && (
                      <div style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        background: "white",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        padding: "15px",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                        zIndex: 1000,
                        marginTop: "5px",
                        maxHeight: "200px",
                        overflowY: "auto",
                        minWidth: "200px"
                      }}>
                        {getUniqueValues('marca').map(marca => (
                          <label key={marca} style={{ display: "block", marginBottom: "8px", fontSize: "12px" }}>
                            <input
                              type="checkbox"
                              checked={filters.marca.selected.includes(marca)}
                              onChange={(e) => {
                                const newSelected = e.target.checked
                                  ? [...filters.marca.selected, marca]
                                  : filters.marca.selected.filter(item => item !== marca);
                                updateMarcaFilter(newSelected);
                              }}
                              style={{ marginRight: "8px" }}
                            />
                            {marca}
                          </label>
                        ))}
                      </div>
                    )}
                  </th>

                  {/* Registra Column with Filter */}
                  <th style={{ 
                    padding: "12px", 
                    textAlign: "left", 
                    borderBottom: "1px solid #ddd",
                    fontWeight: "bold",
                    position: "relative",
                    background: "#f8f9fa"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>Registra</span>
                      <button
                        onClick={() => toggleFilter('registra')}
                        style={{
                          background: filters.registra.active ? "#007bff" : "transparent",
                          color: filters.registra.active ? "white" : "#666",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                          padding: "2px 6px",
                          cursor: "pointer",
                          fontSize: "10px"
                        }}
                      >
                        {showFilter.registra ? "▲" : "▼"}
                      </button>
                    </div>
                    {showFilter.registra && (
                      <div style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        background: "white",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        padding: "15px",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                        zIndex: 1000,
                        marginTop: "5px",
                        maxHeight: "200px",
                        overflowY: "auto",
                        minWidth: "200px"
                      }}>
                        {getUniqueValues('registra').map(registra => (
                          <label key={registra} style={{ display: "block", marginBottom: "8px", fontSize: "12px" }}>
                            <input
                              type="checkbox"
                              checked={filters.registra.selected.includes(registra)}
                              onChange={(e) => {
                                const newSelected = e.target.checked
                                  ? [...filters.registra.selected, registra]
                                  : filters.registra.selected.filter(item => item !== registra);
                                updateRegistraFilter(newSelected);
                              }}
                              style={{ marginRight: "8px" }}
                            />
                            {registra}
                          </label>
                        ))}
                      </div>
                    )}
                  </th>

                  <th style={{ 
                    padding: "12px", 
                    textAlign: "right", 
                    borderBottom: "1px solid #ddd",
                    fontWeight: "bold",
                    background: "#f8f9fa"
                  }}>
                    Monto
                  </th>

                  {/* Tipo Pago Column with Filter */}
                  <th style={{ 
                    padding: "12px", 
                    textAlign: "center", 
                    borderBottom: "1px solid #ddd",
                    fontWeight: "bold",
                    position: "relative",
                    background: "#f8f9fa"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>Tipo Pago</span>
                      <button
                        onClick={() => toggleFilter('tipoPago')}
                        style={{
                          background: filters.tipoPago.active ? "#007bff" : "transparent",
                          color: filters.tipoPago.active ? "white" : "#666",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                          padding: "2px 6px",
                          cursor: "pointer",
                          fontSize: "10px"
                        }}
                      >
                        {showFilter.tipoPago ? "▲" : "▼"}
                      </button>
                    </div>
                    {showFilter.tipoPago && (
                      <div style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        background: "white",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        padding: "15px",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                        zIndex: 1000,
                        marginTop: "5px",
                        minWidth: "150px"
                      }}>
                        {['Efectivo', 'Tarjeta', 'Transferencia', 'Múltiple'].map(tipo => (
                          <label key={tipo} style={{ display: "block", marginBottom: "8px", fontSize: "12px" }}>
                            <input
                              type="checkbox"
                              checked={filters.tipoPago.selected.includes(tipo)}
                              onChange={(e) => {
                                const newSelected = e.target.checked
                                  ? [...filters.tipoPago.selected, tipo]
                                  : filters.tipoPago.selected.filter(item => item !== tipo);
                                updateTipoPagoFilter(newSelected);
                              }}
                              style={{ marginRight: "8px" }}
                            />
                            {tipo}
                          </label>
                        ))}
                      </div>
                    )}
                  </th>

                  <th style={{ 
                    padding: "12px", 
                    textAlign: "right", 
                    borderBottom: "1px solid #ddd",
                    fontWeight: "bold",
                    background: "#f8f9fa"
                  }}>
                    Post-Comisión
                  </th>

                  {/* Contrato Column with Filter */}
                  <th style={{ 
                    padding: "12px", 
                    textAlign: "center", 
                    borderBottom: "1px solid #ddd",
                    fontWeight: "bold",
                    position: "relative",
                    background: "#f8f9fa"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>Contrato</span>
                      <button
                        onClick={() => toggleFilter('contrato')}
                        style={{
                          background: filters.contrato.active ? "#007bff" : "transparent",
                          color: filters.contrato.active ? "white" : "#666",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                          padding: "2px 6px",
                          cursor: "pointer",
                          fontSize: "10px"
                        }}
                      >
                        {showFilter.contrato ? "▲" : "▼"}
                      </button>
                    </div>
                    {showFilter.contrato && (
                      <div style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        background: "white",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        padding: "15px",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                        zIndex: 1000,
                        marginTop: "5px",
                        minWidth: "150px"
                      }}>
                        {['DCE', 'Porcentaje', 'Piso', 'Estetica Unisex'].map(contrato => (
                          <label key={contrato} style={{ display: "block", marginBottom: "8px", fontSize: "12px" }}>
                            <input
                              type="checkbox"
                              checked={filters.contrato.selected.includes(contrato)}
                              onChange={(e) => {
                                const newSelected = e.target.checked
                                  ? [...filters.contrato.selected, contrato]
                                  : filters.contrato.selected.filter(item => item !== contrato);
                                updateContratoFilter(newSelected);
                              }}
                              style={{ marginRight: "8px" }}
                            />
                            {contrato}
                          </label>
                        ))}
                      </div>
                    )}
                  </th>

                  <th style={{ 
                    padding: "12px", 
                    textAlign: "right", 
                    borderBottom: "1px solid #ddd",
                    fontWeight: "bold",
                    background: "#f8f9fa"
                  }}>
                    Dinero Marca
                  </th>
                  <th style={{ 
                    padding: "12px", 
                    textAlign: "right", 
                    borderBottom: "1px solid #ddd",
                    fontWeight: "bold",
                    background: "#f8f9fa"
                  }}>
                    Dinero Tienda
                  </th>
                  {editMode && (
                    <th style={{ 
                      padding: "12px", 
                      textAlign: "center", 
                      borderBottom: "1px solid #ddd",
                      fontWeight: "bold",
                      width: "100px",
                      background: "#f8f9fa"
                    }}>
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredVentas.map((venta, index) => {
                  const postComision = calculatePostComision(venta);
                  const dineroMarca = calculateDineroMarca(venta);
                  const dineroTienda = calculateDineroTienda(venta);
                  const contrato = venta.storeContractType || 'DCE';
                  const contractValue = venta.storeContractValue || 0;
                  const paymentMethod = getPaymentMethodDisplay(venta);
                  const isMultiplePayments = paymentMethod === "Múltiple";

                  return (
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
                          <div style={{ fontWeight: "bold", fontFamily: "monospace" }}>
                            {venta.item.clave || venta.item}
                          </div>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <div style={{ fontWeight: "bold" }}>
                            {venta.store.name || venta.store}
                          </div>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <div style={{ 
                            fontWeight: "bold",
                            color: "#495057",
                            fontSize: "14px"
                          }}>
                            {typeof venta.user === 'object' && venta.user !== null 
                              ? venta.user.name || venta.user.username || 'No especificado'
                              : 'No especificado'
                            }
                          </div>
                        </td>
                        <td style={{ padding: "12px", textAlign: "right" }}>
                          <div style={{ 
                            fontSize: "14px", 
                            fontWeight: "bold",
                            color: "#28a745"
                          }}>
                            {formatCurrency(venta.amount)}
                          </div>
                        </td>
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                            <span style={{
                              padding: "4px 8px",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: "bold",
                              backgroundColor: isMultiplePayments ? "#e7f3ff" : "#f8f9fa",
                              color: isMultiplePayments ? "#0066cc" : "#495057",
                              border: `1px solid ${isMultiplePayments ? "#b3d9ff" : "#dee2e6"}`
                            }}>
                              {paymentMethod}
                            </span>
                            {isMultiplePayments && (
                              <button
                                onClick={() => toggleExpandPagos(venta._id)}
                                style={{
                                  background: expandedPagos[venta._id] ? "#6c757d" : "#007bff",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "4px",
                                  padding: "2px 6px",
                                  cursor: "pointer",
                                  fontSize: "10px",
                                  fontWeight: "bold"
                                }}
                              >
                                {expandedPagos[venta._id] ? "▲" : "▼"}
                              </button>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: "12px", textAlign: "right" }}>
                          <div style={{ 
                            fontSize: "14px", 
                            fontWeight: "bold",
                            color: venta.amountTarjeta > 0 ? "#ff6b35" : "#28a745"
                          }}>
                            {formatCurrency(postComision)}
                            {venta.amountTarjeta > 0 && (
                              <div style={{ 
                                fontSize: "10px", 
                                color: "#666",
                                fontStyle: "italic"
                              }}>
                                -4.6% tarjeta
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          <span style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "bold",
                            backgroundColor: 
                              contrato === 'DCE' ? "#e7f3ff" :
                              contrato === 'Piso' ? "#fff3cd" :
                              contrato === 'Porcentaje' ? "#e6f7ed" :
                              "#f4e6ff",
                            color: 
                              contrato === 'DCE' ? "#0066cc" :
                              contrato === 'Piso' ? "#856404" :
                              contrato === 'Porcentaje' ? "#28a745" :
                              "#6f42c1",
                            border: `1px solid ${
                              contrato === 'DCE' ? "#b3d9ff" :
                              contrato === 'Piso' ? "#ffeaa7" :
                              contrato === 'Porcentaje' ? "#c3e6cb" :
                              "#d6c6ff"
                            }`
                          }}>
                            {contrato}
                            {contrato === 'Porcentaje' && contractValue > 0 && (
                              <span style={{ fontSize: "10px", marginLeft: "4px" }}>
                                ({contractValue}%)
                              </span>
                            )}
                          </span>
                        </td>
                        <td style={{ padding: "12px", textAlign: "right" }}>
                          <div style={{ 
                            fontSize: "14px", 
                            fontWeight: "bold",
                            color: "#0066cc"
                          }}>
                            {formatCurrency(dineroMarca)}
                          </div>
                        </td>
                        <td style={{ padding: "12px", textAlign: "right" }}>
                          <div style={{ 
                            fontSize: "14px", 
                            fontWeight: "bold",
                            color: "#6f42c1"
                          }}>
                            {formatCurrency(dineroTienda)}
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
                              🗑️
                            </button>
                          </td>
                        )}
                      </tr>

                      {/* Expanded Payment Methods Details */}
                      {expandedPagos[venta._id] && isMultiplePayments && (
                        <tr>
                          <td colSpan={editMode ? "11" : "10"} style={{ padding: "0" }}>
                            <div style={{ 
                              background: "#e7f3ff", 
                              padding: "15px",
                              borderBottom: "1px solid #b3d9ff"
                            }}>
                              <h4 style={{ 
                                margin: "0 0 10px 0", 
                                color: "#0066cc",
                                fontSize: "14px"
                              }}>
                                Detalles de Pagos Múltiples
                              </h4>
                              <div style={{ 
                                display: "grid", 
                                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
                                gap: "15px"
                              }}>
                                {venta.amountEfectivo > 0 && (
                                  <div style={{ 
                                    padding: "10px", 
                                    background: "white", 
                                    borderRadius: "6px",
                                    border: "1px solid #b3d9ff"
                                  }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <div style={{
                                          width: "12px",
                                          height: "12px",
                                          borderRadius: "50%",
                                          backgroundColor: "#28a745"
                                        }}></div>
                                        <span style={{ fontWeight: "bold" }}>Efectivo:</span>
                                      </div>
                                      <span style={{ fontWeight: "bold", color: "#28a745" }}>
                                        {formatCurrency(venta.amountEfectivo)}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                {venta.amountTarjeta > 0 && (
                                  <div style={{ 
                                    padding: "10px", 
                                    background: "white", 
                                    borderRadius: "6px",
                                    border: "1px solid #b3d9ff"
                                  }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <div style={{
                                          width: "12px",
                                          height: "12px",
                                          borderRadius: "50%",
                                          backgroundColor: "#007bff"
                                        }}></div>
                                        <span style={{ fontWeight: "bold" }}>Tarjeta:</span>
                                      </div>
                                      <div style={{ textAlign: "right" }}>
                                        <div style={{ fontWeight: "bold", color: "#007bff" }}>
                                          {formatCurrency(venta.amountTarjeta)}
                                        </div>
                                        <div style={{ fontSize: "10px", color: "#666" }}>
                                          Comisión: {formatCurrency(venta.amountTarjeta * 0.046)}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {venta.amountTransferencia > 0 && (
                                  <div style={{ 
                                    padding: "10px", 
                                    background: "white", 
                                    borderRadius: "6px",
                                    border: "1px solid #b3d9ff"
                                  }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <div style={{
                                          width: "12px",
                                          height: "12px",
                                          borderRadius: "50%",
                                          backgroundColor: "#6f42c1"
                                        }}></div>
                                        <span style={{ fontWeight: "bold" }}>Transferencia:</span>
                                      </div>
                                      <span style={{ fontWeight: "bold", color: "#6f42c1" }}>
                                        {formatCurrency(venta.amountTransferencia)}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                <div style={{ 
                                  padding: "10px", 
                                  background: "#d4edda", 
                                  borderRadius: "6px",
                                  border: "1px solid #c3e6cb"
                                }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontWeight: "bold" }}>Total:</span>
                                    <span style={{ fontWeight: "bold", color: "#155724" }}>
                                      {formatCurrency(venta.amount)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ 
              padding: "40px", 
              textAlign: "center", 
              color: "#666",
              background: "white",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              {ventas.length === 0 ? "No hay ventas registradas en el sistema." : "No hay ventas que coincidan con los filtros aplicados."}
            </div>
          )}
        </div>
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
                  <strong>Producto:</strong> {deleteConfirm.item.name || deleteConfirm.item}
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <strong>Tienda:</strong> {deleteConfirm.store.name || deleteConfirm.store}
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <strong>Registrado por:</strong> {typeof deleteConfirm.user === 'object' && deleteConfirm.user !== null 
                    ? deleteConfirm.user.name || deleteConfirm.user.username || 'No especificado'
                    : 'No especificado'
                  }
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <strong>Monto:</strong> {formatCurrency(deleteConfirm.amount)}
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <strong>Contrato:</strong> {deleteConfirm.storeContractType}
                  {deleteConfirm.storeContractType === 'Porcentaje' && deleteConfirm.storeContractValue > 0 && (
                    <span> ({deleteConfirm.storeContractValue}%)</span>
                  )}
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
      {filteredVentas.length > 0 && (
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
              Total Recaudado
            </h3>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#28a745" }}>
              {formatCurrency(filteredVentas.reduce((total, venta) => total + venta.amount, 0))}
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
              Total Correspondiente a Marcas
            </h3>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#0066cc" }}>
              {formatCurrency(filteredVentas.reduce((total, venta) => total + calculateDineroMarca(venta), 0))}
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
              Total Tienda
            </h3>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#6f42c1" }}>
              {formatCurrency(filteredVentas.reduce((total, venta) => total + calculateDineroTienda(venta), 0))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Historial;