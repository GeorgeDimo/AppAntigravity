// InputHandler
class InputHandler {
    constructor(game) {
        this.game = game;
        this.keys = [];
        window.addEventListener('keydown', e => {
            if ((e.key === 'ArrowDown' ||
                e.key === 'ArrowUp' ||
                e.key === 'ArrowLeft' ||
                e.key === 'ArrowRight' ||
                e.key === 'w' ||
                e.key === 'a' ||
                e.key === 's' ||
                e.key === 'd' ||
                e.key === ' ' ||
                e.key === 'z' ||
                e.key === 'x'
            ) && this.keys.indexOf(e.key) === -1) {
                this.keys.push(e.key);
            }
            if (e.key === 'f') {
                this.game.player.toggleFlight();
            }
            if (e.key === 'r' && this.game.gameOver) {
                this.game.restart();
            }
            if (e.key === 'Enter' && this.game.gameStart) {
                this.game.gameStart = false;
                this.game.gameOver = false;
            }
        });
        window.addEventListener('keyup', e => {
            if (e.key === 'ArrowDown' ||
                e.key === 'ArrowUp' ||
                e.key === 'ArrowLeft' ||
                e.key === 'ArrowRight' ||
                e.key === 'w' ||
                e.key === 'a' ||
                e.key === 's' ||
                e.key === 'd' ||
                e.key === ' ' ||
                e.key === 'z' ||
                e.key === 'x') {
                this.keys.splice(this.keys.indexOf(e.key), 1);
            }
        });
    }
}

// Particle
class Particle {
    constructor(game, x, y, color) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 5 + 3;
        this.speedX = Math.random() * 6 - 3;
        this.speedY = Math.random() * 6 - 3;
        this.markedForDeletion = false;
        this.life = 1.0;
        this.decay = Math.random() * 0.05 + 0.02;
    }
    update() {
        this.x += this.speedX - this.game.speed;
        this.y += this.speedY;
        this.life -= this.decay;
        if (this.life <= 0) this.markedForDeletion = true;
    }
    draw(context) {
        context.save();
        context.globalAlpha = this.life;
        context.fillStyle = this.color;
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        context.fill();
        context.restore();
    }
}

// Projectile (Enemy Laser)
class Projectile {
    constructor(game, x, y, targetX, targetY) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 15;
        this.height = 15;
        this.speed = 7;
        this.markedForDeletion = false;

        const angle = Math.atan2(targetY - y, targetX - x);
        this.speedX = Math.cos(angle) * this.speed;
        this.speedY = Math.sin(angle) * this.speed;
    }

    update() {
        this.x += this.speedX - this.game.speed;
        this.y += this.speedY;

        if (this.x < 0 || this.x > this.game.width || this.y < 0 || this.y > this.game.height) {
            this.markedForDeletion = true;
        }
    }

    draw(context) {
        context.fillStyle = '#2ecc71'; // Green laser
        context.beginPath();
        context.arc(this.x, this.y, 8, 0, Math.PI * 2);
        context.fill();
        context.shadowBlur = 15;
        context.shadowColor = '#2ecc71';
        context.fill();
        context.shadowBlur = 0;
    }
}

