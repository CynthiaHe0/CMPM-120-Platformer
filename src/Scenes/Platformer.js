class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }
    preload(){
        this.load.scenePlugin('AnimatedTiles', './lib/AnimatedTiles.js', 'animatedTiles', 'animatedTiles');
    }
    init() {
        // variables and settings
        this.ACCELERATION = 400;
        this.DRAG = 1800;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -700;
        this.MAX_SPEED = 800;
        this.score = 0;
        this.spawnX = game.config.width/5;
        this.spawnY = 5*game.config.height/6;
        this.playerStates = {};
        this.playerStates.inWater = false;
        this.playerStates.stepSounds = false;
        this.flagCount = 0;
    }

    create() {

        

        this.parallax = this.add.tilemap("near_parallax", 16, 16, 120, 25);
        let trees = this.parallax.addTilesetImage("kenny-tiny-town-tilemap-packed", "tiny_town");
        let sky = this.parallax.addTilesetImage("Big_Background", "big background");
        this.parallaxBackground = this.parallax.createLayer("Background", [sky, trees], 0, -200).setScrollFactor(0.5);
        this.parallaxBackground.setScale(2);
        this.parallaxTrees = this.parallax.createLayer("Tree Layer", trees, 0, -200).setScrollFactor(0.5);
        this.parallaxTrees.setScale(2);

        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 120, 10);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        //this.skyColors = this.map.addTilesetImage("Parallax maybe", "big background");
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");
        this.caveColors = this.map.addTilesetImage("Parallax maybe", "big background");
        //Use the animation (NOT WORKING!!!!!!)
        //this.animatedTiles.init(this.map);


        //Create background I guess
        this.background = this.map.createLayer("Background", [this.tileset, this.caveColors], 0, 0);
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
        my.sprite.player = this.physics.add.sprite(this.spawnX, this.spawnY, "platformer_characters", "tile_0000.png").setScale(SCALE)
        my.sprite.player.body.setSize(15, 15);
        my.sprite.player.setCollideWorldBounds(true);
        my.sprite.player.body.setMaxSpeed(this.MAX_SPEED);
        this.playerStepSound = this.sound.add("default step");
        this.playerJumpSound = this.sound.add("jump");
        this.playerSplashSound = this.sound.add("splash");
        this.playerBubbleSound = this.sound.add("bubbles");
        this.checkPointSound = this.sound.add("yay");

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
        
        //PUT THE INIT AFTER ALL LAYERS CREATED
        this.animatedTiles.init(this.map);

        this.timedEvent = this.time.addEvent({ delay: 10000, callback: this.onEvent, callbackScope: this, repeat: -1, startAt: 5000 });
        let line = new Phaser.Geom.Line(0, 0, 20, 0);
        this.bubblesVFX = this.add.particles(0, 0, "kenny-particles", {
            frame: 'circle_01.png',
            emitZone: { 
                type: 'random', // also try 'random' for rain-like effect 🌈
                source: line, 
                quantity: 100, 
                yoyo: true,
            },
            //x: {random: [-50, 50 ] },
            //radial: true,
            scale: {start: 0.001, end: 0.03},
            // TODO: Try: maxAliveParticles: 8,
            maxAliveParticles: 8,
            lifespan: 500,
            // TODO: Try: gravityY: -400,
            gravityY: -200,
            tint: 0xebb521,
        });
        
        //this.bubblesVFX.setTint(0xebb521);
        this.bubblesVFX.stop();

        //This somehow broke as I was implementing parallax stuff
        this.scoreText = this.add.bitmapText(20, 20, 'text', 'Score: 0', 32);
        this.scoreText.scrollFactorX = 0;
        this.scoreText.scrollFactorY = 0;
        this.scoreText.depth = 100;

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
        if(my.sprite.player.body.blocked.down) {
            if (!(this.playerStates.stepSounds) && (my.sprite.player.body.velocity.x != 0)){
                this.playerStates.stepSounds = true;
                this.playerStepSound.play();
                this.playerStepSound.on('complete', () => {
                    this.playerStates.stepSounds = false;
                });
            }
            if(Phaser.Input.Keyboard.JustDown(cursors.up)){
                my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
                this.playerJumpSound.play();
            }
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
        if (flag.index == 112 || flag.index == 132){
            if (this.spawnX != flag.x * 36){
                this.spawnX = flag.x * 36;
                this.spawnY = 36 * (flag.index == 112 ? flag.y : flag.y-1);
                this.checkPointSound.play();
                this.flagCount++;
            }
        }
        if (this.flagCount >= 2){
            console.log("You win!");
        }
    }
    waterDeath(){
        if (this.playerStates.inWater == false){
            //This is to prevent it from triggering multiple times
            this.playerStates.inWater = true;
            //This is because gravity wasn't playing fair with the tween
            this.physics.world.gravity.y = 0;
            this.playerSplashSound.play();
            this.bubblesVFX.start();
            this.bubblesVFX.startFollow(my.sprite.player, -5, -15, false);
            this.playerBubbleSound.play();
            //Fun fact, the tween destroys itself after playing ._.
            //That or the this context was screwing me over earlier
            this.drowning = this.tweens.add({
                targets: my.sprite.player,
                y: my.sprite.player.y + 100,
                duration: 1000,
                ease: 'Linear',
            });
            this.drowning.on('complete', () => {
                this.bubblesVFX.stop();
                this.playerBubbleSound.stop();
                this.playerStates.inWater = false;
                this.physics.world.gravity.y = 1500;
                this.respawn();
            });
        }
    }
    respawn(){
        //this.physics.world.gravity.y = 1500;
        my.sprite.player.x = this.spawnX;
        my.sprite.player.y = this.spawnY;
    }
    timedEvent(){
        console.log("Hi! I am timed!");
    }
}