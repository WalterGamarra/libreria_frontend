// ═══════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════
const API_ADMIN = "https://libreria-production-8cc8.up.railway.app/api/v1/tienda/admin";
const GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes";

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
// AUTH
// ═══════════════════════════════════════════════════════
checkAuth();
const usernameEl = document.getElementById('topbar-user');
if (usernameEl) usernameEl.textContent = getUsername() || '';

// ═══════════════════════════════════════════════════════
// LOGOUT
// ═══════════════════════════════════════════════════════
function logout() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('jwt_username');
    window.location.href = 'index.html';
}

// ═══════════════════════════════════════════════════════
// NAVEGACIÓN
// ═══════════════════════════════════════════════════════
function showView(view, navItem) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('view-' + view).classList.add('active');
    navItem.classList.add('active');

    const titles = { dashboard: 'Dashboard', autores: 'Autores', categorias: 'Categorías', editoriales: 'Editoriales', libros: 'Libros' };
    document.getElementById('topbar-title').textContent = titles[view];

    if (view === 'dashboard')   loadDashboard();
    if (view === 'autores')     loadAutores();
    if (view === 'categorias')  loadCategorias();
    if (view === 'editoriales') loadEditoriales();
    if (view === 'libros')      loadLibros();
}

// ═══════════════════════════════════════════════════════
// API FETCH
// ═══════════════════════════════════════════════════════
async function apiFetch(path, options = {}) {
    const token = getToken();
    const res = await fetch(API_ADMIN + path, {
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        ...options
    });
    if (res.status === 401) { logout(); return; }
    if (!res.ok) throw new Error(`Error ${res.status}`);
    if (res.status === 204) return null;
    return res.json();
}

// ═══════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════
function showToast(msg, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ═══════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════
async function loadDashboard() {
    try {
        const [libros, autores, categorias, editoriales] = await Promise.all([
            apiFetch('/libros'), apiFetch('/autor'), apiFetch('/categoria'), apiFetch('/editorial')
        ]);
        document.getElementById('stat-libros').textContent      = libros.length;
        document.getElementById('stat-autores').textContent     = autores.length;
        document.getElementById('stat-categorias').textContent  = categorias.length;
        document.getElementById('stat-editoriales').textContent = editoriales.length;
    } catch (e) { console.error('Error cargando dashboard:', e); }
}

// ═══════════════════════════════════════════════════════
// AUTORES
// ═══════════════════════════════════════════════════════
async function loadAutores() {
    const tbody = document.getElementById('tbody-autores');
    tbody.innerHTML = '<tr><td colspan="4">Cargando...</td></tr>';
    try {
        autoresList = await apiFetch('/autor');
        if (!autoresList.length) { tbody.innerHTML = '<tr><td colspan="4">Sin autores</td></tr>'; return; }
        tbody.innerHTML = autoresList.map(a => `
            <tr>
                <td>${a.idAutor}</td>
                <td>${a.nombre}</td>
                <td>${a.apellido}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="editAutor(${a.idAutor})">Editar</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteAutor(${a.idAutor})">Eliminar</button>
                </td>
            </tr>`).join('');
    } catch (e) { tbody.innerHTML = '<tr><td colspan="4">Error API</td></tr>'; }
}

async function deleteAutor(id) {
    if (!confirm('¿Eliminar autor?')) return;
    await apiFetch(`/autor/${id}`, { method: 'DELETE' });
    showToast('Autor eliminado');
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
                    <button class="btn btn-sm btn-secondary" onclick="editCategoria(${c.idCategoria})">Editar</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCategoria(${c.idCategoria})">Eliminar</button>
                </td>
            </tr>`).join('');
    } catch (e) { tbody.innerHTML = '<tr><td colspan="3">Error API</td></tr>'; }
}

async function deleteCategoria(id) {
    if (!confirm('¿Eliminar categoría?')) return;
    await apiFetch(`/categoria/${id}`, { method: 'DELETE' });
    showToast('Categoría eliminada');
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
                    <button class="btn btn-sm btn-secondary" onclick="editEditorial(${e.idEditorial})">Editar</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteEditorial(${e.idEditorial})">Eliminar</button>
                </td>
            </tr>`).join('');
    } catch (e) { tbody.innerHTML = '<tr><td colspan="3">Error API</td></tr>'; }
}

