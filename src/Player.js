export default class Player {
    constructor(game) {
        this.game = game;
        this.width = 50;
        this.height = 80;
        this.x = 100;
        this.y = this.game.height - this.height - 50; // Start on ground
        this.vx = 0;
        this.vy = 0;
        this.weight = 1;
        this.speed = 0;
        this.maxSpeed = 5;
        this.isFlying = false;
        this.color = '#3498db'; // Superman blue

        // Combat
        this.isAttacking = false;
        this.attackTimer = 0;
        this.attackDuration = 200; // ms

        // Laser
        this.isShooting = false;
        this.shootTimer = 0;
        this.shootDuration = 500; // ms
    }

    update(input, deltaTime) {
        // Horizontal Movement
        if (input.includes('ArrowRight') || input.includes('d')) this.speed = this.maxSpeed;
        else if (input.includes('ArrowLeft') || input.includes('a')) this.speed = -this.maxSpeed;
        else this.speed = 0;

        this.x += this.speed;

        // Boundaries
        if (this.x < 0) this.x = 0;
        if (this.x > this.game.width - this.width) this.x = this.game.width - this.width;

        // Vertical Movement
        if (this.isFlying) {
            // Flight Physics
            if (input.includes('ArrowUp') || input.includes('w')) this.vy = -this.maxSpeed;
            else if (input.includes('ArrowDown') || input.includes('s')) this.vy = this.maxSpeed;
            else this.vy = 0;
        } else {
            // Ground Physics
            if ((input.includes('ArrowUp') || input.includes('w') || input.includes(' ')) && this.onGround()) {
                this.vy = -20; // Jump strength
            }
            this.vy += this.weight; // Gravity
        }

        this.y += this.vy;

        // Ground Collision
        if (this.onGround()) {
            this.y = this.game.height - this.height - 50; // Ground level
            if (!this.isFlying) this.vy = 0;
        } else if (this.y > this.game.height - this.height - 50) {
            // Prevent falling below ground if toggling flight off near ground
            this.y = this.game.height - this.height - 50;
            this.vy = 0;
        }

        // Ceiling Collision
        if (this.y < 0) this.y = 0;

        // Combat Logic
        if ((input.includes('z') || input.includes(' ')) && !this.isAttacking) {
            this.isAttacking = true;
            this.attackTimer = 0;
        }
        if (this.isAttacking) {
            this.attackTimer += deltaTime;
            if (this.attackTimer > this.attackDuration) {
                this.isAttacking = false;
            }
        }

        // Laser Logic
        if (input.includes('x') && !this.isShooting) {
            this.isShooting = true;
            this.shootTimer = 0;
        }
        if (this.isShooting) {
            this.shootTimer += deltaTime;
            if (this.shootTimer > this.shootDuration) {
                this.isShooting = false;
            }
        }
    }

    onGround() {
        return this.y >= this.game.height - this.height - 50;
    }

    draw(context) {
        // Draw Player
        context.fillStyle = this.color;
        context.fillRect(this.x, this.y, this.width, this.height);

        // Cape (visual)
        context.fillStyle = '#e74c3c';
        if (this.speed < 0) { // Moving left
            context.fillRect(this.x + this.width, this.y + 10, 10, this.height - 20);
        } else { // Moving right or idle
            context.fillRect(this.x - 10, this.y + 10, 10, this.height - 20);
        }

        // Draw Flight Aura if flying
        if (this.isFlying) {
            context.strokeStyle = 'rgba(52, 152, 219, 0.5)';
            context.lineWidth = 2;
            context.strokeRect(this.x - 5, this.y - 5, this.width + 10, this.height + 10);
        }

        // Draw Punch
        if (this.isAttacking) {
            context.fillStyle = '#e74c3c'; // Red fist
            if (this.speed < 0 || (this.speed === 0 && this.lastDirection === 'left')) {
                context.fillRect(this.x - 20, this.y + 30, 20, 20);
            } else {
                context.fillRect(this.x + this.width, this.y + 30, 20, 20);
            }
        }

        // Draw Laser
        if (this.isShooting) {
            context.strokeStyle = '#e74c3c'; // Red laser
            context.lineWidth = 5;
            context.beginPath();
            context.moveTo(this.x + this.width / 2, this.y + 20); // Eyes position

            // Laser direction based on movement or default right
            if (this.speed < 0) {
                context.lineTo(0, this.y + 20 + (this.isFlying ? 50 : 0)); // Shoot left
            } else {
                context.lineTo(this.game.width, this.y + 20 + (this.isFlying ? 50 : 0)); // Shoot right
            }
            context.stroke();

            // Laser Glow
            context.strokeStyle = 'rgba(231, 76, 60, 0.5)';
            context.lineWidth = 10;
            context.stroke();
        }
    }

    toggleFlight() {
        this.isFlying = !this.isFlying;
        if (this.isFlying) {
            this.weight = 0;
            this.vy = 0;
        } else {
            this.weight = 1;
        }
    }
}
