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
        this.selectedPoint = null;
        this.currentPlayer = 0;
        this.players = [];
        this.gameOver = false;
        this.isDrawing = false;
        this.currentPath = [];
        
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    }

    initGame(playerCount, initialPoints) {
        this.points = [];
        this.lines = [];
        this.selectedPoint = null;
        this.currentPlayer = 0;
        this.gameOver = false;
        this.isDrawing = false;
        
        // Initialize players with colors
        this.players = [];
        const colors = ['#00ff9d', '#00a1ff', '#ff3366', '#ff9900'];
        for(let i = 0; i < playerCount; i++) {
            this.players.push({
                color: colors[i],
                score: 0
            });
        }

        // Create initial random points
        for(let i = 0; i < initialPoints; i++) {
            this.points.push(new Point(
                Math.random() * (this.canvas.width - 100) + 50,
                Math.random() * (this.canvas.height - 100) + 50
            ));
        }

        this.updatePlayerInfo();
        this.draw();
    }

    updatePlayerInfo() {
        const container = document.getElementById('playerInfo');
        container.innerHTML = '';
        this.players.forEach((player, index) => {
            const div = document.createElement('div');
            div.className = `player ${index === this.currentPlayer ? 'active' : ''}`;
            div.style.backgroundColor = player.color + '40';
            div.textContent = `Player ${index + 1}: ${player.score}`;
            container.appendChild(div);
        });
    }

    handleMouseDown(e) {
        if(this.gameOver) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const clickedPoint = this.points.find(p => 
            Math.hypot(p.x - x, p.y - y) < 10 && !p.isDead
        );

        if(clickedPoint) {
            this.isDrawing = true;
            this.selectedPoint = clickedPoint;
            this.currentPath = [{x: clickedPoint.x, y: clickedPoint.y}];
        }
    }

    handleMouseMove(e) {
        if(!this.isDrawing || !this.selectedPoint) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.currentPath.push({x, y});
        this.draw();
        
        // Draw current path
        this.ctx.beginPath();
        this.ctx.moveTo(this.currentPath[0].x, this.currentPath[0].y);
        for(let i = 1; i < this.currentPath.length; i++) {
            this.ctx.lineTo(this.currentPath[i].x, this.currentPath[i].y);
        }
        this.ctx.strokeStyle = this.players[this.currentPlayer].color;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    handleMouseUp(e) {
        if(!this.isDrawing) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const endPoint = this.points.find(p => 
            Math.hypot(p.x - x, p.y - y) < 10 && 
            !p.isDead
        );

        if(endPoint && this.canConnect(this.selectedPoint, endPoint)) {
            // Allow connection to the same point if it has available connections
            if (endPoint === this.selectedPoint && endPoint.connections < 3) {
                // Create a curved loop
                const midPoint = new Point(
                    this.currentPath[Math.floor(this.currentPath.length / 2)].x,
                    this.currentPath[Math.floor(this.currentPath.length / 2)].y,
                    2
                );

                this.lines.push({
                    p1: this.selectedPoint,
                    p2: midPoint,
                    color: this.players[this.currentPlayer].color,
                    path: this.currentPath.slice(0, Math.floor(this.currentPath.length / 2) + 1)
                });

                this.lines.push({
                    p1: midPoint,
                    p2: endPoint,
                    color: this.players[this.currentPlayer].color,
                    path: this.currentPath.slice(Math.floor(this.currentPath.length / 2))
                });

                this.selectedPoint.connections += 2;
                if(this.selectedPoint.connections >= 3) this.selectedPoint.isDead = true;
                if(midPoint.connections >= 3) midPoint.isDead = true;

                this.points.push(midPoint);
                this.players[this.currentPlayer].score++;
                this.nextTurn();
            } else if (endPoint !== this.selectedPoint) {
                // Original logic for connecting different points
                const midIndex = Math.floor(this.currentPath.length / 2);
                const midPoint = this.currentPath[midIndex];
                const newPoint = new Point(midPoint.x, midPoint.y, 2);

                this.lines.push({
                    p1: this.selectedPoint,
                    p2: newPoint,
                    color: this.players[this.currentPlayer].color,
                    path: this.currentPath.slice(0, midIndex + 1)
                });

                this.lines.push({
                    p1: newPoint,
                    p2: endPoint,
                    color: this.players[this.currentPlayer].color,
                    path: this.currentPath.slice(midIndex)
                });

                this.selectedPoint.connections++;
                endPoint.connections++;
                if(this.selectedPoint.connections >= 3) this.selectedPoint.isDead = true;
                if(endPoint.connections >= 3) endPoint.isDead = true;
                if(newPoint.connections >= 3) newPoint.isDead = true;

                this.points.push(newPoint);
                this.players[this.currentPlayer].score++;
                this.nextTurn();
            }
        }

        this.isDrawing = false;
        this.selectedPoint = null;
        this.currentPath = [];
        this.draw();
    }

    canConnect(p1, p2) {
        if(p1.isDead || p2.isDead) return false;
        if(p1 === p2) return p1.connections < 3; // Allow self-connection if connections available
        return p1.connections < 3 && p2.connections < 3;
    }

    draw() {
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

        // Draw lines with glow effect
        for(const line of this.lines) {
            // Glow effect
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = line.color;
            
            this.ctx.beginPath();
            if(line.path) {
                this.ctx.moveTo(line.path[0].x, line.path[0].y);
                for(let i = 1; i < line.path.length; i++) {
                    this.ctx.lineTo(line.path[i].x, line.path[i].y);
                }
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
            // Outer glow
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
            this.ctx.fillStyle = point.isDead ? '#333' : '#222';
            this.ctx.fill();
            
            // Inner point
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
            this.ctx.fillStyle = point.isDead ? '#666' : '#fff';
            this.ctx.fill();

            if(point === this.selectedPoint) {
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, 12, 0, Math.PI * 2);
                this.ctx.strokeStyle = this.players[this.currentPlayer].color;
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }
        }
    }

    nextTurn() {
        this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
        this.updatePlayerInfo();
        
        // Check if game is over
        this.gameOver = !this.hasValidMoves();
        if(this.gameOver) {
            const winner = this.players.reduce((prev, curr, idx) => 
                curr.score > prev.score ? {score: curr.score, index: idx} : prev,
                {score: -1, index: -1}
            );
            alert(`Game Over! Player ${winner.index + 1} wins with ${winner.score} points!`);
        }
    }

    hasValidMoves() {
        for(let i = 0; i < this.points.length; i++) {
            if (!this.points[i].isDead) {
                // Check for possible self-connections
                if (this.points[i].connections < 3) {
                    return true;
                }
                // Check connections with other points
                for(let j = i + 1; j < this.points.length; j++) {
                    if(this.canConnect(this.points[i], this.points[j])) {
                        return true;
                    }
                }
            }
        }
        return false;
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