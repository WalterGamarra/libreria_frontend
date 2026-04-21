// login.js

const API_AUTH = 'https://libreria-production-8cc8.up.railway.app';

// Si ya hay token válido, saltar directo al panel
if (getToken()) {
  window.location.href = 'admin-panel.html';
}

async function doLogin() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const btn      = document.getElementById('btn-login');

  showError('');

  if (!username || !password) {
    showError('Completá usuario y contraseña.');
    return;
  }

  btn.textContent = 'Ingresando...';
  btn.disabled    = true;

  try {
    const res = await fetch(API_AUTH, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username, password })
    });

    if (res.status === 401) throw new Error('Usuario o contraseña incorrectos.');
    if (!res.ok)            throw new Error('Error del servidor. Intentá de nuevo.');

    const data = await res.json();

    localStorage.setItem('jwt_token',    data.jwt);
    localStorage.setItem('jwt_username', data.username);

    window.location.href = 'admin-panel.html';

  } catch (e) {
    showError(e.message || 'No se pudo conectar con el servidor.');
    btn.textContent = 'Ingresar';
    btn.disabled    = false;
  }
}

function showError(msg) {
  const box = document.getElementById('error-box');
  if (!msg) {
    box.style.display = 'none';
    return;
  }
  box.textContent     = msg;
  box.style.display   = 'block';
  box.style.animation = 'none';
  box.offsetHeight;
  box.style.animation = '';
}

document.getElementById('btn-login').addEventListener('click', doLogin);
document.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });