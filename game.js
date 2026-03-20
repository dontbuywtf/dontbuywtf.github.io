const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- GAME STATE & CONFIG ---
let gameState = 'MENU';
let currentLevel = 1;
let lives = 3; // Added Lives
let score = { dontbuy: 0, xrp: 0, fuzzy: 0 };
let cameraX = 0;
let keys = {};
let audioCtx = null;

const GRAVITY = 0.45;
const JUMP = -10;
const SPEED = 5;

let player, platforms, tokens, enemies, goal, worldWidth;

// --- XRP LORE SNIPPETS ---
const xrpLore = [
    "AMM_ENABLED", 
    "XRP > BTC", 
    "GARY SUCKS",
    "RLUSD_STABLE", 
    "FLIP_BTC", 
    "NO_ESCROW", 
    "THE_LEDGER", 
    "LIQUIDITY", 
    "F_THE_SEC", 
    "FLIP_BTC", 
    "ISO_20022",
    "BRAD_G"
];

// --- 8-BIT MUSIC GENERATOR ---
function playMusic() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(110, audioCtx.currentTime); 
    const melody = [110, 146, 110, 164, 110, 146, 196, 164];
    let i = 0;
    setInterval(() => {
        if(gameState === 'PLAYING') {
            osc.frequency.exponentialRampToValueAtTime(melody[i % melody.length], audioCtx.currentTime + 0.1);
            i++;
        }
    }, 250);
    gain.gain.setValueAtTime(0.03, audioCtx.currentTime); 
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
}

// --- LEVEL GENERATOR ---
// --- UPDATED LEVEL GENERATOR WITH PROGRESSIVE DIFFICULTY ---
function buildLevel(num) {
    // Increase world size slightly as levels progress
    worldWidth = 3000 + (num * 1000);
    player = { x: 100, y: 100, w: 25, h: 35, vx: 0, vy: 0, grounded: false, jumpsLeft: 2 };
    platforms = []; tokens = []; enemies = [];
    
    // Base floor platforms
    for (let i = 0; i < worldWidth; i += 800) platforms.push({ x: i, y: 360, w: 600, h: 40 });

    for (let i = 400; i < worldWidth - 500; i += 250) {
        let py = 150 + Math.random() * 150;
        platforms.push({ x: i, y: py, w: 160, h: 20 }); 
        
        let rand = Math.random();
        let type = rand > 0.7 ? 'xrp' : (rand > 0.4 ? 'dontbuy' : 'fuzzy');
        tokens.push({ x: i + 50, y: py - 40, type: type, collected: false });

        // Enemy Spawn Chance: Increases as level (num) goes up
        if (Math.random() < 0.2 + (num * 0.08)) {
            let eType = Math.random();
            
            if (eType < 0.5) {
                // --- MAXI ENEMY SCALING ---
                // Speed starts at -2 and adds -0.8 per level (Level 10 speed = -10)
                let maxiSpeed = -2 - (num * 0.8); 
                // Range increases so they patrol more of the platform
                let maxiRange = 60 + (num * 15); 
                
                enemies.push({ 
                    x: i + 20, y: py - 35, w: 30, h: 25, 
                    vx: maxiSpeed, 
                    range: maxiRange, 
                    startX: i + 20, 
                    type: 'maxi', 
                    label: "HODL" 
                });
            } else {
                // --- MEV BOT SCALING ---
                // MEV Bots are faster: Starts at -4 and adds -1.2 per level (Level 10 speed = -16!)
                let botSpeed = -4 - (num * 1.2);
                let botRange = 100 + (num * 20);

                enemies.push({ 
                    x: i, y: py - 85, w: 25, h: 25, 
                    vx: botSpeed, 
                    range: botRange, 
                    startX: i, 
                    type: 'bot', 
                    label: "MEV" 
                });
            }
        }
    }
    goal = { x: worldWidth - 250, y: 150, w: 100, h: 210 };
}

// --- DRAWING FUNCTIONS ---

function drawPlatform(ctx, p) {
    ctx.save();
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.beginPath();
    ctx.rect(p.x + 2, p.y + 2, p.w - 4, p.h - 4);
    ctx.clip();
    ctx.fillStyle = "rgba(0, 255, 65, 0.4)";
    ctx.font = "bold 10px 'monospace'";
    
    if (p.w < 200) {
        let txt = xrpLore[Math.floor((p.x) % xrpLore.length)];
        ctx.textAlign = "center";
        ctx.fillText(txt, p.x + p.w / 2, p.y + 13);
    } else {
        ctx.textAlign = "left";
        let step = 100; 
        for (let x = 10; x < p.w; x += step) {
            let txt = xrpLore[Math.floor((p.x + x) % xrpLore.length)];
            ctx.fillText(txt, p.x + x, p.y + 13);
        }
    }
    ctx.restore(); 
    ctx.save();
    ctx.strokeStyle = "#32e685";
    ctx.lineWidth = 1;
    ctx.strokeRect(p.x, p.y, p.w, p.h);
    ctx.restore();
}

