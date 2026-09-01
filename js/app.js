// js/app.js

window.todasAsNotas = [];
window.todosOsPerfis = [];
window.meusLikes = new Set();
window.meusFavoritos = new Set();
window.notaComentariosId = null;

// ==========================================
// TRATAMENTO GLOBAL DE DROPDOWNS E MODAIS
// ==========================================
document.addEventListener("click", (e) => {
  const btnDropdown = e.target.closest(".dropdown-toggle, #dropdownFeedbackBtn, #dropdownMenuTipo");
  if (btnDropdown) {
    e.preventDefault();
    e.stopPropagation();
    
    const dropdownContainer = btnDropdown.closest(".dropdown");
    const menu = dropdownContainer ? dropdownContainer.querySelector(".dropdown-menu") : null;
    
    if (menu) {
      document.querySelectorAll(".dropdown-menu.show").forEach((m) => {
        if (m !== menu) m.classList.remove("show");
      });
      
      menu.classList.toggle("show");
      btnDropdown.setAttribute("aria-expanded", menu.classList.contains("show"));
    }
  } else if (!e.target.closest(".dropdown")) {
    document.querySelectorAll(".dropdown-menu.show").forEach((m) => {
      m.classList.remove("show");
      const toggleBtn = m.closest(".dropdown")?.querySelector(".dropdown-toggle, #dropdownFeedbackBtn, #dropdownMenuTipo");
      if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "false");
    });
  }
});

// ==========================================
// 1. CARREGAR E RENDERIZAR FEED / PESQUISA
// ==========================================

// Gerencia a troca visual dos botões de filtro e executa a busca
window.alternarFiltroFeed = function (tipo) {
  const btnTodos = document.getElementById("btn-feed-todos");
  const btnFavs = document.getElementById("btn-feed-favs");

  if (tipo === "todos") {
    btnTodos?.classList.add("active");
    btnFavs?.classList.remove("active");
    window.carregarFeed();
  } else if (tipo === "favoritos") {
    btnFavs?.classList.add("active");
    btnTodos?.classList.remove("active");
    window.filtrarFavoritos();
  }
};

window.carregarFeed = async function () {
  const container = document.getElementById("feed-container");
  if (!container) return;

  try {
    const {
      data: { user },
    } = await window._supabase.auth.getUser();

    // 1. Busca todas as notas
    const { data: notes, error: notesErr } = await window._supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false });

    if (notesErr) throw notesErr;

    // 2. Busca perfis cadastrados
    const { data: profiles, error: profErr } = await window._supabase
      .from("profiles")
      .select("id, nome, bio, instagram, avatar_url, meta");

    if (profErr) throw profErr;

    // 3. Busca Likes, Favoritos e Contagem
    const { data: likesData } = await window._supabase
      .from("likes")
      .select("note_id, user_id");
    const { data: favsData } = await window._supabase
      .from("favorites")
      .select("note_id, user_id");
    const { data: commsData } = await window._supabase
      .from("comments")
      .select("note_id");

    window.meusLikes = new Set(
      (likesData || [])
        .filter((l) => l.user_id === user?.id)
        .map((l) => l.note_id),
    );
    window.meusFavoritos = new Set(
      (favsData || [])
        .filter((f) => f.user_id === user?.id)
        .map((f) => f.note_id),
    );

    const likesCountMap = {};
    (likesData || []).forEach((l) => {
      likesCountMap[l.note_id] = (likesCountMap[l.note_id] || 0) + 1;
    });

    const commsCountMap = {};
    (commsData || []).forEach((c) => {
      commsCountMap[c.note_id] = (commsCountMap[c.note_id] || 0) + 1;
    });

    window.todosOsPerfis = profiles || [];
    const perfisMap = new Map(window.todosOsPerfis.map((p) => [p.id, p]));

    // Vincula autor e dados de interacoes
    window.todasAsNotas = (notes || []).map((nota) => {
      const perfilAutor = perfisMap.get(nota.user_id);
      return {
        ...nota,
        autor_nome: perfilAutor?.nome || "Estudante",
        autor_bio: perfilAutor?.bio || "",
        autor_insta: perfilAutor?.instagram || "",
        autor_avatar: perfilAutor?.avatar_url || "",
        likes_count: likesCountMap[nota.id] || 0,
        comments_count: commsCountMap[nota.id] || 0,
      };
    });

    window.renderizarResultados(window.todasAsNotas, []);
  } catch (err) {
    console.error("Erro ao carregar o feed:", err);
    container.innerHTML = `<div class="col-12 text-danger text-center">Erro ao carregar o feed. Verifique o console.</div>`;
  }
};

