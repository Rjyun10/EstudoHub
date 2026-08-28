// js/splash.js
document.addEventListener('DOMContentLoaded', () => {
  const splash = document.getElementById('splash-screen');
  if (!splash) return;

  // Pequeno atraso ultra-rápido (400ms) para dar fluidez visual sem atrasar o usuário
  setTimeout(() => {
    splash.style.opacity = '0';
    splash.style.pointerEvents = 'none'; // Garante que o usuário possa clicar na página enquanto some
    
    // Remove o elemento do DOM logo após o término da animação CSS (300ms)
    setTimeout(() => {
      splash.remove();
    }, 300);
  }, 400);
});