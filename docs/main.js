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
        nextLabel: 'title'
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
        'field': 'img/field_2.png',
        'background': 'img/background_2.png',
        'howto': 'img/howto.png',
        'displayBox': 'img/displaybox_3.png'
    },
    spritesheet:{
        'block_ss': 'block_ss.json',
        'displayBox_ss': 'displayBox_ss.json'
    },
    sound:{
        'moveAndSwap': 'se/enemyshot_trim.mov',
        'push': 'se/shot_trim.mov',
        'gameOver': 'se/damage.mp3',
        'erase': 'se/jump.mp3',
        'ojama': 'se/enemyhit_trim.mov'
    }
};


const BLOCK_COLORS = 10;
const BLOCK_SIZE = 48;
const EMPTY_ID = -1;
const OJAMA_ID = 10;

const FIELD_X = 100;
const FIELD_Y = 4;
const FIELD_WIDTH = 6;
const FIELD_HEIGHT = 11;
const DISTANCE_FROM_FB_TO_PB = 16; // distance from bottom of field to push blocks
const PUSHBLOCKS_Y = FIELD_Y + FIELD_HEIGHT * BLOCK_SIZE + DISTANCE_FROM_FB_TO_PB;
const DISTANCE_BETWEEN_NEXTBLOCKS = 96;
const NEXTBLOCKS_X = FIELD_X + FIELD_WIDTH * BLOCK_SIZE + DISTANCE_BETWEEN_NEXTBLOCKS;
const VISIBLE_NEXT = 4;
const LEVEL_MAX = 6;
const SCORELABEL_RIGHT = 800;


/* テキストボックス作成 */
let displayBox = function(p, width, height){
    var displayElem = DisplayElement().addChildTo(p);
    var pieces = new Array(width);
    var piecesAnimation = new Array(width);
    var ssName;
    for (let i = 0; i < width; i++){
        pieces[i] = new Array(height);
        piecesAnimation[i] = new Array(height);
    }
    for (let j = 0; j < height; j++){
        for (let i = 0; i < width; i++){
            if (i === 0){
                if (j === 0)               ssName = 'leftTop';
                else if (j === height - 1) ssName = 'leftBottom';
                else                       ssName = 'left';
            }
            else if (i === width - 1){
                if (j === 0)               ssName = 'rightTop';
                else if (j === height - 1) ssName = 'rightBottom';
                else                       ssName = 'right';
            }
            else{
                if (j === 0)               ssName = 'top';
                else if (j === height - 1) ssName = 'bottom';
                else                       ssName = 'center';
            }

            pieces[i][j] = Sprite('displayBox', 16, 16).addChildTo(displayElem)
                                               .setPosition((- width / 2 + i + 0.5) * 16, (- height / 2 + j + 0.5) * 16);
            piecesAnimation[i][j] = FrameAnimation('displayBox_ss').attachTo(pieces[i][j]);
            piecesAnimation[i][j].gotoAndPlay(ssName);
        }
    }
    return displayElem;
}

