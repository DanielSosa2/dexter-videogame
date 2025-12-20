// 1. objetos (player, controls)

// 2. funciones (jump, attack, bindTouch, etc)

// 3. listeners (keydown, touch, DOMContentLoaded)

// 4. gameLoop + update + draw
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");


let imagesLoaded = 0;       // Contador de imágenes que ya cargaron
const totalImages = 3;      // Cantidad total de imágenes del jugador

canvas.width = 800;
canvas.height = 600;

let blinkTimer = 0;
let score = 0;
let distance = 0;
const START_LIVES = 2;
let lives = START_LIVES;
let gameState = "start"; //"start", "playing", "gameover"
let gameRunning = false;
let speed = 5;
let ground_y;

let attackText = {
    text: "",
    x: 0,
    y: 0,
    timer: 0
};


//CONSTANTES
const crouch_height = 60;
const stand_height = 140;
const bgImg = new Image();
bgImg.src = "assets/background/background.PNG";

bgImg.onload = () => console.log("Fondo cargado");
bgImg.onerror = () => console.log("Error cargando fondo");

const gravity = 0.6;
// IMÁGENES DEL JUGADOR
const playerStanding = new Image();
playerStanding.src = "assets/player/Ninja-parado.png";
playerStanding.onload = () => console.log("standing listo");
playerStanding.onerror = () => console.error("Error cargando standing.png");

const playerJumping = new Image();
playerJumping.src = "assets/player/Ninja-saltando.png";
playerJumping.onload = () => console.log("jumping listo");
playerJumping.onerror = () => console.error("Error cargando jumping.png");

const playerCrouching = new Image();
playerCrouching.src = "assets/player/Ninja-agachado.png";
playerCrouching.onload = () => console.log("crouching listo");
playerCrouching.onerror = () => console.error("Error cargando crouching.png");

const katanaImg = new Image();
katanaImg.src = "assets/weapons/katana.png";

katanaImg.onload = () => console.log("Katana lista");
katanaImg.onerror = () => console.log("Error cargando katana.png");
// Sonidos del jugador
const soundJump = new Audio("assets/sounds/jumplanding.wav");
const soundAttack = new Audio("assets/sounds/katana.wav");
const soundHit = new Audio("assets/sounds/hit-sword.wav");
const soundGameOver = new Audio("assets/sounds/death-sound.wav");
const soundHitPlayer = new Audio("assets/sounds/ouch.wav");
//musica
const bgMusic = new Audio("assets/music/ninja-trap-beat-245893.mp3");
bgMusic.loop = true;      // para que se repita infinitamente
bgMusic.volume = 0.3;     // ajustar volumen (0 a 1)



// const ground_y = canvas.height - stand_height;

const controls = {
    jump: false,
    crouch: false,
    attack: false
};


const player = {
    x: 100,
    y: canvas.height - stand_height,
    width: 40,
    height: stand_height,
    velY: 0,
    jumping: false,
    attacking: false,
    crouching: false,

    hurt: false,
    hurtTimer: 0   // 👈 CLAVE
};

//Elementos del juego
const enemies = [];
const obstacles = [];

/**************************************************
 * 6. CONTROLES
 **************************************************/
document.addEventListener("keydown", (e) => {

    if (["ArrowUp", "ArrowDown", " "].includes(e.key)) {
        e.preventDefault();
    }

    if (e.key === "Enter") {
        startGame();
        console.log("ENTER")
        return;
    }

    if (gameState !== "playing") return;

    if (e.key === " " && !player.jumping) jump();
    if (e.key === "ArrowDown") crouch(true);
    if (e.key === "z") attack();
});


document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowDown") {
        crouch(false);
    }
});

const bindTouch = (id, action) => {
    const btn = document.getElementById(id);

    btn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        if (gameState !== "playing") return;
        controls[action] = true;
    });
    btn.addEventListener("touchend", () => {
        controls[action] = false;
    });
};

