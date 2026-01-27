package com.coocacer.br;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AgendamentoRepository extends JpaRepository<Agendamento, Long> {
    
    Agendamento findFirstByVeiculoIdAndStatus(Long veiculoId, String status);

    // --- MUDANÇA AQUI: Adicionei IgnoreCase ---
    // Isso faz o banco achar "matheus", "Matheus" ou "MATHEUS"
    List<Agendamento> findByNomeMotoristaIgnoreCase(String nomeMotorista);

    List<Agendamento> findByNomeMotoristaAndStatus(String nomeMotorista, String status);
    List<Agendamento> findByStatus(String status);
}