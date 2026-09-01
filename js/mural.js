// js/mural.js

let idParaExcluir = null;
let userIdAtualGlobal = null;

function formatarPrimeiraMaiuscula(texto) {
  if (!texto) return "";
  return texto
    .trim()
    .toLowerCase()
    .replace(/(^\w|\s\w)/g, (letra) => letra.toUpperCase());
}

// Função para exibir Toast personalizado
function exibirToast(mensagem, tipo = 'success') {
  const toastEl = document.getElementById('toast-notificacao');
  const toastBody = document.getElementById('toast-mensagem');
  if (!toastEl || !toastBody) return;

  toastBody.innerText = mensagem;
  
  toastEl.className = `toast align-items-center text-white border-0 rounded-3 shadow bg-${tipo === 'success' ? 'success' : 'danger'}`;

  const bsToast = new bootstrap.Toast(toastEl, { delay: 3000 });
  bsToast.show();
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = await window.verificarSessao();
  if (!user) return;

  userIdAtualGlobal = user.id;
  carregarMural(user.id);

  // Controle manual e seguro do Dropdown de Conquistas
  const btnConquista = document.getElementById("dropdownMenuTipo");
  if (btnConquista) {
    const dropdownConquistaInstance = new bootstrap.Dropdown(btnConquista);
    btnConquista.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownConquistaInstance.toggle();
    });
  }

  // Controle manual e seguro do Dropdown de Feedback
  const btnFeedback = document.getElementById("dropdownFeedbackBtn");
  if (btnFeedback) {
    const dropdownFeedbackInstance = new bootstrap.Dropdown(btnFeedback);
    btnFeedback.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownFeedbackInstance.toggle();
    });
  }

  // Escutador dos itens do Dropdown de Categoria (Conquistas)
  document.querySelectorAll(".item-categoria").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const valor = item.getAttribute("data-valor");
      document.getElementById("mural-tipo").value = valor;
      document.getElementById("labelTipoSelecionado").innerText = valor;

      const containerOutra = document.getElementById("container-outra-vitoria");
      const inputOutra = document.getElementById("mural-outra-vitoria");

      if (valor === "Outra Vitória") {
        containerOutra.classList.remove("d-none");
        inputOutra.setAttribute("required", "true");
      } else {
        containerOutra.classList.add("d-none");
        inputOutra.removeAttribute("required");
        inputOutra.value = "";
      }
    });
  });

  // Escutador dos itens do Dropdown de Feedback
  document.querySelectorAll(".item-feedback").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const valor = item.getAttribute("data-valor");
      const label = item.getAttribute("data-label");
      
      document.getElementById("fb-tipo").value = valor;
      document.getElementById("feedback-tipo-label").innerText = label;
    });
  });

  const formMural = document.getElementById("form-mural");
  if (formMural) {
    formMural.addEventListener("submit", (e) => criarPostagem(e, user));
  }

  const btnConfirmar = document.getElementById("btn-confirmar-exclusao");
  if (btnConfirmar) {
    btnConfirmar.addEventListener("click", executarExclusao);
  }
});

