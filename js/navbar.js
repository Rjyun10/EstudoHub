// js/navbar.js

function renderizarNavbar() {
  const path = window.location.pathname;
  const isFeed =
    path.endsWith("index.html") || path.endsWith("/") || path === "";
  const isMural = path.endsWith("mural.html");
  const isSocial = path.endsWith("social.html");
  const isNovaNota = path.endsWith("criar-nota.html");
  const isPerfil = path.endsWith("perfil.html");
  const isCalculadoraMedias = path.endsWith("calculadora-medias.html");
  const isInvestimentos = path.endsWith("investimentos.html");
  const isTimer = path.endsWith("timer.html");

  const campoBuscaDesktopHTML = isFeed
    ? `
    <div class="mx-lg-auto my-2 my-lg-0 style-search-container" style="max-width: 380px; width: 100%;">
      <div class="input-group input-group-sm">
        <span class="input-group-text bg-white border-end-0">🔍</span>
        <input 
          type="text" 
          id="input-busca-nav-desktop" 
          name="busca_nav_desktop"
          class="form-control border-start-0 ps-2" 
          placeholder="Pesquisar matéria, título ou autor..." 
          aria-label="Pesquisar no feed"
          onkeyup="filtrarFeedNav(this.value)"
        >
      </div>
    </div>
  `
    : "";

  const campoBuscaMobileHTML = isFeed
    ? `
    <div class="mx-lg-auto my-2 my-lg-0 style-search-container" style="max-width: 380px; width: 100%;">
      <div class="input-group input-group-sm">
        <span class="input-group-text bg-white border-end-0">🔍</span>
        <input 
          type="text" 
          id="input-busca-header-mobile" 
          name="busca_header_mobile"
          class="form-control border-start-0 ps-2" 
          placeholder="Pesquisar matéria, título ou autor..." 
          aria-label="Pesquisar no feed"
          onkeyup="filtrarFeedNav(this.value)"
        >
      </div>
    </div>
  `
    : "";

  const seletorTemasHTML = `
    <div class="dropdown ms-2 position-relative">
      <button class="btn btn-outline-light btn-sm dropdown-toggle d-flex align-items-center gap-1" type="button" id="dropdownTemas" onclick="toggleTemaDropdown(event, 'menuTemasDesktop')">
        🎨 Temas
      </button>
      <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0 p-2" id="menuTemasDesktop" style="font-size: 0.85rem; min-width: 160px;">
        <li><h6 class="dropdown-header text-uppercase fs-7 fw-bold text-muted px-2 py-1">Escolher Modo</h6></li>
        <li><button class="dropdown-item rounded-2 py-1.5" onclick="mudarTema('')">🔵 Azul Acadêmico</button></li>
        <li><button class="dropdown-item rounded-2 py-1.5" onclick="mudarTema('purple')">🟣 Roxo Tecnológico</button></li>
        <li><button class="dropdown-item rounded-2 py-1.5" onclick="mudarTema('green')">🟢 Verde Foco</button></li>
        <li><button class="dropdown-item rounded-2 py-1.5" onclick="mudarTema('red')">🔴 Vermelho Carmim</button></li>
        <li><button class="dropdown-item rounded-2 py-1.5" onclick="mudarTema('dark')">🌙 Dark Mode</button></li>
        <li><button class="dropdown-item rounded-2 py-1.5" onclick="mudarTema('ocean')">🌊 Oceano Teal</button></li>
        <li><button class="dropdown-item rounded-2 py-1.5" onclick="mudarTema('sunset')">🌅 Pôr do Sol</button></li>
        <li><button class="dropdown-item rounded-2 py-1.5" onclick="mudarTema('amber')">🟡 Âmbar Produtivo</button></li>
        <li><button class="dropdown-item rounded-2 py-1.5" onclick="mudarTema('pink')">🌸 Rosa Pastel</button></li>
        <li><button class="dropdown-item rounded-2 py-1.5" onclick="mudarTema('cyberpunk')">⚡ Cyberpunk</button></li>
      </ul>
    </div>
  `;

  const navbarHTML = `
    <!-- NAV DESKTOP -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm desktop-navbar d-none d-md-block fixed-top" style="z-index: 1030;">
      <div class="container-fluid px-4">
        <a class="navbar-brand fw-bold me-3 text-nowrap" href="index.html">EstudoHub</a>
        
        ${campoBuscaDesktopHTML}

        <div class="navbar-nav ms-auto align-items-center gap-1">
          <a class="nav-link text-nowrap ${isFeed ? "active" : ""}" href="index.html">📱 Feed</a>
          <a class="nav-link text-nowrap ${isMural ? "active" : ""}" href="mural.html">🎉 Mural</a>
          <a class="nav-link text-nowrap ${isSocial ? "active" : ""}" href="social.html">🌐 Comunidade</a>
          <a class="nav-link text-nowrap ${isTimer ? "active" : ""}" href="timer.html">⏱️ Timer</a>
          <a class="nav-link text-nowrap ${isCalculadoraMedias ? "active" : ""}" href="calculadora-medias.html">🔢 Calculadora</a>
          <a class="nav-link text-nowrap ${isInvestimentos ? "active" : ""}" href="investimentos.html">📊 Finanças</a>
          <a class="nav-link text-nowrap ${isNovaNota ? "active" : ""}" href="criar-nota.html">+ Nova Nota</a>
          <a class="nav-link text-nowrap ${isPerfil ? "active" : ""}" href="perfil.html">Perfil</a>
          
          ${seletorTemasHTML}

          <button class="btn btn-outline-light btn-sm text-nowrap ms-2 px-3" onclick="fazerLogout()">Sair</button>
        </div>
      </div>
    </nav>

    <!-- HEADER MOBILE -->
    <header class="d-md-none bg-primary text-white p-3 shadow-sm fixed-top" style="z-index: 1030;">
      <div class="d-flex align-items-center justify-content-between">
        <a class="navbar-brand fw-bold text-white fs-4 m-0" href="index.html">EstudoHub</a>
        
        <div class="d-flex align-items-center gap-2">
          <div class="dropdown position-relative">
            <button class="btn btn-outline-light btn-sm dropdown-toggle" type="button" id="dropdownTemasMobile" onclick="toggleTemaDropdown(event, 'menuTemasMobile')">
              🎨
            </button>
            <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0 p-2" id="menuTemasMobile" style="font-size: 0.85rem; min-width: 150px;">
              <li><h6 class="dropdown-header text-uppercase fs-7 fw-bold text-muted px-2 py-1">Tema</h6></li>
              <li><button class="dropdown-item rounded-2 py-1.5" onclick="mudarTema('')">🔵 Azul</button></li>
              <li><button class="dropdown-item rounded-2 py-1.5" onclick="mudarTema('purple')">🟣 Roxo</button></li>
              <li><button class="dropdown-item rounded-2 py-1.5" onclick="mudarTema('green')">🟢 Verde</button></li>
              <li><button class="dropdown-item rounded-2 py-1.5" onclick="mudarTema('dark')">🌙 Dark</button></li>
              <li><button class="dropdown-item rounded-2 py-1.5" onclick="mudarTema('ocean')">🌊 Oceano</button></li>
              <li><button class="dropdown-item rounded-2 py-1.5" onclick="mudarTema('cyberpunk')">⚡ Cyberpunk</button></li>
            </ul>
          </div>

          <button 
            id="btn-hamburguer-mobile"
            class="btn btn-primary border-0 fs-3 p-0 text-white d-flex align-items-center justify-content-center rounded-3" 
            type="button" 
            style="width: 42px; height: 42px;">
            ☰
          </button>
        </div>
      </div>

      ${isFeed ? `<div class="mt-2">${campoBuscaMobileHTML}</div>` : ""}
    </header>

    <!-- MENU HAMBÚRGUER LATERAL -->
    <div class="offcanvas offcanvas-end d-md-none" tabindex="-1" id="menuHamburguer" aria-labelledby="menuHamburguerLabel">
      <div class="offcanvas-header bg-primary text-white">
        <h5 class="offcanvas-title fw-bold" id="menuHamburguerLabel">EstudoHub</h5>
        <button type="button" class="btn-close btn-close-white" id="btn-fechar-menu" aria-label="Close"></button>
      </div>

      <div class="offcanvas-body d-flex flex-column justify-content-between p-3">
        <div class="list-group list-group-flush">
          <a href="index.html" class="list-group-item list-group-item-action border-0 py-3 rounded-3 ${isFeed ? "fw-bold text-primary bg-light" : ""}">
            📱 Feed
          </a>
          <a href="mural.html" class="list-group-item list-group-item-action border-0 py-3 rounded-3 ${isMural ? "fw-bold text-primary bg-light" : ""}">
            🎉 Mural
          </a>
          <a href="social.html" class="list-group-item list-group-item-action border-0 py-3 rounded-3 ${isSocial ? "fw-bold text-primary bg-light" : ""}">
            🌐 Comunidade
          </a>
          <a href="timer.html" class="list-group-item list-group-item-action border-0 py-3 rounded-3 ${isTimer ? "fw-bold text-primary bg-light" : ""}">
            ⏱️ Timer & Foco
          </a>
          <a href="calculadora-medias.html" class="list-group-item list-group-item-action border-0 py-3 rounded-3 ${isCalculadoraMedias ? "fw-bold text-primary bg-light" : ""}">
            🔢 Calculadora
          </a>
          <a href="investimentos.html" class="list-group-item list-group-item-action border-0 py-3 rounded-3 ${isInvestimentos ? "fw-bold text-primary bg-light" : ""}">
            📊 Finanças
          </a>
          <a href="criar-nota.html" class="list-group-item list-group-item-action border-0 py-3 rounded-3 ${isNovaNota ? "fw-bold text-primary bg-light" : ""}">
            + Nova Nota
          </a>
          <a href="perfil.html" class="list-group-item list-group-item-action border-0 py-3 rounded-3 ${isPerfil ? "fw-bold text-primary bg-light" : ""}">
            👤 Meu Perfil
          </a>
        </div>

        <div class="pt-3 border-top">
          <button class="btn btn-outline-danger w-100 py-2 fw-bold" onclick="fazerLogout()">
            🚪 Sair da Conta
          </button>
        </div>
      </div>
    </div>
  `;

  const headerContainer = document.getElementById("navbar-container");
  if (headerContainer) {
    headerContainer.innerHTML = navbarHTML;
    inicializarEventosMenuMobile();
  }
}