// Player
class Player {
    constructor(game) {
        this.game = game;
        this.width = 80;
        this.height = 128;
        this.x = 200;
        this.y = this.game.height - this.height - 100; // Start on ground
        this.vx = 0;
        this.vy = 0;
        this.weight = 0.8;
        this.jumpForce = -20;
        this.speed = 0;
        this.maxSpeed = 8;
        this.isFlying = false;

        // Colors (Antigravity Theme)
        this.colorSuit = '#8e44ad'; // Purple
        this.colorCape = '#2980b9'; // Blue
        this.colorBoots = '#5b2c6f'; // Dark Purple

        // Health (Increased by 50%)
        this.health = 150;
        this.maxHealth = 150;
        this.hitTimer = 0; // For damage flash

        // Energy Systems
        this.laserEnergy = 5000; // 5 seconds in ms
        this.maxLaserEnergy = 5000;
        this.laserLockout = 0; // Timer for lockout

        this.flightEnergy = 30000; // 30 seconds in ms
        this.maxFlightEnergy = 30000;
        this.flightLockout = 0; // Timer for lockout

        // Combat
        this.isAttacking = false;
        this.attackTimer = 0;
        this.attackDuration = 300; // ms
        this.canDamage = true;

        // Laser
        this.isShooting = false;
        this.shootTimer = 0;
        this.shootDuration = 500; // ms

        // Mega Jump (Faster Charge)
        this.jumpCharge = 0;
        this.maxJumpCharge = 500; // 0.5 seconds max charge (Much Faster)
        this.isChargingJump = false;

        // Animation
        this.frameX = 0;
        this.frameTimer = 0;
        this.facingRight = true;
        this.walkFrame = 0;
    }

    update(input, deltaTime) {
        if (this.hitTimer > 0) this.hitTimer -= deltaTime;

        // --- Energy Management ---

        // Laser Lockout & Regen
        if (this.laserLockout > 0) {
            this.laserLockout -= deltaTime;
            this.isShooting = false; // Force stop shooting
        } else if (!this.isShooting && this.laserEnergy < this.maxLaserEnergy) {
            this.laserEnergy += deltaTime * 3; // 3x regen
            if (this.laserEnergy > this.maxLaserEnergy) this.laserEnergy = this.maxLaserEnergy;
        }

        // Flight Lockout & Regen
        if (this.flightLockout > 0) {
            this.flightLockout -= deltaTime;
            if (this.isFlying) {
                this.isFlying = false; // Force stop flying
                this.weight = 0.8;
            }
        } else if (!this.isFlying && this.flightEnergy < this.maxFlightEnergy) {
            this.flightEnergy += deltaTime * 10; // 10x regen
            if (this.flightEnergy > this.maxFlightEnergy) this.flightEnergy = this.maxFlightEnergy;
        }

        // --- Movement ---

        // Horizontal Movement
        if (input.includes('ArrowRight') || input.includes('d')) {
            this.speed = this.maxSpeed;
            this.facingRight = true;
        }
        else if (input.includes('ArrowLeft') || input.includes('a')) {
            this.speed = -this.maxSpeed;
            this.facingRight = false;
        }
        else this.speed = 0;

        // Walking Animation Logic
        if (!this.isFlying && this.speed !== 0) {
            this.walkFrame += deltaTime * 0.01; // Animation speed
        } else {
            this.walkFrame = 0; // Reset when idle or flying
        }

        this.x += this.speed;

        // Boundaries
        if (this.x < 0) this.x = 0;
        if (this.x > this.game.width - this.width) this.x = this.game.width - this.width;

        // --- Vertical Movement & Physics ---

        if (this.isFlying) {
            // Flight Physics
            if (this.flightEnergy > 0 && this.flightLockout <= 0) {
                this.flightEnergy -= deltaTime; // 1x depletion
                if (this.flightEnergy <= 0) {
                    this.flightEnergy = 0;
                    this.flightLockout = 1000; // 1s Lockout (Reduced)
                    this.isFlying = false;
                    this.weight = 0.8;
                }

                if (input.includes('ArrowUp')) this.vy = -this.maxSpeed;
                else if (input.includes('w') && this.isFlying) this.vy = -this.maxSpeed;
                else if (input.includes('ArrowDown') || input.includes('s')) this.vy = this.maxSpeed;
                else this.vy = 0;
            } else {
                this.isFlying = false;
                this.weight = 0.8;
            }
        } else {
            // Ground Physics

            // Mega Jump Logic (W Key)
            if (input.includes('w') && this.onGround()) {
                this.isChargingJump = true;
                this.jumpCharge += deltaTime;
                if (this.jumpCharge > this.maxJumpCharge) this.jumpCharge = this.maxJumpCharge;
                this.speed = 0;
            } else {
                // Released W or in air
                if (this.isChargingJump) {
                    if (this.onGround()) {
                        // Perform Mega Jump
                        const chargePercent = this.jumpCharge / this.maxJumpCharge;
                        const bonusJump = -15 * chargePercent; // Up to -35 total force
                        this.vy = this.jumpForce + bonusJump;
                    }
                    this.isChargingJump = false;
                    this.jumpCharge = 0;
                }
            }

            // Normal Jump (Space or ArrowUp) - NOT W
            if ((input.includes('ArrowUp') || input.includes(' ')) && this.onGround() && !this.isChargingJump) {
                this.vy = this.jumpForce;
            }

            this.vy += this.weight; // Gravity
        }

        this.y += this.vy;

        // Ground Collision
        if (this.onGround()) {
            this.y = this.game.height - this.height - 100; // Ground level
            if (!this.isFlying) this.vy = 0;
        } else if (this.y > this.game.height - this.height - 100) {
            this.y = this.game.height - this.height - 100;
            this.vy = 0;
        }

        // Ceiling Collision
        if (this.y < 0) this.y = 0;

        // --- Combat ---

        // Punch
        if ((input.includes('z') || input.includes(' ')) && !this.isAttacking && !input.includes('ArrowUp')) {
            this.isAttacking = true;
            this.attackTimer = 0;
            this.canDamage = true;
        }
        if (this.isAttacking) {
            this.attackTimer += deltaTime;
            if (this.attackTimer > this.attackDuration) {
                this.isAttacking = false;
            }
        }

        // Laser
        if (input.includes('x') && !this.isShooting && this.laserEnergy > 0 && this.laserLockout <= 0) {
            this.isShooting = true;
            this.shootTimer = 0;
        }
        if (this.isShooting) {
            this.shootTimer += deltaTime;
            this.laserEnergy -= deltaTime; // 1x depletion

            if (this.laserEnergy <= 0) {
                this.laserEnergy = 0;
                this.laserLockout = 1000; // 1s Lockout (Reduced)
                this.isShooting = false;
            }

            if (input.includes('x') && this.laserEnergy > 0) {
                this.shootTimer = 0;
            } else if (this.shootTimer > this.shootDuration) {
                this.isShooting = false;
            }
        }
    }