function drawFlag(ctx, g) {
    ctx.save();
    let cx = g.x + 20;
    let bottomY = 360;
    let topY = 200;
    ctx.strokeStyle = "#32e685";
    ctx.lineWidth = 4;
    ctx.shadowBlur = 10; ctx.shadowColor = "#32e685";
    ctx.beginPath(); ctx.moveTo(cx, bottomY); ctx.lineTo(cx, topY); ctx.stroke();
    let wave = Math.sin(Date.now() / 200) * 10;
    ctx.fillStyle = "#ff198b"; ctx.shadowColor = "#ff198b";
    ctx.beginPath();
    ctx.moveTo(cx, topY); ctx.lineTo(cx + 65, topY + 20 + wave); ctx.lineTo(cx, topY + 45);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "bold 14px Arial";
    ctx.fillText("X", cx + 12, topY + 28 + (wave/2));
    ctx.restore();
}

function drawPlayer(ctx, p) {
    ctx.save();
    ctx.shadowBlur = 15; ctx.shadowColor = "#00ff41";
    ctx.fillStyle = "#32e685";
    ctx.beginPath();
    ctx.moveTo(p.x + p.w / 2, p.y);
    ctx.bezierCurveTo(p.x, p.y, p.x, p.y + p.h, p.x, p.y + p.h);
    ctx.lineTo(p.x + p.w, p.y + p.h);
    ctx.bezierCurveTo(p.x + p.w, p.y + p.h, p.x + p.w, p.y, p.x + p.w / 2, p.y);
    ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = "#000"; ctx.fillRect(p.x + 4, p.y + 10, p.w - 8, 10);
    ctx.fillStyle = "#32e685"; ctx.font = "bold 8px monospace";
    ctx.fillText(Math.random() > 0.5 ? "1" : "0", p.x + 6, p.y + 18);
    ctx.fillText(Math.random() > 0.5 ? "0" : "1", p.x + 15, p.y + 18);
    ctx.restore();
}

function drawToken(ctx, t) {
    ctx.save();
    ctx.font = "bold 19px 'Courier New'";
    ctx.shadowBlur = 12;
    let label = "";
    if (t.type === 'dontbuy') {
        label = "$dontbuy"; ctx.fillStyle = "#32e685"; ctx.shadowColor = "#32e685";
    } else if (t.type === 'xrp') {
        label = "$XRP"; ctx.fillStyle = "#19a3ff"; ctx.shadowColor = "#19a3ff";
    } else {
        label = "$FUZZY"; ctx.fillStyle = "#ff198b"; ctx.shadowColor = "#ff198b";
    }
    let floatY = Math.sin(Date.now() / 200) * 5;
    ctx.fillText(label, t.x, t.y + floatY);
    ctx.restore();
}

