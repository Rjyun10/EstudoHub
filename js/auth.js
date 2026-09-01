// js/auth.js

// Função auxiliar interna para exibir avisos na tela
function notificar(mensagem, tipo = "danger") {
  if (typeof window.mostrarMensagemTela === "function") {
    window.mostrarMensagemTela(mensagem, tipo);
  } else if (typeof window.mostrarToast === "function") {
    window.mostrarToast(mensagem, tipo);
  } else {
    alert(mensagem);
  }
}

// 1. FUNÇÃO DE CADASTRO
window.cadastrarUsuario = async function (email, senha, nome) {
  try {
    if (!window._supabase) return;

    const { data, error } = await window._supabase.auth.signUp({
      email: email,
      password: senha,
      options: {
        data: {
          nome: nome,
        },
      },
    });

    if (error) {
      let msgTraduzida = error.message;
      if (error.message.includes("User already registered")) {
        msgTraduzida = "Este e-mail já está cadastrado no sistema.";
      } else if (error.message.includes("Password should be at least")) {
        msgTraduzida = "A senha deve ter no mínimo 6 caracteres.";
      }

      notificar("Erro no cadastro: " + msgTraduzida, "danger");
      console.error("Detalhes do erro:", error);
      return;
    }

    notificar(
      "Cadastro realizado! Verifique seu e-mail para confirmar a conta.",
      "success",
    );

    // Como o e-mail precisa ser confirmado, mandamos o usuário para o login após 2 segundos
    setTimeout(() => {
      window.location.replace("login.html");
    }, 2000);

  } catch (err) {
    console.error("Erro inesperado:", err);
    notificar(
      "Ocorreu um erro ao tentar cadastrar. Tente novamente.",
      "danger",
    );
  }
};

// 2. FUNÇÃO DE LOGIN
window.fazerLogin = async function (email, senha) {
  try {
    if (!window._supabase) return;

    const { data, error } = await window._supabase.auth.signInWithPassword({
      email: email,
      password: senha,
    });

    if (error) {
      let msgTraduzida = error.message;
      if (error.message.includes("Invalid login credentials")) {
        msgTraduzida = "E-mail ou senha incorretos.";
      } else if (error.message.includes("Email not confirmed")) {
        msgTraduzida =
          "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.";
      }

      notificar(msgTraduzida, "danger");
      console.error("Detalhes do erro:", error);
      return;
    }

    window.location.replace("index.html");
  } catch (err) {
    console.error("Erro inesperado:", err);
    notificar("Ocorreu um erro ao tentar fazer login.", "danger");
  }
};

// 3. VERIFICAÇÃO DE SESSÃO
window.verificarSessao = async function () {
  try {
    if (!window._supabase) {
      console.error("Supabase client não encontrado em window._supabase");
      return null;
    }

    const { data, error } = await window._supabase.auth.getSession();

    if (error || !data || !data.session) {
      return null;
    }

    return data.session.user;
  } catch (err) {
    console.error("Erro ao verificar sessão:", err);
    return null;
  }
};

// 4. LOGOUT DEFINITIVO
window.fazerLogout = async function () {
  try {
    if (window._supabase) {
      await window._supabase.auth.signOut({ scope: 'global' });
    }
  } catch (err) {
    console.error("Erro ao deslogar:", err);
  }

  // Limpa rigorosamente ambos os storages para evitar resíduos
  localStorage.clear();
  sessionStorage.clear();

  // Força o redirecionamento limpando o histórico da aba
  window.location.replace("login.html");
};

// 5. REGISTRO DE PRESENÇA ONLINE
async function registrarPresencaOnline() {
  if (!window._supabase) return;

  try {
    const {
      data: { user },
    } = await window._supabase.auth.getUser();
    if (!user) return;

    await window._supabase
      .from("profiles")
      .update({ last_seen: new Date().toISOString() })
      .eq("id", user.id);
  } catch (e) {
    // Silencia erros caso não haja usuário ativo
  }
}

// Função centralizada de verificação e proteção de rotas
async function checarProtecaoPagina() {
  if (!window._supabase) return;

  const path = window.location.pathname;
  
  // Agora apenas páginas explicitamente de login/auth são públicas. 
  // A raiz ("/") e o index.html passam a exigir login obrigatoriamente.
  const isLoginPage = path.endsWith("login.html") || path.endsWith("auth.html");

  if (!isLoginPage) {
    const usuario = await window.verificarSessao();
    if (!usuario) {
      window.location.replace("login.html");
      return false;
    }
  }
  return true;
}

// 6. INICIALIZAÇÃO E OUVINTES
document.addEventListener("DOMContentLoaded", async () => {
  // Tratamento especial para quando o usuário clica no link do e-mail de confirmação
  // O Supabase injeta parâmetros na URL (como #access_token=... ou ?code=...)
  const hash = window.location.hash;
  const search = window.location.search;
  
  if (hash.includes("access_token") || search.includes("code=")) {
    // Dá um breve instante para o cliente Supabase processar a URL automaticamente
    setTimeout(async () => {
      const usuario = await window.verificarSessao();
      if (usuario) {
        window.location.replace("index.html");
        return;
      }
    }, 1000);
  }

  const autorizado = await checarProtecaoPagina();
  if (!autorizado) return;

  // Dispara o registro de presença se estiver logado
  registrarPresencaOnline();
  setInterval(registrarPresencaOnline, 2 * 60 * 1000);

  const path = window.location.pathname;
  const isLoginPage = path.endsWith("login.html") || path.endsWith("auth.html");

  // Ouve mudanças no estado de autenticação
  window._supabase.auth.onAuthStateChange((event, session) => {
    if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session) {
      if (isLoginPage || path.endsWith("/")) {
        window.location.replace("index.html");
      }
    }
  });
});

// 7. BLOQUEIO DE CACHE DO NAVEGADOR (PAGESHOW)
// Força a revalidação caso o navegador restaure a página do cache ao trocar/voltar de aba
window.addEventListener("pageshow", async (event) => {
  if (event.persisted) {
    const path = window.location.pathname;
    const isLoginPage = path.endsWith("login.html") || path.endsWith("auth.html") || path.endsWith("/");

    if (!isLoginPage) {
      const usuario = await window.verificarSessao();
      if (!usuario) {
        window.location.replace("login.html");
      }
    }
  }
});