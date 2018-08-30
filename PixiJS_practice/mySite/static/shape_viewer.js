//Aliases
var Application = PIXI.Application,
    loader = PIXI.loader,
    resources = PIXI.loader.resources,
    Graphics = PIXI.Graphics,
    Sprite = PIXI.Sprite,
    Container = PIXI.Container;

var HUNDRED_THOUSAND = 100000;
var mousePosition;

var content = document.getElementById('content');
var images = document.getElementById("images");
var imageLayers = [];
var isFirst = true;

//Create a Pixi Application
var app = new Application({
    width: content.offsetWidth,
    height: content.offsetHeight - 90,         
    antialias: true,
    transparent: true,
    resolution: 1,
});
content.appendChild(app.view);

var shapes = new Container();
shapes.x += app.view.width / 2;
shapes.y += app.view.height / 2;
shapes.vx = 0;
shapes.vy = 0;
app.stage.addChild(shapes);
app.ticker.add(delta => gameLoop(delta));

// for mousemove
var virtualSquare = new Graphics()
    .beginFill(0xffcccc)
    .moveTo(0, 0)
    .lineTo(30, 0)
    .lineTo(30, 30)
    .lineTo(0, 30)
    .moveTo(0, 0)
    .lineTo(30, 0)
    .lineTo(30, 30)
    .lineTo(0, 30)
    .addHole()

virtualSquare.interactive = true;
shapes.addChild(virtualSquare);


prompt = document.getElementById("prompt");
if (window.File && window.FileReader && window.FileList && window.Blob) {
    prompt.innerHTML = "Drop files here";
}
else {
    prompt.innerHTML = "The File APIs are not fully supported in this browser.";
}




/*Event Handler*/
/*-----------------------------------------------------------------------------------*/
content.ondragover = function(event) {
    event.stopPropagation();
    event.preventDefault();
};


content.ondragend = function(event) {
    alert("on drag end");

    event.stopPropagation();
    event.preventDefault();
};


content.ondrop = function(event) {
    event.stopPropagation();
    event.preventDefault();

    var reader = new FileReader();

    for(var i = 0; i < event.dataTransfer.files.length; i++){
        var file = event.dataTransfer.files[i];
        reader.filename = file.name;
        reader.readAsText(file);
    }

    reader.onload = function(event) {
        if (draw(event.target)){
            addNewImageLayer(event.target.filename);
        }
    };
};


virtualSquare.mousemove = function(event){
    mousePosition = event.data.getLocalPosition(shapes);
};


document.onwheel = function(event){
    scale_change = 0.5;

    if(mousePosition != undefined){
        if(event.deltaY < 0){
            shapes.scale.x += scale_change;
            shapes.scale.y += scale_change;

            shapes.x -= scale_change * mousePosition.x;
            shapes.y -= scale_change * mousePosition.y;
        }
        else if (shapes.scale.x > 1){
            shapes.scale.x -= scale_change;
            shapes.scale.y -= scale_change;

            shapes.x += scale_change * mousePosition.x;
            shapes.y += scale_change * mousePosition.y;
        }
    }

    event.stopPropagation();
    event.preventDefault();
};


