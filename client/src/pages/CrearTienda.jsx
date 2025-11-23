import React, { useState } from "react";
import axios from "axios";

export default function CrearTienda() {
  const [storeName, setStoreName] = useState("");
  const [storeTag, setStoreTag] = useState("");

  const [products, setProducts] = useState([
    { image: null, name: "" }
  ]);

  const addProduct = () => {
    if (products.length >= 10) return;
    setProducts([...products, { image: null, name: "" }]);
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

  const submitStore = async () => {
    try {
      const form = new FormData();
      form.append("storeName", storeName);
      form.append("storeTag", storeTag);

      products.forEach((p, i) => {
        if (p.image) {
          form.append("productImages", p.image);
          form.append("productNames", p.name);
        }
      });

      const res = await axios.post("http://localhost:3001/api/tiendas",
        form,
        { headers: { "Content-Type": "multipart/form-data" }}
      );

      alert("Tienda creada exitosamente");
    } catch (err) {
      console.error(err);
      alert("Error al crear tienda");
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4 font-bold">Crear Tienda</h1>

      <label>Nombre de Tienda</label>
      <input
        type="text"
        value={storeName}
        onChange={(e) => setStoreName(e.target.value)}
        className="border p-2 w-full mb-4"
      />

      <label>Tag de Tienda</label>
      <input
        type="text"
        value={storeTag}
        onChange={(e) => setStoreTag(e.target.value)}
        className="border p-2 w-full mb-4"
      />

      <h2 className="font-semibold mb-2">Añadir inventario</h2>

      {products.map((p, i) => (
        <div key={i} className="border p-4 mb-4 rounded">
          <label>Imagen del producto #{i + 1}</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => updateImage(i, e.target.files[0])}
            className="block mb-2"
          />

          <label>Nombre del producto</label>
          <input
            type="text"
            value={p.name}
            disabled={!p.image}
            onChange={(e) => updateName(i, e.target.value)}
            className="border p-2 w-full"
          />
        </div>
      ))}

      {products.length < 10 && (
        <button
          className="bg-gray-800 text-white px-4 py-2 rounded"
          onClick={addProduct}
        >
          + Agregar otro producto
        </button>
      )}

      <br /><br />

      <button
        className="bg-blue-600 text-white px-6 py-2 rounded"
        onClick={submitStore}
      >
        Guardar Tienda
      </button>
    </div>
  );
}