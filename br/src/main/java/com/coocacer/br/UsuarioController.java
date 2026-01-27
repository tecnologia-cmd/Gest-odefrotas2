package com.coocacer.br;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/usuarios")
@CrossOrigin(origins = "*")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepo;

    @GetMapping
    public List<Usuario> listar() {
        return usuarioRepo.findAll();
    }

    @PostMapping
    public Usuario salvar(@RequestBody Usuario usuario) {
        return usuarioRepo.save(usuario);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Usuario> buscarPorId(@PathVariable Long id) {
        return usuarioRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Usuario> atualizar(@PathVariable Long id, @RequestBody Usuario dadosNovos) {
        return usuarioRepo.findById(id)
                .map(usuario -> {
                    usuario.setNome(dadosNovos.getNome());
                    usuario.setLogin(dadosNovos.getLogin());
                    usuario.setCargo(dadosNovos.getCargo());
                    usuario.setNumeroCnh(dadosNovos.getNumeroCnh());
                    usuario.setCategoriaCnh(dadosNovos.getCategoriaCnh()); 
                    usuario.setValidadeCnh(dadosNovos.getValidadeCnh());
                    
                    if(dadosNovos.getSenha() != null && !dadosNovos.getSenha().isEmpty()) {
                        usuario.setSenha(dadosNovos.getSenha());
                    }
                    
                    return ResponseEntity.ok(usuarioRepo.save(usuario));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletar(@PathVariable Long id) {
        return usuarioRepo.findById(id)
                .map(usuario -> {
                    usuarioRepo.delete(usuario);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}