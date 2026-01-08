import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Inventario = ({ user }) => {
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    activo: null,
    producto: [],
    precioVenta: null,
    participacion: null,
    totalParticipante: null,
    piezas: null,
    totalEstetica: null,
    fechaRecepcion: null,
    marca: []
  });
  const [showFilterDropdown, setShowFilterDropdown] = useState(null);
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchStores = async () => {
      try {
        console.log('🔍 Fetching from:', `${API_URL}/api/tiendas`);
        
        const response = await fetch(`${API_URL}/api/tiendas`);
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📦 Full API response:', data);
        console.log('📊 Response type:', typeof data);
        console.log('📊 Is array?', Array.isArray(data));
        
        // Try different response structures
        let stores = [];
        
        if (Array.isArray(data)) {
          // Direct array response
          stores = data;
        } else if (data.tiendas && Array.isArray(data.tiendas)) {
          // Response with { tiendas: [...] }
          stores = data.tiendas;
        } else if (data.success && data.tiendas) {
          // Response with { success: true, tiendas: [...] }
          stores = data.tiendas;
        } else if (data.success && data.stores) {
          // Response with { success: true, stores: [...] }
          stores = data.stores;
        } else {
          // Try to use whatever was returned
          stores = data;
        }
        
        console.log('🏪 Processed stores:', stores);
        console.log('🏪 Stores count:', stores.length);
        console.log('🏪 First store:', stores[0]);
        
        if (!Array.isArray(stores)) {
          console.error('❌ Stores is not an array:', stores);
          return;
        }
        
        // Flatten all products from all stores
        const products = stores.flatMap(store => {
          if (!store || !store.products) {
            console.warn('⚠️ Store without products:', store);
            return [];
          }
          
          return store.products.map(product => ({
            ...product,
            storeName: store.name || 'Unknown Store',
            storeTag: store.tag || 'N/A',
            storeId: store._id || 'unknown',
            contractType: store.contractType || 'Unknown',
            contractValue: store.contractValue || 0
          }));
        });
        
        console.log('📊 Total products found:', products.length);
        console.log('📊 Sample product:', products[0]);
        
        setAllProducts(products);
        setFilteredProducts(products);
        
      } catch (err) {
        console.error("❌ Error fetching stores:", err);
        // Show error in UI
        setAllProducts([]);
        setFilteredProducts([]);
      }
    };

    fetchStores();
  }, [API_URL]);

  useEffect(() => {
    let filtered = allProducts.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.clave.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.storeName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply filters
    if (filters.activo !== null) {
      filtered = filtered.filter(product => 
        filters.activo ? product.quantity > 0 : product.quantity === 0
      );
    }

    if (filters.producto.length > 0) {
      filtered = filtered.filter(product => 
        filters.producto.includes(product.name)
      );
    }

    if (filters.marca.length > 0) {
      filtered = filtered.filter(product => 
        filters.marca.includes(product.storeName)
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      if (filters.precioVenta === 'asc') return (a.price || 0) - (b.price || 0);
      if (filters.precioVenta === 'desc') return (b.price || 0) - (a.price || 0);
      
      if (filters.participacion === 'asc') return calculateParticipacion(a) - calculateParticipacion(b);
      if (filters.participacion === 'desc') return calculateParticipacion(b) - calculateParticipacion(a);
      
      if (filters.totalParticipante === 'asc') return calculateTotalParticipante(a, calculateParticipacion(a)) - calculateTotalParticipante(b, calculateParticipacion(b));
      if (filters.totalParticipante === 'desc') return calculateTotalParticipante(b, calculateParticipacion(b)) - calculateTotalParticipante(a, calculateParticipacion(a));
      
      if (filters.piezas === 'asc') return (a.quantity || 0) - (b.quantity || 0);
      if (filters.piezas === 'desc') return (b.quantity || 0) - (a.quantity || 0);
      
      if (filters.totalEstetica === 'asc') return calculateTotalEstetica(a, calculateTotalParticipante(a, calculateParticipacion(a))) - calculateTotalEstetica(b, calculateTotalParticipante(b, calculateParticipacion(b)));
      if (filters.totalEstetica === 'desc') return calculateTotalEstetica(b, calculateTotalParticipante(b, calculateParticipacion(b))) - calculateTotalEstetica(a, calculateTotalParticipante(a, calculateParticipacion(a)));
      
      if (filters.fechaRecepcion === 'asc') return new Date(a.fechaRecepcion || 0) - new Date(b.fechaRecepcion || 0);
      if (filters.fechaRecepcion === 'desc') return new Date(b.fechaRecepcion || 0) - new Date(a.fechaRecepcion || 0);
      
      return 0;
    });

    setFilteredProducts(filtered);
  }, [searchTerm, allProducts, filters]);

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

  // Filter handlers
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setShowFilterDropdown(null);
  };

  const handleMultiSelectFilter = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value) 
        ? prev[filterType].filter(item => item !== value)
        : [...prev[filterType], value]
    }));
  };

  const handleSelectAll = (filterType, allValues) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].length === allValues.length ? [] : allValues
    }));
  };

  const clearFilter = (filterType) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: filterType === 'producto' || filterType === 'marca' ? [] : null
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      activo: null,
      producto: [],
      precioVenta: null,
      participacion: null,
      totalParticipante: null,
      piezas: null,
      totalEstetica: null,
      fechaRecepcion: null,
      marca: []
    });
  };

  // Get unique values for multi-select filters
  const uniqueProductNames = [...new Set(allProducts.map(p => p.name))].sort();

  // Calculate total piezas
  const totalPiezas = filteredProducts.reduce((sum, product) => sum + (product.quantity || 0), 0);

  const FilterDropdown = ({ type, isOpen, onClose }) => {
    if (!isOpen) return null;

    const getFilterContent = () => {
      switch (type) {
        case 'activo':
          return (
            <div style={{ padding: "10px" }}>
              <div style={{ marginBottom: "8px" }}>
                <button
                  onClick={() => handleFilterChange('activo', true)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    background: filters.activo === true ? "#007bff" : "#f8f9fa",
                    color: filters.activo === true ? "white" : "#333",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Sí
                </button>
              </div>
              <div>
                <button
                  onClick={() => handleFilterChange('activo', false)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    background: filters.activo === false ? "#007bff" : "#f8f9fa",
                    color: filters.activo === false ? "white" : "#333",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  No
                </button>
              </div>
            </div>
          );

        case 'producto':
          return (
            <div style={{ padding: "10px", maxHeight: "200px", overflowY: "auto" }}>
              <div style={{ marginBottom: "8px" }}>
                <button
                  onClick={() => handleSelectAll('producto', uniqueProductNames)}
                  style={{
                    width: "100%",
                    padding: "6px",
                    background: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px"
                  }}
                >
                  {filters.producto.length === uniqueProductNames.length ? "Deseleccionar Todos" : "Seleccionar Todos"}
                </button>
              </div>
              {uniqueProductNames.map(name => (
                <div key={name} style={{ marginBottom: "4px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={filters.producto.includes(name)}
                      onChange={() => handleMultiSelectFilter('producto', name)}
                    />
                    <span style={{ fontSize: "14px" }}>{name}</span>
                  </label>
                </div>
              ))}
            </div>
          );

        case 'marca':
          const uniqueStoreTags = [...new Set(allProducts.map(p => p.storeTag))].sort();
          
          return (
            <div style={{ 
              position: "absolute",
              top: "100%",
              left: "100%",
              background: "white",
              border: "1px solid #ddd",
              borderRadius: "4px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              zIndex: 1000,
              width: "125px",
              overflow: "hidden"
            }}>
              <div style={{ 
                padding: "10px", 
                maxHeight: "200px", 
                overflowY: "auto",
                overflowX: "hidden"
              }}>
                <div style={{ marginBottom: "8px" }}>
                  <button
                    onClick={() => handleSelectAll('marca', uniqueStoreTags)}
                    style={{
                      width: "100%",
                      padding: "6px",
                      background: "#6c757d",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {filters.marca.length === uniqueStoreTags.length ? "Deseleccionar Todos" : "Seleccionar Todos"}
                  </button>
                </div>
                {uniqueStoreTags.map(tag => (
                  <div key={tag} style={{ marginBottom: "4px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={filters.marca.includes(tag)}
                        onChange={() => handleMultiSelectFilter('marca', tag)}
                      />
                      <span style={{ 
                        fontSize: "14px", 
                        wordBreak: "break-word",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}>
                        {tag}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          );

        default:
          return (
            <div style={{ padding: "10px" }}>
              <div style={{ marginBottom: "8px" }}>
                <button
                  onClick={() => handleFilterChange(type, 'asc')}
                  style={{
                    width: "100%",
                    padding: "8px",
                    background: filters[type] === 'asc' ? "#007bff" : "#f8f9fa",
                    color: filters[type] === 'asc' ? "white" : "#333",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Ascendente
                </button>
              </div>
              <div>
                <button
                  onClick={() => handleFilterChange(type, 'desc')}
                  style={{
                    width: "100%",
                    padding: "8px",
                    background: filters[type] === 'desc' ? "#007bff" : "#f8f9fa",
                    color: filters[type] === 'desc' ? "white" : "#333",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Descendente
                </button>
              </div>
            </div>
          );
      }
    };

    return (
      <div style={{
        position: "absolute",
        top: "100%",
        left: 0,
        background: "white",
        border: "1px solid #ddd",
        borderRadius: "4px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        zIndex: 1000,
        minWidth: "150px"
      }}>
        {getFilterContent()}
      </div>
    );
  };

  const FilterHeader = ({ title, filterType, hasFilter, style }) => {
    return (
      <th style={{ 
        padding: "10px 6px", 
        textAlign: "center", 
        borderBottom: "2px solid #ddd",
        fontWeight: "bold",
        color: "#333",
        position: "relative",
        fontSize: "12px",
        whiteSpace: "nowrap",
        ...style
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
          <span>{title}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowFilterDropdown(showFilterDropdown === filterType ? null : filterType);
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: hasFilter ? "#007bff" : "#666",
              fontSize: "10px",
              padding: "2px"
            }}
          >
            ▼
          </button>
          {hasFilter && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearFilter(filterType);
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#dc3545",
                fontSize: "8px",
                padding: "1px"
              }}
            >
              ×
            </button>
          )}
        </div>
        {showFilterDropdown === filterType && (
          <FilterDropdown 
            type={filterType} 
            isOpen={true} 
            onClose={() => setShowFilterDropdown(null)} 
          />
        )}
      </th>
    );
  };

  return (
    <div style={{ 
      padding: "20px 5%",
      height: "calc(100vh - 60px)",
      display: "flex",
      flexDirection: "column",
      gap: "15px",
      background: "#f8f9fa",
      overflow: "hidden"
    }}>
      {/* Header - Fixed height */}
      <div style={{
        background: "white",
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "15px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        flexShrink: 0
      }}>
        <h1 style={{ 
          margin: "0 0 8px 0", 
          color: "#333",
          fontSize: "24px",
          fontWeight: "bold"
        }}>
          Inventario General
        </h1>
        <p style={{ color: "#666", margin: 0, fontSize: "14px" }}>
          Vista global de todos los productos en todas las marcas
        </p>
      </div>

      {/* Search and Filter Controls - Fixed height */}
      <div style={{
        background: "white",
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "15px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        flexShrink: 0
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <span style={{ fontWeight: "bold", color: "#333", minWidth: "120px", fontSize: "14px" }}>
            Buscar Producto:
          </span>
          <input
            type="text"
            placeholder="Buscar por producto, clave o marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              fontSize: "14px"
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
                padding: "6px 10px",
                cursor: "pointer",
                fontSize: "12px"
              }}
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Active Filters Display */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
          <span style={{ fontWeight: "bold", color: "#333", fontSize: "12px" }}>Filtros activos:</span>
          {Object.entries(filters).map(([key, value]) => {
            if ((Array.isArray(value) && value.length > 0) || (!Array.isArray(value) && value !== null)) {
              return (
                <span
                  key={key}
                  style={{
                    background: "#007bff",
                    color: "white",
                    padding: "3px 6px",
                    borderRadius: "10px",
                    fontSize: "11px",
                    display: "flex",
                    alignItems: "center",
                    gap: "3px"
                  }}
                >
                  {key}: {Array.isArray(value) ? value.join(', ') : value}
                  <button
                    onClick={() => clearFilter(key)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "white",
                      cursor: "pointer",
                      fontSize: "9px"
                    }}
                  >
                    ×
                  </button>
                </span>
              );
            }
            return null;
          }).filter(Boolean)}
          
          {(Object.values(filters).some(val => 
            (Array.isArray(val) && val.length > 0) || (!Array.isArray(val) && val !== null)
          )) && (
            <button
              onClick={clearAllFilters}
              style={{
                background: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                padding: "3px 6px",
                cursor: "pointer",
                fontSize: "11px"
              }}
            >
              Limpiar Todos
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area - Takes remaining space */}
      <div style={{ 
        display: "flex", 
        gap: "15px", 
        flex: 1,
        minHeight: 0,
        overflow: "hidden"
      }}>
        {/* PRODUCT DETAIL PANEL - 25% (15% shorter) */}
        {selectedProduct && (
          <div style={{
            width: "25%",
            background: "white",
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "15px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            display: "flex",
            flexDirection: "column",
            minWidth: "250px",
            overflow: "hidden",
            height: "85%", // 15% shorter
            alignSelf: "flex-start" // Align to top
          }}>
            {/* CLOSE BUTTON */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h3 style={{ 
                margin: 0, 
                color: "#333",
                fontSize: "16px"
              }}>
                Detalles del Producto
              </h3>
              <button
                onClick={closePreview}
                style={{
                  background: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  padding: "4px 8px",
                  fontSize: "11px"
                }}
              >
                Cerrar
              </button>
            </div>

            {selectedProduct.imageUrl && (
              <img
                src={selectedProduct.imageUrl?.startsWith('http') 
                ? selectedProduct.imageUrl  // Vercel Blob URL
                : `${API_URL}${selectedProduct.imageUrl}`}  // Local URL
                alt="producto"
                style={{
                  width: "100%",
                  borderRadius: "6px",
                  marginBottom: "15px",
                  maxHeight: "150px",
                  objectFit: "contain"
                }}
              />
            )}

            {/* PRODUCT DETAILS - Scrollable if needed */}
            <div style={{
              background: "#f8f9fa",
              border: "1px solid #e9ecef",
              borderRadius: "6px",
              padding: "12px",
              flex: 1,
              overflow: "auto"
            }}>
              <div style={{ marginBottom: "12px" }}>
                <strong style={{ color: "#333", fontSize: "13px" }}>Nombre:</strong>
                <p style={{ margin: "4px 0 0 0", fontSize: "14px", fontWeight: "bold" }}>
                  {selectedProduct.name}
                </p>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <strong style={{ color: "#333", fontSize: "13px" }}>Clave:</strong>
                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#666" }}>
                  {selectedProduct.clave}
                </p>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <strong style={{ color: "#333", fontSize: "13px" }}>Precio:</strong>
                <p style={{ 
                  margin: "4px 0 0 0", 
                  fontSize: "16px", 
                  fontWeight: "bold", 
                  color: "#28a745" 
                }}>
                  ${selectedProduct.price?.toFixed(2) || "0.00"}
                </p>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <strong style={{ color: "#333", fontSize: "13px" }}>Marca:</strong>
                <p 
                  style={{
                    margin: "4px 0 0 0",
                    cursor: "pointer",
                    color: "#007bff",
                    textDecoration: "underline",
                    fontWeight: "bold",
                    fontSize: "13px"
                  }}
                  onClick={() => handleStoreClick(selectedProduct.storeTag)}
                >
                  {selectedProduct.storeName}
                </p>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <strong style={{ color: "#333", fontSize: "13px" }}>Cantidad:</strong>
                <p style={{ 
                  margin: "4px 0 0 0", 
                  fontSize: "14px", 
                  fontWeight: "bold",
                  color: selectedProduct.quantity > 0 ? "#28a745" : "#dc3545"
                }}>
                  {selectedProduct.quantity} piezas
                </p>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <strong style={{ color: "#333", fontSize: "13px" }}>Fecha Recepción:</strong>
                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#666" }}>
                  {formatDate(selectedProduct.fechaRecepcion)}
                </p>
              </div>

              {selectedProduct.description && (
                <div>
                  <strong style={{ color: "#333", fontSize: "13px" }}>Descripción:</strong>
                  <p style={{ 
                    margin: "4px 0 0 0", 
                    fontSize: "12px",
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

        {/* INVENTORY TABLE PANEL - 75% (15% shorter) */}
        <div style={{ 
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
          height: "85%" // 15% shorter
        }}>
          {/* Table Container - Takes all available space */}
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
            {/* Table with vertical scrolling only */}
            <div style={{ 
              overflow: "auto",
              flex: 1
            }}>
              <table style={{ 
                width: "100%", 
                borderCollapse: "collapse",
                tableLayout: "fixed"
              }}>
                <thead>
                  <tr style={{ background: "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>
                    <FilterHeader title="Activo" filterType="activo" hasFilter={filters.activo !== null} style={{ width: "60px" }} />
                    <FilterHeader title="Producto" filterType="producto" hasFilter={filters.producto.length > 0} style={{ textAlign: "center" }}/>
                    <FilterHeader title="Precio" filterType="precioVenta" hasFilter={filters.precioVenta !== null} style={{ width: "100px" }}/>
                    <FilterHeader title="% Marca" filterType="participacion" hasFilter={filters.participacion !== null} style={{ width: "60px" }}/>
                    <FilterHeader title="Total Marca" filterType="totalParticipante" hasFilter={filters.totalParticipante !== null} style={{ width: "100px" }}/>
                    <FilterHeader title="Piezas" filterType="piezas" hasFilter={filters.piezas !== null} style={{ width: "60px" }}/>
                    <FilterHeader title="Total Estetica" filterType="totalEstetica" hasFilter={filters.totalEstetica !== null} style={{ width: "100px" }}/>
                    <FilterHeader title="Fecha" filterType="fechaRecepcion" hasFilter={filters.fechaRecepcion !== null} style={{ width: "60px" }}/>
                    <FilterHeader title="Marca" filterType="marca" hasFilter={filters.marca.length > 0} style={{ textAlign: "center" }}/>
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
                        <td style={{ padding: "8px 4px", textAlign: "center", borderBottom: "1px solid #eee", fontSize: "11px" }}>
                          <span
                            style={{
                              padding: "2px 4px",
                              borderRadius: "8px",
                              fontSize: "10px",
                              fontWeight: "bold",
                              backgroundColor: isActive ? "#d4edda" : "#f8d7da",
                              color: isActive ? "#155724" : "#721c24",
                              border: `1px solid ${isActive ? "#c3e6cb" : "#f5c6cb"}`
                            }}
                          >
                            {isActive ? "Sí" : "No"}
                          </span>
                        </td>
                        <td style={{ padding: "8px 4px", borderBottom: "1px solid #eee", fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",textAlign: "center" }}>
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
                          <div style={{ fontSize: "9px", color: "#666" }}>
                            {product.clave}
                          </div>
                        </td>
                        <td style={{ 
                          padding: "8px 4px", 
                          textAlign: "center", 
                          borderBottom: "1px solid #eee", 
                          fontWeight: "bold", 
                          color: "#28a745",
                          fontSize: "11px"
                        }}>
                          ${parseFloat(product.price || 0).toFixed(2)}
                        </td>
                        <td style={{ 
                          padding: "8px 4px", 
                          textAlign: "center", 
                          borderBottom: "1px solid #eee", 
                          fontWeight: "bold",
                          fontSize: "11px"
                        }}>
                          {participacion}%
                        </td>
                        <td style={{ 
                          padding: "8px 4px", 
                          textAlign: "center", 
                          borderBottom: "1px solid #eee", 
                          fontWeight: "bold", 
                          color: "#007bff",
                          fontSize: "11px"
                        }}>
                          ${totalParticipante.toFixed(2)}
                        </td>
                        <td style={{ 
                          padding: "8px 4px", 
                          textAlign: "center", 
                          borderBottom: "1px solid #eee", 
                          fontWeight: "bold",
                          fontSize: "11px"
                        }}>
                          {product.quantity}
                        </td>
                        <td style={{ 
                          padding: "8px 4px", 
                          textAlign: "center", 
                          borderBottom: "1px solid #eee", 
                          fontWeight: "bold", 
                          color: "#6f42c1",
                          fontSize: "11px"
                        }}>
                          ${totalEstetica.toFixed(2)}
                        </td>
                        <td style={{ 
                          padding: "8px 4px", 
                          textAlign: "center", 
                          borderBottom: "1px solid #eee",
                          fontSize: "11px"
                        }}>
                          {formatDate(product.fechaRecepcion)}
                        </td>
                        <td style={{ 
                          padding: "8px 4px", 
                          textAlign: "center", 
                          borderBottom: "1px solid #eee",
                          fontSize: "11px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}>
                          <span
                            style={{
                              cursor: "pointer",
                              color: "#007bff",
                              fontWeight: "bold",
                              textDecoration: "underline"
                            }}
                            onClick={() => handleStoreClick(product.storeTag)}
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
                background: "white",
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                {searchTerm ? "No se encontraron productos que coincidan con la búsqueda." : "No hay productos registrados en el inventario."}
              </div>
            )}
          </div>

          {/* Summary Statistics - Fixed height */}
          {filteredProducts.length > 0 && (
            <div style={{
              marginTop: "12px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "12px",
              flexShrink: 0
            }}>
              <div style={{
                background: "white",
                border: "1px solid #ddd",
                borderRadius: "6px",
                padding: "12px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                textAlign: "center"
              }}>
                <h3 style={{ margin: "0 0 6px 0", color: "#333", fontSize: "12px" }}>
                  Total Productos
                </h3>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: "#007bff" }}>
                  {filteredProducts.length}
                </div>
              </div>

              <div style={{
                background: "white",
                border: "1px solid #ddd",
                borderRadius: "6px",
                padding: "12px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                textAlign: "center"
              }}>
                <h3 style={{ margin: "0 0 6px 0", color: "#333", fontSize: "12px" }}>
                  Total Piezas
                </h3>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: "#28a745" }}>
                  {totalPiezas}
                </div>
              </div>

              <div style={{
                background: "white",
                border: "1px solid #ddd",
                borderRadius: "6px",
                padding: "12px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                textAlign: "center"
              }}>
                <h3 style={{ margin: "0 0 6px 0", color: "#333", fontSize: "12px" }}>
                  Total Marcas
                </h3>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: "#6f42c1" }}>
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