// phina.jsをグローバル領域に展開

phina.globalize();

const SCREEN_WIDTH = 600;
const SCREEN_HEIGHT = 480;

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
        'block': 'img/puzzleblock.png',
        'ojama': 'img/ojama.png',
    },
    spritesheet:{
        'block_ss': 'block_ss.json',
        'ojama.ss': 'ojama_ss.json',
    },
};

phina.define('Title', {
    superClass: 'DisplayScene',
    init: function(){
        this.superInit();
        this.backgroundColor = 'yellow';
    },
    update: function(app){
        var key = app.keyboard;
        if (key.getKey('M')) this.exit();
    }
});


phina.define('Main', {
    superClass: 'DisplayScene',
    init: function(){
        this.superInit();
        this.backgroundColor = 'green';
    },
    update: function(app){
        var key = app.keyboard;
        if (key.getKey('R')) this.exit();
    }
});

phina.define('Result', {
    superClass: 'DisplayScene',
    init: function(){
        this.superInit();
        this.backgroundColor = 'blue';
    },
    update: function(app){
        var key = app.keyboard;
        if (key.getKey('T')) this.exit();
    }
});






phina.main(function(){
    var app = GameApp({
        startLabel: 'title',
        assets: ASSETS,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        fit: false,
        scenes: MYSCENES
    });
    app.run();
})
