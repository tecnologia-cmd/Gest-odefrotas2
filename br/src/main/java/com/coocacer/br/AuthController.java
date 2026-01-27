package com.coocacer.br;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UsuarioRepository usuarioRepo;

    // LOGIN
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginData dados) {
        
        System.out.println("--- TENTATIVA DE LOGIN ---");
        System.out.println("1. Recebi do site o login: [" + dados.getEmail() + "]");
        System.out.println("2. Recebi do site a senha: [" + dados.getSenha() + "]");

        String loginEnviado = dados.getEmail(); 

        if (loginEnviado == null || loginEnviado.isEmpty()) {
            System.out.println("❌ ERRO: O campo login chegou vazio.");
            return ResponseEntity.status(401).body("O campo de login/email está vazio.");
        }

        // Busca no banco usando o login
        Usuario usuario = usuarioRepo.findByLogin(loginEnviado);

        // Se não achou
        if (usuario == null) {
            System.out.println("❌ ERRO: Usuário não encontrado no banco de dados.");
            return ResponseEntity.status(401).body("Usuário não encontrado.");
        }

        System.out.println("3. Achei o usuário no banco: " + usuario.getNome());
        System.out.println("4. Senha no banco é: [" + usuario.getSenha() + "]");

        // Verifica a senha
        if (!usuario.getSenha().equals(dados.getSenha())) {
            System.out.println("❌ ERRO: As senhas não batem.");
            return ResponseEntity.status(401).body("Senha incorreta.");
        }

        System.out.println("✅ SUCESSO: Login autorizado!");
        
        // Retorna o usuário (escondendo a senha por segurança)
        usuario.setSenha(null); 
        return ResponseEntity.ok(usuario);
    }

    // CADASTRO
    @PostMapping("/cadastro")
    public Usuario criar(@RequestBody Usuario novoUsuario) {
        return usuarioRepo.save(novoUsuario);
    }

    // DTO
    public static class LoginData {
        private String email; 
        private String senha;
        
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        
        public String getSenha() { return senha; }
        public void setSenha(String senha) { this.senha = senha; }
    }
}