window.renderizarResultados = function (listaNotas, listaPerfis) {
  const container = document.getElementById("feed-container");
  if (!container) return;

  if (listaNotas.length === 0 && listaPerfis.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-5 text-muted">
        <p class="mb-0">Nenhum resultado encontrado.</p>
      </div>`;
    return;
  }

  let html = "";

  // CARDS DE PERFIS
  if (listaPerfis.length > 0) {
    html += `<div class="col-12"><h5 class="fw-bold text-primary mb-3">👤 Perfis Encontrados</h5></div>`;
    html += listaPerfis
      .map((perfil) => {
        const avatarUrl =
          perfil.avatar_url ||
          "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 24 24' fill='%236c757d'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm0 14c-2.03 0-3.8-1.03-4.83-2.6.03-1.6 3.22-2.4 4.83-2.4s4.8 0.8 4.83 2.4c-1.03 1.57-2.8 2.6-4.83 2.6z'/></svg>";
        return `
          <div class="col-md-6 col-lg-4 mb-3">
            <div 
              class="card h-100 shadow-sm border border-secondary-subtle user-card-interactive" 
              style="cursor: pointer; transition: transform 0.15s ease, box-shadow 0.15s ease;"
              onclick="window.location.href='perfil-publico.html?id=${perfil.id}'"
            >
              <div class="card-body d-flex align-items-center gap-3">
                <img src="${avatarUrl}" alt="${perfil.nome}" class="rounded-circle border" style="width: 50px; height: 50px; object-fit: cover;" />
                <div class="overflow-hidden">
                  <h6 class="fw-bold text-dark mb-1 text-truncate">${perfil.nome}</h6>
                  <p class="card-text text-secondary small mb-0 text-truncate">${perfil.bio || "Sem biografia cadastrada."}</p>
                </div>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    if (listaNotas.length > 0) {
      html += `<div class="col-12 my-2"><hr><h5 class="fw-bold text-primary mb-3">📚 Resumos e Materiais</h5></div>`;
    }
  }

  // CARDS DE MATÉRIAS E RESUMOS
  html += listaNotas
    .map((nota) => {
      const dataFormatada = new Date(nota.created_at).toLocaleDateString(
        "pt-BR",
      );
      const isLiked = window.meusLikes.has(nota.id);
      const isFavorited = window.meusFavoritos.has(nota.id);

      let conteudoHTML = "";
      if (nota.tipo === "editor") {
        conteudoHTML = `<p class="card-text text-secondary">${nota.conteudo_texto || ""}</p>`;
      } else if (nota.arquivo_url) {
        if (nota.arquivo_url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
          conteudoHTML = `<img src="${nota.arquivo_url}" class="img-fluid rounded mb-2" style="max-height: 250px; object-fit: cover; width: 100%;">`;
        } else {
          conteudoHTML = `<a href="${nota.arquivo_url}" target="_blank" class="btn btn-outline-primary btn-sm w-100 mb-2">📎 Visualizar / Baixar PDF</a>`;
        }
      }

      return `
      <div class="col-md-6 col-lg-4 mb-3">
        <div class="card h-100 shadow-sm border-0 d-flex flex-column justify-content-between">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="badge bg-primary">${nota.materia}</span>
              <button class="btn btn-sm p-0 border-0 fs-6" onclick="window.toggleFavorito('${nota.id}')" title="Salvar Material">
                ${isFavorited ? "⭐" : "<span style='opacity: 0.3; filter: grayscale(100%);'>⭐</span>"}
              </button>
            </div>
            <h5 class="card-title fw-bold text-dark mb-2">${nota.titulo}</h5>
            ${conteudoHTML}
          </div>

          <!-- AÇÕES SOCIAL -->
          <div class="px-3 py-2 bg-light border-top border-bottom d-flex justify-content-between align-items-center small">
            <button class="btn btn-sm ${isLiked ? "btn-danger" : "btn-outline-danger"} border-0" onclick="window.toggleLike('${nota.id}')">
              ❤️ ${nota.likes_count}
            </button>
            <button class="btn btn-sm btn-outline-secondary border-0" onclick="window.abrirComentarios('${nota.id}')">
              💬 ${nota.comments_count} Comentários
            </button>
          </div>

          <!-- RODAPÉ ATUALIZADO COM AUTOR, DATA E INSTAGRAM -->
          <div class="card-footer bg-transparent border-top-0 d-flex justify-content-between align-items-center">
            <a href="perfil-publico.html?id=${nota.user_id}" class="text-decoration-none text-muted small text-truncate me-2" style="max-width: 130px;">
              Por: <strong class="text-dark">${nota.autor_nome}</strong>
            </a>
            
            <div class="d-flex align-items-center gap-2">
              <span class="text-muted small">${dataFormatada}</span>
              ${
                nota.autor_insta
                  ? `<a href="https://instagram.com/${nota.autor_insta.replace("@", "")}" target="_blank" class="btn btn-sm btn-outline-danger py-0 px-2 d-flex align-items-center" style="font-size: 0.75rem;">📸 Instagram</a>`
                  : ""
              }
            </div>
          </div>
        </div>
      </div>
    `;
    })
    .join("");

  container.innerHTML = html;
};

// EXIBIR APENAS FAVORITOS NA TELA
window.filtrarFavoritos = function () {
  const notasFavoritas = window.todasAsNotas.filter((nota) =>
    window.meusFavoritos.has(nota.id),
  );
  window.renderizarResultados(notasFavoritas, []);
};

// FILTRO EM TEMPO REAL
window.filtrarFeed = function (termoBusca) {
  const termo = (
    termoBusca !== undefined
      ? termoBusca
      : document.getElementById("input-busca-nav")?.value || ""
  )
    .toLowerCase()
    .trim();

  if (!termo) {
    window.renderizarResultados(window.todasAsNotas, []);
    return;
  }

  const notasFiltradas = window.todasAsNotas.filter(
    (nota) =>
      nota.titulo.toLowerCase().includes(termo) ||
      nota.materia.toLowerCase().includes(termo) ||
      nota.autor_nome.toLowerCase().includes(termo),
  );

  const perfisFiltrados = window.todosOsPerfis.filter(
    (perfil) =>
      perfil.nome.toLowerCase().includes(termo) ||
      (perfil.bio && perfil.bio.toLowerCase().includes(termo)),
  );

  window.renderizarResultados(notasFiltradas, perfisFiltrados);
};

// ==========================================
// FUNÇÕES DE LIKES, FAVORITOS E COMENTÁRIOS
// ==========================================

window.toggleLike = async function (noteId) {
  try {
    const {
      data: { user },
    } = await window._supabase.auth.getUser();
    if (!user) return alert("Faça login para curtir.");

    if (window.meusLikes.has(noteId)) {
      await window._supabase
        .from("likes")
        .delete()
        .eq("user_id", user.id)
        .eq("note_id", noteId);
      window.meusLikes.delete(noteId);
    } else {
      await window._supabase
        .from("likes")
        .insert({ user_id: user.id, note_id: noteId });
      window.meusLikes.add(noteId);
    }

    // Atualiza contagem localmente
    const nota = window.todasAsNotas.find((n) => n.id === noteId);
    if (nota) {
      nota.likes_count += window.meusLikes.has(noteId) ? 1 : -1;
    }

    window.renderizarResultados(window.todasAsNotas, []);
  } catch (err) {
    console.error("Erro ao curtir:", err);
  }
};

