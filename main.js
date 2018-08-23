// phina.jsをグローバル領域に展開

phina.globalize();

const SCREEN_WIDTH = 960;
const SCREEN_HEIGHT = 600;

const MYSCENES = [
    {
        className: 'Title',
        label: 'title',
        nextLabel: 'main'
    },
    {
        className: 'Main',
        label: 'main',
        nextLabel: 'result'
    },
    {
        className: 'Result',
        label: 'result',
        nextLabel: 'title'
    },
];


const ASSETS = {
    image:{
        'block': 'img/block.png',
    },
    spritesheet:{
        'block_ss': 'block_ss.json',
    },
};


const BLOCK_COLORS = 11;
const BLOCK_SIZE = 48;
const EMPTY_ID = -1;
const OJAMA_ID = 10;

const FIELD_X = 120;
const FIELD_Y = 0;
const FIELD_WIDTH = 6;
const FIELD_HEIGHT = 11;
const DISTANCE_FROM_FB_TO_PB = 24; // distance from bottom of field to push blocks
const PUSHBLOCKS_Y = FIELD_Y + FIELD_HEIGHT * BLOCK_SIZE + DISTANCE_FROM_FB_TO_PB;

phina.define('Title', {
    superClass: 'DisplayScene',
    init: function(){
        this.superInit({
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT
        });
        this.backgroundColor = 'yellow';
    },
    update: function(app){
        var key = app.keyboard;
        if (key.getKeyDown('space')) this.exit();
    }
});


