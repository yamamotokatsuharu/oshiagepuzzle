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
const OJAMA_ID = 10;

const FIELD_X = 120;
const FIELD_Y = 48;
const FIELD_WIDTH = 6;
const FIELD_HEIGHT = 10;


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
        /* Prepare puzzle field */
        var fieldMap = new Array(FIELD_WIDTH);  // puzzle field map
        var fieldBlocks = new Array(FIELD_WIDTH);   //sprites of blocks on field
        var fieldBlocksAnimation = new Array(FIELD_WIDTH);  // animations of bloks on field
        for(let i = 0; i < FIELD_WIDTH; i++){
            fieldMap[i] = new Array(FIELD_HEIGHT);
            fieldBlocks[i] = new Array(FIELD_HEIGHT);
            fieldBlocksAnimation[i] = new Array(FIELD_HEIGHT);
        }
        for(let i = 0; i < FIELD_WIDTH; i++){
            for(let j = 0; j < FIELD_HEIGHT; j++){
                fieldMap[i][j] = Random.randint(0, 4);
                if(fieldMap[i][j] > 6) fieldMap[i][j] = OJAMA_ID;
                fieldBlocks[i][j] =  Sprite('block', 48, 48).addChildTo(this);
                fieldBlocksAnimation[i][j] = FrameAnimation('block_ss').attachTo(fieldBlocks[i][j]);
                fieldBlocksAnimation[i][j].gotoAndPlay('block_' + fieldMap[i][j]);
                fieldBlocks[i][j].x = FIELD_X + 48 * i;
                fieldBlocks[i][j].y = FIELD_Y + 48 * j;
            }
        }
        this.fieldMap = fieldMap;
        this.fieldBlocks = fieldBlocks;
        this.fieldBlocksAnimation = fieldBlocksAnimation;
        var self = this;
        self.checkErase();
    },
    push: function(){

    },
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
                if(this.fieldMap[x][y] == -1 || this.fieldMap[x][y] == OJAMA_ID) continue;
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
            return;
        }
    },
    erase: function(){
        var fall;
        // 各スプライトの移動を制御
        for(let x = 0; x < FIELD_WIDTH; x++){
            for(let y = 0; y < FIELD_HEIGHT; y++){
                // 消去アニメーション
                if(this.setErase[x][y]){
                    if(this.fieldMap[x][y] != OJAMA_ID){ // not Ojama
                        this.fieldBlocks[x][y].tweener.to({rotation: 360, scaleX: 0, scaleY: 0}, 2000)
                                                      .call(() => {this.fieldBlocks[x][y].alpha = 0;})
                                                      .play();
                    }
                    else{ // Ojama
                        this.fieldBlocks[x][y].tweener.to({alpha: 0}, 2000)
                                                      .play();
                    }
                }
                // 落下アニメーション
                else{
                    fall = 0;
                    for(let i = y; i < FIELD_HEIGHT; i++){
                        fall += this.setErase[x][i];
                    }
                    this.fieldBlocks[x][y].tweener.wait(2000)
                                                  .moveBy(0, 48 * fall, 300, 'easeInCubic')
                                                  .play();
                }
            }
        }
        // wait 1000ms -> goto fieldUpdate
        this.dummyGroup.tweener.wait(4000)
                               .call(() => {this.fieldUpdate();})
                               .play();
    },
    // 盤面更新
    fieldUpdate: function(){
        console.log('Start Updating...');
        for(let x = 0; x < FIELD_WIDTH; x++){
            for(let y = 0; y < FIELD_HEIGHT; y++){
                if(this.setErase[x][y]){
                    for(let i = y; i > 0; i--){
                        this.fieldMap[x][i] = this.fieldMap[x][i - 1];
                        //this.fieldBlocks[x][i] = this.fieldBlocks[x][i - 1];
                        //this.fieldBlocksAnimation[x][i] = this.fieldBlocksAnimation[x][i - 1];
                    }
                    this.fieldMap[x][0] = -1;
                    //this.fieldBlocks[x][0].alpha = 0;
                }
            }
        }
        console.log(this.fieldMap);
        for(let x = 0; x < FIELD_WIDTH; x++){
            for(let y = 0; y < FIELD_HEIGHT; y++){
                this.fieldBlocks[x][y].x = FIELD_X + 48 * x;
                this.fieldBlocks[x][y].y = FIELD_Y + 48 * y;
                this.fieldBlocks[x][y].alpha = 1;
                this.fieldBlocks[x][y].setScale(1.0, 1.0).setRotation(0);
                if(this.fieldMap[x][y] != -1){
                    this.fieldBlocksAnimation[x][y].gotoAndPlay('block_' + this.fieldMap[x][y]);
                }
                else{
                    this.fieldBlocks[x][y].alpha = 0;
                }
            }
        }
        this.checkErase();
    },
    isGameOver: function(){

    },
    update: function(app){
        var key = app.keyboard;
        if (key.getKeyDown('space')) this.exit();
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
