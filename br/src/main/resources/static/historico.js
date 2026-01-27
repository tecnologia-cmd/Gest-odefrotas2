const API_URL = '/agendamentos';

// --- SEGURANÇA ---
const usuarioLogadoJSON = localStorage.getItem('usuarioLogado');
if (!usuarioLogadoJSON) window.location.href = 'login.html';
const usuario = JSON.parse(usuarioLogadoJSON);

// --- LOGS PARA DESCOBRIR O ERRO ---
console.log("=================================");
console.log(">>> USUÁRIO LOGADO:", usuario.nome);
console.log(">>> CARGO:", usuario.cargo);
console.log("=================================");

async function carregarHistorico() {
    const tbody = document.querySelector('#tabela-historico tbody');
    const loading = document.getElementById('loading');

    try {
        let urlParaChamar = API_URL; // Admin vê tudo

        // SE FOR MEMBRO, FILTRA PELO NOME
        if (usuario.cargo !== 'ADMIN') {
            // Arruma nomes com espaço ou acento
            const nomeSeguro = encodeURIComponent(usuario.nome);
            urlParaChamar = `${API_URL}/usuario/${nomeSeguro}`;
            console.log(">>> MODO MEMBRO ATIVADO");
            console.log(">>> Buscando no Banco por:", usuario.nome);
            console.log(">>> URL gerada:", urlParaChamar);
        } else {
            console.log(">>> MODO ADMIN: Buscando tudo.");
        }

        const resposta = await fetch(urlParaChamar);
        const agendamentos = await resposta.json();
        
        console.log(">>> RESULTADO: O Banco devolveu", agendamentos.length, "registros.");

        loading.style.display = 'none';
        tbody.innerHTML = '';

        if (agendamentos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">
                Nenhum histórico encontrado para <strong>${usuario.nome}</strong>.<br>
                <small>Se você mudou de nome recentemente, seus registros antigos não aparecem.</small>
            </td></tr>`;
            return;
        }

        // Ordena (Mais recente primeiro)
        agendamentos.sort((a, b) => b.id - a.id);

        agendamentos.forEach(item => {
            const linha = document.createElement('tr');
            
            const dataSai = new Date(item.dataRetirada).toLocaleString('pt-BR');
            const dataVolta = item.dataDevolucao ? new Date(item.dataDevolucao).toLocaleString('pt-BR') : '-';
            const kmRodado = item.kmRodados ? `${item.kmRodados} km` : '-';
            
            let statusClass = 'status-ocupado';
            if (item.status === 'FINALIZADO') statusClass = 'status-livre';

            const linkFoto = item.fotoUrl 
                ? `<br><a href="#" onclick="verFoto('${item.fotoUrl}')" style="color:#006400; font-size:0.8em;">📸 Ver Foto</a>` 
                : '';

            linha.innerHTML = `
                <td><strong>${item.nomeMotorista}</strong></td>
                <td>${item.veiculo.modelo}</td>
                <td>${dataSai}</td>
                <td>${dataVolta}</td>
                <td>${kmRodado}</td>
                <td><span class="${statusClass}">${item.status}</span>${linkFoto}</td>
            `;
            tbody.appendChild(linha);
        });

    } catch (erro) {
        console.error(erro);
        loading.innerHTML = '<span style="color:red">Erro ao carregar. Veja o F12.</span>';
    }
}

function verFoto(base64) {
    const w = window.open("");
    w.document.write(`<img src="${base64}" style="max-width:100%">`);
}

carregarHistorico();