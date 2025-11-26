import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const TiendaProfile = ({ user }) => {
  const { storeName } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [tempQuantity, setTempQuantity] = useState(0);
  const [tempPrice, setTempPrice] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditStore, setShowEditStore] = useState(false);
  const [newProduct, setNewProduct] = useState({
    image: null,
    name: "",
    price: "",
    quantity: 0
  });
  const [editStoreData, setEditStoreData] = useState({
    name: "",
    tag: "",
    location: "",
    description: ""
  });

  useEffect(() => {
    const fetchStoreData = async () => {
        try {
        const response = await fetch(`http://localhost:5000/api/tiendas/${storeName}`);
        const data = await response.json();
        setStore(data);
        // Initialize edit form with current store data
        setEditStoreData({
            name: data.name || "",
            tag: data.tag || "",
            location: data.location || "",
            description: data.description || ""
        });
        } catch (error) {
        console.error("Error fetching store data:", error);
        } finally {
        setLoading(false);
        }
    };

    fetchStoreData();
    }, [storeName]);
    
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setTempQuantity(product.quantity);
    setTempPrice(product.price);
  };

  const handleSaveProduct = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/tiendas/${store._id}/products/${editingProduct._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          quantity: tempQuantity,
          price: tempPrice,
        }),
      });

      if (response.ok) {
        // Update local state
        setStore(prevStore => ({
          ...prevStore,
          products: prevStore.products.map(p => 
            p._id === editingProduct._id 
              ? { ...p, quantity: tempQuantity, price: tempPrice }
              : p
          )
        }));
        setEditingProduct(null);
      } else {
        console.error("Error updating product");
      }
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
  };

  const handleDeleteStore = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/tiendas/${store._id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
      });

      if (response.ok) {
        alert("Tienda eliminada exitosamente");
        navigate("/inventario");
      } else {
        console.error("Error eliminando tienda");
        alert("Error al eliminar la tienda");
      }
    } catch (error) {
      console.error("Error eliminando tienda:", error);
      alert("Error al eliminar la tienda");
    }
  };

  const handleAddProduct = async () => {
    try {
      if (!newProduct.name.trim() || !newProduct.image) {
        alert("Por favor completa el nombre y selecciona una imagen del producto");
        return;
      }

      const formData = new FormData();
      formData.append("productImage", newProduct.image);
      formData.append("productClave", newProduct.name.trim());
      formData.append("productPrice", newProduct.price || "0");
      formData.append("productQuantity", newProduct.quantity.toString());

      const response = await fetch(`http://localhost:5000/api/tiendas/${store._id}/products`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: formData,
      });

      if (response.ok) {
        const updatedStore = await response.json();
        setStore(updatedStore);
        setShowAddProduct(false);
        setNewProduct({
          image: null,
          name: "",
          price: "",
          quantity: 0
        });
        alert("Producto agregado exitosamente");
      } else {
        console.error("Error agregando producto");
        alert("Error al agregar el producto");
      }
    } catch (error) {
      console.error("Error agregando producto:", error);
      alert("Error al agregar el producto");
    }
  };

  const handleEditStore = async () => {
    try {
      if (!editStoreData.name.trim() || !editStoreData.tag.trim()) {
        alert("Por favor completa el nombre y clave de la tienda");
        return;
      }

      const response = await fetch(`http://localhost:5000/api/tiendas/${store._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(editStoreData),
      });

      if (response.ok) {
        const updatedStore = await response.json();
        setStore(updatedStore);
        setShowEditStore(false);
        alert("Tienda actualizada exitosamente");
      } else {
        console.error("Error actualizando tienda");
        alert("Error al actualizar la tienda");
      }
    } catch (error) {
      console.error("Error actualizando tienda:", error);
      alert("Error al actualizar la tienda");
    }
  };

  const handleNewProductImage = (file) => {
    setNewProduct(prev => ({ ...prev, image: file }));
  };

  const handleNewProductName = (value) => {
    setNewProduct(prev => ({ ...prev, name: value }));
  };

  const handleNewProductPrice = (value) => {
    setNewProduct(prev => ({ ...prev, price: value }));
  };

  const handleNewProductQuantity = (value) => {
    setNewProduct(prev => ({ ...prev, quantity: Math.max(0, value) }));
  };

  const calculateTotalItems = () => {
    if (!store?.products) return 0;
    return store.products.reduce((total, product) => total + product.quantity, 0);
  };

  if (loading) return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <div>Cargando tienda...</div>
    </div>
  );

  if (!store) return (
    <div style={{ padding: "20px" }}>
      <button 
        onClick={() => navigate(-1)}
        style={{ marginBottom: "20px", padding: "8px 16px", cursor: "pointer" }}
      >
        ← Volver
      </button>
      <div>Tienda no encontrada</div>
    </div>
  );

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header with Back Button */}
      <div style={{ marginBottom: "30px" }}>
        <button 
          onClick={() => navigate(-1)}
          style={{
            padding: "8px 16px",
            cursor: "pointer",
            marginBottom: "20px",
            background: "#f0f0f0",
            border: "1px solid #ccc",
            borderRadius: "4px"
          }}
        >
          ← Volver al Inventario
        </button>

        {/* Store Information */}
        <div style={{
          background: "white",
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "20px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          position: "relative"
        }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "flex-start",
            marginBottom: "15px"
          }}>
            <h1 style={{ margin: "0 0 10px 0", color: "#333" }}>{store.name}</h1>
            {user?.role === "admin" && (
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setShowEditStore(true)}
                  style={{
                    background: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 16px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "bold"
                  }}
                >
                  Editar Tienda
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{
                    background: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 16px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "bold"
                  }}
                >
                  Eliminar Tienda
                </button>
              </div>
            )}
          </div>
          
          <div style={{ display: "flex", gap: "30px", flexWrap: "wrap" }}>
            <div>
              <strong>Tag:</strong> {store.tag}
            </div>
            {store.location && (
              <div>
                <strong>Ubicación:</strong> {store.location}
              </div>
            )}
            <div>
              <strong>Total Productos:</strong> {store.products?.length || 0}
            </div>
            <div>
              <strong>Items en Stock:</strong> {calculateTotalItems()}
            </div>
          </div>
          {store.description && (
            <p style={{ marginTop: "15px", color: "#666" }}>{store.description}</p>
          )}
        </div>
      </div>

      {/* Inventory Table */}
      <div style={{
        background: "white",
        border: "1px solid #ddd",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          padding: "20px", 
          background: "#f8f9fa",
          borderBottom: "1px solid #ddd"
        }}>
          <h2 style={{ margin: 0, color: "#333" }}>
            Inventario de la Tienda
          </h2>
          {user?.role === "admin" && (
            <button
              onClick={() => setShowAddProduct(true)}
              style={{
                background: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "8px 16px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold"
              }}
            >
              + Agregar Producto
            </button>
          )}
        </div>

        {store.products && store.products.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ 
              width: "100%", 
              borderCollapse: "collapse",
              minWidth: "600px"
            }}>
              <thead>
                <tr style={{ background: "#f8f9fa" }}>
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
                    Clave
                  </th>
                  <th style={{ 
                    padding: "12px", 
                    textAlign: "center", 
                    borderBottom: "1px solid #ddd",
                    fontWeight: "bold"
                  }}>
                    Cantidad
                  </th>
                  <th style={{ 
                    padding: "12px", 
                    textAlign: "right", 
                    borderBottom: "1px solid #ddd",
                    fontWeight: "bold"
                  }}>
                    Precio Unitario
                  </th>
                  {user?.role === "admin" && (
                    <th style={{ 
                      padding: "12px", 
                      textAlign: "center", 
                      borderBottom: "1px solid #ddd",
                      fontWeight: "bold"
                    }}>
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {store.products.map((product, index) => (
                  <tr 
                    key={product._id || index}
                    style={{ 
                      borderBottom: "1px solid #eee",
                      backgroundColor: index % 2 === 0 ? "#fafafa" : "white"
                    }}
                  >
                    <td style={{ padding: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {product.imageUrl && (
                          <img 
                            src={`http://localhost:5000${product.imageUrl}`} 
                            alt={product.name}
                            style={{ 
                              width: "40px", 
                              height: "40px", 
                              objectFit: "cover",
                              borderRadius: "4px"
                            }}
                          />
                        )}
                        <span>{product.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px" }}>
                      {product.clave}
                    </td>
                    
                    {/* Quantity Column */}
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      {editingProduct?._id === product._id ? (
                        <input
                          type="number"
                          value={tempQuantity}
                          onChange={(e) => setTempQuantity(parseInt(e.target.value) || 0)}
                          style={{
                            width: "80px",
                            padding: "4px",
                            textAlign: "center",
                            border: "1px solid #ccc",
                            borderRadius: "4px"
                          }}
                          min="0"
                        />
                      ) : (
                        <span style={{ 
                          fontWeight: "bold",
                          color: product.quantity === 0 ? "#dc3545" : "#28a745"
                        }}>
                          {product.quantity}
                        </span>
                      )}
                    </td>

                    {/* Price Column */}
                    <td style={{ padding: "12px", textAlign: "right" }}>
                      {editingProduct?._id === product._id ? (
                        <input
                          type="number"
                          value={tempPrice}
                          onChange={(e) => setTempPrice(parseFloat(e.target.value) || 0)}
                          step="0.01"
                          min="0"
                          style={{
                            width: "100px",
                            padding: "4px",
                            textAlign: "right",
                            border: "1px solid #ccc",
                            borderRadius: "4px"
                          }}
                        />
                      ) : (
                        `$${product.price.toFixed(2)}`
                      )}
                    </td>

                    {/* Actions Column (Admin only) */}
                    {user?.role === "admin" && (
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {editingProduct?._id === product._id ? (
                          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                            <button
                              onClick={handleSaveProduct}
                              style={{
                                padding: "6px 12px",
                                background: "#28a745",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "12px"
                              }}
                            >
                              Guardar
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              style={{
                                padding: "6px 12px",
                                background: "#6c757d",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "12px"
                              }}
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditProduct(product)}
                            style={{
                              padding: "6px 12px",
                              background: "#007bff",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px"
                            }}
                          >
                            Editar
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
            No hay productos en esta tienda.
            {user?.role === "admin" && (
              <div style={{ marginTop: "15px" }}>
                <button
                  onClick={() => setShowAddProduct(true)}
                  style={{
                    background: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    padding: "10px 20px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "bold"
                  }}
                >
                  + Agregar Primer Producto
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Store Modal */}
      {showEditStore && (
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
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            <h2 style={{ 
              margin: "0 0 20px 0", 
              color: "#333",
              fontSize: "24px",
              textAlign: "center"
            }}>
              Editar Tienda
            </h2>

            <div style={{
              background: "#fafafa",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "20px"
            }}>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontWeight: "bold",
                  color: "#333"
                }}>
                  Nombre de Tienda *
                </label>
                <input
                  type="text"
                  value={editStoreData.name}
                  onChange={(e) => setEditStoreData(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    fontSize: "16px"
                  }}
                  placeholder="Ej: Tienda Centro"
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontWeight: "bold",
                  color: "#333"
                }}>
                  Clave Única de Tienda * (max 4 caracteres)
                </label>
                <input
                  type="text"
                  value={editStoreData.tag}
                  onChange={(e) => setEditStoreData(prev => ({ ...prev, tag: e.target.value.toUpperCase() }))}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    fontSize: "16px",
                    textTransform: "uppercase"
                  }}
                  placeholder="Ej: TCEN"
                  maxLength="4"
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontWeight: "bold",
                  color: "#333"
                }}>
                  Ubicación
                </label>
                <input
                  type="text"
                  value={editStoreData.location}
                  onChange={(e) => setEditStoreData(prev => ({ ...prev, location: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    fontSize: "16px"
                  }}
                  placeholder="Ej: Av. Principal #123, Ciudad"
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontWeight: "bold",
                  color: "#333"
                }}>
                  Descripción
                </label>
                <textarea
                  value={editStoreData.description}
                  onChange={(e) => setEditStoreData(prev => ({ ...prev, description: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    fontSize: "16px",
                    minHeight: "80px",
                    resize: "vertical"
                  }}
                  placeholder="Descripción opcional de la tienda..."
                  maxLength="500"
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: "15px" }}>
              <button
                style={{
                  flex: 1,
                  background: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "12px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold"
                }}
                onClick={handleEditStore}
                disabled={!editStoreData.name.trim() || !editStoreData.tag.trim()}
              >
                Guardar Cambios
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
                onClick={() => setShowEditStore(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProduct && (
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
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            <h2 style={{ 
              margin: "0 0 20px 0", 
              color: "#333",
              fontSize: "24px",
              textAlign: "center"
            }}>
              Agregar Nuevo Producto
            </h2>

            <div style={{
              background: "#fafafa",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "20px"
            }}>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontWeight: "bold",
                  color: "#333"
                }}>
                  Imagen del Producto *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleNewProductImage(e.target.files[0])}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    background: "white"
                  }}
                />
                {newProduct.image && (
                  <span style={{ 
                    display: "block", 
                    marginTop: "5px", 
                    color: "#28a745",
                    fontSize: "14px"
                  }}>
                    ✓ Imagen seleccionada
                  </span>
                )}
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontWeight: "bold",
                  color: "#333"
                }}>
                  Clave del Producto *
                </label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => handleNewProductName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    fontSize: "16px"
                  }}
                  placeholder="Ej: PROD001"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "8px", 
                    fontWeight: "bold",
                    color: "#333"
                  }}>
                    Precio *
                  </label>
                  <div style={{ position: "relative" }}>
                    <span style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#666",
                      fontWeight: "bold"
                    }}>
                      $
                    </span>
                    <input
                      type="number"
                      value={newProduct.price}
                      onChange={(e) => handleNewProductPrice(e.target.value)}
                      step="0.01"
                      min="0"
                      style={{
                        width: "100%",
                        padding: "12px 12px 12px 30px",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        fontSize: "16px"
                      }}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "8px", 
                    fontWeight: "bold",
                    color: "#333"
                  }}>
                    Cantidad Inicial
                  </label>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "10px",
                    background: "white",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    padding: "8px"
                  }}>
                    <button
                      onClick={() => handleNewProductQuantity(newProduct.quantity - 1)}
                      style={{
                        background: "#6c757d",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "8px 12px",
                        cursor: "pointer",
                        fontSize: "16px",
                        fontWeight: "bold",
                        minWidth: "40px"
                      }}
                    >
                      -
                    </button>
                    
                    <span style={{ 
                      flex: 1,
                      textAlign: "center",
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: newProduct.quantity === 0 ? "#dc3545" : "#28a745"
                    }}>
                      {newProduct.quantity}
                    </span>
                    
                    <button
                      onClick={() => handleNewProductQuantity(newProduct.quantity + 1)}
                      style={{
                        background: "#6c757d",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "8px 12px",
                        cursor: "pointer",
                        fontSize: "16px",
                        fontWeight: "bold",
                        minWidth: "40px"
                      }}
                    >
                      +
                    </button>
                  </div>
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
                onClick={handleAddProduct}
                disabled={!newProduct.name.trim() || !newProduct.image}
              >
                Agregar Producto
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
                onClick={() => {
                  setShowAddProduct(false);
                  setNewProduct({
                    image: null,
                    name: "",
                    price: "",
                    quantity: 0
                  });
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
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
          zIndex: 1001
        }}>
          <div style={{
            background: "white",
            borderRadius: "8px",
            padding: "30px",
            width: "90%",
            maxWidth: "400px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
          }}>
            <h2 style={{ 
              margin: "0 0 20px 0", 
              color: "#333",
              fontSize: "24px",
              textAlign: "center"
            }}>
              Confirmar Eliminación
            </h2>
            
            <div style={{ 
              background: "#fff3cd", 
              border: "1px solid #ffeaa7",
              borderRadius: "6px", 
              padding: "15px",
              marginBottom: "20px"
            }}>
              <p style={{ margin: 0, color: "#856404", textAlign: "center" }}>
                <strong>¿Estás seguro de que quieres eliminar la tienda "{store.name}"?</strong>
              </p>
              <p style={{ margin: "10px 0 0 0", color: "#856404", fontSize: "14px", textAlign: "center" }}>
                Esta acción no se puede deshacer y se eliminarán todos los productos asociados.
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
                onClick={handleDeleteStore}
              >
                Eliminar
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
                onClick={() => setShowDeleteConfirm(false)}
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

export default TiendaProfile;