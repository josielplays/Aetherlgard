/** ENGINE & CONFIGURAÇÕES **/
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
// CONFIG centraliza os valores principais para facilitar ajuste e manutenção.
const CONFIG = {
    canvasHeight: 400,
    narrative: {
        typingMs: 30
    },
    world: {
        lastWorldIndex: 5,
        spawnIntervalFrames: 100,
        baseEnemySpeed: 4,
        groundY: 340,
        groundHeight: 60,
        flyEnemyY: 150,
        enemyDefaultWidth: 40,
        enemyDefaultHeight: 50
    },
    player: {
        spawnX: 80,
        width: 40,
        height: 60,
        gravity: 0.7,
        jumpVelocity: -14,
        attackDurationMs: 250,
        invulHitFrames: 60,
        invulBossHitFrames: 20,
        maxHp: 5
    },
    visual: {
        hitShake: 10,
        impactShake: 5,
        impactParticlesDefault: 10,
        particleSize: 4,
        particleFade: 0.02,
        bossBarResetWidth: '100%'
    },
    enemy: {
        shootCooldownFrames: 120,
        sineAmplitude: 3,
        blinkFrequency: 0.2,
        hitRewardGems: 25,
        bulletSpeedX: -6,
        arcBulletSpeedY: -5,
        arcBulletGravity: 0.2
    },
    projectile: {
        defaultSize: 10
    },
    boss: {
        hp: 20,
        xOffset: 150,
        yOffset: 120,
        width: 80,
        height: 120,
        colorSwapFrames: 60,
        attackIntervalFrames: 180,
        tripleShotCount: 3,
        tripleShotSpacing: 40,
        tripleShotSpeedX: -8,
        teleportLeftX: 100,
        teleportRightOffset: 200,
        aoeOffsetX: 20,
        aoeWidth: 60,
        aoeHeight: 100,
        aoeSpeedY: -10,
        aoeImpactParticles: 20
    },
    economy: {
        princessCost: 1000,
        healCost: 50
    }
};

// Tabela de personagens jogáveis e atributos base.
const CHARACTERS = {
    elf: { hp: 3, jumpMax: 1, color: '#d4af37' },
    fairy: { hp: 2, jumpMax: 2, color: '#70dbff' },
    paladin: { hp: 5, jumpMax: 1, color: '#c0c0c0' },
    princess: { hp: 3, jumpMax: 1, color: '#ff69b4' }
};

// Inicializa o tamanho da área de jogo.
canvas.width = window.innerWidth;
canvas.height = CONFIG.canvasHeight;

// Sequência de mundos com tema visual, meta de cristais e inimigos possíveis.
const worlds = [
    { name: "Saída do Castelo", color: "#2d4c24", target: 200, enemies: ['stone','archer','hound'] },
    { name: "Vila do Reino", color: "#4a3b2a", target: 400, enemies: ['rat','bat','thief'] },
    { name: "Floresta Iluminada", color: "#0a2f1f", target: 600, enemies: ['fairy_c','spitter','worm'] },
    { name: "Pântano dos Sussurros", color: "#1a2a1a", target: 800, enemies: ['toad','mosquito','spirit'] },
    { name: "Ruínas de Cristal", color: "#1a1a2e", target: 1000, enemies: ['shard','golem','sentry'] },
    { name: "Coração Sombrio", color: "#1a051a", target: 1500, enemies: ['knight','tentacle','void'] }
];

// Bestiário: define comportamento e estatísticas dos inimigos.
const bestiary = {
    stone: { color: '#777', hp: 1, speed: 2, type: 'ground' },
    archer: { color: '#a52a2a', hp: 1, speed: 0, type: 'ranged', shoot: 'line' },
    hound: { color: '#522', hp: 1, speed: 8, type: 'ground' },
    rat: { color: '#4b3621', hp: 1, speed: 9, type: 'ground', h: 30 },
    bat: { color: '#333', hp: 1, speed: 4, type: 'fly', sine: true },
    thief: { color: '#000', hp: 1, speed: 3, type: 'ground', blink: true },
    fairy_c: { color: '#9400d3', hp: 1, speed: 2, type: 'fly', shoot: 'homing' },
    spitter: { color: '#228b22', hp: 2, speed: 0, type: 'ground', shoot: 'arc' },
    worm: { color: '#3f3', hp: 1, speed: 0, type: 'ground', ambush: true },
    toad: { color: '#4a5d23', hp: 1, speed: 2, type: 'ground', jump: true },
    mosquito: { color: '#f00', hp: 1, speed: 6, type: 'fly' },
    spirit: { color: '#5c4033', hp: 2, speed: 1, type: 'ground' },
    shard: { color: '#0ff', hp: 1, speed: 5, type: 'fly' },
    golem: { color: '#fff', hp: 2, speed: 2, type: 'ground', reflect: true },
    sentry: { color: '#ff0', hp: 3, speed: 0, type: 'ground', laser: true },
    knight: { color: '#303', hp: 2, speed: 5, type: 'ground' },
    tentacle: { color: '#101', hp: 1, speed: 0, type: 'ground' },
    void: { color: '#609', hp: 1, speed: 3, type: 'fly', explosive: true }
};