window.toggleFavorito = async function (noteId) {
  try {
    const {
      data: { user },
    } = await window._supabase.auth.getUser();
    if (!user) return alert("Faça login para favoritar.");

    if (window.meusFavoritos.has(noteId)) {
      await window._supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("note_id", noteId);
      window.meusFavoritos.delete(noteId);
      if (typeof window.mostrarToast === "function")
        window.mostrarToast("Removido dos salvos.", "info");
    } else {
      await window._supabase
        .from("favorites")
        .insert({ user_id: user.id, note_id: noteId });
      window.meusFavoritos.add(noteId);
      if (typeof window.mostrarToast === "function")
        window.mostrarToast("Salvo nos favoritos!", "success");
    }

    window.renderizarResultados(window.todasAsNotas, []);
  } catch (err) {
    console.error("Erro ao favoritar:", err);
  }
};

// ==========================================
// SEÇÃO DE COMENTÁRIOS (SEM ALERTS NATIVOS)
// ==========================================

// Função auxiliar para deixar a primeira letra maiúscula
function formatarPrimeiraLetra(texto) {
  if (!texto) return "";
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

window.abrirComentarios = async function (noteId) {
  window.notaComentariosId = noteId;
  const modalEl =
    document.getElementById("modalComentarios") ||
    document.getElementById("commentsModal");
  if (!modalEl) return;

  // Adiciona o ouvinte para remover o foco ao fechar, evitando o aviso de aria-hidden
  if (!modalEl.dataset.hasBlurListener) {
    modalEl.addEventListener("hide.bs.modal", () => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    });
    modalEl.dataset.hasBlurListener = "true";
  }

  const modal =
    bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
  modal.show();
  await window.carregarComentarios(noteId);
};

