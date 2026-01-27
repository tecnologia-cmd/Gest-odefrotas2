package com.coocacer.br;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/agendamentos")
@CrossOrigin(origins = "*")
public class AgendamentoController {

    @Autowired
    private AgendamentoRepository agendamentoRepo;

    @Autowired
    private VeiculoRepository veiculoRepo;

    @Autowired
    private UsuarioRepository usuarioRepo;

    // ====================================================================
    // 1. LISTAGEM (HISTÓRICO E RESERVAS)
    // ====================================================================
    
    // Lista TUDO (Usado no Histórico)
    @GetMapping
    public List<Agendamento> listar() { 
        return agendamentoRepo.findAll(); 
    }

    // Lista apenas as do usuário logado
    @GetMapping("/reservas/{nome}")
    public List<Agendamento> listarReservas(@PathVariable String nome) { 
        return agendamentoRepo.findByNomeMotoristaIgnoreCase(nome); 
    }

    // Lista pendentes para o ADMIN aprovar
    @GetMapping("/pendentes")
    public List<Agendamento> listarPendentes() { 
        return agendamentoRepo.findByStatus("PENDENTE"); 
    }

    // --- VALIDAÇÃO CNH (Privado) ---
    private void validarCnhDoMotorista(String nomeMotorista) {
        Usuario usuario = usuarioRepo.findByNome(nomeMotorista);
        if (usuario == null) throw new RuntimeException("Usuário não encontrado.");
        if (usuario.getValidadeCnh() == null) throw new RuntimeException("Validade da CNH não cadastrada.");
        if (usuario.getValidadeCnh().isBefore(LocalDate.now())) throw new RuntimeException("CNH Vencida! Renove para utilizar a frota.");
    }

    // ====================================================================
    // 2. SAÍDA IMEDIATA (COM VALIDAÇÃO DE DESTINO)
    // ====================================================================
    @PostMapping("/saida")
    public ResponseEntity<?> registrarSaida(@RequestBody DadosSaidaManual dados) {
        try {
            validarCnhDoMotorista(dados.getMotorista());

            Veiculo carro = veiculoRepo.findById(dados.getVeiculoId())
                .orElseThrow(() -> new RuntimeException("Veículo não encontrado."));

            if (!"DISPONIVEL".equals(carro.getStatus())) {
                return ResponseEntity.status(400).body("Veículo não está disponível.");
            }

            Agendamento agenda = new Agendamento();
            agenda.setVeiculo(carro);
            agenda.setNomeMotorista(dados.getMotorista());
            agenda.setDataRetirada(LocalDateTime.now());
            agenda.setDataPreviaDevolucao(LocalDateTime.now().plusHours(2)); // Previsão padrão de 2h
            agenda.setKmInicial(carro.getKmAtual());
            agenda.setStatus("PENDENTE"); // Aguarda aprovação do Admin (ou mude para EM_USO se for direto)

            // SALVA O DESTINO CORRETAMENTE NO CAMPO MOTIVO
            if (dados.getDestino() != null && !dados.getDestino().isEmpty()) {
                agenda.setMotivo(dados.getDestino());
            } else {
                agenda.setMotivo("Saída Imediata (Sem destino informado)");
            }

            return ResponseEntity.ok(agendamentoRepo.save(agenda));

        } catch (Exception e) {
            return ResponseEntity.status(400).body(e.getMessage());
        }
    }

    // ====================================================================
    // 3. RESERVA FUTURA (AGENDAMENTO)
    // ====================================================================
    @PostMapping("/reservar")
    public Agendamento criarReserva(@RequestBody DadosReserva dados) {
        validarCnhDoMotorista(dados.getMotorista());
        
        Veiculo carro = veiculoRepo.findById(dados.getVeiculoId()).orElseThrow();
        
        Agendamento agenda = new Agendamento();
        agenda.setVeiculo(carro);
        agenda.setNomeMotorista(dados.getMotorista());
        agenda.setDataRetirada(dados.getDataRetirada());
        agenda.setDataPreviaDevolucao(dados.getDataDevolucao());
        agenda.setMotivo(dados.getMotivo());
        agenda.setStatus("PENDENTE"); // Sempre nasce pendente
        
        return agendamentoRepo.save(agenda);
    }

