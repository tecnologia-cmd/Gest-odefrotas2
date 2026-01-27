package com.coocacer.br;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data // Gera Getters, Setters e ToString automaticamente
@Entity // Define que esta classe é uma tabela
@Table(name = "veiculos") // Nome da tabela no banco
public class Veiculo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String modelo;    // Ex: Fiat Strada
    private String placa;     // Ex: ABC-1234
    private Integer kmAtual;  // Ex: 50000
    private String status;    // Ex: "DISPONIVEL" ou "OCUPADO"

    
}