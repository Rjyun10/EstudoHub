let usuarioLogadoId = null;
let usuarioPerfilId = null;

document.addEventListener("DOMContentLoaded", async () => {
  const user = await window.verificarSessao();
  if (user) usuarioLogadoId = user.id;

  const urlParams = new URLSearchParams(window.location.search);
  usuarioPerfilId = urlParams.get("id");

  if (!usuarioPerfilId) {
    alert("Usuário não encontrado.");
    window.location.href = "feed.html";
    return;
  }

  if (usuarioLogadoId && usuarioLogadoId === usuarioPerfilId) {
    window.location.href = "perfil.html";
    return;
  }

  await carregarPerfilPublico();
  await carregarPublicacoesPublicas();
  await carregarVitoriasPublicas();
  await carregarContadores();
  await verificarSeJaSegue();
});

function alternarAba(aba) {
  const btnPub = document.getElementById("tab-publicacoes");
  const btnVit = document.getElementById("tab-vitorias");
  const containerPub = document.getElementById("conteudo-publicacoes");
  const containerVit = document.getElementById("conteudo-vitorias");

  if (aba === "publicacoes") {
    btnPub?.classList.add("active");
    btnVit?.classList.remove("active");
    containerPub?.classList.remove("d-none");
    containerVit?.classList.add("d-none");
  } else {
    btnVit?.classList.add("active");
    btnPub?.classList.remove("active");
    containerVit?.classList.remove("d-none");
    containerPub?.classList.add("d-none");
  }
}

function capitalizarPrimeiraLetra(texto) {
  if (!texto || typeof texto !== "string") return "";
  const limpo = texto.trim();
  if (limpo.length === 0) return "";

  // Deixa a primeira letra maiúscula e mantém o restante do texto legível
  return limpo.charAt(0).toUpperCase() + limpo.slice(1);
}

async function carregarPerfilPublico() {
  const { data: profile } = await window._supabase
    .from("profiles")
    .select("*")
    .eq("id", usuarioPerfilId)
    .single();

  if (profile) {
    const elNome = document.getElementById("perfil-nome");
    const elBio = document.getElementById("perfil-bio");
    const elMeta = document.getElementById("perfil-meta");
    const elCurso = document.getElementById("perfil-curso");

    if (elNome)
      elNome.innerText = profile.nome || profile.full_name || "Estudante";
    if (elBio) elBio.innerText = profile.bio || "Sem biografia cadastrada.";
    if (elMeta)
      elMeta.innerText = profile.meta
        ? `🎯 Meta: ${profile.meta}`
        : "🎯 Meta não definida";

    if (elCurso && profile.curso) {
      elCurso.innerHTML = `<i class="bi bi-mortarboard me-1"></i> ${profile.curso}`;
    }

    if (profile.avatar_url && profile.avatar_url.trim() !== "") {
      const imgFoto = document.getElementById("perfil-foto-img");
      const iconeFoto = document.getElementById("perfil-foto-icone");
      if (imgFoto) {
        imgFoto.src = profile.avatar_url;
        imgFoto.classList.remove("d-none");
      }
      if (iconeFoto) iconeFoto.classList.add("d-none");
    }
  }
}