function drawMaxiEnemy(ctx, en) {
    ctx.save();
    let cx = en.x + en.w/2; let cy = en.y + en.h/2;
    ctx.shadowBlur = 15; ctx.shadowColor = "red";
    let grad = ctx.createLinearGradient(en.x, en.y, en.x, en.y + en.h);
    grad.addColorStop(0, "#f1c40f"); grad.addColorStop(1, "#f7931a");
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(cx, cy, en.h/2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "bold 16px serif"; ctx.fillText("₿", cx - 6, cy + 6);
    ctx.strokeStyle = "red"; ctx.lineWidth = 2;
    let laserDir = en.vx > 0 ? 50 : -50;
    ctx.beginPath(); ctx.moveTo(cx, cy - 2); ctx.lineTo(cx + laserDir, cy - 2 + (Math.random()*4-2)); ctx.stroke();
    ctx.restore();
}

function drawMEVBot(ctx, en) {
    ctx.save();
    let hover = Math.sin(Date.now() / 150) * 3;
    ctx.shadowBlur = 10; ctx.shadowColor = "#9b59b6";
    ctx.fillStyle = "#2c3e50";
    ctx.beginPath(); ctx.arc(en.x + en.w/2, en.y + hover + en.h/2, en.w/2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#3498db";
    ctx.beginPath(); ctx.arc(en.x + en.w/2, en.y + hover + en.h/2, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

// --- CORE GAME LOOP ---
function startGame() {
    playMusic();
    if (gameState === 'GAMEOVER') { 
        currentLevel = 1; 
        lives = 3; // Reset lives on hard reset
        score = { dontbuy: 0, xrp: 0, fuzzy: 0 }; 
    }
    document.querySelectorAll('.overlay').forEach(el => el.classList.add('hidden'));
    gameState = 'PLAYING';
    buildLevel(currentLevel);
    updateUI();
    requestAnimationFrame(update);
}

function nextLevel() { currentLevel++; startGame(); }

function die(msg) {
    lives--; // Lose a life
    updateUI();
    
    if (lives <= 0) {
        gameState = 'GAMEOVER';
        document.getElementById('screen-gameover').classList.remove('hidden');
        document.getElementById('death-msg').innerText = "FATAL_ERROR: " + msg;
    } else {
        // Soft reset: just restart the current level
        buildLevel(currentLevel);
    }
}

function win() {
    gameState = 'WIN';
    const winScreen = document.getElementById('screen-win');
    const rewardContainer = document.getElementById('dynamic-reward-container');
    const nextBtn = document.getElementById('next-btn');
    
    winScreen.classList.remove('hidden');
    
    if (currentLevel === 10) {
        // 1. Hide the "Next" button since there are no more levels
        nextBtn.classList.add('hidden');

        // 2. Change the headers for the finale
        document.getElementById('win-title').innerText = "SYSTEM_HIJACK_COMPLETE";
        document.getElementById('win-msg').innerText = "VOID_NODE_DECRYPTED";

        // 3. Obfuscate the Key and Email
      
        const k = "Vk9JRC1LRVktNTg5NTg5NTg5"; // 
        const e = "ZG9udGJ1eXRoaXNAcHJvdG9uLm1l"; // 

        // 4. Inject the reward only NOW
        rewardContainer.innerHTML = `
            <div style="margin-top:20px; border: 1px dashed #00ff41; padding: 20px; background: rgba(0,255,65,0.1);">
                <p style="color:#fff; margin-bottom:10px;">YOU DEFEATED THE VOID.</p>
                <p style="font-size:0.8rem; color:#008f11;">SEND THE KEY BELOW TO CLAIM YOUR REWARD:</p>
                <div style="background:#000; padding:10px; font-size:1.4rem; letter-spacing:3px; border:1px solid #00ff41; color:#00ff41;">
                    ${atob(k)}
                </div>
                <p style="margin-top:15px; font-size:0.9rem;">TARGET: ${atob(e)}</p>
            </div>
        `;
    } else {
        // Standard level win reset
        rewardContainer.innerHTML = "";
        nextBtn.classList.remove('hidden');
        document.getElementById('win-title').innerText = "LAYER_DECRYPTED";
        document.getElementById('win-msg').innerText = "DATA UPLOADED SUCCESSFULLY";
    }
}

function updateUI() {
    document.getElementById('db_score').innerText = score.dontbuy;
    document.getElementById('xrp_score').innerText = score.xrp;
    document.getElementById('fz_score').innerText = score.fuzzy;
    document.getElementById('lvl_num').innerText = currentLevel;
    // Update the lives in the HUD
    const livesDisplay = document.getElementById('lives_count');
    if(livesDisplay) livesDisplay.innerText = lives;
}

window.onkeydown = e => {
    if (e.code === 'ArrowUp' && player.jumpsLeft > 0 && gameState === 'PLAYING') {
        player.vy = JUMP; player.jumpsLeft--; player.grounded = false;
    }
    keys[e.code] = true;
};
window.onkeyup = e => keys[e.code] = false;

function update() {
    if (gameState !== 'PLAYING') return;
    if (keys['ArrowRight']) player.vx = SPEED;
    else if (keys['ArrowLeft']) player.vx = -SPEED;
    else player.vx = 0;
    player.vy += GRAVITY; player.x += player.vx; player.y += player.vy;
    cameraX = player.x - 250;
    if (cameraX < 0) cameraX = 0;
    if (cameraX > worldWidth - canvas.width) cameraX = worldWidth - canvas.width;
    player.grounded = false;
    platforms.forEach(p => {
        if (player.x < p.x + p.w && player.x + player.w > p.x &&
            player.y + player.h > p.y && player.y + player.h < p.y + 15 && player.vy >= 0) {
            player.grounded = true; player.jumpsLeft = 2; player.vy = 0; player.y = p.y - player.h;
        }
    });
    enemies.forEach(en => {
        en.x += en.vx;
        if (Math.abs(en.x - en.startX) > en.range) en.vx *= -1;
        if (player.x < en.x + en.w && player.x + player.w > en.x && player.y < en.y + en.h && player.y + player.h > en.y) {
            if (player.vy > 1) { en.y = -999; player.vy = JUMP * 0.8; } 
            else die("ACCESS DENIED: " + en.label);
        }
    });
    tokens.forEach(t => {
        if (!t.collected && player.x < t.x + 80 && player.x + player.w > t.x && player.y < t.y + 20 && player.y + player.h > t.y) {
            t.collected = true; score[t.type]++; updateUI();
        }
    });
    if (player.y > canvas.height) die("LOST IN THE MEMPOOL.");
    if (player.x > goal.x) win();
    document.getElementById('addr').innerText = "0x" + Math.floor(player.x).toString(16).toUpperCase();
    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save(); ctx.translate(-cameraX, 0);
    drawFlag(ctx, goal);
    platforms.forEach(p => drawPlatform(ctx, p));
    tokens.forEach(t => { if (!t.collected) drawToken(ctx, t); });
    enemies.forEach(en => {
        if (en.type === 'maxi') drawMaxiEnemy(ctx, en);
        else drawMEVBot(ctx, en);
    });
    drawPlayer(ctx, player);
    ctx.restore();
}
