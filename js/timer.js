// js/timer.js

let loopInterval = null;

document.addEventListener("DOMContentLoaded", () => {
  if (typeof bootstrap !== "undefined") {
    const dropdownElementList = document.querySelectorAll(".dropdown-toggle");
    [...dropdownElementList].map(
      (dropdownToggleEl) => new bootstrap.Dropdown(dropdownToggleEl)
    );
  }

  carregarCalendarioMensal();
  restaurarEstadoTimer();
  
  loopInterval = setInterval(sincronizarTimer, 500);
});

function marcarComoPersonalizado() {
  const selectModo = document.getElementById("timer-modo-preset");
  if (selectModo) {
    selectModo.value = "custom";
  }
  salvarConfiguracaoManual();
}

function salvarConfiguracaoManual() {
  const minEstudo = parseInt(document.getElementById("input-min-estudo")?.value) || 25;
  const minPausa = parseInt(document.getElementById("input-min-pausa")?.value) || 5;

  let estado = obterEstado();
  if (!estado.rodando) {
    estado.duracaoEstudo = minEstudo * 60;
    estado.duracaoPausa = minPausa * 60;
    estado.tempoRestante = estado.modo === "estudo" ? estado.duracaoEstudo : estado.duracaoPausa;
    salvarEstado(estado);
    atualizarDisplayUI(estado);
  }
}

function aplicarPreset() {
  const preset = document.getElementById("timer-modo-preset").value;
  if (preset === "25-5") definirTempos(25, 5);
  else if (preset === "50-10") definirTempos(50, 10);
  else if (preset === "30-10-20") definirTempos(30, 10);
}

function carregarPresetTabela(estudo, pausa, valorPreset) {
  const selectModo = document.getElementById("timer-modo-preset");
  if (selectModo && valorPreset) {
    selectModo.value = valorPreset;
  }
  definirTempos(estudo, pausa);
}

function definirTempos(estudo, pausa) {
  const inputEstudo = document.getElementById("input-min-estudo");
  const inputPausa = document.getElementById("input-min-pausa");

  if (inputEstudo) inputEstudo.value = estudo;
  if (inputPausa) inputPausa.value = pausa;

  let estado = obterEstado();
  estado.rodando = false;
  estado.endTime = null;
  estado.duracaoEstudo = estudo * 60;
  estado.duracaoPausa = pausa * 60;
  estado.tempoRestante = estudo * 60;
  estado.modo = "estudo";

  salvarEstado(estado);
  atualizarDisplayUI(estado);
}

function iniciarTimer() {
  const minEstudo = parseInt(document.getElementById("input-min-estudo")?.value) || 25;
  const minPausa = parseInt(document.getElementById("input-min-pausa")?.value) || 5;

  let estado = obterEstado();
  estado.duracaoEstudo = minEstudo * 60;
  estado.duracaoPausa = minPausa * 60;

  if (!estado.rodando) {
    if (!estado.tempoRestante || estado.tempoRestante <= 0) {
      estado.tempoRestante = estado.modo === "estudo" ? estado.duracaoEstudo : estado.duracaoPausa;
    }
    estado.endTime = Date.now() + (estado.tempoRestante * 1000);
    estado.rodando = true;
    salvarEstado(estado);
  }

  sincronizarTimer();
}

function pausarTimer() {
  let estado = obterEstado();
  if (estado.rodando) {
    let restante = Math.max(0, Math.ceil((estado.endTime - Date.now()) / 1000));
    estado.tempoRestante = restante;
    estado.endTime = null;
    estado.rodando = false;
    salvarEstado(estado); // Salva o tempo congelado no localStorage
  }
  sincronizarTimer();
}

function resetarTimer() {
  const minEstudo = parseInt(document.getElementById("input-min-estudo")?.value) || 25;
  const minPausa = parseInt(document.getElementById("input-min-pausa")?.value) || 5;

  let estado = obterEstado();

  estado.rodando = false;
  estado.endTime = null;
  estado.modo = "estudo";
  estado.duracaoEstudo = minEstudo * 60;
  estado.duracaoPausa = minPausa * 60;
  estado.tempoRestante = minEstudo * 60;

  salvarEstado(estado);
  atualizarDisplayUI(estado);
}