document.addEventListener("DOMContentLoaded", () => {

    bindTouch("btn-jump", "jump");
    bindTouch("btn-crouch", "crouch");
    bindTouch("btn-attack", "attack");
    resizeCanvas();
    updateGround();

    draw();

});

document.addEventListener("touchstart", () => {
    if (gameState === "start" || gameState === "gameover") {
        startGame();
    }
}, { once: true });




/**************************************************
 * 7. FUNCIONES DEL JUGADOR
 **************************************************/

function jump() {
    if (!player.jumping) {
        player.jumping = true;
        player.velY = -12; // ejemplo de salto
        soundJump.currentTime = 0; // reinicia el sonido si se repite
        soundJump.play();
    }
}

function updateGround() {
    ground_y = canvas.height - stand_height;
}

function crouch(active) {

    // ❌ no permitir crouch en el aire
    if (player.jumping) return;

    if (active) {
        player.height = stand_height - crouch_height;
        player.crouching = true;
    } else {
        player.height = stand_height;
        player.crouching = false;
    }

    player.y = ground_y - player.height;
}


function getAttackHitbox() {
    return {
        x: player.x + player.width,
        y: player.crouching ? player.y + player.height - 30 : player.y + 17,
        width: 120,
        height: 20,
    };
}


function attack() {
    if (player.attacking) return; // evita spam

    player.attacking = true;
    console.log("atacando");
    soundAttack.currentTime = 0;
    soundAttack.play();

    attackText.text = "MUERE INSECTO!";
    attackText.x = player.x + 20;
    attackText.y = player.y - 10;
    attackText.timer = 30; // frames visibles

    setTimeout(() => {
        player.attacking = false;
    }, 200);
}


function createEnemy() {

    const type = Math.random() < 0.5 ? "low" : "high";

    let enemy = {
        x: canvas.width,
        y: 0,
        width: 40,
        height: 0,
        alive: true,
        type: type
    };

    if (type === "low") {
        enemy.height = 50;
        enemy.y = ground_y - enemy.height;
    } else {
        enemy.height = 60;
        enemy.y = ground_y - enemy.height - 80; // enemigo alto
    }

    enemies.push(enemy);
}


function checkAllLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        // Todas las imágenes están listas
        startGame();  // iniciar el juego o el gameLoop

    }

}
function createObstacle() {
    const obstacle = {
        x: canvas.width,
        y: ground_y - 40,
        width: 40,
        height: 40
    };

    obstacles.push(obstacle);
}
function startGame() {
    console.log("Estado actual:", gameState);
    updateGround();

    // Reproducir música SOLO si no se está tocando ya
    if (bgMusic.paused) {
        bgMusic.play();
    }
    if (gameState === "start") {
        gameState = "playing";
        gameRunning = true;
        gameLoop();
    }
    else if (gameState === "gameover") {
        resetGame();
    }
}
function gameOver() {
    if (gameState === "gameover") return; // evita múltiples llamadas

    gameState = "gameover";
    gameRunning = false; // detener el loop si es necesario

    // Pausar música de fondo
    if (!bgMusic.paused) bgMusic.pause();

    // Reproducir sonido de gameOver
    if (soundGameOver.paused) {
        soundGameOver.currentTime = 0;
        soundGameOver.play();
    }
}
function resetGame() {
    score = 0;
    distance = 0;
    lives = START_LIVES; // 👈 CLAVE
    player.x = 50;
    player.y = ground_y - player.height;
    player.velY = 0;
    player.jumping = false;
    player.attacking = false;

    obstacles.length = 0;
    enemies.length = 0;

    gameState = "playing";
    gameRunning = true;
    // Reiniciar música de fondo
    if (bgMusic.paused) {
        bgMusic.currentTime = 0;
        bgMusic.play();
    }

    gameLoop();

}


function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}
function updateGround() {
    ground_y = canvas.height - stand_height;
}


// resizeCanvas();
// window.addEventListener("resize", resizeCanvas);

window.addEventListener("resize", () => {
    resizeCanvas();
    updateGround();
});




