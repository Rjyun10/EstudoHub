let usuarioAtualId = null;
let idItemParaDeletar = null;

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const {
      data: { user },
    } = await window._supabase.auth.getUser();
    if (user) {
      usuarioAtualId = user.id;
      carregarMediasSalvas();
    } else {
      console.warn("Nenhum usuário logado detectado.");
    }
  } catch (e) {
    console.error("Erro ao buscar sessão:", e);
  }
  gerarCamposNotas();
});

function gerarCamposNotas() {
  const qtd = parseInt(document.getElementById("qtd-notas").value) || 1;
  const container = document.getElementById("container-inputs-notas");
  container.innerHTML = "";

  for (let i = 1; i <= qtd; i++) {
    container.innerHTML += `
            <div class="row g-2 mb-2 align-items-center">
                <div class="col-7">
                    <input type="number" step="0.1" placeholder="Nota ${i}" class="form-control rounded-pill input-nota" id="nota-${i}">
                </div>
                <div class="col-5">
                    <input type="number" step="0.1" placeholder="Peso ${i}" class="form-control rounded-pill input-peso" id="peso-${i}" value="1">
                </div>
            </div>
        `;
  }
}

function calcularMedia() {
  const { mediaFinal, mediaMinima } = processarCalculoMatematico();
  if (mediaFinal === null) return;

  const cardResultado = document.getElementById("resultado-card");
  const textoMedia = document.getElementById("texto-media-final");
  const textoStatus = document.getElementById("texto-status-falta");

  cardResultado.classList.remove("d-none");
  textoMedia.innerText = `Sua Média: ${mediaFinal.toFixed(2)}`;

  if (mediaFinal >= mediaMinima) {
    cardResultado.className =
      "alert alert-success rounded-4 p-3 text-center mt-3";
    textoStatus.innerText = "Parabéns! Você está acima da média mínima 🎉";
  } else {
    cardResultado.className =
      "alert alert-warning rounded-4 p-3 text-center mt-3";
    const falta = mediaMinima - mediaFinal;
    textoStatus.innerText = `Ainda faltam ${falta.toFixed(2)} pontos para atingir a média mínima de ${mediaMinima}.`;
  }

  return { mediaFinal, mediaMinima };
}

function processarCalculoMatematico() {
  const qtd = parseInt(document.getElementById("qtd-notas").value) || 1;
  const mediaMinima =
    parseFloat(document.getElementById("media-minima").value) || 7.0;

  let somaNotasPesos = 0;
  let somaPesos = 0;

  for (let i = 1; i <= qtd; i++) {
    const notaVal = parseFloat(document.getElementById(`nota-${i}`).value) || 0;
    const pesoVal = parseFloat(document.getElementById(`peso-${i}`).value) || 0;

    somaNotasPesos += notaVal * pesoVal;
    somaPesos += pesoVal;
  }

  if (somaPesos === 0) {
    mostrarMensagemFeedback("A soma dos pesos não pode ser zero.", "danger");
    return { mediaFinal: null, mediaMinima: null };
  }

  return { mediaFinal: somaNotasPesos / somaPesos, mediaMinima };
}

// --- SALVAR DIRETO (Sem precisar de PIN) ---
async function solicitarSalvarMedia() {
  if (!usuarioAtualId) {
    mostrarMensagemFeedback(
      "Você precisa estar logado para salvar suas médias.",
      "danger",
    );
    return;
  }
  const materia = document.getElementById("nome-materia-salvar").value.trim();
  if (!materia) {
    mostrarMensagemFeedback(
      "Por favor, digite o nome da matéria antes de salvar.",
      "danger",
    );
    return;
  }

  const dadosCalculo = calcularMedia();
  if (!dadosCalculo || dadosCalculo.mediaFinal === null) return;

  const { mediaFinal, mediaMinima } = dadosCalculo;

  const { error } = await window._supabase.from("medias_salvas").insert([
    {
      user_id: usuarioAtualId,
      materia: materia,
      media: parseFloat(mediaFinal.toFixed(2)),
      media_minima: mediaMinima,
      status: mediaFinal >= mediaMinima ? "Aprovado" : "Abaixo da Meta",
    },
  ]);

  if (error) {
    console.error("Erro ao salvar média:", error);
    mostrarMensagemFeedback("Erro ao salvar: " + error.message, "danger");
  } else {
    mostrarMensagemFeedback("Média salva com sucesso!", "success");
    document.getElementById("nome-materia-salvar").value = "";
    carregarMediasSalvas();
  }
}

async function carregarMediasSalvas() {
  const container = document.getElementById("container-medias-salvas");
  if (!container || !usuarioAtualId) return;

  const { data, error } = await window._supabase
    .from("medias_salvas")
    .select("*")
    .eq("user_id", usuarioAtualId)
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) {
    container.innerHTML = `<div class="text-center text-muted py-3 small">Nenhuma média salva ainda.</div>`;
    return;
  }

  container.innerHTML = data
    .map((item) => {
      // Deixa a primeira letra maiúscula automaticamente
      const nomeFormatado = item.materia
        ? item.materia.charAt(0).toUpperCase() + item.materia.slice(1)
        : "";

      return `
            <div class="col-12" id="media-card-${item.id}">
                <div class="p-3 border border-secondary-subtle rounded-4 bg-light d-flex justify-content-between align-items-center shadow-sm">
                    <div>
                        <h6 class="fw-bold text-dark mb-1">${nomeFormatado}</h6>
                        <span class="badge ${item.media >= item.media_minima ? "bg-success" : "bg-warning text-dark"}">
                            Média: ${item.media} (Meta: ${item.media_minima})
                        </span>
                    </div>
                    <button class="btn btn-outline-danger btn-sm rounded-pill px-3" onclick="abrirModalExclusao('${item.id}')">
                        🗑️ Excluir
                    </button>
                </div>
            </div>
        `;
    })
    .join("");
}