phina.define('Title', {
    superClass: 'DisplayScene',
    init: function(){
        this.superInit({
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT
        });
        this.mode = 'FREE';
        this.backgroundColor = 'black';
        this.acceptKeyInput = true;
        this.group = DisplayElement().addChildTo(this).setPosition(0, SCREEN_HEIGHT);
        // title label
        this.backGroundPaper = Sprite('background').addChildTo(this.group).setPosition(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
        this.titleDisplay = displayBox(this.group, 45, 12).setPosition(480,180);
        this.titleLabel = Label({
            text: 'Oshiage Puzzle',
            fontSize: 64,
            fill: 'yellow',
            stroke: 'blue',
            strokeWidth: 8,
            fontFamily: "'Courier New'"
        }).addChildTo(this.group);
        this.titleLabel.origin.set(0.5, 0.5);
        this.titleLabel.setPosition(480, 180);
        /*
        // press label
        this.pressLabel = Label({
            text: 'Press space key to start',
            fontSize: 48,
            fill: 'white',
            strokeWidth: 8,
            fontFamily: "'Courier New'"
        }).addChildTo(this);
        this.pressLabel.origin.set(0.5, 0.5);
        this.pressLabel.setPosition(480, 400);
        */
        // select
        this.rectangle = RectangleShape({
            width: 600,
            height: 96,
            fill: 'indigo',
            strokeWidth: 8,
            stroke: 'mediumpurple',
            cornerRadius: 10,
        }).addChildTo(this.group);
        this.rectangle.setPosition(480, 340);
        this.rectangle.alpha = 0.75;
        // mode label
        this.freePlayLabel = Label({
            padding: 16,
            text: 'free play       ',
            fontSize: 48,
            fill: 'white',
            strokeWidth: 8,
            fontFamily: "'Courier New'"
        }).addChildTo(this.group);
        this.freePlayLabel.origin.set(0.5, 0.5);
        this.freePlayLabel.setPosition(480, 340);
        this.timeChallengeLabel = Label({
            padding: 16,
            text: '90sec Challenge ',
            fontSize: 48,
            fill: 'white',
            strokeWidth: 8,
            fontFamily: "'Courier New'"
        }).addChildTo(this.group);
        this.timeChallengeLabel.origin.set(0.5, 0.5);
        this.timeChallengeLabel.setPosition(480, 460);

        this.group.tweener.to({y: 0}, 400, 'easeOutBack').play();
    },
    update: function(app){
        var key = app.keyboard;
        if (this.acceptKeyInput){
            if (key.getKeyDown('space')) {
                SoundManager.setVolume(0.3);
                SoundManager.play('push');
                this.acceptKeyInput = false;
                this.rectangle.tweener.set({alpha: 0.0})
                                      .wait(80)
                                      .set({alpha: 0.75})
                                      .wait(80)
                                      .set({alpha: 0.0})
                                      .wait(80)
                                      .set({alpha: 0.75})
                                      .wait(80)
                                      .play();
                this.titleLabel.tweener.wait(400)
                                       .call(() => {
                                           this.group.tweener.by({y: -SCREEN_HEIGHT}, 400, 'easeInBack').play();
                                       })
                                       .wait(400)
                                       .call(() =>{
                                           this.exit({gameMode: this.mode});
                                       })
                                       .play();
            }
            else if (key.getKeyDown('w') ^ key.getKeyDown('s')){
                SoundManager.setVolume(0.3);
                SoundManager.play('moveAndSwap');
                this.mode = (this.mode === 'FREE') ? 'TIME' : 'FREE';
                if (this.mode === 'FREE'){
                    this.rectangle.tweener.call(() => {this.acceptKeyInput = false;})
                                          .to({y: 340}, 80, 'easeOutCubic')
                                          .wait(100)
                                          .call(() => {this.acceptKeyInput = true;})
                                          .play();
                }
                else if (this.mode === 'TIME'){
                    this.rectangle.tweener.call(() => {this.acceptKeyInput = false;})
                                          .to({y: 460}, 80, 'easeOutCubic')
                                          .wait(100)
                                          .call(() => {this.acceptKeyInput = true;})
                                          .play();
                }
            }
        }
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
        this.dummyGroup = DisplayElement().addChildTo(this).setPosition(0, SCREEN_HEIGHT); // dummy group for waiting



        var backGroundPaper = Sprite('background').addChildTo(this.dummyGroup).setPosition(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);

        this.acceptKeyInput = false;
        this.firstFieldUpdate = true;

        /* Preare puzzle field */
        this.puzzleFieldGroup = DisplayElement().addChildTo(this.dummyGroup); // dummy group for gameover animation
        var fieldImage = Sprite('field', 320, 512).addChildTo(this.puzzleFieldGroup);
        fieldImage.origin.set(0,0);
        fieldImage.moveTo(FIELD_X - BLOCK_SIZE/2 - 16, FIELD_Y + 8); // 注意:クソ実装につき取り扱いは慎重に！

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

        this.joint = displayBox (this.puzzleFieldGroup, 10, 1).setPosition(400, PUSHBLOCKS_Y - 4);
        this.pushfieldDisplay = displayBox(this.puzzleFieldGroup, FIELD_WIDTH * 3 + 2,  5).setPosition(FIELD_X + FIELD_WIDTH * 48 / 2 - 24, PUSHBLOCKS_Y);
        this.nextDisplay = new Array(VISIBLE_NEXT);
        for (let i = 0; i < VISIBLE_NEXT; i++){
            this.nextDisplay[i] = displayBox(this.puzzleFieldGroup, 8, 5).setPosition(NEXTBLOCKS_X + 112 * i + BLOCK_SIZE / 2, PUSHBLOCKS_Y);
        }
        /* Prepare push blocks */
        var pushBlocks = [Sprite('block', BLOCK_SIZE, BLOCK_SIZE).addChildTo(this.dummyGroup), Sprite('block', BLOCK_SIZE, BLOCK_SIZE).addChildTo(this.dummyGroup)];
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
                nextBlocks[i][j] = Sprite('block', BLOCK_SIZE, BLOCK_SIZE).addChildTo(this.puzzleFieldGroup);
                nextBlocksAnimation[i][j] = FrameAnimation('block_ss').attachTo(nextBlocks[i][j]).gotoAndPlay('block_' + nextMap[i][j]);
                nextBlocks[i][j].moveTo(NEXTBLOCKS_X + 112 * i + BLOCK_SIZE * j, PUSHBLOCKS_Y);
            }
        }
        this.nextMap = nextMap;
        this.nextBlocks = nextBlocks;
        this.nextBlocksAnimation = nextBlocksAnimation;

        /* level status */
        this.level = 0;
        this.levelStatus = [
            {levelUp:   0, blocks:  6, ojamaRatio: 10, ojamaCount: 7},
            {levelUp:  30, blocks:  6, ojamaRatio:  8, ojamaCount: 6},
            {levelUp:  60, blocks:  7, ojamaRatio: 10, ojamaCount: 5},
            {levelUp:  90, blocks:  7, ojamaRatio:  8, ojamaCount: 5},
            {levelUp: 120, blocks:  8, ojamaRatio:  8, ojamaCount: 5},
            {levelUp: 150, blocks:  9, ojamaRatio:  8, ojamaCount: 5},
            {levelUp: 180, blocks: 10, ojamaRatio:  8, ojamaCount: 5},
        ];

        /* other status */
        this.pushUpCounter = 0; // 消さずに押し上げた回数のカウント
        this.pushUplimit = this.levelStatus[this.level].ojamaCount; // お邪魔ペナルティまでの猶予
        this.combo = 0; // コンボ
        this.comboFlag = false; // コンボ持続状態の管理(false時に消せなかった場合、コンボが途切れる)
        this.score = 0; // 現在のスコア
        this.addScore = 0; // ブロック消去により加算されるスコア
        this.goToTitle = false; // ゲームオーバーの時、タイトルに戻る操作が有効かどうか管理するフラグ
        this.timeCount = 0;
        this.timeCountFlag = false;
        this.totalEraseCount = 0; // トータルで消したブロックの個数

        /* score display flame */
        var scoreDisplayX = (NEXTBLOCKS_X + BLOCK_SIZE / 2) + (10 * 16 - 8 * 16) / 2;

        this.scoreDisplay     = displayBox(this.dummyGroup, 26, 10).setPosition(656, 120);
        this.levelDisplay     = displayBox(this.dummyGroup, 10,  8).setPosition(scoreDisplayX, 288);
        this.levelUpDisplay   = displayBox(this.dummyGroup,  5,  4).setPosition(scoreDisplayX + 104, 288 + 32);
        this.pushUpDisplay    = displayBox(this.dummyGroup, 10,  8).setPosition(scoreDisplayX, 432);
        this.maxPushUpDisplay = displayBox(this.dummyGroup,  5,  4).setPosition(scoreDisplayX + 104, 432 + 32);

        /* how to move block */
        /*
        var howto = Sprite('howto').addChildTo(this.dummyGroup);
        howto.moveTo(760, 400);
        */

        /* labels */
        // combo label
        this.comboLabel = Label({
            text: '',
            fontSize: 32,
            fill: 'yellow',
            fontFamily: "'Courier New'"
        }).addChildTo(this.dummyGroup);
        this.comboLabel.origin.set(1, 0.5);
        this.comboLabel.setPosition(SCORELABEL_RIGHT, 160);
        // score label
        this.scoreLabel = Label({
            text: 'SCORE ' + ( '00000000' + this.score ).slice(-8),
            fontSize: 32,
            fill: 'white',
            fontFamily: "'Courier New'"
        }).addChildTo(this.dummyGroup);
        this.scoreLabel.origin.set(1, 0.5);
        this.scoreLabel.setPosition(SCORELABEL_RIGHT, 120);
        // additional score label
        this.addScoreLabel = Label({
            text: '',
            fontSize: 32,
            fill: 'white',
            fontFamily: "'Courier New'"
        }).addChildTo(this.dummyGroup);
        this.addScoreLabel.origin.set(1, 0.5);
        this.addScoreLabel.setPosition(-255, -255);
        /*
        // howto label
        this.howToLabel = Label({
            text: '[A][D] = move\n   [S] = swap\n   [W] = push',
            align: 'left',
            fontSize: 24,
            fill: 'white',
            fontFamily: "'Courier New'"
        }).addChildTo(this.dummyGroup);
        this.howToLabel.origin.set(1, 0.5);
        this.howToLabel.setPosition(840, 360);
        */
        // level label
        this.levelTextLabel = Label({
            text: 'LEVEL',
            fontSize: 32,
            fill: 'lime',
            //stroke: 'orange',
            //strokeWidth: 8,
            fontFamily: "'Courier New'"
        }).addChildTo(this.dummyGroup);
        this.levelTextLabel.origin.set(0.5, 0.5);
        this.levelTextLabel.setPosition(scoreDisplayX, 288 - 26);
        this.levelLabel = Label({
            text: this.level,
            fontSize: 64,
            fill: 'lime',
            //stroke: 'white',
            //strokeWidth: 8,
            fontFamily: "'Courier New'"
        }).addChildTo(this.dummyGroup);
        this.levelLabel.origin.set(0.5, 0.5);
        this.levelLabel.setPosition(scoreDisplayX, 288 + 20);
        this.levelUpCountLabel = Label({
            text: ( '00' + (this.levelStatus[this.level + 1].levelUp - this.totalEraseCount) ).slice(-2),
            fontSize: 32,
            fill: 'lime',
            //stroke: 'lime',
            //strokeWidth: 4,
            fontFamily: "'Courier New'"
        }).addChildTo(this.dummyGroup);
        this.levelUpCountLabel.origin.set(0.5, 0.5);
        this.levelUpCountLabel.setPosition(scoreDisplayX + 104, 288 + 32 + 2);
        // pushUpCounter label
        this.limitTextLabel = Label({
            text: 'LIMIT',
            fontSize: 32,
            fill: 'gold',
            fontFamily: "'Courier New'"
        }).addChildTo(this.dummyGroup);
        this.limitTextLabel.origin.set(0.5, 0.5);
        this.limitTextLabel.setPosition(scoreDisplayX, 432 - 26);
        this.pushUpCounterLabel = Label({
            text: '' + this.pushUplimit,
            fontSize: 64,
            fill: 'gold',
            //stroke: 'white',
            //strokeWidth: 8,
            fontFamily: "'Courier New'"
        }).addChildTo(this.dummyGroup);
        this.pushUpCounterLabel.origin.set(0.5, 0.5);
        this.pushUpCounterLabel.setPosition(scoreDisplayX, 432 + 20);
        this.maxPushUpLabel = Label({
            text: '/' + this.pushUplimit,
            fontSize: 32,
            fill: 'gold',
            //stroke: 'tomato',
            //strokeWidth: 4,
            fontFamily: "'Courier New'"
        }).addChildTo(this.dummyGroup);
        this.maxPushUpLabel.origin.set(0.5, 0.5);
        this.maxPushUpLabel.setPosition(scoreDisplayX + 104, 432 + 32 + 2);

        // (debug) timecounter
        this.timeCountLabel = Label({
            text: '0',
            fontSize: 16,
            fill: 'white',
            fontFamily: "'Courier New'"
        }).addChildTo(this.dummyGroup);
        this.timeCountLabel.origin.set(0, 0);
        this.timeCountLabel.setPosition(10, 30);
        this.timeCountLabel.alpha = 0.0;


        // 初期配置
        for(let x = 0; x < FIELD_WIDTH; x++){
            this.fieldMap[x].fill(EMPTY_ID);
            this.fieldMap[x][FIELD_HEIGHT - 1] = this.blockOrder[x];
        }

        this.dummyGroup.tweener.to({y: 0}, 400, 'easeOutBack').play();
        this.fieldUpdate();
    },
    //---------------------------------------------------------------------------
    // ready -> go! アニメーション
    ready: function(){
        let readyGoLabel = Label({
            text: 'READY?',
            fontSize: 64,
            fill: 'white',
            stroke: 'blue',
            strokeWidth: 8,
            fontFamily: "'Courier New'"
        }).addChildTo(this.dummyGroup);
        readyGoLabel.origin.set(0.5, 0.5);
        readyGoLabel.setPosition(FIELD_X + FIELD_WIDTH * BLOCK_SIZE / 2 - BLOCK_SIZE / 2, 200);
        readyGoLabel.alpha = 0.0;
        readyGoLabel.tweener.to({alpha: 1.0}, 200)
                            .wait(1000)
                            .to({scaleX: 0.0}, 80, 'easeInCubic')
                            .set({text: ' GO! '})
                            .to({scaleX: 1.0}, 80, 'easeInCubic')
                            .wait(300)
                            .to({y: -100}, 300, 'easeInBack')
                            .call(() => {
                                this.timeCountFlag = true;
                                this.acceptKeyInput = true;
                                return;
                            })
                            .play();
    },
    //---------------------------------------------------------------------------
    // 押し上げる
    pushToField: function(){
        console.log('push to field');
        for(let y = 0; y < FIELD_HEIGHT; y++){
            if (y < FIELD_HEIGHT - 1){
                this.fieldMap[this.pushBlocksX    ][y] = this.fieldMap[this.pushBlocksX    ][y + 1];
                this.fieldMap[this.pushBlocksX + 1][y] = this.fieldMap[this.pushBlocksX + 1][y + 1];
            }
            this.fieldBlocks[this.pushBlocksX    ][y].tweener.wait(20).by({y:-BLOCK_SIZE}, 100, 'easeOutBack').play();
            this.fieldBlocks[this.pushBlocksX + 1][y].tweener.wait(20).by({y:-BLOCK_SIZE}, 100, 'easeOutBack').play();
        }
        this.fieldMap[this.pushBlocksX    ][FIELD_HEIGHT - 1] = this.pushMap[0];
        this.fieldMap[this.pushBlocksX + 1][FIELD_HEIGHT - 1] = this.pushMap[1];
        this.pushBlocks[0].tweener.moveBy(0, -BLOCK_SIZE - DISTANCE_FROM_FB_TO_PB, 150)
                                  .set({alpha: 0.0})
                                  .play();
        this.pushBlocks[1].tweener.moveBy(0, -BLOCK_SIZE - DISTANCE_FROM_FB_TO_PB, 150)
                                  .set({alpha: 0.0})
                                  .play();
        // お邪魔カウンターのインクリメントとアニメーション
        this.pushUpCounter++;
        this.pushUpCounterLabel.moveBy(0, -20);
        this.pushUpCounterLabel.tweener.by({y: 20}, 150, 'easeInCubic').play();
        this.pushUpCounterLabel.text = '' + (this.pushUplimit - this.pushUpCounter);
        // 一定時間待機後フィールド更新へ
        this.dummyGroup.tweener.wait(150).call(() => {this.fieldUpdate()}).play();
    },
    //---------------------------------------------------------------------------
    // お邪魔を1列生成して押し上げ
    pushOjamaToField: function(){
        SoundManager.setVolume(0.4);
        SoundManager.play('ojama');
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
        // お邪魔カウンターのアニメーション
        this.pushUpCounterLabel.tweener.set({rotation: 0}).to({rotation: 360}, 300, 'easeOutCubic').play();
        this.pushUpCounterLabel.text = '' + (this.pushUplimit - this.pushUpCounter);
        // 一定時間待機後フィールド更新へ
        this.dummyGroup.tweener.wait(200).call(() => {this.fieldUpdate()}).play();
    },
    //---------------------------------------------------------------------------
    // 消えるブロックを探す
    checkErase: function(){
        var matchFlag = 0;
        var isMatch = new Array(4); // [left, up, right, down]
        var setErase = new Array(FIELD_WIDTH);
        var direction = [-1, 0, 1, 0];
        var comboBairitsu = 0; // コンボボーナスの倍率
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
                // add total erase count
                this.totalEraseCount += ((this.fieldMap[x][y] != OJAMA_ID) && setErase[x][y]);
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
        comboBairitsu = 0;
        for (let i = 1; i <= (this.combo > 4 ? 4 : this.combo); i++){
            comboBairitsu += i;
        }
        this.addScore *= comboBairitsu;
        this.addScoreLabel.text += comboBairitsu;
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
    //---------------------------------------------------------------------------
    // 消去・ブロック落下
    erase: function(){
        this.pushUpCounter = 0;
        this.comboFlag = true;
        var fall;
        var animateTime_1 = 300, animateTime_2 = 500, animateTime_3 = 300;
        SoundManager.setVolume(1.0);
        SoundManager.play('erase');
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
                                                      .play();
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
        this.addScoreLabel.moveTo(SCORELABEL_RIGHT, 100);
        this.addScoreLabel.tweener.set({alpha: 0.0})
                                  .by({y: -16, alpha: 1.0}, 100)
                                  .wait(animateTime_1 + animateTime_2)
                                  .by({y: -16, alpha: -1.0}, 100)
                                  .play();
        // update score
        this.scoreLabel.text = 'SCORE ' + ( '00000000' + this.score ).slice(-8);
        // update pushUpCounter display
        this.pushUpCounterLabel.text = '' + (this.pushUplimit - this.pushUpCounter);
        this.pushUpCounterLabel.tweener.to({scaleX: 0.8, scaleY: 0.8}, 100)
                                       .to({scaleX: 1.0, scaleY: 1.0}, 100)
                                       .play();
        // totalEraseCount が一定値を超えたとき　レベルアップ
        if (this.level < LEVEL_MAX){
            if (this.totalEraseCount >= this.levelStatus[this.level + 1].levelUp){
                this.level++;
                this.levelLabel.text = (this.level != LEVEL_MAX) ? '' + this.level : 'MAX';
                this.levelLabel.tweener.set({rotation: 0})
                                       .to({scaleX: 1.5, scaleY: 1.5, rotation: 180}, 100)
                                       .to({scaleX: 1.0, scaleY: 1.0, rotation: 360}, 100)
                                       .play();
                // レベルアップまでに必要なブロック数の情報を更新
                if (this.level != LEVEL_MAX){
                    this.levelUpCountLabel.text = ( '00' + (this.levelStatus[this.level + 1].levelUp - this.totalEraseCount) ).slice(-2);
                }
                else{
                    this.levelUpCountLabel.text = '00';
                }
                // 押し上げ限界値に変更があった場合アニメーションしつつ更新
                if (this.pushUplimit != this.levelStatus[this.level].ojamaCount){
                    this.pushUplimit = this.levelStatus[this.level].ojamaCount;
                    this.maxPushUpLabel.text = '/' + this.pushUplimit;

                    this.pushUpCounterLabel.text = '' + (this.pushUplimit - this.pushUpCounter);
                    this.maxPushUpLabel.tweener.to({scaleX: 1.5, scaleY: 1.5}, 100)
                                               .to({scaleX: 1.0, scaleY: 1.0}, 100)
                                               .play();
                }
            }
            else if (this.level === LEVEL_MAX){
                this.levelUpCountLabel.text = '00';
            }
            else{
                // レベルアップまでに必要なブロック数の情報を更新
                this.levelUpCountLabel.text = ( '00' + (this.levelStatus[this.level + 1].levelUp - this.totalEraseCount) ).slice(-2);
            }
        }
        // wait -> goto fieldUpdate
        this.dummyGroup.tweener.wait(animateTime_1 + animateTime_2 + animateTime_3 + 100)
                               .call(() => {this.fieldUpdate(0);})
                               .play();
    },
    //---------------------------------------------------------------------------
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
    //---------------------------------------------------------------------------
    // ゲームオーバー判定
    isGameOver: function(){
        console.log('game over?');
        var gameOver = false;
        for(let i = 0; i < FIELD_WIDTH; i++){
            gameOver |= (this.fieldMap[i][0] != EMPTY_ID);
        }
        if(gameOver){
            this.timeCountFlag = false;
            let gameOverLabel = Label({
                text: 'GAME OVER',
                fontSize: 48,
                fill: 'white',
                stroke: 'tomato',
                strokeWidth: 4,
                fontFamily: "'Courier New'"
            }).addChildTo(this.dummyGroup).setPosition(FIELD_X + BLOCK_SIZE * FIELD_WIDTH / 2 - BLOCK_SIZE / 2, FIELD_Y + BLOCK_SIZE * FIELD_HEIGHT / 2);
            let pressSpaceKeyLabel = Label({
                text: 'Press space key',
                fontSize: 24,
                fill: 'white',
                fontFamily: "'Courier New'"
            }).addChildTo(this.dummyGroup).setPosition(FIELD_X + BLOCK_SIZE * FIELD_WIDTH / 2 - BLOCK_SIZE / 2, FIELD_Y + BLOCK_SIZE * FIELD_HEIGHT / 2 + 64);
            SoundManager.setVolume(1.0);
            SoundManager.play('gameOver');
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
                                             this.puzzleFieldGroup.remove();
                                             this.goToTitle = true;
                                         })
                                         .play();
            return;
        }
        else{
            this.comboFlag = false;
            if(this.pushUpCounter >= this.pushUplimit){
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
                    this.nextMap[VISIBLE_NEXT - 1][j] = this.blockOrder[Random.randint(0, this.levelStatus[this.level].blocks - 1)]; // new block
                    if(!Random.randint(0, this.levelStatus[this.level].ojamaRatio)) this.nextMap[VISIBLE_NEXT - 1][j] = OJAMA_ID;
                    this.nextBlocksAnimation[VISIBLE_NEXT - 1][j].gotoAndPlay('block_' + this.nextMap[VISIBLE_NEXT - 1][j]);
                }
                // if first update: goto ready animation
                if (this.firstFieldUpdate){
                    this.firstFieldUpdate = false;
                    this.ready();
                }
                else{
                    this.acceptKeyInput = true;
                    return;
                }
            }
        }
    },
    //---------------------------------------------------------------------------
    // 毎フレーム呼び出し
    update: function(app){
        var key = app.keyboard;
        var tmp;
        if (this.timeCountFlag){
            this.timeCount += app.deltaTime;
        }
        this.timeCountLabel.text = 'time[s]:' + this.timeCount / 1000;
        if(this.acceptKeyInput === true){
            // push
            if(key.getKeyDown('W')){
                SoundManager.setVolume(0.3);
                SoundManager.play('push');
                this.acceptKeyInput = false;
                this.pushToField();
            }
            // move to left
            if(key.getKeyDown('A') && this.pushBlocksX > 0){
                SoundManager.setVolume(0.3);
                SoundManager.play('moveAndSwap');
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
                SoundManager.setVolume(0.3);
                SoundManager.play('moveAndSwap');
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
                SoundManager.setVolume(0.3);
                SoundManager.play('moveAndSwap');
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
            // if(key.getKeyDown('space')) this.exit();
        }
        if(this.goToTitle){
            if (key.getKeyDown('space')){
                this.dummyGroup.tweener.by({y: -SCREEN_HEIGHT}, 400, 'easeInBack')
                                       .call(() =>{
                                           this.dummyGroup.remove();
                                           this.exit();
                                       })
                                       .play();
            }
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
        scenes: MYSCENES,
        fps: 50
    });
    //app.enableStats();
    app.run();
})