// Função de alternância manual (funciona em qualquer página sem depender do JS do Bootstrap)
function toggleTemaDropdown(event, menuId) {
  event.stopPropagation();
  const menu = document.getElementById(menuId);
  if (!menu) return;

  const estaAberto = menu.classList.contains("show");

  // Fecha qualquer outro dropdown aberto
  document
    .querySelectorAll(".dropdown-menu.show")
    .forEach((m) => m.classList.remove("show"));

  // Alterna o estado do menu clicado
  if (!estaAberto) {
    menu.classList.add("show");
  }
}

// Fecha o menu ao clicar fora dele
document.addEventListener("click", () => {
  document.querySelectorAll(".dropdown-menu.show").forEach((menu) => {
    menu.classList.remove("show");
  });
});

// Função global para trocar de tema e salvar a preferência
function mudarTema(nomeTema) {
  if (nomeTema === "") {
    document.documentElement.removeAttribute("data-theme");
    localStorage.removeItem("estudohub_tema");
  } else {
    document.documentElement.setAttribute("data-theme", nomeTema);
    localStorage.setItem("estudohub_tema", nomeTema);
  }
}

// Aplica o tema salvo assim que o script carregar em qualquer página
(function carregarTemaSalvo() {
  const temaSalvo = localStorage.getItem("estudohub_tema");
  if (temaSalvo) {
    document.documentElement.setAttribute("data-theme", temaSalvo);
  }
})();

