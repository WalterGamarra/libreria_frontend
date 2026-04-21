// ═══════════════════════════════════════════════════════
// auth.js — funciones compartidas de autenticación
// Incluir en: login.html y admin-panel.html
// ═══════════════════════════════════════════════════════

function getToken() {
  return localStorage.getItem('jwt_token');
}

function getUsername() {
  return localStorage.getItem('jwt_username');
}

function logout() {
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('jwt_username');
  window.location.href = 'login.html';
}

function checkAuth() {
  if (!getToken()) {
    window.location.href = 'login.html';
  }
}