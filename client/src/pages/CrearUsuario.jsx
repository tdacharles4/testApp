import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CrearUsuario = ({ user }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
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

  const [tiendas, setTiendas] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  // Fetch tiendas
  useEffect(() => {
    const fetchTiendas = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/tiendas');
        setTiendas(response.data);
      } catch (err) {
        console.error('Error fetching marcas:', err);
        setError('Error al cargar las marcas');
      }
    };
    
    fetchTiendas();
  }, []);

  // Fetch users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Error al cargar los usuarios');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

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

  const handleTiendaChange = (e) => {
    const selectedTiendaId = e.target.value;
    const selectedTienda = tiendas.find(tienda => tienda._id === selectedTiendaId);
    
    setFormData(prev => ({
      ...prev,
      tiendaId: selectedTiendaId,
      tiendaName: selectedTienda ? `${selectedTienda.tag} - ${selectedTienda.name}` : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!formData.username || !formData.password || !formData.name) {
        throw new Error('Por favor completa todos los campos obligatorios');
      }

      if (formData.ligarTienda && !formData.tiendaId) {
        throw new Error('Debe seleccionar una marca');
      }

      const userData = {
        username: formData.username,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        permissions: formData.permissions
      };

      if (formData.ligarTienda && formData.tiendaId) {
        userData.tiendaId = formData.tiendaId;
        userData.tiendaName = formData.tiendaName;
      }

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
        
        // Refresh the users list
        fetchUsers();
        
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

  // Edit user functions
  const handleEditClick = (user) => {
    setEditingUser(user);
    setEditFormData({
      newPassword: '',
      confirmPassword: ''
    });
    setShowEditModal(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdatePassword = async () => {
    if (!editFormData.newPassword) {
      setError('Por favor ingresa una nueva contraseña');
      return;
    }

    if (editFormData.newPassword !== editFormData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/users/${editingUser._id}`, {
        password: editFormData.newPassword
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setSuccess('Contraseña actualizada exitosamente');
      setShowEditModal(false);
      setEditingUser(null);
      setEditFormData({
        newPassword: '',
        confirmPassword: ''
      });

      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error al actualizar contraseña');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setSuccess('Usuario eliminado exitosamente');
      // Refresh the users list
      fetchUsers();

      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error al eliminar usuario');
    }
  };

  const containerStyles = {
    display: 'flex',
    gap: '2rem',
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '2rem',
  };

  const leftPanelStyles = {
    flex: '1',
    minWidth: '400px',
  };

  const rightPanelStyles = {
    flex: '1',
    minWidth: '400px',
  };

  const cardStyles = {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    padding: '2.5rem',
    height: '100%',
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

  const actionButtonStyles = {
    padding: '0.4rem 0.8rem',
    border: 'none',
    borderRadius: '4px',
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginRight: '0.5rem',
  };

  const editButtonStyles = {
    ...actionButtonStyles,
    backgroundColor: '#17a2b8',
    color: 'white',
  };

  const deleteButtonStyles = {
    ...actionButtonStyles,
    backgroundColor: '#dc3545',
    color: 'white',
  };

  const loadingStyles = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem',
    color: '#666',
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
    width: '400px',
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

  return (
    <div style={containerStyles}>
      {/* Left Panel - Create User Form */}
      <div style={leftPanelStyles}>
        <div style={cardStyles}>
          <h1 style={headingStyles}>Crear Nuevo Usuario</h1>
          
          {error && <div style={alertErrorStyles}>{error}</div>}
          {success && <div style={alertSuccessStyles}>{success}</div>}
          
          <form onSubmit={handleSubmit}>
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
                    <span>Marca</span>
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
                  <span>Marca</span>
                </label>
              </div>
            </div>

            {/* Marca Link */}
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
                onClick={() => navigate('/main')}
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

      {/* Right Panel - Users Table */}
      <div style={rightPanelStyles}>
        <div style={cardStyles}>
          <h1 style={headingStyles}>Usuarios Existentes</h1>
          
          {loadingUsers ? (
            <div style={loadingStyles}>Cargando usuarios...</div>
          ) : (
            <div style={tableContainerStyles}>
              <table style={tableStyles}>
                <thead>
                  <tr>
                    <th style={thStyles}>Usuario</th>
                    <th style={thStyles}>Nombre</th>
                    <th style={thStyles}>Rol</th>
                    <th style={thStyles}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((userItem) => (
                    <tr key={userItem._id}>
                      <td style={tdStyles}>{userItem.username}</td>
                      <td style={tdStyles}>{userItem.name}</td>
                      <td style={tdStyles}>
                        <span style={{
                          backgroundColor: userItem.role === 'admin' ? '#17a2b8' : '#28a745',
                          color: 'white',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                        }}>
                          {userItem.role === 'admin' ? 'Administrador' : 'Marca'}
                        </span>
                      </td>
                      <td style={tdStyles}>
                        <button
                          style={editButtonStyles}
                          onClick={() => handleEditClick(userItem)}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#138496'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#17a2b8'}
                        >
                          Editar
                        </button>
                        <button
                          style={deleteButtonStyles}
                          onClick={() => handleDeleteUser(userItem._id)}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {users.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  No hay usuarios registrados
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div style={modalOverlayStyles}>
          <div style={modalContentStyles}>
            <div style={modalHeaderStyles}>
              <h2 style={modalTitleStyles}>Editar Usuario: {editingUser.name}</h2>
              <button
                style={closeButtonStyles}
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>
            
            <div style={formGroupStyles}>
              <label htmlFor="newPassword" style={labelStyles}>
                Nueva Contraseña
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={editFormData.newPassword}
                onChange={handleEditInputChange}
                placeholder="Ingrese nueva contraseña"
                style={inputStyles}
              />
            </div>
            
            <div style={formGroupStyles}>
              <label htmlFor="confirmPassword" style={labelStyles}>
                Confirmar Contraseña
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={editFormData.confirmPassword}
                onChange={handleEditInputChange}
                placeholder="Confirme la nueva contraseña"
                style={inputStyles}
              />
            </div>
            
            <div style={modalActionsStyles}>
              <button
                style={secondaryButtonStyles}
                onClick={() => setShowEditModal(false)}
              >
                Cancelar
              </button>
              <button
                style={primaryButtonStyles}
                onClick={handleUpdatePassword}
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrearUsuario;