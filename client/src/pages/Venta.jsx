import { useEffect, useState } from "react";

export default function Venta() {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const user = JSON.parse(localStorage.getItem("user"));
  
  // Estados principales
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(true);
  const [viewMode, setViewMode] = useState("stores");
  
  // Estados para el modal de venta
  const [amount, setAmount] = useState("");
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [multiplePayments, setMultiplePayments] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState({
    efectivo: { selected: false, amount: "" },
    tarjeta: { selected: false, amount: "" },
    transferencia: { selected: false, amount: "" }
  });

  // Fetch marcas al cargar
  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const response = await fetch(`${API_URL}/api/tiendas`);
      const data = await response.json();
      const storesData = data.tiendas || data || [];
      setStores(storesData);
    } catch (error) {
      console.error("Error fetching stores:", error);
    }
  };

  // Resetear y configurar modal cuando se selecciona un producto
  useEffect(() => {
    if (selectedProduct) {
      resetSaleModal();
    }
  }, [selectedProduct]);

  const resetSaleModal = () => {
    if (selectedProduct) {
      const price = selectedProduct.price || 0;
      setAmount(price.toString());
      setDiscountEnabled(false);
      setDiscountType("percentage");
      setDiscountValue("");
      setMultiplePayments(false);
      
      // Configurar método de pago por defecto (efectivo)
      setPaymentMethods({
        efectivo: { selected: true, amount: price.toFixed(2) },
        tarjeta: { selected: false, amount: "" },
        transferencia: { selected: false, amount: "" }
      });
    }
  };

  // Manejar cambios en el descuento
  useEffect(() => {
    if (selectedProduct && selectedProduct.price > 0) {
      if (discountEnabled && discountValue) {
        let finalPrice = selectedProduct.price;
        
        if (discountType === "percentage") {
          const discountAmount = (selectedProduct.price * parseFloat(discountValue)) / 100;
          finalPrice = selectedProduct.price - discountAmount;
        } else {
          // Fixed discount
          finalPrice = selectedProduct.price - parseFloat(discountValue);
        }
        
        setAmount(Math.max(0, finalPrice).toFixed(2));
      } else {
        // No discount, set to full price
        setAmount(selectedProduct.price.toString());
      }
    }
  }, [discountEnabled, discountType, discountValue, selectedProduct]);

  // Actualizar montos de pago cuando cambia el total
  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      const totalAmount = parseFloat(amount);
      
      if (multiplePayments) {
        // Modo múltiple: distribuir equitativamente entre métodos seleccionados
        const selectedPayments = Object.values(paymentMethods).filter(p => p.selected);
        
        if (selectedPayments.length > 0) {
          const equalAmount = (totalAmount / selectedPayments.length).toFixed(2);
          const updatedPayments = { ...paymentMethods };
          
          Object.keys(updatedPayments).forEach(key => {
            if (updatedPayments[key].selected) {
              updatedPayments[key].amount = equalAmount;
            }
          });
          
          setPaymentMethods(updatedPayments);
        }
      } else {
        // Modo simple: asignar todo al método seleccionado
        const selectedMethod = Object.keys(paymentMethods).find(key => paymentMethods[key].selected);
        
        if (selectedMethod) {
          const updatedPayments = { ...paymentMethods };
          updatedPayments[selectedMethod].amount = totalAmount.toFixed(2);
          setPaymentMethods(updatedPayments);
        }
      }
    }
  }, [amount, multiplePayments]);

  // Manejar selección de marca
  const handleStoreSelect = (store) => {
    setSelectedStore(store);
    setViewMode("products");
  };

  // Volver al listado de marcas
  const handleBackToStores = () => {
    setSelectedStore(null);
    setViewMode("stores");
    setSelectedProduct(null);
  };

  // Manejar selección de producto
  const handleProductSelect = (product) => {
    setSelectedProduct(product);
  };

  // Cerrar modal
  const closeSaleModal = () => {
    setSelectedProduct(null);
  };

  // Calcular descuento
  const calculateDiscountPercentage = () => {
    if (!selectedProduct || !selectedProduct.price || selectedProduct.price === 0) return 0;
    const finalPrice = parseFloat(amount) || 0;
    const discountAmount = selectedProduct.price - finalPrice;
    return ((discountAmount / selectedProduct.price) * 100).toFixed(1);
  };

  const calculateDiscountAmount = () => {
    if (!selectedProduct || !selectedProduct.price || selectedProduct.price === 0) return 0;
    const finalPrice = parseFloat(amount) || 0;
    return selectedProduct.price - finalPrice;
  };

  // Manejar cambios en métodos de pago
  const handlePaymentMethodChange = (method) => {
    if (!multiplePayments) {
      // Modo simple: seleccionar solo este método
      const updatedPayments = {
        efectivo: { 
          selected: method === 'efectivo', 
          amount: method === 'efectivo' && amount ? parseFloat(amount).toFixed(2) : "" 
        },
        tarjeta: { 
          selected: method === 'tarjeta', 
          amount: method === 'tarjeta' && amount ? parseFloat(amount).toFixed(2) : "" 
        },
        transferencia: { 
          selected: method === 'transferencia', 
          amount: method === 'transferencia' && amount ? parseFloat(amount).toFixed(2) : "" 
        }
      };
      setPaymentMethods(updatedPayments);
    } else {
      // Modo múltiple: toggle del método
      const updatedPayments = { ...paymentMethods };
      const isCurrentlySelected = updatedPayments[method].selected;
      
      // Toggle del método
      updatedPayments[method].selected = !isCurrentlySelected;
      
      if (!updatedPayments[method].selected) {
        // Método deseleccionado - limpiar monto
        updatedPayments[method].amount = "";
        
        // Si no quedan métodos seleccionados, volver a modo simple con efectivo
        const selectedCount = Object.values(updatedPayments).filter(p => p.selected).length;
        if (selectedCount === 0) {
          setMultiplePayments(false);
          const singlePaymentMethods = {
            efectivo: { selected: true, amount: amount ? parseFloat(amount).toFixed(2) : "" },
            tarjeta: { selected: false, amount: "" },
            transferencia: { selected: false, amount: "" }
          };
          setPaymentMethods(singlePaymentMethods);
          return;
        }
        
        // Recalcular montos para métodos restantes
        const remainingSelected = Object.values(updatedPayments).filter(p => p.selected);
        if (remainingSelected.length > 0 && amount && parseFloat(amount) > 0) {
          const equalAmount = (parseFloat(amount) / remainingSelected.length).toFixed(2);
          Object.keys(updatedPayments).forEach(key => {
            if (updatedPayments[key].selected) {
              updatedPayments[key].amount = equalAmount;
            }
          });
        }
      } else {
        // Método seleccionado - agregar a distribución
        if (amount && parseFloat(amount) > 0) {
          const selectedCount = Object.values(updatedPayments).filter(p => p.selected).length;
          const equalAmount = (parseFloat(amount) / selectedCount).toFixed(2);
          Object.keys(updatedPayments).forEach(key => {
            if (updatedPayments[key].selected) {
              updatedPayments[key].amount = equalAmount;
            }
          });
        }
      }
      
      setPaymentMethods(updatedPayments);
    }
  };

  // Manejar cambios en montos específicos de pago
  const handlePaymentAmountChange = (method, value) => {
    const updatedPayments = { ...paymentMethods };
    updatedPayments[method].amount = value;
    setPaymentMethods(updatedPayments);
  };

  // Validar montos de pago
  const validatePaymentAmounts = () => {
    if (!amount || parseFloat(amount) === 0) {
      alert("El monto total debe ser mayor a cero.");
      return false;
    }
    
    const totalAmount = parseFloat(amount);
    const selectedMethods = Object.values(paymentMethods).filter(p => p.selected);
    
    if (selectedMethods.length === 0) {
      alert("Debe seleccionar al menos un método de pago.");
      return false;
    }
    
    const sumAmounts = selectedMethods.reduce((sum, method) => {
      return sum + (parseFloat(method.amount) || 0);
    }, 0);
    
    const isAmountValid = Math.abs(sumAmounts - totalAmount) < 0.01;
    
    if (!isAmountValid) {
      alert(`La suma de los montos de pago ($${sumAmounts.toFixed(2)}) debe ser igual al valor final de venta ($${totalAmount.toFixed(2)}).`);
      return false;
    }
    
    return true;
  };

  // Agregar venta al carrito
  const addToCart = () => {
    if (!selectedProduct || !selectedStore || !amount) {
      alert("Completa todos los campos.");
      return;
    }
    
    if (!validatePaymentAmounts()) {
      return;
    }

    // Verificar stock
    if (selectedProduct.quantity <= 0) {
      alert("❌ Este producto está agotado. No se puede agregar al carrito.");
      return;
    }

    const saleData = {
      store: selectedStore.tag,
      storeName: selectedStore.name,
      item: selectedProduct.clave,
      itemName: selectedProduct.name,
      amount: parseFloat(amount),
      originalPrice: selectedProduct.price,
      discountAmount: calculateDiscountAmount(),
      discountPercentage: calculateDiscountPercentage(),
      discountType: discountEnabled ? discountType : "none",
      date: new Date().toLocaleDateString("es-MX"),
      user: user?._id,
      amountEfectivo: paymentMethods.efectivo.selected ? Number(paymentMethods.efectivo.amount) : 0,
      amountTarjeta: paymentMethods.tarjeta.selected ? Number(paymentMethods.tarjeta.amount) : 0,
      amountTransferencia: paymentMethods.transferencia.selected ? Number(paymentMethods.transferencia.amount) : 0,
      storeContractType: selectedStore.contractType,
      storeContractValue: selectedStore.contractValue || 0
    };

    setCart([...cart, saleData]);
    closeSaleModal();
    alert("✅ Producto agregado al carrito");
  };

  // Eliminar item del carrito
  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  // Calcular total del carrito
  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.amount, 0);
  };

  // Generar ID de venta (simulación - en producción viene del backend)
  const generateSaleId = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${year}${month}${random}`;
  };

  // Finalizar venta
  const finalizeSale = async () => {
    if (cart.length === 0) {
      alert("El carrito está vacío");
      return;
    }
    setShowConfirmationModal(true);
  };

  const confirmSale = async () => {
    setShowConfirmationModal(false);

    try {
      const results = [];
      const errors = [];
      
      // Procesar cada venta individualmente
      for (const [index, sale] of cart.entries()) {
        try {
          const saleWithId = {
            ...sale,
            saleId: generateSaleId()
          };

          const response = await fetch(`${API_URL}/api/ventas/crear`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify(saleWithId),
          });

          if (!response.ok) {
            const error = await response.json();
            errors.push(`Venta ${index + 1} (${sale.itemName}): ${error.message}`);
            continue;
          }

          const result = await response.json();
          results.push(result);

          // Pequeña pausa para evitar sobrecargar
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          errors.push(`Venta ${index + 1} (${sale.itemName}): ${error.message}`);
        }
      }

      // Mostrar resultados
      if (errors.length > 0) {
        alert(`⚠️ Se completaron ${results.length} ventas, pero hubo ${errors.length} errores:\n\n${errors.join("\n")}`);
      } else {
        alert(`✅ ${results.length} ventas registradas exitosamente`);
      }

      // Limpiar y resetear
      setCart([]);
      setSelectedStore(null);
      setSelectedProduct(null);
      setViewMode("stores");
      
      // Refrescar inventario
      fetchStores();

    } catch (error) {
      alert(`❌ Error al procesar ventas: ${error.message}`);
    }
  };

  // Función para obtener URL de imagen
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return "/logo192.png";
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${API_URL}${imageUrl}`;
  };

  // Renderizar vista de marcas
  const renderStoresView = () => (
    <div style={styles.storesView}>
      <h2 style={styles.title}>Seleccionar Marca</h2>
      <p style={styles.subtitle}>Selecciona una marca para ver sus productos</p>
      <div style={styles.storesGrid}>
        {stores.map((store) => (
          <button
            key={store._id || store.tag}
            style={styles.storeCard}
            onClick={() => handleStoreSelect(store)}
          >
            <div style={styles.storeIcon}>
              <div style={styles.iconCircle}>🏷️</div>
            </div>
            <div style={styles.storeInfo}>
              <h3 style={styles.storeName}>{store.name}</h3>
              <p style={styles.storeTag}>{store.tag}</p>
              <p style={styles.storeProducts}>
                {store.products?.length || 0} productos
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // Renderizar vista de productos con imágenes
  const renderProductsView = () => (
    <div style={styles.productsView}>
      <div style={styles.productsHeader}>
        <button onClick={handleBackToStores} style={styles.backButton}>
          ← Volver a Marcas
        </button>
        <h2 style={styles.title}>{selectedStore.name} - Inventario</h2>
        <p style={styles.subtitle}>
          {selectedStore.products?.length || 0} productos disponibles
        </p>
      </div>
      
      <div style={styles.productsGrid}>
        {selectedStore.products?.map((product) => (
          <button
            key={product._id || product.clave}
            style={{
              ...styles.productCard,
              ...(product.quantity <= 0 ? styles.productCardOutOfStock : {})
            }}
            onClick={() => handleProductSelect(product)}
            disabled={product.quantity <= 0}
          >
            {/* Imagen del producto */}
            <div style={styles.productImageContainer}>
              <img
                src={getImageUrl(product.imageUrl)}
                alt={product.name}
                style={styles.productImage}
                onError={(e) => {
                  e.target.src = "/logo192.png";
                }}
              />
            </div>
            
            <div style={styles.productInfo}>
              <h3 style={styles.productName}>{product.name}</h3>
              <p style={styles.productClave}>{product.clave}</p>
              <p style={styles.productPrice}>${product.price?.toFixed(2) || "0.00"}</p>
              <p style={{
                ...styles.productStock,
                color: product.quantity <= 0 ? "#dc3545" : "#28a745"
              }}>
                {product.quantity <= 0 ? 'AGOTADO' : `Stock: ${product.quantity}`}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // Modal de venta individual con lógica completa de pagos
  const renderSaleModal = () => {
    if (!selectedProduct || !selectedStore) return null;

    const getPaymentMethodLabel = (method) => {
      const labels = {
        efectivo: "Efectivo",
        tarjeta: "Tarjeta",
        transferencia: "Transferencia"
      };
      return labels[method];
    };

    return (
      <div style={styles.modalOverlay}>
        <div style={styles.modal}>
          <h2 style={styles.modalTitle}>Vender Producto</h2>
          
          {/* Información del producto con imagen */}
          <div style={styles.productInfoCard}>
            <div style={styles.productImageRow}>
              <img
                src={getImageUrl(selectedProduct.imageUrl)}
                alt={selectedProduct.name}
                style={styles.modalProductImage}
                onError={(e) => {
                  e.target.src = "/logo192.png";
                }}
              />
              <div>
                <h3 style={styles.productTitle}>{selectedProduct.name}</h3>
                <p style={styles.productCode}>{selectedProduct.clave}</p>
              </div>
            </div>
            <div style={styles.productDetails}>
              <div style={styles.detailRow}>
                <span>Marca:</span>
                <span>{selectedStore.name} ({selectedStore.tag})</span>
              </div>
              <div style={styles.detailRow}>
                <span>Precio:</span>
                <span style={styles.price}>${selectedProduct.price?.toFixed(2)}</span>
              </div>
              <div style={styles.detailRow}>
                <span>Stock:</span>
                <span style={{
                  color: selectedProduct.quantity <= 0 ? "#dc3545" : "#28a745",
                  fontWeight: "bold"
                }}>
                  {selectedProduct.quantity} unidades
                </span>
              </div>
            </div>
          </div>

          {/* Opciones de descuento */}
          <div style={styles.section}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={discountEnabled}
                onChange={(e) => setDiscountEnabled(e.target.checked)}
                style={styles.checkbox}
              />
              <span style={styles.checkboxText}>Aplicar Descuento</span>
            </label>

            {discountEnabled && (
              <div style={styles.discountSection}>
                <div style={styles.radioGroup}>
                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      value="percentage"
                      checked={discountType === "percentage"}
                      onChange={(e) => setDiscountType(e.target.value)}
                      style={styles.radio}
                    />
                    Porcentaje (%)
                  </label>
                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      value="fixed"
                      checked={discountType === "fixed"}
                      onChange={(e) => setDiscountType(e.target.value)}
                      style={styles.radio}
                    />
                    Monto Fijo ($)
                  </label>
                </div>

                <div style={styles.discountInput}>
                  <label style={styles.inputLabel}>
                    {discountType === "percentage" ? "Porcentaje de Descuento" : "Monto de Descuento"}
                  </label>
                  <div style={styles.inputWithIcon}>
                    {discountType === "percentage" ? (
                      <>
                        <input
                          type="number"
                          value={discountValue}
                          onChange={(e) => setDiscountValue(e.target.value)}
                          min="0"
                          max="100"
                          step="0.1"
                          style={styles.input}
                          placeholder="0"
                        />
                        <span style={styles.inputIcon}>%</span>
                      </>
                    ) : (
                      <>
                        <span style={styles.inputIcon}>$</span>
                        <input
                          type="number"
                          value={discountValue}
                          onChange={(e) => setDiscountValue(e.target.value)}
                          step="0.01"
                          min="0"
                          max={selectedProduct.price}
                          style={styles.input}
                          placeholder="0.00"
                        />
                      </>
                    )}
                  </div>
                </div>
                
                {discountEnabled && discountValue && (
                  <div style={styles.discountPreview}>
                    <span>Descuento aplicado: </span>
                    {discountType === "percentage" 
                      ? `${discountValue}% ($${calculateDiscountAmount().toFixed(2)})`
                      : `$${parseFloat(discountValue).toFixed(2)} (${calculateDiscountPercentage()}%)`
                    }
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Métodos de pago - Lógica completa */}
          <div style={styles.section}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={multiplePayments}
                onChange={(e) => {
                  const newMultiplePayments = e.target.checked;
                  setMultiplePayments(newMultiplePayments);
                  
                  if (!newMultiplePayments) {
                    // Cambiar de múltiple a simple
                    const selectedMethod = Object.keys(paymentMethods).find(key => paymentMethods[key].selected) || 'efectivo';
                    const singlePaymentMethods = {
                      efectivo: { 
                        selected: selectedMethod === 'efectivo', 
                        amount: selectedMethod === 'efectivo' && amount ? parseFloat(amount).toFixed(2) : "" 
                      },
                      tarjeta: { 
                        selected: selectedMethod === 'tarjeta', 
                        amount: selectedMethod === 'tarjeta' && amount ? parseFloat(amount).toFixed(2) : "" 
                      },
                      transferencia: { 
                        selected: selectedMethod === 'transferencia', 
                        amount: selectedMethod === 'transferencia' && amount ? parseFloat(amount).toFixed(2) : "" 
                      }
                    };
                    setPaymentMethods(singlePaymentMethods);
                  }
                }}
                style={styles.checkbox}
              />
              <span style={styles.checkboxText}>Múltiples Formas de Pago</span>
            </label>

            <div style={styles.paymentMethodsContainer}>
              {Object.keys(paymentMethods).map((method) => (
                <div key={method} style={styles.paymentMethodCard}>
                  <label style={styles.paymentLabel}>
                    <input
                      type={multiplePayments ? "checkbox" : "radio"}
                      name="payment-method"
                      checked={paymentMethods[method].selected}
                      onChange={() => handlePaymentMethodChange(method)}
                      style={styles.paymentCheckbox}
                    />
                    <span style={styles.paymentText}>{getPaymentMethodLabel(method)}</span>
                  </label>
                  
                  {paymentMethods[method].selected && (
                    <div style={styles.paymentAmount}>
                      <span style={styles.currencySmall}>$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={paymentMethods[method].amount}
                        onChange={(e) => handlePaymentAmountChange(method, e.target.value)}
                        style={styles.paymentInput}
                        placeholder="0.00"
                        disabled={multiplePayments}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {multiplePayments && (
              <div style={styles.paymentNote}>
                <small>Los montos se distribuyen automáticamente entre los métodos seleccionados.</small>
              </div>
            )}
          </div>

          {/* Monto final */}
          <div style={styles.finalAmount}>
            <label style={styles.inputLabel}>Valor Final de Venta</label>
            <div style={styles.amountInput}>
              <span style={styles.currency}>$</span>
              <input
                type="text"
                value={amount}
                readOnly
                style={styles.amountField}
              />
            </div>
            {discountEnabled && discountValue && (
              <div style={styles.finalAmountNote}>
                <span style={{color: '#28a745'}}>
                  Precio original: ${selectedProduct.price?.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Resumen de pagos */}
          {Object.values(paymentMethods).some(p => p.selected) && (
            <div style={styles.paymentSummary}>
              <strong>Resumen de Pagos:</strong>
              {Object.keys(paymentMethods).map(method => 
                paymentMethods[method].selected && (
                  <div key={method} style={styles.paymentSummaryRow}>
                    <span>{getPaymentMethodLabel(method)}:</span>
                    <span>${parseFloat(paymentMethods[method].amount || 0).toFixed(2)}</span>
                  </div>
                )
              )}
              <div style={styles.paymentTotalRow}>
                <span>Total:</span>
                <span>${parseFloat(amount || 0).toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Botones del modal */}
          <div style={styles.modalButtons}>
            <button onClick={addToCart} style={styles.addButton}>
              Agregar al Carrito
            </button>
            <button onClick={closeSaleModal} style={styles.cancelButton}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar carrito
  const renderCart = () => (
    <div style={styles.cartPanel}>
      <h2 style={styles.cartTitle}>
        🛒 Carrito de Ventas
        <span style={styles.cartCount}>{cart.length}</span>
      </h2>
      
      {cart.length === 0 ? (
        <p style={styles.emptyCart}>El carrito está vacío</p>
      ) : (
        <>
          <div style={styles.cartItems}>
            {cart.map((item, index) => (
              <div key={index} style={styles.cartItem}>
                <div style={styles.cartItemInfo}>
                  <h4 style={styles.cartItemName}>{item.itemName}</h4>
                  <p style={styles.cartItemDetails}>
                    {item.storeName} • ${item.amount?.toFixed(2)}
                  </p>
                  {item.discountAmount > 0 && (
                    <p style={styles.discountInfo}>
                      Descuento: -${item.discountAmount?.toFixed(2)}
                    </p>
                  )}
                  {/* Métodos de pago en el carrito */}
                  <div style={styles.cartPaymentMethods}>
                    {item.amountEfectivo > 0 && (
                      <span style={styles.cartPaymentMethod}>Efectivo: ${item.amountEfectivo?.toFixed(2)}</span>
                    )}
                    {item.amountTarjeta > 0 && (
                      <span style={styles.cartPaymentMethod}>Tarjeta: ${item.amountTarjeta?.toFixed(2)}</span>
                    )}
                    {item.amountTransferencia > 0 && (
                      <span style={styles.cartPaymentMethod}>Transferencia: ${item.amountTransferencia?.toFixed(2)}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeFromCart(index)}
                  style={styles.removeButton}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div style={styles.cartSummary}>
            <div style={styles.totalRow}>
              <span>Artículos:</span>
              <span>{cart.length}</span>
            </div>
            <div style={styles.totalRow}>
              <span>Total:</span>
              <span style={styles.totalAmount}>${calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={finalizeSale}
            disabled={cart.length === 0}
            style={{
              ...styles.finalizeButton,
              ...(cart.length === 0 ? styles.finalizeButtonDisabled : {})
            }}
          >
            Finalizar Venta (${calculateTotal().toFixed(2)})
          </button>
        </>
      )}
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>Sistema de Ventas</h1>
          <p style={styles.headerSubtitle}>Registro de ventas por carrito</p>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.userInfo}>Vendedor: {user?.name || user?.username}</span>
          <button 
            onClick={() => setShowCart(!showCart)} 
            style={styles.cartToggle}
          >
            {showCart ? "← Ocultar Carrito" : "→ Mostrar Carrito"}
          </button>
        </div>
      </header>

      {/* Contenido principal */}
      <div style={styles.content}>
        {/* Panel principal */}
        <main style={styles.mainPanel}>
          {viewMode === "stores" ? renderStoresView() : renderProductsView()}
        </main>

        {/* Panel del carrito */}
        {showCart && renderCart()}
      </div>

      {/* Modal de venta */}
      {renderSaleModal()}

      {showConfirmationModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.confirmationModal}>
            <h2 style={styles.modalTitle}>🎫 Confirmar Venta</h2>
            
            <div style={styles.ticketContainer}>
              <div style={styles.ticketHeader}>
                <h3>RESUMEN DE VENTA</h3>
                <p>Fecha: {new Date().toLocaleDateString("es-MX")}</p>
                <p>Vendedor: {user?.name || user?.username}</p>
              </div>
              
              <div style={styles.ticketItems}>
                {cart.map((item, index) => (
                  <div key={index} style={styles.ticketItem}>
                    <div style={styles.ticketItemHeader}>
                      <span style={styles.itemNumber}>{index + 1}.</span>
                      <span style={styles.itemName}>{item.itemName}</span>
                      <span style={styles.itemCode}>({item.item})</span>
                    </div>
                    
                    <div style={styles.ticketDetails}>
                      <div style={styles.detailRow}>
                        <span>Precio:</span>
                        <span>${item.originalPrice?.toFixed(2)}</span>
                      </div>
                      
                      {item.discountAmount > 0 && (
                        <div style={styles.discountRow}>
                          <span>Descuento:</span>
                          <span style={styles.discountText}>
                            -${item.discountAmount?.toFixed(2)} ({item.discountPercentage}%)
                          </span>
                        </div>
                      )}
                      
                      <div style={styles.detailRow}>
                        <span>Total item:</span>
                        <span style={styles.itemTotal}>${item.amount?.toFixed(2)}</span>
                      </div>
                      
                      <div style={styles.paymentMethods}>
                        <span>Pagos:</span>
                        <div style={styles.methodsList}>
                          {item.amountEfectivo > 0 && (
                            <span style={styles.methodTag}>Efectivo: ${item.amountEfectivo?.toFixed(2)}</span>
                          )}
                          {item.amountTarjeta > 0 && (
                            <span style={styles.methodTag}>Tarjeta: ${item.amountTarjeta?.toFixed(2)}</span>
                          )}
                          {item.amountTransferencia > 0 && (
                            <span style={styles.methodTag}>Transferencia: ${item.amountTransferencia?.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={styles.ticketFooter}>
                <div style={styles.totalRow}>
                  <span>Artículos:</span>
                  <span>{cart.length}</span>
                </div>
                <div style={styles.grandTotal}>
                  <span>TOTAL:</span>
                  <span style={styles.grandTotalAmount}>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div style={styles.confirmationButtons}>
              <button
                onClick={confirmSale}
                style={styles.confirmButton}
              >
                ✅ Confirmar Venta
              </button>
              <button
                onClick={() => setShowConfirmationModal(false)}
                style={styles.cancelButton}
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Estilos actualizados
const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f5f5f5',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  
  // Header (igual que antes)
  header: {
    backgroundColor: '#2c3e50',
    color: 'white',
    padding: '1rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  headerTitle: { margin: 0, fontSize: '1.5rem' },
  headerSubtitle: { margin: '0.25rem 0 0 0', opacity: 0.8, fontSize: '0.9rem' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
  userInfo: { fontSize: '0.9rem', opacity: 0.9 },
  cartToggle: {
    background: '#3498db', color: 'white', border: 'none', borderRadius: '6px',
    padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.9rem'
  },
  
  // Contenido principal
  content: { display: 'flex', flex: 1, overflow: 'hidden' },
  mainPanel: { flex: 1, padding: '2rem', overflowY: 'auto', backgroundColor: 'white' },
  
  // Vista de marcas (igual que antes)
  storesView: { maxWidth: '1200px', margin: '0 auto' },
  title: { color: '#2c3e50', marginBottom: '0.5rem' },
  subtitle: { color: '#7f8c8d', marginBottom: '2rem' },
  storesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '1rem'
  },
  storeCard: {
    background: 'white', border: '2px solid #3498db', borderRadius: '8px',
    padding: '1rem', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
    display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', boxSizing: 'border-box'
  },
  storeIcon: { flexShrink: 0 },
  iconCircle: {
    background: '#3498db', color: 'white', borderRadius: '8px',
    width: '50px', height: '50px', display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem'
  },
  storeInfo: { flex: 1 },
  storeName: { margin: '0 0 0.25rem 0', color: '#2c3e50', fontSize: '1.1rem' },
  storeTag: { margin: '0 0 0.25rem 0', color: '#7f8c8d', fontSize: '0.9rem', fontFamily: 'monospace' },
  storeProducts: { margin: 0, color: '#27ae60', fontSize: '0.9rem', fontWeight: 'bold' },
  
  // Vista de productos con imágenes
  productsView: { maxWidth: '1200px', margin: '0 auto' },
  productsHeader: { marginBottom: '2rem' },
  backButton: {
    background: '#95a5a6', color: 'white', border: 'none', borderRadius: '6px',
    padding: '0.5rem 1rem', cursor: 'pointer', marginBottom: '1rem', fontSize: '0.9rem'
  },
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem'
  },
  productCard: {
    background: 'white', border: '2px solid #27ae60', borderRadius: '8px',
    padding: '1rem', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
    display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box'
  },
  productCardOutOfStock: {
    borderColor: '#e74c3c', background: '#fff5f5', cursor: 'not-allowed'
  },
  productImageContainer: {
    width: '100%', height: '150px', overflow: 'hidden', borderRadius: '6px',
    marginBottom: '1rem', backgroundColor: '#f8f9fa'
  },
  productImage: {
    width: '100%', height: '100%', objectFit: 'cover'
  },
  productInfo: { flex: 1 },
  productName: { margin: '0 0 0.5rem 0', color: '#2c3e50', fontSize: '1rem' },
  productClave: { margin: '0 0 0.5rem 0', color: '#7f8c8d', fontSize: '0.85rem', fontFamily: 'monospace' },
  productPrice: { margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#27ae60', fontSize: '1.1rem' },
  productStock: { margin: 0, fontSize: '0.85rem', fontWeight: 'bold' },
  
  // Carrito (actualizado con métodos de pago)
  cartPanel: {
    width: '400px', background: 'white', borderLeft: '1px solid #ddd',
    padding: '1.5rem', display: 'flex', flexDirection: 'column',
    boxShadow: '-2px 0 4px rgba(0,0,0,0.05)'
  },
  cartTitle: {
    color: '#2c3e50', margin: '0 0 1rem 0', display: 'flex',
    alignItems: 'center', justifyContent: 'space-between'
  },
  cartCount: {
    background: '#e74c3c', color: 'white', borderRadius: '50%',
    width: '24px', height: '24px', display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem'
  },
  emptyCart: { textAlign: 'center', color: '#95a5a6', margin: '2rem 0' },
  cartItems: { flex: 1, overflowY: 'auto', margin: '1rem 0' },
  cartItem: {
    background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '6px',
    padding: '0.75rem', marginBottom: '0.75rem', display: 'flex',
    justifyContent: 'space-between', alignItems: 'flex-start'
  },
  cartItemInfo: { flex: 1 },
  cartItemName: { margin: '0 0 0.25rem 0', fontSize: '0.9rem', color: '#2c3e50' },
  cartItemDetails: { margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: '#7f8c8d' },
  discountInfo: { margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: '#27ae60' },
  cartPaymentMethods: {
    display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem'
  },
  cartPaymentMethod: {
    background: '#e7f3ff', color: '#0066cc', fontSize: '0.75rem',
    padding: '0.25rem 0.5rem', borderRadius: '4px'
  },
  removeButton: {
    background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px',
    width: '24px', height: '24px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem'
  },
  cartSummary: { borderTop: '2px solid #ddd', paddingTop: '1rem', marginTop: '1rem' },
  totalRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' },
  totalAmount: { fontWeight: 'bold', fontSize: '1.2rem', color: '#27ae60' },
  finalizeButton: {
    background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px',
    padding: '1rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', marginTop: '1rem'
  },
  finalizeButtonDisabled: { background: '#95a5a6', cursor: 'not-allowed' },
  
  // Modal actualizado
  modalOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000
  },
  modal: {
    background: 'white', borderRadius: '8px', padding: '2rem',
    width: '90%', maxWidth: '500px', maxHeight: '90vh',
    overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },
  modalTitle: { color: '#2c3e50', margin: '0 0 1.5rem 0', textAlign: 'center' },
  
  // Producto en modal con imagen
  productInfoCard: {
    background: '#f8f9fa', borderRadius: '6px', padding: '1rem', marginBottom: '1.5rem'
  },
  productImageRow: {
    display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem'
  },
  modalProductImage: {
    width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px'
  },
  productTitle: { margin: '0 0 0.25rem 0', color: '#2c3e50' },
  productCode: { margin: 0, color: '#7f8c8d', fontFamily: 'monospace', fontSize: '0.9rem' },
  productDetails: { marginTop: '0.5rem' },
  detailRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.9rem' },
  price: { fontWeight: 'bold', color: '#27ae60' },
  
  // Secciones del modal
  section: { marginBottom: '1.5rem' },
  checkboxLabel: { display: 'flex', alignItems: 'center', marginBottom: '0.5rem', cursor: 'pointer' },
  checkbox: { marginRight: '0.5rem' },
  checkboxText: { fontWeight: 'bold', color: '#2c3e50' },
  
  // Descuento
  discountSection: {
    background: '#fff3cd', border: '1px solid #ffeaa7',
    borderRadius: '6px', padding: '1rem', marginTop: '0.5rem'
  },
  radioGroup: { display: 'flex', gap: '1rem', marginBottom: '1rem' },
  radioLabel: { display: 'flex', alignItems: 'center', cursor: 'pointer' },
  radio: { marginRight: '0.25rem' },
  discountInput: { marginBottom: '0.5rem' },
  inputLabel: {
    display: 'block', marginBottom: '0.25rem',
    fontWeight: 'bold', color: '#2c3e50', fontSize: '0.9rem'
  },
  inputWithIcon: { position: 'relative', maxWidth: '200px' },
  input: {
    width: '100%', padding: '0.5rem 2rem 0.5rem 0.5rem',
    border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem'
  },
  inputIcon: {
    position: 'absolute', right: '0.5rem', top: '50%',
    transform: 'translateY(-50%)', color: '#666', fontWeight: 'bold'
  },
  discountPreview: {
    marginTop: '0.5rem', padding: '0.5rem', background: '#d4edda',
    borderRadius: '4px', fontSize: '0.9rem', color: '#155724'
  },
  
  // Métodos de pago en modal
  paymentMethodsContainer: {
    display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem'
  },
  paymentMethodCard: {
    background: '#e7f3ff', border: '1px solid #b3d9ff',
    borderRadius: '4px', padding: '0.75rem', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center'
  },
  paymentLabel: { display: 'flex', alignItems: 'center', cursor: 'pointer', flex: 1 },
  paymentCheckbox: { marginRight: '0.5rem' },
  paymentText: { fontWeight: 'bold', color: '#0066cc' },
  paymentAmount: { display: 'flex', alignItems: 'center' },
  currencySmall: { color: '#666', marginRight: '0.25rem' },
  paymentInput: {
    width: '80px', padding: '0.25rem 0.5rem',
    border: '1px solid #ccc', borderRadius: '4px', fontSize: '0.9rem'
  },
  paymentNote: {
    marginTop: '0.5rem', fontSize: '0.8rem', color: '#666',
    fontStyle: 'italic', padding: '0.5rem', background: '#f8f9fa',
    borderRadius: '4px'
  },
  
  // Monto final
  finalAmount: { marginBottom: '1.5rem' },
  amountInput: { position: 'relative', maxWidth: '200px' },
  currency: {
    position: 'absolute', left: '0.75rem', top: '50%',
    transform: 'translateY(-50%)', color: '#666',
    fontWeight: 'bold', fontSize: '1.2rem'
  },
  amountField: {
    width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem',
    border: '2px solid #27ae60', borderRadius: '6px',
    fontSize: '1.2rem', fontWeight: 'bold', color: '#27ae60',
    background: '#f8f9fa'
  },
  finalAmountNote: { marginTop: '0.5rem', fontSize: '0.9rem' },
  
  // Resumen de pagos
  paymentSummary: {
    background: '#f8f9fa', borderRadius: '6px',
    padding: '1rem', marginBottom: '1.5rem'
  },
  paymentSummaryRow: {
    display: 'flex', justifyContent: 'space-between',
    marginTop: '0.5rem', fontSize: '0.9rem'
  },
  paymentTotalRow: {
    display: 'flex', justifyContent: 'space-between',
    marginTop: '0.75rem', paddingTop: '0.75rem',
    borderTop: '1px solid #ddd', fontWeight: 'bold'
  },
  
  // Botones del modal
  modalButtons: { display: 'flex', gap: '1rem' },
  addButton: {
    flex: 1, background: '#007bff', color: 'white',
    border: 'none', borderRadius: '6px', padding: '1rem',
    cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem'
  },
  cancelButton: {
    flex: 1, background: '#6c757d', color: 'white',
    border: 'none', borderRadius: '6px', padding: '1rem',
    cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem'
  },

    // Modal confirmacion ventas
  confirmationModal: {
    background: 'white',
    borderRadius: '8px',
    padding: '2rem',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '85vh',
    overflowY: 'auto',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },

  ticketContainer: {
    border: '2px dashed #ccc',
    borderRadius: '8px',
    padding: '1.5rem',
    margin: '1.5rem 0',
    background: '#f9f9f9'
  },

  ticketHeader: {
    textAlign: 'center',
    borderBottom: '2px solid #007bff',
    paddingBottom: '1rem',
    marginBottom: '1rem'
  },

  ticketItems: {
    maxHeight: '300px',
    overflowY: 'auto',
    marginBottom: '1rem'
  },

  ticketItem: {
    background: 'white',
    border: '1px solid #ddd',
    borderRadius: '6px',
    padding: '1rem',
    marginBottom: '0.75rem'
  },

  ticketItemHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '0.5rem',
    borderBottom: '1px solid #eee',
    paddingBottom: '0.5rem'
  },

  itemNumber: {
    fontWeight: 'bold',
    marginRight: '0.5rem',
    color: '#007bff'
  },

  itemName: {
    fontWeight: 'bold',
    flex: 1,
    color: '#2c3e50'
  },

  itemCode: {
    fontFamily: 'monospace',
    color: '#7f8c8d',
    fontSize: '0.9rem'
  },

  ticketDetails: {
    paddingLeft: '1.5rem'
  },

  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.25rem',
    fontSize: '0.9rem'
  },

  discountRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.25rem',
    fontSize: '0.9rem',
    color: '#28a745'
  },

  discountText: {
    fontWeight: 'bold'
  },

  itemTotal: {
    fontWeight: 'bold',
    color: '#2c3e50'
  },

  paymentMethods: {
    marginTop: '0.5rem',
    paddingTop: '0.5rem',
    borderTop: '1px dashed #ddd'
  },

  methodsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginTop: '0.25rem'
  },

  methodTag: {
    background: '#e7f3ff',
    color: '#0066cc',
    fontSize: '0.8rem',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px'
  },

  ticketFooter: {
    borderTop: '2px solid #007bff',
    paddingTop: '1rem'
  },

  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
    fontSize: '1rem'
  },

  grandTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '2px solid #28a745',
    fontSize: '1.2rem',
    fontWeight: 'bold'
  },

  grandTotalAmount: {
    color: '#28a745',
    fontSize: '1.4rem'
  },

  confirmationButtons: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1.5rem'
  },

  confirmButton: {
    flex: 1,
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '1rem',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1rem'
  },

  cancelButton: {
    flex: 1,
    background: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '1rem',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1rem'
  }
};