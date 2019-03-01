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
        'field': 'img/field.png',
        'background': 'img/background.png'
    },
    spritesheet:{
        'block_ss': 'block_ss.json',
    },
};


const BLOCK_COLORS = 10;
const BLOCK_SIZE = 48;
const EMPTY_ID = -1;
const OJAMA_ID = 10;

const FIELD_X = 120;
const FIELD_Y = 16;
const FIELD_WIDTH = 6;
const FIELD_HEIGHT = 11;
const DISTANCE_FROM_FB_TO_PB = 16; // distance from bottom of field to push blocks
const PUSHBLOCKS_Y = FIELD_Y + FIELD_HEIGHT * BLOCK_SIZE + DISTANCE_FROM_FB_TO_PB;
const DISTANCE_BETWEEN_NEXTBLOCKS = 48;
const NEXTBLOCKS_X = FIELD_X + FIELD_WIDTH * BLOCK_SIZE + DISTANCE_BETWEEN_NEXTBLOCKS;
const VISIBLE_NEXT = 4;

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

        var backGroundPaper = Sprite('background').addChildTo(this).setPosition(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);

        this.dummyGroup = DisplayElement().addChildTo(this); // dummy group for waiting
        this.puzzleFieldGroup = DisplayElement().addChildTo(this); // dummy group for gameover animation
        this.acceptKeyInput = true;

        /* Preare puzzle field */
        var fieldImage = Sprite('field', 320, 512).addChildTo(this.puzzleFieldGroup);
        fieldImage.origin.set(0,0);
        fieldImage.moveTo(FIELD_X - BLOCK_SIZE/2 - 16, FIELD_Y + 8);

        /* shuffle block color */
        var blockOrder = new Array(BLOCK_COLORS);
        var j, temp;
        for(let i = 0; i < BLOCK_COLORS; i++) blockOrder[i] = i;
        for(let i = 0; i < BLOCK_COLORS; i++){
            j = Random.randint(0, BLOCK_COLORS - 1);
            temp = blockOrder[i];
            blockOrder[i] = blockOrder[j];
            blockOrder[j] = temp;
        }
        this.blockOrder = blockOrder;

        /* Prepare puzzle field blocks*/
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
                fieldBlocks[i][j] =  Sprite('block', BLOCK_SIZE, BLOCK_SIZE).addChildTo(this.puzzleFieldGroup);
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

        /* next blocks */
        var nextMap = new Array(VISIBLE_NEXT);
        var nextBlocks = new Array(VISIBLE_NEXT);
        var nextBlocksAnimation = new Array(VISIBLE_NEXT);
        for(let i = 0; i < VISIBLE_NEXT; i++){
            nextMap[i] = new Array(2);
            nextBlocks[i] = new Array(2);
            nextBlocksAnimation[i] = new Array(2);
            for(let j = 0; j < 2; j++){
                nextMap[i][j] = this.blockOrder[Random.randint(0, 5)];
                nextBlocks[i][j] = Sprite('block', BLOCK_SIZE, BLOCK_SIZE).addChildTo(this);
                nextBlocksAnimation[i][j] = FrameAnimation('block_ss').attachTo(nextBlocks[i][j]).gotoAndPlay('block_' + nextMap[i][j]);
                nextBlocks[i][j].moveTo(NEXTBLOCKS_X + 128 * i + BLOCK_SIZE * j, PUSHBLOCKS_Y);
            }
        }
        this.nextMap = nextMap;
        this.nextBlocks = nextBlocks;
        this.nextBlocksAnimation = nextBlocksAnimation;

        /* other status */
        this.pushUpCounter = 0; // 消さずに押し上げた回数のカウント
        this.combo = 0; // コンボ
        this.comboFlag = false; // コンボ持続状態の管理(false時に消せなかった場合、コンボが途切れる)
        this.score = 0; // 現在のスコア
        this.addScore = 0; // ブロック消去により加算されるスコア
        this.goToTitle = false; // ゲームオーバーの時、タイトルに戻る操作が有効かどうか管理するフラグ

        /* labels */
        // combo label
        this.comboLabel = Label({
            text: '',
            fontSize: 32,
            fill: 'yellow',
            fontFamily: "'Courier New'"
        }).addChildTo(this);
        this.comboLabel.origin.set(1, 0);
        this.comboLabel.setPosition(840, 160);
        // score label
        this.scoreLabel = Label({
            text: 'Score: ' + ( '00000000' + this.score ).slice(-8),
            fontSize: 32,
            fill: 'white',
            fontFamily: "'Courier New'"
        }).addChildTo(this);
        this.scoreLabel.origin.set(1, 0);
        this.scoreLabel.setPosition(840, 120);
        // additional score label
        this.addScoreLabel = Label({
            text: '',
            fontsize: 32,
            fill: 'white',
            fontFamily: "'Courier New'"
        }).addChildTo(this);
        this.addScoreLabel.origin.set(1, 0);
        this.addScoreLabel.setPosition(-255, -255);

        // 初期配置
        for(let x = 0; x < FIELD_WIDTH; x++){
            this.fieldMap[x].fill(EMPTY_ID);
            this.fieldMap[x][FIELD_HEIGHT - 1] = this.blockOrder[x];
        }
        this.fieldUpdate();

    },

    // 押し上げる
    pushToField: function(){
        console.log('push to field');
        this.pushUpCounter++;
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
                                  .set({alpha: 0.0})
                                  .play();
        this.pushBlocks[1].tweener.moveBy(0, -BLOCK_SIZE - DISTANCE_FROM_FB_TO_PB, 100)
                                  .set({alpha: 0.0})
                                  .play();
        this.dummyGroup.tweener.wait(100).call(() => {this.fieldUpdate()}).play();
    },

    // お邪魔を1列生成して押し上げ
    pushOjamaToField: function(){
        console.log('push Ojama to field');
        var ojamaBlocks = new Array(FIELD_WIDTH);
        var ojamaBlocksAnimation = new Array(FIELD_WIDTH);
        for(let x = 0; x < FIELD_WIDTH; x++){
            for(let y = 0; y < FIELD_HEIGHT; y++){
                if(y < FIELD_HEIGHT - 1){
                    this.fieldMap[x][y] = this.fieldMap[x][y + 1];
                }
                this.fieldBlocks[x][y].tweener.moveBy(0, -BLOCK_SIZE, 200, 'easeOutCubic').play();
            }
            this.fieldMap[x][FIELD_HEIGHT - 1] = OJAMA_ID;
            ojamaBlocks[x] = Sprite('block', BLOCK_SIZE, BLOCK_SIZE).addChildTo(this).moveTo(-100, -100);
            ojamaBlocksAnimation[x] = FrameAnimation('block_ss').attachTo(ojamaBlocks[x]).gotoAndPlay('block_' + OJAMA_ID);
            ojamaBlocks[x].tweener.set({x: FIELD_X + BLOCK_SIZE * x, y: PUSHBLOCKS_Y, alpha: 0.0})
                                  .by({y: -BLOCK_SIZE - DISTANCE_FROM_FB_TO_PB, alpha: 1.0}, 200, 'easeOutCubic')
                                  .set({alpha: 0.0})
                                  .play();
        }
        this.dummyGroup.tweener.wait(200).call(() => {this.fieldUpdate()}).play();
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
        // 加算スコアの計算・お邪魔消去判定
        this.addScore = 0;
        if(matchFlag){
            this.combo++;
            this.comboLabel.text = this.combo + ' combo';
        }
        else if(!this.comboFlag){
            this.combo = 0;
            this.comboLabel.text = '';
        }
        for(let x = 0; x < FIELD_WIDTH; x++){
            for(let y = 0; y < FIELD_HEIGHT; y++){
                // culculate additional score
                this.addScore += ((this.fieldMap[x][y] != OJAMA_ID) && setErase[x][y]) * 10;
                // search ojama which is erased
                if(this.fieldMap[x][y] == OJAMA_ID){
                    for(let d = 0; d < 4; d++){
                        if(x + direction[d] >= 0 && x + direction[d] < FIELD_WIDTH && y + direction[d ^ 1] >= 0 && y + direction[d ^ 1] < FIELD_HEIGHT){
                            setErase[x][y] |= (setErase[x + direction[d]][y + direction[d ^ 1]] && (this.fieldMap[x + direction[d]][y + direction[d ^ 1]] != OJAMA_ID));
                        }
                    }
                }
            }
        }
        this.addScoreLabel.text = this.addScore + ' x';
        // 5個以上の大量同時消しボーナス
        let bairitsu = 1.5; // ボーナス倍率
        if(this.addScore >= 50){
            this.addScore = Math.floor(this.addScore * bairitsu);
            this.addScoreLabel.text = this.addScoreLabel.text + bairitsu + ' x';
        }
        // コンボボーナス（最大7）
        this.addScore *= (this.combo > 7 ? 7 : this.combo);
        this.addScoreLabel.text += (this.combo > 7 ? 7 : this.combo);
        this.score += this.addScore;

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
        this.pushUpCounter = 0;
        this.comboFlag = true;
        var fall;
        var animateTime_1 = 300, animateTime_2 = 500, animateTime_3 = 300;
        // 各スプライトの移動を制御
        for(let x = 0; x < FIELD_WIDTH; x++){
            for(let y = 0; y < FIELD_HEIGHT; y++){
                // 消去アニメーション
                if(this.setErase[x][y]){
                    if(this.fieldMap[x][y] != OJAMA_ID){ // not Ojama
                        this.fieldBlocks[x][y].tweener.to({scaleX: 0.8, scaleY: 0.8}, animateTime_1 / 2)
                                                      .to({scaleX: 1.0, scaleY: 1.0}, animateTime_1 / 2)
                                                      .to({rotation: 360, scaleX: 0, scaleY: 0}, animateTime_2)
                                                      .call(() => {this.fieldBlocks[x][y].alpha = 0;})
                                                      .play();
                    }
                    else{ // Ojama
                        this.fieldBlocks[x][y].tweener.wait(animateTime_1)
                                                      .to({alpha: 0}, animateTime_2)
                                                      .play()
                    }
                }
                // 落下アニメーション
                else{
                    fall = 0;
                    for(let i = y; i < FIELD_HEIGHT; i++){
                        fall += this.setErase[x][i];
                    }
                    this.fieldBlocks[x][y].tweener.wait(animateTime_1 + animateTime_2)
                                                  .moveBy(0, BLOCK_SIZE * fall, animateTime_3, 'easeInCubic')
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
        // additional score animation
        this.addScoreLabel.moveTo(840, 100);
        this.addScoreLabel.tweener.set({alpha: 0.0})
                                  .by({y: -16, alpha: 1.0}, 100)
                                  .wait(animateTime_1 + animateTime_2)
                                  .by({y: -16, alpha: -1.0}, 100)
                                  .play();
        // update score
        this.scoreLabel.text = 'Score: ' + ( '00000000' + this.score ).slice(-8);
        // wait -> goto fieldUpdate
        this.dummyGroup.tweener.wait(animateTime_1 + animateTime_2 + animateTime_3 + 100)
                               .call(() => {this.fieldUpdate(0);})
                               .play();
    },
    // 盤面更新
    fieldUpdate: function(initFlag){
        console.log('Start Updating...');
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
        var gameOver = false;
        for(let i = 0; i < FIELD_WIDTH; i++){
            gameOver |= (this.fieldMap[i][0] != EMPTY_ID);
        }
        if(gameOver){
            let self = this;
            let gameOverLabel = Label({
                text: 'GAME OVER',
                fontSize: 48,
                fill: 'tomato',
                fontFamily: "'Courier New'"
            }).addChildTo(this).setPosition(FIELD_X + BLOCK_SIZE * FIELD_WIDTH / 2 - BLOCK_SIZE / 2, FIELD_Y + BLOCK_SIZE * FIELD_HEIGHT / 2);
            let pressSpaceKeyLabel = Label({
                text: 'Press space key',
                fontSize: 24,
                fill: 'white',
                fontFamily: "'Courier New'"
            }).addChildTo(this).setPosition(FIELD_X + BLOCK_SIZE * FIELD_WIDTH / 2 - BLOCK_SIZE / 2, FIELD_Y + BLOCK_SIZE * FIELD_HEIGHT / 2 + 64);
            gameOverLabel.alpha = 0.0;
            pressSpaceKeyLabel.alpha = 0.0;
            this.puzzleFieldGroup.tweener.wait(100)
                                         .moveBy(0,  16, 40)
                                         .moveBy(0, -32, 40)
                                         .moveBy(0,  24, 40)
                                         .moveBy(0, -16, 40)
                                         .moveBy(0,   8, 40)
                                         .wait(200)
                                         .by({x:0, y:800}, 1000, 'easeInCubic')
                                         .call(() => {
                                             gameOverLabel.tweener.by({alpha: 1.0}, 300).play();
                                         })
                                         .wait(2000)
                                         .call(() => {
                                             pressSpaceKeyLabel.tweener.by({alpha: 1.0}, 300).play();
                                             this.goToTitle = true;
                                         })
                                         .play();
            return;
        }
        else{
            this.comboFlag = false;
            if(this.pushUpCounter > 4){
                this.pushUpCounter = 0;
                this.pushOjamaToField(); // if push up with no erase 5 times, put ojama
            }
            // prepare next pushBlocks and return
            else{
                for(let j = 0; j < 2; j++){
                    this.pushMap[j] = this.nextMap[0][j];
                    this.pushBlocksAnimation[j].gotoAndPlay('block_' + this.pushMap[j]);
                    this.pushBlocks[j].y = PUSHBLOCKS_Y;
                    this.pushBlocks[j].tweener.set({alpha: 1.0}).play();
                    for(let i = 0; i < VISIBLE_NEXT - 1; i++){
                        this.nextMap[i][j] = this.nextMap[i + 1][j];
                        this.nextBlocksAnimation[i][j].gotoAndPlay('block_' + this.nextMap[i][j]);
                    }
                    this.nextMap[VISIBLE_NEXT - 1][j] = this.blockOrder[Random.randint(0, BLOCK_COLORS - 1)];
                    if(!Random.randint(0, 99)) this.nextMap[VISIBLE_NEXT - 1][j] = OJAMA_ID;
                    this.nextBlocksAnimation[VISIBLE_NEXT - 1][j].gotoAndPlay('block_' + this.nextMap[VISIBLE_NEXT - 1][j]);
                }
                this.acceptKeyInput = true;
                return;
            }
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
        if(this.goToTitle){
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
