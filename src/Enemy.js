export default class Enemy {
    constructor(game) {
        this.game = game;
        this.width = 60;
        this.height = 60;
        this.x = this.game.width;
        this.y = Math.random() * (this.game.height - this.height - 50);
        this.speedX = Math.random() * -2 - 1;
        this.markedForDeletion = false;
        this.color = '#2ecc71'; // Alien green
    }

    update() {
        this.x += this.speedX;
        if (this.x + this.width < 0) this.markedForDeletion = true;
    }

    draw(context) {
        context.fillStyle = this.color;
        context.fillRect(this.x, this.y, this.width, this.height);

        // Eyes
        context.fillStyle = 'black';
        context.fillRect(this.x + 10, this.y + 10, 10, 10);
        context.fillRect(this.x + 40, this.y + 10, 10, 10);
    }
}