window.carregarComentarios = async function (noteId) {
  const container = document.getElementById("lista-comentarios");
  if (!container) return;

  container.innerHTML = `<p class="text-muted text-center py-2">Carregando...</p>`;

  try {
    const {
      data: { user },
    } = await window._supabase.auth.getUser();

    // 1. Busca os comentários da nota
    const { data: comments, error: commErr } = await window._supabase
      .from("comments")
      .select("id, texto, created_at, user_id")
      .eq("note_id", noteId)
      .order("created_at", { ascending: true });

    if (commErr) throw commErr;

    if (!comments || comments.length === 0) {
      container.innerHTML = `<p class="text-muted text-center py-2 small">Nenhum comentário ainda. Seja o primeiro!</p>`;
      return;
    }

    // 2. Busca os perfis de quem comentou
    const userIds = [...new Set(comments.map((c) => c.user_id))];
    const { data: profiles } = await window._supabase
      .from("profiles")
      .select("id, nome")
      .in("id", userIds);

    const perfisMap = new Map((profiles || []).map((p) => [p.id, p.nome]));

    // 3. Renderiza a lista na tela
    container.innerHTML = comments
      .map((c) => {
        const dataFormatada = new Date(c.created_at).toLocaleDateString(
          "pt-BR",
        );
        const autorNome = perfisMap.get(c.user_id) || "Estudante";
        const eMeuComentario = user && user.id === c.user_id;
        
        // Formata o texto para iniciar com letra maiúscula
        const textoFormatado = formatarPrimeiraLetra(c.texto);

        return `
          <div class="bg-light p-2 rounded mb-2 border-start border-3 border-primary position-relative" id="comentario-item-${c.id}">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <strong class="small text-dark">${autorNome}</strong>
              <div class="d-flex align-items-center gap-2">
                <small class="text-muted" style="font-size: 0.75rem;">${dataFormatada}</small>
                ${
                  eMeuComentario
                    ? `
                    <button class="btn btn-link btn-sm p-0 text-secondary text-decoration-none" onclick="window.alternarEdicaoComentario('${c.id}')" title="Editar">✏️</button>
                    <button class="btn btn-link btn-sm p-0 text-danger text-decoration-none" onclick="window.excluirComentario('${c.id}')" title="Excluir">🗑️</button>
                  `
                    : ""
                }
              </div>
            </div>
            
            <!-- Modo Visualização -->
            <p class="mb-0 small text-secondary" id="texto-comentario-${c.id}">${textoFormatado}</p>

            <!-- Modo Edição Integrado no Card -->
            <div id="form-editar-comentario-${c.id}" class="d-none mt-2">
              <textarea id="input-editar-comentario-${c.id}" class="form-control form-control-sm mb-2" rows="2">${c.texto}</textarea>
              <div class="d-flex justify-content-end gap-2">
                <button class="btn btn-sm btn-outline-secondary" onclick="window.alternarEdicaoComentario('${c.id}')">Cancelar</button>
                <button class="btn btn-sm btn-primary" onclick="window.salvarEdicaoComentario('${c.id}')">Salvar</button>
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  } catch (err) {
    console.error("Erro ao carregar comentários:", err);
    container.innerHTML = `<p class="text-danger text-center py-2 small">Erro ao carregar comentários.</p>`;
  }
};

window.enviarComentario = async function () {
  const input =
    document.getElementById("input-comentario") ||
    document.getElementById("texto-comentario");
  
  let texto = input?.value.trim();
  if (!texto || !window.notaComentariosId) return;

  // Opcional: já envia com a primeira letra maiúscula se quiser
  texto = formatarPrimeiraLetra(texto);

  try {
    const {
      data: { user },
    } = await window._supabase.auth.getUser();

    if (!user) {
      if (typeof window.mostrarToast === "function") {
        window.mostrarToast("Faça login para comentar.", "warning");
      }
      return;
    }

    const { error } = await window._supabase.from("comments").insert([
      {
        user_id: user.id,
        note_id: window.notaComentariosId,
        texto: texto,
      },
    ]);

    if (error) throw error;

    input.value = "";

    // Atualiza contagem local de comentários
    const nota = window.todasAsNotas?.find(
      (n) => n.id === window.notaComentariosId,
    );
    if (nota) nota.comments_count = (nota.comments_count || 0) + 1;

    if (typeof window.mostrarToast === "function") {
      window.mostrarToast("Comentário enviado!", "success");
    }

    await window.carregarComentarios(window.notaComentariosId);
    if (typeof window.renderizarResultados === "function") {
      window.renderizarResultados(window.todasAsNotas, []);
    }
  } catch (err) {
    if (typeof window.mostrarToast === "function") {
      window.mostrarToast("Erro ao enviar: " + err.message, "danger");
    }
  }
};

// ==========================================
// EDICÃO E EXCLUSÃO SEM ALERTS / PROMPTS
// ==========================================

// Alterna entre ver o texto e abrir a caixinha de edição integrada
window.alternarEdicaoComentario = function (commentId) {
  const pTexto = document.getElementById(`texto-comentario-${commentId}`);
  const formEdicao = document.getElementById(
    `form-editar-comentario-${commentId}`,
  );

  if (pTexto && formEdicao) {
    pTexto.classList.toggle("d-none");
    formEdicao.classList.toggle("d-none");
  }
};

// Salva a edição do comentário diretamente no card
window.salvarEdicaoComentario = async function (commentId) {
  const input = document.getElementById(`input-editar-comentario-${commentId}`);
  const novoTexto = input?.value.trim();

  if (!novoTexto) {
    if (typeof window.mostrarToast === "function") {
      window.mostrarToast("O comentário não pode ficar vazio.", "warning");
    }
    return;
  }

  try {
    const {
      data: { user },
    } = await window._supabase.auth.getUser();

    // Atualiza garantindo a validação do user_id
    const { data, error } = await window._supabase
      .from("comments")
      .update({ texto: novoTexto })
      .eq("id", commentId)
      .eq("user_id", user.id)
      .select();

    if (error) throw error;

    // Se a query rodou mas não alterou nenhuma linha (bloqueio de RLS)
    if (!data || data.length === 0) {
      throw new Error(
        "Permissão negada ou comentário não encontrado no banco.",
      );
    }

    if (typeof window.mostrarToast === "function") {
      window.mostrarToast("Comentário atualizado com sucesso!", "success");
    }

    // Recarrega os comentários para refletir a mudança
    await window.carregarComentarios(window.notaComentariosId);
  } catch (err) {
    console.error("Erro ao editar comentário:", err);
    if (typeof window.mostrarToast === "function") {
      window.mostrarToast("Erro ao editar: " + err.message, "danger");
    }
  }
};

// Exclui diretamente usando o aviso do Toast do site
window.excluirComentario = async function (commentId) {
  try {
    const { error } = await window._supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) throw error;

    // Atualiza contagem local de comentários
    const nota = window.todasAsNotas?.find(
      (n) => n.id === window.notaComentariosId,
    );
    if (nota && nota.comments_count > 0) {
      nota.comments_count -= 1;
    }

    if (typeof window.mostrarToast === "function") {
      window.mostrarToast("Comentário removido com sucesso.", "info");
    }

    await window.carregarComentarios(window.notaComentariosId);
    if (typeof window.renderizarResultados === "function") {
      window.renderizarResultados(window.todasAsNotas, []);
    }
  } catch (err) {
    if (typeof window.mostrarToast === "function") {
      window.mostrarToast("Erro ao excluir: " + err.message, "danger");
    }
  }
};
// Função auxiliar para capitalizar a primeira letra
function capitalizarPrimeiraLetra(texto) {
  if (!texto || typeof texto !== "string") return "";
  const limpo = texto.trim();
  if (limpo.length === 0) return "";
  return limpo.charAt(0).toUpperCase() + limpo.slice(1);
}

// ==========================================
// 2. SALVAR NOVA NOTA
// ==========================================

window.salvarNovaNota = async function () {
  const btn = document.getElementById("btn-salvar");

  // Pegamos os valores e já aplicamos a capitalização da primeira letra
  const tituloInput = document.getElementById("nota-titulo").value;
  const materiaInput = document.getElementById("nota-materia").value;
  const textoInput = document.getElementById("nota-texto")?.value || "";

  const titulo = capitalizarPrimeiraLetra(tituloInput);
  const materia = capitalizarPrimeiraLetra(materiaInput);
  const texto = capitalizarPrimeiraLetra(textoInput);

  const fileInput = document.getElementById("nota-arquivo");

  const isArquivo = document
    .getElementById("type-file-tab")
    ?.classList.contains("active");
  const tipo = isArquivo ? "arquivo" : "editor";

  if (!titulo || !materia) {
    if (typeof window.mostrarToast === "function") {
      window.mostrarToast("Preencha o título e a matéria.", "danger");
    } else {
      alert("Preencha o título e a matéria.");
    }
    return;
  }

  btn.disabled = true;
  btn.innerText = "Publicando...";

  try {
    const {
      data: { user },
    } = await window._supabase.auth.getUser();
    let fileUrl = null;

    if (isArquivo && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `resumos/${fileName}`;

      const { error: uploadError } = await window._supabase.storage
        .from("cadernos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = window._supabase.storage
        .from("cadernos")
        .getPublicUrl(filePath);

      fileUrl = urlData.publicUrl;
    }

    const { error: insertError } = await window._supabase.from("notes").insert([
      {
        user_id: user.id,
        titulo: titulo,
        materia: materia,
        tipo: tipo,
        conteudo_texto: isArquivo ? null : texto,
        arquivo_url: fileUrl,
      },
    ]);

    if (insertError) throw insertError;

    if (typeof window.mostrarToast === "function") {
      window.mostrarToast("Material publicado com sucesso!", "success");
    } else {
      alert("Material publicado com sucesso!");
    }

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1200);
  } catch (err) {
    if (typeof window.mostrarToast === "function") {
      window.mostrarToast("Erro ao publicar: " + err.message, "danger");
    } else {
      alert("Erro ao publicar: " + err.message);
    }
    console.error(err);
  } finally {
    btn.disabled = false;
    btn.innerText = "Publicar Material";
  }
};

// ==========================================
// 3. ENVIAR FEEDBACK
// ==========================================
document.addEventListener("click", (e) => {
  const btn = e.target.closest("#dropdownFeedbackBtn");
  if (btn) {
    e.preventDefault();
    e.stopPropagation();
    
    // Procura explicitamente o ul.dropdown-menu dentro do container pai
    const dropdownContainer = btn.closest(".dropdown");
    const menu = dropdownContainer ? dropdownContainer.querySelector(".dropdown-menu") : null;
    
    if (menu) {
      document.querySelectorAll(".dropdown-menu.show").forEach((m) => {
        if (m !== menu) m.classList.remove("show");
      });
      menu.classList.toggle("show");
    }
    return;
  }

  const item = e.target.closest(".item-feedback");
  if (item) {
    e.preventDefault();
    const valor = item.getAttribute("data-valor");
    const label = item.getAttribute("data-label");
    
    const inputTipo = document.getElementById("fb-tipo");
    const labelTipo = document.getElementById("feedback-tipo-label");

    if (inputTipo) inputTipo.value = valor;
    if (labelTipo) labelTipo.innerText = label;
    
    const menu = item.closest(".dropdown-menu");
    if (menu) menu.classList.remove("show");
    return;
  }

  if (!e.target.closest(".dropdown")) {
    document.querySelectorAll(".dropdown-menu.show").forEach((m) => {
      m.classList.remove("show");
    });
  }
});

window.enviarFeedback = async function () {
  const tipoInput = document.getElementById("fb-tipo");
  const mensagemInput = document.getElementById("fb-texto");

  if (!tipoInput || !mensagemInput) return;

  const tipo = tipoInput.value;
  const textoPuro = mensagemInput.value;
  
  if (!textoPuro || !textoPuro.trim()) {
    if (typeof window.mostrarToast === "function") {
      window.mostrarToast("Digite sua mensagem antes de enviar.", "danger");
    } else {
      alert("Digite sua mensagem antes de enviar.");
    }
    return;
  }

  const mensagem = textoPuro.trim().charAt(0).toUpperCase() + textoPuro.trim().slice(1);

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

    mensagemInput.value = "";

    const modalEl = document.getElementById("feedbackModal");
    if (modalEl) {
      const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
      modal.hide();
    }
  } catch (err) {
    console.error("Erro ao enviar feedback:", err);
    if (typeof window.mostrarToast === "function") {
      window.mostrarToast("Erro ao enviar feedback: " + err.message, "danger");
    } else {
      alert("Erro ao enviar feedback: " + err.message);
    }
  }
};
// ==========================================
// 4. CARREGAR E EXCLUIR "MINHAS NOTAS"
// ==========================================

window.carregarMinhasNotas = async function (userId) {
  const container = document.getElementById("minhas-notas-container");
  if (!container) return;

  try {
    const { data: notes, error } = await window._supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!notes || notes.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center py-4 text-muted">
          <p class="mb-0">Você ainda não publicou nenhum resumo ou nota.</p>
        </div>`;
      return;
    }

    container.innerHTML = notes
      .map((nota) => {
        const dataFormatada = new Date(nota.created_at).toLocaleDateString(
          "pt-BR",
        );

        // Aplica a capitalização também na exibição por segurança
        const materiaFormatada = capitalizarPrimeiraLetra(nota.materia || "");
        const tituloFormatado = capitalizarPrimeiraLetra(nota.titulo || "");
        const textoFormatado = capitalizarPrimeiraLetra(
          nota.conteudo_texto || "",
        );

        let conteudoHTML = "";
        if (nota.tipo === "editor") {
          conteudoHTML = `<p class="card-text text-secondary">${textoFormatado}</p>`;
        } else if (nota.arquivo_url) {
          if (nota.arquivo_url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
            conteudoHTML = `<img src="${nota.arquivo_url}" class="img-fluid rounded mb-2" style="max-height: 200px; object-fit: cover; width: 100%;">`;
          } else {
            conteudoHTML = `<a href="${nota.arquivo_url}" target="_blank" class="btn btn-outline-primary btn-sm w-100 mb-2">📎 Visualizar PDF</a>`;
          }
        }

        return `
        <div class="col-md-6 mb-3">
          <div class="card h-100 shadow-sm border border-secondary-subtle">
            <div class="card-body">
              <span class="badge bg-primary mb-2">${materiaFormatada}</span>
              <h5 class="card-title fw-bold text-dark">${tituloFormatado}</h5>
              ${conteudoHTML}
            </div>
            <div class="card-footer bg-transparent border-top-0 d-flex justify-content-between align-items-center">
              <small class="text-muted">${dataFormatada}</small>
              <button class="btn btn-outline-danger btn-sm" onclick="excluirNota('${nota.id}', '${nota.arquivo_url || ""}')">
                🗑️ Excluir
              </button>
            </div>
          </div>
        </div>
      `;
      })
      .join("");
  } catch (err) {
    console.error("Erro ao carregar minhas notas:", err);
    container.innerHTML = `<div class="col-12 text-danger text-center">Erro ao carregar publicações.</div>`;
  }
};

let notaParaExcluir = null;
let arquivoParaExcluir = null;

window.validarTextoExclusao = function (texto) {
  const btn = document.getElementById("btn-confirmar-exclusao");
  if (btn) {
    btn.disabled = texto.trim().toUpperCase() !== "EXCLUIR";
  }
};

window.excluirNota = function (notaId, arquivoUrl) {
  notaParaExcluir = notaId;
  arquivoParaExcluir = arquivoUrl;

  const input = document.getElementById("input-confirmar-exclusao");
  const btn = document.getElementById("btn-confirmar-exclusao");

  if (input) input.value = "";
  if (btn) btn.disabled = true;

  const modalEl = document.getElementById("confirmDeleteModal");
  if (!modalEl) return;

  const modal = new bootstrap.Modal(modalEl);
  modal.show();
};

window.executarExclusao = async function () {
  if (!notaParaExcluir) return;

  const modalEl = document.getElementById("confirmDeleteModal");
  const modal = bootstrap.Modal.getInstance(modalEl);
  if (modal) modal.hide();

  try {
    if (arquivoParaExcluir) {
      const urlParts = arquivoParaExcluir.split("/cadernos/");
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await window._supabase.storage.from("cadernos").remove([filePath]);
      }
    }

    const { error } = await window._supabase
      .from("notes")
      .delete()
      .eq("id", notaParaExcluir);

    if (error) throw error;

    if (typeof window.mostrarToast === "function") {
      window.mostrarToast("Publicação excluída com sucesso!", "success");
    }

    const {
      data: { user },
    } = await window._supabase.auth.getUser();
    if (user && typeof window.carregarMinhasNotas === "function") {
      await window.carregarMinhasNotas(user.id);
    }
  } catch (err) {
    if (typeof window.mostrarToast === "function") {
      window.mostrarToast("Erro ao excluir: " + err.message, "danger");
    }
    console.error("Erro na exclusão:", err);
  } finally {
    notaParaExcluir = null;
    arquivoParaExcluir = null;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const btnExcluir = document.getElementById("btn-confirmar-exclusao");
  if (btnExcluir) {
    btnExcluir.addEventListener("click", window.executarExclusao);
  }
});

