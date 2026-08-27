// js/perfil.js
let usuarioId = null;
let publicacaoParaExcluirId = null;
let itemParaExcluir = { id: null, tabela: null };

document.addEventListener("DOMContentLoaded", async () => {
  const user = await window.verificarSessao();
  if (!user) return;

  usuarioId = user.id;

  carregarDadosPerfil();
  carregarMinhasPublicacoes();
  carregarMinhasVitorias();
  carregarContadoresConexoes();

  document
    .getElementById("form-editar-perfil")
    .addEventListener("submit", salvarPerfil);
});

function alternarAba(aba) {
  const btnPub = document.getElementById("tab-publicacoes");
  const btnVit = document.getElementById("tab-vitorias");
  const containerPub = document.getElementById("conteudo-publicacoes");
  const containerVit = document.getElementById("conteudo-vitorias");

  if (aba === "publicacoes") {
    btnPub.classList.add("active");
    btnVit.classList.remove("active");
    containerPub.classList.remove("d-none");
    containerVit.classList.add("d-none");
  } else {
    btnVit.classList.add("active");
    btnPub.classList.remove("active");
    containerVit.classList.remove("d-none");
    containerPub.classList.add("d-none");
  }
}

async function carregarDadosPerfil() {
  try {
    const { data: profile, error } = await window._supabase
      .from("profiles")
      .select("*")
      .eq("id", usuarioId)
      .single();

    if (error) throw error;

    if (profile) {
      document.getElementById("perfil-nome").innerText =
        profile.nome || "Estudante";
      document.getElementById("perfil-bio").innerText =
        profile.bio || "Sem biografia cadastrada.";
      document.getElementById("perfil-meta").innerText = profile.meta
        ? `🎯 Meta: ${profile.meta}`
        : "🎯 Meta não definida";

      const elUsername = document.getElementById("perfil-username");
      if (profile.username) {
        elUsername.innerText = `@${profile.username}`;
        elUsername.classList.remove("d-none");
      } else {
        elUsername.classList.add("d-none");
      }

      if (profile.curso) {
        document.getElementById("perfil-curso").innerHTML =
          `<i class="bi bi-mortarboard me-1"></i> ${profile.curso}`;
      } else {
        document.getElementById("perfil-curso").innerHTML =
          `<i class="bi bi-mortarboard me-1"></i> Curso não informado`;
      }

      const instaLink = document.getElementById("perfil-insta-link");
      if (profile.instagram && profile.instagram.trim() !== "") {
        const instaClean = profile.instagram.replace("@", "").trim();
        document.getElementById("perfil-insta").innerText = `@${instaClean}`;
        instaLink.href = `https://instagram.com/${instaClean}`;
        instaLink.classList.remove("d-none");
      } else {
        instaLink.classList.add("d-none");
      }

      // Foto de perfil / Avatar padrão
      const imgFoto = document.getElementById("perfil-foto-img");
      const iconeFoto = document.getElementById("perfil-foto-icone");

      if (profile.avatar_url && profile.avatar_url.trim() !== "") {
        imgFoto.src = profile.avatar_url;
        imgFoto.classList.remove("d-none");
        iconeFoto.classList.add("d-none");
      } else {
        imgFoto.classList.add("d-none");
        iconeFoto.classList.remove("d-none");
      }

      // Preenche os campos do modal de edição
      const elFile = document.getElementById("edit-avatar-file");
      if (elFile) elFile.value = ""; // Limpa a seleção do arquivo

      const elUrl = document.getElementById("edit-avatar-url");
      if (elUrl) elUrl.value = profile.avatar_url || "";

      document.getElementById("edit-nome").value = profile.nome || "";
      document.getElementById("edit-curso").value = profile.curso || "";
      document.getElementById("edit-meta").value = profile.meta || "";
      document.getElementById("edit-insta").value = profile.instagram || "";
      document.getElementById("edit-bio").value = profile.bio || "";
    }
  } catch (err) {
    console.error("Erro ao carregar dados do perfil:", err);
  }
}

