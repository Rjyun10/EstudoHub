// js/widget-timer.js

function renderizarWidgetFlutuante() {
  if (document.getElementById("widget-timer-flutuante")) return;

  const widgetHTML = `
    <div id="widget-timer-flutuante" class="d-none">
      <div class="widget-header" id="widget-timer-header">
        <span>✋ Arraste aqui</span>
        <span>⏱️ Timer</span>
      </div>
      <div class="widget-body">
        <div>
          <span id="widget-fase-txt" class="widget-badge">Foco 🎯</span>
          <div id="widget-tempo-txt" class="widget-tempo">00:00</div>
        </div>
        <a href="timer.html" class="widget-btn-abrir">Abrir</a>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", widgetHTML);
  restaurarPosicaoWidget();
  tornarWidgetArrastavel();
}

// Carrega a posição salva no localStorage ao abrir a página
function restaurarPosicaoWidget() {
  const widget = document.getElementById("widget-timer-flutuante");
  const posicaoSalva = localStorage.getItem("estudohub_widget_posicao");

  if (widget && posicaoSalva) {
    try {
      const { top, left } = JSON.parse(posicaoSalva);

      // Garante que o elemento fique dentro dos limites da tela atual
      const maxTop = window.innerHeight - 80;
      const maxLeft = window.innerWidth - 120;

      const topAjustado = Math.max(10, Math.min(top, maxTop));
      const leftAjustado = Math.max(10, Math.min(left, maxLeft));

      widget.style.position = "fixed";
      widget.style.top = `${topAjustado}px`;
      widget.style.left = `${leftAjustado}px`;
      widget.style.bottom = "auto";
      widget.style.right = "auto";
    } catch (e) {
      console.error("Erro ao carregar posição do widget:", e);
    }
  }
}

// Salva as coordenadas X e Y atuais no localStorage
function salvarPosicaoWidget(widget) {
  if (!widget) return;
  const rect = widget.getBoundingClientRect();
  const posicao = {
    top: rect.top,
    left: rect.left,
  };
  localStorage.setItem("estudohub_widget_posicao", JSON.stringify(posicao));
}

function monitorarTimerGlobal() {
  renderizarWidgetFlutuante();

  setInterval(() => {
    let estado = JSON.parse(localStorage.getItem("estudohub_timer"));
    let widgetEl = document.getElementById("widget-timer-flutuante");

    if (estado && widgetEl) {
      let isPaginaTimer = window.location.pathname.endsWith("timer.html");

      if (estado.rodando && !isPaginaTimer) {
        widgetEl.classList.remove("d-none");

        let restante = estado.tempoRestante;
        if (estado.endTime) {
          restante = Math.max(
            0,
            Math.ceil((estado.endTime - Date.now()) / 1000),
          );
        }

        let min = Math.floor(restante / 60);
        let seg = restante % 60;

        const elTempo = document.getElementById("widget-tempo-txt");
        const elFase = document.getElementById("widget-fase-txt");

        if (elTempo)
          elTempo.innerText = `${String(min).padStart(2, "0")}:${String(seg).padStart(2, "0")}`;
        if (elFase)
          elFase.innerText = estado.modo === "estudo" ? "Foco 🎯" : "Pausa ☕";
      } else {
        widgetEl.classList.add("d-none");
      }
    }
  }, 500);
}

// Suporte completo a Mouse e Touch Screen
function tornarWidgetArrastavel() {
  const widget = document.getElementById("widget-timer-flutuante");
  const header = document.getElementById("widget-timer-header");

  if (!widget || !header) return;

  let posInicialX = 0,
    posInicialY = 0;

  // Iniciar Arraste (Mouse)
  header.addEventListener("mousedown", (e) => {
    iniciarArrasto(e.clientX, e.clientY);
    document.onmousemove = (e) => moverWidget(e.clientX, e.clientY);
    document.onmouseup = finalizarArrasto;
  });

  // Iniciar Arraste (Touch / Mobile)
  header.addEventListener(
    "touchstart",
    (e) => {
      const toque = e.touches[0];
      iniciarArrasto(toque.clientX, toque.clientY);

      document.ontouchmove = (e) => {
        const toqueMove = e.touches[0];
        moverWidget(toqueMove.clientX, toqueMove.clientY);
      };
      document.ontouchend = finalizarArrasto;
    },
    { passive: true },
  );

  function iniciarArrasto(clientX, clientY) {
    const rect = widget.getBoundingClientRect();
    widget.style.top = `${rect.top}px`;
    widget.style.left = `${rect.left}px`;
    widget.style.bottom = "auto";
    widget.style.right = "auto";

    posInicialX = clientX;
    posInicialY = clientY;
  }

  function moverWidget(clientX, clientY) {
    let diffX = posInicialX - clientX;
    let diffY = posInicialY - clientY;

    posInicialX = clientX;
    posInicialY = clientY;

    let novoTop = widget.offsetTop - diffY;
    let novoLeft = widget.offsetLeft - diffX;

    // Limites da viewport
    let maxTop = window.innerHeight - widget.offsetHeight;
    let maxLeft = window.innerWidth - widget.offsetWidth;

    widget.style.top = `${Math.max(10, Math.min(novoTop, maxTop - 10))}px`;
    widget.style.left = `${Math.max(10, Math.min(novoLeft, maxLeft - 10))}px`;
  }

  function finalizarArrasto() {
    document.onmousemove = null;
    document.onmouseup = null;
    document.ontouchmove = null;
    document.ontouchend = null;

    // Persiste as coordenadas no navegador ao terminar o movimento
    salvarPosicaoWidget(widget);
  }
}

document.addEventListener("DOMContentLoaded", monitorarTimerGlobal);