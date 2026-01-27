package com.coocacer.br;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "agendamentos")
public class Agendamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "veiculo_id")
    private Veiculo veiculo;

    @Column(name = "nome_motorista")
    private String nomeMotorista;
    
    @Column(name = "data_retirada")
    private LocalDateTime dataRetirada;

    @Column(name = "km_inicial")
    private Integer kmInicial;

    @Column(name = "data_devolucao")
    private LocalDateTime dataDevolucao;

    @Column(name = "km_final")
    private Integer kmFinal;

    @Column(name = "km_rodados")
    private Integer kmRodados;

    @Lob
    @Column(name = "foto_url", columnDefinition = "LONGTEXT")
    private String fotoUrl;
    
    private String status;

    // --- NOVOS CAMPOS PARA RESERVA ---
    @Column(name = "data_previa_devolucao")
    private LocalDateTime dataPreviaDevolucao;

    @Column(name = "motivo")
    private String motivo;
}