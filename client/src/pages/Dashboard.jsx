import { useState, useEffect, useCallback } from "react";

export default function Dashboard({ user }) {
  const [dateRange, setDateRange] = useState("mensual");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [salesData, setSalesData] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  const [showCommissions, setShowCommissions] = useState(true);

  // Filter states for donut chart
  const [filters, setFilters] = useState({
    paymentMethod: { active: false, selected: [] },
    contractType: { active: false, selected: [] },
    store: { active: false, selected: [] },
    item: { active: false, selected: [] },
    user: { active: false, selected: [] }
  });

  const [showFilter, setShowFilter] = useState({
    paymentMethod: false,
    contractType: false,
    store: false,
    item: false,
    user: false
  });

  // Get current date ranges based on selection
  const getDateRange = useCallback(() => {
  const now = new Date();
  
  const formatForAPI = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  switch (dateRange) {
    case "mensual":
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        start: formatForAPI(startOfMonth),
        end: formatForAPI(endOfMonth)
      };
    case "anual":
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31);
      return {
        start: formatForAPI(startOfYear),
        end: formatForAPI(endOfYear)
      };
    case "especifico":
      return {
        start: customStartDate,
        end: customEndDate
      };
    default:
      return { start: "", end: "" };
  }
}, [dateRange, customStartDate, customEndDate]);

  // Calculate post-comision amount (from Historial.jsx)
  const calculatePostComision = useCallback((venta) => {
    const tarjetaAmount = venta.amountTarjeta || 0;
    const comision = tarjetaAmount * 0.046; // 4.6% commission
    return venta.amount - comision;
  }, []);

  // Get payment method display
  const getPaymentMethodDisplay = useCallback((venta) => {
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
  }, []);

  // FIX: Wrap fetchSalesData in useCallback
  const fetchSalesData = useCallback(async () => {
  try {
    setLoading(true);
    const dateRangeObj = getDateRange();

    let url = "http://localhost:5000/api/ventas";
    if (dateRangeObj.start && dateRangeObj.end) {
      url += `?startDate=${dateRangeObj.start}&endDate=${dateRangeObj.end}`;
    }

    const token = localStorage.getItem("token");

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    setSalesData(data);
    setFilteredSales(data);
  } catch (error) {
    console.error("Error fetching sales data:", error);
  } finally {
    setLoading(false);
  }
}, [getDateRange]); 

  // FIX: Wrap applyFilters in useCallback
  const applyFilters = useCallback(() => {
    let filtered = [...salesData];

    // Calculate amount based on commission setting
    const calculateAmount = (venta) => {
      return showCommissions ? calculatePostComision(venta) : venta.amount;
    };

    // Payment Method filter
    if (filters.paymentMethod.active && filters.paymentMethod.selected.length > 0) {
      filtered = filtered.filter(sale => {
        const paymentMethod = getPaymentMethodDisplay(sale);
        return filters.paymentMethod.selected.includes(paymentMethod);
      });
    }

    // Contract Type filter
    if (filters.contractType.active && filters.contractType.selected.length > 0) {
      filtered = filtered.filter(sale => 
        filters.contractType.selected.includes(sale.storeContractType)
      );
    }

    // Store filter
    if (filters.store.active && filters.store.selected.length > 0) {
      filtered = filtered.filter(sale => 
        filters.store.selected.includes(sale.store.name)
      );
    }

    // Item filter
    if (filters.item.active && filters.item.selected.length > 0) {
      filtered = filtered.filter(sale => 
        filters.item.selected.includes(sale.item.clave)
      );
    }

    // User filter
    if (filters.user.active && filters.user.selected.length > 0) {
      filtered = filtered.filter(sale => {
        const user = sale.user;
        let registeredBy = 'No especificado';
        
        if (typeof user === 'object' && user !== null) {
          registeredBy = user.name || user.username || 'No especificado';
        }
        
        return filters.user.selected.includes(registeredBy);
      });
    }

    setFilteredSales(filtered);
    
    // Calculate total amount for filtered data
    const total = filtered.reduce((sum, sale) => sum + calculateAmount(sale), 0);
    setTotalAmount(total);
  }, [salesData, filters, showCommissions, calculatePostComision, getPaymentMethodDisplay]);

  // UseEffects with proper dependencies
  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Get unique values for filters
  const getUniqueValues = (field) => {
    const values = salesData.map(sale => {
      if (field === 'paymentMethod') return getPaymentMethodDisplay(sale);
      if (field === 'contractType') return sale.storeContractType;
      if (field === 'store') return sale.store.name;
      if (field === 'item') {
        // Only show items from selected stores if store filter is active
        if (filters.store.active && filters.store.selected.length > 0) {
          if (filters.store.selected.includes(sale.store.name)) {
            return sale.item.clave;
          }
          return null;
        }
        return sale.item.clave;
      }
      if (field === 'user') {
        const user = sale.user;
        if (typeof user === 'object' && user !== null) {
          return user.name || user.username || 'No especificado';
        }
        return 'No especificado';
      }
      return null;
    }).filter(Boolean);
    
    return [...new Set(values)].sort();
  };

  // Calculate total commission for filtered sales
  const calculateTotalCommission = () => {
    return filteredSales.reduce((total, sale) => total + (sale.amountTarjeta * 0.046), 0);
  };

  // Generate segments for donut chart based on ALL active filter combinations
  const generateDonutSegments = () => {
    if (filteredSales.length === 0) return [];

    const calculateAmount = (venta) => {
      return showCommissions ? calculatePostComision(venta) : venta.amount;
    };

    const segments = [];
    const total = totalAmount;

    // Get active filter categories with their values
    const activeFilters = Object.entries(filters)
      .filter(([key, filter]) => filter.active && filter.selected.length > 0)
      .map(([key, filter]) => ({
        category: key,
        values: filter.selected
      }));

    // If no filters are active, show single segment
    if (activeFilters.length === 0) {
      return [{
        value: total,
        percentage: 100,
        color: '#007bff',
        label: 'Total'
      }];
    }

    // Generate all possible combinations of active filter values
    const combinations = generateAllCombinations(activeFilters);
    
    // Calculate amount for each combination
    combinations.forEach((combination, index) => {
      const amount = filteredSales.reduce((sum, sale) => {
        let matches = true;
        
        // Check if sale matches all filter values in this combination
        activeFilters.forEach(({ category, values }) => {
          if (category === 'paymentMethod') {
            const paymentMethod = getPaymentMethodDisplay(sale);
            matches = matches && combination.paymentMethod === paymentMethod;
          } else if (category === 'contractType') {
            matches = matches && combination.contractType === sale.storeContractType;
          } else if (category === 'store') {
            matches = matches && combination.store === sale.store.name;
          } else if (category === 'item') {
            matches = matches && combination.item === sale.item.clave;
          } else if (category === 'user') {
            const user = sale.user;
            let registeredBy = 'No especificado';
            if (typeof user === 'object' && user !== null) {
              registeredBy = user.name || user.username || 'No especificado';
            }
            matches = matches && combination.user === registeredBy;
          }
        });
        
        return matches ? sum + calculateAmount(sale) : sum;
      }, 0);

      if (amount > 0) {
        const percentage = (amount / total) * 100;
        const color = getSegmentColor(index);
        const label = generateCombinationLabel(combination, activeFilters);
        
        segments.push({
          value: amount,
          percentage,
          color,
          label
        });
      }
    });

    return segments;
  };

  // Generate all possible combinations of filter values
  const generateAllCombinations = (activeFilters) => {
    if (activeFilters.length === 0) return [{}];
    
    const [firstFilter, ...remainingFilters] = activeFilters;
    const subCombinations = generateAllCombinations(remainingFilters);
    const combinations = [];
    
    firstFilter.values.forEach(value => {
      subCombinations.forEach(subCombo => {
        combinations.push({
          [firstFilter.category]: value,
          ...subCombo
        });
      });
    });
    
    return combinations;
  };

  // Generate label for combination
  const generateCombinationLabel = (combination, activeFilters) => {
    const parts = [];
    
    activeFilters.forEach(({ category }) => {
      if (combination[category]) {
        parts.push(combination[category]);
      }
    });
    
    return parts.join(' • ') || 'Total';
  };

  // Get color for segment based on index
  const getSegmentColor = (index) => {
    const colors = [
      '#007bff', '#28a745', '#dc3545', '#ffc107', '#6f42c1',
      '#20c997', '#fd7e14', '#e83e8c', '#6c757d', '#0dcaf0',
      '#198754', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
      '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3'
    ];
    return colors[index % colors.length];
  };

  // Update filter functions
  const updatePaymentMethodFilter = (selected) => {
    setFilters(prev => ({
      ...prev,
      paymentMethod: {
        active: selected.length > 0,
        selected
      }
    }));
  };

  const updateContractTypeFilter = (selected) => {
    setFilters(prev => ({
      ...prev,
      contractType: {
        active: selected.length > 0,
        selected
      }
    }));
  };

  const updateStoreFilter = (selected) => {
    setFilters(prev => ({
      ...prev,
      store: {
        active: selected.length > 0,
        selected
      },
      // Reset item filter when store changes
      item: {
        active: false,
        selected: []
      }
    }));
  };

  const updateItemFilter = (selected) => {
    setFilters(prev => ({
      ...prev,
      item: {
        active: selected.length > 0,
        selected
      }
    }));
  };

  const updateUserFilter = (selected) => {
    setFilters(prev => ({
      ...prev,
      user: {
        active: selected.length > 0,
        selected
      }
    }));
  };

  const toggleFilter = (filterType) => {
    setShowFilter(prev => ({
      ...prev,
      [filterType]: !prev[filterType]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      paymentMethod: { active: false, selected: [] },
      contractType: { active: false, selected: [] },
      store: { active: false, selected: [] },
      item: { active: false, selected: [] },
      user: { active: false, selected: [] }
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDateRangeDisplay = () => {
    const range = getDateRange();
    if (dateRange === "mensual") {
      const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                         "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
      const currentMonth = monthNames[new Date().getMonth()];
      return `${currentMonth} ${new Date().getFullYear()}`;
    } else if (dateRange === "anual") {
      return `Año ${new Date().getFullYear()}`;
    } else if (dateRange === "especifico" && range.start && range.end) {
      return `${new Date(range.start).toLocaleDateString()} - ${new Date(range.end).toLocaleDateString()}`;
    }
    return "Seleccionar fechas";
  };

  // Donut chart component
  const DonutChart = ({ totalAmount, segments }) => {
    const size = 200;
    const strokeWidth = 20;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    
    let currentOffset = 0;

    return (
      <div style={{ position: "relative", display: "inline-block" }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e9ecef"
            strokeWidth={strokeWidth}
          />
          
          {/* Segments */}
          {segments.map((segment, index) => {
            const segmentLength = (segment.percentage / 100) * circumference;
            const segmentProps = {
              cx: size / 2,
              cy: size / 2,
              r: radius,
              fill: "none",
              stroke: segment.color,
              strokeWidth: strokeWidth,
              strokeDasharray: `${segmentLength} ${circumference - segmentLength}`,
              strokeDashoffset: -currentOffset,
              strokeLinecap: "round"
            };
            
            currentOffset += segmentLength;
            
            return <circle key={index} {...segmentProps} />;
          })}
        </svg>
        
        {/* Center text */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center"
        }}>
          <div style={{ 
            fontSize: "24px", 
            fontWeight: "bold", 
            color: "#333",
            lineHeight: "1.2"
          }}>
            {formatCurrency(totalAmount)}
          </div>
          <div style={{ 
            fontSize: "12px", 
            color: "#666",
            marginTop: "4px"
          }}>
            Total
          </div>
        </div>
      </div>
    );
  };

  const segments = generateDonutSegments();
  const totalCommission = calculateTotalCommission();

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
          Dashboard
        </h1>
        <p style={{ color: "#666", margin: 0 }}>
          Visualización de datos de ventas y métricas
        </p>
      </div>

      {/* Date Range Selector */}
      <div style={{
        background: "white",
        borderRadius: "8px",
        padding: "20px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "30px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "30px", flexWrap: "wrap" }}>
          {/* Radio Group */}
          <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="radio"
                name="dateRange"
                value="mensual"
                checked={dateRange === "mensual"}
                onChange={(e) => setDateRange(e.target.value)}
                style={{ margin: 0 }}
              />
              <span style={{ fontWeight: "500" }}>Mensual</span>
            </label>
            
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="radio"
                name="dateRange"
                value="anual"
                checked={dateRange === "anual"}
                onChange={(e) => setDateRange(e.target.value)}
                style={{ margin: 0 }}
              />
              <span style={{ fontWeight: "500" }}>Anual</span>
            </label>
            
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="radio"
                name="dateRange"
                value="especifico"
                checked={dateRange === "especifico"}
                onChange={(e) => setDateRange(e.target.value)}
                style={{ margin: 0 }}
              />
              <span style={{ fontWeight: "500" }}>Específico</span>
            </label>
          </div>

          {/* Custom Date Inputs */}
          {dateRange === "especifico" && (
            <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "bold", color: "#666", marginBottom: "4px", display: "block" }}>
                  Desde:
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "14px"
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "bold", color: "#666", marginBottom: "4px", display: "block" }}>
                  Hasta:
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "14px"
                  }}
                />
              </div>
            </div>
          )}

          {/* Date Range Display */}
          <div style={{ marginLeft: "auto" }}>
            <div style={{ 
              padding: "8px 16px", 
              background: "#e7f3ff", 
              borderRadius: "20px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#0066cc"
            }}>
              📅 {formatDateRangeDisplay()}
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ 
          textAlign: "center", 
          padding: "40px", 
          color: "#666",
          background: "white",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          Cargando datos del dashboard...
        </div>
      )}

      {/* Dashboard Content */}
      {!loading && (
        <div style={{ display: "grid", gap: "30px" }}>
          {/* Donut Chart Section with Filters */}
          <div style={{
            background: "white",
            borderRadius: "8px",
            padding: "30px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "30px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "20px" }}>
                  <h2 style={{ 
                    margin: 0, 
                    color: "#333",
                    fontSize: "20px",
                    fontWeight: "600"
                  }}>
                    Ventas Totales
                  </h2>
                  
                  {/* Commission Toggle */}
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={showCommissions}
                      onChange={(e) => setShowCommissions(e.target.checked)}
                      style={{ margin: 0 }}
                    />
                    <span style={{ fontSize: "14px", fontWeight: "500" }}>Mostrar comisiones</span>
                  </label>
                </div>

                {/* Donut Chart Filters - VERTICAL LAYOUT */}
                <div style={{ 
                  display: "flex", 
                  flexDirection: "column",
                  gap: "15px",
                  maxWidth: "300px"
                }}>
                  {/* Payment Method Filter */}
                  <div style={{ position: "relative" }}>
                    <button
                      onClick={() => toggleFilter('paymentMethod')}
                      style={{
                        background: filters.paymentMethod.active ? "#007bff" : "white",
                        color: filters.paymentMethod.active ? "white" : "#333",
                        border: "1px solid #ddd",
                        borderRadius: "6px",
                        padding: "10px 16px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%"
                      }}
                    >
                      <span>💳 Método de Pago</span>
                      <span>{showFilter.paymentMethod ? "▲" : "▼"}</span>
                    </button>
                    {showFilter.paymentMethod && (
                      <div style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        background: "white",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        padding: "15px",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                        zIndex: 1000,
                        marginTop: "5px",
                        maxHeight: "200px",
                        overflowY: "auto"
                      }}>
                        {getUniqueValues('paymentMethod').map(method => (
                          <label key={method} style={{ display: "block", marginBottom: "8px", fontSize: "12px" }}>
                            <input
                              type="checkbox"
                              checked={filters.paymentMethod.selected.includes(method)}
                              onChange={(e) => {
                                const newSelected = e.target.checked
                                  ? [...filters.paymentMethod.selected, method]
                                  : filters.paymentMethod.selected.filter(item => item !== method);
                                updatePaymentMethodFilter(newSelected);
                              }}
                              style={{ marginRight: "8px" }}
                            />
                            {method}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Contract Type Filter */}
                  <div style={{ position: "relative" }}>
                    <button
                      onClick={() => toggleFilter('contractType')}
                      style={{
                        background: filters.contractType.active ? "#007bff" : "white",
                        color: filters.contractType.active ? "white" : "#333",
                        border: "1px solid #ddd",
                        borderRadius: "6px",
                        padding: "10px 16px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%"
                      }}
                    >
                      <span>📝 Tipo de Contrato</span>
                      <span>{showFilter.contractType ? "▲" : "▼"}</span>
                    </button>
                    {showFilter.contractType && (
                      <div style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        background: "white",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        padding: "15px",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                        zIndex: 1000,
                        marginTop: "5px",
                        maxHeight: "200px",
                        overflowY: "auto"
                      }}>
                        {getUniqueValues('contractType').map(contract => (
                          <label key={contract} style={{ display: "block", marginBottom: "8px", fontSize: "12px" }}>
                            <input
                              type="checkbox"
                              checked={filters.contractType.selected.includes(contract)}
                              onChange={(e) => {
                                const newSelected = e.target.checked
                                  ? [...filters.contractType.selected, contract]
                                  : filters.contractType.selected.filter(item => item !== contract);
                                updateContractTypeFilter(newSelected);
                              }}
                              style={{ marginRight: "8px" }}
                            />
                            {contract}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Store Filter */}
                  <div style={{ position: "relative" }}>
                    <button
                      onClick={() => toggleFilter('store')}
                      style={{
                        background: filters.store.active ? "#007bff" : "white",
                        color: filters.store.active ? "white" : "#333",
                        border: "1px solid #ddd",
                        borderRadius: "6px",
                        padding: "10px 16px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%"
                      }}
                    >
                      <span>🏪 Marca</span>
                      <span>{showFilter.store ? "▲" : "▼"}</span>
                    </button>
                    {showFilter.store && (
                      <div style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        background: "white",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        padding: "15px",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                        zIndex: 1000,
                        marginTop: "5px",
                        maxHeight: "200px",
                        overflowY: "auto"
                      }}>
                        {getUniqueValues('store').map(store => (
                          <label key={store} style={{ display: "block", marginBottom: "8px", fontSize: "12px" }}>
                            <input
                              type="checkbox"
                              checked={filters.store.selected.includes(store)}
                              onChange={(e) => {
                                const newSelected = e.target.checked
                                  ? [...filters.store.selected, store]
                                  : filters.store.selected.filter(item => item !== store);
                                updateStoreFilter(newSelected);
                              }}
                              style={{ marginRight: "8px" }}
                            />
                            {store}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Item Filter (only shown when store is selected) */}
                  {filters.store.active && (
                    <div style={{ position: "relative" }}>
                      <button
                        onClick={() => toggleFilter('item')}
                        style={{
                          background: filters.item.active ? "#007bff" : "white",
                          color: filters.item.active ? "white" : "#333",
                          border: "1px solid #ddd",
                          borderRadius: "6px",
                          padding: "10px 16px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "500",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%"
                        }}
                      >
                        <span>📦 Producto</span>
                        <span>{showFilter.item ? "▲" : "▼"}</span>
                      </button>
                      {showFilter.item && (
                        <div style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          background: "white",
                          border: "1px solid #ccc",
                          borderRadius: "6px",
                          padding: "15px",
                          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                          zIndex: 1000,
                          marginTop: "5px",
                          maxHeight: "200px",
                          overflowY: "auto"
                        }}>
                          {getUniqueValues('item').map(item => (
                            <label key={item} style={{ display: "block", marginBottom: "8px", fontSize: "12px" }}>
                              <input
                                type="checkbox"
                                checked={filters.item.selected.includes(item)}
                                onChange={(e) => {
                                  const newSelected = e.target.checked
                                    ? [...filters.item.selected, item]
                                    : filters.item.selected.filter(i => i !== item);
                                  updateItemFilter(newSelected);
                                }}
                                style={{ marginRight: "8px" }}
                              />
                              {item}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* User Filter */}
                  <div style={{ position: "relative" }}>
                    <button
                      onClick={() => toggleFilter('user')}
                      style={{
                        background: filters.user.active ? "#007bff" : "white",
                        color: filters.user.active ? "white" : "#333",
                        border: "1px solid #ddd",
                        borderRadius: "6px",
                        padding: "10px 16px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%"
                      }}
                    >
                      <span>👤 Usuario</span>
                      <span>{showFilter.user ? "▲" : "▼"}</span>
                    </button>
                    {showFilter.user && (
                      <div style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        background: "white",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        padding: "15px",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                        zIndex: 1000,
                        marginTop: "5px",
                        maxHeight: "200px",
                        overflowY: "auto"
                      }}>
                        {getUniqueValues('user').map(user => (
                          <label key={user} style={{ display: "block", marginBottom: "8px", fontSize: "12px" }}>
                            <input
                              type="checkbox"
                              checked={filters.user.selected.includes(user)}
                              onChange={(e) => {
                                const newSelected = e.target.checked
                                  ? [...filters.user.selected, user]
                                  : filters.user.selected.filter(u => u !== user);
                                updateUserFilter(newSelected);
                              }}
                              style={{ marginRight: "8px" }}
                            />
                            {user}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Clear Filters Button */}
                  {(filters.paymentMethod.active || filters.contractType.active || filters.store.active || filters.item.active || filters.user.active) && (
                    <button
                      onClick={clearAllFilters}
                      style={{
                        background: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        padding: "10px 16px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        width: "100%",
                        marginTop: "10px"
                      }}
                    >
                      Limpiar Filtros
                    </button>
                  )}
                </div>
              </div>

              {/* Donut Chart */}
              <div style={{ flex: 1, textAlign: "center" }}>
                <DonutChart totalAmount={totalAmount} segments={segments} />
                
                {/* Commission Display */}
                {!showCommissions && (
                  <div style={{ 
                    marginTop: "15px",
                    padding: "10px",
                    background: "#fff3cd",
                    border: "1px solid #ffeaa7",
                    borderRadius: "6px",
                    fontSize: "14px",
                    color: "#856404",
                    maxWidth: "300px",
                    margin: "15px auto 0"
                  }}>
                    💳 Comisión por tarjeta: {formatCurrency(totalCommission)}
                  </div>
                )}
              </div>
            </div>

            {/* Segment Legend */}
            {segments.length > 1 && (
              <div style={{ 
                marginTop: "30px",
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "15px",
                maxWidth: "800px",
                margin: "0 auto"
              }}>
                {segments.map((segment, index) => (
                  <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
                    <div style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "2px",
                      backgroundColor: segment.color
                    }}></div>
                    <span style={{ color: "#666" }}>
                      {segment.label} ({segment.percentage.toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ 
              marginTop: "20px",
              fontSize: "12px",
              color: "#999",
              textAlign: "center"
            }}>
              Período: {formatDateRangeDisplay()} | {filteredSales.length} ventas filtradas
              {!showCommissions && ` | Comisiones excluidas`}
            </div>
          </div>

          {/* Additional Metrics Row */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px"
          }}>
            {/* Total Sales Count */}
            <div style={{
              background: "white",
              borderRadius: "8px",
              padding: "20px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              textAlign: "center"
            }}>
              <h3 style={{ 
                margin: "0 0 10px 0", 
                color: "#666",
                fontSize: "14px",
                fontWeight: "600"
              }}>
                Total de Ventas
              </h3>
              <div style={{ 
                fontSize: "32px", 
                fontWeight: "bold", 
                color: "#28a745" 
              }}>
                {filteredSales.length}
              </div>
              <div style={{ 
                fontSize: "12px", 
                color: "#999",
                marginTop: "5px"
              }}>
                transacciones
              </div>
            </div>

            {/* Average Amount */}
            <div style={{
              background: "white",
              borderRadius: "8px",
              padding: "20px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              textAlign: "center"
            }}>
              <h3 style={{ 
                margin: "0 0 10px 0", 
                color: "#666",
                fontSize: "14px",
                fontWeight: "600"
              }}>
                {showCommissions ? 'Promedio Post-Comisión' : 'Promedio Bruto'}
              </h3>
              <div style={{ 
                fontSize: "24px", 
                fontWeight: "bold", 
                color: "#ff6b35" 
              }}>
                {formatCurrency(filteredSales.length > 0 ? totalAmount / filteredSales.length : 0)}
              </div>
              <div style={{ 
                fontSize: "12px", 
                color: "#999",
                marginTop: "5px"
              }}>
                por transacción
              </div>
            </div>

            {/* Segments Count */}
            <div style={{
              background: "white",
              borderRadius: "8px",
              padding: "20px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              textAlign: "center"
            }}>
              <h3 style={{ 
                margin: "0 0 10px 0", 
                color: "#666",
                fontSize: "14px",
                fontWeight: "600"
              }}>
                Segmentos
              </h3>
              <div style={{ 
                fontSize: "32px", 
                fontWeight: "bold", 
                color: "#6f42c1",
                marginBottom: "8px"
              }}>
                {segments.length}
              </div>
              <div style={{ 
                fontSize: "12px", 
                color: "#999"
              }}>
                categorías
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}