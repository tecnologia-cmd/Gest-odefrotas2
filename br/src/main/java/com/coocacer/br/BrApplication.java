package com.coocacer.br;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class BrApplication {

    public static void main(String[] args) {
        SpringApplication.run(BrApplication.class, args);
    }

    @Bean
    public CommandLineRunner demo(UsuarioRepository repository) {
        return (args) -> {
            // Se não tiver ninguém no banco, cria o Chefe
            if (repository.count() == 0) {
                Usuario admin = new Usuario();
                
                admin.setLogin("matheus.luiz");
                admin.setSenha("123456"); 
                
                // --- AQUI ESTÁ O SEGREDO DO ADM ---
                // Tente uma dessas opções (depende de como está no seu Usuario.java):
                
                // Opção A (Mais provável, baseado no seu javascript):
                admin.setCargo("ADMIN"); 
                
                // Opção B (Se a linha de cima ficar vermelha, tente esta):
                // admin.setPerfil("ADMIN");
                
                // Opção C (Se usar Spring Security Roles):
                // admin.setRole("ROLE_ADMIN");

                // admin.setNome("Matheus Admin"); // Opcional

                repository.save(admin);
                
                System.out.println(">>> ADMIN SUPREMO CRIADO: matheus.luiz <<<");
            }
        };
    }
}