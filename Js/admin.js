// ═══════════════════════════════════════════════════════
// CONFIG — URLs base
// ═══════════════════════════════════════════════════════
const API_ADMIN = "https://libreria-production-8cc8.up.railway.app/api/v1/tienda/admin";

// ═══════════════════════════════════════════════════════
// ESTADO GLOBAL
// ═══════════════════════════════════════════════════════
let modalMode = null;
let modalEntity = null;
let editingId = null;

let autoresList = [];
let categoriasList = [];
let editorialesList = [];

// ═══════════════════════════════════════════════════════
// AUTH — verificar token al cargar la página
// ═══════════════════════════════════════════════════════
checkAuth();

const usernameEl = document.getElementById('topbar-user');
if (usernameEl) usernameEl.textContent = getUsername() || '';

// ═══════════════════════════════════════════════════════
// NAVEGACIÓN
// ═══════════════════════════════════════════════════════
function showView(view, navItem) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('view-' + view).classList.add('active');
    navItem.classList.add('active');

    const titles = {
        dashboard: 'Dashboard',
        autores: 'Autores',
        categorias: 'Categorías',
        editoriales: 'Editoriales',
        libros: 'Libros'
    };
    document.getElementById('topbar-title').textContent = titles[view];

    if (view === 'dashboard')   loadDashboard();
    if (view === 'autores')     loadAutores();
    if (view === 'categorias')  loadCategorias();
    if (view === 'editoriales') loadEditoriales();
    if (view === 'libros')      loadLibros();
}

// ═══════════════════════════════════════════════════════
// API — todas las rutas admin (requieren token JWT)
// ═══════════════════════════════════════════════════════
async function apiFetch(path, options = {}) {
    const token = getToken();

    const res = await fetch(API_ADMIN + path, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        ...options
    });

    if (res.status === 401) {
        logout();
        return;
    }

    if (!res.ok) throw new Error(`Error ${res.status}`);
    if (res.status === 204) return null;
    return res.json();
}

// ═══════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════
async function loadDashboard() {
    try {
        const [libros, autores, categorias, editoriales] = await Promise.all([
            apiFetch('/libros'),
            apiFetch('/autor'),
            apiFetch('/categoria'),
            apiFetch('/editorial')
        ]);

        document.getElementById('stat-libros').textContent      = libros.length;
        document.getElementById('stat-autores').textContent     = autores.length;
        document.getElementById('stat-categorias').textContent  = categorias.length;
        document.getElementById('stat-editoriales').textContent = editoriales.length;

    } catch (e) {
        console.error('Error cargando dashboard:', e);
    }
}

// ═══════════════════════════════════════════════════════
// AUTORES
// ═══════════════════════════════════════════════════════
async function loadAutores() {
    const tbody = document.getElementById('tbody-autores');
    tbody.innerHTML = '<tr><td colspan="4">Cargando...</td></tr>';

    try {
        autoresList = await apiFetch('/autor');

        if (!autoresList.length) {
            tbody.innerHTML = '<tr><td colspan="4">Sin autores</td></tr>';
            return;
        }

        tbody.innerHTML = autoresList.map(a => `
            <tr>
                <td>${a.idAutor}</td>
                <td>${a.nombre}</td>
                <td>${a.apellido}</td>
                <td>
                    <button onclick="editAutor(${a.idAutor})">Editar</button>
                    <button onclick="deleteAutor(${a.idAutor})">Eliminar</button>
                </td>
            </tr>`).join('');

    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="4">Error API</td></tr>';
    }
}

async function deleteAutor(id) {
    if (!confirm('¿Eliminar autor?')) return;
    await apiFetch(`/autor/${id}`, { method: 'DELETE' });
    loadAutores();
}

function editAutor(id) {
    const autor = autoresList.find(a => a.idAutor === id);
    openModal('autor', autor);
}

// ═══════════════════════════════════════════════════════
// CATEGORÍAS
// ═══════════════════════════════════════════════════════
async function loadCategorias() {
    const tbody = document.getElementById('tbody-categorias');
    tbody.innerHTML = '<tr><td colspan="3">Cargando...</td></tr>';

    try {
        categoriasList = await apiFetch('/categoria');

        tbody.innerHTML = categoriasList.map(c => `
            <tr>
                <td>${c.idCategoria}</td>
                <td>${c.nombreGenero}</td>
                <td>
                    <button onclick="editCategoria(${c.idCategoria})">Editar</button>
                    <button onclick="deleteCategoria(${c.idCategoria})">Eliminar</button>
                </td>
            </tr>`).join('');

    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="3">Error API</td></tr>';
    }
}

