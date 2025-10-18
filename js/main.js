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
        this.currentPath = [];

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

        // Draw grid (optional futuristic background)
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
        if (this.isDrawing && this.currentPath.length > 1 && this.players.length > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.currentPath[0].x, this.currentPath[0].y);
            for(let i = 1; i < this.currentPath.length; i++) {
                this.ctx.lineTo(this.currentPath[i].x, this.currentPath[i].y);
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
            // Glow effect
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = line.color;
            
            this.ctx.beginPath();
            if(line.path && line.path.length > 1) {
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

        // Draw points with futuristic style
        for(const point of this.points) {
            if (point.isDying) {
                // Draw dying animation
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                this.ctx.fill();
                point.isDead = true;
                point.isDying = false;
            } else if (!point.isDead) {
                // Outer glow
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
                this.ctx.fillStyle = '#222';
                this.ctx.fill();
                
                // Inner point
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
                this.ctx.fillStyle = '#fff';
                this.ctx.fill();

                if(point === this.selectedPoint) {
                    this.ctx.beginPath();
                    this.ctx.arc(point.x, point.y, 12, 0, Math.PI * 2);
                    this.ctx.strokeStyle = this.players[this.currentPlayer].color;
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
            } else {
                // Draw dead point
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
                this.ctx.fillStyle = '#333';
                this.ctx.fill();
            }
        }
    }

    resizeCanvas() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
    }

    initGame(playerCount, initialPoints) {
        this.gameMode = document.getElementById('gameMode').value;
        this.points = [];
        this.lines = [];
        this.animatingLines = [];
        this.selectedPoint = null;
        this.currentPlayer = 0;
        this.gameOver = false;
        this.isDrawing = false;
        this.currentPath = [];
        
        // Initialize players with colors
        this.players = [];
        const colors = ['#00ff9d', '#00a1ff', '#ff3366', '#ff9900'];
        for(let i = 0; i < playerCount; i++) {
            this.players.push({
                color: colors[i],
                score: 0,
                loopCredits: 0,
                isAi: this.gameMode !== 'pvp' && i === 1 // AI is always player 2 in PvE mode
            });
        }

        this.logMessage(`New game started with ${playerCount} players.`);

        // Create initial random points
        for(let i = 0; i < initialPoints; i++) {
            this.points.push(new Point(
                Math.random() * (this.canvas.width - 100) + 50,
                Math.random() * (this.canvas.height - 100) + 50
            ));
        }

        this.updatePlayerInfo();
        this.resizeCanvas();
        this.render();
    }

    updatePlayerInfo() {
        const container = document.getElementById('playerInfo');
        container.innerHTML = '';
        this.players.forEach((player, index) => {
            const div = document.createElement('div');
            div.className = `player ${index === this.currentPlayer ? 'active' : ''}`;
            div.style.backgroundColor = player.color + '40';
            div.textContent = `Player ${index + 1}: ${player.score} (Loops: ${player.loopCredits})`;
            container.appendChild(div);
        });
    }

    getEventCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        if (e.touches) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
        }
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    handleMouseDown(e) {
        if(this.gameOver) return;
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
    }

    handleMouseUp(e) {
        if(!this.isDrawing) return;
        const coords = this.getEventCoordinates(e);
        const endPoint = this.points.find(p => 
            Math.hypot(p.x - coords.x, p.y - coords.y) < 10 && 
            !p.isDead
        );

        this.executeMove(this.selectedPoint, endPoint);

        this.isDrawing = false;
        this.selectedPoint = null;
        this.currentPath = [];
    }

    executeMove(startPoint, endPoint) {
        if(endPoint && this.canConnect(startPoint, endPoint)) {
            let intersects = false;
            for (const line of this.lines) {
                if (this.linesIntersect(startPoint, endPoint, line.p1, line.p2)) {
                    intersects = true;
                    break;
                }
            }

            if (!intersects) {
                // Allow connection to the same point if it has available connections
                if (endPoint === startPoint && endPoint.connections < 3) {
                    if (this.players[this.currentPlayer].loopCredits > 0) {
                        this.players[this.currentPlayer].loopCredits--;
                        // Create a curved loop
                        const midPoint = new Point(
                            this.currentPath[Math.floor(this.currentPath.length / 2)].x,
                            this.currentPath[Math.floor(this.currentPath.length / 2)].y,
                            2
                        );

                        this.animatingLines.push({
                            p1: startPoint,
                            p2: midPoint,
                            color: this.players[this.currentPlayer].color,
                            path: this.currentPath.slice(0, Math.floor(this.currentPath.length / 2) + 1),
                            progress: 0,
                            speed: 0.05
                        });

                        this.animatingLines.push({
                            p1: midPoint,
                            p2: endPoint,
                            color: this.players[this.currentPlayer].color,
                            path: this.currentPath.slice(Math.floor(this.currentPath.length / 2)),
                            progress: 0,
                            speed: 0.05
                        });

                        startPoint.connections += 2;
                        if(startPoint.connections >= 3) {
                            startPoint.isDying = true;
                            this.logMessage('A point has been closed!');
                        }
                        if(midPoint.connections >= 3) midPoint.isDying = true;

                        this.points.push(midPoint);
                        this.players[this.currentPlayer].score++;
                        this.logMessage(`Player ${this.currentPlayer + 1} scored a point!`, this.players[this.currentPlayer].color);
                        this.nextTurn();
                    } else {
                        this.triggerInvalidMoveAnimation();
                        this.logMessage('Not enough loop credits.', '#ff6b6b');
                    }
                } else if (endPoint !== startPoint) {
                    // Original logic for connecting different points
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
                        this.logMessage('A point has been closed!');
                    }

                    this.points.push(newPoint);
                    this.players[this.currentPlayer].score++;
                    this.logMessage(`Player ${this.currentPlayer + 1} scored a point!`, this.players[this.currentPlayer].color);

                    const newScore = this.players[this.currentPlayer].score;
                    if (newScore > 0 && newScore % 3 === 0) {
                        this.players[this.currentPlayer].loopCredits++;
                        this.logMessage(`Player ${this.currentPlayer + 1} earned a loop credit!`, this.players[this.currentPlayer].color);
                    }
                    this.nextTurn();
                }
            } else {
                this.triggerInvalidMoveAnimation();
                this.logMessage('Invalid move: Lines cannot cross.', '#ff6b6b');
            }
        } else if (this.isDrawing) {
            this.triggerInvalidMoveAnimation();
            this.logMessage('Invalid move.', '#ff6b6b');
        }
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
        if(p1 === p2) return p1.connections < 3; // Allow self-connection if connections available
        return p1.connections < 3 && p2.connections < 3;
    }

    orientation(p, q, r) {
        const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
        const epsilon = 1e-10;
        if (Math.abs(val) < epsilon) return 0; // Collinear
        return (val > 0) ? 1 : 2; // Clockwise or Counterclockwise
    }

    onSegment(p, q, r) {
        return (q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
            q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y));
    }

    linesIntersect(p1, q1, p2, q2) {
        // Don't count intersection if the lines share an endpoint
        if (p1 === p2 || p1 === q2 || q1 === p2 || q1 === q2) {
            return false;
        }

        const o1 = this.orientation(p1, q1, p2);
        const o2 = this.orientation(p1, q1, q2);
        const o3 = this.orientation(p2, q2, p1);
        const o4 = this.orientation(p2, q2, q1);

        if (o1 !== o2 && o3 !== o4) {
            return true;
        }

        // Special Cases for collinear points
        if (o1 === 0 && this.onSegment(p1, p2, q1)) return true;
        if (o2 === 0 && this.onSegment(p1, q2, q1)) return true;
        if (o3 === 0 && this.onSegment(p2, p1, q2)) return true;
        if (o4 === 0 && this.onSegment(p2, q1, q2)) return true;

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
        this.logMessage(`Player ${this.currentPlayer + 1}'s turn.`, this.players[this.currentPlayer].color);
        
        // Check if game is over
        this.gameOver = !this.hasValidMoves();
        if(this.gameOver) {
            const winner = this.players.reduce((prev, curr, idx) => 
                curr.score > prev.score ? {score: curr.score, index: idx} : prev,
                {score: -1, index: -1}
            );
            this.logMessage(`Game Over! Player ${winner.index + 1} wins with ${winner.score} points!`, '#00ff9d');
        } else if (this.players[this.currentPlayer].isAi) {
            setTimeout(() => this.makeAiMove(), 1000);
        }
    }

    hasValidMoves() {
        return this.getAllValidMoves().length > 0;
    }

    makeAiMove() {
        const validMoves = this.getAllValidMoves();

        if (validMoves.length === 0) {
            return; // No moves left
        }

        let chosenMove;

        if (this.gameMode === 'pve_easy') {
            // Easy AI: pick a random move
            chosenMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        } else if (this.gameMode === 'pve_hard') {
            // Normal AI: "Careful" logic
            const safeMoves = validMoves.filter(move => {
                const p1_isSafe = move.p1.connections !== 1;
                const p2_isSafe = move.p2.connections !== 1;
                return p1_isSafe && p2_isSafe;
            });

            if (safeMoves.length > 0) {
                chosenMove = safeMoves[Math.floor(Math.random() * safeMoves.length)];
            } else {
                chosenMove = validMoves[Math.floor(Math.random() * validMoves.length)];
            }
        }

        if (chosenMove) {
            // For AI moves, the path is a straight line
            this.currentPath = [chosenMove.p1, chosenMove.p2];
            this.executeMove(chosenMove.p1, chosenMove.p2);
        }
    }

    getAllValidMoves() {
        const validMoves = [];
        for (let i = 0; i < this.points.length; i++) {
            for (let j = i; j < this.points.length; j++) {
                const p1 = this.points[i];
                const p2 = this.points[j];

                if (this.canConnect(p1, p2)) {
                    let intersects = false;
                    for (const line of this.lines) {
                        if (this.linesIntersect(p1, p2, line.p1, line.p2)) {
                            intersects = true;
                            break;
                        }
                    }
                    if (!intersects) {
                        validMoves.push({ p1, p2 });
                    }
                }
            }
        }
        return validMoves;
    }
}

// Initialize game
const canvas = document.getElementById('gameCanvas');
const game = new DotLine(canvas);

document.getElementById('newGame').addEventListener('click', () => {
    const playerCount = parseInt(document.getElementById('playerCount').value);
    const initialPoints = parseInt(document.getElementById('initialPoints').value);
    game.initGame(playerCount, initialPoints);
});

// Start initial game
game.initGame(2, 5);