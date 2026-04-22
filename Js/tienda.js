const API_URL = "https://libreria-production-8cc8.up.railway.app/api/v1/tienda/libros";

const listado = document.getElementById("listado-libros");
const detalle = document.getElementById("detalle-libro");

// 📚 Imagen por ISBN
function getImagenPorISBN(isbn) {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
}

// 🧯 fallback imagen
function manejarErrorImagen(img) {
  img.src = "https://via.placeholder.com/150x220?text=Sin+imagen";
}

// 📥 Cargar libros
async function cargarLibros() {
  const res = await fetch(API_URL);
  const libros = await res.json();

  listado.innerHTML = "";

  libros.forEach(libro => {
    const card = document.createElement("div");
    card.classList.add("card");

    const imagen = getImagenPorISBN(libro.isbn);

    card.innerHTML = `
      <img src="${imagen}" onerror="manejarErrorImagen(this)">
      <h3>${libro.titulo}</h3>
      <p>${libro.autor}</p>
      <p><strong>$${libro.precio}</strong></p>
    `;

    card.addEventListener("click", () => verDetalle(libro.id));

    listado.appendChild(card);
  });
}

// 🔍 Ver detalle
async function verDetalle(id) {
  const res = await fetch(`${API_URL}/${id}`);
  const libro = await res.json();

  listado.classList.add("hidden");
  detalle.classList.remove("hidden");

  const imagen = getImagenPorISBN(libro.isbn);

  detalle.innerHTML = `
    <p class="volver" onclick="volver()">⬅ Volver</p>
    <h2>${libro.titulo}</h2>
    <img src="${imagen}" onerror="manejarErrorImagen(this)">
    <p><strong>Autor:</strong> ${libro.autor}</p>
    <p><strong>Categoría:</strong> ${libro.categoria}</p>
    <p><strong>Editorial:</strong> ${libro.editorial}</p>
    <p><strong>ISBN:</strong> ${libro.isbn}</p>
    <p><strong>Precio:</strong> $${libro.precio}</p>
  `;
}

// 🔙 Volver al listado
function volver() {
  detalle.classList.add("hidden");
  listado.classList.remove("hidden");
}

// 🚀 Init
cargarLibros();