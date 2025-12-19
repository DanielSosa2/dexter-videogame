// 1. objetos (player, controls)

// 2. funciones (jump, attack, bindTouch, etc)

// 3. listeners (keydown, touch, DOMContentLoaded)

// 4. gameLoop + update + draw
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;

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
const crouch_height = 40;
const stand_height = 120;

const gravity = 0.6;


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
    player.velY = -13;
    player.jumping = true;
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
        width: 80,
        height: 20,
    };
}


function attack() {
    if (player.attacking) return; // evita spam

    player.attacking = true;
    console.log("atacando");

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
    if (gameState === "start") {
        gameState = "playing";
        gameRunning = true;
        gameLoop();
    }
    else if (gameState === "gameover") {
        resetGame();
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

    // START SCREEN
    if (gameState === "start") {
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // ctx.fillStyle = "red";
        // ctx.fillRect(0, 0, 50, 50);

        ctx.textAlign = "center";
        ctx.font = "36px 'Press Start 2P'";
        ctx.fillStyle = "yellow";
        ctx.fillText("DEXTER THE NINJA", canvas.width / 2, canvas.height / 2 - 40);

        ctx.font = "20px Arial";
        ctx.fillStyle = "white";
        ctx.fillText("ENTER o TOCÁ PARA COMENZAR", canvas.width / 2, canvas.height / 2 + 10);

        return; // 👈 CLAVE
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
    ctx.fillStyle = "brown"
    ctx.fillRect(0, ground_y - 2, canvas.width, 2);
    //OBSTACULOS
    ctx.fillStyle = "brown";
    obstacles.forEach(obstacle => {
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
    // Jugador //PARPADEO AL RECIBIR DAÑO
    if (!player.hurt || player.hurtTimer % 6 < 3) {
        ctx.fillStyle = "yellow";
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }

    // Enemigos
    enemies.forEach(enemy => {
        if (!enemy.alive) return;

        if (enemy.type === "low") {
            ctx.fillStyle = "red";
        } else {
            ctx.fillStyle = "purple";
        }

        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });


    //ataque

    if (player.attacking) {
        const hit = getAttackHitbox();
        ctx.fillStyle = "rgba(240, 7, 182, 0.6)";
        ctx.fillRect(hit.x, hit.y, hit.width, hit.height);
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
    ctx.fillText(`VIDAS: ${lives}`, margin, 65);

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
