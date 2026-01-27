package com.coocacer.br;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VeiculoRepository extends JpaRepository<Veiculo, Long> {
    // Só de fazer isso, você já ganhou métodos como:
    // .save() -> Salva
    // .findAll() -> Busca todos
    // .findById() -> Busca por ID
    // .delete() -> Apaga
}