    onGround() {
        return this.y >= this.game.height - this.height - 100;
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
        this.hitTimer = 200; // Flash for 200ms
    }

    draw(context) {
        context.save();

        // Draw Flight Aura
        if (this.isFlying) {
            context.shadowBlur = 30;
            context.shadowColor = 'rgba(142, 68, 173, 0.8)'; // Purple Aura
        }

        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        // Cape Animation
        context.fillStyle = this.colorCape; // Blue
        context.beginPath();
        const capeWave = Math.sin(Date.now() / 150) * 8;
        if (this.isFlying) {
            context.moveTo(this.x + 16, this.y + 32);
            context.lineTo(this.x - 60, this.y + 48 + capeWave);
            context.lineTo(this.x - 60, this.y + 112 + capeWave);
            context.lineTo(this.x + 64, this.y + 32);
        } else {
            // Idle/Walk Cape
            context.moveTo(this.x + 16, this.y + 32);
            context.lineTo(this.x + 8 + (this.speed * -3), this.y + 120 + capeWave);
            context.lineTo(this.x + 72 + (this.speed * -3), this.y + 120 + capeWave);
            context.lineTo(this.x + 64, this.y + 32);
        }
        context.fill();

        // Body (Suit)
        context.fillStyle = this.hitTimer > 0 ? '#ff0000' : this.colorSuit; // Purple
        context.fillRect(this.x + 16, this.y + 32, 48, 64);

        // Chest Logo (Diamond)
        context.fillStyle = '#f1c40f';
        context.beginPath();
        context.moveTo(centerX, this.y + 40);
        context.lineTo(centerX + 12, this.y + 52);
        context.lineTo(centerX, this.y + 72);
        context.lineTo(centerX - 12, this.y + 52);
        context.fill();
        // A symbol (Centered)
        context.fillStyle = '#e74c3c';
        context.font = 'bold 20px Arial';
        context.textAlign = 'center'; // Center alignment
        context.fillText('A', centerX, this.y + 60); // Use centerX

        // Head
        context.fillStyle = this.hitTimer > 0 ? '#ff5555' : '#ffdbac'; // Skin tone
        context.beginPath();
        context.arc(centerX, this.y + 16, 20, 0, Math.PI * 2);
        context.fill();

        // Hair
        context.fillStyle = '#2c3e50';
        context.beginPath();
        context.arc(centerX, this.y + 12, 20, Math.PI, 0);
        context.fill();

        // Eyes (Laser Glow)
        if (this.isShooting) {
            context.fillStyle = '#e74c3c';
            context.shadowBlur = 20;
            context.shadowColor = 'red';
        } else {
            context.fillStyle = '#2c3e50';
            context.shadowBlur = 0;
        }
        context.beginPath();
        context.arc(centerX + 6, this.y + 16, 3, 0, Math.PI * 2); // Right eye
        context.fill();

        // Limbs
        context.fillStyle = this.hitTimer > 0 ? '#ff0000' : this.colorSuit;
        // Arms
        if (this.isAttacking) {
            // Punch Animation
            const punchProgress = this.attackTimer / this.attackDuration;
            const punchExtension = Math.sin(punchProgress * Math.PI) * 30; // Extend and retract
            context.fillRect(centerX + 24, this.y + 32, 40 + punchExtension, 16);
            // Fist
            context.fillStyle = this.colorBoots; // Dark Purple glove
            context.fillRect(centerX + 24 + 40 + punchExtension, this.y + 28, 20, 24);
        } else {
            context.fillRect(this.x + 64, this.y + 32, 16, 48); // Right arm
            context.fillRect(this.x, this.y + 32, 16, 48); // Left arm
        }

        // Legs (Walking Animation)
        context.fillStyle = this.hitTimer > 0 ? '#ff0000' : this.colorSuit;
        if (this.isFlying) {
            // Static legs when flying
            context.fillRect(this.x + 16, this.y + 96, 48, 20); // Legs back
        } else {
            // Walking or Idle
            const walkOffset = Math.sin(this.walkFrame) * 16;

            // Left Leg
            context.save();
            context.translate(this.x + 24, this.y + 96);
            context.rotate(this.speed !== 0 ? Math.sin(this.walkFrame) * 0.5 : 0);
            context.fillRect(-10, 0, 20, 32);
            // Boot
            context.fillStyle = this.colorBoots; // Dark Purple
            context.fillRect(-10, 24, 20, 8);
            context.restore();

            // Right Leg
            context.fillStyle = this.hitTimer > 0 ? '#ff0000' : this.colorSuit;
            context.save();
            context.translate(this.x + 56, this.y + 96);
            context.rotate(this.speed !== 0 ? Math.sin(this.walkFrame + Math.PI) * 0.5 : 0);
            context.fillRect(-10, 0, 20, 32);
            // Boot
            context.fillStyle = this.colorBoots; // Dark Purple
            context.fillRect(-10, 24, 20, 8);
            context.restore();
        }

        // Briefs
        context.fillStyle = this.colorBoots; // Dark Purple
        context.fillRect(this.x + 16, this.y + 88, 48, 16);

        context.restore();

        // Jump Charge Bar
        if (this.isChargingJump) {
            context.fillStyle = 'white';
            context.fillRect(this.x, this.y - 20, this.width, 10);
            context.fillStyle = '#f39c12'; // Orange charge
            const chargePercent = this.jumpCharge / this.maxJumpCharge;
            context.fillRect(this.x, this.y - 20, this.width * chargePercent, 10);
            context.strokeStyle = 'black';
            context.strokeRect(this.x, this.y - 20, this.width, 10);
        }

        // Draw Laser Beam
        if (this.isShooting) {
            context.save();
            // Pulsing effect
            const pulse = Math.sin(Date.now() / 50) * 4 + 6;
            context.shadowBlur = 30;
            context.shadowColor = '#e74c3c';
            context.strokeStyle = '#e74c3c';
            context.lineWidth = pulse;
            context.beginPath();
            context.moveTo(centerX + 6, this.y + 16);

            if (this.facingRight) {
                context.lineTo(this.game.width, this.y + 16 + (this.isFlying ? 80 : 0));
            } else {
                context.moveTo(centerX - 6, this.y + 16); // Left eye
                context.lineTo(0, this.y + 16 + (this.isFlying ? 80 : 0));
            }

            context.stroke();

            context.strokeStyle = 'white';
            context.lineWidth = pulse / 2;
            context.stroke();
            context.restore();
        }
    }

