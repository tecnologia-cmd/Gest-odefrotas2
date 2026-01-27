package com.coocacer.br;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/veiculos")
@CrossOrigin(origins = "*")
public class VeiculoController {

    @Autowired
    private VeiculoRepository veiculoRepo;

    // LISTAR (Esconde os excluídos)
    @GetMapping
    public List<Veiculo> listar() {
        return veiculoRepo.findAll().stream()
                .filter(v -> !"EXCLUIDO".equals(v.getStatus()))
                .collect(Collectors.toList());
    }

    @PostMapping
    public Veiculo salvar(@RequestBody Veiculo veiculo) {
        if(veiculo.getStatus() == null) veiculo.setStatus("DISPONIVEL");
        return veiculoRepo.save(veiculo);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Veiculo> buscarPorId(@PathVariable Long id) {
        return veiculoRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Veiculo> atualizar(@PathVariable Long id, @RequestBody Veiculo dados) {
        return veiculoRepo.findById(id)
                .map(veiculo -> {
                    veiculo.setModelo(dados.getModelo());
                    veiculo.setPlaca(dados.getPlaca());
                    veiculo.setKmAtual(dados.getKmAtual());
                    if(dados.getStatus() != null) veiculo.setStatus(dados.getStatus());
                    return ResponseEntity.ok(veiculoRepo.save(veiculo));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // EXCLUSÃO INTELIGENTE (Resolve seu erro de SQL)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletar(@PathVariable Long id) {
        return veiculoRepo.findById(id)
                .map(veiculo -> {
                    veiculo.setStatus("EXCLUIDO");
                    veiculoRepo.save(veiculo);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/manutencao")
    public ResponseEntity<?> alternarManutencao(@PathVariable Long id) {
        return veiculoRepo.findById(id).map(v -> {
            if ("MANUTENCAO".equals(v.getStatus())) {
                v.setStatus("DISPONIVEL");
            } else if ("DISPONIVEL".equals(v.getStatus())) {
                v.setStatus("MANUTENCAO");
            }
            veiculoRepo.save(v);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}