// ==========================================
// 5. GERENCIAMENTO DE PERFIL
// ==========================================

window.carregarPerfil = async function (user) {
  if (!user) return;

  try {
    const elEmail = document.getElementById("perfil-email");
    if (elEmail) elEmail.value = user.email || "";

    const { data: profile, error } = await window._supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) throw error;

    if (profile) {
      const elNome = document.getElementById("perfil-nome");
      if (elNome) elNome.value = profile.nome || "";

      const elInsta = document.getElementById("perfil-insta");
      if (elInsta) elInsta.value = profile.instagram || profile.insta || "";

      const elBio = document.getElementById("perfil-bio");
      if (elBio) elBio.value = profile.bio || "";

      const elMeta = document.getElementById("user-meta");
      if (elMeta) elMeta.value = profile.meta || "";

      const elAvatar = document.getElementById("user-avatar");
      if (elAvatar && profile.avatar_url) {
        elAvatar.src = profile.avatar_url;
      }
    }

    if (typeof window.carregarMinhasNotas === "function") {
      await window.carregarMinhasNotas(user.id);
    }
  } catch (err) {
    console.error("Erro ao carregar perfil:", err);
  }
};

window.salvarMeta = async function () {
  try {
    const {
      data: { user },
    } = await window._supabase.auth.getUser();
    if (!user) {
      if (typeof window.mostrarToast === "function") {
        window.mostrarToast(
          "Sessão expirada. Faça login novamente.",
          "warning",
        );
      }
      return;
    }

    const metaInput = document.getElementById("user-meta");
    const metaText = metaInput ? metaInput.value : "";
    const nomeInput =
      document.getElementById("perfil-nome")?.value || user.email.split("@")[0];

    const { error } = await window._supabase.from("profiles").upsert({
      id: user.id,
      nome: nomeInput,
      meta: metaText,
      updated_at: new Date(),
    });

    if (error) throw error;

    if (typeof window.mostrarToast === "function") {
      window.mostrarToast("Meta atualizada com sucesso!", "success");
    }
  } catch (err) {
    if (typeof window.mostrarToast === "function") {
      window.mostrarToast("Erro ao salvar meta: " + err.message, "danger");
    }
    console.error("Erro na meta:", err);
  }
};

