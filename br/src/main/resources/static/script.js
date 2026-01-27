const API_BASE = 'http://localhost:8081'; 
const API_VEICULOS = `${API_BASE}/veiculos`;
const API_AGENDAMENTOS = `${API_BASE}/agendamentos`;

// --- LOGIN CHECK ---
const usuarioLogadoJSON = localStorage.getItem('usuarioLogado');
if (!usuarioLogadoJSON) window.location.href = 'login.html';
const usuario = JSON.parse(usuarioLogadoJSON);

const spanNome = document.getElementById('msg-boas-vindas');
if (spanNome && usuario.nome) spanNome.innerText = `Olá, ${usuario.nome.split(' ')[0]}`;

// --- ADMIN CHECK ---
if (usuario.cargo === 'ADMIN') {
    const btnNotif = document.getElementById('btn-notificacao');
    if(btnNotif) btnNotif.style.display = 'inline-block';
    setInterval(verificarPendencias, 5000); 
    verificarPendencias(); 
} else {
    const p = document.getElementById('painel-cadastro'); if(p) p.remove();
    const btnEq = document.getElementById('btn-equipe'); if(btnEq) btnEq.remove();
}

// =======================================================
//  FUNÇÃO NOVA: CARREGAR CARROS (LISTA VERTICAL)
// =======================================================
async function carregarCarros() {
    const divLista = document.getElementById('lista-carros');
    try {
        const resposta = await fetch(API_VEICULOS);
        const carros = await resposta.json();
        
        divLista.innerHTML = ''; // Limpa a lista

        if(carros.length === 0) {
            divLista.innerHTML = '<p style="text-align:center; padding:20px; width:100%">Nenhum veículo cadastrado.</p>';
            return;
        }

        carros.forEach(c => {
            let statusHtml = '';
            let statusClass = ''; // Para a borda colorida (CSS)
            let btnsAcao = '';

            // 1. Define Status e Botões Principais
            if (c.status === 'DISPONIVEL') {
                statusClass = 'status-disponivel'; // Verde
                statusHtml = '<span style="color:#10b981; font-weight:bold;">● Disponível</span>';
                
                btnsAcao = `
                    <button onclick="pegarChave(${c.id})" class="btn-moderno verde">🔑 Pegar</button>
                    <button onclick="abrirAgendar(${c.id}, '${c.modelo}')" class="btn-moderno azul">📅 Agendar</button>
                `;

            } else if (c.status === 'OCUPADO') {
                statusClass = 'status-ocupado'; // Laranja
                statusHtml = '<span style="color:#f59e0b; font-weight:bold;">● Em uso</span>';
                
                btnsAcao = `<button onclick="abrirDevolucao(${c.id}, ${c.kmAtual})" class="btn-moderno vermelho">Devolver ⏎</button>`;

            } else if (c.status === 'MANUTENCAO') {
                statusClass = 'status-manutencao'; // Vermelho
                statusHtml = '<span style="color:#ef4444; font-weight:bold;">● Manutenção</span>';
                // Usuário comum não vê botões aqui
            }

            // 2. Botões de Admin (Aparecem ao lado dos outros)
            let btnsAdmin = '';
            if (usuario.cargo === 'ADMIN') {
                const txtManut = c.status === 'MANUTENCAO' ? '✅ Liberar' : '🛠';
                const classManut = c.status === 'MANUTENCAO' ? 'verde' : 'cinza';
                
                btnsAdmin = `
                    <button onclick="alternarManutencao(${c.id})" class="btn-moderno ${classManut}" title="Manutenção">${txtManut}</button>
                    <button onclick="excluirCarro(${c.id})" class="btn-moderno vermelho" title="Excluir">🗑</button>
                `;
            }

            // 3. Monta o HTML usando as classes do CSS novo (.card-carro, .carro-info, etc)
            divLista.innerHTML += `
                <div class="card-carro ${statusClass}">
                    <div class="carro-info">
                        <h3 class="carro-modelo">${c.modelo}</h3>
                        <div class="carro-dados">
                            <span><strong>Placa:</strong> ${c.placa}</span>
                            <span style="color:#ccc">|</span>
                            <span><strong>KM:</strong> ${c.kmAtual}</span>
                            <span style="color:#ccc">|</span>
                            ${statusHtml}
                        </div>
                    </div>

                    <div class="carro-acoes">
                        ${btnsAcao}
                        ${btnsAdmin}
                    </div>
                </div>
            `;
        });
    } catch (e) { 
        console.error(e); 
        divLista.innerHTML = '<p style="color:red; text-align:center">Erro ao carregar veículos.</p>';
    }
}