document.onkeydown = function(evt) {
    var speed = 3;

    switch(evt.keyCode){
        case 37:
            shapes.vx = speed;
            shapes.vy = 0;
            break;
        case 38:
            shapes.vx = 0;
            shapes.vy = speed;
            break;
        case 39:
            shapes.vx = -speed;
            shapes.vy = 0;
            break;
        case 40:
            shapes.vx = 0;
            shapes.vy = -speed;
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


/*Function*/
/*-----------------------------------------------------------------------------------*/
function gameLoop(delta){
    shapes.x += shapes.vx;
    shapes.y += shapes.vy;
}


function draw(file) {
    var attributes = file.result.split("\n");
    if (attributes.length < 5){
        alert("Invalid file format!");
        return false;
    }

    var shapeType = attributes[1].replace("shapeType=", "").trim();
    var graphic;

    switch(shapeType){
        case "Line":
            graphic = drawLine(attributes);
            imageLayers.push({"name": file.filename, "graphic": graphic});
            break;
        case "Arc":
            graphic = drawArc(attributes);
            imageLayers.push({"name": file.filename, "graphic": graphic});
            break;
        case "Rect":
            graphic = drawRectangle(attributes);
            imageLayers.push({"name": file.filename, "graphic": graphic});
            break;
        case "Circle":
            graphic = drawCircle(attributes);
            imageLayers.push({"name": file.filename, "graphic": graphic});
            break;
        case "Contour":
            graphic = drawContour(attributes);
            imageLayers.push({"name": file.filename, "graphic": graphic});
            break;
        default:
            alert("Invalid shapeType!");
            return false;
    }
    
    return true;
}


function drawLine(attributes) {
    var args = attributes[4].split(", ");
    for(var i = 0; i < args.length; i++){
        args[i] = parseInt(args[i]) / HUNDRED_THOUSAND;
    }

    var line = new Graphics()
        .lineStyle(lineWidth=args[4] * 2, color=0xff3333)
        .moveTo(args[0], -args[1])
        .lineTo(args[2], -args[3])
        .lineStyle(lineWidth=0)
        .beginFill(0xff3333)
        .drawCircle(args[0], -args[1], args[4])
        .drawCircle(args[2], -args[3], args[4])
        .endFill();

    if(isFirst){
        isFirst = false;

        shapes.x -= args[0];
        shapes.y += args[1];
    }

    shapes.addChild(line);

    return line;
}


function drawArc(attributes) {
    var args = attributes[4].split(", ");
    for(var i = 0; i < args.length - 1; i++){
        args[i] = parseInt(args[i]) / HUNDRED_THOUSAND;
    }

    var antiClockwise = false;
    if (args[7].trim() == "scCCW"){
        antiClockwise = true;
    }

    var radius = Math.sqrt((args[0] - args[4])**2 + (args[1] - args[5])**2);
    var startAngle = -Math.atan((args[1] - args[5]) / (args[0] - args[4]));
    var endAngle = -Math.atan((args[3] - args[5]) / (args[2] - args[4]));

    // 因為 Math.atan() 只會回傳 PI/2 ~ -PI/2 的值，因此要針對不同象限的點做調整
    if (args[0] < args[4]){
        startAngle += Math.PI;
    }

    if (args[2] < args[4]){
        endAngle += Math.PI;
    }

    var arc = new Graphics()
        .lineStyle(lineWidth=args[6] * 2, color=0xff3333)
        .moveTo(args[0], -args[1])
        .arc(args[4], -args[5], radius, startAngle, endAngle, antiClockwise)
        .lineStyle(lineWidth=0)
        .beginFill(0xff3333)
        .drawCircle(args[0], -args[1], args[6])
        .drawCircle(args[2], -args[3], args[6])
        .endFill();

    if (isFirst){
        isFirst = false;

        shapes.x -= args[0];
        shapes.y += args[1];
    }

    shapes.addChild(arc);

    return arc;
}


function drawRectangle(attributes) {
    var args = attributes[4].split(", ");
    for(var i = 0; i < args.length; i++){
        args[i] = parseInt(args[i]) / HUNDRED_THOUSAND;
    }

    var rectangle = new Graphics()
        .beginFill(0xff3333)
        .drawRect(args[0], -args[1], args[2], args[3])
        .endFill();

    if(isFirst){
        isFirst = false;

        shapes.x -= args[0];
        shapes.y += args[1];
    }

    shapes.addChild(rectangle);

    return rectangle;
}


function drawCircle(attributes) {
    var args = attributes[4].split(", ");
    for(var i = 0; i < args.length; i++){
        args[i] = parseInt(args[i]) / HUNDRED_THOUSAND;
    }

    var circle = new Graphics()
        .beginFill(0xff3333)
        .drawCircle(args[0], -args[1], args[2])
        .endFill();

    if(isFirst){
        isFirst = false;

        shapes.x -= args[0];
        shapes.y += args[1];
    }

    shapes.addChild(circle);

    return circle;
}


function drawContour(attributes) {
    var args = [];
    var numberOfHoles;
    var currentLine;

    for(var i = 4; i < attributes.length; i++){
        var tempArg = attributes[i].split(", ");

        if (tempArg.length == 2){
            var point = [
                parseInt(tempArg[0]) / HUNDRED_THOUSAND,
                -(parseInt(tempArg[1]) / HUNDRED_THOUSAND)];
            args.push(point);
        }
        else{
            var count = parseInt(tempArg[0]);
            args.push(count);
        }
    }
    
    numberOfHoles = args[0] - 1;
    currentLine = 2;

    var polygon = new Graphics()
        .beginFill(0xff3333)
        .moveTo(args[currentLine][0], args[currentLine][1]);

    if(isFirst){
        isFirst = false;

        shapes.x -= args[currentLine][0];
        shapes.y -= args[currentLine][1];
    }
    currentLine++

    for(var i = 1; i < args[1]; i++, currentLine++){
        polygon.lineTo(args[currentLine][0], args[currentLine][1]);
    }

    for(var i = 0; i < numberOfHoles; i++){
        var pointCount = args[currentLine++];

        polygon.moveTo(args[currentLine][0], args[currentLine][1]);
        currentLine++;

        for(var j = 1; j < pointCount; currentLine++, j++){
            polygon.lineTo(args[currentLine][0], args[currentLine][1]);
        }
        polygon.addHole();
    }

    polygon.endFill();
    shapes.addChild(polygon);

    return polygon;
}


function addNewImageLayer(filename) {
    var inputRow = document.getElementById("imageLayerTemplate");
    var cloneInputRow = inputRow.cloneNode(true);

    cloneInputRow.style.display = "table";
    cloneInputRow.childNodes[1].innerHTML = filename;
    images.insertBefore(cloneInputRow, images.LastChild);
}


function deleteImageLayer(spanElement) {
    var filename = spanElement.parentElement.childNodes[1].innerHTML;

    for(var i = 0; i < imageLayers.length; i++){
        if (imageLayers[i].name == filename){
            shapes.removeChild(imageLayers[i].graphic);
            imageLayers.splice(i, 1);

            break;
        }
    }

    images.removeChild(spanElement.parentElement);
}
