import React, { useState } from "react";
import axios from "axios";

export default function CrearTienda({ user }) {
  const [storeName, setStoreName] = useState("");
  const [storeTag, setStoreTag] = useState("");
  const [storeLocation, setStoreLocation] = useState("");
  const [storeDescription, setStoreDescription] = useState("");

  const [products, setProducts] = useState([
    { image: null, name: "", price: "", quantity: 0 }
  ]);

  const addProduct = () => {
    if (products.length >= 10) return;
    setProducts([...products, { image: null, name: "", price: "", quantity: 0 }]);
  };

  const removeProduct = (index) => {
    if (products.length === 1) return; // Keep at least one product
    const updated = products.filter((_, i) => i !== index);
    setProducts(updated);
  };

  const updateImage = (index, file) => {
    const updated = [...products];
    updated[index].image = file;
    setProducts(updated);
  };

  const updateName = (index, value) => {
    const updated = [...products];
    updated[index].name = value;
    setProducts(updated);
  };

  const updatePrice = (index, value) => {
    const updated = [...products];
    updated[index].price = value;
    setProducts(updated);
  };

  const updateQuantity = (index, value) => {
    const updated = [...products];
    updated[index].quantity = Math.max(0, value);
    setProducts(updated);
  };

  const submitStore = async () => {
    try {
      // Basic validation
      if (!storeName.trim() || !storeTag.trim()) {
        alert("Por favor completa el nombre y clave de la tienda");
        return;
      }

      if (storeTag.length > 4) {
        alert("La clave de tienda no puede tener más de 4 caracteres");
        return;
      }

      const form = new FormData();
      form.append("storeName", storeName.trim());
      form.append("storeTag", storeTag.trim().toUpperCase());
      
      if (storeLocation.trim()) {
        form.append("storeLocation", storeLocation.trim());
      }
      
      if (storeDescription.trim()) {
        form.append("storeDescription", storeDescription.trim());
      }

      // Add products data
      products.forEach((p) => {
        if (p.image) {
          form.append("productImages", p.image);
          form.append("productClaves[]", p.name.trim());
          form.append("productPrices[]", p.price || "0");
          form.append("productQuantities[]", p.quantity.toString());
        }
      });

      const token = localStorage.getItem("token");

      await axios.post(
        "http://localhost:5000/api/tiendas",
        form,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert("Tienda creada exitosamente");
      
      // Reset form
      setStoreName("");
      setStoreTag("");
      setStoreLocation("");
      setStoreDescription("");
      setProducts([{ image: null, name: "", price: "", quantity: 0 }]);
      
    } catch (err) {
      console.error(err);
      alert("Error al crear tienda: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ 
          margin: "0 0 10px 0", 
          color: "#333",
          fontSize: "28px",
          fontWeight: "bold"
        }}>
          Crear Nueva Tienda
        </h1>
        <p style={{ color: "#666", margin: 0 }}>
          Completa la información de la tienda y añade sus productos
        </p>
      </div>

      {/* Store Information Card */}
      <div style={{
        background: "white",
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "25px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "30px"
      }}>
        <h2 style={{ 
          margin: "0 0 20px 0", 
          color: "#333",
          fontSize: "20px",
          borderBottom: "2px solid #f0f0f0",
          paddingBottom: "10px"
        }}>
          Información de la Tienda
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
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
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
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

          <div>
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
              value={storeTag}
              onChange={(e) => setStoreTag(e.target.value.toUpperCase())}
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

          <div>
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
              value={storeLocation}
              onChange={(e) => setStoreLocation(e.target.value)}
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
              value={storeDescription}
              onChange={(e) => setStoreDescription(e.target.value)}
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
      </div>

      {/* Products Section */}
      <div style={{
        background: "white",
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "25px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "30px"
      }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: "20px",
          borderBottom: "2px solid #f0f0f0",
          paddingBottom: "10px"
        }}>
          <h2 style={{ 
            margin: 0, 
            color: "#333",
            fontSize: "20px"
          }}>
            Inventario de Productos
          </h2>
          <span style={{ color: "#666", fontSize: "14px" }}>
            {products.length} / 10 productos
          </span>
        </div>

        {products.map((p, i) => (
          <div key={i} style={{
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "20px",
            background: "#fafafa"
          }}>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginBottom: "15px"
            }}>
              <h3 style={{ margin: 0, color: "#333", fontSize: "18px" }}>
                Producto #{i + 1}
              </h3>
              {products.length > 1 && (
                <button
                  onClick={() => removeProduct(i)}
                  style={{
                    background: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    padding: "6px 12px",
                    cursor: "pointer",
                    fontSize: "12px"
                  }}
                >
                  Eliminar
                </button>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div>
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
                  onChange={(e) => updateImage(i, e.target.files[0])}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    background: "white"
                  }}
                />
                {p.image && (
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

              <div>
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
                  value={p.name}
                  onChange={(e) => updateName(i, e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    fontSize: "16px",
                    background: p.image ? "white" : "#f8f9fa"
                  }}
                  placeholder="Ej: PROD001"
                  disabled={!p.image}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginTop: "15px" }}>
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontWeight: "bold",
                  color: "#333"
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
                    fontWeight: "bold"
                  }}>
                    $
                  </span>
                  <input
                    type="number"
                    value={p.price}
                    onChange={(e) => updatePrice(i, e.target.value)}
                    step="0.01"
                    min="0"
                    style={{
                      width: "100%",
                      padding: "12px 12px 12px 30px",
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                      fontSize: "16px",
                      background: p.image ? "white" : "#f8f9fa"
                    }}
                    placeholder="0.00"
                    disabled={!p.image}
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
                  Cantidad Inicial *
                </label>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "10px",
                  background: p.image ? "white" : "#f8f9fa",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  padding: "8px",
                  opacity: p.image ? 1 : 0.6
                }}>
                  <button
                    onClick={() => updateQuantity(i, p.quantity - 1)}
                    disabled={!p.image}
                    style={{
                      background: "#6c757d",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "8px 12px",
                      cursor: p.image ? "pointer" : "not-allowed",
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
                    color: p.quantity === 0 ? "#dc3545" : "#28a745"
                  }}>
                    {p.quantity}
                  </span>
                  
                  <button
                    onClick={() => updateQuantity(i, p.quantity + 1)}
                    disabled={!p.image}
                    style={{
                      background: "#6c757d",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "8px 12px",
                      cursor: p.image ? "pointer" : "not-allowed",
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
        ))}

        {products.length < 10 && (
          <button
            style={{
              background: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "12px 24px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              margin: "0 auto"
            }}
            onClick={addProduct}
          >
            <span>+</span>
            Agregar otro producto
          </button>
        )}
      </div>

      {/* Submit Button */}
      <div style={{ textAlign: "center" }}>
        <button
          style={{
            background: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "15px 40px",
            cursor: "pointer",
            fontSize: "18px",
            fontWeight: "bold",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
          }}
          onClick={submitStore}
        >
          Guardar Tienda
        </button>
      </div>
    </div>
  );
} 