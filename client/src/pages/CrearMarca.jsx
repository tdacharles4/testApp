import React, { useState, useEffect } from "react";
import axios from "axios";
import { upload } from '@vercel/blob/client';

export default function CrearMarca({ user }) {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const [storeName, setStoreName] = useState("");
  const [storeTag, setStoreTag] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  
  // Contract type fields
  const [contractType, setContractType] = useState("");
  const [contractPercentage, setContractPercentage] = useState("25.00"); // Default value set
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
  
  // Generate store tag automatically based on store name with uniqueness check
  useEffect(() => {
    const generateTag = async () => {
      const uniqueTag = await generateUniqueTag(storeName);
      setStoreTag(uniqueTag);
    };
    
    // Debounce the tag generation to avoid too many API calls
    const timeoutId = setTimeout(() => {
      generateTag();
    }, 500); // Wait 500ms after user stops typing
    
    return () => clearTimeout(timeoutId);
  }, [storeName]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check if tag exists in database
const checkTagExists = async (tag) => {
  if (!tag || tag.length !== 4) return false;
  
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/api/tiendas`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!response.ok) return false;
    
    const data = await response.json();
    const tiendas = data.tiendas || [];
    
    return tiendas.some(tienda => tienda.tag === tag.toUpperCase());
  } catch (error) {
    console.error("Error checking tag:", error);
    return false;
  }
};

// Generate unique tag
const generateUniqueTag = async (name) => {
  if (!name.trim()) return "";

  const words = name.trim().split(/\s+/).filter(word => word.length > 0);
  let baseTag = "";
  
  if (words.length === 1) {
    // Single word: take first 4 letters
    baseTag = words[0].substring(0, 4).toUpperCase();
  } else {
    // Multiple words: take first letter of each word
    const initials = words.map(word => word[0].toUpperCase()).join('');
    
    if (initials.length >= 4) {
      // If we have 4 or more initials, take first 4
      baseTag = initials.substring(0, 4);
    } else {
      // If less than 4 initials, take remaining letters from last word
      const remainingChars = 4 - initials.length;
      const lastWord = words[words.length - 1];
      const additionalChars = lastWord.substring(1, 1 + remainingChars).toUpperCase();
      baseTag = initials + additionalChars;
      
      // If still not enough characters, pad with X
      if (baseTag.length < 4) {
        baseTag = baseTag.padEnd(4, 'X');
      }
    }
  }
  
  // Check if base tag exists
  const exists = await checkTagExists(baseTag);
  if (!exists) {
    return baseTag;
  }
  
  // If exists, try variations
  // Strategy 1: Replace last char with numbers 2-9
  for (let i = 2; i <= 9; i++) {
    const variant = baseTag.substring(0, 3) + i;
    const variantExists = await checkTagExists(variant);
    if (!variantExists) {
      return variant;
    }
  }
  
  // Strategy 2: Replace last 2 chars with numbers 10-99
  for (let i = 10; i <= 99; i++) {
    const variant = baseTag.substring(0, 2) + i;
    const variantExists = await checkTagExists(variant);
    if (!variantExists) {
      return variant;
    }
  }
  
  // Fallback: use random characters (should rarely happen)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (let attempt = 0; attempt < 100; attempt++) {
    let randomTag = baseTag.substring(0, 2);
    for (let i = 0; i < 2; i++) {
      randomTag += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const randomExists = await checkTagExists(randomTag);
    if (!randomExists) {
      return randomTag;
    }
  }
  
  return baseTag; // Ultimate fallback
};

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
        alert("Por favor completa el nombre de la marca");
        return;
      }

      if (storeTag.length !== 4) {
        alert("La clave de marca debe tener exactamente 4 caracteres");
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

      // Placeholder image URL (React logo or any default image)
      const PLACEHOLDER_IMAGE = "/logo192.png"; // React logo from public folder

      // Upload images to Vercel Blob and prepare products data
      const productsWithUrls = await Promise.all(
        products.map(async (p) => {
          // Skip products without required fields
          if (!p.name.trim() || !p.nombreProducto.trim()) {
            return null;
          }

          let imageUrl = PLACEHOLDER_IMAGE;

          // If there's an image, upload it to Vercel Blob
          if (p.image) {
            try {
              const token = localStorage.getItem("token");
              const blob = await upload(p.image.name, p.image, {
                access: 'public',
                handleUploadUrl: `${API_URL}/api/upload`,
                clientPayload: JSON.stringify({ token })
              });
              imageUrl = blob.url;
            } catch (uploadError) {
              console.error("Error uploading image:", uploadError);
              alert(`Advertencia: No se pudo subir la imagen de ${p.nombreProducto}. Se usará imagen por defecto.`);
            }
          }

          return {
            clave: p.name.trim(),
            nombre: p.nombreProducto.trim(),
            description: p.description.trim(),
            imageUrl: imageUrl,
            price: p.price || "0",
            quantity: p.quantity.toString(),
            fechaRecepcion: p.fechaRecepcion
          };
        })
      );

      // Filter out null entries (products without required fields)
      const validProducts = productsWithUrls.filter(p => p !== null);

      if (validProducts.length === 0) {
        alert("Debes agregar al menos un producto con clave y nombre");
        return;
      }

      const payload = {
        storeName: storeName.trim(),
        storeTag: storeTag.trim().toUpperCase(),
        contractType: contractType,
        contractValue: contractType === "Porcentaje" ? contractPercentage : contractPiso,
        storeDescription: storeDescription.trim() || undefined,
        contacto: contacto.trim() || undefined,
        banco: banco.trim() || undefined,
        numeroCuenta: numeroCuenta.trim() || undefined,
        clabe: clabe.trim() || undefined,
        tarjeta: tarjeta.trim() || undefined,
        products: validProducts
      };

      const token = localStorage.getItem("token");

      await axios.post(
        `${API_URL}/api/tiendas`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert("Marca creada exitosamente");
      
      // Reset all form states
      setStoreName("");
      setStoreTag("");
      setStoreDescription("");
      setContractType("");
      setContractPercentage("25.00");
      setContractPiso("");
      setContacto("");
      setBanco("");
      setNumeroCuenta("");
      setClabe("");
      setTarjeta("");
      
      // Reset products to initial state
      const today = new Date().toISOString().split('T')[0];
      setProducts([{ 
        image: null, 
        name: "", 
        nombreProducto: "", 
        description: "", 
        price: "", 
        quantity: 0,
        fechaRecepcionHoy: true,
        fechaRecepcion: today
      }]);
      
    } catch (err) {
      console.error(err);
      alert("Error al crear marca: " + (err.response?.data?.message || err.message));
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
          Crear Nueva Marca
        </h1>
        <p style={{ color: "#666", margin: 0 }}>
          Completa la información de la marca y añade sus productos
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
          Información de la Marca
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
              Nombre de Marca *
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
              placeholder="Ej: Marca Centro"
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
              Clave Única de Marca *
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
              {storeTag || "Ingresa el nombre de la marca"}
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
                    onChange={(e) => {
                      setContractType(e.target.value);
                      if (e.target.value === "Porcentaje") {
                        setContractPercentage("25.00"); // Set default value when selected
                      }
                    }}
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
              placeholder="Descripción opcional de la marca..."
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
                Imagen del Producto (opcional)
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
              {!p.image && (
                <span style={{ 
                  display: "block", 
                  marginTop: "8px", 
                  color: "#6c757d",
                  fontSize: "14px"
                }}>
                  Se usará imagen por defecto
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
                  background: "white",
                  boxSizing: "border-box"
                }}
                placeholder="Ej: PROD001"
              />
            </div>
          </div>

          {/* Nombre de Producto Field */}
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
                Cantidad Inicial *
              </label>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "12px",
                background: "white",
                border: "1px solid #ccc",
                borderRadius: "6px",
                padding: "10px"
              }}>
                <button
                  onClick={() => updateQuantity(i, p.quantity - 1)}
                  style={{
                    background: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    padding: "10px 14px",
                    cursor: "pointer",
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
                  style={{
                    background: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    padding: "10px 14px",
                    cursor: "pointer",
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
                  checked={p.fechaRecepcionHoy}
                  onChange={(e) => updateFechaRecepcionHoy(i, e.target.checked)}
                  style={{ transform: "scale(1.2)" }}
                />
                <span>
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
                      background: "white",
                      boxSizing: "border-box"
                    }}
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
          Guardar Marca
        </button>
      </div>
    </div>
  );
}