// --- RESERVAS E AGENDAMENTOS ---
async function carregarReservas() {
    const area = document.getElementById('area-reservas');
    const lista = document.getElementById('lista-reservas');
    try {
        const resp = await fetch(`${API_AGENDAMENTOS}/reservas/${usuario.nome}`);
        const reservas = await resp.json();
        const ativas = reservas.filter(r => r.status === 'RESERVADO' || r.status === 'PENDENTE');

        if (ativas.length > 0) {
            area.style.display = 'block'; lista.innerHTML = '';
            ativas.forEach(r => {
                const dataF = new Date(r.dataRetirada).toLocaleString('pt-BR');
                let btnHtml = r.status === 'PENDENTE' ? 
                    `<span style="color:#d97706; background:#fffbeb; padding:5px 10px; border-radius:20px; border:1px solid #d97706; font-size:0.8em;">⏳ Aguardando Aprovação</span>` :
                    `<button onclick="iniciarViagem(${r.id})" class="btn-moderno verde" style="width:100%;">Iniciar Agora ▶</button>`;

                lista.innerHTML += `
                    <div style="background:white; padding:15px; border-radius:8px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
                        <span>Reserva <strong>${r.veiculo.modelo}</strong><br><small style="color:#555">${dataF}</small></span>
                        <div style="min-width:150px; text-align:right;">${btnHtml}</div>
                    </div>`;
            });
        } else { area.style.display = 'none'; }
    } catch (e) {}
}

// --- FUNÇÕES DE AÇÃO ---
function pegarChave(id) {
    document.getElementById('id-veiculo-saida').value = id;
    document.getElementById('input-destino').value = '';
    document.getElementById('modal-destino').style.display = 'flex';
    setTimeout(() => document.getElementById('input-destino').focus(), 100);
}

async function confirmarSaida() {
    const id = document.getElementById('id-veiculo-saida').value;
    const destino = document.getElementById('input-destino').value;
    if (!destino || !destino.trim()) { alert("Informe o destino!"); return; }

    try {
        const resp = await fetch(`${API_AGENDAMENTOS}/saida`, {
            method:'POST', headers:{'Content-Type':'application/json'}, 
            body:JSON.stringify({ veiculoId: parseInt(id), motorista: usuario.nome, destino: destino })
        });
        if (!resp.ok) {
            const txt = await resp.text(); let msg = txt; try{ msg = JSON.parse(txt).message || msg }catch(e){}
            throw new Error(msg);
        }
        document.getElementById('modal-destino').style.display = 'none';
        alert(`Solicitação enviada!\nAguarde aprovação.`);
        carregarCarros(); carregarReservas(); 
    } catch (e) { alert("Erro: " + e.message); }
}

// --- DEVOLUÇÃO ---
function abrirDevolucao(id, kmAtual) { 
    document.getElementById('modal-veiculo-id').value = id; 
    document.getElementById('modal-km').value = kmAtual; 
    document.getElementById('modal-foto').value = ''; 
    document.getElementById('preview-foto').style.display = 'none';
    document.getElementById('modal-devolucao').style.display = 'flex'; 
}

async function confirmarDevolucaoComFoto(){
    const id = document.getElementById('modal-veiculo-id').value;
    const novoKm = parseInt(document.getElementById('modal-km').value);
    const fileInput = document.getElementById('modal-foto');

    if(!novoKm && novoKm !== 0){ alert("Informe KM."); return; }

    const payload = { veiculoId: parseInt(id), kmFinal: novoKm, fotoBase64: null };
    const enviar = async () => {
        try {
            const url = `${API_AGENDAMENTOS}/devolucao?cargo=${usuario.cargo}&usuarioLogado=${encodeURIComponent(usuario.nome)}`;
            const r = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
            if(r.ok){ alert("Devolvido!"); fecharModal('modal-devolucao'); carregarCarros(); carregarReservas(); } 
            else { 
                const txt = await r.text(); let msg = txt; try{ msg = JSON.parse(txt).message || msg }catch(e){}
                alert("Erro: " + msg); 
            }
        } catch(e) { alert("Erro conexão."); }
    };

    if(fileInput.files.length > 0){
        comprimirImagem(fileInput.files[0], base64 => { payload.fotoBase64 = base64; enviar(); });
    } else { if(confirm("Sem foto?")) enviar(); }
}

// --- AUXILIARES ---
function fecharModal(id) { document.getElementById(id).style.display='none'; }
function sair(){ localStorage.removeItem('usuarioLogado'); window.location.href='login.html'; }
function comprimirImagem(arquivo, callback){
    const reader = new FileReader(); reader.readAsDataURL(arquivo);
    reader.onload = e => {
        const img = new Image(); img.src = e.target.result;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const scale = 800 / img.width;
            canvas.width = scale < 1 ? 800 : img.width;
            canvas.height = scale < 1 ? img.height * scale : img.height;
            const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            callback(canvas.toDataURL('image/jpeg', 0.7));
        }
    }
}
document.getElementById('modal-foto').addEventListener('change', e => {
    if(e.target.files[0]) comprimirImagem(e.target.files[0], base64 => {
        document.getElementById('preview-foto').src = base64; document.getElementById('preview-foto').style.display = 'block';
    })
});

