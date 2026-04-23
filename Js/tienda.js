// ═══════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════
const API_URL = "https://libreria-production-8cc8.up.railway.app/api/v1/tienda/libros";

// ═══════════════════════════════════════════
// ESTADO
// ═══════════════════════════════════════════
let todosLosLibros = [];
let filtroActivo = null; // { tipo: 'autor'|'categoria'|'editorial', valor: string }
let busqueda = '';

// ═══════════════════════════════════════════
// ELEMENTOS
// ═══════════════════════════════════════════
const listado       = document.getElementById("listado-libros");
const detalle       = document.getElementById("detalle-libro");
const searchInput   = document.getElementById("search-input");
const resultsCount  = document.getElementById("results-count");
const activeFilters = document.getElementById("active-filters");
const hamburger     = document.getElementById("hamburger");
const drawer        = document.getElementById("drawer");
const drawerOverlay = document.getElementById("drawer-overlay");
const drawerClose   = document.getElementById("drawer-close");

// ═══════════════════════════════════════════
// IMAGEN POR ISBN
// ═══════════════════════════════════════════
function getImagen(isbn) {
  if (!isbn) return 'https://via.placeholder.com/150x220?text=Sin+imagen';
  return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
}

function manejarErrorImagen(img) {
  img.src = 'https://via.placeholder.com/150x220?text=Sin+imagen';
}

// ═══════════════════════════════════════════
// DRAWER (MENÚ HAMBURGUESA)
// ═══════════════════════════════════════════
function abrirDrawer() {
  drawer.classList.add('open');
  drawerOverlay.classList.add('open');
  hamburger.classList.add('open');
}

function cerrarDrawer() {
  drawer.classList.remove('open');
  drawerOverlay.classList.remove('open');
  hamburger.classList.remove('open');
}

hamburger.addEventListener('click', abrirDrawer);
drawerClose.addEventListener('click', cerrarDrawer);
drawerOverlay.addEventListener('click', cerrarDrawer);

