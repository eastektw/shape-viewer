//Aliases
let Application = PIXI.Application,
    loader = PIXI.loader,
    resources = PIXI.loader.resources,
    Graphics = PIXI.Graphics,
    Sprite = PIXI.Sprite,
    Container = PIXI.Container;

//Create a Pixi Application
let app = new Application({
    width: 600,
    height: 600,                       
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

let polygon = new Graphics()
    .beginFill("0x66b3ff")
    .moveTo(983.06808, -714.03999)
    .lineTo(981.07742, -768.45133)
    .lineTo(951.21754, -802.29253)
    .lineTo(924.67542, -873.95624)
    .lineTo(837.74999, -877.93756)
    .lineTo(818.50696, -811.58227)
    .lineTo(843.05841, -767.78777)
    .lineTo(835.09578, -717.35775)
    .lineTo(819.17051, -706.74090)
    .lineTo(833.10512, -666.26418)
    .lineTo(877.56317, -640.38561)
    .moveTo(911.40437, -779.06817)
    .lineTo(911.40437, -800.30187)
    .lineTo(941.26425, -800.30187)
    .lineTo(941.26425, -779.06817)
    .addHole()
    .moveTo(869.60053, -739.25500)
    .lineTo(886.18935, -737.92789)
    .lineTo(894.15199, -749.20829)
    .lineTo(901.45107, -738.59145)
    .lineTo(896.14265, -718.02130)
    .lineTo(870.92764, -710.05867)
    .addHole();

polygon.endFill();
polygon.scale.set(0.4, 0.4)

//The polygon's x/y position is anchored to its first point in the path
polygon.x = -90;
polygon.y = 500;
polygon.interactive = true;

let mouse_position;
polygon.mousemove = function(evt){
    mouse_position = evt.data.getLocalPosition(shapes);
}

shapes.addChild(polygon);

function gameLoop(delta){
    shapes.x += shapes.vx;
    shapes.y += shapes.vy;
}

document.onwheel = function(evt){
    scale_change = 0.1;

    if(evt.deltaY > 0){
        shapes.scale.x -= scale_change;
        shapes.scale.y -= scale_change;

        shapes.x += scale_change * mouse_position.x;
        shapes.y += scale_change * mouse_position.y;
    }
    else{
        shapes.scale.x += scale_change;
        shapes.scale.y += scale_change;

        shapes.x -= scale_change * mouse_position.x;
        shapes.y -= scale_change * mouse_position.y;
    }
};

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