// Carrega as postagens do banco
async function carregarMural(userIdAtual) {
  const feed = document.getElementById("mural-feed");
  if (!feed) return;

  try {
    const { data: posts, error } = await window._supabase
      .from("mural_postagens")
      .select(`
        *,
        profiles (nome),
        mural_curtidas (user_id)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    feed.innerHTML = "";

    if (!posts || posts.length === 0) {
      feed.innerHTML = `
        <div class="card border border-secondary-subtle shadow-sm p-4 text-center text-muted rounded-4">
          <p class="m-0">Nenhuma conquista publicada ainda. Seja o primeiro a comemorar!</p>
        </div>`;
      return;
    }

    posts.forEach((post) => {
      const curtidas = post.mural_curtidas || [];
      const totalCurtidas = curtidas.length;
      const curtiu = curtidas.some((c) => c.user_id === userIdAtual);
      const nomeAutor = post.profiles?.nome || "Estudante";
      const ehMeuPost = post.user_id === userIdAtual;

      const botaoExcluirHTML = ehMeuPost
        ? `<button class="btn btn-link text-danger p-0 ms-2" title="Excluir Conquista" onclick="solicitarExclusao('${post.id}')">
            <i class="bi bi-trash"></i>
           </button>`
        : "";

      feed.innerHTML += `
        <div class="card border border-secondary-subtle shadow-sm rounded-4 mb-3">
          <div class="card-body p-4">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="badge bg-primary-subtle text-primary fw-bold px-3 py-2 rounded-pill">${post.tipo_conquista}</span>
              <div class="d-flex align-items-center">
                <small class="text-muted">${new Date(post.created_at).toLocaleDateString("pt-BR")}</small>
                ${botaoExcluirHTML}
              </div>
            </div>
            <h5 class="fw-bold text-dark mb-1">${post.titulo}</h5>
            
            <p class="text-secondary small mb-3">
              Por <a href="perfil-publico.html?id=${post.user_id}" class="text-decoration-none fw-bold text-primary">${nomeAutor}</a>
            </p>
            
            <p class="card-text text-dark">${post.mensagem}</p>
            <hr class="my-3 opacity-25">
            <button 
              class="btn btn-sm ${curtiu ? 'btn-danger' : 'btn-outline-danger'} rounded-pill px-3"
              onclick="alternarCurtida('${post.id}', '${userIdAtual}', ${curtiu})"
            >
              ${curtiu ? '❤️' : '<span style="opacity: 0.5; filter: grayscale(100%);">❤️</span>'} 
              ${totalCurtidas} Parabéns
            </button>
          </div>
        </div>
      `;
    });
  } catch (err) {
    console.error("Erro ao carregar mural:", err);
    feed.innerHTML = `
      <div class="alert alert-danger rounded-4 p-3" role="alert">
        Erro ao carregar conquistas do mural.
      </div>`;
  }
}

// Criar nova postagem
async function criarPostagem(e, user) {
  e.preventDefault();

  let tituloRaw = document.getElementById("mural-titulo").value;
  let tipoCategoria = document.getElementById("mural-tipo").value;
  let mensagemRaw = document.getElementById("mural-mensagem").value;

  if (tipoCategoria === "Outra Vitória") {
    const outraEspecificada = document.getElementById("mural-outra-vitoria").value;
    if (outraEspecificada.trim() !== "") {
      tipoCategoria = formatarPrimeiraMaiuscula(outraEspecificada);
    }
  }

  const titulo = formatarPrimeiraMaiuscula(tituloRaw);
  const mensagem = mensagemRaw.trim().charAt(0).toUpperCase() + mensagemRaw.trim().slice(1);

  try {
    const { error } = await window._supabase.from("mural_postagens").insert([
      {
        user_id: user.id,
        titulo: titulo,
        tipo_conquista: tipoCategoria,
        mensagem: mensagem
      }
    ]);

    if (error) throw error;

    const modalEl = document.getElementById("modalNovaConquista");
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    document.getElementById("form-mural").reset();
    document.getElementById("container-outra-vitoria").classList.add("d-none");
    document.getElementById("labelTipoSelecionado").innerText = "Vestibular / ENEM";
    document.getElementById("mural-tipo").value = "Vestibular / ENEM";

    exibirToast("Conquista publicada com sucesso!", "success");
    carregarMural(user.id);
  } catch (err) {
    console.error("Erro ao publicar:", err);
    exibirToast("Erro ao publicar conquista.", "danger");
  }
}

// Abre o modal de confirmação
function solicitarExclusao(postId) {
  idParaExcluir = postId;
  const modalEl = document.getElementById("modalConfirmarExclusao");
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}

// Confirma e executa a exclusão
async function executarExclusao() {
  if (!idParaExcluir || !userIdAtualGlobal) return;

  try {
    const { error } = await window._supabase
      .from("mural_postagens")
      .delete()
      .eq("id", idParaExcluir)
      .eq("user_id", userIdAtualGlobal);

    if (error) throw error;

    const modalEl = document.getElementById("modalConfirmarExclusao");
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    exibirToast("Conquista excluída com sucesso!", "success");
    carregarMural(userIdAtualGlobal);
  } catch (err) {
    console.error("Erro ao excluir conquista:", err);
    exibirToast("Erro ao excluir a conquista.", "danger");
  } finally {
    idParaExcluir = null;
  }
}

// Alternar curtida
async function alternarCurtida(postId, userId, jaCurtiu) {
  try {
    if (jaCurtiu) {
      await window._supabase
        .from("mural_curtidas")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);
    } else {
      await window._supabase
        .from("mural_curtidas")
        .insert([{ post_id: postId, user_id: userId }]);
    }
    carregarMural(userId);
  } catch (err) {
    console.error("Erro ao alternar curtida:", err);
  }
}

// ==========================================
// 3. ENVIAR FEEDBACK
// ==========================================

window.enviarFeedback = async function () {
  const tipo = document.getElementById("fb-tipo").value;
  const mensagemInput = document.getElementById("fb-texto").value;
  
  if (!mensagemInput || !mensagemInput.trim()) {
    if (typeof window.mostrarToast === "function") {
      window.mostrarToast("Digite sua mensagem antes de enviar.", "danger");
    } else {
      alert("Digite sua mensagem antes de enviar.");
    }
    return;
  }

  const mensagem = formatarPrimeiraMaiuscula(mensagemInput);

  try {
    const {
      data: { user },
    } = await window._supabase.auth.getUser();

    const { error } = await window._supabase.from("feedbacks").insert([
      {
        user_id: user ? user.id : null,
        tipo: tipo,
        mensagem: mensagem,
      },
    ]);

    if (error) throw error;

    if (typeof window.mostrarToast === "function") {
      window.mostrarToast("Obrigado pelo seu feedback!", "success");
    } else {
      alert("Obrigado pelo seu feedback!");
    }

    document.getElementById("fb-texto").value = "";

    const modalEl = document.getElementById("feedbackModal");
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
  } catch (err) {
    if (typeof window.mostrarToast === "function") {
      window.mostrarToast("Erro ao enviar feedback: " + err.message, "danger");
    } else {
      alert("Erro ao enviar feedback: " + err.message);
    }
  }
};