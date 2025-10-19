class AudioManager {
    constructor() {
        this.audioCtx = null;
    }

    init() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playSound(soundType) {
        if (!this.audioCtx) return;

        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        switch (soundType) {
            case 'click':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(880, this.audioCtx.currentTime);
                gainNode.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioCtx.currentTime + 0.1);
                break;
            case 'score':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(523.25, this.audioCtx.currentTime);
                gainNode.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1046.50, this.audioCtx.currentTime + 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioCtx.currentTime + 0.2);
                break;
            case 'invalid':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(110, this.audioCtx.currentTime);
                gainNode.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioCtx.currentTime + 0.2);
                break;
            case 'gameOver':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(16.35, this.audioCtx.currentTime);
                gainNode.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(200, this.audioCtx.currentTime + 1);
                gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioCtx.currentTime + 1);
                break;
        }

        oscillator.start(this.audioCtx.currentTime);
        oscillator.stop(this.audioCtx.currentTime + 1);
    }
}

class Point {
    constructor(x, y, initialConnections = 0) {
        this.x = x;
        this.y = y;
        this.connections = initialConnections;
        this.isDead = false;
    }
}

class DotLine {
    constructor(canvas) {
        this.audioManager = new AudioManager();
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.points = [];
        this.lines = [];
        this.animatingLines = [];
        this.selectedPoint = null;
        this.currentPlayer = 0;
        this.players = [];
        this.gameOver = false;
        this.isDrawing = false;
        this.isAiTurn = false;
        this.gameReady = false;
        this.currentPath = [];
        this.snapTarget = null;

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));

        this.gameLoop();
    }

    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        for (let i = this.animatingLines.length - 1; i >= 0; i--) {
            const line = this.animatingLines[i];
            line.progress += line.speed;

            if (line.progress >= 1) {
                this.lines.push(line);
                this.animatingLines.splice(i, 1);
            }
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.ctx.strokeStyle = '#222';
        this.ctx.lineWidth = 0.5;
        for(let i = 0; i < this.canvas.width; i += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.canvas.height);
            this.ctx.stroke();
        }
        for(let i = 0; i < this.canvas.height; i += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.canvas.width, i);
            this.ctx.stroke();
        }

        // Draw current path
        if (this.isDrawing && this.currentPath.length > 0 && this.players.length > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.currentPath[0].x, this.currentPath[0].y);
            for(let i = 1; i < this.currentPath.length; i++) {
                this.ctx.lineTo(this.currentPath[i].x, this.currentPath[i].y);
            }
            
            if (this.snapTarget) {
                const lastPoint = this.currentPath[this.currentPath.length - 1];
                this.ctx.lineTo(this.snapTarget.x, this.snapTarget.y);
            }

            this.ctx.strokeStyle = this.players[this.currentPlayer].color;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }

        // Draw animating lines
        for (const line of this.animatingLines) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = line.color;
            this.ctx.lineWidth = 2;
            const totalLength = line.path.length - 1;
            const currentLength = totalLength * line.progress;
            for (let i = 0; i < Math.floor(currentLength); i++) {
                this.ctx.moveTo(line.path[i].x, line.path[i].y);
                this.ctx.lineTo(line.path[i+1].x, line.path[i+1].y);
            }
            const lastSegmentIndex = Math.floor(currentLength);
            const lastSegmentProgress = currentLength - lastSegmentIndex;
            const p1 = line.path[lastSegmentIndex];
            const p2 = line.path[lastSegmentIndex + 1];
            if (p1 && p2) {
                const x = p1.x + (p2.x - p1.x) * lastSegmentProgress;
                const y = p1.y + (p2.y - p1.y) * lastSegmentProgress;
                this.ctx.moveTo(p1.x, p1.y);
                this.ctx.lineTo(x, y);
            }
            this.ctx.stroke();
        }

        // Draw lines with glow effect
        for(const line of this.lines) {
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = line.color;
            this.ctx.beginPath();
            if (line.path && line.path.length > 2) {
                const startPoint = line.path[0];
                const endPoint = line.path[line.path.length - 1];
                const controlPoint = line.path[Math.floor(line.path.length / 2)];
                this.ctx.moveTo(startPoint.x, startPoint.y);
                this.ctx.quadraticCurveTo(controlPoint.x, controlPoint.y, endPoint.x, endPoint.y);
            } else {
                this.ctx.moveTo(line.p1.x, line.p1.y);
                this.ctx.lineTo(line.p2.x, line.p2.y);
            }
            this.ctx.strokeStyle = line.color;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
        
        this.ctx.shadowBlur = 0;

        // Draw points
        for(const point of this.points) {
            if (point.connections >= 3 && !point.isDead) {
                point.isDying = true;
            }

            let pointColor = '#fff';
            switch (point.connections) {
                case 1:
                    pointColor = '#ffd700'; // Yellow
                    break;
                case 2:
                    pointColor = '#ff0000'; // Red
                    break;
            }

            if (point.isDying) {
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                this.ctx.fill();
                point.isDead = true;
                point.isDying = false;
            } else if (!point.isDead) {
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
                this.ctx.fillStyle = '#222';
                this.ctx.fill();
                
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
                this.ctx.fillStyle = pointColor;
                this.ctx.fill();

                if(point === this.selectedPoint) {
                    this.ctx.beginPath();
                    this.ctx.arc(point.x, point.y, 12, 0, Math.PI * 2);
                    this.ctx.strokeStyle = this.players[this.currentPlayer].color;
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
            } else {
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
                this.ctx.fillStyle = '#666';
                this.ctx.fill();
            }
        }
    }

    resizeCanvas() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
    }

    initGame(playerCount, initialPoints) {
        this.gameReady = false;
        this.gameMode = document.getElementById('gameMode').value;
        if (this.gameMode !== 'pvp') {
            playerCount = 2;
        }

        this.points = [];
        this.lines = [];
        this.animatingLines = [];
        this.selectedPoint = null;
        this.currentPlayer = 0;
        this.gameOver = false;
        this.isDrawing = false;
        this.isAiTurn = false;
        this.currentPath = [];
        
        const playerName = document.getElementById('playerName').value || 'Jugador';
        this.players = [];
        const colors = ['#00ff9d', '#ff9900', '#00a1ff', '#ff3366'];
        for(let i = 0; i < playerCount; i++) {
            const isAi = this.gameMode !== 'pvp' && i === 1;
            this.players.push({
                name: isAi ? 'MIA' : playerName,
                color: colors[i],
                score: 0,
                isAi: isAi
            });
        }

        // Randomly select the starting player
        this.currentPlayer = Math.floor(Math.random() * this.players.length);

        this.logMessage(`Nueva partida iniciada con ${playerCount} jugadores.`);
        this.logMessage(`Es el turno de ${this.getPlayerName(this.currentPlayer)}.`, this.players[this.currentPlayer].color);

        for(let i = 0; i < initialPoints; i++) {
            this.points.push(new Point(
                Math.random() * (this.canvas.width - 100) + 50,
                Math.random() * (this.canvas.height - 100) + 50
            ));
        }

        this.updatePlayerInfo();
        this.resizeCanvas();
        this.render();
        this.gameReady = true;

        // If the first player is an AI, trigger its turn
        if (this.players[this.currentPlayer].isAi) {
            this.isAiTurn = true;
            setTimeout(() => this.makeAiMove(), 1000);
        }
    }

    updatePlayerInfo() {
        const container = document.getElementById('playerInfo');
        container.innerHTML = '';
        this.players.forEach((player, index) => {
            const div = document.createElement('div');
            div.className = `player ${index === this.currentPlayer ? 'active' : ''}`;
            div.style.backgroundColor = player.color + '40';
            div.textContent = `${player.name}: ${player.score}`;
            container.appendChild(div);
        });
    }

    getPlayerName(playerIndex) {
        return this.players[playerIndex].name;
    }

    getEventCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        let touch;
        if (e.touches && e.touches.length > 0) {
            touch = e.touches[0];
        } else if (e.changedTouches && e.changedTouches.length > 0) {
            touch = e.changedTouches[0];
        }

        if (touch) {
            return {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            };
        }
        
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    handleMouseDown(e) {
        this.audioManager.init();
        this.audioManager.playSound('click');
        if (!this.gameReady || this.gameOver || this.isAiTurn) return;
        const coords = this.getEventCoordinates(e);
        const clickedPoint = this.points.find(p => 
            Math.hypot(p.x - coords.x, p.y - coords.y) < 10 && !p.isDead
        );

        if(clickedPoint) {
            this.isDrawing = true;
            this.selectedPoint = clickedPoint;
            this.currentPath = [{x: clickedPoint.x, y: clickedPoint.y}];
        }
    }

    handleMouseMove(e) {
        if(!this.isDrawing || !this.selectedPoint) return;
        const coords = this.getEventCoordinates(e);
        this.currentPath.push({x: coords.x, y: coords.y});

        // Snap to point logic
        const snapRadius = 20;
        let snapPoint = null;
        for (const point of this.points) {
            if (point !== this.selectedPoint && !point.isDead) {
                const dist = Math.hypot(point.x - coords.x, point.y - coords.y);
                if (dist < snapRadius) {
                    snapPoint = point;
                    break;
                }
            }
        }
        this.snapTarget = snapPoint;
    }

    handleMouseUp(e) {
        if(!this.isDrawing) return;

        const endPoint = this.snapTarget || this.points.find(p => {
            const coords = this.getEventCoordinates(e);
            return Math.hypot(p.x - coords.x, p.y - coords.y) < 10 && !p.isDead;
        });

        if (this.executeMove(this.selectedPoint, endPoint)) {
            this.nextTurn();
        }

        this.isDrawing = false;
        this.selectedPoint = null;
        this.currentPath = [];
        this.snapTarget = null; // Reset snapTarget
    }

    executeMove(startPoint, endPoint) {
        if(endPoint && this.canConnect(startPoint, endPoint)) {
            let intersects = false;
            for (const line of this.lines) {
                if (line.path && line.path.length > 1) {
                    for (let k = 0; k < line.path.length - 1; k++) {
                        const segmentStart = line.path[k];
                        const segmentEnd = line.path[k+1];

                        const dist1 = Math.hypot(startPoint.x - segmentStart.x, startPoint.y - segmentStart.y);
                        const dist2 = Math.hypot(startPoint.x - segmentEnd.x, startPoint.y - segmentEnd.y);
                        if (dist1 < 10 || dist2 < 10) {
                            continue;
                        }

                        if (this.linesIntersect(startPoint, endPoint, segmentStart, segmentEnd)) {
                            intersects = true;
                            break;
                        }
                    }
                } else {
                    if (this.linesIntersect(startPoint, endPoint, line.p1, line.p2)) {
                        intersects = true;
                    }
                }
                if (intersects) break;
            }

            if (!intersects) {
                if (endPoint !== startPoint) {
                    const midIndex = Math.floor(this.currentPath.length / 2);
                    const midPoint = this.currentPath[midIndex];
                    const newPoint = new Point(midPoint.x, midPoint.y, 2);
                    this.animatingLines.push({
                        p1: startPoint,
                        p2: newPoint,
                        color: this.players[this.currentPlayer].color,
                        path: this.currentPath.slice(0, midIndex + 1),
                        progress: 0,
                        speed: 0.05
                    });
                    this.animatingLines.push({
                        p1: newPoint,
                        p2: endPoint,
                        color: this.players[this.currentPlayer].color,
                        path: this.currentPath.slice(midIndex),
                        progress: 0,
                        speed: 0.05
                    });
                    startPoint.connections++;
                    endPoint.connections++;
                    let pointDied = false;
                    if(startPoint.connections >= 3) {
                        startPoint.isDying = true;
                        pointDied = true;
                    }
                    if(endPoint.connections >= 3) {
                        endPoint.isDying = true;
                        pointDied = true;
                    }
                    if(newPoint.connections >= 3) {
                        newPoint.isDying = true;
                        pointDied = true;
                    }
                    if (pointDied) {
                        this.logMessage('¡Un punto ha sido cerrado!');
                    }

                    this.points.push(newPoint);
                    this.players[this.currentPlayer].score++;
                    this.audioManager.playSound('score');
                    this.logMessage(`${this.getPlayerName(this.currentPlayer)} anotó un punto!`, this.players[this.currentPlayer].color);
                    return true;
                }
            } else {
                this.triggerInvalidMoveAnimation();
                this.audioManager.playSound('invalid');
                this.logMessage('Movimiento inválido: Las líneas no pueden cruzarse.', '#ff6b6b');
                return false;
            }
        } else if (this.isDrawing) {
            this.triggerInvalidMoveAnimation();
            this.audioManager.playSound('invalid');
            this.logMessage('Movimiento inválido.', '#ff6b6b');
            return false;
        }
        return false;
    }

    handleTouchStart(e) {
        e.preventDefault();
        this.handleMouseDown(e);
    }

    handleTouchMove(e) {
        e.preventDefault();
        this.handleMouseMove(e);
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.handleMouseUp(e);
    }

    canConnect(p1, p2) {
        if(p1.isDead || p2.isDead) return false;
        if(p1 === p2) return false;
        return p1.connections < 3 && p2.connections < 3;
    }

    orientation(p, q, r) {
        const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
        const epsilon = 1e-10;
        if (Math.abs(val) < epsilon) return 0;
        return (val > 0) ? 1 : 2;
    }

    onSegment(p, q, r) {
        return (q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
            q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y));
    }

    linesIntersect(p1, q1, p2, q2) {
        const epsilon = 1e-5;
        const pointsShareEndpoint = 
            (Math.abs(p1.x - p2.x) < epsilon && Math.abs(p1.y - p2.y) < epsilon) ||
            (Math.abs(p1.x - q2.x) < epsilon && Math.abs(p1.y - q2.y) < epsilon) ||
            (Math.abs(q1.x - p2.x) < epsilon && Math.abs(q1.y - p2.y) < epsilon) ||
            (Math.abs(q1.x - q2.x) < epsilon && Math.abs(q1.y - q2.y) < epsilon);

        if (pointsShareEndpoint) {
            return false;
        }

        const o1 = this.orientation(p1, q1, p2);
        const o2 = this.orientation(p1, q1, q2);
        const o3 = this.orientation(p2, q2, p1);
        const o4 = this.orientation(p2, q2, q1);

        if (o1 !== o2 && o3 !== o4) {
            return true;
        }

        return false;
    }

    triggerInvalidMoveAnimation() {
        this.canvas.classList.add('invalid-move');
        setTimeout(() => {
            this.canvas.classList.remove('invalid-move');
        }, 300);
    }

    logMessage(message, color) {
        const consoleElement = document.getElementById('message-console');
        const messageElement = document.createElement('div');
        messageElement.className = 'console-message';
        messageElement.textContent = `> ${message}`;
        if (color) {
            messageElement.style.color = color;
        }
        consoleElement.appendChild(messageElement);
        consoleElement.scrollTop = consoleElement.scrollHeight;
    }

    nextTurn() {
        this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
        this.updatePlayerInfo();
        this.logMessage(`Es el turno de ${this.getPlayerName(this.currentPlayer)}.`, this.players[this.currentPlayer].color);
        
        this.gameOver = !this.hasValidMoves();
        if(this.gameOver) {
            this.audioManager.playSound('gameOver');
            const winner = this.players.reduce((prev, curr, idx) => 
                curr.score > prev.score ? {score: curr.score, index: idx} : prev,
                {score: -1, index: -1}
            );
            this.logMessage(`¡Fin del juego! ${this.getPlayerName(winner.index)} gana con ${winner.score} puntos!`, '#00ff9d');
        } else if (this.players[this.currentPlayer].isAi) {
            this.isAiTurn = true;
            setTimeout(() => this.makeAiMove(), 1000);
        } else {
            this.isAiTurn = false;
        }
    }

    hasValidMoves() {
        return this.getAllValidMoves().length > 0;
    }

    makeAiMove() {
        const validMoves = this.getAllValidMoves();

        if (validMoves.length === 0) {
            this.nextTurn();
            return;
        }

        let chosenMove;

        if (this.gameMode === 'pve_easy') {
            chosenMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        } else if (this.gameMode === 'pve_hard') {
            // 1. Look for winning moves (that close a point)
            const winningMoves = validMoves.filter(move => {
                return move.p1.connections === 2 || move.p2.connections === 2;
            });

            if (winningMoves.length > 0) {
                chosenMove = winningMoves[Math.floor(Math.random() * winningMoves.length)];
            } else {
                // 2. Look for safe moves (that don't set up the opponent)
                const safeMoves = validMoves.filter(move => {
                    return move.p1.connections !== 1 && move.p2.connections !== 1;
                });

                if (safeMoves.length > 0) {
                    chosenMove = safeMoves[Math.floor(Math.random() * safeMoves.length)];
                } else {
                    // 3. Make a random move
                    chosenMove = validMoves[Math.floor(Math.random() * validMoves.length)];
                }
            }
        }

        if (chosenMove) {
            this.currentPath = [chosenMove.p1, chosenMove.p2];
            if (this.executeMove(chosenMove.p1, chosenMove.p2)) {
                this.nextTurn();
            }
        } else {
            // Should not happen, but as a fallback, pass the turn
            this.nextTurn();
        }
    }

    getAllValidMoves() {
        const validMoves = [];
        for (let i = 0; i < this.points.length; i++) {
            for (let j = i + 1; j < this.points.length; j++) {
                const p1 = this.points[i];
                const p2 = this.points[j];

                if (this.canConnect(p1, p2)) {
                    let intersects = false;
                    for (const line of this.lines) {
                        if (line.path && line.path.length > 1) {
                            for (let k = 0; k < line.path.length - 1; k++) {
                                const segmentStart = line.path[k];
                                const segmentEnd = line.path[k+1];

                                const dist1 = Math.hypot(p1.x - segmentStart.x, p1.y - segmentStart.y);
                                const dist2 = Math.hypot(p1.x - segmentEnd.x, p1.y - segmentEnd.y);
                                if (dist1 < 10 || dist2 < 10) {
                                    continue;
                                }

                                if (this.linesIntersect(p1, p2, segmentStart, segmentEnd)) {
                                    intersects = true;
                                    break;
                                }
                            }
                        } else {
                            if (this.linesIntersect(p1, p2, line.p1, line.p2)) {
                                intersects = true;
                            }
                        }
                        if (intersects) break;
                    }
                    if (!intersects) {
                        validMoves.push({ p1, p2 });
                    }
                }
            }
        }
        return validMoves;
    }

    cloneState() {
        // This is a placeholder for a deep clone of the game state
        return JSON.parse(JSON.stringify(this));
    }

    evaluateState() {
        const aiPlayerIndex = this.players.findIndex(p => p.isAi);
        const humanPlayerIndex = this.players.findIndex(p => !p.isAi);

        if (this.gameOver) {
            if (this.players[aiPlayerIndex].score > this.players[humanPlayerIndex].score) {
                return 100; // AI wins
            } else if (this.players[humanPlayerIndex].score > this.players[aiPlayerIndex].score) {
                return -100; // Human wins
            } else {
                return 0; // Draw
            }
        }

        return this.players[aiPlayerIndex].score - this.players[humanPlayerIndex].score;
    }

    minimax(state, depth, maximizingPlayer) {
        // Placeholder for the minimax algorithm
        return 0;
    }
}

