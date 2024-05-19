class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }
    preload(){
        this.load.scenePlugin('AnimatedTiles', './lib/AnimatedTiles.js', 'animatedTiles', 'animatedTiles');
    }
    init() {
        // variables and settings
        this.ACCELERATION = 500;
        this.DRAG = 1500;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -700;
        this.MAX_SPEED = 900;
        this.score = 0;
        this.spawnX = game.config.width/4;
        this.spawnY = 2*game.config.height/3;
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

        //Use the animation (NOT WORKING!!!!!!)
        //this.animatedTiles.init(this.map);


        //Create background I guess
        this.background = this.map.createLayer("Background", this.tileset, 0, 0);
        this.background.setScale(2.0);

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);
        this.groundLayer.setScale(2.0);
        this.physics.world.setBounds(0, 0, this.map.widthInPixels*2, this.map.heightInPixels*2);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });
        //console.log(this.groundLayer);
        //this.hazards = this.physics.add.group();
        let water_tiles = this.groundLayer.filterTiles((tile)=>{
            //console.log(tile);
            if (tile.index == 34 || tile.index == 44){
                return true;
            }
            return false;
        },);
        //console.log(water_tiles);
        for (let tile of water_tiles){
            tile.setCollisionCallback(this.waterDeath, this);
        }
        //this.physics.add.overlap(my.sprite.player, water_tiles, this.cantSwim, null, this);

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(game.config.width/4, 2*game.config.height/3, "platformer_characters", "tile_0000.png").setScale(SCALE)
        my.sprite.player.body.setSize(15, 15);
        my.sprite.player.setCollideWorldBounds(true);
        my.sprite.player.body.setMaxSpeed(this.MAX_SPEED);

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();
        
        //Have camera follow player
        this.cameras.main.setZoom(1.5);
        this.cameras.main.centerOn(my.sprite.player.x, my.sprite.player.y);
        this.cameras.main.startFollow(my.sprite.player, false, 0.5, 0.5);
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels*2, this.map.heightInPixels*2);
        //this.cameras.main.setScroll(game.config.width/2, game.config.height/2);

        //Set up coins
        this.coins = this.map.createLayer("Coins", this.tileset, 0, 0);
        this.coins.setScale(2.0);
        this.coins.setCollisionByProperty({
            coin: true
        });
        this.physics.add.overlap(my.sprite.player, this.coins, this.coinPickup, null, this);
        this.coinSound = this.sound.add("coin collected sound");

        //Set up flags
        this.flags = this.map.createLayer("Flags", this.tileset, 0, 0);
        this.flags.setScale(2);
        this.flags.setCollisionByProperty({
            collides: true
        });
        this.physics.add.overlap(my.sprite.player, this.flags, this.checkPoint, null, this);

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
        //this.cameras.main.centerOn(my.sprite.player.x, my.sprite.player.y);
        //console.log("X: "+my.sprite.player.x+", Y: "+my.sprite.player.y );
    }
    coinPickup(player, coin){
        coin.visible = false;
        let tile_removed = this.map.removeTile(coin);
        //console.log(tile_removed[0].index);
        if (tile_removed[0].index != -1){
            this.coinSound.play();
            this.score += 10;
            this.scoreText.setText("Score: " + this.score);
        }
    }
    checkPoint(player, flag){
        //console.log(flag);
        if (flag.index == 112){
            this.spawnX = flag.x * 36;
            this.spawnY = flag.y * 36;
        } else if (flag.index == 132){
            this.spawnX = flag.x* 36;
            this.spawnY = (flag.y - 1)* 36;
        }
    }
    waterDeath(){
        //play animation
        this.respawn();
    }
    respawn(){
        my.sprite.player.x = this.spawnX;
        my.sprite.player.y = this.spawnY;
    }
}