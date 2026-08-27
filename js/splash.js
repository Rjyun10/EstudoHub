// js/splash.js
window.addEventListener('load', () => {
  setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
      splash.style.opacity = '0';
      splash.style.transition = 'opacity 0.5s ease';
      setTimeout(() => splash.remove(), 500);
    }
  }, 1000); // 1 segundo de exibição
});