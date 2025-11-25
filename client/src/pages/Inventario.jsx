import React, { useEffect, useState } from "react";

const Inventario = () => {
  const [stores, setStores] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/tiendas")
      .then((res) => res.json())
      .then((data) => setStores(data))
      .catch((err) => console.error(err));
  }, []);

  const toggleExpand = (id) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const closePreview = () => {
    setSelectedProduct(null);
  };

  return (
    <div style={{ display: "flex", padding: "20px", gap: "20px" }}>

      {/* LEFT PANEL FOR IMAGE PREVIEW */}
      {selectedProduct && (
        <div
          style={{
            width: "350px",
            border: "1px solid #ccc",
            padding: "10px",
            borderRadius: "8px",
            position: "relative",
            background: "white",
            height: "fit-content"
          }}
        >
          {/* CLOSE BUTTON */}
          <button
            onClick={closePreview}
            style={{
              position: "absolute",
              top: "8px",
              left: "8px",
              background: "red",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              padding: "3px 6px",
            }}
          >
            X
          </button>

          <h3 style={{ marginTop: "30px" }}>{selectedProduct.name}</h3>

          <img
            src={`http://localhost:5000${selectedProduct.imageUrl}`}
            alt="producto"
            style={{
              width: "100%",
              borderRadius: "5px",
              marginTop: "10px",
            }}
          />
        </div>
      )}

      {/* INVENTORY TABLE */}
      <div style={{ flexGrow: 1 }}>
        <h1>Inventario</h1>

        <table border="1" cellPadding="10" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Tienda</th>
              <th>Total Productos</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {stores.map((store) => (
              <React.Fragment key={store._id}>
                <tr>
                  <td>{store.name}</td>
                  <td>{store.products?.length || 0}</td>
                  <td>
                    <button onClick={() => toggleExpand(store._id)}>
                      {expanded[store._id] ? "Ocultar" : "Expandir"}
                    </button>
                  </td>
                </tr>

                {expanded[store._id] && (
                  <tr>
                    <td colSpan="3">
                      <strong>Productos:</strong>
                      <ul>
                        {store.products.map((p, index) => (
                          <li
                            key={index}
                            style={{
                              cursor: "pointer",
                              color: "blue",
                              textDecoration: "underline",
                              marginBottom: "4px"
                            }}
                            onClick={() => setSelectedProduct(p)}
                          >
                            {p.clave} — {p.name}
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default Inventario;