// --- MODAL DE CONFIRMAÇÃO PARA EXCLUIR ---
function abrirModalExclusao(id) {
  idItemParaDeletar = id;
  const modalEl = document.getElementById("modalConfirmarExclusao");
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}

async function confirmarExclusaoMedia() {
  if (!idItemParaDeletar) return;

  const { error } = await window._supabase
    .from("medias_salvas")
    .delete()
    .eq("id", idItemParaDeletar);

  const modalEl = document.getElementById("modalConfirmarExclusao");
  const modal = bootstrap.Modal.getInstance(modalEl);
  if (modal) modal.hide();

  if (error) {
    mostrarMensagemFeedback("Erro ao excluir item.", "danger");
  } else {
    mostrarMensagemFeedback("Média excluída com sucesso!", "success");
    const el = document.getElementById(`media-card-${idItemParaDeletar}`);
    if (el) el.remove();
    idItemParaDeletar = null;
  }
}

function mostrarMensagemFeedback(mensagem, tipo) {
  if (typeof window.mostrarToast === "function") {
    window.mostrarToast(mensagem, tipo);
  } else {
    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert-${tipo === "danger" ? "danger" : "success"} position-fixed top-0 start-50 translate-middle-x mt-3 shadow rounded-pill px-4 py-2 small`;
    alertDiv.style.zIndex = "9999";
    alertDiv.innerText = mensagem;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 3000);
  }
}

// ==========================================
// GERENCIAMENTO DE FUNCIONAMENTO DA CALCULADORA
// ==========================================

let expressaoAtual = "";

window.alternarModoCalculadora = function (modo) {
  const tecladoCientifico = document.getElementById("teclado-cientifico");
  if (!tecladoCientifico) return;

  if (modo === "cientifica") {
    tecladoCientifico.classList.remove("d-none");
  } else {
    tecladoCientifico.classList.add("d-none");
  }
};

window.inserirNum = function (valor) {
  const visor = document.getElementById("calc-visor");
  if (!visor) return;

  if (visor.innerText === "0" && valor !== ".") {
    expressaoAtual = valor;
  } else {
    expressaoAtual += valor;
  }
  window.atualizarVisor(expressaoAtual);
};

window.inserirOp = function (op) {
  if (!expressaoAtual && op !== "-") return;
  expressaoAtual += ` ${op} `;
  window.atualizarVisor(expressaoAtual);
};

window.inserirFuncao = function (fn) {
  if (expressaoAtual === "0") expressaoAtual = "";
  expressaoAtual += `${fn}(`;
  window.atualizarVisor(expressaoAtual);
};

window.inserirPorcentagem = function () {
  if (!expressaoAtual) return;
  expressaoAtual += " / 100";
  window.atualizarVisor(expressaoAtual);
};

window.limparVisor = function () {
  expressaoAtual = "";
  document.getElementById("calc-operacao").innerText = "";
  document.getElementById("calc-visor").innerText = "0";
};

window.apagarDigito = function () {
  expressaoAtual = expressaoAtual.trimEnd().slice(0, -1);
  window.atualizarVisor(expressaoAtual || "0");
};

window.atualizarVisor = function (valor) {
  const visor = document.getElementById("calc-visor");
  if (visor) {
    visor.innerText = valor;
  }
};

window.calcularResultado = function () {
  try {
    document.getElementById("calc-operacao").innerText = expressaoAtual;

    let expr = expressaoAtual;

    // 1. Completa parênteses abertos automaticamente
    const abertos = (expr.match(/\(/g) || []).length;
    const fechados = (expr.match(/\)/g) || []).length;
    if (abertos > fechados) {
      expr += ")".repeat(abertos - fechados);
    }

    // 2. Converte símbolos visuais para lógica JS
    let expressaoTratada = expr
      .replace(/π/g, "Math.PI")
      .replace(/e/g, "Math.E")
      .replace(/sin\((.*?)\)/g, "Math.sin(($1) * Math.PI / 180)")
      .replace(/cos\((.*?)\)/g, "Math.cos(($1) * Math.PI / 180)")
      .replace(/tan\((.*?)\)/g, "Math.tan(($1) * Math.PI / 180)")
      .replace(/sqrt\((.*?)\)/g, "Math.sqrt($1)")
      .replace(/log\((.*?)\)/g, "Math.log10($1)");

    const resultado = Function(`'use strict'; return (${expressaoTratada})`)();

    // Arredonda para evitar dízimas irrelevantes no JS
    const resultadoFormatado = Number.isInteger(resultado)
      ? resultado
      : parseFloat(resultado.toFixed(8));

    expressaoAtual = resultadoFormatado.toString();
    window.atualizarVisor(expressaoAtual);
  } catch (e) {
    document.getElementById("calc-visor").innerText = "Erro";
    expressaoAtual = "";
  }
};
