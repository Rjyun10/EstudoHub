document.addEventListener("DOMContentLoaded", () => {
  // Ativa a aba correta caso haja uma hash na URL (#privacidade, #cookies, etc.)
  const hash = window.location.hash;
  if (hash) {
    const tabTrigger = document.querySelector(`button[data-bs-target="${hash}-pane"]`);
    if (tabTrigger) {
      const tab = new bootstrap.Tab(tabTrigger);
      tab.show();
    }
  }
});