    toggleFlight() {
        if (this.isFlying) {
            this.isFlying = false;
            this.weight = 0.8;
        } else if (this.flightEnergy > 0 && this.flightLockout <= 0) {
            this.isFlying = true;
            this.weight = 0;
            this.vy = 0;
        }
    }
}

// Enemy
class Enemy {
    constructor(game) {
        this.game = game;
        this.width = 100; // Scaled up
        this.height = 100;
        this.x = this.game.width;
        this.y = Math.random() * (this.game.height - this.height - 100);
        this.speedX = Math.random() * -3 - 2;
        this.markedForDeletion = false;
        this.angle = 0;

        // Elite Logic
        this.isElite = Math.random() < 0.2; // 20% chance
        if (this.isElite) {
            this.hp = 120; // 2 seconds of laser (60fps * 2) or 2 punches (60 dmg * 2)
            this.maxHp = 120;
            this.color = '#e74c3c'; // Red
            this.domeColor = 'rgba(231, 76, 60, 0.8)';
            this.faceColor = '#c0392b';
        } else {
            this.hp = 60; // 1 second of laser or 1 punch
            this.maxHp = 60;
            this.color = '#2ecc71'; // Green
            this.domeColor = 'rgba(46, 204, 113, 0.8)';
            this.faceColor = '#2ecc71';
        }

        // Shooting
        this.shootTimer = 0;
        this.shootInterval = this.isElite ? 2000 : 4000; // Elites shoot faster
    }