async function deleteCategoria(id) {
    if (!confirm('¿Eliminar categoría?')) return;
    await apiFetch(`/categoria/${id}`, { method: 'DELETE' });
    loadCategorias();
}

function editCategoria(id) {
    const cat = categoriasList.find(c => c.idCategoria === id);
    openModal('categoria', cat);
}

// ═══════════════════════════════════════════════════════
// EDITORIALES
// ═══════════════════════════════════════════════════════
async function loadEditoriales() {
    const tbody = document.getElementById('tbody-editoriales');
    tbody.innerHTML = '<tr><td colspan="3">Cargando...</td></tr>';

    try {
        editorialesList = await apiFetch('/editorial');

        tbody.innerHTML = editorialesList.map(e => `
            <tr>
                <td>${e.idEditorial}</td>
                <td>${e.nombre}</td>
                <td>
                    <button onclick="editEditorial(${e.idEditorial})">Editar</button>
                    <button onclick="deleteEditorial(${e.idEditorial})">Eliminar</button>
                </td>
            </tr>`).join('');

    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="3">Error API</td></tr>';
    }
}

async function deleteEditorial(id) {
    if (!confirm('¿Eliminar editorial?')) return;
    await apiFetch(`/editorial/${id}`, { method: 'DELETE' });
    loadEditoriales();
}

function editEditorial(id) {
    const ed = editorialesList.find(e => e.idEditorial === id);
    openModal('editorial', ed);
}

// ═══════════════════════════════════════════════════════
// LIBROS
// ═══════════════════════════════════════════════════════
async function loadLibros() {
    const tbody = document.getElementById('tbody-libros');
    tbody.innerHTML = '<tr><td colspan="7">Cargando...</td></tr>';

    try {
        [autoresList, categoriasList, editorialesList] = await Promise.all([
            apiFetch('/autor'),
            apiFetch('/categoria'),
            apiFetch('/editorial')
        ]);

        const libros = await apiFetch('/libros');

        tbody.innerHTML = libros.map(l => `
            <tr>
                <td>${l.idLibro}</td>
                <td>${l.titulo}</td>
                <td>${l.autor ? l.autor.nombre + ' ' + l.autor.apellido : ''}</td>
                <td>${l.categoria ? l.categoria.nombreGenero : ''}</td>
                <td>${l.editorial ? l.editorial.nombre : ''}</td>
                <td>${l.anioEdicion}</td>
                <td>
                    <button onclick="editLibros(${l.idLibro})">Editar</button>
                    <button onclick="deleteLibros(${l.idLibro})">Eliminar</button>
                </td>
            </tr>`).join('');

    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="7">Error API</td></tr>';
    }
}

async function deleteLibros(id) {
    if (!confirm('¿Eliminar libro?')) return;
    await apiFetch(`/libros/${id}`, { method: 'DELETE' });
    loadLibros();
}

async function editLibros(id) {
    const libro = await apiFetch(`/libros/${id}`);
    openModal('libros', libro);
}

// ═══════════════════════════════════════════════════════
// MODAL
// ═══════════════════════════════════════════════════════
function openModal(entity, data = null) {
    modalEntity = entity;
    modalMode = data ? 'edit' : 'create';
    editingId = data?.idAutor || data?.idCategoria || data?.idEditorial || data?.idLibro;

    document.getElementById('modal-body').innerHTML = buildForm(entity, data);
    document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('open');
}