// Estado global da run atual.
let player, enemies = [], bullets = [], particles = [], boss = null;
let gameActive = false, currentW = 0, frame = 0, shake = 0;
let selectedChar = null;
// Save persistido no navegador (cristais e desbloqueio da princesa).
let saveData = {
    gems: parseInt(localStorage.getItem('aethel_gems')) || 0,
    princess: localStorage.getItem('aethel_princess') === 'true'
};

/** NARRATIVA COM CORREÇÃO DE TEXTO MISTURADO **/
const story = [
    "Por eras, Aethelgard floresceu sob a Árvore Ancestral...",
    "Mas a inveja gerou a sombra. Um conselheiro profanou o coração da floresta.",
    "A Princesa foi levada para as profundezas. O brilho está morrendo...",
    "Heróis, recuperem os Fragmentos Glow. Resgatem Aethelgard!"
];
let storyIdx = 0;
let isTyping = false;

// Etapa 1: sai da tela inicial e começa a narrativa.
function startNarrative() {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('story-screen').classList.remove('hidden');
    nextStory();
}

// Etapa 2: exibe os textos da história com efeito de digitação.
function nextStory() {
    if (isTyping) return;

    if(storyIdx < story.length) {
        isTyping = true;
        const div = document.getElementById('story-text');
        div.innerHTML = "";
        let currentStr = story[storyIdx];
        let i = 0;

        const type = setInterval(() => {
            div.innerHTML += currentStr[i];
            i++;
            if(i >= currentStr.length) {
                clearInterval(type);
                isTyping = false;
                storyIdx++;
            }
        }, CONFIG.narrative.typingMs);
    } else {
        showMenu();
    }
}

// Etapa 3: mostra menu principal e atualiza desbloqueios salvos.
function showMenu() {
    document.getElementById('story-screen').classList.add('hidden');
    document.getElementById('menu-screen').classList.remove('hidden');
    document.getElementById('save-gems').innerText = saveData.gems;

    if(saveData.princess) {
        const pCard = document.getElementById('princess-card');
        pCard.classList.remove('locked');
        pCard.onclick = () => initGame('princess');
    }
}

/** JOGO **/
// Etapa 4: inicializa a run com o herói selecionado.
function initGame(char) {
    selectedChar = char;
    player = {
        ...CHARACTERS[char],
        x: CONFIG.player.spawnX,
        y: 0,
        w: CONFIG.player.width,
        h: CONFIG.player.height,
        dy: 0,
        jCount: 0,
        gems: 0,
        invul: 0,
        isAttacking: false
    };
    currentW = 0;
    startWorld();
}

// Etapa 5: prepara o mundo atual e liga o loop de jogo.
function startWorld() {
    gameActive = true;
    enemies = [];
    bullets = [];
    particles = [];
    boss = null;
    frame = 0;
    shake = 0;
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('shop-screen').classList.add('hidden');
    document.getElementById('end-screen').classList.add('hidden');
    document.getElementById('game-ui').classList.remove('hidden');
    document.getElementById('game-ctrl').classList.remove('hidden');
    document.getElementById('boss-hp-container').style.display = 'none';
    document.getElementById('boss-hp-bar').style.width = CONFIG.visual.bossBarResetWidth;
    canvas.classList.remove('hidden');
    canvas.style.background = worlds[currentW].color;
    document.getElementById('world-label').innerText = worlds[currentW].name;
    document.getElementById('target-gems').innerText = worlds[currentW].target;
    requestAnimationFrame(loop);
}