async function salvarPerfil(e) {
  e.preventDefault();

  const btnSalvar = e.target.querySelector('button[type="submit"]');
  const textoOriginal = btnSalvar ? btnSalvar.innerText : "Salvar";
  if (btnSalvar) {
    btnSalvar.disabled = true;
    btnSalvar.innerText = "Salvando...";
  }

  try {
    const fileInput = document.getElementById("edit-avatar-file");
    const urlHiddenInput = document.getElementById("edit-avatar-url");
    let avatarUrl = urlHiddenInput ? urlHiddenInput.value : "";

    // 1. Faz upload do arquivo se o usuário selecionou uma nova imagem
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${usuarioId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await window._supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw new Error(
          "Erro ao enviar a foto de perfil: " + uploadError.message,
        );
      }

      // Pega a URL pública gerada no Supabase
      const { data: urlData } = window._supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      avatarUrl = urlData.publicUrl;
    }

    // 2. Atualiza os dados no banco
    const updates = {
      avatar_url: avatarUrl,
      nome: document.getElementById("edit-nome").value.trim(),
      curso: document.getElementById("edit-curso").value.trim(),
      meta: document.getElementById("edit-meta").value.trim(),
      instagram: document.getElementById("edit-insta").value.trim(),
      bio: document.getElementById("edit-bio").value.trim(),
      updated_at: new Date(),
    };

    const { error } = await window._supabase
      .from("profiles")
      .update(updates)
      .eq("id", usuarioId);

    if (error) throw error;

    // Fecha o modal e recarrega os dados
    const modalEl = document.getElementById("modalEditarPerfil");
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    await carregarDadosPerfil();
  } catch (err) {
    alert(err.message || "Erro ao salvar perfil!");
    console.error(err);
  } finally {
    if (btnSalvar) {
      btnSalvar.disabled = false;
      btnSalvar.innerText = textoOriginal;
    }
  }
}

// Carrega as publicações exibindo o texto do 'conteudo_texto' e o número real de curtidas
async function carregarMinhasPublicacoes() {
  const container = document.getElementById("conteudo-publicacoes");
  if (!container) return;

  const { data: publicacoes, error } = await window._supabase
    .from("notes")
    .select("*")
    .eq("user_id", usuarioId)
    .order("created_at", { ascending: false });

  container.innerHTML = "";

  if (error || !publicacoes || publicacoes.length === 0) {
    container.innerHTML = `<div class="col-12 text-center py-4 text-muted bg-white rounded-4 shadow-sm"><small>Você ainda não possui publicações.</small></div>`;
    return;
  }

  const qtdEl = document.getElementById("qtd-publicacoes");
  if (qtdEl) qtdEl.innerText = publicacoes.length;

  for (const item of publicacoes) {
    // 1. Tenta pegar a contagem do campo likes_count ou busca direto na tabela 'likes'
    let totalCurtidas = item.likes_count || 0;

    const { count } = await window._supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("note_id", item.id);

    if (count !== null && count !== undefined) {
      totalCurtidas = count;
    }

    const tag = item.materia || "Geral";
    const titulo = item.titulo || "Nota sem título";
    const textoConteudo = item.conteudo_texto || "";

    container.innerHTML += `
      <div class="col-md-6" id="pub-${item.id}">
        <div class="card border border-secondary-subtle shadow-sm rounded-4 p-3 bg-white h-100 position-relative">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="badge bg-primary-subtle text-primary fw-semibold">${tag}</span>
            <button class="btn btn-sm btn-outline-danger border-0 py-0 px-2" onclick="abrirModalExcluirItem('${item.id}', 'notes')" title="Excluir publicação">
              <i class="bi bi-trash3"></i>
            </button>
          </div>
          <h6 class="fw-bold text-dark mb-1">${titulo}</h6>
          ${textoConteudo ? `<p class="text-muted small mb-2">${textoConteudo}</p>` : ""}
          <div class="mt-auto text-end text-danger small fw-semibold">
            ❤️ ${totalCurtidas} Curtidas
          </div>
        </div>
      </div>
    `;
  }
}

function abrirModalExcluir(id) {
  publicacaoParaExcluirId = id;
  const modalEl = document.getElementById("modalConfirmarExclusao");
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}