async function deleteEditorial(id) {
    if (!confirm('¿Eliminar editorial?')) return;
    await apiFetch(`/editorial/${id}`, { method: 'DELETE' });
    showToast('Editorial eliminada');
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
    tbody.innerHTML = '<tr><td colspan="6">Cargando...</td></tr>';
    try {
        [autoresList, categoriasList, editorialesList] = await Promise.all([
            apiFetch('/autor'), apiFetch('/categoria'), apiFetch('/editorial')
        ]);
        const libros = await apiFetch('/libros');
        tbody.innerHTML = libros.map(l => `
            <tr>
                <td>${l.idLibro}</td>
                <td>${l.titulo}</td>
                <td>${l.autor ? l.autor.nombre + ' ' + l.autor.apellido : ''}</td>
                <td>${l.categoria ? l.categoria.nombreGenero : ''}</td>
                <td>${l.editorial ? l.editorial.nombre : ''}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="editLibros(${l.idLibro})">Editar</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteLibros(${l.idLibro})">Eliminar</button>
                </td>
            </tr>`).join('');
    } catch (e) { tbody.innerHTML = '<tr><td colspan="6">Error API</td></tr>'; }
}

async function deleteLibros(id) {
    if (!confirm('¿Eliminar libro?')) return;
    await apiFetch(`/libros/${id}`, { method: 'DELETE' });
    showToast('Libro eliminado');
    loadLibros();
}

async function editLibros(id) {
    const libro = await apiFetch(`/libros/${id}`);
    openModal('libros', libro);
}

