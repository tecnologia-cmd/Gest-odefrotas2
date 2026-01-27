package com.coocacer.br;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/motoristas")
@CrossOrigin(origins = "*")
public class MotoristaController {

    @Autowired
    private MotoristaRepository repo;

    @PostMapping
    public Motorista cadastrar(@RequestBody Motorista motorista) {
        return repo.save(motorista);
    }

    @GetMapping
    public List<Motorista> listar() {
        return repo.findAll();
    }
    
    @DeleteMapping("/{id}")
    public void excluir(@PathVariable Long id) {
        repo.deleteById(id);
    }
}