phina.define('Main', {
    superClass: 'DisplayScene',
    init: function(){
        this.superInit({
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT
        });
        this.backgroundColor = 'black';
        this.dummyGroup = DisplayElement().addChildTo(this);
        this.acceptKeyInput = true;

        /* Prepare puzzle field */
        var fieldMap = new Array(FIELD_WIDTH);  // puzzle field map
        var fieldBlocks = new Array(FIELD_WIDTH);   //sprites of blocks on field
        var fieldBlocksAnimation = new Array(FIELD_WIDTH);  // animations of bloks on field
        for(let i = 0; i < FIELD_WIDTH; i++){
            fieldMap[i] = new Array(FIELD_HEIGHT).fill(0);
            fieldBlocks[i] = new Array(FIELD_HEIGHT);
            fieldBlocksAnimation[i] = new Array(FIELD_HEIGHT);
        }
        for(let i = 0; i < FIELD_WIDTH; i++){
            for(let j = 0; j < FIELD_HEIGHT; j++){
                fieldBlocks[i][j] =  Sprite('block', BLOCK_SIZE, BLOCK_SIZE).addChildTo(this);
                fieldBlocksAnimation[i][j] = FrameAnimation('block_ss').attachTo(fieldBlocks[i][j]);
                fieldBlocksAnimation[i][j].gotoAndPlay('block_' + fieldMap[i][j]);
                fieldBlocks[i][j].x = FIELD_X + BLOCK_SIZE * i;
                fieldBlocks[i][j].y = FIELD_Y + BLOCK_SIZE * j;
            }
        }
        this.fieldMap = fieldMap;
        this.fieldBlocks = fieldBlocks;
        this.fieldBlocksAnimation = fieldBlocksAnimation;


        /* Prepare push blocks */
        var pushBlocks = [Sprite('block', BLOCK_SIZE, BLOCK_SIZE).addChildTo(this), Sprite('block', BLOCK_SIZE, BLOCK_SIZE).addChildTo(this)];
        var pushBlocksAnimation = [FrameAnimation('block_ss').attachTo(pushBlocks[0]), FrameAnimation('block_ss').attachTo(pushBlocks[1])];
        var pushBlocksX = 2;
        var pushMap = [0, 0];
        pushBlocksAnimation[0].gotoAndPlay('block_' + pushMap[0]);
        pushBlocksAnimation[1].gotoAndPlay('block_' + pushMap[1]);
        pushBlocks[0].x = FIELD_X + pushBlocksX * BLOCK_SIZE;
        pushBlocks[1].x = FIELD_X + (pushBlocksX + 1) * BLOCK_SIZE;
        pushBlocks[0].y = PUSHBLOCKS_Y;
        pushBlocks[1].y = PUSHBLOCKS_Y;
        this.pushMap = pushMap;
        this.pushBlocks = pushBlocks;
        this.pushBlocksAnimation = pushBlocksAnimation;
        this.pushBlocksX = pushBlocksX;

        // 初期配置
        for(let x = 0; x < FIELD_WIDTH; x++){
            this.fieldMap[x].fill(EMPTY_ID);
            this.fieldMap[x][FIELD_HEIGHT - 1] = x;
        }
        this.fieldUpdate();

    },
    // 押し上げる
    pushToField: function(){
        console.log('push to field');
        for(let y = 0; y < FIELD_HEIGHT; y++){
            if (y < FIELD_HEIGHT - 1){
                this.fieldMap[this.pushBlocksX    ][y] = this.fieldMap[this.pushBlocksX    ][y + 1];
                this.fieldMap[this.pushBlocksX + 1][y] = this.fieldMap[this.pushBlocksX + 1][y + 1];
            }
            this.fieldBlocks[this.pushBlocksX    ][y].tweener.moveBy(0, -BLOCK_SIZE, 100).play();
            this.fieldBlocks[this.pushBlocksX + 1][y].tweener.moveBy(0, -BLOCK_SIZE, 100).play();
        }
        this.fieldMap[this.pushBlocksX    ][FIELD_HEIGHT - 1] = this.pushMap[0];
        this.fieldMap[this.pushBlocksX + 1][FIELD_HEIGHT - 1] = this.pushMap[1];
        this.pushBlocks[0].tweener.moveBy(0, -BLOCK_SIZE - DISTANCE_FROM_FB_TO_PB, 100)
                                  .play();
        this.pushBlocks[1].tweener.moveBy(0, -BLOCK_SIZE - DISTANCE_FROM_FB_TO_PB, 100)
                                  .play();
        this.dummyGroup.tweener.wait(100).call(() => {this.fieldUpdate()}).play();
    },

    // 消えるブロックを探す
    checkErase: function(){
        var matchFlag = 0;
        var isMatch = new Array(4); // [left, up, right, down]
        var setErase = new Array(FIELD_WIDTH);
        var direction = [-1, 0, 1, 0];
        console.log(this.fieldMap);

        for(let i = 0; i < FIELD_WIDTH; i++){
            setErase[i] = new Array(FIELD_HEIGHT);
            setErase[i].fill(0);
        }
        // 3マッチ（L字・I字）判定
        for(let x = 0; x < FIELD_WIDTH; x++){
            for(let y = 0; y < FIELD_HEIGHT; y++){
                isMatch.fill(0);
                if(this.fieldMap[x][y] == EMPTY_ID || this.fieldMap[x][y] == OJAMA_ID) continue;
                for(let d = 0; d < 4; d++){
                    if(x + direction[d] >= 0 && x + direction[d] < FIELD_WIDTH && y + direction[d ^ 1] >= 0 && y + direction[d ^ 1] < FIELD_HEIGHT){
                        isMatch[d] = (this.fieldMap[x][y] == this.fieldMap[x + direction[d]][y + direction[d ^ 1]]);
                    }
                }
                // 2方向マッチで消去フラグをオンにする
                if(isMatch[0] + isMatch[1] + isMatch[2] + isMatch[3] >= 2){
                    matchFlag = 1;
                    setErase[x][y] = 1;
                    for(let d = 0; d < 4; d++){
                        if(x + direction[d] >= 0 && x + direction[d] < FIELD_WIDTH && y + direction[d ^ 1] >= 0 && y + direction[d ^ 1] < FIELD_HEIGHT){
                            setErase[x + direction[d]][y + direction[d ^ 1]] |= isMatch[d];
                        }
                    }
                }
            }
        }
        // お邪魔消去判定
        for(let x = 0; x < FIELD_WIDTH; x++){
            for(let y = 0; y < FIELD_HEIGHT; y++){
                if(this.fieldMap[x][y] == OJAMA_ID){
                    for(let d = 0; d < 4; d++){
                        if(x + direction[d] >= 0 && x + direction[d] < FIELD_WIDTH && y + direction[d ^ 1] >= 0 && y + direction[d ^ 1] < FIELD_HEIGHT){
                            setErase[x][y] |= (setErase[x + direction[d]][y + direction[d ^ 1]] && (this.fieldMap[x + direction[d]][y + direction[d ^ 1]] != OJAMA_ID));
                        }
                    }
                }
            }
        }
        console.log(setErase);
        this.setErase = setErase;
        if(matchFlag){
            this.erase();
        }
        else{
            this.isGameOver();
        }
    },
    // 消去・ブロック落下
    erase: function(){
        var fall;
        // 各スプライトの移動を制御
        for(let x = 0; x < FIELD_WIDTH; x++){
            for(let y = 0; y < FIELD_HEIGHT; y++){
                // 消去アニメーション
                if(this.setErase[x][y]){
                    if(this.fieldMap[x][y] != OJAMA_ID){ // not Ojama
                        this.fieldBlocks[x][y].tweener.to({rotation: 360, scaleX: 0, scaleY: 0}, 500)
                                                      .call(() => {this.fieldBlocks[x][y].alpha = 0;})
                                                      .play();
                    }
                    else{ // Ojama
                        this.fieldBlocks[x][y].tweener.to({alpha: 0}, 500)
                                                      .play();
                    }
                }
                // 落下アニメーション
                else{
                    fall = 0;
                    for(let i = y; i < FIELD_HEIGHT; i++){
                        fall += this.setErase[x][i];
                    }
                    this.fieldBlocks[x][y].tweener.wait(500)
                                                  .moveBy(0, BLOCK_SIZE * fall, 300, 'easeInCubic')
                                                  .play();
                }
            }
        }
        // フィールド情報を更新
        for(let x = 0; x < FIELD_WIDTH; x++){
            for(let y = 0; y < FIELD_HEIGHT; y++){
                if(this.setErase[x][y]){
                    for(let i = y; i > 0; i--){
                        this.fieldMap[x][i] = this.fieldMap[x][i - 1];
                    }
                    this.fieldMap[x][0] = EMPTY_ID;
                }
            }
        }
        console.log(this.fieldMap);
        // wait 1000ms -> goto fieldUpdate
        this.dummyGroup.tweener.wait(1000)
                               .call(() => {this.fieldUpdate(0);})
                               .play();
    },
    // 盤面更新
    fieldUpdate: function(initFlag){
        console.log('Start Updating...');
        this.pushBlocks[0].alpha = 0.0;
        this.pushBlocks[1].alpha = 0.0;
        for(let x = 0; x < FIELD_WIDTH; x++){
            for(let y = 0; y < FIELD_HEIGHT; y++){
                this.fieldBlocks[x][y].x = FIELD_X + BLOCK_SIZE * x;
                this.fieldBlocks[x][y].y = FIELD_Y + BLOCK_SIZE * y;
                this.fieldBlocks[x][y].alpha = 1;
                this.fieldBlocks[x][y].setScale(1.0, 1.0).setRotation(0);
                if(this.fieldMap[x][y] != EMPTY_ID){
                    this.fieldBlocksAnimation[x][y].gotoAndPlay('block_' + this.fieldMap[x][y]);
                }
                else{
                    this.fieldBlocks[x][y].alpha = 0;
                }
            }
        }
        this.checkErase();
    },
    // ゲームオーバー判定
    isGameOver: function(){
        console.log('game over?');
        var gameOver = 0;
        if(gameOver){

        }
        else{
            for(let i = 0; i < 2; i++){
                this.pushMap[i] = Random.randint(0, 7);
                if(!Random.randint(0, 6)) this.pushMap[i] = OJAMA_ID;
                this.pushBlocksAnimation[i].gotoAndPlay('block_' + this.pushMap[i]);
                this.pushBlocks[i].y = PUSHBLOCKS_Y;
                this.pushBlocks[i].alpha = 1.0;
            }
            this.acceptKeyInput = true;
            return;
        }
    },
    // 毎フレーム呼び出し
    update: function(app){
        var key = app.keyboard;
        var tmp;
        if(this.acceptKeyInput == true){
            // push
            if(key.getKeyDown('W')){
                this.acceptKeyInput = false;
                this.pushToField();
            }
            // move to left
            if(key.getKeyDown('A') && this.pushBlocksX > 0){
                // refuse key input for 0.1 sec.
                this.dummyGroup.tweener.call(() => {this.acceptKeyInput = false})
                                       .wait(100)
                                       .call(() => {this.acceptKeyInput = true})
                                       .play();
                this.pushBlocksX--;
                for(let i = 0; i < 2; i++){
                    this.pushBlocks[i].tweener.moveBy(-BLOCK_SIZE, 0, 100).play();
                }
            }
            // move to right
            if(key.getKeyDown('D') && this.pushBlocksX < FIELD_WIDTH - 2){
                // refuse key input for 0.1 sec.
                this.dummyGroup.tweener.call(() => {this.acceptKeyInput = false})
                                       .wait(100)
                                       .call(() => {this.acceptKeyInput = true})
                                       .play();
                this.pushBlocksX++;
                for(let i = 0; i < 2; i++){
                    this.pushBlocks[i].tweener.moveBy(BLOCK_SIZE, 0, 100).play();
                }
            }
            // swap
            if(key.getKeyDown('S')){
                // refuse key input for 0.1 sec.
                this.dummyGroup.tweener.call(() => {this.acceptKeyInput = false})
                                       .wait(100)
                                       .call(() => {this.acceptKeyInput = true})
                                       .play();
                // マップ情報を入れ替える
                tmp = this.pushMap[0];
                this.pushMap[0] = this.pushMap[1];
                this.pushMap[1] = tmp;
                // 入れ替えアニメーションを行った後、情報を更新
                this.pushBlocks[0].tweener.moveBy(BLOCK_SIZE, 0, 100)
                                          .call(()=>{
                                              this.pushBlocksAnimation[0].gotoAndPlay('block_' + this.pushMap[0]);
                                              this.pushBlocks[0].moveBy(-BLOCK_SIZE, 0)
                                          })
                                          .play();
                this.pushBlocks[1].tweener.moveBy(-BLOCK_SIZE, 0, 100)
                                          .call(()=>{
                                              this.pushBlocksAnimation[1].gotoAndPlay('block_' + this.pushMap[1]);
                                              this.pushBlocks[1].moveBy(BLOCK_SIZE, 0)
                                          })
                                          .play();
            }
            if(key.getKeyDown('space')) this.exit();
        }
    }
});

phina.define('Result', {
    superClass: 'DisplayScene',
    init: function(){
        this.superInit({
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT
        });
        this.backgroundColor = 'blue';
    },
    update: function(app){
        var key = app.keyboard;
        if (key.getKeyDown('space')) this.exit();
    }
});






phina.main(function(){
    var app = GameApp({
        startLabel: 'title',
        assets: ASSETS,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        fit: true,
        scenes: MYSCENES
    });
    app.run();
})