/**************************************************
 * 9. LÓGICA DEL JUEGO
 **************************************************/

function update() {
    // 1️⃣ LEER CONTROLES (PC + MOBILE)
    if (controls.jump && !player.jumping) {
        jump();
    }

    if (controls.crouch) {
        player.crouching = true;
    } else {
        player.crouching = false;
    }

    if (controls.attack) {
        attack();
    }

    // 2️⃣ FÍSICAS
    player.y += player.velY;
    player.velY += gravity;

    // Suelo
    if (player.y + player.height >= ground_y) {
        player.y = ground_y - player.height;
        player.velY = 0;
        player.jumping = false;
    }

    // 3️⃣ OBSTÁCULOS
    if (distance % 300 === 0) {
        createObstacle();
    }

    obstacles.forEach(obstacle => {
        obstacle.x -= speed;
    });

    // 4️⃣ ENEMIGOS
    enemies.forEach(enemy => {
        enemy.x -= speed;
    });

    // 5️⃣ DAÑO
    if (player.hurt) {
        player.hurtTimer--;
        if (player.hurtTimer <= 0) {
            player.hurt = false;
        }
    }

    // 6️⃣ VELOCIDAD
    speed = 5 + Math.floor(distance / 100);

    // 7️⃣ COLISIONES
    checkCollisions();

    distance++;
    score++;
}



/**************************************************
 * 10. COLISIONES
 **************************************************/

