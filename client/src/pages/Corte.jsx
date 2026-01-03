import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Corte = ({ user }) => {
  const [generatingCorte, setGeneratingCorte] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [cortes, setCortes] = useState([]);
  const [selectedCorte, setSelectedCorte] = useState(null);
  const [showCorteDetails, setShowCorteDetails] = useState(false);
  const [corteSummary, setCorteSummary] = useState(null);

  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    setDateRange({
      startDate: firstDay.toISOString().split('T')[0],
      endDate: lastDay.toISOString().split('T')[0]
    });
  }, []);

  useEffect(() => {
    fetchCortes();
  }, []);

  const fetchCortes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/cortes', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCortes(response.data);
    } catch (err) {
      console.error('Error fetching cortes:', err);
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
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculatePostComision = (venta) => {
    const tarjetaAmount = venta.amountTarjeta || 0;
    const comision = tarjetaAmount * 0.046;
    return venta.amount - comision;
  };

  const calculateDineroMarca = (venta) => {
    const postComision = calculatePostComision(venta);
    const contrato = venta.storeContractType || 'DCE';
    const contractValue = venta.storeContractValue || 0;
    
    if (contrato === 'DCE' || contrato === 'Piso') {
      return postComision;
    } else if (contrato === 'Porcentaje') {
      return postComision * (1 - contractValue/100);
    } else if (contrato === 'Estetica Unisex') {
      return postComision;
    }
    return postComision;
  };

  const calculateDineroTienda = (venta) => {
    const postComision = calculatePostComision(venta);
    const contrato = venta.storeContractType || 'DCE';
    const contractValue = venta.storeContractValue || 0;
    
    if (contrato === 'DCE' || contrato === 'Piso') {
      return 0;
    } else if (contrato === 'Porcentaje') {
      return postComision * (contractValue/100);
    } else if (contrato === 'Estetica Unisex') {
      return postComision;
    }
    return 0;
  };

  const calculateComisiones = (venta) => {
    const tarjetaAmount = venta.amountTarjeta || 0;
    return tarjetaAmount * 0.046;
  };

    const handleGenerateCorte = async () => {
    setGeneratingCorte(true);
    setError('');
    setSuccess('');

    try {
        if (!dateRange.startDate || !dateRange.endDate) {
        throw new Error('Debe especificar el rango de fechas');
        }

        const token = localStorage.getItem('token');
        console.log('Token exists:', !!token);
        console.log('Sending request with:', { 
        startDate: dateRange.startDate, 
        endDate: dateRange.endDate 
        });

        // Convert dates to the format your Venta model uses (DD/MM/YYYY)
        const convertToVentaFormat = (dateStr) => {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
        };

        const ventaStartDate = convertToVentaFormat(dateRange.startDate);
        const ventaEndDate = convertToVentaFormat(dateRange.endDate);

        console.log('Converted dates for Venta query:', {
        ventaStartDate,
        ventaEndDate
        });

        const response = await axios.post('http://localhost:5000/api/cortes/generar', 
        {
            startDate: ventaStartDate,  // Send in DD/MM/YYYY format
            endDate: ventaEndDate       // Send in DD/MM/YYYY format
        },
        {
            headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
            }
        }
        );

        console.log('Response:', response.data);

        if (response.data) {
        setSuccess(`Corte mensual generado exitosamente! ID: ${response.data.corteId}`);
        fetchCortes(); // Refresh cortes list
        setShowConfirmModal(false);
        
        setTimeout(() => {
            setSuccess('');
        }, 5000);
        }
    } catch (err) {
        console.error('Full error details:', err);
        console.error('Error response:', err.response);
        console.error('Error message:', err.message);
        
        if (err.response) {
        // Server responded with error
        setError(`Error ${err.response.status}: ${err.response.data?.error || err.message}`);
        } else if (err.request) {
        // Request made but no response
        setError('No se recibió respuesta del servidor. Verifica que el servidor esté corriendo.');
        } else {
        // Something else happened
        setError(err.message || 'Error al generar el corte');
        }
    } finally {
        setGeneratingCorte(false);
    }
    };

  const handleViewCorteDetails = async (corte) => {
    setSelectedCorte(corte);
    setShowCorteDetails(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/cortes/${corte._id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setCorteSummary(response.data);
    } catch (err) {
      console.error('Error fetching corte details:', err);
      setError('Error al cargar los detalles del corte');
    }
  };

  const calculateCorteId = () => {
    const start = new Date(dateRange.startDate);
    const month = start.getMonth() + 1;
    const year = start.getFullYear().toString().slice(-2);
    
    return `${month.toString().padStart(2, '0')}${year}`;
  };

  const containerStyles = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem',
  };

  const cardStyles = {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    padding: '2.5rem',
    marginBottom: '2rem',
  };

  const headingStyles = {
    color: '#333',
    marginBottom: '2rem',
    textAlign: 'center',
    fontSize: '1.8rem',
  };

  const sectionStyles = {
    marginBottom: '2rem',
    paddingBottom: '1.5rem',
    borderBottom: '1px solid #eaeaea',
  };

  const sectionTitleStyles = {
    color: '#555',
    marginBottom: '1rem',
    fontSize: '1.2rem',
    fontWeight: '600',
  };

  const formGroupStyles = {
    marginBottom: '1.5rem',
  };

  const labelStyles = {
    display: 'block',
    marginBottom: '0.5rem',
    color: '#555',
    fontWeight: '500',
  };

  const inputStyles = {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '1rem',
    transition: 'border-color 0.2s',
  };

  const dateRangeContainerStyles = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginBottom: '2rem',
  };

  const dateInfoStyles = {
    background: '#f8f9fa',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1.5rem',
    border: '1px solid #eaeaea',
  };

  const alertStyles = {
    padding: '1rem',
    borderRadius: '6px',
    marginBottom: '1.5rem',
    fontWeight: '500',
  };

  const alertErrorStyles = {
    ...alertStyles,
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb',
  };

  const alertSuccessStyles = {
    ...alertStyles,
    backgroundColor: '#d4edda',
    color: '#155724',
    border: '1px solid #c3e6cb',
  };

  const alertWarningStyles = {
    ...alertStyles,
    backgroundColor: '#fff3cd',
    color: '#856404',
    border: '1px solid #ffeaa7',
  };

  const buttonBaseStyles = {
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    minWidth: '120px',
  };

  const primaryButtonStyles = {
    ...buttonBaseStyles,
    backgroundColor: '#007bff',
    color: 'white',
  };

  const secondaryButtonStyles = {
    ...buttonBaseStyles,
    backgroundColor: '#6c757d',
    color: 'white',
  };

  const dangerButtonStyles = {
    ...buttonBaseStyles,
    backgroundColor: '#dc3545',
    color: 'white',
  };

  // Table styles
  const tableContainerStyles = {
    marginTop: '1rem',
    overflowX: 'auto',
  };

  const tableStyles = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.95rem',
  };

  const thStyles = {
    backgroundColor: '#f8f9fa',
    padding: '0.75rem 1rem',
    textAlign: 'left',
    borderBottom: '2px solid #dee2e6',
    color: '#555',
    fontWeight: '600',
  };

  const tdStyles = {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #dee2e6',
    verticalAlign: 'middle',
  };

  // Modal styles
  const modalOverlayStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  };

  const modalContentStyles = {
    background: 'white',
    borderRadius: '12px',
    padding: '2rem',
    width: '500px',
    maxWidth: '90%',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
  };

  const modalHeaderStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  };

  const modalTitleStyles = {
    fontSize: '1.3rem',
    color: '#333',
    margin: 0,
  };

  const closeButtonStyles = {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#666',
  };

  const modalActionsStyles = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    marginTop: '2rem',
  };

  // Summary card styles
  const summaryCardStyles = {
    background: '#f8f9fa',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '1rem',
    border: '1px solid #eaeaea',
  };

  const summaryRowStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0',
    borderBottom: '1px solid #eaeaea',
  };

  const summaryLabelStyles = {
    fontWeight: '500',
    color: '#555',
  };

  const summaryValueStyles = {
    fontWeight: 'bold',
    fontSize: '1.1rem',
  };

  const marcaCardStyles = {
    background: 'white',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem',
    border: '1px solid #eaeaea',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  };

  return (
    <div style={containerStyles}>
      <div style={cardStyles}>
        <h1 style={headingStyles}>Generar Corte Mensual</h1>
        
        {error && <div style={alertErrorStyles}>{error}</div>}
        {success && <div style={alertSuccessStyles}>{success}</div>}
        
        <div style={sectionStyles}>
          <h3 style={sectionTitleStyles}>Configurar Fechas del Corte</h3>
          
          <div style={dateRangeContainerStyles}>
            <div style={formGroupStyles}>
              <label htmlFor="startDate" style={labelStyles}>
                Fecha de Inicio *
              </label>
              <input
                type="date"
                id="startDate"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                required
                style={inputStyles}
              />
            </div>
            
            <div style={formGroupStyles}>
              <label htmlFor="endDate" style={labelStyles}>
                Fecha de Fin *
              </label>
              <input
                type="date"
                id="endDate"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                required
                style={inputStyles}
              />
            </div>
          </div>
          
          <div style={dateInfoStyles}>
            <div style={summaryRowStyles}>
              <span style={summaryLabelStyles}>Período seleccionado:</span>
              <span style={summaryValueStyles}>
                {dateRange.startDate && dateRange.endDate 
                  ? `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`
                  : 'No especificado'
                }
              </span>
            </div>
            <div style={summaryRowStyles}>
              <span style={summaryLabelStyles}>ID del Corte:</span>
              <span style={{ 
                ...summaryValueStyles, 
                backgroundColor: '#007bff',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}>
                {calculateCorteId()}
              </span>
            </div>
          </div>
          
          <div style={alertWarningStyles}>
            <strong>⚠️ Importante:</strong> Una vez generado el corte, no se podrán registrar ventas 
            para el mes correspondiente. Verifique cuidadosamente las fechas antes de continuar.
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '2rem'
        }}>
          <button
            style={{
              ...primaryButtonStyles,
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              opacity: generatingCorte ? 0.6 : 1,
              cursor: generatingCorte ? 'not-allowed' : 'pointer',
            }}
            onClick={() => setShowConfirmModal(true)}
            disabled={generatingCorte || !dateRange.startDate || !dateRange.endDate}
            onMouseEnter={(e) => {
              if (!generatingCorte) {
                e.target.style.backgroundColor = '#0056b3';
                e.target.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!generatingCorte) {
                e.target.style.backgroundColor = '#007bff';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            {generatingCorte ? 'Procesando...' : 'Generar Corte Mensual'}
          </button>
        </div>
      </div>
      
      {/* Cortes History Section */}
      <div style={cardStyles}>
        <h2 style={sectionTitleStyles}>Cortes Generados Anteriormente</h2>
        
        {cortes.length > 0 ? (
          <div style={tableContainerStyles}>
            <table style={tableStyles}>
              <thead>
                <tr>
                  <th style={thStyles}>ID del Corte</th>
                  <th style={thStyles}>Período</th>
                  <th style={thStyles}>Total Ventas</th>
                  <th style={thStyles}>Comisiones</th>
                  <th style={thStyles}>Total Marcas</th>
                  <th style={thStyles}>Total Tienda</th>
                  <th style={thStyles}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cortes.map((corte) => (
                  <tr key={corte._id}>
                    <td style={tdStyles}>
                      <span style={{
                        backgroundColor: '#007bff',
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold'
                      }}>
                        {corte.corteId}
                      </span>
                    </td>
                    <td style={tdStyles}>
                      {formatDate(corte.startDate)} - {formatDate(corte.endDate)}
                    </td>
                    <td style={tdStyles}>
                      <div style={{ fontWeight: 'bold', color: '#28a745' }}>
                        {formatCurrency(corte.totalVentas || 0)}
                      </div>
                    </td>
                    <td style={tdStyles}>
                      <div style={{ fontWeight: 'bold', color: '#ff6b35' }}>
                        {formatCurrency(corte.totalComisiones || 0)}
                      </div>
                    </td>
                    <td style={tdStyles}>
                      <div style={{ fontWeight: 'bold', color: '#0066cc' }}>
                        {formatCurrency(corte.totalMarcas || 0)}
                      </div>
                    </td>
                    <td style={tdStyles}>
                      <div style={{ fontWeight: 'bold', color: '#6f42c1' }}>
                        {formatCurrency(corte.totalTienda || 0)}
                      </div>
                    </td>
                    <td style={tdStyles}>
                      <button
                        style={{
                          ...secondaryButtonStyles,
                          padding: '0.4rem 0.8rem',
                          fontSize: '0.85rem',
                        }}
                        onClick={() => handleViewCorteDetails(corte)}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#545b62'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
                      >
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#666',
            background: '#f8f9fa',
            borderRadius: '8px'
          }}>
            No hay cortes generados aún
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={modalOverlayStyles}>
          <div style={modalContentStyles}>
            <div style={modalHeaderStyles}>
              <h2 style={modalTitleStyles}>Confirmar Generación de Corte</h2>
              <button
                style={closeButtonStyles}
                onClick={() => setShowConfirmModal(false)}
                disabled={generatingCorte}
              >
                ×
              </button>
            </div>
            
            <div style={alertWarningStyles}>
              <strong>⚠️ ADVERTENCIA:</strong> Una vez generado el corte no se podrán registrar 
              ventas para el mes correspondiente ({calculateCorteId()}).
            </div>
            
            <div style={summaryCardStyles}>
              <div style={summaryRowStyles}>
                <span style={summaryLabelStyles}>ID del Corte:</span>
                <span style={{ ...summaryValueStyles, color: '#007bff' }}>
                  {calculateCorteId()}
                </span>
              </div>
              <div style={summaryRowStyles}>
                <span style={summaryLabelStyles}>Período:</span>
                <span style={summaryValueStyles}>
                  {formatDate(dateRange.startDate)} - {formatDate(dateRange.endDate)}
                </span>
              </div>
            </div>
            
            <div style={modalActionsStyles}>
              <button
                style={{
                  ...secondaryButtonStyles,
                  opacity: generatingCorte ? 0.6 : 1,
                  cursor: generatingCorte ? 'not-allowed' : 'pointer',
                }}
                onClick={() => setShowConfirmModal(false)}
                disabled={generatingCorte}
              >
                Cancelar
              </button>
              <button
                style={{
                  ...dangerButtonStyles,
                  opacity: generatingCorte ? 0.6 : 1,
                  cursor: generatingCorte ? 'not-allowed' : 'pointer',
                }}
                onClick={handleGenerateCorte}
                disabled={generatingCorte}
                onMouseEnter={(e) => {
                  if (!generatingCorte) {
                    e.target.style.backgroundColor = '#c82333';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!generatingCorte) {
                    e.target.style.backgroundColor = '#dc3545';
                  }
                }}
              >
                {generatingCorte ? 'Generando...' : 'Confirmar y Generar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Corte Details Modal */}
      {showCorteDetails && selectedCorte && (
        <div style={modalOverlayStyles}>
          <div style={{
            ...modalContentStyles,
            width: '800px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={modalHeaderStyles}>
              <h2 style={modalTitleStyles}>
                Detalles del Corte: {selectedCorte.corteId}
              </h2>
              <button
                style={closeButtonStyles}
                onClick={() => {
                  setShowCorteDetails(false);
                  setSelectedCorte(null);
                  setCorteSummary(null);
                }}
              >
                ×
              </button>
            </div>
            
            <div style={summaryCardStyles}>
              <div style={summaryRowStyles}>
                <span style={summaryLabelStyles}>Período:</span>
                <span style={summaryValueStyles}>
                  {formatDate(selectedCorte.startDate)} - {formatDate(selectedCorte.endDate)}
                </span>
              </div>
              <div style={summaryRowStyles}>
                <span style={summaryLabelStyles}>Fecha de Generación:</span>
                <span style={summaryValueStyles}>
                  {formatDate(selectedCorte.createdAt)}
                </span>
              </div>
            </div>
            
            {corteSummary ? (
              <>
                {/* Summary Statistics */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginBottom: '2rem'
                }}>
                  <div style={{
                    background: '#d4edda',
                    borderRadius: '8px',
                    padding: '1rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.9rem', color: '#155724', marginBottom: '0.5rem' }}>
                      Total Ventas
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#155724' }}>
                      {formatCurrency(corteSummary.totalVentas || 0)}
                    </div>
                  </div>
                  
                  <div style={{
                    background: '#f8d7da',
                    borderRadius: '8px',
                    padding: '1rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.9rem', color: '#721c24', marginBottom: '0.5rem' }}>
                      Comisiones Tarjeta
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#721c24' }}>
                      {formatCurrency(corteSummary.totalComisiones || 0)}
                    </div>
                  </div>
                  
                  <div style={{
                    background: '#cce5ff',
                    borderRadius: '8px',
                    padding: '1rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.9rem', color: '#004085', marginBottom: '0.5rem' }}>
                      Total Marcas
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#004085' }}>
                      {formatCurrency(corteSummary.totalMarcas || 0)}
                    </div>
                  </div>
                  
                  <div style={{
                    background: '#e2d9f3',
                    borderRadius: '8px',
                    padding: '1rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.9rem', color: '#4a3f69', marginBottom: '0.5rem' }}>
                      Total Tienda
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4a3f69' }}>
                      {formatCurrency(corteSummary.totalTienda || 0)}
                    </div>
                  </div>
                </div>
                
                {/* Brands Breakdown */}
                {corteSummary.marcas && corteSummary.marcas.length > 0 && (
                  <div style={sectionStyles}>
                    <h3 style={sectionTitleStyles}>Desglose por Marca</h3>
                    {corteSummary.marcas.map((marca, index) => (
                      <div key={index} style={marcaCardStyles}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.5rem'
                        }}>
                          <div>
                            <strong style={{ fontSize: '1.1rem' }}>
                              {marca.marcaName}
                            </strong>
                            <div style={{ fontSize: '0.9rem', color: '#666' }}>
                              Contrato: {marca.contratoType}
                              {marca.contratoValue > 0 && ` (${marca.contratoValue}%)`}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#0066cc' }}>
                              {formatCurrency(marca.totalMarca)}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>
                              {marca.numVentas} venta(s)
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Sales List */}
                {corteSummary.ventas && corteSummary.ventas.length > 0 && (
                  <div style={sectionStyles}>
                    <h3 style={sectionTitleStyles}>Ventas Incluidas ({corteSummary.ventas.length})</h3>
                    <div style={tableContainerStyles}>
                      <table style={tableStyles}>
                        <thead>
                          <tr>
                            <th style={thStyles}>Fecha</th>
                            <th style={thStyles}>Marca</th>
                            <th style={thStyles}>Monto</th>
                            <th style={thStyles}>Comisión</th>
                            <th style={thStyles}>Marca</th>
                            <th style={thStyles}>Tienda</th>
                          </tr>
                        </thead>
                        <tbody>
                          {corteSummary.ventas.map((venta, index) => (
                            <tr key={index}>
                              <td style={tdStyles}>{venta.date}</td>
                              <td style={tdStyles}>{venta.store?.name || 'N/A'}</td>
                              <td style={tdStyles}>
                                <div style={{ fontWeight: 'bold', color: '#28a745' }}>
                                  {formatCurrency(venta.amount)}
                                </div>
                              </td>
                              <td style={tdStyles}>
                                <div style={{ color: '#ff6b35' }}>
                                  {formatCurrency(calculateComisiones(venta))}
                                </div>
                              </td>
                              <td style={tdStyles}>
                                <div style={{ fontWeight: 'bold', color: '#0066cc' }}>
                                  {formatCurrency(calculateDineroMarca(venta))}
                                </div>
                              </td>
                              <td style={tdStyles}>
                                <div style={{ fontWeight: 'bold', color: '#6f42c1' }}>
                                  {formatCurrency(calculateDineroTienda(venta))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                Cargando detalles del corte...
              </div>
            )}
            
            <div style={modalActionsStyles}>
              <button
                style={secondaryButtonStyles}
                onClick={() => {
                  setShowCorteDetails(false);
                  setSelectedCorte(null);
                  setCorteSummary(null);
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Corte;