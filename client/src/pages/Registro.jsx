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

  // Multiple payment methods state
  const [multiplePayments, setMultiplePayments] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState({
    efectivo: { selected: false, amount: "" },
    tarjeta: { selected: false, amount: "" },
    transferencia: { selected: false, amount: "" }
  });

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

  // Update payment amounts when total amount changes
  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      const totalAmount = parseFloat(amount);
      const selectedPayments = Object.values(paymentMethods).filter(p => p.selected).length;
      
      if (selectedPayments === 1) {
        // If only one payment method selected, set its amount to total
        const updatedPayments = { ...paymentMethods };
        Object.keys(updatedPayments).forEach(key => {
          if (updatedPayments[key].selected) {
            updatedPayments[key].amount = totalAmount.toFixed(2);
          } else {
            updatedPayments[key].amount = "";
          }
        });
        setPaymentMethods(updatedPayments);
      } else if (selectedPayments > 1) {
        // If multiple methods selected, distribute amounts proportionally
        distributePayments(totalAmount);
      }
    }
  }, [amount]);

  const distributePayments = (totalAmount) => {
    const selectedMethods = Object.keys(paymentMethods).filter(key => paymentMethods[key].selected);
    const equalAmount = (totalAmount / selectedMethods.length).toFixed(2);
    
    const updatedPayments = { ...paymentMethods };
    selectedMethods.forEach(method => {
      updatedPayments[method].amount = equalAmount;
    });
    
    setPaymentMethods(updatedPayments);
  };

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

  const handlePaymentMethodChange = (method) => {
    if (!multiplePayments) {
      // Single payment mode - toggle the selected one
      const updatedPayments = {
        efectivo: { selected: false, amount: "" },
        tarjeta: { selected: false, amount: "" },
        transferencia: { selected: false, amount: "" }
      };
      updatedPayments[method] = { 
        selected: true, 
        amount: amount && parseFloat(amount) > 0 ? parseFloat(amount).toFixed(2) : "" 
      };
      setPaymentMethods(updatedPayments);
    } else {
      // Multiple payments mode - toggle the method
      const updatedPayments = { ...paymentMethods };
      updatedPayments[method].selected = !updatedPayments[method].selected;
      
      if (!updatedPayments[method].selected) {
        updatedPayments[method].amount = "";
      } else if (amount && parseFloat(amount) > 0) {
        const selectedCount = Object.values(updatedPayments).filter(p => p.selected).length;
        if (selectedCount > 0) {
          distributePayments(parseFloat(amount));
        }
      }
      
      setPaymentMethods(updatedPayments);
    }
  };

  const handlePaymentAmountChange = (method, value) => {
    const updatedPayments = { ...paymentMethods };
    updatedPayments[method].amount = value;
    setPaymentMethods(updatedPayments);
  };

  const validatePaymentAmounts = () => {
    if (!amount || parseFloat(amount) === 0) return false;
    
    const totalAmount = parseFloat(amount);
    const selectedMethods = Object.values(paymentMethods).filter(p => p.selected);
    
    if (selectedMethods.length === 0) return false;
    
    const sumAmounts = selectedMethods.reduce((sum, method) => {
      return sum + (parseFloat(method.amount) || 0);
    }, 0);
    
    return Math.abs(sumAmounts - totalAmount) < 0.01; // Allow small floating point differences
  };

  const handleSubmit = () => {
    if (!selectedItem || !amount) return alert("Completa todos los campos.");
    if (!validatePaymentAmounts()) return alert("La suma de los montos de pago debe ser igual al valor final de venta.");
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
      // Add payment method amounts
      amountEfectivo: paymentMethods.efectivo.selected ? Number(paymentMethods.efectivo.amount) : 0,
      amountTarjeta: paymentMethods.tarjeta.selected ? Number(paymentMethods.tarjeta.amount) : 0,
      amountTransferencia: paymentMethods.transferencia.selected ? Number(paymentMethods.transferencia.amount) : 0,
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
      setMultiplePayments(false);
      setPaymentMethods({
        efectivo: { selected: false, amount: "" },
        tarjeta: { selected: false, amount: "" },
        transferencia: { selected: false, amount: "" }
      });
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

  const getPaymentMethodLabel = (method) => {
    const labels = {
      efectivo: "Efectivo",
      tarjeta: "Tarjeta",
      transferencia: "Transferencia"
    };
    return labels[method];
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

        {/* Multiple Payment Methods Toggle */}
        {selectedItem && (
          <div style={{ marginBottom: "20px" }}>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              marginBottom: "15px" 
            }}>
              <input
                type="checkbox"
                id="multiplePayments"
                checked={multiplePayments}
                onChange={(e) => setMultiplePayments(e.target.checked)}
                style={{ marginRight: "10px" }}
              />
              <label htmlFor="multiplePayments" style={{ 
                fontWeight: "bold",
                color: "#333"
              }}>
                Múltiples Formas de Pago
              </label>
            </div>

            {/* Payment Methods */}
            <div style={{
              background: multiplePayments ? "#e7f3ff" : "#f8f9fa",
              border: `1px solid ${multiplePayments ? "#b3d9ff" : "#ccc"}`,
              borderRadius: "6px",
              padding: "15px",
              marginBottom: "15px"
            }}>
              <label style={{ 
                display: "block", 
                marginBottom: "12px", 
                fontWeight: "bold",
                color: multiplePayments ? "#0066cc" : "#333"
              }}>
                Seleccionar Forma(s) de Pago *
              </label>
              
              {Object.keys(paymentMethods).map((method) => (
                <div key={method} style={{ marginBottom: "10px" }}>
                  <label style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    marginBottom: "8px",
                    cursor: "pointer"
                  }}>
                    <input
                      type={multiplePayments ? "checkbox" : "radio"}
                      name={multiplePayments ? "multiple-payments" : "single-payment"}
                      checked={paymentMethods[method].selected}
                      onChange={() => handlePaymentMethodChange(method)}
                      style={{ marginRight: "8px" }}
                    />
                    <span style={{ fontWeight: "bold" }}>
                      {getPaymentMethodLabel(method)}
                    </span>
                  </label>
                  
                  {paymentMethods[method].selected && (
                    <div style={{ 
                      position: "relative", 
                      maxWidth: "200px",
                      marginLeft: "24px"
                    }}>
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
                        step="0.01"
                        value={paymentMethods[method].amount}
                        onChange={(e) => handlePaymentAmountChange(method, e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 8px 8px 30px",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                          fontSize: "14px"
                        }}
                        placeholder="0.00"
                        disabled={!multiplePayments && Object.values(paymentMethods).filter(p => p.selected).length === 1}
                      />
                    </div>
                  )}
                </div>
              ))}
              
              {multiplePayments && (
                <div style={{ 
                  marginTop: "10px", 
                  fontSize: "12px", 
                  color: "#666",
                  fontStyle: "italic"
                }}>
                  La suma de los montos debe ser igual al valor final de venta
                </div>
              )}
            </div>
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
          disabled={!selectedItem || !amount || !Object.values(paymentMethods).some(p => p.selected)}
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
              
              {/* Payment Methods Summary */}
              <div style={{ 
                marginTop: "15px", 
                paddingTop: "15px", 
                borderTop: "1px solid #ddd"
              }}>
                <strong style={{ display: "block", marginBottom: "10px" }}>
                  Formas de Pago:
                </strong>
                {Object.keys(paymentMethods).map(method => 
                  paymentMethods[method].selected && (
                    <div key={method} style={{ 
                      display: "flex", 
                      justifyContent: "space-between",
                      marginBottom: "5px"
                    }}>
                      <span>{getPaymentMethodLabel(method)}:</span>
                      <span style={{ fontWeight: "bold" }}>
                        ${parseFloat(paymentMethods[method].amount || 0).toFixed(2)}
                      </span>
                    </div>
                  )
                )}
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between",
                  marginTop: "8px",
                  paddingTop: "8px",
                  borderTop: "1px solid #ccc",
                  fontWeight: "bold"
                }}>
                  <span>Total:</span>
                  <span>${parseFloat(amount).toFixed(2)}</span>
                </div>
              </div>
              
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between",
                marginBottom: "10px",
                marginTop: "15px"
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