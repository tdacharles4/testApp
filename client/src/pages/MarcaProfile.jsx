import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const TiendaProfile = ({ user }) => {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const { storeName } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditStore, setShowEditStore] = useState(false);
  
  // New product state matching CrearTienda structure
  const [newProduct, setNewProduct] = useState({
    image: null,
    name: "",
    nombreProducto: "",
    description: "",
    price: "",
    quantity: 0,
    fechaRecepcionHoy: true,
    fechaRecepcion: new Date().toISOString().split('T')[0]
  });

  // Edit store state matching CrearTienda structure
  const [editStoreData, setEditStoreData] = useState({
    storeName: "",
    storeTag: "",
    storeDescription: "",
    contractType: "",
    contractPercentage: "",
    contractPiso: "",
    contacto: "",
    banco: "",
    numeroCuenta: "",
    clabe: "",
    tarjeta: ""
  });

  // Edit product state
  const [editProductData, setEditProductData] = useState({
    image: null,
    existingImageUrl: "",
    name: "",
    nombreProducto: "",
    description: "",
    price: "",
    quantity: 0,
    fechaRecepcionHoy: true,
    fechaRecepcion: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/tiendas/${storeName}`);
        const data = await response.json();
        
        // Backend returns { success: true, store: {...} }
        // So we need to use data.store instead of data directly
        if (data.success && data.store) {
          setStore(data.store);
          // Initialize edit form with current store data
          setEditStoreData({
            storeName: data.store.name || "",
            storeTag: data.store.tag || "",
            storeDescription: data.store.description || "",
            contractType: data.store.contractType || "",
            contractPercentage: data.store.contractValue || "",
            contractPiso: data.store.contractValue || "",
            contacto: data.store.contacto || "",
            banco: data.store.banco || "",
            numeroCuenta: data.store.numeroCuenta || "",
            clabe: data.store.clabe || "",
            tarjeta: data.store.tarjeta || ""
          });
        } else {
          // Fallback for different response structure
          setStore(data);
          setEditStoreData({
            storeName: data.name || "",
            storeTag: data.tag || "",
            storeDescription: data.description || "",
            contractType: data.contractType || "",
            contractPercentage: data.contractValue || "",
            contractPiso: data.contractValue || "",
            contacto: data.contacto || "",
            banco: data.banco || "",
            numeroCuenta: data.numeroCuenta || "",
            clabe: data.clabe || "",
            tarjeta: data.tarjeta || ""
          });
        }
      } catch (error) {
        console.error("Error fetching store data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreData();
  }, [storeName, API_URL]);

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setEditProductData({
      image: null,
      existingImageUrl: product.imageUrl || "",
      name: product.clave || "",
      nombreProducto: product.name || "",
      description: product.description || "",
      price: product.price || "",
      quantity: product.quantity || 0,
      fechaRecepcionHoy: true,
      fechaRecepcion: new Date().toISOString().split('T')[0]
    });
  };

  const handleSaveProduct = async () => {
    try {
      const formData = new FormData();
      
      // Add product data
      if (editProductData.image) {
        formData.append("productImage", editProductData.image);
      }
      formData.append("productClave", editProductData.name.trim());
      formData.append("productNombre", editProductData.nombreProducto.trim());
      formData.append("productDescription", editProductData.description.trim());
      formData.append("productPrice", editProductData.price || "0");
      formData.append("productQuantity", editProductData.quantity.toString());
      formData.append("productFechaRecepcion", editProductData.fechaRecepcion);

      const response = await fetch(`${API_URL}/api/tiendas/${store._id}/products/${editingProduct._id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: formData,
      });

      if (response.ok) {
        const updatedStore = await response.json();
        setStore(updatedStore);
        setEditingProduct(null);
        alert("Producto actualizado exitosamente");
      } else {
        console.error("Error updating product");
        alert("Error al actualizar el producto");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Error al actualizar el producto");
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setEditProductData({
      image: null,
      existingImageUrl: "",
      name: "",
      nombreProducto: "",
      description: "",
      price: "",
      quantity: 0,
      fechaRecepcionHoy: true,
      fechaRecepcion: new Date().toISOString().split('T')[0]
    });
  };

  const handleDeleteStore = async () => {
    try {
      const response = await fetch(`${API_URL}/api/tiendas/${store._id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
      });

      if (response.ok) {
        alert("Marca eliminada exitosamente");
        navigate("/inventario");
      } else {
        console.error("Error eliminando marca");
        alert("Error al eliminar la marca");
      }
    } catch (error) {
      console.error("Error eliminando marca:", error);
      alert("Error al eliminar la marca");
    }
  };

  const handleAddProduct = async () => {
    try {
      if (!newProduct.name.trim() || !newProduct.nombreProducto.trim()) {
        alert("Por favor completa la clave y nombre del producto");
        return;
      }

      // Placeholder image URL
      const PLACEHOLDER_IMAGE = "/logo192.png";
      let imageUrl = PLACEHOLDER_IMAGE;

      // If there's an image, upload it to Vercel Blob
      if (newProduct.image) {
        try {
          const token = localStorage.getItem("token");
          const { upload } = await import('@vercel/blob/client');
          
          const blob = await upload(newProduct.image.name, newProduct.image, {
            access: 'public',
            handleUploadUrl: `${API_URL}/api/upload`,
            clientPayload: JSON.stringify({ token })
          });
          imageUrl = blob.url;
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
          alert(`Advertencia: No se pudo subir la imagen. Se usará imagen por defecto.`);
        }
      }

      const payload = {
        productClave: newProduct.name.trim(),
        productNombre: newProduct.nombreProducto.trim(),
        productDescription: newProduct.description.trim(),
        productPrice: newProduct.price || "0",
        productQuantity: newProduct.quantity.toString(),
        productFechaRecepcion: newProduct.fechaRecepcion,
        imageUrl: imageUrl
      };

      const response = await fetch(`${API_URL}/api/tiendas/${store._id}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        // Backend returns { success: true, message: "...", store: {...} }
        if (data.success && data.store) {
          setStore(data.store);
        }
        setShowAddProduct(false);
        setNewProduct({
          image: null,
          name: "",
          nombreProducto: "",
          description: "",
          price: "",
          quantity: 0,
          fechaRecepcionHoy: true,
          fechaRecepcion: new Date().toISOString().split('T')[0]
        });
        alert("Producto agregado exitosamente");
      } else {
        const errorData = await response.json();
        console.error("Error agregando producto:", errorData);
        alert(errorData.message || "Error al agregar el producto");
      }
    } catch (error) {
      console.error("Error agregando producto:", error);
      alert("Error al agregar el producto");
    }
  };

  const handleEditStore = async () => {
    try {
      if (!editStoreData.storeName.trim() || !editStoreData.storeTag.trim()) {
        alert("Por favor completa el nombre y clave de la marca");
        return;
      }

      if (editStoreData.storeTag.length !== 4) {
        alert("La clave de marca debe tener exactamente 4 caracteres");
        return;
      }

      // Contract validation
      if (!editStoreData.contractType) {
        alert("Por favor selecciona un tipo de contrato");
        return;
      }

      if (editStoreData.contractType === "Porcentaje" && (!editStoreData.contractPercentage || parseFloat(editStoreData.contractPercentage) < 0 || parseFloat(editStoreData.contractPercentage) > 100)) {
        alert("Por favor ingresa un porcentaje válido entre 0 y 100");
        return;
      }

      if (editStoreData.contractType === "Piso" && (!editStoreData.contractPiso || parseFloat(editStoreData.contractPiso) < 0)) {
        alert("Por favor ingresa un monto de piso válido");
        return;
      }

      // Bank field validations
      if (editStoreData.numeroCuenta && (editStoreData.numeroCuenta.length < 10 || editStoreData.numeroCuenta.length > 12)) {
        alert("El número de cuenta debe tener entre 10 y 12 caracteres");
        return;
      }

      if (editStoreData.clabe && editStoreData.clabe.length !== 18) {
        alert("La CLABE debe tener exactamente 18 caracteres");
        return;
      }

      if (editStoreData.tarjeta && editStoreData.tarjeta.length !== 16) {
        alert("El número de tarjeta debe tener exactamente 16 caracteres");
        return;
      }

      const formData = new FormData();
      formData.append("storeName", editStoreData.storeName.trim());
      formData.append("storeTag", editStoreData.storeTag.trim().toUpperCase());
      formData.append("contractType", editStoreData.contractType);
      
      if (editStoreData.contractType === "Porcentaje") {
        formData.append("contractValue", editStoreData.contractPercentage);
      } else if (editStoreData.contractType === "Piso") {
        formData.append("contractValue", editStoreData.contractPiso);
      }
      
      if (editStoreData.storeDescription.trim()) {
        formData.append("storeDescription", editStoreData.storeDescription.trim());
      }
      
      // Add contact and bank information
      if (editStoreData.contacto.trim()) formData.append("contacto", editStoreData.contacto.trim());
      if (editStoreData.banco.trim()) formData.append("banco", editStoreData.banco.trim());
      if (editStoreData.numeroCuenta.trim()) formData.append("numeroCuenta", editStoreData.numeroCuenta.trim());
      if (editStoreData.clabe.trim()) formData.append("clabe", editStoreData.clabe.trim());
      if (editStoreData.tarjeta.trim()) formData.append("tarjeta", editStoreData.tarjeta.trim());

      const response = await fetch(`${API_URL}/api/tiendas/${store._id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: formData,
      });

      if (response.ok) {
        const updatedStore = await response.json();
        setStore(updatedStore);
        setShowEditStore(false);
        alert("Marca actualizada exitosamente");
      } else {
        console.error("Error actualizando marca");
        alert("Error al actualizar la marca");
      }
    } catch (error) {
      console.error("Error actualizando marca:", error);
      alert("Error al actualizar la marca");
    }
  };

  // Helper functions for product management
  const handleNewProductImage = (file) => {
    setNewProduct(prev => ({ ...prev, image: file }));
  };

  const handleNewProductName = (value) => {
    setNewProduct(prev => ({ ...prev, name: value }));
  };

  const handleNewProductNombre = (value) => {
    setNewProduct(prev => ({ ...prev, nombreProducto: value }));
  };

  const handleNewProductDescription = (value) => {
    setNewProduct(prev => ({ ...prev, description: value }));
  };

  const handleNewProductPrice = (value) => {
    setNewProduct(prev => ({ ...prev, price: value }));
  };

  const handleNewProductQuantity = (value) => {
    setNewProduct(prev => ({ ...prev, quantity: Math.max(0, value) }));
  };

  const handleNewProductFechaRecepcionHoy = (checked) => {
    setNewProduct(prev => ({ 
      ...prev, 
      fechaRecepcionHoy: checked,
      fechaRecepcion: checked ? new Date().toISOString().split('T')[0] : prev.fechaRecepcion
    }));
  };

  const handleNewProductFechaRecepcion = (date) => {
    setNewProduct(prev => ({ ...prev, fechaRecepcion: date }));
  };

  // Helper functions for edit product
  const handleEditProductImage = (file) => {
    setEditProductData(prev => ({ ...prev, image: file }));
  };

  const handleEditProductName = (value) => {
    setEditProductData(prev => ({ ...prev, name: value }));
  };

  const handleEditProductNombre = (value) => {
    setEditProductData(prev => ({ ...prev, nombreProducto: value }));
  };

  const handleEditProductDescription = (value) => {
    setEditProductData(prev => ({ ...prev, description: value }));
  };

  const handleEditProductPrice = (value) => {
    setEditProductData(prev => ({ ...prev, price: value }));
  };

  const handleEditProductQuantity = (value) => {
    setEditProductData(prev => ({ ...prev, quantity: Math.max(0, value) }));
  };

  const handleEditProductFechaRecepcionHoy = (checked) => {
    setEditProductData(prev => ({ 
      ...prev, 
      fechaRecepcionHoy: checked,
      fechaRecepcion: checked ? new Date().toISOString().split('T')[0] : prev.fechaRecepcion
    }));
  };

  const handleEditProductFechaRecepcion = (date) => {
    setEditProductData(prev => ({ ...prev, fechaRecepcion: date }));
  };

  const calculateTotalItems = () => {
    if (!store?.products) return 0;
    return store.products.reduce((total, product) => total + product.quantity, 0);
  };

  if (loading) return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <div>Cargando marca...</div>
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
      <div>Marca no encontrada</div>
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
          ← Regresar
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
                  Editar Marca
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
                  Eliminar Marca
                </button>
              </div>
            )}
          </div>
          
          <div style={{ display: "flex", gap: "30px", flexWrap: "wrap" }}>
            <div>
              <strong>Tag:</strong> {store.tag}
            </div>
            {store.contractType && (
              <div>
                <strong>Tipo de Contrato:</strong> {store.contractType}
              </div>
            )}
            {store.contractValue && (
              <div>
                <strong>Valor de Contrato:</strong> {store.contractType === "Porcentaje" ? `${store.contractValue}%` : `$${store.contractValue}`}
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
            Inventario de la Marca
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
                            src={`${API_URL}${product.imageUrl}`} 
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
                      <span style={{ 
                        fontWeight: "bold",
                        color: product.quantity === 0 ? "#dc3545" : "#28a745"
                      }}>
                        {product.quantity}
                      </span>
                    </td>

                    {/* Price Column */}
                    <td style={{ padding: "12px", textAlign: "right" }}>
                      {`$${product.price.toFixed(2)}`}
                    </td>

                    {/* Actions Column (Admin only) */}
                    {user?.role === "admin" && (
                      <td style={{ padding: "12px", textAlign: "center" }}>
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
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
            No hay productos en esta marca.
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
            maxWidth: "900px",
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
              Editar Marca
            </h2>

            {/* Store Information Card */}
            <div style={{
              background: "#fafafa",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              padding: "25px",
              marginBottom: "20px"
            }}>
              <h3 style={{ 
                margin: "0 0 20px 0", 
                color: "#333",
                fontSize: "18px",
                borderBottom: "2px solid #f0f0f0",
                paddingBottom: "10px"
              }}>
                Información de la Marca
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "8px", 
                    fontWeight: "bold",
                    color: "#333"
                  }}>
                    Nombre de Marca *
                  </label>
                  <input
                    type="text"
                    value={editStoreData.storeName}
                    onChange={(e) => setEditStoreData(prev => ({ ...prev, storeName: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                      fontSize: "16px"
                    }}
                    placeholder="Ej: Marca Centro"
                  />
                </div>

                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "8px", 
                    fontWeight: "bold",
                    color: "#333"
                  }}>
                    Clave Única de Marca * (4 caracteres)
                  </label>
                  <input
                    type="text"
                    value={editStoreData.storeTag}
                    onChange={(e) => setEditStoreData(prev => ({ ...prev, storeTag: e.target.value.toUpperCase() }))}
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

                {/* Contract Type */}
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "12px", 
                    fontWeight: "bold",
                    color: "#333"
                  }}>
                    Tipo de Contrato *
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="contractType"
                        value="DCE"
                        checked={editStoreData.contractType === "DCE"}
                        onChange={(e) => setEditStoreData(prev => ({ ...prev, contractType: e.target.value }))}
                      />
                      <span style={{ fontWeight: "bold" }}>DCE</span>
                    </label>
                    
                    <div style={{ marginLeft: "0" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                        <input
                          type="radio"
                          name="contractType"
                          value="Porcentaje"
                          checked={editStoreData.contractType === "Porcentaje"}
                          onChange={(e) => setEditStoreData(prev => ({ ...prev, contractType: e.target.value }))}
                        />
                        <span style={{ fontWeight: "bold" }}>Porcentaje</span>
                      </label>
                      {editStoreData.contractType === "Porcentaje" && (
                        <div style={{ marginLeft: "30px", marginTop: "10px" }}>
                          <div style={{ position: "relative", maxWidth: "200px" }}>
                            <input
                              type="number"
                              value={editStoreData.contractPercentage}
                              onChange={(e) => setEditStoreData(prev => ({ ...prev, contractPercentage: e.target.value }))}
                              min="0"
                              max="100"
                              step="0.01"
                              style={{
                                width: "100%",
                                padding: "10px 40px 10px 12px",
                                border: "1px solid #ccc",
                                borderRadius: "6px",
                                fontSize: "14px"
                              }}
                              placeholder="0.00"
                            />
                            <span style={{
                              position: "absolute",
                              right: "12px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              color: "#666",
                              fontWeight: "bold"
                            }}>
                              %
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div style={{ marginLeft: "0" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                        <input
                          type="radio"
                          name="contractType"
                          value="Piso"
                          checked={editStoreData.contractType === "Piso"}
                          onChange={(e) => setEditStoreData(prev => ({ ...prev, contractType: e.target.value }))}
                        />
                        <span style={{ fontWeight: "bold" }}>Piso</span>
                      </label>
                      {editStoreData.contractType === "Piso" && (
                        <div style={{ marginLeft: "30px", marginTop: "10px" }}>
                          <div style={{ position: "relative", maxWidth: "200px" }}>
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
                              value={editStoreData.contractPiso}
                              onChange={(e) => setEditStoreData(prev => ({ ...prev, contractPiso: e.target.value }))}
                              step="0.01"
                              min="0"
                              style={{
                                width: "100%",
                                padding: "10px 12px 10px 35px",
                                border: "1px solid #ccc",
                                borderRadius: "6px",
                                fontSize: "14px"
                              }}
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="contractType"
                        value="Estetica Unisex"
                        checked={editStoreData.contractType === "Estetica Unisex"}
                        onChange={(e) => setEditStoreData(prev => ({ ...prev, contractType: e.target.value }))}
                      />
                      <span style={{ fontWeight: "bold" }}>Estetica Unisex</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "8px", 
                    fontWeight: "bold",
                    color: "#333"
                  }}>
                    Descripción
                  </label>
                  <textarea
                    value={editStoreData.storeDescription}
                    onChange={(e) => setEditStoreData(prev => ({ ...prev, storeDescription: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                      fontSize: "14px",
                      minHeight: "80px",
                      resize: "vertical"
                    }}
                    placeholder="Descripción opcional de la marca..."
                    maxLength="500"
                  />
                </div>
              </div>
            </div>

            {/* Contact and Bank Information Card */}
            <div style={{
              background: "#fafafa",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              padding: "25px",
              marginBottom: "20px"
            }}>
              <h3 style={{ 
                margin: "0 0 20px 0", 
                color: "#333",
                fontSize: "18px",
                borderBottom: "2px solid #f0f0f0",
                paddingBottom: "10px"
              }}>
                Información de Contacto y Banco
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "8px", 
                    fontWeight: "bold",
                    color: "#333"
                  }}>
                    Contacto
                  </label>
                  <input
                    type="email"
                    value={editStoreData.contacto}
                    onChange={(e) => setEditStoreData(prev => ({ ...prev, contacto: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                      fontSize: "14px"
                    }}
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "8px", 
                    fontWeight: "bold",
                    color: "#333"
                  }}>
                    Banco
                  </label>
                  <input
                    type="text"
                    value={editStoreData.banco}
                    onChange={(e) => setEditStoreData(prev => ({ ...prev, banco: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                      fontSize: "14px"
                    }}
                    placeholder="Nombre del banco"
                  />
                </div>

                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "8px", 
                    fontWeight: "bold",
                    color: "#333"
                  }}>
                    Número de Cuenta (10-12 caracteres)
                  </label>
                  <input
                    type="text"
                    value={editStoreData.numeroCuenta}
                    onChange={(e) => setEditStoreData(prev => ({ ...prev, numeroCuenta: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                      fontSize: "14px"
                    }}
                    placeholder="Número de cuenta bancaria"
                    maxLength="12"
                  />
                </div>

                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "8px", 
                    fontWeight: "bold",
                    color: "#333"
                  }}>
                    CLABE (18 caracteres)
                  </label>
                  <input
                    type="text"
                    value={editStoreData.clabe}
                    onChange={(e) => setEditStoreData(prev => ({ ...prev, clabe: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                      fontSize: "14px"
                    }}
                    placeholder="CLABE interbancaria"
                    maxLength="18"
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "8px", 
                    fontWeight: "bold",
                    color: "#333"
                  }}>
                    Número de Tarjeta (16 caracteres)
                  </label>
                  <input
                    type="text"
                    value={editStoreData.tarjeta.replace(/(.{4})/g, '$1 ').trim()}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\s/g, '');
                      if (value.length <= 16) {
                        setEditStoreData(prev => ({ ...prev, tarjeta: value }));
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                      fontSize: "14px",
                      letterSpacing: "1px"
                    }}
                    placeholder="1234 5678 9012 3456"
                    maxLength="19"
                  />
                </div>
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
                disabled={!editStoreData.storeName.trim() || !editStoreData.storeTag.trim() || !editStoreData.contractType}
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
            maxWidth: "800px",
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
              padding: "25px",
              marginBottom: "20px"
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "10px", 
                    fontWeight: "bold",
                    color: "#333",
                    fontSize: "15px"
                  }}>
                    Imagen del Producto *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleNewProductImage(e.target.files[0])}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                      background: "white"
                    }}
                  />
                  {newProduct.image && (
                    <span style={{ 
                      display: "block", 
                      marginTop: "8px", 
                      color: "#28a745",
                      fontSize: "14px",
                      fontWeight: "bold"
                    }}>
                      ✓ Imagen seleccionada
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "10px", 
                    fontWeight: "bold",
                    color: "#333",
                    fontSize: "15px"
                  }}>
                    Clave del Producto *
                  </label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => handleNewProductName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                      fontSize: "15px",
                      background: newProduct.image ? "white" : "#f8f9fa",
                      boxSizing: "border-box"
                    }}
                    placeholder="Ej: PROD001"
                    disabled={!newProduct.image}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "10px", 
                  fontWeight: "bold",
                  color: "#333",
                  fontSize: "15px"
                }}>
                  Nombre de Producto *
                </label>
                <input
                  type="text"
                  value={newProduct.nombreProducto}
                  onChange={(e) => handleNewProductNombre(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    fontSize: "15px",
                    background: newProduct.image ? "white" : "#f8f9fa",
                    boxSizing: "border-box"
                  }}
                  placeholder="Ej: Camiseta Básica Negra"
                  disabled={!newProduct.image}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "10px", 
                  fontWeight: "bold",
                  color: "#333",
                  fontSize: "15px"
                }}>
                  Descripción del Producto
                </label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => handleNewProductDescription(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    fontSize: "15px",
                    minHeight: "80px",
                    resize: "vertical",
                    background: newProduct.image ? "white" : "#f8f9fa",
                    boxSizing: "border-box"
                  }}
                  placeholder="Descripción del producto..."
                  disabled={!newProduct.image}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "10px", 
                    fontWeight: "bold",
                    color: "#333",
                    fontSize: "15px"
                  }}>
                    Precio del Producto *
                  </label>
                  <div style={{ position: "relative" }}>
                    <span style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#666",
                      fontWeight: "bold",
                      fontSize: "15px"
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
                        padding: "10px 12px 10px 35px",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        fontSize: "15px",
                        background: newProduct.image ? "white" : "#f8f9fa",
                        boxSizing: "border-box"
                      }}
                      placeholder="0.00"
                      disabled={!newProduct.image}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "10px", 
                    fontWeight: "bold",
                    color: "#333",
                    fontSize: "15px"
                  }}>
                    Cantidad Inicial *
                  </label>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "12px",
                    background: newProduct.image ? "white" : "#f8f9fa",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    padding: "8px",
                    opacity: newProduct.image ? 1 : 0.6
                  }}>
                    <button
                      onClick={() => handleNewProductQuantity(newProduct.quantity - 1)}
                      disabled={!newProduct.image}
                      style={{
                        background: "#6c757d",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        padding: "8px 12px",
                        cursor: newProduct.image ? "pointer" : "not-allowed",
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
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: newProduct.quantity === 0 ? "#dc3545" : "#28a745"
                    }}>
                      {newProduct.quantity}
                    </span>
                    
                    <button
                      onClick={() => handleNewProductQuantity(newProduct.quantity + 1)}
                      disabled={!newProduct.image}
                      style={{
                        background: "#6c757d",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        padding: "8px 12px",
                        cursor: newProduct.image ? "pointer" : "not-allowed",
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

              {/* Date Section */}
              <div style={{ 
                borderTop: "2px solid #e0e0e0", 
                paddingTop: "20px",
                marginTop: "20px"
              }}>
                <div style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  alignItems: "center",
                  gap: "15px"
                }}>
                  <label style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "10px",
                    fontWeight: "bold",
                    color: "#333",
                    fontSize: "15px",
                    cursor: "pointer"
                  }}>
                    <input
                      type="checkbox"
                      checked={newProduct.fechaRecepcionHoy}
                      onChange={(e) => handleNewProductFechaRecepcionHoy(e.target.checked)}
                      style={{ transform: "scale(1.2)" }}
                      disabled={!newProduct.image}
                    />
                    <span style={{ opacity: newProduct.image ? 1 : 0.6 }}>
                      La fecha de recepción es hoy
                    </span>
                  </label>
                  
                  {!newProduct.fechaRecepcionHoy && (
                    <div style={{ width: "100%", maxWidth: "250px" }}>
                      <label style={{ 
                        display: "block", 
                        marginBottom: "8px", 
                        fontWeight: "bold",
                        color: "#333",
                        fontSize: "14px",
                        textAlign: "center"
                      }}>
                        Fecha de Recepción
                      </label>
                      <input
                        type="date"
                        value={newProduct.fechaRecepcion}
                        onChange={(e) => handleNewProductFechaRecepcion(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: "1px solid #ccc",
                          borderRadius: "6px",
                          fontSize: "14px",
                          background: newProduct.image ? "white" : "#f8f9fa",
                          boxSizing: "border-box"
                        }}
                        disabled={!newProduct.image}
                      />
                    </div>
                  )}
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
                disabled={!newProduct.name.trim() || !newProduct.image || !newProduct.nombreProducto.trim()}
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
                    nombreProducto: "",
                    description: "",
                    price: "",
                    quantity: 0,
                    fechaRecepcionHoy: true,
                    fechaRecepcion: new Date().toISOString().split('T')[0]
                  });
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
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
            maxWidth: "800px",
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
              Editar {editProductData.nombreProducto || "Producto"}
            </h2>

            <div style={{
              background: "#fafafa",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              padding: "25px",
              marginBottom: "20px"
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "10px", 
                    fontWeight: "bold",
                    color: "#333",
                    fontSize: "15px"
                  }}>
                    Imagen del Producto
                  </label>
                  
                  {/* Show current image if no new image selected */}
                  {editingProduct?.imageUrl && !editProductData.image && (
                    <div style={{ marginBottom: "10px" }}>
                      <img 
                        src={`${API_URL}${editingProduct.imageUrl}`}
                        alt={editingProduct.name}
                        style={{
                          width: "80px",
                          height: "80px",
                          objectFit: "cover",
                          borderRadius: "6px",
                          border: "1px solid #ddd"
                        }}
                      />
                      <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
                        Imagen actual
                      </div>
                    </div>
                  )}
                  
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleEditProductImage(e.target.files[0])}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                      background: "white"
                    }}
                  />
                  
                  {/* Update the status message */}
                  {editProductData.image ? (
                    <span style={{ 
                      display: "block", 
                      marginTop: "8px", 
                      color: "#28a745",
                      fontSize: "14px",
                      fontWeight: "bold"
                    }}>
                      ✓ Nueva imagen seleccionada
                    </span>
                  ) : (
                    <span style={{ 
                      display: "block", 
                      marginTop: "8px", 
                      color: "#666",
                      fontSize: "14px"
                    }}>
                      {editingProduct?.imageUrl 
                        ? "Se conservará la imagen actual"
                        : "No hay imagen actual. Selecciona una imagen."}
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "10px", 
                    fontWeight: "bold",
                    color: "#333",
                    fontSize: "15px"
                  }}>
                    Clave del Producto *
                  </label>
                  <input
                    type="text"
                    value={editProductData.name}
                    onChange={(e) => handleEditProductName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                      fontSize: "15px",
                      background: "white",
                      boxSizing: "border-box"
                    }}
                    placeholder="Ej: PROD001"
                  />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "10px", 
                  fontWeight: "bold",
                  color: "#333",
                  fontSize: "15px"
                }}>
                  Nombre de Producto *
                </label>
                <input
                  type="text"
                  value={editProductData.nombreProducto}
                  onChange={(e) => handleEditProductNombre(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    fontSize: "15px",
                    background: "white",
                    boxSizing: "border-box"
                  }}
                  placeholder="Ej: Camiseta Básica Negra"
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "10px", 
                  fontWeight: "bold",
                  color: "#333",
                  fontSize: "15px"
                }}>
                  Descripción del Producto
                </label>
                <textarea
                  value={editProductData.description}
                  onChange={(e) => handleEditProductDescription(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    fontSize: "15px",
                    minHeight: "80px",
                    resize: "vertical",
                    background: "white",
                    boxSizing: "border-box"
                  }}
                  placeholder="Descripción del producto..."
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "10px", 
                    fontWeight: "bold",
                    color: "#333",
                    fontSize: "15px"
                  }}>
                    Precio del Producto *
                  </label>
                  <div style={{ position: "relative" }}>
                    <span style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#666",
                      fontWeight: "bold",
                      fontSize: "15px"
                    }}>
                      $
                    </span>
                    <input
                      type="number"
                      value={editProductData.price}
                      onChange={(e) => handleEditProductPrice(e.target.value)}
                      step="0.01"
                      min="0"
                      style={{
                        width: "100%",
                        padding: "10px 12px 10px 35px",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        fontSize: "15px",
                        background: "white",
                        boxSizing: "border-box"
                      }}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "10px", 
                    fontWeight: "bold",
                    color: "#333",
                    fontSize: "15px"
                  }}>
                    Cantidad *
                  </label>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "12px",
                    background: "white",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    padding: "8px"
                  }}>
                    <button
                      onClick={() => handleEditProductQuantity(editProductData.quantity - 1)}
                      style={{
                        background: "#6c757d",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
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
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: editProductData.quantity === 0 ? "#dc3545" : "#28a745"
                    }}>
                      {editProductData.quantity}
                    </span>
                    
                    <button
                      onClick={() => handleEditProductQuantity(editProductData.quantity + 1)}
                      style={{
                        background: "#6c757d",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
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

              {/* Date Section */}
              <div style={{ 
                borderTop: "2px solid #e0e0e0", 
                paddingTop: "20px",
                marginTop: "20px"
              }}>
                <div style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  alignItems: "center",
                  gap: "15px"
                }}>
                  <label style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "10px",
                    fontWeight: "bold",
                    color: "#333",
                    fontSize: "15px",
                    cursor: "pointer"
                  }}>
                    <input
                      type="checkbox"
                      checked={editProductData.fechaRecepcionHoy}
                      onChange={(e) => handleEditProductFechaRecepcionHoy(e.target.checked)}
                      style={{ transform: "scale(1.2)" }}
                    />
                    <span>
                      La fecha de recepción es hoy
                    </span>
                  </label>
                  
                  {!editProductData.fechaRecepcionHoy && (
                    <div style={{ width: "100%", maxWidth: "250px" }}>
                      <label style={{ 
                        display: "block", 
                        marginBottom: "8px", 
                        fontWeight: "bold",
                        color: "#333",
                        fontSize: "14px",
                        textAlign: "center"
                      }}>
                        Fecha de Recepción
                      </label>
                      <input
                        type="date"
                        value={editProductData.fechaRecepcion}
                        onChange={(e) => handleEditProductFechaRecepcion(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: "1px solid #ccc",
                          borderRadius: "6px",
                          fontSize: "14px",
                          background: "white",
                          boxSizing: "border-box"
                        }}
                      />
                    </div>
                  )}
                </div>
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
                onClick={handleSaveProduct}
                disabled={!editProductData.name.trim() || !editProductData.nombreProducto.trim()}
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
                onClick={handleCancelEdit}
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
                <strong>¿Estás seguro de que quieres eliminar la marca "{store.name}"?</strong>
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