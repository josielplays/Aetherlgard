/** ENGINE & CONFIGURAÇÕES **/
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = 400;

const worlds = [
    { name: "Saída do Castelo", color: "#2d4c24", target: 200, enemies: ['stone','archer','hound'] },
    { name: "Vila do Reino", color: "#4a3b2a", target: 400, enemies: ['rat','bat','thief'] },
    { name: "Floresta Iluminada", color: "#0a2f1f", target: 600, enemies: ['fairy_c','spitter','worm'] },
    { name: "Pântano dos Sussurros", color: "#1a2a1a", target: 800, enemies: ['toad','mosquito','spirit'] },
    { name: "Ruínas de Cristal", color: "#1a1a2e", target: 1000, enemies: ['shard','golem','sentry'] },
    { name: "Coração Sombrio", color: "#1a051a", target: 1500, enemies: ['knight','tentacle','void'] }
];

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

let player, enemies = [], bullets = [], particles = [], boss = null;
let gameActive = false, currentW = 0, frame = 0, shake = 0;
let selectedChar = null;
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

function startNarrative() {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('story-screen').classList.remove('hidden');
    nextStory();
}

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
        }, 30);
    } else {
        showMenu();
    }
}

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
function initGame(char) {
    selectedChar = char;
    const chars = {
        elf: { hp: 3, jumpMax: 1, color: '#d4af37' },
        fairy: { hp: 2, jumpMax: 2, color: '#70dbff' },
        paladin: { hp: 5, jumpMax: 1, color: '#c0c0c0' },
        princess: { hp: 3, jumpMax: 1, color: '#ff69b4' }
    };
    player = { ...chars[char], x: 80, y: 0, w: 40, h: 60, dy: 0, jCount: 0, gems: 0, invul: 0, isAttacking: false };
    currentW = 0;
    startWorld();
}

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
    document.getElementById('boss-hp-bar').style.width = '100%';
    canvas.classList.remove('hidden');
    canvas.style.background = worlds[currentW].color;
    document.getElementById('world-label').innerText = worlds[currentW].name;
    document.getElementById('target-gems').innerText = worlds[currentW].target;
    requestAnimationFrame(loop);
}

function hideGameplayLayers() {
    document.getElementById('game-ui').classList.add('hidden');
    document.getElementById('game-ctrl').classList.add('hidden');
    document.getElementById('shop-screen').classList.add('hidden');
    document.getElementById('boss-hp-container').style.display = 'none';
    canvas.classList.add('hidden');
}

function showEndScreen(title, text) {
    gameActive = false;
    hideGameplayLayers();
    document.getElementById('end-title').innerText = title;
    document.getElementById('end-text').innerText = text;
    document.getElementById('end-screen').classList.remove('hidden');
}

function restartRun() {
    if(selectedChar) {
        initGame(selectedChar);
    } else {
        backToMenu();
    }
}

function backToMenu() {
    gameActive = false;
    hideGameplayLayers();
    document.getElementById('end-screen').classList.add('hidden');
    showMenu();
}

function loop() {
    if(!gameActive) return;
    frame++;
    ctx.save();
    if(shake > 0) {
        ctx.translate((Math.random()-0.5)*10, (Math.random()-0.5)*10);
        shake--;
    }
    ctx.clearRect(0,0,canvas.width,canvas.height);

    player.dy += 0.7;
    player.y += player.dy;
    if(player.y > 340-player.h) {
        player.y = 340-player.h;
        player.dy = 0;
        player.jCount = 0;
    }
    if(player.invul > 0) player.invul--;

    if(currentW === 5 && player.gems >= worlds[5].target && !boss) spawnBoss();
    if(!boss) {
        if(frame % 100 === 0) spawnEnemy();
    } else {
        updateBoss();
    }

    updateEntities();
    drawPlayer();

    document.getElementById('hp-bar').innerHTML = "❤️".repeat(player.hp);
    document.getElementById('run-gems').innerText = player.gems;

    if(player.gems >= worlds[currentW].target && currentW < 5) winWorld();

    ctx.restore();
    requestAnimationFrame(loop);
}

function spawnEnemy() {
    const pool = worlds[currentW].enemies;
    const type = bestiary[pool[Math.floor(Math.random()*pool.length)]];
    enemies.push({ ...type, x: canvas.width, y: type.type==='fly'?150:340-(type.h||50), w:40, h:type.h||50, t:0 });
}