window.uploadAvatar = async function (event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const {
      data: { user },
    } = await window._supabase.auth.getUser();
    if (!user) {
      if (typeof window.mostrarToast === "function") {
        window.mostrarToast(
          "Sessão expirada. Faça login novamente.",
          "warning",
        );
      }
      return;
    }

    const fileExt = file.name.split(".").pop();
    const filePath = `avatars/${user.id}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await window._supabase.storage
      .from("cadernos")
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = window._supabase.storage
      .from("cadernos")
      .getPublicUrl(filePath);

    const avatarUrl = publicUrlData.publicUrl;
    const nomeInput =
      document.getElementById("perfil-nome")?.value || user.email.split("@")[0];

    const { error: updateError } = await window._supabase
      .from("profiles")
      .upsert({
        id: user.id,
        nome: nomeInput,
        avatar_url: avatarUrl,
        updated_at: new Date(),
      });

    if (updateError) throw updateError;

    const elAvatar = document.getElementById("user-avatar");
    if (elAvatar) elAvatar.src = avatarUrl;

    if (typeof window.mostrarToast === "function") {
      window.mostrarToast("Foto de perfil atualizada!", "success");
    }
  } catch (err) {
    if (typeof window.mostrarToast === "function") {
      window.mostrarToast("Erro no upload do avatar: " + err.message, "danger");
    }
    console.error("Erro no avatar:", err);
  }
};

// ==========================================
// 6. ABA SOCIAL E BUSCA DE USUÁRIOS
// ==========================================

function renderizarCardUsuario(user) {
  const avatarUrl =
    user.avatar_url ||
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 24 24' fill='%236c757d'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm0 14c-2.03 0-3.8-1.03-4.83-2.6.03-1.6 3.22-2.4 4.83-2.4s4.8 0.8 4.83 2.4c-1.03 1.57-2.8 2.6-4.83 2.6z'/></svg>";
  const nome = user.nome || "Estudante";
  const bio = user.bio || "Sem biografia cadastrada.";
  const meta = user.meta ? `🎯 Meta: ${user.meta}` : "";

  return `
    <div 
      class="card border border-secondary-subtle shadow-sm p-3 user-card-interactive" 
      style="cursor: pointer; transition: transform 0.15s ease, box-shadow 0.15s ease;"
      onclick="window.location.href='perfil-publico.html?id=${user.id}'"
    >
      <div class="d-flex align-items-center gap-3">
        <img 
          src="${avatarUrl}" 
          alt="${nome}" 
          class="rounded-circle border" 
          style="width: 55px; height: 55px; object-fit: cover;"
        />
        <div class="flex-grow-1 overflow-hidden">
          <h6 class="fw-bold mb-1 text-truncate">${nome}</h6>
          <p class="text-muted small mb-1 text-truncate">${bio}</p>
          ${meta ? `<span class="badge bg-light text-dark fw-normal border">${meta}</span>` : ""}
        </div>
        <span class="text-primary fw-bold fs-5">›</span>
      </div>
    </div>
  `;
}

window.carregarComunidade = async function () {
  const container = document.getElementById("lista-usuarios-container");
  if (!container) return;

  try {
    const { data: usuarios, error } = await window._supabase
      .from("profiles")
      .select("*")
      .limit(20);

    if (error) throw error;

    if (!usuarios || usuarios.length === 0) {
      container.innerHTML = `<p class="text-muted text-center py-3">Nenhum estudante encontrado.</p>`;
      return;
    }

    container.innerHTML = usuarios
      .map((u) => renderizarCardUsuario(u))
      .join("");
  } catch (err) {
    console.error("Erro ao carregar comunidade:", err);
    container.innerHTML = `<p class="text-danger text-center">Erro ao carregar lista de estudantes.</p>`;
  }
};

let timeoutBusca = null;
window.buscarUsuarios = function (termo) {
  clearTimeout(timeoutBusca);
  timeoutBusca = setTimeout(async () => {
    const container = document.getElementById("lista-usuarios-container");
    if (!container) return;

    if (!termo.trim()) {
      await window.carregarComunidade();
      return;
    }

    try {
      const { data: usuarios, error } = await window._supabase
        .from("profiles")
        .select("*")
        .or(`nome.ilike.%${termo}%,bio.ilike.%${termo}%`)
        .limit(20);

      if (error) throw error;

      if (!usuarios || usuarios.length === 0) {
        container.innerHTML = `<p class="text-muted text-center py-3">Nenhum estudante encontrado para "${termo}".</p>`;
        return;
      }

      container.innerHTML = usuarios
        .map((u) => renderizarCardUsuario(u))
        .join("");
    } catch (err) {
      console.error("Erro na busca:", err);
    }
  }, 300);
};
// ==========================================
// 7. EDICÃO E ATUALIZAÇÃO DO PERFIL
// ==========================================

window.salvarPerfil = async function () {
  const btn = document.getElementById("btn-salvar-perfil");
  const nome = document.getElementById("perfil-nome")?.value.trim();
  const bio = document.getElementById("perfil-bio")?.value.trim();
  const instagram = document.getElementById("perfil-insta")?.value.trim();

  if (!nome) {
    if (typeof window.mostrarToast === "function") {
      window.mostrarToast("O campo nome não pode ficar vazio.", "danger");
    } else {
      alert("O campo nome não pode ficar vazio.");
    }
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerText = "Salvando...";
  }

  try {
    const {
      data: { user },
    } = await window._supabase.auth.getUser();

    if (!user) {
      if (typeof window.mostrarToast === "function") {
        window.mostrarToast(
          "Sessão expirada. Faça login novamente.",
          "warning",
        );
      }
      return;
    }

    const { error } = await window._supabase.from("profiles").upsert({
      id: user.id,
      nome: nome,
      bio: bio,
      instagram: instagram,
      updated_at: new Date(),
    });

    if (error) throw error;

    if (typeof window.mostrarToast === "function") {
      window.mostrarToast("Perfil atualizado com sucesso!", "success");
    } else {
      alert("Perfil atualizado com sucesso!");
    }
  } catch (err) {
    console.error("Erro ao salvar perfil:", err);
    if (typeof window.mostrarToast === "function") {
      window.mostrarToast("Erro ao salvar perfil: " + err.message, "danger");
    } else {
      alert("Erro ao salvar perfil: " + err.message);
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = "Salvar Alterações";
    }
  }
};

// ==========================================
// PERFIL PÚBLICO E SISTEMA DE SEGUIR
// ==========================================

window.carregarPerfilPublico = async function () {
  const urlParams = new URLSearchParams(window.location.search);
  const perfilId = urlParams.get("id");

  if (!perfilId) {
    window.location.href = "feed.html";
    return;
  }

  try {
    const { data: currentUser } = await window._supabase.auth.getUser();
    const me = currentUser?.user;

    // 1. Busca os dados do perfil
    const { data: perfil, error } = await window._supabase
      .from("profiles")
      .select("*")
      .eq("id", perfilId)
      .single();

    if (error || !perfil) throw new Error("Perfil não encontrado.");

    // Preenche as informações básicas
    document.getElementById("public-user-nome").innerText =
      perfil.nome || "Estudante";
    document.getElementById("public-user-bio").innerText = perfil.bio || "";

    if (perfil.instagram) {
      document.getElementById("public-user-insta").innerText =
        `@${perfil.instagram.replace("@", "")}`;
    }

    if (perfil.meta) {
      const metaEl = document.getElementById("public-user-meta");
      const metaContainer = document.getElementById(
        "public-user-meta-container",
      );
      metaEl.innerText = `🎯 Meta: ${perfil.meta}`;
      metaContainer.classList.remove("d-none");
    }

    if (perfil.avatar_url) {
      document.getElementById("public-user-avatar").src = perfil.avatar_url;
    }

    // 2. Carrega as estatísticas (Notas, Seguidores, Seguindo)
    await window.carregarEstatisticasPublicas(perfilId);

    // 3. Renderiza o botão de Seguir se não for o próprio usuário logado
    const btnArea = document.getElementById("area-btn-seguir");
    if (btnArea && me && me.id !== perfilId) {
      // Verifica se já segue
      const { data: follow } = await window._supabase
        .from("follows")
        .select("id")
        .eq("follower_id", me.id)
        .eq("following_id", perfilId)
        .maybeSingle();

      const jaSegue = !!follow;

      btnArea.innerHTML = `
        <button class="btn ${jaSegue ? "btn-outline-secondary" : "btn-primary"} px-4 rounded-pill fw-bold" onclick="window.toggleSeguir('${perfilId}', ${jaSegue})">
          ${jaSegue ? "✓ Seguindo" : "+ Seguir"}
        </button>
      `;
    }

    // 4. Carrega os cadernos publicados deste usuário
    await window.carregarCadernosPublicos(perfilId);
  } catch (err) {
    console.error("Erro ao carregar perfil público:", err);
  }
};

window.carregarEstatisticasPublicas = async function (perfilId) {
  try {
    // Conta publicações
    const { count: countNotas } = await window._supabase
      .from("notes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", perfilId);

    // Conta seguidores (quem segue este perfil)
    const { count: countSeguidores } = await window._supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("following_id", perfilId);

    // Conta seguindo (quem este perfil segue)
    const { count: countSeguindo } = await window._supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("follower_id", perfilId);

    document.getElementById("public-total-notas").innerText = countNotas || 0;
    document.getElementById("public-total-seguidores").innerText =
      countSeguidores || 0;
    document.getElementById("public-total-seguindo").innerText =
      countSeguindo || 0;
  } catch (err) {
    console.error("Erro ao carregar estatísticas:", err);
  }
};

window.toggleSeguir = async function (perfilId, jaSegue) {
  try {
    const {
      data: { user },
    } = await window._supabase.auth.getUser();
    if (!user) {
      if (typeof window.mostrarToast === "function") {
        window.mostrarToast("Faça login para seguir usuários.", "warning");
      }
      return;
    }

    if (jaSegue) {
      // Deixar de seguir
      const { error } = await window._supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", perfilId);

      if (error) throw error;
      if (typeof window.mostrarToast === "function")
        window.mostrarToast("Você deixou de seguir este usuário.", "info");
    } else {
      // Seguir
      const { error } = await window._supabase
        .from("follows")
        .insert([{ follower_id: user.id, following_id: perfilId }]);

      if (error) throw error;
      if (typeof window.mostrarToast === "function")
        window.mostrarToast("Agora você está seguindo!", "success");
    }

    // Recarrega o perfil para atualizar o botão e a contagem de seguidores na hora
    await window.carregarPerfilPublico();
  } catch (err) {
    console.error("Erro ao seguir/deixar de seguir:", err);
    if (typeof window.mostrarToast === "function") {
      window.mostrarToast("Erro ao processar ação.", "danger");
    }
  }
};

window.carregarMinhasEstatisticas = async function () {
  try {
    const {
      data: { user },
    } = await window._supabase.auth.getUser();
    if (!user) return;

    // Total de Publicações do Usuário Logado
    const { count: countNotas } = await window._supabase
      .from("notes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    // Total de Seguidores
    const { count: countSeguidores } = await window._supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("following_id", user.id);

    // Total de Pessoas que o Usuário Segue
    const { count: countSeguindo } = await window._supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("follower_id", user.id);

    // Atualiza os elementos na tela
    const elNotas =
      document.getElementById("minhas-total-notas") ||
      document.getElementById("total-notas");
    const elSeguidores =
      document.getElementById("minhas-total-seguidores") ||
      document.getElementById("total-seguidores");
    const elSeguindo =
      document.getElementById("minhas-total-seguindo") ||
      document.getElementById("total-seguindo");

    if (elNotas) elNotas.innerText = countNotas || 0;
    if (elSeguidores) elSeguidores.innerText = countSeguidores || 0;
    if (elSeguindo) elSeguindo.innerText = countSeguindo || 0;
  } catch (err) {
    console.error("Erro ao carregar estatísticas do meu perfil:", err);
  }
};
// Trata a busca e garante que a linha do perfil existe no banco sem travar a aplicação
async function garantirPerfilExistente(user) {
  try {
    // Tenta buscar o perfil do usuário
    const { data: profile, error } = await window._supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.warn("Aviso ao buscar perfil:", error.message);
    }

    // Se não encontrou o perfil, cria um novo
    if (!profile) {
      const nomePadrao = user.user_metadata?.nome || user.email.split("@")[0];

      const { data: novoPerfil, error: insertError } = await window._supabase
        .from("profiles")
        .upsert([
          {
            id: user.id,
            nome: nomePadrao,
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (insertError) {
        console.error(
          "Erro ao criar perfil automaticamente:",
          insertError.message,
        );
        return null;
      }

      return novoPerfil;
    }

    return profile;
  } catch (err) {
    console.error("Erro inesperado ao garantir perfil:", err);
    return null;
  }
}
