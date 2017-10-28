// This sectin contains some game constants. It is not super interesting
var GAME_WIDTH = 375;
var GAME_HEIGHT = 650;

var ENEMY_WIDTH = 75;
var ENEMY_HEIGHT = 156;
var MAX_ENEMIES = 3;
var CHECKPOINT_COUNT = 5;

var PLAYER_WIDTH = 75;
var PLAYER_HEIGHT = 100;

// These two constants keep us from using "magic numbers" in our code
var LEFT_ARROW_CODE = 37;
var RIGHT_ARROW_CODE = 39;

// These two constants allow us to DRY
var MOVE_LEFT = 'left';
var MOVE_RIGHT = 'right';


// Preload game images
var images = {};
['enemy.png', 'stars.png', 'player.png'].forEach(imgName => {
    var img = document.createElement('img');
    img.src = 'images/' + imgName;
    images[imgName] = img;
});

var imagesCar = ['car1.png', 'car2.png', 'car3.png', 'car5.png', 'car6.png', 'car7.png'].map(imgName => {
    var img = document.createElement('img');
    img.src = 'images/' + imgName;
    return img;
});

var randomCar = function () { 
    return Math.floor(Math.random() * imagesCar.length);
}

class Entity { 
    render (ctx) {
        return ctx.drawImage(this.sprite, this.x, this.y);
    }
}

// This section is where you will be doing most of your coding
class Enemy extends Entity{
    constructor(xPos) {
        super();
        this.x = xPos;
        this.y = -ENEMY_HEIGHT;
        this.sprite = imagesCar[randomCar()];

        // Each enemy should have a different speed
        this.speed = Math.random() / 2 + 0.25;
    }

    update(timeDiff) {
        this.y = this.y + timeDiff * this.speed;
    }

}

class Checkpoint extends Enemy {
    constructor(xPos) {
        super(xPos);
        var img = document.createElement('img');
        img.src = 'images/gas.png';
        this.sprite = img;
    }
}

class Player extends Entity {
    constructor() {
        super();
        this.x = 2 * PLAYER_WIDTH;
        this.y = GAME_HEIGHT - PLAYER_HEIGHT - 10;
        this.sprite = images['player.png'];
    }
    // This method is called by the game engine when left/right arrows are pressed
    move(direction) {
        if (direction === MOVE_LEFT && this.x > 0) {
            this.x = this.x - PLAYER_WIDTH;
        }
        else if (direction === MOVE_RIGHT && this.x < GAME_WIDTH - PLAYER_WIDTH) {
            this.x = this.x + PLAYER_WIDTH;
        }
    }
}

/*
This section is a tiny game engine.
This engine will use your Enemy and Player classes to create the behavior of the game.
The engine will try to draw your game at 60 frames per second using the requestAnimationFrame function
*/
class Engine {
    constructor(element) {
        // Setup the player
        this.player = new Player();

        // Setup enemies, making sure there are always three
        this.setupEnemies();

        // Setup the <canvas> element where we will be drawing
        var canvas = document.createElement('canvas');
        canvas.width = GAME_WIDTH;
        canvas.height = GAME_HEIGHT;
        element.appendChild(canvas);

        this.ctx = canvas.getContext('2d');

        // Since gameLoop will be called out of context, bind it once here.
        this.gameLoop = this.gameLoop.bind(this);
    }

    /*
     The game allows for 5 horizontal slots where an enemy can be present.
     At any point in time there can be at most MAX_ENEMIES enemies otherwise the game would be impossible
     */
    setupEnemies() {
        if (!this.enemies) {
            this.enemies = [];
            this.deletedEnemies = 0;
        }

        while (this.enemies.filter(e => !!e).length < MAX_ENEMIES) {
            if (this.deletedEnemies >= CHECKPOINT_COUNT) {
                this.addEnemy('checkpoint');
                this.deletedEnemies = 0;
            }
            else {
                this.addEnemy('enemy');
            }
        }
    }

    // This method finds a random spot where there is no enemy, and puts one in there
    addEnemy(enemyType) {
        var enemySpots = GAME_WIDTH / ENEMY_WIDTH;

        var enemySpot;
        // Keep looping until we find a free enemy spot at random
        while (enemySpot === undefined || this.enemies[enemySpot]) {
            enemySpot = Math.floor(Math.random() * enemySpots);
        }

        if (enemyType === 'enemy') {
            this.enemies[enemySpot] = new Enemy(enemySpot * ENEMY_WIDTH);
        } else if (enemyType === 'checkpoint') {
            this.enemies[enemySpot] = new Checkpoint(enemySpot * ENEMY_WIDTH);
        }
    }

