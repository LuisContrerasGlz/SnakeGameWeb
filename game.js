// Configuración general de la cuadrícula
const GRID_SIZE = 20;
const TILE_COUNT = 20;

// Elementos del DOM
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('current-score');
const highScoreEl = document.getElementById('high-score');
const overlayEl = document.getElementById('game-overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMsg = document.getElementById('overlay-message');
const finalStats = document.getElementById('final-stats');
const finalScoreEl = document.getElementById('final-score');
const newRecordMsg = document.getElementById('new-record-msg');
const actionBtn = document.getElementById('action-btn');
const muteBtn = document.getElementById('mute-btn');
const muteIcon = document.getElementById('mute-icon');

// Sonidos del juego usando la Web Audio API (Sintetizador en tiempo real)
const audio = {
    ctx: null,
    muted: false,

    init() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API no es soportada en este navegador.');
        }
    },

    play(type) {
        if (this.muted || !this.ctx) return;
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        const now = this.ctx.currentTime;

        if (type === 'eat') {
            // Sonido de comer: beep rápido ascendente
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(350, now);
            osc.frequency.exponentialRampToValueAtTime(750, now + 0.12);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
            osc.start(now);
            osc.stop(now + 0.12);
        } else if (type === 'death') {
            // Sonido de colisión: onda sierra que desciende drásticamente
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.linearRampToValueAtTime(40, now + 0.45);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
            osc.start(now);
            osc.stop(now + 0.45);
        } else if (type === 'start') {
            // Arpegio retro al iniciar
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
            
            osc.frequency.setValueAtTime(330, now); // E4
            osc.frequency.setValueAtTime(392, now + 0.08); // G4
            osc.frequency.setValueAtTime(523.25, now + 0.16); // C5
            
            osc.start(now);
            osc.stop(now + 0.35);
        } else if (type === 'pause') {
            // Sonido simple descendente al pausar
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.linearRampToValueAtTime(200, now + 0.08);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        }
    }
};

// Estado del juego
let snake = [];
let food = { x: 0, y: 0 };
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let score = 0;
let highScore = parseInt(localStorage.getItem('snake_high_score')) || 0;
let gameState = 'START'; // START, PLAYING, PAUSED, GAME_OVER
let lastTickTime = 0;
let gameSpeed = 130; // Tiempo en ms entre actualizaciones
let particles = [];

// Inicializar High Score en la interfaz
highScoreEl.textContent = String(highScore).padStart(3, '0');

// Generar partículas cuando come comida
function spawnParticles(x, y) {
    const canvasX = (x * GRID_SIZE) + (GRID_SIZE / 2);
    const canvasY = (y * GRID_SIZE) + (GRID_SIZE / 2);
    const particleCount = 10;
    
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        particles.push({
            x: canvasX,
            y: canvasY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: '#ff007f',
            radius: 2 + Math.random() * 3,
            alpha: 1,
            decay: 0.02 + Math.random() * 0.03
        });
    }
}

// Actualizar posición y opacidad de las partículas
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        
        if (p.alpha <= 0) {
            particles.splice(i, 1);
        }
    }
}

// Iniciar nueva partida
function resetGame() {
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    gameSpeed = 130;
    scoreEl.textContent = '000';
    spawnFood();
    particles = [];
}

// Colocar comida en una posición aleatoria no ocupada por la serpiente
function spawnFood() {
    let validPosition = false;
    let newFood = {};
    
    while (!validPosition) {
        newFood = {
            x: Math.floor(Math.random() * TILE_COUNT),
            y: Math.floor(Math.random() * TILE_COUNT)
        };
        
        // Verificar que no aparezca dentro del cuerpo de la serpiente
        validPosition = !snake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
    }
    
    food = newFood;
}

// Controlar cambios de dirección mediante teclado
function handleKeyDown(e) {
    // Evitar scroll con flechas y barra espaciadora en el navegador
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
        e.preventDefault();
    }

    if (gameState === 'PLAYING') {
        switch (e.code) {
            // Arriba
            case 'ArrowUp':
            case 'KeyW':
                if (direction.y !== 1) nextDirection = { x: 0, y: -1 };
                break;
            // Abajo
            case 'ArrowDown':
            case 'KeyS':
                if (direction.y !== -1) nextDirection = { x: 0, y: 1 };
                break;
            // Izquierda
            case 'ArrowLeft':
            case 'KeyA':
                if (direction.x !== 1) nextDirection = { x: -1, y: 0 };
                break;
            // Derecha
            case 'ArrowRight':
            case 'KeyD':
                if (direction.x !== -1) nextDirection = { x: 1, y: 0 };
                break;
            // Pausa
            case 'Space':
                pauseGame();
                break;
        }
    } else if (e.code === 'Space') {
        handleMainAction();
    }
}

// Lógica al presionar el botón principal o barra espaciadora
function handleMainAction() {
    audio.init();
    
    if (gameState === 'START' || gameState === 'GAME_OVER') {
        resetGame();
        gameState = 'PLAYING';
        overlayEl.classList.add('hidden');
        audio.play('start');
    } else if (gameState === 'PAUSED') {
        gameState = 'PLAYING';
        overlayEl.classList.add('hidden');
        audio.play('start');
    }
}