async function carregarPublicacoesPublicas() {
  const container = document.getElementById("conteudo-publicacoes");
  if (!container) return;

  // Busca as publicações da tabela notes
  let { data: publicacoes } = await window._supabase
    .from("notes")
    .select("*")
    .eq("user_id", usuarioPerfilId)
    .order("created_at", { ascending: false });

  if (!publicacoes || publicacoes.length === 0) {
    const retry = await window._supabase
      .from("notes")
      .select("*")
      .eq("usuario_id", usuarioPerfilId)
      .order("created_at", { ascending: false });
    if (retry.data && retry.data.length > 0) publicacoes = retry.data;
  }

  const qtd = publicacoes ? publicacoes.length : 0;
  const qtdEl = document.getElementById("qtd-publicacoes");
  if (qtdEl) qtdEl.innerText = qtd;

  container.innerHTML = "";

  if (!publicacoes || publicacoes.length === 0) {
    container.innerHTML = `<div class="col-12 text-center py-4 text-muted bg-white rounded-4 shadow-sm"><small>Este usuário ainda não possui cadernos públicos.</small></div>`;
    return;
  }

  for (const item of publicacoes) {
    let totalCurtidas = item.likes_count || 0;

    const { count } = await window._supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("note_id", item.id);

    if (count !== null && count !== undefined) {
      totalCurtidas = count;
    }

    // Aplicando a capitalização na primeira letra de cada campo
    const tag = capitalizarPrimeiraLetra(
      item.materia || item.subject || "Geral",
    );
    const titulo = capitalizarPrimeiraLetra(
      item.titulo || item.title || "Nota sem título",
    );
    const textoConteudo = capitalizarPrimeiraLetra(
      item.conteudo_texto || item.descricao || item.content || "",
    );

    container.innerHTML += `
      <div class="col-md-6" id="pub-${item.id}">
        <div class="card border border-secondary-subtle shadow-sm rounded-4 p-3 bg-white h-100 position-relative">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="badge bg-primary-subtle text-primary fw-semibold">${tag}</span>
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

async function carregarVitoriasPublicas() {
  const container = document.getElementById("conteudo-vitorias");
  if (!container) return;

  container.innerHTML = `<div class="text-center py-4 text-muted"><div class="spinner-border spinner-border-sm text-primary"></div></div>`;

  // Busca na tabela mural_postagens
  let { data: vitorias, error } = await window._supabase
    .from("mural_postagens")
    .select("*")
    .eq("user_id", usuarioPerfilId)
    .order("created_at", { ascending: false });

  if ((!vitorias || vitorias.length === 0) && !error) {
    const retry = await window._supabase
      .from("mural_postagens")
      .select("*")
      .eq("usuario_id", usuarioPerfilId)
      .order("created_at", { ascending: false });
    if (retry.data && retry.data.length > 0) vitorias = retry.data;
  }

  container.innerHTML = "";

  if (!vitorias || vitorias.length === 0) {
    container.innerHTML = `<div class="col-12 text-center py-4 text-muted bg-white rounded-4 shadow-sm"><small>Nenhuma vitória cadastrada ainda.</small></div>`;
    return;
  }

  for (const v of vitorias) {
    let totalCurtidas = v.likes_count || 0;

    const { count } = await window._supabase
      .from("mural_curtidas")
      .select("*", { count: "exact", head: true })
      .eq("post_id", v.id);

    if (count !== null && count !== undefined) {
      totalCurtidas = count;
    }

    const titulo = capitalizarPrimeiraLetra(
      v.titulo || v.title || "Vitória 🎉",
    );
    const mensagem = capitalizarPrimeiraLetra(
      v.mensagem || v.descricao || v.content || "",
    );
    const badgeTipo = v.tipo_conquista
      ? `<span class="badge bg-success-subtle text-success border border-success-subtle rounded-pill mb-1">${v.tipo_conquista}</span>`
      : "";

    container.innerHTML += `
      <div class="card border border-secondary-subtle shadow-sm rounded-4 p-3 bg-white mb-2">
        <div class="d-flex align-items-start gap-3">
          <div class="fs-3">🏆</div>
          <div class="flex-grow-1">
            ${badgeTipo}
            <h6 class="fw-bold text-dark m-0">${titulo}</h6>
            ${mensagem ? `<small class="text-muted d-block mt-1">${mensagem}</small>` : ""}
          </div>
          <div class="text-end text-danger small fw-semibold align-self-end">
            ❤️ ${totalCurtidas} Curtidas
          </div>
        </div>
      </div>
    `;
  }
}

async function carregarContadores() {
  let resSeguidores = await window._supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", usuarioPerfilId);

  if (resSeguidores.count === null) {
    resSeguidores = await window._supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("seguido_id", usuarioPerfilId);
  }

  let resSeguindo = await window._supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", usuarioPerfilId);

  if (resSeguindo.count === null) {
    resSeguindo = await window._supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("seguidor_id", usuarioPerfilId);
  }

  const elSeguidores = document.getElementById("qtd-seguidores");
  const elSeguindo = document.getElementById("qtd-seguindo");

  if (elSeguidores) elSeguidores.innerText = resSeguidores.count || 0;
  if (elSeguindo) elSeguindo.innerText = resSeguindo.count || 0;
}

async function verificarSeJaSegue() {
  if (!usuarioLogadoId) return;

  const { data } = await window._supabase
    .from("follows")
    .select("*")
    .eq("follower_id", usuarioLogadoId)
    .eq("following_id", usuarioPerfilId);

  const btn = document.getElementById("btn-seguir");
  if (!btn) return;

  if (data && data.length > 0) {
    btn.className = "btn btn-outline-secondary rounded-pill px-4 fw-bold";
    btn.innerText = "Seguindo";
  } else {
    btn.className = "btn btn-primary rounded-pill px-4 fw-bold";
    btn.innerText = "+ Seguir";
  }
}

async function alternarSeguir() {
  if (!usuarioLogadoId) return;

  const btn = document.getElementById("btn-seguir");
  if (btn) btn.disabled = true;

  const { data } = await window._supabase
    .from("follows")
    .select("*")
    .eq("follower_id", usuarioLogadoId)
    .eq("following_id", usuarioPerfilId);

  if (data && data.length > 0) {
    await window._supabase.from("follows").delete().eq("id", data[0].id);
  } else {
    await window._supabase
      .from("follows")
      .insert([
        { follower_id: usuarioLogadoId, following_id: usuarioPerfilId },
      ]);
  }

  await verificarSeJaSegue();
  await carregarContadores();
  if (btn) btn.disabled = false;
}

window.abrirModalConexoesPublico = async function (tipo) {
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