function isColliding(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

function checkCollisions() {
    enemies.forEach(enemy => {
        if (!enemy.alive) return;

        // ATAQUE
        if (player.attacking) {
            const attackBox = getAttackHitbox();

            if (isColliding(attackBox, enemy)) {
                enemy.alive = false;
                score += 100;
                return;
            }
        }
        //OBSTACULOS
        obstacles.forEach(obstacle => {
            if (
                player.x < obstacle.x + obstacle.width &&
                player.x + player.width > obstacle.x &&
                player.y < obstacle.y + obstacle.height &&
                player.y + player.height > obstacle.y
            ) {
                lives--;
                gameState = "gameover";


            }
        });

        // COLISIÓN NORMAL (daño al jugador)
        if (isColliding(player, enemy)) {

            enemy.alive = false;
            lives--;

            player.hurt = true;
            player.hurtTimer = 30; // frames
            soundHitPlayer.currentTime = 0; // reinicia el sonido si se repite
            soundHitPlayer.play();


            if (lives <= 0) {
                gameState = "gameover";
                gameRunning = false;
            }
        }
    });
}

/**************************************************
 * 11. DIBUJADO
 **************************************************/

function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0); // 🔥 RESET TOTAL
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

    if (gameState === "start") {
        ctx.fillStyle = "rgba(0,0,0,0.85)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.textAlign = "center";

        // TÍTULO
        ctx.font = "36px 'Press Start 2P'";
        ctx.shadowColor = "red";
        ctx.shadowBlur = 10;
        ctx.fillStyle = "yellow";
        ctx.fillText("DEXTER THE NINJA", canvas.width / 2, 100);
        ctx.shadowBlur = 0; // reset

        // SUBTÍTULO
        ctx.font = "18px Arial";
        ctx.fillStyle = "white";
        ctx.fillText("SOBREVIVÍ, ESQUIVÁ Y ATACÁ", canvas.width / 2, 140);

        // --- LEYENDA VISUAL ---
        const baseY = 200;
        const leftX = canvas.width / 2 - 180;

        ctx.textAlign = "left";
        ctx.font = "16px Arial";

        // ENEMIGO
        ctx.fillStyle = "red";
        ctx.fillRect(leftX, baseY, 30, 30);
        ctx.fillStyle = "white";
        ctx.fillText("ENEMIGO — ATACÁ (Z)", leftX + 45, baseY + 20);

        // OBSTÁCULO
        ctx.fillStyle = "brown";
        ctx.fillRect(leftX, baseY + 50, 30, 30);
        ctx.fillStyle = "white";
        ctx.fillText("OBSTÁCULO — ESQUIVÁ", leftX + 45, baseY + 70);

        // CONTROLES
        ctx.textAlign = "center";
        ctx.fillStyle = "white";
        ctx.fillText("SALTAR: ESPACIO / TOQUE", canvas.width / 2, baseY + 130);
        ctx.fillText("AGACHARSE: ↓", canvas.width / 2, baseY + 160);

        // START
        ctx.font = "20px Arial";
        ctx.fillStyle = "yellow";
        ctx.fillText("ENTER o TOCÁ PARA COMENZAR", canvas.width / 2, canvas.height - 80);

        return;
    }


    // GAME OVER SCREEN
    if (gameState === "gameover") {
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.textAlign = "center";
        ctx.font = "56px 'Press Start 2P'";
        ctx.fillStyle = "red";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);

        ctx.font = "20px Arial";
        ctx.fillStyle = "white";
        ctx.fillText("ENTER o TOCAR PARA REINICIAR", canvas.width / 2, canvas.height / 2 + 30);

        return; // 👈 CLAVE
    }

    // ⬇️ TODO LO DEMÁS DEL DRAW NORMAL
    // PISO
    ctx.fillStyle = "#5a3a1a"; // marrón más lindo
    ctx.fillRect(0, ground_y - 10, canvas.width, 10);

    // sombra arriba del piso
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(0, ground_y - 10, canvas.width, 2);
    //OBSTACULOS
    ctx.fillStyle = "brown";
    obstacles.forEach(obstacle => {
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });


    // Jugador //PARPADEO AL RECIBIR DAÑO
    if (!player.hurt || player.hurtTimer % 6 < 3) {
        let img;
        if (player.jumping) {
            img = playerJumping;
        } else if (player.crouching) {
            img = playerCrouching;
        } else {
            img = playerStanding;
        }

        ctx.drawImage(img, player.x, player.y, player.width, player.height);
    }

    // Enemigos
    enemies.forEach(enemy => {
        if (!enemy.alive) return;

        if (enemy.type === "low") {
            ctx.fillStyle = "red";
        } else {
            ctx.fillStyle = "red";
        }

        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });


    //ataque

    if (player.attacking) {
        const hit = getAttackHitbox();
        // Dibujar la katana
        ctx.drawImage(katanaImg, hit.x, hit.y, hit.width, hit.height);
    }

    if (attackText.timer > 0) {
        ctx.font = "18px Arial";
        ctx.fillStyle = "red";
        ctx.fillText(attackText.text, attackText.x, attackText.y);

        attackText.y -= 1;   // sube
        attackText.timer--;
    }


    // HUD
    const margin = 20;
    const lineHeight = 26;

    ctx.textAlign = "left";
    ctx.font = "18px 'Press Start 2P'";
    ctx.fillStyle = "white";

    // Fondo del HUD (opcional pero recomendado)
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(10, 10, 260, 90);

    // Texto
    ctx.fillStyle = "white";
    ctx.fillText(`DIST: ${distance}`, margin, 40);
    // CORAZONES (VIDAS)
    const heartSize = 24;
    const heartSpacing = 35;
    const heartsX = margin;
    const heartsY = 65;
    for (let i = 0; i < lives; i++) {
        ctx.font = `${heartSize}px Arial`;
        ctx.fillStyle = "red";
        ctx.fillText("❤️", heartsX + i * heartSpacing, heartsY);
    }

    ctx.fillStyle = "red";
    ctx.fillText(`SCORE: ${score}`, margin, 90);


}

/**************************************************
 * 12. GAME LOOP
 **************************************************/

function gameLoop() {
    if (!gameRunning) return;

    update();
    draw();
    requestAnimationFrame(gameLoop);
}

/**************************************************
 * 13. INICIO DEL JUEGO
 **************************************************/

setInterval(() => {
    if (gameState === "playing") {
        createEnemy();
    }
}, 2000);
