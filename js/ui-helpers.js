// js/ui-helpers.js

window.mostrarToast = function (mensagem, tipo = "success") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container position-fixed bottom-0 start-0 p-3";
    container.style.zIndex = "1100";
    document.body.appendChild(container);
  }

  const toastId = "toast-" + Date.now();
  const bgClass = tipo === "success" ? "bg-success" : "bg-danger";

  const toastHTML = `
    <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0 show shadow-lg" role="alert">
      <div class="d-flex">
        <div class="toast-body fw-bold">${mensagem}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>
  `;

  container.insertAdjacentHTML("beforeend", toastHTML);

  setTimeout(() => {
    document.getElementById(toastId)?.remove();
  }, 4000);
};
function selecionarOpcaoFeedback(valor, texto, elemento) {
  // Atualiza o input oculto
  const inputOculto = document.getElementById("feedback-tipo");
  if (inputOculto) {
    inputOculto.value = valor;
  }

  // Atualiza o texto exibido no botão
  const labelBtn = document.getElementById("feedback-tipo-label");
  if (labelBtn) {
    labelBtn.innerText = texto;
  }

  // Atualiza a marcação visual da opção selecionada
  const itens = elemento.closest(".dropdown-menu").querySelectorAll(".dropdown-item");
  itens.forEach((item) => item.classList.remove("active"));
  elemento.classList.add("active");
}