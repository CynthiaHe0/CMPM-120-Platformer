class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 500;
        this.DRAG = 1500;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -700;
        this.MAX_SPEED = 900;
        this.score = 0;
    }

    create() {
        this.scoreText = this.add.bitmapText(20, 20, 'text', 'Score: 0', 32);
        this.scoreText.scrollFactorX = 0
        this.scoreText.scrollFactorY = 0.
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 120, 25);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");
        //Create background I guess
        this.background = this.map.createLayer("Background", this.tileset, 0, 0);
        this.background.setScale(2.0);

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);
        this.groundLayer.setScale(2.0);
        //console.log(getBounds(this.physics.world));
        this.physics.world.setBounds(0, 0, 18*240, 18*60);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(game.config.width/4, game.config.height/2, "platformer_characters", "tile_0000.png").setScale(SCALE)
        my.sprite.player.body.setSize(15, 15);
        my.sprite.player.setCollideWorldBounds(true);
        my.sprite.player.body.setMaxSpeed(this.MAX_SPEED);

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        //Have camera follow player
        this.cameras.main.startFollow(my.sprite.player, true, 0.5, 0.5, -50);
        this.cameras.main.setBounds(0, 0, 18*240, 18*60);

        //Set up coins
        this.coins = this.map.createLayer("Coins", this.tileset, 0, 0);
        this.coins.setScale(2.0);
        this.coins.setCollisionByProperty({
            coin: true
        });
        this.physics.add.overlap(my.sprite.player, this.coins, this.coinPickup, null, this);

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

    }

    update() {
        //check if coin object is visible
        //If visible, play animation
        if(cursors.left.isDown) {
            // TODO: have the player accelerate to the left
            my.sprite.player.body.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);

        } else if(cursors.right.isDown) {
            // TODO: have the player accelerate to the right
            my.sprite.player.body.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);

        } else {
            // TODO: set acceleration to 0 and have DRAG take over
            my.sprite.player.body.setAccelerationX(0);
            my.sprite.player.body.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            // TODO: set a Y velocity to have the player "jump" upwards (negative Y direction)
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
        }

        //Keep the score onscreen by having it follow the camera
        //For some reason, the score wraps?
        /*let camX = (my.sprite.player.x - this.game.config.width/2) < 40 ? 40 : my.sprite.player.x - this.game.config.width/2;
        let camY = (my.sprite.player.y - this.game.config.height/2) < 180 ? 180 : my.sprite.player.y - this.game.config.height/2;
        this.scoreText.setPosition(camX, camY);*/
    }
    coinPickup(player, coin){
        coin.visible = false;
        let tile_removed = this.map.removeTile(coin);
        //console.log(tile_removed[0].index);
        if (tile_removed[0].index != -1){
            this.score += 10;
            this.scoreText.setText("Score: " + this.score);
        }
    }
    scoreUpdate(){
        //change the numbers displayed
    }
}