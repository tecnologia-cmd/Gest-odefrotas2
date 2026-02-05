package com.coocacer.br;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    
    // Busca usuário pelo login (usado no login)
Usuario findByLogin(String login);

    // ✅ NOVO: Busca usuário pelo nome (usado para validar CNH na reserva)
    Usuario findByNome(String nome);
}