// Pausar juego
function pauseGame() {
    gameState = 'PAUSED';
    audio.play('pause');
    overlayTitle.textContent = 'PAUSA';
    overlayMsg.textContent = 'PRESIONA LA BARRA ESPACIADORA PARA CONTINUAR';
    finalStats.classList.add('hidden');
    actionBtn.textContent = 'CONTINUAR';
    overlayEl.classList.remove('hidden');
}

// Fin de la partida
function gameOver() {
    gameState = 'GAME_OVER';
    audio.play('death');
    
    // Guardar nuevo récord si aplica
    let isNewRecord = false;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snake_high_score', highScore);
        highScoreEl.textContent = String(highScore).padStart(3, '0');
        isNewRecord = true;
    }
    
    // Actualizar menú final
    overlayTitle.textContent = 'FIN DEL JUEGO';
    overlayMsg.textContent = 'PRESIONA LA BARRA ESPACIADORA PARA REINICIAR';
    finalScoreEl.textContent = score;
    
    if (isNewRecord) {
        newRecordMsg.classList.remove('hidden');
    } else {
        newRecordMsg.classList.add('hidden');
    }
    
    finalStats.classList.remove('hidden');
    actionBtn.textContent = 'VOLVER A JUGAR';
    overlayEl.classList.remove('hidden');
}

// Actualizar posición de la serpiente y verificar colisiones
function updateGame() {
    // Aplicar la dirección en el tick actual
    direction = nextDirection;
    
    // Calcular nueva cabeza
    const head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };
    
    // Colisión contra bordes
    if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
        gameOver();
        return;
    }
    
    // Colisión contra sí misma
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver();
        return;
    }
    
    // Mover serpiente
    snake.unshift(head);
    
    // Verificar si come comida
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreEl.textContent = String(score).padStart(3, '0');
        
        spawnParticles(food.x, food.y);
        audio.play('eat');
        spawnFood();
        
        // Incrementar velocidad gradualmente
        gameSpeed = Math.max(65, 130 - Math.floor(score / 30) * 5);
    } else {
        // Si no come, remueve la cola para simular el movimiento
        snake.pop();
    }
}

// Dibujar todos los elementos gráficos en el Canvas
function draw() {
    // Limpiar canvas
    ctx.fillStyle = '#04040e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar cuadrícula de fondo con opacidad muy sutil (look retro)
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.02)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= TILE_COUNT; i++) {
        // Líneas verticales
        ctx.beginPath();
        ctx.moveTo(i * GRID_SIZE, 0);
        ctx.lineTo(i * GRID_SIZE, canvas.height);
        ctx.stroke();
        
        // Líneas horizontales
        ctx.beginPath();
        ctx.moveTo(0, i * GRID_SIZE);
        ctx.lineTo(canvas.width, i * GRID_SIZE);
        ctx.stroke();
    }

    // Resetear sombra por defecto
    ctx.shadowBlur = 0;
    
    // Dibujar comida
    const foodX = food.x * GRID_SIZE + GRID_SIZE / 2;
    const foodY = food.y * GRID_SIZE + GRID_SIZE / 2;
    const foodRadius = GRID_SIZE / 2 - 2;
    
    ctx.fillStyle = '#ff007f';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff007f';
    ctx.beginPath();
    ctx.arc(foodX, foodY, foodRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Dibujar serpiente
    ctx.shadowColor = '#39ff14';
    snake.forEach((segment, index) => {
        const x = segment.x * GRID_SIZE;
        const y = segment.y * GRID_SIZE;
        
        // Efecto visual: los segmentos finales se reducen de tamaño gradualmente
        const sizeRatio = Math.max(0.65, 1 - (index / snake.length) * 0.25);
        const padding = (GRID_SIZE * (1 - sizeRatio)) / 2;
        const size = GRID_SIZE * sizeRatio;
        
        ctx.fillStyle = '#39ff14';
        
        // Mayor brillo en la cabeza
        ctx.shadowBlur = index === 0 ? 12 : 6;
        
        // Dibujar el segmento redondeado
        drawRoundedRect(ctx, x + padding, y + padding, size, size, 4);
    });
    
    // Dibujar partículas
    ctx.shadowBlur = 0;
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0; // Restaurar opacidad
}

// Función auxiliar para rectángulos redondeados
function drawRoundedRect(context, x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + radius);
    context.lineTo(x + width, y + height - radius);
    context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    context.lineTo(x + radius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
    context.fill();
}

// Manejar Silenciador de Sonido
muteBtn.addEventListener('click', () => {
    audio.muted = !audio.muted;
    muteIcon.textContent = audio.muted ? '🔇' : '🔊';
    
    // Activar contexto si estaba suspendido y se reactiva el audio
    if (!audio.muted) {
        audio.init();
    }
});

// Event Listeners
window.addEventListener('keydown', handleKeyDown);
actionBtn.addEventListener('click', handleMainAction);

// Bucle principal de animación y tiempo de render
function loop(timestamp) {
    if (!lastTickTime) {
        lastTickTime = timestamp;
    }
    
    const elapsed = timestamp - lastTickTime;
    
    if (gameState === 'PLAYING') {
        if (elapsed >= gameSpeed) {
            updateGame();
            lastTickTime = timestamp;
        }
        updateParticles();
    } else {
        // Seguir procesando y desvaneciendo partículas residuales si no está en juego activo
        updateParticles();
    }
    
    draw();
    requestAnimationFrame(loop);
}

// Iniciar bucle del juego
requestAnimationFrame(loop);
