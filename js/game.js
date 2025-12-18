const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;

let score = 0;
let distance = 0;
let lives = 2;
let gameState = "start"; //"start", "playing", "gameover"
let speed = 5;

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


const ground_y = canvas.height - stand_height;



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

    // START
    if (gameState === "start" && e.key === "Enter") {
        gameState = "playing";
        return;
    }

    // GAME OVER → REINICIAR
    if (gameState === "gameover" && e.key === "Enter") {
        resetGame();
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




/**************************************************
 * 7. FUNCIONES DEL JUGADOR
 **************************************************/

function jump() {
    player.velY = -13;
    player.jumping = true;
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

function resetGame() {
    score = 0;
    distance = 0;
    lives = 2;
    speed = 5;

    enemies.length = 0;

    player.y = ground_y - player.height;
    player.velY = 0;
    player.jumping = false;
    player.attacking = false;

    gameState = "playing";
}


/**************************************************
 * 9. LÓGICA DEL JUEGO
 **************************************************/

function update() {
    if (gameState !== "playing") return;

    // Gravedad
    player.y += player.velY;
    player.velY += gravity;

    // Suelo (los pies SIEMPRE en ground_y)
    if (player.y + player.height >= ground_y) {
        player.y = ground_y - player.height;
        player.velY = 0;
        player.jumping = false;
    }
    //OBSTACULOS
    if (distance % 300 === 0) {
        createObstacle();
    }
    obstacles.forEach(obstacle => {
        obstacle.x -= speed;
    });
    //RECIBIR DAÑO (parpadeo de pantalla)
    if (player.hurt) {
        player.hurtTimer--;
        if (player.hurtTimer <= 0) {
            player.hurt = false;
        }
    }
    // Mover enemigos
    enemies.forEach(enemy => {
        enemy.x -= speed;
    });

    speed = 5 + Math.floor(distance / 100);

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
            }
        }
    });
}

/**************************************************
 * 11. DIBUJADO
 **************************************************/

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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

    // START
    if (gameState === "start") {
        ctx.font = "36px 'Press Start 2P'";
        ctx.textAlign = "center";

        ctx.fillStyle = "yellow";
        ctx.fillText("DEXTER THE NINJA", canvas.width / 2, 250);

        ctx.font = "20px Arial";
        ctx.textAlign = "center"
        ctx.fillText("Presioná ENTER para comenzar", canvas.width / 2, 280);
    }
    // GAME OVER
    if (gameState === "gameover") {
        // fondo oscuro
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = "56px 'Press Start 2P'";
        ctx.textAlign = "center"
        ctx.fillStyle = "red";
        ctx.fillText("GAME OVER", canvas.width / 2, 250);

        ctx.font = "20px Arial";
        ctx.fillText("Presioná ENTER para reiniciar", canvas.width / 2, 300);
    }


}






/**************************************************
 * 12. GAME LOOP
 **************************************************/

function gameLoop() {
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
gameLoop();