// Oculta elementos de gameplay quando o jogador vai para telas de fim/menu.
function hideGameplayLayers() {
    document.getElementById('game-ui').classList.add('hidden');
    document.getElementById('game-ctrl').classList.add('hidden');
    document.getElementById('shop-screen').classList.add('hidden');
    document.getElementById('boss-hp-container').style.display = 'none';
    canvas.classList.add('hidden');
}

// Exibe tela final (derrota ou vitória) sem recarregar a página.
function showEndScreen(title, text) {
    gameActive = false;
    hideGameplayLayers();
    document.getElementById('end-title').innerText = title;
    document.getElementById('end-text').innerText = text;
    document.getElementById('end-screen').classList.remove('hidden');
}

// Reinicia a run com o último personagem escolhido.
function restartRun() {
    if(selectedChar) {
        initGame(selectedChar);
    } else {
        backToMenu();
    }
}

// Volta para o menu preservando o progresso salvo.
function backToMenu() {
    gameActive = false;
    hideGameplayLayers();
    document.getElementById('end-screen').classList.add('hidden');
    showMenu();
}

// Loop principal: física, IA, colisões, HUD e progressão por frame.
function loop() {
    if(!gameActive) return;
    frame++;
    ctx.save();
    // Aplica efeito de tremor após impactos.
    if(shake > 0) {
        ctx.translate((Math.random()-0.5)*CONFIG.visual.hitShake, (Math.random()-0.5)*CONFIG.visual.hitShake);
        shake--;
    }
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Física básica de gravidade e aterrissagem no chão.
    player.dy += CONFIG.player.gravity;
    player.y += player.dy;
    if(player.y > CONFIG.world.groundY-player.h) {
        player.y = CONFIG.world.groundY-player.h;
        player.dy = 0;
        player.jCount = 0;
    }
    if(player.invul > 0) player.invul--;

    // No último mundo, após atingir meta de cristais, inicia o boss.
    if(currentW === CONFIG.world.lastWorldIndex && player.gems >= worlds[CONFIG.world.lastWorldIndex].target && !boss) spawnBoss();
    if(!boss) {
        if(frame % CONFIG.world.spawnIntervalFrames === 0) spawnEnemy();
    } else {
        updateBoss();
    }

    updateEntities();
    drawPlayer();

    document.getElementById('hp-bar').innerHTML = "❤️".repeat(player.hp);
    document.getElementById('run-gems').innerText = player.gems;

    // Em mundos normais, ao atingir meta de cristais, vai para a loja.
    if(player.gems >= worlds[currentW].target && currentW < CONFIG.world.lastWorldIndex) winWorld();

    ctx.restore();
    requestAnimationFrame(loop);
}

// Cria um inimigo aleatório da pool do mundo atual.
function spawnEnemy() {
    const pool = worlds[currentW].enemies;
    const type = bestiary[pool[Math.floor(Math.random()*pool.length)]];
    enemies.push({
        ...type,
        x: canvas.width,
        y: type.type === 'fly' ? CONFIG.world.flyEnemyY : CONFIG.world.groundY - (type.h || CONFIG.world.enemyDefaultHeight),
        w: CONFIG.world.enemyDefaultWidth,
        h: type.h || CONFIG.world.enemyDefaultHeight,
        t: 0
    });
}