    update(deltaTime) {
        // Scrolling
        this.x -= this.game.speed;

        // AI: Move towards right side if too far left, or hover
        if (this.x < this.game.width * 0.6) {
            this.x += 3; // Fly back to right
        } else if (this.x > this.game.width - 150) {
            this.x -= 2; // Stay on screen
        } else {
            // Hover
            this.x += Math.sin(this.angle) * 0.5;
        }

        this.angle += 0.1;
        this.y += Math.sin(this.angle) * 2; // Bobbing motion

        // Shooting
        if (this.shootTimer > this.shootInterval) {
            this.game.projectiles.push(new Projectile(this.game, this.x, this.y + this.height / 2, this.game.player.x, this.game.player.y));
            this.shootTimer = 0;
        } else {
            this.shootTimer += deltaTime;
        }
    }

    draw(context) {
        context.save();
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        // Alien Body (UFO shape)
        context.fillStyle = '#555';
        context.beginPath();
        context.ellipse(centerX, centerY, 50, 25, 0, 0, Math.PI * 2);
        context.fill();

        // Dome
        context.fillStyle = this.domeColor;
        context.beginPath();
        context.arc(centerX, centerY - 8, 25, Math.PI, 0);
        context.fill();

        // Lights
        context.fillStyle = `hsl(${Date.now() % 360}, 100%, 50%)`;
        for (let i = 0; i < 5; i++) {
            context.beginPath();
            context.arc(this.x + 16 + i * 16, centerY + 8, 5, 0, Math.PI * 2);
            context.fill();
        }

        // Alien Face inside dome
        context.fillStyle = this.faceColor;
        context.beginPath();
        context.arc(centerX, centerY - 8, 12, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = 'black';
        context.beginPath();
        context.arc(centerX - 5, centerY - 12, 3, 0, Math.PI * 2);
        context.arc(centerX + 5, centerY - 12, 3, 0, Math.PI * 2);
        context.fill();

        // HP Bar for Elite (Optional, but good for feedback)
        if (this.isElite && this.hp < this.maxHp) {
            context.fillStyle = 'red';
            context.fillRect(this.x + 20, this.y - 10, 60 * (this.hp / this.maxHp), 5);
        }

        context.restore();
    }
}

// Game
class Game {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.player = new Player(this);
        this.input = new InputHandler(this);
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.enemyTimer = 0;
        this.enemyInterval = 3000;
        this.score = 0;
        this.speed = 0;
        this.backgroundX = 0;
        this.gameOver = false;
        this.gameStart = true; // Start Screen State

