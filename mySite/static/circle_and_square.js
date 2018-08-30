//Aliases
let Application = PIXI.Application,
    loader = PIXI.loader,
    resources = PIXI.loader.resources,
    Graphics = PIXI.Graphics,
    Sprite = PIXI.Sprite,
    Container = PIXI.Container;

//Create a Pixi Application
let app = new Application({
    width: 500,
    height: 500,                       
    antialias: true,
    transparent: false,
    resolution: 1
});

//Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);

let shapes = new Container();
shapes.vx = 0;
shapes.vy = 0;

app.stage.addChild(shapes);
app.ticker.add(delta => gameLoop(delta));

let rectangle = new Graphics();
    rectangle.lineStyle(4, 0xFF3300, 1);
    rectangle.beginFill(0x66CCFF);
    rectangle.drawRect(0, 0, 64, 64);
    rectangle.endFill();
    rectangle.x = 170;
    rectangle.y = 170;
    shapes.addChild(rectangle);

let circle = new Graphics();
    circle.beginFill(0x9966FF);
    circle.drawCircle(0, 0, 32);
    circle.endFill();
    circle.x = 64;
    circle.y = 130;
    shapes.addChild(circle);

document.onkeydown = function(evt) {
    switch(evt.keyCode){
        case 37:
            shapes.vx = 2;
            shapes.vy = 0;
            break;
        case 38:
            shapes.vx = 0;
            shapes.vy = 2;
            break;
        case 39:
            shapes.vx = -2;
            shapes.vy = 0;
            break;
        case 40:
            shapes.vx = 0;
            shapes.vy = -2;
            break;
    }
};

document.onkeyup = function(evt) {
    if ((evt.keyCode == 37)
     || (evt.keyCode == 38)
     || (evt.keyCode == 39)
     || (evt.keyCode == 40)){
        shapes.vx = 0;
        shapes.vy = 0;
    }
};

function gameLoop(delta){
    shapes.x += shapes.vx;
    shapes.y += shapes.vy;
}