// Initialize game
const canvas = document.getElementById('gameCanvas');
const game = new DotLine(canvas);

const gameModeSelect = document.getElementById('gameMode');
const playerCountInput = document.getElementById('playerCount');
const playerNameContainer = document.getElementById('playerNameContainer');
const playerCountContainer = document.getElementById('playerCountContainer');
const initialPointsGroup = document.getElementById('initialPoints');
const newGameBtn = document.getElementById('newGameBtn');
const startGameBtn = document.getElementById('startGameBtn');
const modal = document.getElementById('setup-modal');

function startGame() {
    const consoleElement = document.getElementById('message-console');
    consoleElement.innerHTML = '';

    const playerCount = parseInt(playerCountInput.value);
    const initialPoints = parseInt(initialPointsGroup.querySelector('.active').dataset.points);
    
    game.initGame(playerCount, initialPoints);
}

newGameBtn.addEventListener('click', () => {
    modal.style.display = 'flex';
});

startGameBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    startGame();
});

initialPointsGroup.addEventListener('click', (e) => {
    if (e.target.classList.contains('point-button')) {
        game.logMessage('DEBUG: Point button clicked.', '#f0f');
        initialPointsGroup.querySelectorAll('.point-button').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');
    }
});

gameModeSelect.addEventListener('change', () => {
    if (gameModeSelect.value !== 'pvp') {
        playerCountInput.value = 2;
        playerCountContainer.style.display = 'none';
        playerNameContainer.style.display = 'flex';
    } else {
        playerCountContainer.style.display = 'flex';
        playerNameContainer.style.display = 'none';
    }
});

// Initial Page Load
function initialize() {
    gameModeSelect.dispatchEvent(new Event('change'));
}

initialize();