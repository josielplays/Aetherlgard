# Aetherlgard: Chronicles

Protótipo de action game 2D em HTML5 Canvas, com progressão por mundos, seleção de herói, sistema de cristais, loja e boss final.

## Como rodar

Como é um projeto front-end puro, você pode abrir o arquivo `aethelgardsemtexturas.html` no navegador.

Opcionalmente, para evitar restrições de alguns navegadores, rode com servidor local:

- VS Code + Live Server
- `python -m http.server` na pasta do projeto

## Estrutura do projeto

- `aethelgardsemtexturas.html` → estrutura da interface (telas, HUD, canvas e controles)
- `styles.css` → estilos da UI e layout
- `game.js` → lógica completa do jogo (loop, física, inimigos, progressão, loja e save)

## Balanceamento centralizado

Os valores principais de gameplay agora estão no objeto `CONFIG` em `game.js`.

Você pode ajustar com segurança, em um único lugar:

- gravidade, pulo, invulnerabilidade e duração de ataque
- intervalo de spawn e velocidade base dos inimigos
- parâmetros do boss (vida, frequência e padrão de ataques)
- economia da loja (custo da princesa e cura)

## Como adicionar e relacionar imagens (sprites)

O projeto já está preparado para usar imagens com fallback automático.

### 1) Coloque os arquivos nas pastas corretas

- personagens: `assets/imagens/personagens/<nome-do-personagem>/sprite.png`
- inimigos: `assets/imagens/inimigos/<nome-do-inimigo>/sprite.png`
- boss final: `assets/imagens/inimigos/boss/sprite.png`

### 2) Relacione no mapa central

No `game.js`, edite o objeto `SPRITE_PATHS`:

- `SPRITE_PATHS.characters` para heróis
- `SPRITE_PATHS.enemies` para inimigos
- `SPRITE_PATHS.boss` para o boss

Exemplo:

- `elf: 'assets/imagens/personagens/elf/sprite.png'`
- `stone: 'assets/imagens/inimigos/stone/sprite.png'`

### 3) Pronto

Se a imagem existir, ela é usada automaticamente.
Se faltar arquivo ou caminho estiver errado, o jogo continua funcionando com o desenho em cor sólida.

## Controles

- **Teclado**
	- Pular: `Z`, `Space`, `ArrowUp`
	- Atacar: `X` ou `A`
- **Mobile/Touch**
	- Botão `PULO`
	- Botão `ATAQUE`

## Loop de jogo

1. Tela inicial e narrativa
2. Seleção de herói
3. Run por mundo com coleta de cristais
4. Loja entre fases
5. Boss final no último mundo
6. Tela de encerramento (vitória final ou derrota) sem recarregar a página

## Sistema de progresso

- Cristais são salvos em `localStorage` (`aethel_gems`)
- Desbloqueio da princesa salvo em `localStorage` (`aethel_princess`)
- Loja:
	- Princesa: `1000` cristais
	- Cura: `50` cristais (até 5 de HP)

## Próximos passos sugeridos

- Substituir `location.reload()` por telas de vitória/derrota com reinício controlado
- Criar objeto `CONFIG` para centralizar constantes de balanceamento
- Adicionar sprites/áudio
- Evoluir para módulos ES e/ou TypeScript
