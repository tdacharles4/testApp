import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CrearUsuario = ({ user }) => {
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'user', // Default to 'user'
    permissions: {
      administrador: false,
      tienda: false
    },
    ligarTienda: false,
    tiendaId: '',
    tiendaName: ''
  });

  // List of tiendas/marcas
  const [tiendas, setTiendas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch tiendas/marcas on component mount
  useEffect(() => {
    const fetchTiendas = async () => {
      try {
        // Assuming your endpoint is /api/tiendas
        const response = await axios.get('http://localhost:5000/api/tiendas');
        setTiendas(response.data);
      } catch (err) {
        console.error('Error fetching tiendas:', err);
        setError('Error al cargar las tiendas/marcas');
      }
    };
    
    fetchTiendas();
  }, []);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('permissions.')) {
      const permType = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          [permType]: checked
        }
      }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (type === 'radio') {
      // Handle radio button for role
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle tienda/marca selection
  const handleTiendaChange = (e) => {
    const selectedTiendaId = e.target.value;
    const selectedTienda = tiendas.find(tienda => tienda._id === selectedTiendaId);
    
    setFormData(prev => ({
      ...prev,
      tiendaId: selectedTiendaId,
      tiendaName: selectedTienda ? `${selectedTienda.tag} - ${selectedTienda.name}` : ''
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validation
      if (!formData.username || !formData.password || !formData.name) {
        throw new Error('Por favor completa todos los campos obligatorios');
      }

      if (formData.ligarTienda && !formData.tiendaId) {
        throw new Error('Debe seleccionar una tienda/marca');
      }

      // Prepare data for API
      const userData = {
        username: formData.username,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        permissions: formData.permissions
      };

      // Add tienda if selected
      if (formData.ligarTienda && formData.tiendaId) {
        userData.tiendaId = formData.tiendaId;
        userData.tiendaName = formData.tiendaName;
      }

      // Send request with auth token
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/users', userData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data) {
        setSuccess('Usuario creado exitosamente!');
        setFormData({
          username: '',
          password: '',
          name: '',
          role: 'user',
          permissions: {
            administrador: false,
            tienda: false
          },
          ligarTienda: false,
          tiendaId: '',
          tiendaName: ''
        });
        
        // Reset after 3 seconds
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error al crear usuario');
    } finally {
      setLoading(false);
    }
  };

  // Container styles
  const containerStyles = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem',
  };

  const cardStyles = {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    padding: '2.5rem',
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

  const inputFocusStyles = {
    outline: 'none',
    borderColor: '#007bff',
    boxShadow: '0 0 0 2px rgba(0, 123, 255, 0.1)',
  };

  const checkboxGroupStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  };

  const radioGroupStyles = {
    display: 'flex',
    gap: '2rem',
    marginTop: '0.5rem',
  };

  const radioLabelStyles = {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    gap: '0.5rem',
  };

  const checkboxLabelStyles = {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  };

  const checkboxInputStyles = {
    width: '18px',
    height: '18px',
    marginRight: '0.75rem',
    cursor: 'pointer',
  };

  const radioInputStyles = {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  };

  const formActionsStyles = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    marginTop: '2rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid #eaeaea',
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

  return (
    <div style={containerStyles}>
      <div style={cardStyles}>
        <h1 style={headingStyles}>Crear Nuevo Usuario</h1>
        
        {error && <div style={alertErrorStyles}>{error}</div>}
        {success && <div style={alertSuccessStyles}>{success}</div>}
        
        <form onSubmit={handleSubmit}>
          {/* Basic Info */}
          <div style={sectionStyles}>
            <h3 style={sectionTitleStyles}>Información Básica</h3>
            
            <div style={formGroupStyles}>
              <label htmlFor="username" style={labelStyles}>
                Nombre de Usuario *
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                placeholder="juan.perez"
                style={inputStyles}
                onFocus={(e) => e.target.style = { ...inputStyles, ...inputFocusStyles }}
                onBlur={(e) => e.target.style = inputStyles}
              />
            </div>

            <div style={formGroupStyles}>
              <label htmlFor="password" style={labelStyles}>
                Contraseña *
              </label>
              <input
                type="text"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength="6"
                style={inputStyles}
                onFocus={(e) => e.target.style = { ...inputStyles, ...inputFocusStyles }}
                onBlur={(e) => e.target.style = inputStyles}
              />
            </div>

            <div style={formGroupStyles}>
              <label htmlFor="name" style={labelStyles}>
                Nombre Completo *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Juan Pérez"
                style={inputStyles}
                onFocus={(e) => e.target.style = { ...inputStyles, ...inputFocusStyles }}
                onBlur={(e) => e.target.style = inputStyles}
              />
            </div>

            {/* Radio buttons for Role */}
            <div style={formGroupStyles}>
              <label style={labelStyles}>Rol *</label>
              <div style={radioGroupStyles}>
                <label style={radioLabelStyles}>
                  <input
                    type="radio"
                    name="role"
                    value="user"
                    checked={formData.role === 'user'}
                    onChange={handleInputChange}
                    style={radioInputStyles}
                  />
                  <span>Tienda</span>
                </label>
                
                <label style={radioLabelStyles}>
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={formData.role === 'admin'}
                    onChange={handleInputChange}
                    style={radioInputStyles}
                  />
                  <span>Administrador</span>
                </label>
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div style={sectionStyles}>
            <h3 style={sectionTitleStyles}>Permisos Específicos</h3>
            
            <div style={checkboxGroupStyles}>
              <label style={checkboxLabelStyles}>
                <input
                  type="checkbox"
                  name="permissions.administrador"
                  checked={formData.permissions.administrador}
                  onChange={handleInputChange}
                  style={checkboxInputStyles}
                />
                <span>Administrador</span>
              </label>
              
              <label style={checkboxLabelStyles}>
                <input
                  type="checkbox"
                  name="permissions.tienda"
                  checked={formData.permissions.tienda}
                  onChange={handleInputChange}
                  style={checkboxInputStyles}
                />
                <span>Tienda</span>
              </label>
            </div>
          </div>

          {/* Tienda/Marca Link */}
          <div style={sectionStyles}>
            <h3 style={sectionTitleStyles}>Vincular a Marca</h3>
            
            <div style={checkboxGroupStyles}>
              <label style={checkboxLabelStyles}>
                <input
                  type="checkbox"
                  name="ligarTienda"
                  checked={formData.ligarTienda}
                  onChange={handleInputChange}
                  style={checkboxInputStyles}
                />
                <span>Ligar usuario a una marca</span>
              </label>
            </div>

            {formData.ligarTienda && (
              <div style={formGroupStyles}>
                <label htmlFor="tienda" style={labelStyles}>
                  Seleccionar Marca
                </label>
                <select
                  id="tienda"
                  value={formData.tiendaId}
                  onChange={handleTiendaChange}
                  required={formData.ligarTienda}
                  style={inputStyles}
                >
                  <option value="">-- Seleccionar Marca --</option>
                  {tiendas.map((tienda) => (
                    <option key={tienda._id} value={tienda._id}>
                      {tienda.tag} - {tienda.name}
                    </option>
                  ))}
                </select>
                {formData.tiendaName && (
                  <div style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                    Seleccionado: {formData.tiendaName}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div style={formActionsStyles}>
            <button
              type="button"
              style={{
                ...secondaryButtonStyles,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              onClick={() => navigate('/')}
              disabled={loading}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = '#545b62';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = '#6c757d';
                }
              }}
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              style={{
                ...primaryButtonStyles,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              disabled={loading}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = '#0056b3';
                  e.target.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = '#007bff';
                  e.target.style.transform = 'translateY(0)';
                }
              }}
            >
              {loading ? 'Creando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CrearUsuario;