function inicializarEventosMenuMobile() {
  const btnMenu = document.getElementById("btn-hamburguer-mobile");
  const btnFechar = document.getElementById("btn-fechar-menu");
  const menuOffcanvas = document.getElementById("menuHamburguer");

  if (!btnMenu || !menuOffcanvas) return;

  let backdrop = document.querySelector(".offcanvas-backdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.className = "offcanvas-backdrop fade";
    backdrop.style.display = "none";
    document.body.appendChild(backdrop);
  }

  function abrirMenu(e) {
    if (e) e.stopPropagation();
    menuOffcanvas.classList.add("show");
    menuOffcanvas.style.visibility = "visible";
    backdrop.style.display = "block";
    setTimeout(() => backdrop.classList.add("show"), 10);
    document.body.style.overflow = "hidden";
  }

  function fecharMenu(e) {
    if (e) e.stopPropagation();
    menuOffcanvas.classList.remove("show");
    backdrop.classList.remove("show");
    document.body.style.overflow = "";
    setTimeout(() => {
      if (!menuOffcanvas.classList.contains("show")) {
        menuOffcanvas.style.visibility = "hidden";
        backdrop.style.display = "none";
      }
    }, 300);
  }

  btnMenu.onclick = abrirMenu;
  if (btnFechar) btnFechar.onclick = fecharMenu;
  backdrop.onclick = fecharMenu;
}

function filtrarFeedNav(valor) {
  if (typeof window.filtrarFeed === "function") {
    window.filtrarFeed(valor);
  }
}

function fazerLogout() {
  localStorage.removeItem("usuario_logado");
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", renderizarNavbar);
