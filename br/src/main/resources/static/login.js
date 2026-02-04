const API_URL = '/usuarios';

document.getElementById('form-login').addEventListener('submit', async function(e) {
    e.preventDefault(); // Não deixa a página recarregar

    const usuarioInput = document.getElementById('usuario').value;
    const senhaInput = document.getElementById('senha').value;
    const btn = document.querySelector('.btn-entrar');

    // Efeito de carregamento no botão
    const textoOriginal = btn.innerText;
    btn.innerText = "Verificando...";
    btn.disabled = true;
    btn.style.opacity = "0.7";

    try {
        // Busca todos os usuários no Java
        const resp = await fetch(API_URL);
        if(!resp.ok) throw new Error("Erro ao conectar no servidor.");
        
        const usuarios = await resp.json();

        // Procura alguém com esse login
        const usuarioEncontrado = usuarios.find(u => u.login === usuarioInput);

        if (usuarioEncontrado) {
            // Verifica a senha (simples)
            // OBS: Se o usuário no banco não tiver senha cadastrada (null), deixa entrar
            const senhaCorreta = usuarioEncontrado.senha ? usuarioEncontrado.senha : "";

            if (senhaInput === senhaCorreta || (senhaCorreta === "" && senhaInput === "")) {
                
                // SUCESSO! Salva e redireciona
                localStorage.setItem('usuarioLogado', JSON.stringify(usuarioEncontrado));
                
                btn.innerText = "Sucesso! Redirecionando...";
                btn.style.background = "#10b981"; // Verde claro
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);

            } else {
                alert("Senha incorreta!");
                restaurarBotao();
            }
        } else {
            alert("Usuário não encontrado!");
            restaurarBotao();
        }

    } catch (erro) {
        console.error(erro);
        alert("Erro de conexão: " + erro.message);
        restaurarBotao();
    }

    function restaurarBotao() {
        btn.innerText = textoOriginal;
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.style.background = "#064e3b";
    }
});