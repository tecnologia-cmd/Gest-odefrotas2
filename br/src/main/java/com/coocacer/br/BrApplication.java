package com.coocacer.br;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

// OBS: Apagamos os imports manuais porque as classes estão na mesma pasta!

@SpringBootApplication
public class BrApplication {

    public static void main(String[] args) {
        SpringApplication.run(BrApplication.class, args);
    }

    @Bean
    public CommandLineRunner demo(UsuarioRepository repository) {
        return (args) -> {
            // Se o banco estiver vazio, cria o admin
            if (repository.count() == 0) {
                Usuario admin = new Usuario();
                
                // IMPORTANTE: Se o Java reclamar de "setLogin" ou "setSenha",
                // verifique no seu arquivo Usuario.java se os nomes são esses mesmo.
                admin.setLogin("matheus.luiz");
                admin.setSenha("123456"); 
                
                repository.save(admin);
                
                System.out.println(">>> ADMIN CRIADO: matheus.luiz / 123456 <<<");
            }
        };
    }
}