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
    }
);

//Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);

let cat;
let mouse_position;

//load an image and run the `setup` function when it's done
loader
    .add("/static/images/cat.png")
    .load(setup);


//This `setup` function will run when the image has loaded
function setup() {
    //Create the cat sprite
    cat = new Sprite(resources["/static/images/cat.png"].texture);
    cat.interactive = true;
    cat.x = 100;
    cat.y = 100;
    cat.vx = 0;
    cat.vy = 0;

    cat.mousemove = function(evt){
        mouse_position = evt.data.getLocalPosition(cat);
    }

    app.stage.addChild(cat);
    app.ticker.add(delta => gameLoop(delta));
}

document.onwheel = function(evt){
    scale_change = 0.1;

    if(evt.deltaY > 0){
        cat.scale.x -= scale_change;
        cat.scale.y -= scale_change;

        cat.x += scale_change * mouse_position.x;
        cat.y += scale_change * mouse_position.y;
    }
    else{
        cat.scale.x += scale_change;
        cat.scale.y += scale_change;

        cat.x -= scale_change * mouse_position.x;
        cat.y -= scale_change * mouse_position.y;
    }
};

document.onkeydown = function(evt) {
    switch(evt.keyCode){
        case 37:
            cat.vx = 2;
            cat.vy = 0;
            break;
        case 38:
            cat.vx = 0;
            cat.vy = 2;
            break;
        case 39:
            cat.vx = -2;
            cat.vy = 0;
            break;
        case 40:
            cat.vx = 0;
            cat.vy = -2;
            break;
    }
};

document.onkeyup = function(evt) {
    if ((evt.keyCode == 37)
     || (evt.keyCode == 38)
     || (evt.keyCode == 39)
     || (evt.keyCode == 40)){
        cat.vx = 0;
        cat.vy = 0;
    }
};

function gameLoop(delta){
    cat.x += cat.vx;
    cat.y += cat.vy;
}