// ═══════════════════════════════════════════
// FILTROS
// ═══════════════════════════════════════════
function aplicarFiltro(tipo, valor, btn) {
  // Si ya estaba activo, lo desactiva
  if (filtroActivo && filtroActivo.tipo === tipo && filtroActivo.valor === valor) {
    filtroActivo = null;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  } else {
    filtroActivo = { tipo, valor };
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  cerrarDrawer();
  renderLibros();
  actualizarFiltroTag();
}

function quitarFiltro() {
  filtroActivo = null;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  renderLibros();
  actualizarFiltroTag();
}

function actualizarFiltroTag() {
  if (!filtroActivo) {
    activeFilters.innerHTML = '';
    return;
  }
  activeFilters.innerHTML = `
    <div class="filter-tag">
      ${filtroActivo.tipo}: <strong>${filtroActivo.valor}</strong>
      <button onclick="quitarFiltro()">×</button>
    </div>
  `;
}

// ═══════════════════════════════════════════
// BÚSQUEDA
// ═══════════════════════════════════════════
searchInput.addEventListener('input', () => {
  busqueda = searchInput.value.toLowerCase().trim();
  renderLibros();
});

// ═══════════════════════════════════════════
// FILTRAR LIBROS
// ═══════════════════════════════════════════
function getLibrosFiltrados() {
  return todosLosLibros.filter(libro => {
    const matchBusqueda = !busqueda || libro.titulo.toLowerCase().includes(busqueda);

    let matchFiltro = true;
    if (filtroActivo) {
      if (filtroActivo.tipo === 'autor')      matchFiltro = libro.autor === filtroActivo.valor;
      if (filtroActivo.tipo === 'categoria')  matchFiltro = libro.categoria === filtroActivo.valor;
      if (filtroActivo.tipo === 'editorial')  matchFiltro = libro.editorial === filtroActivo.valor;
    }

    return matchBusqueda && matchFiltro;
  });
}

// ═══════════════════════════════════════════
// POBLAR DRAWER CON OPCIONES ÚNICAS
// ═══════════════════════════════════════════
function poblarDrawer() {
  const autores     = [...new Set(todosLosLibros.map(l => l.autor).filter(Boolean))];
  const categorias  = [...new Set(todosLosLibros.map(l => l.categoria).filter(Boolean))];
  const editoriales = [...new Set(todosLosLibros.map(l => l.editorial).filter(Boolean))];

  document.getElementById('filtros-autores').innerHTML = autores.map(a => `
    <button class="filter-btn" onclick="aplicarFiltro('autor', '${a}', this)">${a}</button>
  `).join('');

  document.getElementById('filtros-categorias').innerHTML = categorias.map(c => `
    <button class="filter-btn" onclick="aplicarFiltro('categoria', '${c}', this)">${c}</button>
  `).join('');

  document.getElementById('filtros-editoriales').innerHTML = editoriales.map(e => `
    <button class="filter-btn" onclick="aplicarFiltro('editorial', '${e}', this)">${e}</button>
  `).join('');
}

// ═══════════════════════════════════════════
// RENDER GRID
// ═══════════════════════════════════════════
function renderLibros() {
  const libros = getLibrosFiltrados();

  resultsCount.innerHTML = `Mostrando <strong>${libros.length}</strong> de <strong>${todosLosLibros.length}</strong> libros`;

  if (!libros.length) {
    listado.innerHTML = `
      <div class="no-results">
        <h3>Sin resultados</h3>
        <p>Probá con otro término o quitá los filtros.</p>
      </div>
    `;
    return;
  }

  listado.innerHTML = libros.map((libro, i) => `
    <div class="card" style="animation-delay: ${i * 0.05}s" onclick="verDetalle(${libro.id})">
      <div class="card-img-wrap">
        <img src="${getImagen(libro.isbn)}" 
             alt="${libro.titulo}"
             onerror="manejarErrorImagen(this)">
      </div>
      <div class="card-body">
        <div class="card-titulo">${libro.titulo}</div>
        <div class="card-autor">${libro.autor || ''}</div>
        <div class="card-footer">
          <span class="card-precio">$${libro.precio}</span>
          <span class="card-categoria">${libro.categoria || ''}</span>
        </div>
      </div>
    </div>
  `).join('');
}

// ═══════════════════════════════════════════
// CARGAR LIBROS
// ═══════════════════════════════════════════
async function cargarLibros() {
  listado.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Cargando catálogo...</p>
    </div>
  `;

  try {
    const res = await fetch(API_URL);
    todosLosLibros = await res.json();
    poblarDrawer();
    renderLibros();
  } catch (e) {
    listado.innerHTML = `
      <div class="no-results">
        <h3>Error al cargar</h3>
        <p>No se pudo conectar con el servidor.</p>
      </div>
    `;
  }
}

// ═══════════════════════════════════════════
// VER DETALLE
// ═══════════════════════════════════════════
async function verDetalle(id) {
  document.getElementById('listado-wrapper').classList.add('hidden');
  detalle.classList.remove('hidden');

  detalle.innerHTML = `
    <div class="detalle-wrapper">
      <div class="loading"><div class="spinner"></div></div>
    </div>
  `;

  try {
    const res = await fetch(`${API_URL}/${id}`);
    const libro = await res.json();

    detalle.innerHTML = `
      <div class="detalle-wrapper">
        <div class="detalle">
          <div class="detalle-inner">
            <div class="detalle-img-wrap">
              <img src="${getImagen(libro.isbn)}" 
                   alt="${libro.titulo}"
                   onerror="manejarErrorImagen(this)">
            </div>
            <div class="detalle-info">
              <div class="detalle-categoria">${libro.categoria || ''}</div>
              <h2 class="detalle-titulo">${libro.titulo}</h2>
              <p class="detalle-autor">${libro.autor || ''}</p>
              <div class="detalle-divider"></div>
              <div class="detalle-meta">
                <div class="detalle-meta-row">
                  <span class="detalle-meta-label">Editorial</span>
                  <span>${libro.editorial || '—'}</span>
                </div>
                <div class="detalle-meta-row">
                  <span class="detalle-meta-label">ISBN</span>
                  <span>${libro.isbn || '—'}</span>
                </div>
              </div>
              <div class="detalle-precio">$${libro.precio}</div>
              <button class="btn-volver" onclick="volver()">← Volver al catálogo</button>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch(e) {
    detalle.innerHTML = '<div class="detalle-wrapper"><p>Error al cargar el detalle.</p></div>';
  }
}

// ═══════════════════════════════════════════
// VOLVER
// ═══════════════════════════════════════════
function volver() {
  detalle.classList.add('hidden');
  document.getElementById('listado-wrapper').classList.remove('hidden');
}

// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
cargarLibros();