    // This method kicks off the game
    start() {
        this.score = 0;
        this.checked = 0
        this.lastFrame = Date.now();

        // Listen for keyboard left/right and update the player
        document.addEventListener('keydown', e => {
            if (e.keyCode === LEFT_ARROW_CODE) {
                this.player.move(MOVE_LEFT);
            }
            else if (e.keyCode === RIGHT_ARROW_CODE) {
                this.player.move(MOVE_RIGHT);
            }
        });

        this.gameLoop();
    }

    /*
    This is the core of the game engine. The `gameLoop` function gets called ~60 times per second
    During each execution of the function, we will update the positions of all game entities
    It's also at this point that we will check for any collisions between the game entities
    Collisions will often indicate either a player death or an enemy kill

    In order to allow the game objects to self-determine their behaviors, gameLoop will call the `update` method of each entity
    To account for the fact that we don't always have 60 frames per second, gameLoop will send a time delta argument to `update`
    You should use this parameter to scale your update appropriately
     */
    gameLoop() {
        // Check how long it's been since last frame
        var currentFrame = Date.now();
        var timeDiff = currentFrame - this.lastFrame;

        // Increase the score!
        this.score += timeDiff;

        // this.n = 0;
        // this.timeseg = 0;
        // this.timeseg = window.setInterval(function(){ 
        //     this.timeseg = this.n; 
        //     this.n++;}, 1); 



        // Call update on all enemies
        this.enemies.forEach(enemy => enemy.update(timeDiff));

        // Draw everything!
        this.ctx.drawImage(images['stars.png'], 0, 0); // draw the star bg
        this.enemies.forEach(enemy => enemy.render(this.ctx)); // draw the enemies
        this.player.render(this.ctx); // draw the player

        // Check if any enemies should die
        this.enemies.forEach((enemy, enemyIdx) => {
            if (enemy.y > GAME_HEIGHT) {
                // console.log(this.enemies[enemyIdx].x)
                delete this.enemies[enemyIdx];
                this.deletedEnemies++;
            }
        });
        this.setupEnemies();
        this.timeseg = 0;
        // Check if player is dead
        if (this.isPlayerDead()) {
            // If they are dead, then it's game over!
            this.ctx.font = 'bold 30px Impact';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(this.checked + ' GAS', 5, 60);
            this.ctx.fillText(timeseg + ' SEG', 5, 93);
            this.ctx.fillText('$ ' + this.score + '         GAME OVER', 5, 30);
            if (this.checked != 0) {
                this.ctx.fillText('_____________________', 5, 95);
                this.ctx.fillText('TOTAL SCORE:     $ ' + this.score *  this.checked * timeseg, 5, 130);
            } else {
                this.ctx.fillText('_____________________', 5, 95);
                this.ctx.fillText('TOTAL SCORE:     $ ' + this.score * timeseg, 5, 130);
            }
            
        }
        else {
            // If player is not dead, then draw the score
            this.ctx.font = 'bold 30px Impact';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText('$ ' + this.score, 5, 30);
            this.ctx.fillText(this.checked + ' GAS', 5, 60);
            this.ctx.fillText(timeseg + ' SEG', 5, 95);
            // Set the time marker and redraw
            this.lastFrame = Date.now();
            requestAnimationFrame(this.gameLoop);
        }
    }
    


    isPlayerDead() {
        if (this.enemies.some(enemy => 
            enemy.sprite.src.indexOf('gas') === -1 &&
            enemy.x === this.player.x &&
            enemy.y + ENEMY_HEIGHT >= this.player.y || minTime === 1 
        )){
            return true;
        } else if (this.enemies.some(enemy => 
            enemy.sprite.src.indexOf('gas') !== -1 &&
            enemy.x === this.player.x &&
            enemy.y + ENEMY_HEIGHT >= this.player.y            
        )){
            this.checked++;
            n = 10;
            console.log("reset");
            this.timeseg = 0;
            clearTimeout(deadtime);

            if (this.minTimeGas) {
            clearTimeout(this.minTimeGas);}

            this.minTimeGas = setTimeout(function() 
                { return minTime = 1; }, 
                10000);
            

            this.enemies = this.enemies.filter(enemy => enemy.sprite.src.indexOf('gas') === -1);
            return false;
        }


        // TODO: fix this function!
        
    }

}


var n = 10;
var timeseg = 0;
timeseg = window.setInterval(function(){ 
    timeseg = n; 
    n--;}, 1000); 


var minTime = 10000;
var deadtime = setTimeout(function() {
    return minTime = 1;
}, minTime);



// This section will start the game
var gameEngine = new Engine(document.getElementById('app'));
gameEngine.start();