// ═══════════════════════════════════════════════════════
// FORM BUILDER
// ═══════════════════════════════════════════════════════
// ═══════════════════════════════════════════
// FORM BUILDER — libros corregido
// ═══════════════════════════════════════════
function buildForm(entity, data) {
    if (entity === 'autor') {
        return `
            <div class="form-group">
                <label>Nombre</label>
                <input id="f-nombre" placeholder="Nombre" value="${data?.nombre || ''}">
            </div>
            <div class="form-group">
                <label>Apellido</label>
                <input id="f-apellido" placeholder="Apellido" value="${data?.apellido || ''}">
            </div>`;
    }

    if (entity === 'categoria') {
        return `
            <div class="form-group">
                <label>Género</label>
                <input id="f-nombreGenero" placeholder="Categoría" value="${data?.nombreGenero || ''}">
            </div>`;
    }

    if (entity === 'editorial') {
        return `
            <div class="form-group">
                <label>Nombre</label>
                <input id="f-nombre" placeholder="Editorial" value="${data?.nombre || ''}">
            </div>`;
    }

    if (entity === 'libros') {
        const autorOptions = autoresList.map(a =>
            `<option value="${a.idAutor}" ${data?.autor?.idAutor === a.idAutor ? 'selected' : ''}>
                ${a.nombre} ${a.apellido}
            </option>`
        ).join('');

        const categoriaOptions = categoriasList.map(c =>
            `<option value="${c.idCategoria}" ${data?.categoria?.idCategoria === c.idCategoria ? 'selected' : ''}>
                ${c.nombreGenero}
            </option>`
        ).join('');

        const editorialOptions = editorialesList.map(e =>
            `<option value="${e.idEditorial}" ${data?.editorial?.idEditorial === e.idEditorial ? 'selected' : ''}>
                ${e.nombre}
            </option>`
        ).join('');

        return `
            <div class="form-group">
                <label>Título</label>
                <input id="f-titulo" placeholder="Título" value="${data?.titulo || ''}">
            </div>
            <div class="form-group">
                <label>ISBN</label>
                <input id="f-isbn" placeholder="ISBN" value="${data?.isbn || ''}">
            </div>
            <div class="form-group">
                <label>Precio</label>
                <input id="f-precio" type="number" step="0.01" placeholder="Precio" value="${data?.precio || ''}">
            </div>
            <div class="form-group">
                <label>Año de edición</label>
                <input id="f-anioEdicion" type="number" placeholder="Año" value="${data?.anioEdicion || ''}">
            </div>
            <div class="form-group">
                <label>URL Imagen</label>
                <input id="f-image" placeholder="https://..." value="${data?.image || ''}">
            </div>
            <div class="form-group">
                <label>Autor</label>
                <select id="f-autor">${autorOptions}</select>
            </div>
            <div class="form-group">
                <label>Categoría</label>
                <select id="f-categoria">${categoriaOptions}</select>
            </div>
            <div class="form-group">
                <label>Editorial</label>
                <select id="f-editorial">${editorialOptions}</select>
            </div>`;
    }
}
// ═══════════════════════════════════════════════════════
// SAVE
// ═══════════════════════════════════════════════════════
// ═══════════════════════════════════════════
// SAVE — libros corregido
// ═══════════════════════════════════════════
async function saveModal() {
    let body = {};
    const isEdit = modalMode === 'edit';

    try {
        if (modalEntity === 'autor') {
            body = {
                nombre:   document.getElementById('f-nombre').value,
                apellido: document.getElementById('f-apellido').value
            };
            await apiFetch(isEdit ? `/autor/${editingId}` : '/autor', {
                method: isEdit ? 'PUT' : 'POST',
                body: JSON.stringify(body)
            });
            loadAutores();
        }

        if (modalEntity === 'categoria') {
            body = { nombreGenero: document.getElementById('f-nombreGenero').value };
            await apiFetch(isEdit ? `/categoria/${editingId}` : '/categoria', {
                method: isEdit ? 'PUT' : 'POST',
                body: JSON.stringify(body)
            });
            loadCategorias();
        }

        if (modalEntity === 'editorial') {
            body = { nombre: document.getElementById('f-nombre').value };
            await apiFetch(isEdit ? `/editorial/${editingId}` : '/editorial', {
                method: isEdit ? 'PUT' : 'POST',
                body: JSON.stringify(body)
            });
            loadEditoriales();
        }

        if (modalEntity === 'libros') {
            body = {
                titulo:       document.getElementById('f-titulo').value,
                isbn:         document.getElementById('f-isbn').value,
                precio:       parseFloat(document.getElementById('f-precio').value),
                anioEdicion:  parseInt(document.getElementById('f-anioEdicion').value),
                image:        document.getElementById('f-image').value,
                autorId:      parseInt(document.getElementById('f-autor').value),
                categoriaId:  parseInt(document.getElementById('f-categoria').value),
                editorialId:  parseInt(document.getElementById('f-editorial').value)
            };
            await apiFetch(isEdit ? `/libros/${editingId}` : '/libros', {
                method: isEdit ? 'PUT' : 'POST',
                body: JSON.stringify(body)
            });
            loadLibros();
        }

        closeModal();

    } catch (e) {
        alert('Error al guardar');
    }
}
// ═══════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════
loadDashboard();