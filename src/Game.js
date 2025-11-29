import Player from './Player.js';
import InputHandler from './InputHandler.js';
import Enemy from './Enemy.js';

export default class Game {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.player = new Player(this);
        this.input = new InputHandler(this);
        this.enemies = [];
        this.enemyTimer = 0;
        this.enemyInterval = 2000;
        this.score = 0;
    }
    update(deltaTime) {
        this.player.update(this.input.keys, deltaTime);

        // Enemies
        if (this.enemyTimer > this.enemyInterval) {
            this.enemies.push(new Enemy(this));
            this.enemyTimer = 0;
        } else {
            this.enemyTimer += deltaTime;
        }

        this.enemies.forEach(enemy => {
            enemy.update();
            // Player Body Collision
            if (this.checkCollision(this.player, enemy)) {
                // enemy.markedForDeletion = true; // Optional: Player takes damage
            }

            // Punch Collision
            if (this.player.isAttacking) {
                let punchHitbox = {
                    x: this.player.x + (this.player.speed < 0 ? -20 : this.player.width),
                    y: this.player.y + 30,
                    width: 20,
                    height: 20
                };
                if (this.checkCollision(punchHitbox, enemy)) {
                    enemy.markedForDeletion = true;
                    this.score += 10;
                }
            }

            // Laser Collision
            if (this.player.isShooting) {
                let laserHitbox = {
                    x: this.player.speed < 0 ? 0 : this.player.x + this.player.width,
                    y: this.player.y + 20 + (this.player.isFlying ? 50 : 0) - 5, // Centered on beam
                    width: this.player.speed < 0 ? this.player.x : this.width - (this.player.x + this.player.width),
                    height: 10
                };
                if (this.checkCollision(laserHitbox, enemy)) {
                    enemy.markedForDeletion = true;
                    this.score += 5;
                }
            }
        });

        this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);
    }
    draw(context) {
        // Background
        context.fillStyle = '#2c3e50'; // Fallback
        // Draw City Skyline (Simple)
        context.fillStyle = '#1a252f';
        context.fillRect(0, this.height - 50, this.width, 50); // Ground
        context.fillRect(100, this.height - 250, 100, 200); // Building 1
        context.fillRect(300, this.height - 350, 120, 300); // Building 2
        context.fillRect(600, this.height - 300, 80, 250); // Building 3

        this.player.draw(context);
        this.enemies.forEach(enemy => enemy.draw(context));

        // Update UI
        const scoreElement = document.getElementById('score');
        if (scoreElement) scoreElement.innerText = 'Score: ' + this.score;
    }

    checkCollision(rect1, rect2) {
        return (rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.height + rect1.y > rect2.y);
    }
}