// Atualiza inimigos, projéteis, partículas e colisões da run.
function updateEntities() {
    enemies.forEach((en, i) => {
        // Movimento padrão + comportamentos especiais.
        en.x -= (CONFIG.world.baseEnemySpeed + currentW);
        if(en.sine) en.y += Math.sin(frame*0.1)*CONFIG.enemy.sineAmplitude;
        if(en.blink) ctx.globalAlpha = Math.sin(frame*CONFIG.enemy.blinkFrequency)>0?1:0.2;

        ctx.fillStyle = en.color;
        ctx.fillRect(en.x, en.y, en.w, en.h);
        ctx.globalAlpha = 1;

        // Disparo periódico para inimigos com ataque à distância.
        if(en.shoot && en.x < canvas.width && en.x > 0) {
            en.t++;
            if(en.t > CONFIG.enemy.shootCooldownFrames) {
                bullets.push({
                    x: en.x,
                    y: en.y + 10,
                    vx: CONFIG.enemy.bulletSpeedX,
                    vy: en.shoot === 'arc' ? CONFIG.enemy.arcBulletSpeedY : 0,
                    g: en.shoot === 'arc' ? CONFIG.enemy.arcBulletGravity : 0
                });
                en.t = 0;
            }
        }

        // Colisão jogador x inimigo (ataque elimina, contato causa dano).
        if(checkRect(player, en)) {
            if(player.isAttacking) {
                impact(en.x, en.y, en.color);
                enemies.splice(i, 1);
                player.gems += CONFIG.enemy.hitRewardGems;
            } else if(player.invul <= 0) {
                player.hp--;
                player.invul = CONFIG.player.invulHitFrames;
                shake = CONFIG.visual.hitShake;
            }
        }
    });

    bullets.forEach((b, i) => {
        // Atualiza projéteis e verifica dano no jogador.
        if(b.g) b.vy += b.g;
        b.x += b.vx;
        b.y += b.vy;
        ctx.fillStyle = b.color || "yellow";
        ctx.fillRect(b.x, b.y, b.w || CONFIG.projectile.defaultSize, b.h || CONFIG.projectile.defaultSize);
        if(checkRect(player, {x:b.x, y:b.y, w:CONFIG.projectile.defaultSize, h:CONFIG.projectile.defaultSize}) && player.invul <= 0) {
            player.hp--;
            player.invul = CONFIG.player.invulHitFrames;
            bullets.splice(i,1);
        }
    });

    particles.forEach((p, i) => {
        // Partículas de impacto com fade ao longo do tempo.
        p.x += p.vx;
        p.y += p.vy;
        p.a -= CONFIG.visual.particleFade;
        ctx.globalAlpha = p.a;
        ctx.fillStyle = p.c;
        ctx.fillRect(p.x, p.y, CONFIG.visual.particleSize, CONFIG.visual.particleSize);
        if(p.a <= 0) particles.splice(i, 1);
    });
    ctx.globalAlpha = 1;

    ctx.fillStyle = "#3d2516";
    ctx.fillRect(0, CONFIG.world.groundY, canvas.width, CONFIG.world.groundHeight);
    // Derrota quando a vida chega a zero.
    if(player.hp <= 0) {
        showEndScreen("VOCÊ FOI DERROTADO", "A sombra venceu esta batalha. Reorganize-se e tente novamente.");
    }
}

/** BOSS FINAL **/
// Cria o chefe final e exibe a barra de vida no topo.
function spawnBoss() {
    boss = {
        hp: CONFIG.boss.hp,
        max: CONFIG.boss.hp,
        x: canvas.width - CONFIG.boss.xOffset,
        y: CONFIG.world.groundY - CONFIG.boss.yOffset,
        w: CONFIG.boss.width,
        h: CONFIG.boss.height,
        t: 0
    };
    document.getElementById('boss-hp-container').style.display = 'block';
}

// IA do boss: alterna ataques e processa dano recebido.
function updateBoss() {
    boss.t++;
    ctx.fillStyle = boss.t % CONFIG.boss.colorSwapFrames < CONFIG.boss.colorSwapFrames / 2 ? "#4b0082" : "#9400d3";
    ctx.fillRect(boss.x, boss.y, boss.w, boss.h);

    // A cada intervalo, escolhe aleatoriamente um padrão de ataque.
    if(boss.t % CONFIG.boss.attackIntervalFrames === 0) {
        const r = Math.random();
        if(r < 0.33) {
            for(let i=0; i<CONFIG.boss.tripleShotCount; i++) {
                bullets.push({ x: boss.x, y: boss.y + i * CONFIG.boss.tripleShotSpacing, vx: CONFIG.boss.tripleShotSpeedX, vy: 0, color: "#ff00ff" });
            }
        } else if (r < 0.66) {
            boss.x = boss.x > canvas.width/2 ? CONFIG.boss.teleportLeftX : canvas.width - CONFIG.boss.teleportRightOffset;
        } else {
            impact(player.x, CONFIG.world.groundY, "purple", CONFIG.boss.aoeImpactParticles);
            bullets.push({
                x: player.x - CONFIG.boss.aoeOffsetX,
                y: CONFIG.world.groundY,
                vx: 0,
                vy: CONFIG.boss.aoeSpeedY,
                w: CONFIG.boss.aoeWidth,
                h: CONFIG.boss.aoeHeight,
                color: "#1a051a"
            });
        }
    }

    // Ataque corpo a corpo do jogador contra o boss.
    if(player.isAttacking && checkRect(player, boss) && player.invul <= 0) {
        boss.hp--;
        player.invul = CONFIG.player.invulBossHitFrames;
        impact(boss.x+40, boss.y+60, "white");
        document.getElementById('boss-hp-bar').style.width = (boss.hp/boss.max)*100 + "%";
        if(boss.hp <= 0) {
            saveData.gems += player.gems;
            localStorage.setItem('aethel_gems', saveData.gems);
            showEndScreen("AETHELGARD FOI SALVA!", "A luz voltou à floresta. Sua lenda será lembrada.");
        }
    }
}