async function executarExclusao() {
  if (!publicacaoParaExcluirId) return;

  const { error } = await window._supabase
    .from("notes")
    .delete()
    .eq("id", publicacaoParaExcluirId);

  const modalEl = document.getElementById("modalConfirmarExclusao");
  const modal = bootstrap.Modal.getInstance(modalEl);
  if (modal) modal.hide();

  if (!error) {
    const cardEl = document.getElementById(`pub-${publicacaoParaExcluirId}`);
    if (cardEl) cardEl.remove();

    const qtdEl = document.getElementById("qtd-publicacoes");
    const novaQtd = Math.max(0, parseInt(qtdEl.innerText || 0) - 1);
    qtdEl.innerText = novaQtd;
  }
  publicacaoParaExcluirId = null;
}
// Carrega as vitórias da tabela mural_postagens com contagem real de curtidas e texto do card
async function carregarMinhasVitorias() {
  const container = document.getElementById("conteudo-vitorias");
  if (!container) return;

  const { data: vitorias, error } = await window._supabase
    .from("mural_postagens")
    .select("*")
    .eq("user_id", usuarioId)
    .order("created_at", { ascending: false });

  container.innerHTML = "";

  if (error || !vitorias || vitorias.length === 0) {
    container.innerHTML = `<div class="text-center py-4 text-muted bg-white rounded-4 shadow-sm"><small>Você ainda não registrou nenhuma vitória.</small></div>`;
    return;
  }

  for (const item of vitorias) {
    let totalCurtidas = item.curtidas || item.likes || 0;

    const { count } = await window._supabase
      .from("mural_curtidas")
      .select("*", { count: "exact", head: true })
      .eq("post_id", item.id);

    if (count !== null && count !== undefined) {
      totalCurtidas = count;
    }

    const tag = item.categoria || item.materia || item.tag || "Mural";
    const titulo = item.titulo || item.title || "Vitória";
    const textoConteudo =
      item.conteudo ||
      item.mensagem ||
      item.descricao ||
      item.texto ||
      item.content ||
      "";

    container.innerHTML += `
      <div class="card border border-secondary-subtle shadow-sm rounded-4 p-3 bg-white position-relative" id="vit-${item.id}">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="badge bg-primary-subtle text-primary fw-semibold">${tag}</span>
          <button class="btn btn-sm btn-outline-danger border-0 py-0 px-2" onclick="abrirModalExcluirItem('${item.id}', 'mural_postagens')" title="Excluir vitória">
            <i class="bi bi-trash3"></i>
          </button>
        </div>
        <h6 class="fw-bold text-dark mb-1">${titulo}</h6>
        ${textoConteudo ? `<p class="text-muted small mb-2">${textoConteudo}</p>` : ""}
        <div class="text-end text-danger small fw-semibold">
          ❤️ ${totalCurtidas} Parabéns
        </div>
      </div>
    `;
  }
}
// Abrir modal de exclusão
function abrirModalExcluirItem(id, tabela) {
  itemParaExcluir = { id, tabela };
  const modalEl = document.getElementById("modalConfirmarExclusao");
  if (modalEl) {
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }
}

// Confirmar exclusão no Supabase
async function executarExclusao() {
  if (!itemParaExcluir.id || !itemParaExcluir.tabela) return;

  const { id, tabela } = itemParaExcluir;

  const { error } = await window._supabase.from(tabela).delete().eq("id", id);

  const modalEl = document.getElementById("modalConfirmarExclusao");
  if (modalEl) {
    const instance = bootstrap.Modal.getInstance(modalEl);
    if (instance) instance.hide();
  }

  if (!error) {
    const elVit = document.getElementById(`vit-${id}`);
    if (elVit) elVit.remove();

    const elPub = document.getElementById(`pub-${id}`);
    if (elPub) elPub.remove();

    const qtdEl = document.getElementById("qtd-publicacoes");
    if (qtdEl && tabela === "notes") {
      const novaQtd = Math.max(0, parseInt(qtdEl.innerText || 0) - 1);
      qtdEl.innerText = novaQtd;
    }
  }

  itemParaExcluir = { id: null, tabela: null };
}

// Listener para o botão de confirmação do modal
document.addEventListener("DOMContentLoaded", () => {
  const btnConfirmar = document.getElementById("btn-confirmar-exclusao");
  if (btnConfirmar) {
    btnConfirmar.onclick = executarExclusao;
  }
});

async function carregarContadoresConexoes() {
  try {
    // 1. Conta quantos seguem o usuário logado
    let { count: seguidores } = await window._supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", usuarioId);

    if (seguidores === null || seguidores === 0) {
      const alt = await window._supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("seguido_id", usuarioId);
      if (alt.count !== null && alt.count > 0) seguidores = alt.count;
    }

    // 2. Conta quantos o usuário logado está seguindo
    let { count: seguindo } = await window._supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", usuarioId);

    if (seguindo === null || seguindo === 0) {
      const alt = await window._supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("seguidor_id", usuarioId);
      if (alt.count !== null && alt.count > 0) seguindo = alt.count;
    }

    document.getElementById("qtd-seguidores").innerText = seguidores || 0;
    document.getElementById("qtd-seguindo").innerText = seguindo || 0;
  } catch (err) {
    console.error("Erro ao carregar contadores de conexões:", err);
  }
}

