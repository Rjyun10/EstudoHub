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
      "Cadastro realizado! Verifique sua caixa de entrada para confirmar seu e-mail.",
      "success",
    );

    if (data.session) {
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    }
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

    window.location.href = "index.html";
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
      if (!window.location.pathname.includes("login.html")) {
        window.location.href = "login.html";
      }
      return null;
    }

    return data.session.user;
  } catch (err) {
    console.error("Erro ao verificar sessão:", err);
    return null;
  }
};

// 4. LOGOUT CORRIGIDO
window.fazerLogout = async function () {
  if (window._supabase) {
    await window._supabase.auth.signOut();
  }
  // Usa replace para impedir que o botão "Voltar" traga a sessão antiga
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

// 6. INICIALIZAÇÃO E OUVINTE DE AUTH (CORRIGIDO)
document.addEventListener("DOMContentLoaded", () => {
  // Dispara o registro de presença se o supabase já existir
  if (window._supabase) {
    registrarPresencaOnline();
    setInterval(registrarPresencaOnline, 2 * 60 * 1000);

    // Ouve mudanças no estado de autenticação utilizando window._supabase.auth
    window._supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        const path = window.location.pathname;
        if (
          path.endsWith("login.html") ||
          path.endsWith("auth.html") ||
          path === "/"
        ) {
          window.location.href = "index.html";
        }
      }
    });
  }
});