        // Background Stars
        this.stars = [];
        for (let i = 0; i < 200; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 3
            });
        }

        // Buildings for parallax
        this.buildings = [];
        for (let i = 0; i < 20; i++) {
            this.buildings.push({
                x: i * 200,
                w: 100 + Math.random() * 80,
                h: 200 + Math.random() * 400,
                lights: []
            });
            // Generate lights for each building
            let b = this.buildings[i];
            for (let wy = this.height - 120; wy > this.height - 100 - b.h + 20; wy -= 30) {
                for (let wx = 20; wx < b.w - 20; wx += 25) {
                    if (Math.random() > 0.3) {
                        b.lights.push({ x: wx, y: wy });
                    }
                }
            }
        }
    }

    restart() {
        this.player = new Player(this);
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.score = 0;
        this.gameOver = false;
        this.enemyInterval = 3000;
    }

    update(deltaTime) {
        if (this.gameStart) return;
        if (this.gameOver) return;

        // Scrolling Logic
        if (this.player.x > this.width * 0.4 && this.player.speed > 0) {
            this.speed = this.player.speed;
            this.player.x = this.width * 0.4; // Lock player position
        } else {
            this.speed = 0;
        }

        this.backgroundX -= this.speed * 0.5; // Parallax speed
        if (this.backgroundX <= -2000) this.backgroundX = 0;

        this.player.update(this.input.keys, deltaTime);

        // Game Over Check
        if (this.player.health <= 0) {
            this.gameOver = true;
        }

        // Difficulty Scaling
        if (this.score > 50) this.enemyInterval = 2500;
        if (this.score > 100) this.enemyInterval = 2000;
        if (this.score > 200) this.enemyInterval = 1500;

        // Enemies
        if (this.enemyTimer > this.enemyInterval) {
            this.enemies.push(new Enemy(this));
            this.enemyTimer = 0;
        } else {
            this.enemyTimer += deltaTime;
        }

        this.enemies.forEach(enemy => {
            enemy.update(deltaTime);

            let enemyHitbox = {
                x: enemy.x + 20,
                y: enemy.y + 25,
                width: 60,
                height: 50
            };

            // Player Body Collision
            if (this.checkCollision(this.player, enemyHitbox)) {
                // this.player.takeDamage(10); // Optional contact damage
            }

            // Punch Collision
            if (this.player.isAttacking && this.player.canDamage) {
                let punchHitbox = {
                    x: this.player.x + (this.player.facingRight ? this.player.width : -60),
                    y: this.player.y + 30,
                    width: 60,
                    height: 30
                };
                if (this.checkCollision(punchHitbox, enemyHitbox)) {
                    enemy.hp -= 60; // 1 punch kills normal (60hp), 2 kills elite (120hp)
                    this.player.canDamage = false; // Prevent multiple hits
                    this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ffffff'); // Hit effect

                    if (enemy.hp <= 0) {
                        enemy.markedForDeletion = true;
                        this.score += enemy.isElite ? 20 : 10;
                        this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color);
                    }
                }
            }

            // Laser Collision
            if (this.player.isShooting) {
                let laserY = this.player.y + 16;
                let inBeam = (enemyHitbox.y < laserY + 10 && enemyHitbox.y + enemyHitbox.height > laserY - 10);
                let inFront = this.player.facingRight ? (enemy.x > this.player.x) : (enemy.x < this.player.x);

                if (inBeam && inFront) {
                    enemy.hp -= 1; // 1 dmg per frame. 60 frames = 60 dmg (1 sec). Normal dies in 1s, Elite in 2s.
                    this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#e74c3c', 1); // Small hit effect

                    if (enemy.hp <= 0) {
                        enemy.markedForDeletion = true;
                        this.score += enemy.isElite ? 20 : 10;
                        this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color);
                    }
                }
            }
        });

        this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);

        // Projectiles
        this.projectiles.forEach(projectile => {
            projectile.update();
            if (this.checkCollision(this.player, projectile)) {
                projectile.markedForDeletion = true;
                this.player.takeDamage(10); // 10 damage per shot
            }
        });
        this.projectiles = this.projectiles.filter(p => !p.markedForDeletion);

        // Particles
        this.particles.forEach(p => p.update());
        this.particles = this.particles.filter(p => !p.markedForDeletion);

        // Update buildings for infinite scroll
        this.buildings.forEach(b => {
            b.x -= this.speed * 0.5;
        });
        if (this.buildings.length > 0 && this.buildings[0].x + this.buildings[0].w < -100) {
            let first = this.buildings.shift();
            first.x = this.buildings[this.buildings.length - 1].x + 200 + Math.random() * 50;
            this.buildings.push(first);
        }
    }

    createExplosion(x, y, color, count = 15) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(this, x, y, color));
        }
    }

    draw(context) {
        // Background Gradient
        const gradient = context.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#0f2027');
        gradient.addColorStop(0.5, '#203a43');
        gradient.addColorStop(1, '#2c5364');
        context.fillStyle = gradient;
        context.fillRect(0, 0, this.width, this.height);

        // Draw Stars (Parallax)
        context.fillStyle = 'white';
        this.stars.forEach(star => {
            let starX = (star.x - this.backgroundX * 0.1) % this.width;
            if (starX < 0) starX += this.width;
            context.fillRect(starX, star.y, star.size, star.size);
        });

        // Draw City Skyline (Scrolling)
        context.fillStyle = '#1a252f';
        context.fillRect(0, this.height - 100, this.width, 100);

        this.buildings.forEach(b => {
            context.fillStyle = '#1a252f';
            context.fillRect(b.x, this.height - 100 - b.h, b.w, b.h);
            context.fillStyle = 'rgba(255, 255, 150, 0.3)';
            b.lights.forEach(light => {
                context.fillRect(b.x + light.x, light.y, 12, 18);
            });
        });

        this.player.draw(context);
        this.enemies.forEach(enemy => enemy.draw(context));
        this.projectiles.forEach(p => p.draw(context));
        this.particles.forEach(p => p.draw(context));

        // HUD (Canvas Based)
        if (!this.gameStart) {
            this.drawHUD(context);
        }

        // Start Screen
        if (this.gameStart) {
            context.fillStyle = 'rgba(0, 0, 0, 0.7)';
            context.fillRect(0, 0, this.width, this.height);

            context.fillStyle = '#3498db';
            context.font = 'bold 100px Arial';
            context.textAlign = 'center';
            context.shadowBlur = 20;
            context.shadowColor = '#3498db';
            context.fillText('ANTIGRAVITY', this.width / 2, this.height / 2 - 50);

            context.fillStyle = 'white';
            context.font = '30px Arial';
            context.shadowBlur = 0;
            context.fillText('Press Enter to Start', this.width / 2, this.height / 2 + 50);

            context.font = '20px Arial';
            context.fillStyle = '#aaa';
            context.fillText('Controls: Arrows/WASD to Move | F to Fly | Z to Punch | X to Laser | W to Charge Jump', this.width / 2, this.height / 2 + 100);
        }

        // Game Over Screen
        if (this.gameOver) {
            context.fillStyle = 'rgba(0, 0, 0, 0.7)';
            context.fillRect(0, 0, this.width, this.height);

            context.fillStyle = 'white';
            context.font = '60px Arial';
            context.textAlign = 'center';
            context.fillText('GAME OVER', this.width / 2, this.height / 2 - 30);

            context.font = '30px Arial';
            context.fillText('Press R to Restart', this.width / 2, this.height / 2 + 40);
            context.fillText('Final Score: ' + this.score, this.width / 2, this.height / 2 + 90);
        }
    }

    drawHUD(context) {
        context.save();
        context.shadowBlur = 0;

        // Health Bar
        const barWidth = 300;
        const barHeight = 25;
        const startX = 40;
        const startY = 40;
        const spacing = 50;

        // HP Border
        context.strokeStyle = 'white';
        context.lineWidth = 3;
        context.strokeRect(startX, startY, barWidth, barHeight);
        // HP Fill
        const hpPercent = this.player.health / this.player.maxHealth;
        context.fillStyle = hpPercent > 0.3 ? '#2ecc71' : '#e74c3c';
        context.fillRect(startX + 2, startY + 2, (barWidth - 4) * hpPercent, barHeight - 4);
        // HP Text
        context.fillStyle = 'white';
        context.font = '18px Arial';
        context.textAlign = 'left';
        context.fillText('HP', startX, startY - 8);

        // Laser Energy Bar
        const laserY = startY + spacing;
        context.strokeStyle = 'white';
        context.strokeRect(startX, laserY, barWidth, barHeight);
        const laserPercent = this.player.laserEnergy / this.player.maxLaserEnergy;

        // Color changes if locked out
        if (this.player.laserLockout > 0) {
            context.fillStyle = '#7f8c8d'; // Grey
            context.fillText('Laser Overheated!', startX + barWidth + 10, laserY + 18);
        } else {
            context.fillStyle = '#f1c40f'; // Yellow
        }

        context.fillRect(startX + 2, laserY + 2, (barWidth - 4) * laserPercent, barHeight - 4);
        context.fillStyle = 'white';
        context.fillText('Laser Energy', startX, laserY - 8);

        // Flight Energy Bar
        const flightY = laserY + spacing;
        context.strokeStyle = 'white';
        context.strokeRect(startX, flightY, barWidth, barHeight);
        const flightPercent = this.player.flightEnergy / this.player.maxFlightEnergy;

        // Color changes if locked out
        if (this.player.flightLockout > 0) {
            context.fillStyle = '#7f8c8d'; // Grey
            context.fillText('Flight Exhausted!', startX + barWidth + 10, flightY + 18);
        } else {
            context.fillStyle = '#3498db'; // Blue
        }

        context.fillRect(startX + 2, flightY + 2, (barWidth - 4) * flightPercent, barHeight - 4);
        context.fillStyle = 'white';
        context.fillText('Flight Energy', startX, flightY - 8);

        // Score
        context.fillStyle = 'white';
        context.font = 'bold 40px Arial';
        context.textAlign = 'right';
        context.fillText('Score: ' + this.score, this.width - 40, 70);

        context.restore();
    }

    checkCollision(rect1, rect2) {
        return (rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.height + rect1.y > rect2.y);
    }
}

// Main
window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // Set canvas size to 1080p
    canvas.width = 1920;
    canvas.height = 1080;

    const game = new Game(canvas.width, canvas.height);

    let lastTime = 0;
    function animate(timeStamp) {
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        game.update(deltaTime);
        game.draw(ctx);

        requestAnimationFrame(animate);
    }
    animate(0);
});