window.abrirModalConexoes = async function (tipo) {
  const titulo = document.getElementById("modalConexoesTitulo");
  const lista = document.getElementById("lista-conexoes");

  if (titulo) {
    titulo.innerText = tipo === "seguidores" ? "Seguidores" : "Seguindo";
  }

  if (lista) {
    lista.innerHTML = `<div class="text-center py-3 text-muted"><div class="spinner-border spinner-border-sm text-primary"></div></div>`;
  }

  const modalEl =
    document.getElementById("modalConexoes") ||
    document.getElementById("modalConexoesPublico");
  if (!modalEl) return;
  const modal =
    bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
  modal.show();

  const idAtual =
    typeof usuarioPerfilId !== "undefined" && usuarioPerfilId
      ? usuarioPerfilId
      : typeof usuarioId !== "undefined"
        ? usuarioId
        : null;

  if (!idAtual) {
    if (lista)
      lista.innerHTML = `<p class="text-center text-muted small m-0 py-3">Erro: ID do usuário não encontrado.</p>`;
    return;
  }

  // Busca todas as conexões
  const { data: todasConexoes, error } = await window._supabase
    .from("follows")
    .select("*");

  if (lista) lista.innerHTML = "";

  if (error || !todasConexoes || todasConexoes.length === 0) {
    if (lista) {
      lista.innerHTML = `<p class="text-center text-muted small m-0 py-3">Nenhum usuário encontrado.</p>`;
    }
    return;
  }

  // Filtra os IDs correspondentes
  let idsUsuarios = [];
  if (tipo === "seguidores") {
    idsUsuarios = todasConexoes
      .filter((item) => item.following_id === idAtual)
      .map((item) => item.follower_id);
  } else {
    idsUsuarios = todasConexoes
      .filter((item) => item.follower_id === idAtual)
      .map((item) => item.following_id);
  }

  if (idsUsuarios.length === 0) {
    if (lista) {
      lista.innerHTML = `<p class="text-center text-muted small m-0 py-3">Nenhum usuário encontrado.</p>`;
    }
    return;
  }

  // Busca os perfis usando "*" para evitar qualquer erro de Bad Request nas colunas
  const { data: perfis, error: erroPerfil } = await window._supabase
    .from("profiles")
    .select("*")
    .in("id", idsUsuarios);

  if (erroPerfil || !perfis || perfis.length === 0) {
    if (lista) {
      lista.innerHTML = `<p class="text-center text-muted small m-0 py-3">Nenhum perfil encontrado.</p>`;
    }
    return;
  }

  // Renderiza os cards idênticos ao estilo da comunidade
  // Renderiza os cards com o indicador de online/offline real
  perfis.forEach((p) => {
    const nomeExibicao = p.nome || p.full_name || "Estudante";
    const bioExibicao = p.bio || "Sem biografia cadastrada.";
    const temFoto = p.avatar_url && p.avatar_url.trim() !== "";

    // Calcula se o usuário esteve ativo nos últimos 10 minutos
    const agora = new Date();
    const ultimaVez = p.last_seen ? new Date(p.last_seen) : null;
    const minutosAtras = ultimaVez ? (agora - ultimaVez) / (1000 * 60) : 999;
    const estaOnline = minutosAtras <= 10;

    // Define a cor e o texto do status com base no cálculo real
    const corIndicador = estaOnline ? "bg-success" : "bg-secondary";
    const tituloStatus = estaOnline ? "Online recentemente" : "Offline";

    const avatarHTML = temFoto
      ? `<img src="${p.avatar_url}" class="rounded-circle object-fit-cover shadow-sm" width="45" height="45" />`
      : `<div class="rounded-circle bg-secondary-subtle d-flex align-items-center justify-content-center shadow-sm" style="width:45px; height:45px;"><i class="bi bi-person-fill text-secondary fs-5"></i></div>`;

    if (lista) {
      lista.innerHTML += `
        <div class="card border border-secondary-subtle p-3 rounded-4 mb-2 shadow-sm user-card-interactive" style="background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); border: 1px solid rgba(0,0,0,0.04) !important; cursor: pointer; transition: all 0.2s ease-in-out;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 .5rem 1rem rgba(0,0,0,.08)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 .125rem .25rem rgba(0,0,0,.075)'" onclick="window.location.href='perfil-publico.html?id=${p.id}'">
          <div class="d-flex align-items-center gap-3">
            <div class="position-relative">
              ${avatarHTML}
              <span class="position-absolute bottom-0 end-0 p-1 ${corIndicador} border border-white rounded-circle" title="${tituloStatus}" style="width: 11px; height: 11px;"></span>
            </div>
            <div class="flex-grow-1 overflow-hidden">
              <h6 class="fw-bold text-dark m-0 text-truncate" style="font-size: 0.95rem;">${nomeExibicao}</h6>
              <small class="text-muted d-block text-truncate mt-1" style="font-size: 0.8rem;">${bioExibicao}</small>
            </div>
            <div class="bg-light rounded-circle p-2 d-flex align-items-center justify-content-center text-primary" style="width: 32px; height: 32px;">
              <i class="bi bi-chevron-right small"></i>
            </div>
          </div>
        </div>
      `;
    }
  });
};