// =======================================================
//  NOTIFICAÇÕES (ADMIN)
// =======================================================
async function verificarPendencias() { 
    try { 
        const r = await fetch(`${API_AGENDAMENTOS}/pendentes`); 
        if(!r.ok) return; 
        const l = await r.json(); 
        const b = document.getElementById('badge-notificacao'); 
        if(l.length > 0){ b.innerText=l.length; b.style.display='inline-block'; } 
        else{ b.style.display='none'; } 
    } catch(e){} 
}

async function abrirNotificacoes() { 
    const l = document.getElementById('lista-pendentes'); 
    document.getElementById('modal-aprovacao').style.display='flex'; 
    try{ 
        const r = await fetch(`${API_AGENDAMENTOS}/pendentes`); 
        const p = await r.json(); 
        l.innerHTML = ''; 
        if(p.length === 0){ l.innerHTML = '<p style="text-align:center; padding:10px;">Nenhuma solicitação pendente.</p>'; return; } 
        
        p.forEach(item => { 
            const motivo = item.motivo || "Não informado";
            l.innerHTML += `
            <div style="border-bottom:1px solid #eee; padding:15px; margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h4 style="margin:0; font-size:1.1rem; color:#333;">${item.nomeMotorista}</h4>
                    <span style="font-size:0.8rem; background:#e0f2fe; color:#0284c7; padding:2px 8px; border-radius:10px;">
                        ${item.veiculo.modelo}
                    </span>
                </div>
                <div style="background:#f0fdf4; border:1px solid #bbf7d0; color:#166534; padding:10px; border-radius:6px; margin:10px 0; font-size:0.95rem;">
                    <strong>📍 Destino:</strong> ${motivo}
                </div>
                <div style="display:flex; gap:10px; margin-top:5px;">
                    <button onclick="aprovar(${item.id})" class="btn-moderno verde" style="flex:1;">✔ Aprovar</button>
                    <button onclick="rejeitar(${item.id})" class="btn-moderno vermelho" style="flex:1;">✖ Rejeitar</button>
                </div>
            </div>`; 
        }); 
    }catch(e){ console.error(e); } 
}

async function aprovar(id) { 
    if(confirm("Aprovar solicitação?")) { 
        await fetch(`${API_AGENDAMENTOS}/aprovar/${id}`, {method:'POST'}); 
        alert("Aprovado com sucesso!"); 
        fecharModal('modal-aprovacao'); 
        verificarPendencias(); 
        carregarReservas(); 
    } 
}

async function rejeitar(id) { 
    if(confirm("Rejeitar solicitação?")) { 
        await fetch(`${API_AGENDAMENTOS}/rejeitar/${id}`, {method:'DELETE'}); 
        alert("Solicitação rejeitada."); 
        fecharModal('modal-aprovacao'); 
        verificarPendencias(); 
        carregarReservas(); 
        carregarCarros();
    } 
}

// OUTRAS FUNÇÕES
async function cadastrarCarro() { const m=document.getElementById('modelo').value; const p=document.getElementById('placa').value; const k=document.getElementById('km').value; if(!m) return; await fetch(API_VEICULOS, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({modelo:m, placa:p, kmAtual:parseInt(k)||0, status:"DISPONIVEL"}) }); alert("Cadastrado!"); carregarCarros(); }
function abrirAgendar(id, modelo) { document.getElementById('agenda-veiculo-id').value = id; document.getElementById('agenda-nome-carro').innerText = modelo; document.getElementById('modal-agendar').style.display = 'flex'; }
function verificarDatas() { const s=document.getElementById('agenda-data-saida').value; const v=document.getElementById('agenda-data-volta').value; if(s&&v) document.getElementById('div-motivo').style.display = s.split('T')[0]!==v.split('T')[0]?'block':'none'; }
async function confirmarAgendamento() { const id = document.getElementById('agenda-veiculo-id').value; const s = document.getElementById('agenda-data-saida').value; const v = document.getElementById('agenda-data-volta').value; const m = document.getElementById('agenda-motivo').value; if(!s || !v) return alert("Selecione datas."); let mf = "Uso no dia"; if(document.getElementById('div-motivo').style.display === 'block') { if(!m.trim()) return alert("Motivo obrigatório!"); mf = m; } try { const resp = await fetch(`${API_AGENDAMENTOS}/reservar`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ veiculoId: parseInt(id), motorista: usuario.nome, dataRetirada: s, dataDevolucao: v, motivo: mf }) }); if(resp.ok) { alert("Solicitado!"); fecharModal('modal-agendar'); carregarReservas(); } else { alert("Erro ao agendar."); } } catch(e) {} }
async function iniciarViagem(id) { if(!confirm("Iniciar?")) return; await fetch(`${API_AGENDAMENTOS}/iniciar/${id}?cargo=${usuario.cargo}`, {method:'POST'}); carregarReservas(); carregarCarros(); }
async function excluirCarro(id) { if(confirm("Excluir?")) await fetch(`${API_VEICULOS}/${id}`, {method:'DELETE'}); carregarCarros(); }
async function alternarManutencao(id) { await fetch(`${API_VEICULOS}/${id}/manutencao`, {method:'POST'}); carregarCarros(); }

// INICIALIZAÇÃO
carregarCarros();
carregarReservas();