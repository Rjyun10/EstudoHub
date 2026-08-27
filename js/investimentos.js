let chartSimInstancia = null;
let chartMetaInstancia = null;

// Tabela dinâmica de Ativos / Renda Fixa
const dadosRendaFixa = [
  {
    nome: "Tesouro Selic 2029",
    categoria: "Tesouro Direto",
    taxa: "Selic + 0,05%",
    ir: "Não",
  },
  {
    nome: "CDB Banco Sofisa 110% CDI",
    categoria: "CDB",
    taxa: "11,55% a.a.",
    ir: "Não",
  },
  {
    nome: "LCA Banco do Brasil",
    categoria: "LCA",
    taxa: "9,20% a.a.",
    ir: "SIM",
  },
  {
    nome: "LCI Caixa Econômica",
    categoria: "LCI",
    taxa: "9,10% a.a.",
    ir: "SIM",
  },
  {
    nome: "Tesouro IPCA+ 2035",
    categoria: "Tesouro Direto",
    taxa: "IPCA + 6,15%",
    ir: "Não",
  },
];

document.addEventListener("DOMContentLoaded", () => {
  carregarTabelaTaxas();
  calcularSimulador();
  calcularMeta();
});

// FUNÇÃO PARA ALTERNAR DROPDOWN CUSTOMIZADO
function selecionarOpcao(btnId, valor, rotulo) {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  // Atualiza o texto e o atributo data-value do botão
  btn.innerText = rotulo;
  btn.setAttribute("data-value", valor);

  // Destaca a opção selecionada no menu
  const menu = btn.nextElementSibling;
  if (menu) {
    menu.querySelectorAll(".dropdown-item").forEach((item) => {
      if (item.innerText.trim() === rotulo) {
        item.classList.add("active-custom");
      } else {
        item.classList.remove("active-custom");
      }
    });
  }

  // Recalcula os dados e atualiza o gráfico correspondente
  if (btnId === "sim-tipo-btn") {
    calcularSimulador();
  } else if (btnId === "meta-tipo-btn") {
    calcularMeta();
  }
}

// ABA 1: TESTADOR DE INVESTIMENTOS
function calcularSimulador() {
  const init = parseFloat(document.getElementById("sim-inicial").value) || 0;
  const aporte = parseFloat(document.getElementById("sim-aporte").value) || 0;
  const tempo = parseInt(document.getElementById("sim-tempo").value) || 1;

  // Pega se é 'anos' ou 'meses' do botão customizado
  const btnTipo = document.getElementById("sim-tipo-btn");
  const tipoTempo = btnTipo
    ? btnTipo.getAttribute("data-value") || "anos"
    : "anos";
  const taxaAnual = parseFloat(document.getElementById("sim-taxa").value) || 0;

  const meses = tipoTempo === "anos" ? tempo * 12 : tempo;
  const taxaMensal = Math.pow(1 + taxaAnual / 100, 1 / 12) - 1;

  let totalAcumulado = init;
  let totalInvestido = init;
  let labels = [];
  let dataInvestido = [];
  let dataTotal = [];

  for (let m = 1; m <= meses; m++) {
    totalAcumulado = (totalAcumulado + aporte) * (1 + taxaMensal);
    totalInvestido += aporte;

    if (tipoTempo === "anos" && meses > 24) {
      if (m % 12 === 0 || m === meses) {
        labels.push(`Ano ${Math.ceil(m / 12)}`);
        dataInvestido.push(totalInvestido.toFixed(2));
        dataTotal.push(totalAcumulado.toFixed(2));
      }
    } else {
      labels.push(`Mês ${m}`);
      dataInvestido.push(totalInvestido.toFixed(2));
      dataTotal.push(totalAcumulado.toFixed(2));
    }
  }

  const rendimento = totalAcumulado - totalInvestido;
  const impostoRenda = rendimento * 0.15;
  const totalLiquido = totalAcumulado - impostoRenda;

  document.getElementById("res-investido").innerText =
    `R$ ${totalInvestido.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  document.getElementById("res-bruto").innerText =
    `R$ ${totalAcumulado.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  document.getElementById("res-liquido").innerText =
    `R$ ${totalLiquido.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  renderGraficoSimulador(labels, dataInvestido, dataTotal);
}

function renderGraficoSimulador(labels, dataInvestido, dataTotal) {
  const ctx = document.getElementById("chartSimulador").getContext("2d");
  if (chartSimInstancia) chartSimInstancia.destroy();

  chartSimInstancia = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Valor Bruto (R$)",
          data: dataTotal,
          borderColor: "#0d6efd",
          backgroundColor: "rgba(13, 110, 253, 0.1)",
          fill: true,
          tension: 0.3,
        },
        {
          label: "Total Investido (R$)",
          data: dataInvestido,
          borderColor: "#6c757d",
          borderDash: [5, 5],
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "top" } },
    },
  });
}

// ABA 2: METAS DE RENDA
function calcularMeta() {
  const meta = parseFloat(document.getElementById("meta-valor").value) || 0;
  const tempo = parseInt(document.getElementById("meta-tempo").value) || 1;

  // Pega se é 'anos' ou 'meses' do botão customizado
  const btnTipo = document.getElementById("meta-tipo-btn");
  const tipoTempo = btnTipo
    ? btnTipo.getAttribute("data-value") || "anos"
    : "anos";

  const meses = tipoTempo === "anos" ? tempo * 12 : tempo;
  const taxaAnual = 0.1;
  const i = Math.pow(1 + taxaAnual, 1 / 12) - 1;

  const aporteMensal = meta * (i / (Math.pow(1 + i, meses) - 1));

  document.getElementById("res-aporte-meta").innerText =
    `R$ ${aporteMensal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / mês`;

  let labels = [];
  let dataProgresso = [];
  let acumulado = 0;

  for (let m = 1; m <= meses; m++) {
    acumulado = (acumulado + aporteMensal) * (1 + i);

    if (tipoTempo === "anos" && meses > 24) {
      if (m % 12 === 0 || m === meses) {
        labels.push(`Ano ${Math.ceil(m / 12)}`);
        dataProgresso.push(acumulado.toFixed(2));
      }
    } else {
      labels.push(`Mês ${m}`);
      dataProgresso.push(acumulado.toFixed(2));
    }
  }

  renderGraficoMeta(labels, dataProgresso);
}

function renderGraficoMeta(labels, dataProgresso) {
  const ctx = document.getElementById("chartMeta").getContext("2d");
  if (chartMetaInstancia) chartMetaInstancia.destroy();

  chartMetaInstancia = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Meta Acumulada (R$)",
          data: dataProgresso,
          borderColor: "#198754",
          backgroundColor: "rgba(25, 135, 84, 0.15)",
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top" },
      },
    },
  });
}

// ABA 3: TABELA DE TAXAS
function carregarTabelaTaxas() {
  const tbody = document.getElementById("tabela-taxas");
  if (!tbody) return;
  tbody.innerHTML = "";

  dadosRendaFixa.forEach((item) => {
    const isIsento = item.ir === "SIM";
    tbody.innerHTML += `
      <tr>
        <td class="fw-bold text-dark">${item.nome}</td>
        <td><span class="badge bg-light text-dark border">${item.categoria}</span></td>
        <td class="text-success fw-bold">${item.taxa}</td>
        <td>
          <span class="badge ${isIsento ? "bg-success-subtle text-success" : "bg-secondary-subtle text-secondary"} border">
            ${isIsento ? "Sim" : "Não"}
          </span>
        </td>
      </tr>
    `;
  });
}