    // ====================================================================
    // 4. INICIAR VIAGEM (Mudança de status para EM_USO)
    // ====================================================================
    @PostMapping("/iniciar/{id}")
    public Agendamento iniciarViagem(@PathVariable Long id, @RequestParam(defaultValue = "COMUM") String cargo) {
        Agendamento agenda = agendamentoRepo.findById(id).orElseThrow();
        
        // Regra: Só inicia se for ADMIN ou se já estiver RESERVADO (Aprovado)
        if (!"RESERVADO".equals(agenda.getStatus()) && !"ADMIN".equals(cargo)) {
            throw new RuntimeException("Aguarde a aprovação do Administrador.");
        }

        Veiculo carro = agenda.getVeiculo();
        if ("OCUPADO".equals(carro.getStatus())) throw new RuntimeException("Veículo já está ocupado por outro usuário.");

        // ATENÇÃO: Mudamos para 'EM_USO' para bater com o Frontend
        agenda.setStatus("EM_USO");
        agenda.setDataRetirada(LocalDateTime.now()); // Atualiza hora real da saída
        agenda.setKmInicial(carro.getKmAtual());
        
        carro.setStatus("OCUPADO");
        veiculoRepo.save(carro);
        
        return agendamentoRepo.save(agenda);
    }

    // ====================================================================
    // 5. DEVOLUÇÃO (Mudança de status para DEVOLVIDO)
    // ====================================================================
    @PostMapping("/devolucao")
    public Agendamento registrarDevolucao(@RequestBody DadosDevolucao dados) {
        // Procura viagem com status 'EM_USO' (Padronizado)
        Agendamento agenda = agendamentoRepo.findFirstByVeiculoIdAndStatus(dados.getVeiculoId(), "EM_USO");
        
        // Backup: Se não achar, tenta achar uma RESERVADA antiga (caso tenha pulado etapas)
        if (agenda == null) {
            agenda = agendamentoRepo.findFirstByVeiculoIdAndStatus(dados.getVeiculoId(), "RESERVADO");
        }
        
        if (agenda == null) throw new RuntimeException("Nenhuma viagem ativa encontrada. Verifique se clicou em 'Iniciar'.");

        int kmFinal = dados.getKmFinal() != null ? dados.getKmFinal() : agenda.getKmInicial();
        
        if (kmFinal < agenda.getKmInicial()) {
            throw new RuntimeException("Erro: KM Final não pode ser menor que o Inicial!");
        }

        agenda.setKmFinal(kmFinal);
        agenda.setKmRodados(kmFinal - agenda.getKmInicial());
        agenda.setDataDevolucao(LocalDateTime.now());
        
        // ATENÇÃO: Mudamos para 'DEVOLVIDO' para bater com o Frontend
        agenda.setStatus("DEVOLVIDO");
        agenda.setFotoUrl(dados.getFotoBase64());

        Veiculo carro = agenda.getVeiculo();
        carro.setKmAtual(kmFinal);
        carro.setStatus("DISPONIVEL");
        veiculoRepo.save(carro);
        
        return agendamentoRepo.save(agenda);
    }

    // ====================================================================
    // 6. APROVAÇÃO E REJEIÇÃO (ADMIN)
    // ====================================================================
    @PostMapping("/aprovar/{id}")
    public Agendamento aprovar(@PathVariable Long id) {
        Agendamento a = agendamentoRepo.findById(id).orElseThrow();
        a.setStatus("RESERVADO");
        return agendamentoRepo.save(a);
    }

    @DeleteMapping("/rejeitar/{id}")
    public void rejeitar(@PathVariable Long id) { 
        agendamentoRepo.deleteById(id); 
    }

    // ====================================================================
    // DTOs (Dados que vêm do Front)
    // ====================================================================
    public static class DadosSaidaManual {
        private Long veiculoId;
        private String motorista;
        private String destino; 

        public Long getVeiculoId() { return veiculoId; }
        public void setVeiculoId(Long id) { this.veiculoId = id; }
        public String getMotorista() { return motorista; }
        public void setMotorista(String m) { this.motorista = m; }
        public String getDestino() { return destino; } 
        public void setDestino(String d) { this.destino = d; }
    }

    public static class DadosReserva {
        private Long veiculoId; private String motorista; private LocalDateTime dataRetirada; private LocalDateTime dataDevolucao; private String motivo;
        public Long getVeiculoId() { return veiculoId; } public void setVeiculoId(Long id) { this.veiculoId = id; }
        public String getMotorista() { return motorista; } public void setMotorista(String m) { this.motorista = m; }
        public LocalDateTime getDataRetirada() { return dataRetirada; } public void setDataRetirada(LocalDateTime d) { this.dataRetirada = d; }
        public LocalDateTime getDataDevolucao() { return dataDevolucao; } public void setDataDevolucao(LocalDateTime d) { this.dataDevolucao = d; }
        public String getMotivo() { return motivo; } public void setMotivo(String m) { this.motivo = m; }
    }

    public static class DadosDevolucao {
        private Long veiculoId; private Integer kmFinal; private String fotoBase64;
        public Long getVeiculoId() { return veiculoId; } public void setVeiculoId(Long id) { this.veiculoId = id; }
        public Integer getKmFinal() { return kmFinal; } public void setKmFinal(Integer k) { this.kmFinal = k; }
        public String getFotoBase64() { return fotoBase64; } public void setFotoBase64(String f) { this.fotoBase64 = f; }
    }
}