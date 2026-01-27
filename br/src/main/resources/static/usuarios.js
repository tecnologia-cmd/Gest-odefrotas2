const API_URL = '/usuarios';

// --- SEGURANÇA ---
const usuarioLogadoJSON = localStorage.getItem('usuarioLogado');
if (!usuarioLogadoJSON) window.location.href = 'login.html';
const usuarioLogado = JSON.parse(usuarioLogadoJSON);

if (usuarioLogado.cargo !== 'ADMIN') {
    alert("⛔ ACESSO NEGADO! Apenas administradores podem gerenciar a equipe.");
    window.location.href = 'index.html';
    throw new Error("Acesso negado.");
}

// --- CARREGAR USUÁRIOS ---
async function carregarUsuarios() {
    const divLista = document.getElementById('lista-usuarios');
    divLista.innerHTML = '<p style="text-align:center">Carregando...</p>';

    try {
        const resposta = await fetch(API_URL);
        const usuarios = await resposta.json();
        
        divLista.innerHTML = '';
        if(usuarios.length === 0) { 
            divLista.innerHTML = '<p style="text-align:center">Nenhum usuário cadastrado.</p>'; 
            return; 
        }
        
        // Monta a Tabela
        const tabela = document.createElement('table');
        tabela.style.width = '100%';
        tabela.innerHTML = `
            <thead>
                <tr>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>Cargo</th>
                    <th style="text-align:center">Ações</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        
        const tbody = tabela.querySelector('tbody');
        
        usuarios.forEach(user => {
            const tr = document.createElement('tr');
            const corCargo = user.cargo === 'ADMIN' ? '#DA291C' : '#006838';
            
            // AQUI ESTÁ O BOTÃO DE EDITAR (AZUL)
            tr.innerHTML = `
                <td>${user.nome}</td>
                <td>${user.email}</td>
                <td><span style="font-weight:bold; color:${corCargo}">${user.cargo}</span></td>
                <td style="display:flex; gap:10px; justify-content:center;">
                    <button onclick="prepararEdicao('${user.id}', '${user.nome}', '${user.email}', '${user.cargo}')" 
                            class="btn-moderno azul" style="padding:5px 15px; font-size:0.75rem;">
                            ✏ Editar
                    </button>
                    <button onclick="excluirUsuario(${user.id})" 
                            class="btn-moderno vermelho" style="padding:5px 15px; font-size:0.75rem;">
                            🗑 Excluir
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        divLista.appendChild(tabela);
    } catch (erro) { console.error(erro); }
}

// --- SALVAR (CRIAR OU ATUALIZAR) ---
async function salvarUsuario() {
    // Pega o ID escondido (se tiver valor, é edição. Se não, é novo)
    const id = document.getElementById('usuario-id').value;
    
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const cargo = document.getElementById('cargo').value;

    if (!nome || !email) return alert("Por favor, preencha Nome e E-mail.");
    
    // Se for novo cadastro, exige senha. Se for edição, senha é opcional.
    if (!id && !senha) return alert("Crie uma senha para o novo usuário.");

    const dados = { nome, email, senha, cargo };

    // Define se vai criar (POST) ou atualizar (PUT)
    const metodo = id ? 'PUT' : 'POST';
    const urlFinal = id ? `${API_URL}/${id}` : API_URL;

    try {
        const resp = await fetch(urlFinal, { 
            method: metodo, 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(dados) 
        });

        if (resp.ok) {
            alert(id ? "Dados atualizados com sucesso!" : "Usuário cadastrado com sucesso!");
            limparFormulario(); // Limpa tudo e volta ao estado normal
            carregarUsuarios(); // Recarrega a tabela
        } else {
            alert("Erro ao salvar. Verifique os dados.");
        }
    } catch (e) { alert("Erro de conexão."); }
}

// --- FUNÇÃO PARA EXCLUIR ---
async function excluirUsuario(id) {
    if(!confirm("Tem certeza que deseja remover este usuário permanentemente?")) return;
    try {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        carregarUsuarios();
    } catch(e) { alert("Erro ao excluir."); }
}

// --- FUNÇÕES DE CONTROLE DE FORMULÁRIO ---

function prepararEdicao(id, nome, email, cargo) {
    document.getElementById('usuario-id').value = id;
    document.getElementById('nome').value = nome;
    document.getElementById('email').value = email;
    document.getElementById('cargo').value = cargo;
    document.getElementById('senha').value = ""; 

    // Muda o visual para o Admin saber que está editando
    document.getElementById('titulo-form').innerText = "✏ Editando Usuário: " + nome;
    document.getElementById('titulo-form').style.color = "#0284c7"; 
    
    const btn = document.getElementById('btn-salvar');
    btn.innerText = "💾 Salvar Alterações";
    btn.className = "btn-moderno azul"; 

    document.getElementById('btn-cancelar').style.display = 'inline-flex';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelarEdicao() {
    limparFormulario();
}

function limparFormulario() {
    document.getElementById('usuario-id').value = "";
    document.getElementById('nome').value = "";
    document.getElementById('email').value = "";
    document.getElementById('senha').value = "";
    document.getElementById('cargo').value = "MEMBRO";

    document.getElementById('titulo-form').innerText = "👤 Novo Membro";
    document.getElementById('titulo-form').style.color = "var(--verde-coocacer)";

    const btn = document.getElementById('btn-salvar');
    btn.innerText = "Cadastrar";
    btn.className = "btn-moderno verde";

    document.getElementById('btn-cancelar').style.display = 'none';
}

// Inicializa a tela
carregarUsuarios();