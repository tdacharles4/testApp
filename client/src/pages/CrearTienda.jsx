import React, { useState, useEffect } from "react";
import axios from "axios";

export default function CrearTienda({ user }) {
  const [storeName, setStoreName] = useState("");
  const [storeTag, setStoreTag] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  
  // Contract type fields
  const [contractType, setContractType] = useState("");
  const [contractPercentage, setContractPercentage] = useState("");
  const [contractPiso, setContractPiso] = useState("");
  
  // Contact and bank fields
  const [contacto, setContacto] = useState("");
  const [banco, setBanco] = useState("");
  const [numeroCuenta, setNumeroCuenta] = useState("");
  const [clabe, setClabe] = useState("");
  const [tarjeta, setTarjeta] = useState("");

  const [products, setProducts] = useState([
    { 
      image: null, 
      name: "", 
      nombreProducto: "", // New field
      description: "", 
      price: "", 
      quantity: 0,
      fechaRecepcionHoy: true,
      fechaRecepcion: new Date().toISOString().split('T')[0]
    }
  ]);

  // Generate store tag automatically based on store name
  useEffect(() => {
    if (!storeName.trim()) {
      setStoreTag("");
      return;
    }

    const name = storeName.trim();
    const words = name.split(/\s+/).filter(word => word.length > 0);
    
    let generatedTag = "";
    
    if (words.length === 1) {
      // Single word: take first 4 letters
      generatedTag = words[0].substring(0, 4).toUpperCase();
    } else {
      // Multiple words: take first letter of each word
      const initials = words.map(word => word[0].toUpperCase()).join('');
      
      if (initials.length >= 4) {
        // If we have 4 or more initials, take first 4
        generatedTag = initials.substring(0, 4);
      } else {
        // If less than 4 initials, take remaining letters from last word
        const remainingChars = 4 - initials.length;
        const lastWord = words[words.length - 1];
        const additionalChars = lastWord.substring(1, 1 + remainingChars).toUpperCase();
        generatedTag = initials + additionalChars;
        
        // If still not enough characters, pad with X
        if (generatedTag.length < 4) {
          generatedTag = generatedTag.padEnd(4, 'X');
        }
      }
    }
    
    setStoreTag(generatedTag);
  }, [storeName]);

  const addProduct = () => {
    if (products.length >= 10) return;
    const today = new Date().toISOString().split('T')[0];
    setProducts([...products, { 
      image: null, 
      name: "", 
      nombreProducto: "", // New field
      description: "", 
      price: "", 
      quantity: 0,
      fechaRecepcionHoy: true,
      fechaRecepcion: today
    }]);
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

  const updateNombreProducto = (index, value) => {
    const updated = [...products];
    updated[index].nombreProducto = value;
    setProducts(updated);
  };

  const updateDescription = (index, value) => {
    const updated = [...products];
    updated[index].description = value;
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

  const updateFechaRecepcionHoy = (index, checked) => {
    const updated = [...products];
    updated[index].fechaRecepcionHoy = checked;
    if (checked) {
      // If checked, set fechaRecepcion to today
      updated[index].fechaRecepcion = new Date().toISOString().split('T')[0];
    }
    setProducts(updated);
  };

  const updateFechaRecepcion = (index, date) => {
    const updated = [...products];
    updated[index].fechaRecepcion = date;
    setProducts(updated);
  };

  const submitStore = async () => {
    try {
      // Basic validation
      if (!storeName.trim() || !storeTag.trim()) {
        alert("Por favor completa el nombre de la tienda");
        return;
      }

      if (storeTag.length !== 4) {
        alert("La clave de tienda debe tener exactamente 4 caracteres");
        return;
      }

      // Contract validation
      if (!contractType) {
        alert("Por favor selecciona un tipo de contrato");
        return;
      }

      if (contractType === "Porcentaje" && (!contractPercentage || parseFloat(contractPercentage) < 0 || parseFloat(contractPercentage) > 100)) {
        alert("Por favor ingresa un porcentaje válido entre 0 y 100");
        return;
      }

      if (contractType === "Piso" && (!contractPiso || parseFloat(contractPiso) < 0)) {
        alert("Por favor ingresa un monto de piso válido");
        return;
      }

      // Bank field validations
      if (numeroCuenta && (numeroCuenta.length < 10 || numeroCuenta.length > 12)) {
        alert("El número de cuenta debe tener entre 10 y 12 caracteres");
        return;
      }

      if (clabe && clabe.length !== 18) {
        alert("La CLABE debe tener exactamente 18 caracteres");
        return;
      }

      if (tarjeta && tarjeta.length !== 16) {
        alert("El número de tarjeta debe tener exactamente 16 caracteres");
        return;
      }

      const form = new FormData();
      form.append("storeName", storeName.trim());
      form.append("storeTag", storeTag.trim().toUpperCase());
      form.append("contractType", contractType);
      
      if (contractType === "Porcentaje") {
        form.append("contractValue", contractPercentage);
      } else if (contractType === "Piso") {
        form.append("contractValue", contractPiso);
      }
      
      if (storeDescription.trim()) {
        form.append("storeDescription", storeDescription.trim());
      }
      
      // Add contact and bank information
      if (contacto.trim()) form.append("contacto", contacto.trim());
      if (banco.trim()) form.append("banco", banco.trim());
      if (numeroCuenta.trim()) form.append("numeroCuenta", numeroCuenta.trim());
      if (clabe.trim()) form.append("clabe", clabe.trim());
      if (tarjeta.trim()) form.append("tarjeta", tarjeta.trim());

      // Add products data
      products.forEach((p) => {
        if (p.image) {
          form.append("productImages", p.image);
          form.append("productClaves[]", p.name.trim());
          form.append("productNombres[]", p.nombreProducto.trim()); // New field
          form.append("productDescriptions[]", p.description.trim());
          form.append("productPrices[]", p.price || "0");
          form.append("productQuantities[]", p.quantity.toString());
          form.append("productFechasRecepcion[]", p.fechaRecepcion);
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
      setStoreDescription("");
      setContractType("");
      setContractPercentage("");
      setContractPiso("");
      setContacto("");
      setBanco("");
      setNumeroCuenta("");
      setClabe("");
      setTarjeta("");
      const today = new Date().toISOString().split('T')[0];
      setProducts([{ 
        image: null, 
        name: "", 
        nombreProducto: "", // New field
        description: "", 
        price: "", 
        quantity: 0,
        fechaRecepcionHoy: true,
        fechaRecepcion: today
      }]);
      
    } catch (err) {
      console.error(err);
      alert("Error al crear tienda: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
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
        padding: "30px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "30px"
      }}>
        <h2 style={{ 
          margin: "0 0 25px 0", 
          color: "#333",
          fontSize: "20px",
          borderBottom: "2px solid #f0f0f0",
          paddingBottom: "15px"
        }}>
          Información de la Tienda
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          <div>
            <label style={{ 
              display: "block", 
              marginBottom: "10px", 
              fontWeight: "bold",
              color: "#333",
              fontSize: "15px"
            }}>
              Nombre de Tienda *
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              style={{
                width: "100%",
                padding: "14px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                fontSize: "16px",
                boxSizing: "border-box"
              }}
              placeholder="Ej: Tienda Centro"
            />
          </div>

          <div>
            <label style={{ 
              display: "block", 
              marginBottom: "10px", 
              fontWeight: "bold",
              color: "#333",
              fontSize: "15px"
            }}>
              Clave Única de Tienda *
            </label>
            <div style={{
              padding: "14px",
              border: "1px solid #28a745",
              borderRadius: "6px",
              background: "#f8fff8",
              fontSize: "16px",
              fontWeight: "bold",
              color: "#28a745",
              textAlign: "center",
              minHeight: "52px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              {storeTag || "Ingresa el nombre de la tienda"}
            </div>
            <p style={{ margin: "10px 0 0 0", color: "#666", fontSize: "14px" }}>
              Clave generada automáticamente (4 caracteres)
            </p>
          </div>

          {/* Contract Type */}
          <div>
            <label style={{ 
              display: "block", 
              marginBottom: "15px", 
              fontWeight: "bold",
              color: "#333",
              fontSize: "15px"
            }}>
              Tipo de Contrato *
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", padding: "8px 0" }}>
                <input
                  type="radio"
                  name="contractType"
                  value="DCE"
                  checked={contractType === "DCE"}
                  onChange={(e) => setContractType(e.target.value)}
                  style={{ transform: "scale(1.2)" }}
                />
                <span style={{ fontWeight: "bold", fontSize: "15px" }}>DCE</span>
              </label>
              
              <div style={{ marginLeft: "0" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", padding: "8px 0" }}>
                  <input
                    type="radio"
                    name="contractType"
                    value="Porcentaje"
                    checked={contractType === "Porcentaje"}
                    onChange={(e) => setContractType(e.target.value)}
                    style={{ transform: "scale(1.2)" }}
                  />
                  <span style={{ fontWeight: "bold", fontSize: "15px" }}>Porcentaje</span>
                </label>
                {contractType === "Porcentaje" && (
                  <div style={{ marginLeft: "35px", marginTop: "12px" }}>
                    <div style={{ position: "relative", maxWidth: "250px" }}>
                      <input
                        type="number"
                        value={contractPercentage}
                        onChange={(e) => setContractPercentage(e.target.value)}
                        min="0"
                        max="100"
                        step="0.01"
                        style={{
                          width: "100%",
                          padding: "12px 45px 12px 15px",
                          border: "1px solid #ccc",
                          borderRadius: "6px",
                          fontSize: "15px",
                          boxSizing: "border-box"
                        }}
                        placeholder="25.00"
                      />
                      <span style={{
                        position: "absolute",
                        right: "15px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#666",
                        fontWeight: "bold",
                        fontSize: "15px"
                      }}>
                        %
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <div style={{ marginLeft: "0" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", padding: "8px 0" }}>
                  <input
                    type="radio"
                    name="contractType"
                    value="Piso"
                    checked={contractType === "Piso"}
                    onChange={(e) => setContractType(e.target.value)}
                    style={{ transform: "scale(1.2)" }}
                  />
                  <span style={{ fontWeight: "bold", fontSize: "15px" }}>Piso</span>
                </label>
                {contractType === "Piso" && (
                  <div style={{ marginLeft: "35px", marginTop: "12px" }}>
                    <div style={{ position: "relative", maxWidth: "250px" }}>
                      <span style={{
                        position: "absolute",
                        left: "15px",
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
                        value={contractPiso}
                        onChange={(e) => setContractPiso(e.target.value)}
                        step="0.01"
                        min="0"
                        style={{
                          width: "100%",
                          padding: "12px 15px 12px 40px",
                          border: "1px solid #ccc",
                          borderRadius: "6px",
                          fontSize: "15px",
                          boxSizing: "border-box"
                        }}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", padding: "8px 0" }}>
                <input
                  type="radio"
                  name="contractType"
                  value="Estetica Unisex"
                  checked={contractType === "Estetica Unisex"}
                  onChange={(e) => setContractType(e.target.value)}
                  style={{ transform: "scale(1.2)" }}
                />
                <span style={{ fontWeight: "bold", fontSize: "15px" }}>Estetica Unisex</span>
              </label>
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
              Descripción
            </label>
            <textarea
              value={storeDescription}
              onChange={(e) => setStoreDescription(e.target.value)}
              style={{
                width: "100%",
                padding: "14px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                fontSize: "15px",
                minHeight: "100px",
                resize: "vertical",
                boxSizing: "border-box"
              }}
              placeholder="Descripción opcional de la tienda..."
              maxLength="500"
            />
          </div>
        </div>
      </div>

      {/* Contact and Bank Information Card */}
      <div style={{
        background: "white",
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "30px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "30px"
      }}>
        <h2 style={{ 
          margin: "0 0 25px 0", 
          color: "#333",
          fontSize: "20px",
          borderBottom: "2px solid #f0f0f0",
          paddingBottom: "15px"
        }}>
          Información de Contacto y Banco
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <label style={{ 
              display: "block", 
              marginBottom: "10px", 
              fontWeight: "bold",
              color: "#333",
              fontSize: "15px"
            }}>
              Contacto
            </label>
            <input
              type="email"
              value={contacto}
              onChange={(e) => setContacto(e.target.value)}
              style={{
                width: "100%",
                padding: "14px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                fontSize: "15px",
                boxSizing: "border-box"
              }}
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <label style={{ 
              display: "block", 
              marginBottom: "10px", 
              fontWeight: "bold",
              color: "#333",
              fontSize: "15px"
            }}>
              Banco
            </label>
            <input
              type="text"
              value={banco}
              onChange={(e) => setBanco(e.target.value)}
              style={{
                width: "100%",
                padding: "14px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                fontSize: "15px",
                boxSizing: "border-box"
              }}
              placeholder="Nombre del banco"
            />
          </div>

          <div>
            <label style={{ 
              display: "block", 
              marginBottom: "10px", 
              fontWeight: "bold",
              color: "#333",
              fontSize: "15px"
            }}>
              Número de Cuenta (10-12 caracteres)
            </label>
            <input
              type="text"
              value={numeroCuenta}
              onChange={(e) => setNumeroCuenta(e.target.value)}
              style={{
                width: "100%",
                padding: "14px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                fontSize: "15px",
                boxSizing: "border-box"
              }}
              placeholder="Número de cuenta bancaria"
              maxLength="12"
            />
          </div>

          <div>
            <label style={{ 
              display: "block", 
              marginBottom: "10px", 
              fontWeight: "bold",
              color: "#333",
              fontSize: "15px"
            }}>
              CLABE (18 caracteres)
            </label>
            <input
              type="text"
              value={clabe}
              onChange={(e) => setClabe(e.target.value)}
              style={{
                width: "100%",
                padding: "14px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                fontSize: "15px",
                boxSizing: "border-box"
              }}
              placeholder="CLABE interbancaria"
              maxLength="18"
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "10px", 
              fontWeight: "bold",
              color: "#333",
              fontSize: "15px"
            }}>
              Número de Tarjeta (16 caracteres)
            </label>
            <input
              type="text"
              value={tarjeta.replace(/(.{4})/g, '$1 ').trim()}
              onChange={(e) => {
                const value = e.target.value.replace(/\s/g, ''); // Remove all spaces
                if (value.length <= 16) {
                  setTarjeta(value);
                }
              }}
              style={{
                width: "100%",
                padding: "14px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                fontSize: "15px",
                boxSizing: "border-box",
                letterSpacing: "1px"
              }}
              placeholder="1234 5678 9012 3456"
              maxLength="19" // 16 digits + 3 spaces
            />
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div style={{
        background: "white",
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "30px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "30px"
      }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: "25px",
          borderBottom: "2px solid #f0f0f0",
          paddingBottom: "15px"
        }}>
          <h2 style={{ 
            margin: 0, 
            color: "#333",
            fontSize: "20px"
          }}>
            Inventario de Productos
          </h2>
          <span style={{ color: "#666", fontSize: "15px" }}>
            {products.length} / 10 productos
          </span>
        </div>

        {products.map((p, i) => (
          <div key={i} style={{
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            padding: "25px",
            marginBottom: "25px",
            background: "#fafafa"
          }}>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginBottom: "20px"
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
                    borderRadius: "6px",
                    padding: "8px 16px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "bold"
                  }}
                >
                  Eliminar
                </button>
              )}
            </div>

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
                  onChange={(e) => updateImage(i, e.target.files[0])}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    background: "white",
                    boxSizing: "border-box"
                  }}
                />
                {p.image && (
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
                  value={p.name}
                  onChange={(e) => updateName(i, e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    fontSize: "15px",
                    background: p.image ? "white" : "#f8f9fa",
                    boxSizing: "border-box"
                  }}
                  placeholder="Ej: PROD001"
                  disabled={!p.image}
                />
              </div>
            </div>

            {/* New Nombre de Producto Field */}
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
                value={p.nombreProducto}
                onChange={(e) => updateNombreProducto(i, e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  fontSize: "15px",
                  background: p.image ? "white" : "#f8f9fa",
                  boxSizing: "border-box"
                }}
                placeholder="Ej: Camiseta Básica Negra"
                disabled={!p.image}
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
                value={p.description}
                onChange={(e) => updateDescription(i, e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  fontSize: "15px",
                  minHeight: "80px",
                  resize: "vertical",
                  background: p.image ? "white" : "#f8f9fa",
                  boxSizing: "border-box"
                }}
                placeholder="Descripción del producto..."
                disabled={!p.image}
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
                    left: "15px",
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
                    value={p.price}
                    onChange={(e) => updatePrice(i, e.target.value)}
                    step="0.01"
                    min="0"
                    style={{
                      width: "100%",
                      padding: "12px 15px 12px 40px",
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                      fontSize: "15px",
                      background: p.image ? "white" : "#f8f9fa",
                      boxSizing: "border-box"
                    }}
                    placeholder="0.00"
                    disabled={!p.image}
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
                  background: p.image ? "white" : "#f8f9fa",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  padding: "10px",
                  opacity: p.image ? 1 : 0.6
                }}>
                  <button
                    onClick={() => updateQuantity(i, p.quantity - 1)}
                    disabled={!p.image}
                    style={{
                      background: "#6c757d",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      padding: "10px 14px",
                      cursor: p.image ? "pointer" : "not-allowed",
                      fontSize: "16px",
                      fontWeight: "bold",
                      minWidth: "45px"
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
                      borderRadius: "6px",
                      padding: "10px 14px",
                      cursor: p.image ? "pointer" : "not-allowed",
                      fontSize: "16px",
                      fontWeight: "bold",
                      minWidth: "45px"
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Date Section - Centered Checkbox Only */}
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
                    checked={p.fechaRecepcionHoy}
                    onChange={(e) => updateFechaRecepcionHoy(i, e.target.checked)}
                    style={{ transform: "scale(1.2)" }}
                    disabled={!p.image}
                  />
                  <span style={{ opacity: p.image ? 1 : 0.6 }}>
                    La fecha de recepción es hoy
                  </span>
                </label>
                
                {!p.fechaRecepcionHoy && (
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
                      value={p.fechaRecepcion}
                      onChange={(e) => updateFechaRecepcion(i, e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        fontSize: "14px",
                        background: p.image ? "white" : "#f8f9fa",
                        boxSizing: "border-box"
                      }}
                      disabled={!p.image}
                    />
                  </div>
                )}
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
              padding: "14px 28px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "10px",
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
            padding: "16px 50px",
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