function sincronizarTimer() {
  let estado = obterEstado();

  if (estado.rodando && estado.endTime) {
    let restante = Math.ceil((estado.endTime - Date.now()) / 1000);

    if (restante <= 0) {
      estado.modo = estado.modo === "estudo" ? "pausa" : "estudo";
      let novaDuracao = estado.modo === "estudo" ? estado.duracaoEstudo : estado.duracaoPausa;
      estado.tempoRestante = novaDuracao;
      estado.endTime = Date.now() + novaDuracao * 1000;
      salvarEstado(estado);
    } else {
      estado.tempoRestante = restante;
    }
  }

  atualizarDisplayUI(estado);
}

function atualizarDisplayUI(estado) {
  const minutos = Math.floor(estado.tempoRestante / 60);
  const segundos = estado.tempoRestante % 60;
  const textoTempo = `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;

  const elDisplay = document.getElementById("display-tempo");
  const elFase = document.getElementById("display-fase");
  const btnIniciar = document.getElementById("btn-iniciar");
  const btnPausar = document.getElementById("btn-pausar");

  if (elDisplay) elDisplay.innerText = textoTempo;
  if (elFase) {
    elFase.innerText = estado.modo === "estudo" ? "Fase: Foco 🎯" : "Fase: Pausa / Descanso ☕";
  }

  if (btnIniciar && btnPausar) {
    if (estado.rodando) {
      btnIniciar.classList.add("d-none");
      btnPausar.classList.remove("d-none");
    } else {
      btnIniciar.classList.remove("d-none");
      btnPausar.classList.add("d-none");

      const duracaoTotal = estado.modo === "estudo" ? estado.duracaoEstudo : estado.duracaoPausa;

      // Se o tempo for menor que a duração total da fase, altera para "Continuar"
      if (estado.tempoRestante > 0 && estado.tempoRestante < duracaoTotal) {
        btnIniciar.innerHTML = "▶️ Continuar";
      } else {
        btnIniciar.innerHTML = "▶️ Iniciar";
      }
    }
  }
}

function obterEstado() {
  let e = JSON.parse(localStorage.getItem("estudohub_timer"));
  if (!e) {
    e = {
      rodando: false,
      endTime: null,
      tempoRestante: 25 * 60,
      duracaoEstudo: 25 * 60,
      duracaoPausa: 5 * 60,
      modo: "estudo",
    };
  }
  return e;
}

function salvarEstado(estado) {
  localStorage.setItem("estudohub_timer", JSON.stringify(estado));
}

function restaurarEstadoTimer() {
  let estado = obterEstado();

  const inputEstudo = document.getElementById("input-min-estudo");
  const inputPausa = document.getElementById("input-min-pausa");

  if (inputEstudo) inputEstudo.value = Math.floor(estado.duracaoEstudo / 60);
  if (inputPausa) inputPausa.value = Math.floor(estado.duracaoPausa / 60);

  atualizarDisplayUI(estado);
}

/* CALENDÁRIO MENSAL - COM BOTÃO + E ADIÇÃO GARANTIDA */

let dataAtual = new Date();
let diaSelecionadoChave = "";

const NOMES_MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function capitalizarTexto(texto) {
  if (!texto) return "";
  return texto
    .toLowerCase()
    .split(" ")
    .map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1))
    .join(" ");
}

function carregarCalendarioMensal() {
  const grid = document.getElementById("grid-calendario-mes");
  const tituloMesAno = document.getElementById("cal-titulo-mes-ano");
  if (!grid || !tituloMesAno) return;

  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth();

  tituloMesAno.innerText = `${NOMES_MESES[mes]} de ${ano}`;

  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const totalDiasMes = new Date(ano, mes + 1, 0).getDate();

  const dados = JSON.parse(localStorage.getItem("estudohub_calendario_mensal")) || {};

  grid.innerHTML = "";

  // Espaços vazios antes do primeiro dia
  for (let i = 0; i < primeiroDiaSemana; i++) {
    grid.innerHTML += `<div class="dia-vazio"></div>`;
  }

  // Preenchimento dos dias
  for (let dia = 1; dia <= totalDiasMes; dia++) {
    const chaveData = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    const itensDia = dados[chaveData] || [];

    const hoje = new Date();
    const isHoje = hoje.getDate() === dia && hoje.getMonth() === mes && hoje.getFullYear() === ano;

    const provasCount = itensDia.filter(item => item.tipo === 'prova').length;
    const metasCount = itensDia.filter(item => item.tipo !== 'prova').length;

    let badgesHTML = '';
    if (provasCount > 0) {
      badgesHTML += `<span class="badge bg-danger rounded-pill x-small">🚨 ${provasCount}</span>`;
    }
    if (metasCount > 0) {
      badgesHTML += `<span class="badge bg-primary rounded-pill x-small">📌 ${metasCount}</span>`;
    }

    grid.innerHTML += `
      <div 
        class="dia-card ${isHoje ? 'hoje' : ''}"
        onclick="abrirModalDia('${chaveData}', '${dia} de ${NOMES_MESES[mes]}')"
      >
        <div class="d-flex justify-content-between align-items-center w-100">
          <span class="fw-bold ${isHoje ? 'text-primary' : 'text-dark'} small">${dia}</span>
          <span class="btn-add-icone text-muted fw-bold">+</span>
        </div>
        <div class="text-center mt-auto d-flex justify-content-center flex-wrap gap-1 w-100">
          ${badgesHTML}
        </div>
      </div>
    `;
  }
}

function mudarMes(direcao) {
  dataAtual.setMonth(dataAtual.getMonth() + direcao);
  carregarCalendarioMensal();
}

// Função para fechar o modal
function fecharModalDia() {
  const modalEl = document.getElementById("modalCalendarioDia");
  if (!modalEl) return;

  // Fecha via classe/estilo CSS
  modalEl.classList.remove("show");
  modalEl.style.display = "none";

  // Tenta fechar via instância do Bootstrap (caso esteja carregado)
  if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
  }

  // Remove eventuais backdrops residuais
  const backdrops = document.querySelectorAll('.modal-backdrop');
  backdrops.forEach(backdrop => backdrop.remove());
  document.body.classList.remove('modal-open');
  document.body.style = "";
}

// Atualização da abertura para suportar o fecho correto
function abrirModalDia(chaveData, dataFormatada) {
  diaSelecionadoChave = chaveData;
  const tituloEl = document.getElementById("modalDataTitulo");
  const inputEl = document.getElementById("input-nova-materia-cal");

  if (tituloEl) tituloEl.innerText = dataFormatada;
  if (inputEl) inputEl.value = "";

  renderizarItensModal();

  const modalEl = document.getElementById("modalCalendarioDia");
  if (modalEl) {
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
      modal.show();
    } else {
      modalEl.classList.add("show");
      modalEl.style.display = "block";
    }
  }
}

function renderizarItensModal() {
  const container = document.getElementById("modalListaEstudos");
  if (!container) return;

  const dados = JSON.parse(localStorage.getItem("estudohub_calendario_mensal")) || {};
  const itens = dados[diaSelecionadoChave] || [];

  container.innerHTML = "";

  if (itens.length === 0) {
    container.innerHTML = `<p class="text-muted small text-center my-2">Nenhum evento para este dia.</p>`;
    return;
  }

  itens.forEach((item, index) => {
    const titulo = typeof item === 'object' ? item.titulo : item;
    const tipo = typeof item === 'object' ? item.tipo : 'meta';
    
    const badgeColor = tipo === 'prova' ? 'bg-danger text-white' : 'bg-primary text-white';
    const rotulo = tipo === 'prova' ? '🚨 Prova' : '📌 Meta';

    container.innerHTML += `
      <div class="d-flex justify-content-between align-items-center p-2 bg-light rounded border small">
        <div class="d-flex align-items-center gap-2">
          <span class="badge ${badgeColor}">${rotulo}</span>
          <span class="fw-semibold text-dark">${titulo}</span>
        </div>
        <button type="button" class="btn btn-sm text-danger p-0 border-0 fs-6" onclick="removerEstudoCalendario(${index})">🗑️</button>
      </div>
    `;
  });
}

function salvarEstudoCalendario(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  const input = document.getElementById("input-nova-materia-cal");
  const selectTipo = document.getElementById("select-tipo-item");
  
  if (!input || !selectTipo) return;

  const valor = capitalizarTexto(input.value.trim());
  const tipo = selectTipo.value;

  if (valor && diaSelecionadoChave) {
    const dados = JSON.parse(localStorage.getItem("estudohub_calendario_mensal")) || {};
    
    if (!dados[diaSelecionadoChave]) {
      dados[diaSelecionadoChave] = [];
    }

    dados[diaSelecionadoChave].push({
      titulo: valor,
      tipo: tipo
    });

    localStorage.setItem("estudohub_calendario_mensal", JSON.stringify(dados));

    input.value = "";
    renderizarItensModal();
    carregarCalendarioMensal();
  }
}

function removerEstudoCalendario(index) {
  const dados = JSON.parse(localStorage.getItem("estudohub_calendario_mensal")) || {};
  if (dados[diaSelecionadoChave]) {
    dados[diaSelecionadoChave].splice(index, 1);
    localStorage.setItem("estudohub_calendario_mensal", JSON.stringify(dados));
    renderizarItensModal();
    carregarCalendarioMensal();
  }
}

document.addEventListener("DOMContentLoaded", carregarCalendarioMensal);

// Abre/Fecha o menu ao clicar no botão
function toggleDropdownTimer(event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById("menuDropdownTimer");
  const chevron = document.getElementById("dropdownChevron");

  if (menu) {
    const estaFechado = menu.classList.contains("d-none");
    if (estaFechado) {
      menu.classList.remove("d-none");
      if (chevron) chevron.classList.add("rodado");
    } else {
      fecharDropdownTimer();
    }
  }
}

function fecharDropdownTimer() {
  const menu = document.getElementById("menuDropdownTimer");
  const chevron = document.getElementById("dropdownChevron");
  if (menu) menu.classList.add("d-none");
  if (chevron) chevron.classList.remove("rodado");
}

// Fecha o menu se o usuário clicar fora dele
document.addEventListener("click", (event) => {
  const wrapper = document.querySelector(".custom-dropdown-wrapper");
  if (wrapper && !wrapper.contains(event.target)) {
    fecharDropdownTimer();
  }
});

// Executa ao selecionar um item
function selecionarPresetDropdown(valor, texto) {
  const inputPreset = document.getElementById("timer-modo-preset");
  const labelPreset = document.getElementById("label-modo-selecionado");

  if (inputPreset) inputPreset.value = valor;
  if (labelPreset) labelPreset.innerText = texto;

  fecharDropdownTimer();

  if (valor === "25-5") definirTempos(25, 5);
  else if (valor === "50-10") definirTempos(50, 10);
  else if (valor === "30-10-20") definirTempos(30, 10);
  else if (valor === "custom") {
    salvarConfiguracaoManual();
  }
}

// Muda para "Personalizado" se o usuário alterar os campos de tempo manualmente
function marcarComoPersonalizado() {
  const inputPreset = document.getElementById("timer-modo-preset");
  const labelPreset = document.getElementById("label-modo-selecionado");

  if (inputPreset) inputPreset.value = "custom";
  if (labelPreset) labelPreset.innerText = "Personalizado";

  salvarConfiguracaoManual();
}
// Atualiza a seleção vinda da tabela
function carregarPresetTabela(estudo, pausa, valorPreset, textoPreset) {
  const inputPreset = document.getElementById("timer-modo-preset");
  const labelPreset = document.getElementById("label-modo-selecionado");

  if (inputPreset) inputPreset.value = valorPreset;
  if (labelPreset) labelPreset.innerText = textoPreset;

  definirTempos(estudo, pausa);
}

// Atualiza a seleção vinda do dropdown customizado
function selecionarPresetDropdown(valor, texto) {
  const inputPreset = document.getElementById("timer-modo-preset");
  const labelPreset = document.getElementById("label-modo-selecionado");

  if (inputPreset) inputPreset.value = valor;
  if (labelPreset) labelPreset.innerText = texto;

  fecharDropdownTimer();

  if (valor === "25-5") definirTempos(25, 5);
  else if (valor === "50-10") definirTempos(50, 10);
  else if (valor === "30-10-20") definirTempos(30, 10);
  else if (valor === "custom") {
    salvarConfiguracaoManual();
  }
}
document.addEventListener("DOMContentLoaded", () => {
  const btnDropdown = document.getElementById("dropdownTimerBtn");
  const dropdownMenu = document.getElementById("customDropdownMenu");

  if (btnDropdown && dropdownMenu) {
    // Função para alternar a visibilidade do menu
    function alternarMenu(e) {
      e.preventDefault();
      e.stopPropagation();

      const estaAberto = dropdownMenu.classList.contains("show");

      if (estaAberto) {
        dropdownMenu.classList.remove("show");
        btnDropdown.setAttribute("aria-expanded", "false");
      } else {
        dropdownMenu.classList.add("show");
        btnDropdown.setAttribute("aria-expanded", "true");
      }
    }

    // Suporta toque (mobile) e clique (desktop)
    btnDropdown.addEventListener("pointerdown", alternarMenu);

    // Fecha o menu ao clicar fora dele
    document.addEventListener("pointerdown", (e) => {
      if (!btnDropdown.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.classList.remove("show");
        btnDropdown.setAttribute("aria-expanded", "false");
      }
    });
  }
});