// ═══════════════════════════════════════════════════════
// GOOGLE BOOKS — búsqueda por título
// ═══════════════════════════════════════════════════════
async function buscarEnGoogleBooks() {
    const query = document.getElementById('gb-search').value.trim();
    if (!query) return;

    const resultsEl = document.getElementById('gb-results');
    resultsEl.innerHTML = '<p class="gb-loading">Buscando...</p>';

    try {
        const res = await fetch(`${GOOGLE_BOOKS_API}?q=${encodeURIComponent(query)}&maxResults=5&langRestrict=es`);
        const data = await res.json();

        if (!data.items?.length) {
            resultsEl.innerHTML = '<p class="gb-empty">Sin resultados. Probá con otro título.</p>';
            return;
        }

        resultsEl.innerHTML = data.items.map(item => {
            const info = item.volumeInfo;
            const isbn = info.industryIdentifiers?.find(i => i.type === 'ISBN_13')?.identifier || '';
            const thumb = info.imageLinks?.thumbnail || '';
            const autor = info.authors?.[0] || '';
            const anio = info.publishedDate?.substring(0, 4) || '';
            const editorial = info.publisher || '';

            return `
                <div class="gb-item" onclick="autocompletar('${escStr(info.title)}', '${escStr(isbn)}', '${escStr(autor)}', '${escStr(anio)}', '${escStr(thumb)}', '${escStr(editorial)}')">
                    ${thumb ? `<img src="${thumb}" alt="${escStr(info.title)}">` : '<div class="gb-no-img">📚</div>'}
                    <div class="gb-item-info">
                        <div class="gb-item-title">${info.title}</div>
                        <div class="gb-item-meta">${autor}${anio ? ' · ' + anio : ''}</div>
                        ${isbn ? `<div class="gb-item-isbn">ISBN: ${isbn}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        resultsEl.innerHTML = '<p class="gb-empty">Error al buscar. Intentá de nuevo.</p>';
    }
}

function escStr(str) {
    return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function autocompletar(titulo, isbn, autor, anio, imagen, editorial) {
    document.getElementById('f-titulo').value = titulo;
    document.getElementById('f-isbn').value = isbn;
    document.getElementById('f-anioEdicion').value = anio;
    document.getElementById('f-image').value = imagen;

    // Ocultar resultados
    document.getElementById('gb-results').innerHTML = '';
    document.getElementById('gb-search').value = titulo;

    // Intentar preseleccionar autor si coincide
    const autorSelect = document.getElementById('f-autor');
    const nombreParts = autor.split(' ');
    const apellido = nombreParts[nombreParts.length - 1].toLowerCase();
    for (let opt of autorSelect.options) {
        if (opt.text.toLowerCase().includes(apellido)) {
            opt.selected = true;
            break;
        }
    }

    // Intentar preseleccionar editorial si coincide
    const editorialSelect = document.getElementById('f-editorial');
    for (let opt of editorialSelect.options) {
        if (opt.text.toLowerCase().includes(editorial.toLowerCase())) {
            opt.selected = true;
            break;
        }
    }

    showToast('Datos autocompletos. Revisá y guardá.', 'success');
}

// ═══════════════════════════════════════════════════════
// INLINE — crear autor/categoría/editorial sin salir del modal
// ═══════════════════════════════════════════════════════
function toggleInlineForm(entity) {
    const form = document.getElementById(`inline-${entity}`);
    form.classList.toggle('hidden');
}

async function saveInline(entity) {
    try {
        if (entity === 'autor') {
            const nombre = document.getElementById('if-autor-nombre').value.trim();
            const apellido = document.getElementById('if-autor-apellido').value.trim();
            if (!nombre || !apellido) { showToast('Completá nombre y apellido', 'error'); return; }
            const nuevo = await apiFetch('/autor', { method: 'POST', body: JSON.stringify({ nombre, apellido }) });
            autoresList.push(nuevo);
            const select = document.getElementById('f-autor');
            const opt = new Option(`${nuevo.nombre} ${nuevo.apellido}`, nuevo.idAutor, true, true);
            select.add(opt);
            document.getElementById('if-autor-nombre').value = '';
            document.getElementById('if-autor-apellido').value = '';
            toggleInlineForm('autor');
            showToast('Autor creado ✓');
        }

        if (entity === 'categoria') {
            const nombreGenero = document.getElementById('if-cat-nombre').value.trim();
            if (!nombreGenero) { showToast('Completá el género', 'error'); return; }
            const nueva = await apiFetch('/categoria', { method: 'POST', body: JSON.stringify({ nombreGenero }) });
            categoriasList.push(nueva);
            const select = document.getElementById('f-categoria');
            const opt = new Option(nueva.nombreGenero, nueva.idCategoria, true, true);
            select.add(opt);
            document.getElementById('if-cat-nombre').value = '';
            toggleInlineForm('categoria');
            showToast('Categoría creada ✓');
        }

        if (entity === 'editorial') {
            const nombre = document.getElementById('if-ed-nombre').value.trim();
            if (!nombre) { showToast('Completá el nombre', 'error'); return; }
            const nueva = await apiFetch('/editorial', { method: 'POST', body: JSON.stringify({ nombre }) });
            editorialesList.push(nueva);
            const select = document.getElementById('f-editorial');
            const opt = new Option(nueva.nombre, nueva.idEditorial, true, true);
            select.add(opt);
            document.getElementById('if-ed-nombre').value = '';
            toggleInlineForm('editorial');
            showToast('Editorial creada ✓');
        }
    } catch (e) {
        showToast('Error al guardar', 'error');
    }
}

// ═══════════════════════════════════════════════════════
// MODAL
// ═══════════════════════════════════════════════════════
function openModal(entity, data = null) {
    modalEntity = entity;
    modalMode = data ? 'edit' : 'create';
    editingId = data?.idAutor || data?.idCategoria || data?.idEditorial || data?.idLibro;
    document.getElementById('modal-title').textContent = data ? `Editar ${entity}` : `Nuevo ${entity}`;
    document.getElementById('modal-body').innerHTML = buildForm(entity, data);
    document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('open');
}

// ═══════════════════════════════════════════════════════
// FORM BUILDER
// ═══════════════════════════════════════════════════════
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
                <input id="f-nombreGenero" placeholder="Ej: Filosofía, Novela..." value="${data?.nombreGenero || ''}">
            </div>`;
    }

    if (entity === 'editorial') {
        return `
            <div class="form-group">
                <label>Nombre</label>
                <input id="f-nombre" placeholder="Nombre de la editorial" value="${data?.nombre || ''}">
            </div>`;
    }

    if (entity === 'libros') {
        const autorOptions = autoresList.map(a =>
            `<option value="${a.idAutor}" ${data?.autor?.idAutor === a.idAutor ? 'selected' : ''}>${a.nombre} ${a.apellido}</option>`
        ).join('');

        const categoriaOptions = categoriasList.map(c =>
            `<option value="${c.idCategoria}" ${data?.categoria?.idCategoria === c.idCategoria ? 'selected' : ''}>${c.nombreGenero}</option>`
        ).join('');

        const editorialOptions = editorialesList.map(e =>
            `<option value="${e.idEditorial}" ${data?.editorial?.idEditorial === e.idEditorial ? 'selected' : ''}>${e.nombre}</option>`
        ).join('');

        return `
            <!-- BUSCADOR GOOGLE BOOKS -->
            <div class="gb-section">
                <label class="gb-label">🔍 Buscar libro por título (autocompleta los datos)</label>
                <div class="gb-input-row">
                    <input id="gb-search" placeholder="Ej: El Aleph, Clean Code..." 
                           onkeydown="if(event.key==='Enter') buscarEnGoogleBooks()">
                    <button type="button" class="btn btn-secondary" onclick="buscarEnGoogleBooks()">Buscar</button>
                </div>
                <div id="gb-results" class="gb-results"></div>
            </div>

            <div class="form-divider">— o completá manualmente —</div>

            <div class="form-group">
                <label>Título</label>
                <input id="f-titulo" placeholder="Título del libro" value="${data?.titulo || ''}">
            </div>
            <div class="form-group">
                <label>ISBN</label>
                <input id="f-isbn" placeholder="Código de 13 dígitos" value="${data?.isbn || ''}">
            </div>
            <div class="form-group">
                <label>Precio</label>
                <input id="f-precio" type="number" step="0.01" placeholder="0.00" value="${data?.precio || ''}">
            </div>
            <div class="form-group">
                <label>Año de edición</label>
                <input id="f-anioEdicion" type="number" placeholder="Ej: 2024" value="${data?.anioEdicion || ''}">
            </div>
            <div class="form-group">
                <label>URL Imagen (portada)</label>
                <input id="f-image" placeholder="https://..." value="${data?.image || ''}">
            </div>

            <!-- AUTOR CON CREACIÓN INLINE -->
            <div class="form-group">
                <div class="form-group-header">
                    <label>Autor</label>
                    <button type="button" class="btn-inline-toggle" onclick="toggleInlineForm('autor')">+ Nuevo autor</button>
                </div>
                <select id="f-autor">${autorOptions}</select>
                <div class="inline-form hidden" id="inline-autor">
                    <input id="if-autor-nombre" placeholder="Nombre">
                    <input id="if-autor-apellido" placeholder="Apellido">
                    <button type="button" class="btn btn-sm btn-primary" onclick="saveInline('autor')">Guardar autor</button>
                </div>
            </div>

            <!-- CATEGORÍA CON CREACIÓN INLINE -->
            <div class="form-group">
                <div class="form-group-header">
                    <label>Categoría</label>
                    <button type="button" class="btn-inline-toggle" onclick="toggleInlineForm('categoria')">+ Nueva categoría</button>
                </div>
                <select id="f-categoria">${categoriaOptions}</select>
                <div class="inline-form hidden" id="inline-categoria">
                    <input id="if-cat-nombre" placeholder="Ej: Filosofía, Ciencia ficción...">
                    <button type="button" class="btn btn-sm btn-primary" onclick="saveInline('categoria')">Guardar categoría</button>
                </div>
            </div>

            <!-- EDITORIAL CON CREACIÓN INLINE -->
            <div class="form-group">
                <div class="form-group-header">
                    <label>Editorial</label>
                    <button type="button" class="btn-inline-toggle" onclick="toggleInlineForm('editorial')">+ Nueva editorial</button>
                </div>
                <select id="f-editorial">${editorialOptions}</select>
                <div class="inline-form hidden" id="inline-editorial">
                    <input id="if-ed-nombre" placeholder="Nombre de la editorial">
                    <button type="button" class="btn btn-sm btn-primary" onclick="saveInline('editorial')">Guardar editorial</button>
                </div>
            </div>`;
    }
}

// ═══════════════════════════════════════════════════════
// SAVE MODAL
// ═══════════════════════════════════════════════════════
async function saveModal() {
    let body = {};
    const isEdit = modalMode === 'edit';

    try {
        if (modalEntity === 'autor') {
            body = { nombre: document.getElementById('f-nombre').value, apellido: document.getElementById('f-apellido').value };
            await apiFetch(isEdit ? `/autor/${editingId}` : '/autor', { method: isEdit ? 'PUT' : 'POST', body: JSON.stringify(body) });
            showToast(isEdit ? 'Autor actualizado ✓' : 'Autor creado ✓');
            loadAutores();
        }

        if (modalEntity === 'categoria') {
            body = { nombreGenero: document.getElementById('f-nombreGenero').value };
            await apiFetch(isEdit ? `/categoria/${editingId}` : '/categoria', { method: isEdit ? 'PUT' : 'POST', body: JSON.stringify(body) });
            showToast(isEdit ? 'Categoría actualizada ✓' : 'Categoría creada ✓');
            loadCategorias();
        }

        if (modalEntity === 'editorial') {
            body = { nombre: document.getElementById('f-nombre').value };
            await apiFetch(isEdit ? `/editorial/${editingId}` : '/editorial', { method: isEdit ? 'PUT' : 'POST', body: JSON.stringify(body) });
            showToast(isEdit ? 'Editorial actualizada ✓' : 'Editorial creada ✓');
            loadEditoriales();
        }

        if (modalEntity === 'libros') {
            body = {
                titulo:      document.getElementById('f-titulo').value,
                isbn:        document.getElementById('f-isbn').value,
                precio:      parseFloat(document.getElementById('f-precio').value),
                anioEdicion: parseInt(document.getElementById('f-anioEdicion').value),
                image:       document.getElementById('f-image').value,
                autorId:     parseInt(document.getElementById('f-autor').value),
                categoriaId: parseInt(document.getElementById('f-categoria').value),
                editorialId: parseInt(document.getElementById('f-editorial').value)
            };
            await apiFetch(isEdit ? `/libros/${editingId}` : '/libros', { method: isEdit ? 'PUT' : 'POST', body: JSON.stringify(body) });
            showToast(isEdit ? 'Libro actualizado ✓' : 'Libro agregado ✓');
            loadLibros();
        }

        closeModal();
    } catch (e) {
        showToast('Error al guardar', 'error');
    }
}

// ═══════════════════════════════════════════════════════
// QUICK ADD LIBRO (desde dashboard)
// ═══════════════════════════════════════════════════════
async function quickAddLibro() {
    [autoresList, categoriasList, editorialesList] = await Promise.all([
        apiFetch('/autor'), apiFetch('/categoria'), apiFetch('/editorial')
    ]);
    openModal('libros');
}

// ═══════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════
loadDashboard();