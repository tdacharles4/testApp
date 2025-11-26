import { useEffect, useState } from "react";

export default function RegistroVenta() {
  const [stores, setStores] = useState([]);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);

  const [selectedStore, setSelectedStore] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [amount, setAmount] = useState("");
  const [itemPrice, setItemPrice] = useState(0);
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountType, setDiscountType] = useState("percentage"); // "percentage" or "fixed"
  const [discountValue, setDiscountValue] = useState("");

  const [modalOpen, setModalOpen] = useState(false);

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const user = storedUser ? storedUser : null;

  useEffect(() => {
    const fetchData = async () => {
      const storesRes = await fetch("http://localhost:5000/api/tiendas");
      const storesData = await storesRes.json();
      setStores(storesData);

      const allItems = storesData.flatMap((store) =>
        (store.products || []).map((item) => ({
          ...item,
          storeTag: store.tag,
          storeName: store.name,
        }))
      );

      setItems(allItems);
      setFilteredItems(allItems);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedStore) setFilteredItems(items);
    else setFilteredItems(items.filter((i) => i.storeTag === selectedStore));
  }, [selectedStore, items]);

  useEffect(() => {
    if (selectedItem) {
      const found = items.find((i) => i.clave === selectedItem);
      if (found) {
        setSelectedStore(found.storeTag);
        setItemPrice(found.price || 0);
        // Set amount to full price by default
        setAmount(found.price || "");
      }
    } else {
      setItemPrice(0);
      setAmount("");
    }
  }, [selectedItem, items]);

  useEffect(() => {
    if (selectedItem && itemPrice > 0) {
      if (discountEnabled && discountValue) {
        if (discountType === "percentage") {
          const discountAmount = (itemPrice * parseFloat(discountValue)) / 100;
          const finalPrice = itemPrice - discountAmount;
          setAmount(finalPrice.toFixed(2));
        } else {
          // Fixed discount
          const finalPrice = itemPrice - parseFloat(discountValue);
          setAmount(Math.max(0, finalPrice).toFixed(2));
        }
      } else {
        // No discount, set to full price
        setAmount(itemPrice);
      }
    }
  }, [discountEnabled, discountType, discountValue, selectedItem, itemPrice]);

  const calculateDiscountPercentage = () => {
    if (!itemPrice || itemPrice === 0) return 0;
    const finalPrice = parseFloat(amount);
    const discountAmount = itemPrice - finalPrice;
    return ((discountAmount / itemPrice) * 100).toFixed(1);
  };

  const calculateDiscountAmount = () => {
    if (!itemPrice || itemPrice === 0) return 0;
    const finalPrice = parseFloat(amount);
    return itemPrice - finalPrice;
  };

  const handleSubmit = () => {
    if (!selectedItem || !amount) return alert("Completa todos los campos.");
    setModalOpen(true);
  };

  const confirmSubmit = async () => {
    const sale = {
      store: selectedStore,
      item: selectedItem,
      amount: Number(amount),
      originalPrice: itemPrice,
      discountAmount: calculateDiscountAmount(),
      discountPercentage: calculateDiscountPercentage(),
      discountType: discountEnabled ? discountType : "none",
      date: new Date().toLocaleDateString("es-MX"),
      user: user._id,
    };

    try {
      const res = await fetch("http://localhost:5000/api/ventas/crear", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(sale),
      });

      if (!res.ok) return alert("Error registrando la venta");

      alert("Venta registrada exitosamente");
      setModalOpen(false);
      
      // Reset form
      setSelectedStore("");
      setSelectedItem("");
      setAmount("");
      setItemPrice(0);
      setDiscountEnabled(false);
      setDiscountType("percentage");
      setDiscountValue("");
    } catch (error) {
      console.error("Error:", error);
      alert("Error registrando la venta");
    }
  };

  const resetDiscount = () => {
    setDiscountEnabled(false);
    setDiscountValue("");
    setAmount(itemPrice);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "30px", textAlign: "center" }}>
        <h1 style={{ 
          margin: "0 0 10px 0", 
          color: "#333",
          fontSize: "28px",
          fontWeight: "bold"
        }}>
          Registrar Venta
        </h1>
        <p style={{ color: "#666", margin: 0 }}>
          Registra una nueva venta en el sistema
        </p>
      </div>

      {/* Form Card */}
      <div style={{
        background: "white",
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "25px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "20px"
      }}>
        {/* Store Selection */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ 
            display: "block", 
            marginBottom: "8px", 
            fontWeight: "bold",
            color: "#333"
          }}>
            Seleccionar Tienda *
          </label>
          <select
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              fontSize: "16px",
              background: "white"
            }}
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
          >
            <option value="">Seleccionar tienda</option>
            {stores.map((store) => (
              <option key={store.tag} value={store.tag}>
                {store.name} ({store.tag})
              </option>
            ))}
          </select>
        </div>

        {/* Item Selection */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ 
            display: "block", 
            marginBottom: "8px", 
            fontWeight: "bold",
            color: "#333"
          }}>
            Seleccionar Artículo *
          </label>
          <select
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              fontSize: "16px",
              background: "white"
            }}
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
          >
            <option value="">Seleccionar artículo</option>
            {filteredItems.map((item) => (
              <option key={item.clave} value={item.clave}>
                {item.name} ({item.clave}) - ${item.price?.toFixed(2) || "0.00"}
              </option>
            ))}
          </select>
        </div>

        {/* Price Display */}
        {selectedItem && (
          <div style={{
            background: "#f8f9fa",
            border: "1px solid #e9ecef",
            borderRadius: "6px",
            padding: "15px",
            marginBottom: "20px"
          }}>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <span style={{ fontWeight: "bold", color: "#333" }}>
                Precio Original:
              </span>
              <span style={{ 
                fontSize: "18px", 
                fontWeight: "bold",
                color: "#28a745"
              }}>
                ${itemPrice.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Discount Options */}
        {selectedItem && (
          <div style={{ marginBottom: "20px" }}>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              marginBottom: "15px" 
            }}>
              <input
                type="checkbox"
                id="discountEnabled"
                checked={discountEnabled}
                onChange={(e) => setDiscountEnabled(e.target.checked)}
                style={{ marginRight: "10px" }}
              />
              <label htmlFor="discountEnabled" style={{ 
                fontWeight: "bold",
                color: "#333"
              }}>
                Aplicar Descuento
              </label>
            </div>

            {discountEnabled && (
              <div style={{
                background: "#fff3cd",
                border: "1px solid #ffeaa7",
                borderRadius: "6px",
                padding: "15px",
                marginBottom: "15px"
              }}>
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "8px", 
                    fontWeight: "bold",
                    color: "#856404"
                  }}>
                    Tipo de Descuento
                  </label>
                  <div style={{ display: "flex", gap: "20px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <input
                        type="radio"
                        value="percentage"
                        checked={discountType === "percentage"}
                        onChange={(e) => setDiscountType(e.target.value)}
                      />
                      Porcentaje (%)
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <input
                        type="radio"
                        value="fixed"
                        checked={discountType === "fixed"}
                        onChange={(e) => setDiscountType(e.target.value)}
                      />
                      Monto Fijo ($)
                    </label>
                  </div>
                </div>

                <div style={{ marginBottom: "10px" }}>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "8px", 
                    fontWeight: "bold",
                    color: "#856404"
                  }}>
                    {discountType === "percentage" ? "Porcentaje de Descuento" : "Monto de Descuento"}
                  </label>
                  <div style={{ position: "relative", maxWidth: "200px" }}>
                    {discountType === "percentage" ? (
                      <>
                        <input
                          type="number"
                          value={discountValue}
                          onChange={(e) => setDiscountValue(e.target.value)}
                          min="0"
                          max="100"
                          style={{
                            width: "100%",
                            padding: "12px 40px 12px 12px",
                            border: "1px solid #ccc",
                            borderRadius: "6px",
                            fontSize: "16px"
                          }}
                          placeholder="0"
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
                      </>
                    ) : (
                      <>
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
                          value={discountValue}
                          onChange={(e) => setDiscountValue(e.target.value)}
                          step="0.01"
                          min="0"
                          max={itemPrice}
                          style={{
                            width: "100%",
                            padding: "12px 12px 12px 30px",
                            border: "1px solid #ccc",
                            borderRadius: "6px",
                            fontSize: "16px"
                          }}
                          placeholder="0.00"
                        />
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={resetDiscount}
                  style={{
                    background: "transparent",
                    color: "#dc3545",
                    border: "1px solid #dc3545",
                    borderRadius: "4px",
                    padding: "6px 12px",
                    cursor: "pointer",
                    fontSize: "14px"
                  }}
                >
                  Quitar Descuento
                </button>
              </div>
            )}
          </div>
        )}

        {/* Final Amount */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ 
            display: "block", 
            marginBottom: "8px", 
            fontWeight: "bold",
            color: "#333"
          }}>
            Valor Final de Venta *
          </label>
          <div style={{ 
            position: "relative",
            maxWidth: "100%"
          }}>
            <span style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#666",
              fontWeight: "bold",
              fontSize: "18px"
            }}>
              $
            </span>
            <input
              type="number"
              step="0.01"
              value={amount}
              style={{
                width: "100%",
                padding: "12px 12px 12px 40px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                fontSize: "18px",
                fontWeight: "bold",
                background: "#f8f9fa",
                cursor: "not-allowed"
              }}
              readOnly
            />
          </div>
          {discountEnabled && discountValue && (
            <div style={{ 
              marginTop: "8px", 
              fontSize: "14px", 
              color: "#28a745",
              fontWeight: "bold"
            }}>
              {discountType === "percentage" 
                ? `Descuento aplicado: ${discountValue}%`
                : `Descuento aplicado: $${parseFloat(discountValue).toFixed(2)}`
              }
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          style={{
            width: "100%",
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "15px",
            cursor: "pointer",
            fontSize: "18px",
            fontWeight: "bold",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
          }}
          disabled={!selectedItem || !amount}
        >
          Registrar Venta
        </button>
      </div>

      {/* Confirmation Modal */}
      {modalOpen && (
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
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
          }}>
            <h2 style={{ 
              margin: "0 0 20px 0", 
              color: "#333",
              fontSize: "24px",
              textAlign: "center"
            }}>
              Confirmar Venta
            </h2>

            <div style={{ 
              background: "#f8f9fa", 
              borderRadius: "6px", 
              padding: "20px",
              marginBottom: "20px"
            }}>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between",
                marginBottom: "10px"
              }}>
                <strong>Tienda:</strong>
                <span>{selectedStore}</span>
              </div>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between",
                marginBottom: "10px"
              }}>
                <strong>Artículo:</strong>
                <span>{selectedItem}</span>
              </div>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between",
                marginBottom: "10px"
              }}>
                <strong>Precio Original:</strong>
                <span>${itemPrice.toFixed(2)}</span>
              </div>
              
              {discountEnabled && discountValue ? (
                <>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between",
                    marginBottom: "10px",
                    color: "#dc3545"
                  }}>
                    <strong>Descuento:</strong>
                    <span>
                      {discountType === "percentage" 
                        ? `${discountValue}% ($${calculateDiscountAmount().toFixed(2)})`
                        : `$${parseFloat(discountValue).toFixed(2)} (${calculateDiscountPercentage()}%)`
                      }
                    </span>
                  </div>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between",
                    marginBottom: "10px",
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#28a745"
                  }}>
                    <strong>Precio Final:</strong>
                    <span>${parseFloat(amount).toFixed(2)}</span>
                  </div>
                  <div style={{ 
                    textAlign: "center",
                    padding: "8px",
                    background: "#fff3cd",
                    borderRadius: "4px",
                    marginTop: "10px",
                    color: "#856404"
                  }}>
                    <strong>VENTA CON DESCUENTO</strong>
                  </div>
                </>
              ) : (
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between",
                  marginBottom: "10px",
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "#28a745"
                }}>
                  <strong>Monto:</strong>
                  <span>${parseFloat(amount).toFixed(2)}</span>
                </div>
              )}
              
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between",
                marginBottom: "10px"
              }}>
                <strong>Usuario:</strong>
                <span>{user?.name || user?.username || "Sin nombre"}</span>
              </div>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between",
                marginBottom: "10px"
              }}>
                <strong>Fecha:</strong>
                <span>{new Date().toLocaleDateString("es-MX")}</span>
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
                onClick={confirmSubmit}
              >
                Confirmar
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
                onClick={() => setModalOpen(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}