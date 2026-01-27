package com.coocacer.br;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    // Quando alguém acessar a raiz (http://localhost:8081/)
    @GetMapping("/")
    public String home() {
        // Redireciona automaticamente para o arquivo do site
        return "redirect:/index.html";
    }
}