/** UTILITÁRIOS **/
// Renderiza o jogador e o hitbox de ataque.
function drawPlayer() {
    ctx.globalAlpha = player.invul % 2 === 0 ? 1 : 0.3;
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.w, player.h);
    if(player.isAttacking) {
        ctx.fillStyle = "white";
        ctx.fillRect(player.x+player.w, player.y+10, 30, 40);
    }
    ctx.globalAlpha = 1;
}

// Gera partículas e tremor para feedback de impacto.
function impact(x, y, c, n=CONFIG.visual.impactParticlesDefault) {
    shake = CONFIG.visual.impactShake;
    for(let i=0; i<n; i++) particles.push({ x, y, vx:(Math.random()-0.5)*10, vy:(Math.random()-0.5)*10, c, a:1 });
}

// Verifica interseção entre dois retângulos (AABB collision).
function checkRect(r1, r2) {
    return r1.x < r2.x + r2.w && r1.x + r1.w > r2.x && r1.y < r2.y + r2.h && r1.y + r1.h > r2.y;
}

// Finaliza o mundo atual e abre a tela de loja.
function winWorld() {
    gameActive = false;
    saveData.gems += player.gems;
    localStorage.setItem('aethel_gems', saveData.gems);
    document.getElementById('shop-screen').classList.remove('hidden');
    document.getElementById('current-gems').innerText = saveData.gems;
}

// Avança para o próximo mundo mantendo o personagem da run.
function nextWorld() {
    currentW++;
    player.gems = 0;
    startWorld();
}

/** COMPRAS COM TRAVAS (LIMITES E DESBLOQUEIO) **/
// Processa compras da loja: desbloqueio da princesa e cura.
function buyItem(it) {
    if(it === 'princess') {
        if (!saveData.princess && saveData.gems >= CONFIG.economy.princessCost) {
            saveData.gems -= CONFIG.economy.princessCost;
            saveData.princess = true;
            localStorage.setItem('aethel_gems', saveData.gems);
            localStorage.setItem('aethel_princess', 'true');
            alert("Princesa Elfa Desbloqueada!");
            showMenu();
        } else if (saveData.princess) {
            alert("Você já possui a Princesa!");
        } else {
            alert("Cristais insuficientes (" + CONFIG.economy.princessCost + " necessários)");
        }
    }
    else if(it === 'hp') {
        if (saveData.gems >= CONFIG.economy.healCost && player.hp < CONFIG.player.maxHp) {
            saveData.gems -= CONFIG.economy.healCost;
            player.hp++;
            localStorage.setItem('aethel_gems', saveData.gems);
            document.getElementById('current-gems').innerText = saveData.gems;
            alert("Vida recuperada! (" + player.hp + "/" + CONFIG.player.maxHp + ")");
        } else if (player.hp >= CONFIG.player.maxHp) {
            alert("Vida máxima atingida!");
        } else {
            alert("Cristais insuficientes (" + CONFIG.economy.healCost + " necessários)");
        }
    }
}

// Inputs: ações básicas de movimentação e combate.
const jump = () => {
    if(player.jCount < player.jumpMax) {
        player.dy = CONFIG.player.jumpVelocity;
        player.jCount++;
    }
};

const attack = () => {
    if(!player.isAttacking) {
        player.isAttacking = true;
        setTimeout(() => player.isAttacking=false, CONFIG.player.attackDurationMs);
    }
};

// Controle touch do botão de pulo.
document.getElementById('btnJump').ontouchstart = (e) => {
    e.preventDefault();
    jump();
};

// Controle touch do botão de ataque.
document.getElementById('btnAttack').ontouchstart = (e) => {
    e.preventDefault();
    attack();
};

// Controle por teclado.
window.onkeydown = (e) => {
    if(e.code==='KeyZ'||e.code==='Space'||e.code==='ArrowUp') jump();
    if(e.code==='KeyX'||e.code==='KeyA') attack();
};