function updateEntities() {
    enemies.forEach((en, i) => {
        en.x -= (4 + currentW);
        if(en.sine) en.y += Math.sin(frame*0.1)*3;
        if(en.blink) ctx.globalAlpha = Math.sin(frame*0.2)>0?1:0.2;

        ctx.fillStyle = en.color;
        ctx.fillRect(en.x, en.y, en.w, en.h);
        ctx.globalAlpha = 1;

        if(en.shoot && en.x < canvas.width && en.x > 0) {
            en.t++;
            if(en.t > 120) {
                bullets.push({ x:en.x, y:en.y+10, vx:-6, vy:en.shoot==='arc'?-5:0, g:en.shoot==='arc'?0.2:0 });
                en.t = 0;
            }
        }

        if(checkRect(player, en)) {
            if(player.isAttacking) {
                impact(en.x, en.y, en.color);
                enemies.splice(i, 1);
                player.gems += 25;
            } else if(player.invul <= 0) {
                player.hp--;
                player.invul = 60;
                shake = 10;
            }
        }
    });

    bullets.forEach((b, i) => {
        if(b.g) b.vy += b.g;
        b.x += b.vx;
        b.y += b.vy;
        ctx.fillStyle = b.color || "yellow";
        ctx.fillRect(b.x, b.y, b.w||10, b.h||10);
        if(checkRect(player, {x:b.x, y:b.y, w:10, h:10}) && player.invul <= 0) {
            player.hp--;
            player.invul = 60;
            bullets.splice(i,1);
        }
    });

    particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.a -= 0.02;
        ctx.globalAlpha = p.a;
        ctx.fillStyle = p.c;
        ctx.fillRect(p.x, p.y, 4, 4);
        if(p.a <= 0) particles.splice(i, 1);
    });
    ctx.globalAlpha = 1;

    ctx.fillStyle = "#3d2516";
    ctx.fillRect(0, 340, canvas.width, 60);
    if(player.hp <= 0) {
        showEndScreen("VOCÊ FOI DERROTADO", "A sombra venceu esta batalha. Reorganize-se e tente novamente.");
    }
}

/** BOSS FINAL **/
function spawnBoss() {
    boss = { hp: 20, max: 20, x: canvas.width-150, y: 340-120, w: 80, h: 120, t: 0 };
    document.getElementById('boss-hp-container').style.display = 'block';
}

function updateBoss() {
    boss.t++;
    ctx.fillStyle = boss.t % 60 < 30 ? "#4b0082" : "#9400d3";
    ctx.fillRect(boss.x, boss.y, boss.w, boss.h);

    if(boss.t % 180 === 0) {
        const r = Math.random();
        if(r < 0.33) {
            for(let i=0; i<3; i++) bullets.push({ x:boss.x, y:boss.y+i*40, vx:-8, vy:0, color:"#ff00ff" });
        } else if (r < 0.66) {
            boss.x = boss.x > canvas.width/2 ? 100 : canvas.width-200;
        } else {
            impact(player.x, 340, "purple", 20);
            bullets.push({ x:player.x-20, y:340, vx:0, vy:-10, w:60, h:100, color:"#1a051a" });
        }
    }

    if(player.isAttacking && checkRect(player, boss) && player.invul <= 0) {
        boss.hp--;
        player.invul = 20;
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

function impact(x, y, c, n=10) {
    shake = 5;
    for(let i=0; i<n; i++) particles.push({ x, y, vx:(Math.random()-0.5)*10, vy:(Math.random()-0.5)*10, c, a:1 });
}

function checkRect(r1, r2) {
    return r1.x < r2.x + r2.w && r1.x + r1.w > r2.x && r1.y < r2.y + r2.h && r1.y + r1.h > r2.y;
}

function winWorld() {
    gameActive = false;
    saveData.gems += player.gems;
    localStorage.setItem('aethel_gems', saveData.gems);
    document.getElementById('shop-screen').classList.remove('hidden');
    document.getElementById('current-gems').innerText = saveData.gems;
}

function nextWorld() {
    currentW++;
    player.gems = 0;
    startWorld();
}

/** COMPRAS COM TRAVAS (LIMITES E DESBLOQUEIO) **/
function buyItem(it) {
    if(it === 'princess') {
        if (!saveData.princess && saveData.gems >= 1000) {
            saveData.gems -= 1000;
            saveData.princess = true;
            localStorage.setItem('aethel_gems', saveData.gems);
            localStorage.setItem('aethel_princess', 'true');
            alert("Princesa Elfa Desbloqueada!");
            showMenu();
        } else if (saveData.princess) {
            alert("Você já possui a Princesa!");
        } else {
            alert("Cristais insuficientes (1000 necessários)");
        }
    }
    else if(it === 'hp') {
        if (saveData.gems >= 50 && player.hp < 5) {
            saveData.gems -= 50;
            player.hp++;
            localStorage.setItem('aethel_gems', saveData.gems);
            document.getElementById('current-gems').innerText = saveData.gems;
            alert("Vida recuperada! (" + player.hp + "/5)");
        } else if (player.hp >= 5) {
            alert("Vida máxima atingida!");
        } else {
            alert("Cristais insuficientes (50 necessários)");
        }
    }
}

// Inputs
const jump = () => {
    if(player.jCount < player.jumpMax) {
        player.dy = -14;
        player.jCount++;
    }
};

const attack = () => {
    if(!player.isAttacking) {
        player.isAttacking = true;
        setTimeout(() => player.isAttacking=false, 250);
    }
};

document.getElementById('btnJump').ontouchstart = (e) => {
    e.preventDefault();
    jump();
};

document.getElementById('btnAttack').ontouchstart = (e) => {
    e.preventDefault();
    attack();
};

window.onkeydown = (e) => {
    if(e.code==='KeyZ'||e.code==='Space'||e.code==='ArrowUp') jump();
    if(e.code==='KeyX'||e.code==='KeyA') attack();
};