//Aliases
var Application = PIXI.Application;
var Container = PIXI.Container;
var Graphics = PIXI.Graphics;
var Text = PIXI.Text;
var Circle = PIXI.Circle;
var Rectangle = PIXI.Rectangle;
var Polygon = PIXI.Polygon;

const HUNDRED_THOUSAND = 100000;
const THOUSANDTH = 0.001;
const LINE_WIDTH = 1.5;
const COLORS = [
    0xeb5757,
    0xc13f36,
    0xffb366,
    0xe07838,
    0x71da71,
    0x3c8745,
    0x2d9cdb,
    0x5d5dd5,
    0xbf80ff,
    0x808284];

var content = document.getElementById("content");
var imageStates = document.getElementById("imageStates");
var functionMenu = document.getElementById("functionMenu");
var prompt = document.getElementById("prompt");

var mousePosition;
var mode = "default";
var mouseDown = false;
var zooming = false;
var isClickOnShape = false;
var drawCount = 0;
var color;
var chosenShape;

var imageLayers = [];

//Create a Pixi Application
var app = new Application({
    width: content.offsetWidth,
    height: content.offsetHeight - 90,
    antialias: true,
    transparent: true,
    resolution: 1});

content.appendChild(app.view);

var images = new Container();
images.vX = 0;
images.vY = 0;
images.interactive = true;

app.stage.addChild(images);
app.ticker.add(imagesMove);

var shapes = new Container();
shapes.isEmpty = function() {
    return shapes.children.length <= 0;
};
images.addChild(shapes);

var points = new Container();
images.addChild(points);

//for "zoom" mode and mousePosition
var selectionRect = new Graphics();
selectionRect.interactive = true;
images.addChild(selectionRect);

if (window.File && window.FileReader && window.FileList && window.Blob) {
    prompt.innerHTML = "Drop file here";
}
else {
    prompt.innerHTML =
        "The File APIs are not fully supported in this browser.";
}


/*Event Handler*/
/*--------------------------------------------------------------------------*/
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

    for(var i = 0; i < event.dataTransfer.files.length; i++) {
        var file = event.dataTransfer.files[i];
        reader.filename = file.name;
        reader.readAsText(file);
    }

    reader.onload = function(event) {
        var file = event.target;

        if (file.isValid()) {
            addImageLayer(file);
        }
        else{
            alert("Invalid file format!");
        }
    };

    reader.isValid = function() {
        const SHAPES = ["Line", "Arc", "Rect", "Circle", "Contour"];
        var fileContent = this.result;

        var attributes = fileContent.split("\n");
        if (attributes.length < 5) {
            return false;
        }

        var shapeType = attributes[1].replace("shapeType=", "").trim();

        for(var i = 0; i < SHAPES.length; i++) {
            if (shapeType == SHAPES[i]) {
                return true;
            }
        }

        return false;
    };
};


content.onmousedown = function() {
    if (mode == "zoom") {
        mouseDown = true;
        selectionRect.startX = mousePosition.x;
        selectionRect.startY = mousePosition.y;
    }
};


content.onmouseout = function() {
    mouseDown = false;
};


content.onwheel = function(event) {
    var scaleChange;

    if (images.scale.x <= 1) {
        scaleChange = 0.1;
    }
    else{
        scaleChange = 0.5;
    }

    if (mousePosition != undefined) {
        if (event.deltaY < 0) {
            images.scale.x += scaleChange;
            images.scale.y += scaleChange;

            images.x -= scaleChange * mousePosition.x;
            images.y -= scaleChange * mousePosition.y;
        }
        else if (images.scale.x > 0.3) {
            images.scale.x -= scaleChange;
            images.scale.y -= scaleChange;

            images.x += scaleChange * mousePosition.x;
            images.y += scaleChange * mousePosition.y;
        }
    }

    event.stopPropagation();
    event.preventDefault();
};


selectionRect.mousemove = function(event) {
    mousePosition = event.data.getLocalPosition(images);

    if (mode == "zoom" && mouseDown) {
        zooming = true;
        selectionRect.endX = mousePosition.x;
        selectionRect.endY = mousePosition.y;

        selectionRect.centerX = (selectionRect.startX + selectionRect.endX) / 2;
        selectionRect.centerY = (selectionRect.startY + selectionRect.endY) / 2;

        selectionRect
            .clear()
            .lineStyle(lineWidth=1, color=0x000000)
            .moveTo(selectionRect.startX, selectionRect.startY)
            .lineTo(selectionRect.startX, selectionRect.endY)
            .lineTo(selectionRect.endX, selectionRect.endY)
            .lineTo(selectionRect.endX, selectionRect.startY)
            .lineTo(selectionRect.startX, selectionRect.startY)
            .beginFill(0x000000)
            .drawCircle(selectionRect.centerX, selectionRect.centerY, 2)
            .endFill();
    }
};


document.onkeydown = function(event) {
    var speed = 3;

    switch(event.keyCode) {
        case 37:
            images.vX = speed;
            images.vY = 0;
            break;
        case 38:
            images.vX = 0;
            images.vY = speed;
            break;
        case 39:
            images.vX = -speed;
            images.vY = 0;
            break;
        case 40:
            images.vX = 0;
            images.vY = -speed;
            break;
    }
};


document.onkeyup = function(event) {
    if ((event.keyCode == 37)
     || (event.keyCode == 38)
     || (event.keyCode == 39)
     || (event.keyCode == 40)) {
        images.vX = 0;
        images.vY = 0;
    }
};


document.onmouseup = function() {
    mouseDown = false;

    if (mode == "zoom" && zooming) {
        var newScale;
        var widthScale;
        var heightScale;

        zooming = false;

        widthScale =
            app.view.width / Math.abs(selectionRect.endX - selectionRect.startX);
        heightScale =
            app.view.height / Math.abs(selectionRect.endY - selectionRect.startY);

        newScale = widthScale > heightScale? heightScale: widthScale;

        images.scale.x = newScale;
        images.scale.y = newScale;

        setCenter(selectionRect.centerX, selectionRect.centerY);

        selectionRect.clear();
    }

    if (!isClickOnShape) {
        selectionRect.clear();
        chosenShape = undefined;
    }
};


document.onmousedown = function() {
    isClickOnShape = false;
};


/*Function*/
/*--------------------------------------------------------------------------*/
function imagesMove() {
    images.x += images.vX;
    images.y += images.vY;
}


function addImageLayer(file) {
    var newImageLayer = draw(file.result);
    newImageLayer.filename = file.filename;
    imageLayers.push(newImageLayer);

    var inputRow = document.getElementById("imageLayerTemplate");
    var cloneInputRow = inputRow.cloneNode(true);

    cloneInputRow.style.display = "table";
    cloneInputRow.childNodes[1].innerHTML = file.filename;
    cloneInputRow.childNodes[1].style.background = "#" + color.toString(16);
    imageStates.insertBefore(cloneInputRow, imageStates.LastChild);
}


function draw(fileContent) {
    var attributes = fileContent.split("\n");
    var shapeType = attributes[1].replace("shapeType=", "").trim();
    color = COLORS[(drawCount++) % COLORS.length];

    switch(shapeType) {
        case "Line":
            return drawLine(attributes);
        case "Arc":
            return  drawArc(attributes);
        case "Rect":
            return  drawRectangle(attributes);
        case "Circle":
            return  drawCircle(attributes);
        case "Contour":
            return  drawContour(attributes);
    }
}


function drawLine(attributes) {
    var args = attributes[4].split(", ");
    for(var i = 0; i < args.length; i++) {
        args[i] = parseInt(args[i]) / HUNDRED_THOUSAND;
    }

    var line = new Graphics()
        .lineStyle(lineWidth=args[4] * 2, color=color)
        .moveTo(args[0], -args[1])
        .lineTo(args[2], -args[3])
        .lineStyle(lineWidth=0)
        .beginFill(color)
        .drawCircle(args[0], -args[1], args[4])
        .drawCircle(args[2], -args[3], args[4])
        .endFill();

    var hitRectX = args[0] > args[2]? args[2] - args[4]: args[0] - args[4];
    var hitRectY = args[1] < args[3]? -args[3] - args[4]: -args[1] - args[4];
    var hitRectWidth = Math.abs(args[0] - args[2]) + args[4] * 2;
    var hitRectHeight = Math.abs(args[1] - args[3]) + args[4] * 2;

    line.interactive = true;
    line.hitArea = new Rectangle(hitRectX, hitRectY, hitRectWidth, hitRectHeight);

    line.click = function() {
        if(mode != "zoom"){
            var theta = Math.atan((args[1] - args[3]) / (args[0] - args[2]));
            if (args[2] < args[0]) {
                theta += Math.PI;
            }

            var xDisplacement = Math.sin(theta) * args[4];
            var yDisplacement = Math.cos(theta) * args[4];

            var startAngle = Math.atan(yDisplacement / xDisplacement);

            // 因為 Math.atan() 只會回傳 PI/2 ~ -PI/2 的值，因此要針對不同象限的點做調整
            if (xDisplacement < 0) {
                startAngle += Math.PI;
            }

            var endAngle = startAngle + Math.PI;

            selectionRect.clear()
                .lineStyle(lineWidth=LINE_WIDTH)
                .moveTo(args[0] + xDisplacement, -args[1] + yDisplacement, 2)
                .lineTo(args[2] + xDisplacement, -args[3] + yDisplacement, 2)
                .arc(args[2], -args[3], args[4], startAngle, endAngle, true)
                .lineTo(args[0] - xDisplacement, -args[1] - yDisplacement, 2)
                .arc(args[0], -args[1], args[4], endAngle, startAngle, true)

            isClickOnShape = true;
            addClickTwiceListener(line);
        }
    };

    if (shapes.isEmpty()) {
        setCenter(args[0], -args[1]);
    }

    shapes.addChild(line);

    var newImageLayer = {};
    newImageLayer.image = line;
    newImageLayer.points = [
        drawPoint(args[0], -args[1]),
        drawPoint(args[2], -args[3])
    ];

    return newImageLayer;
}


function drawArc(attributes) {
    var args = attributes[4].split(", ");
    for(var i = 0; i < args.length - 1; i++) {
        args[i] = parseInt(args[i]) / HUNDRED_THOUSAND;
    }

    var antiClockwise = false;
    if (args[7].trim() == "scCCW") {
        antiClockwise = true;
    }

    var radius = Math.sqrt((args[0] - args[4])**2 + (args[1] - args[5])**2);
    var startAngle = -Math.atan((args[1] - args[5]) / (args[0] - args[4]));
    var endAngle = -Math.atan((args[3] - args[5]) / (args[2] - args[4]));

    // 因為 Math.atan() 只會回傳 PI/2 ~ -PI/2 的值，因此要針對不同象限的點做調整
    if (args[0] < args[4]) {
        startAngle += Math.PI;
    }

    if (args[2] < args[4]) {
        endAngle += Math.PI;
    }

    var arc = new Graphics();
    if(startAngle == endAngle){
        arc.lineStyle(lineWidth=args[6] * 2, color=color)
            .drawCircle(args[4], -args[5], radius);
    }
    else{
        arc.lineStyle(lineWidth=args[6] * 2, color=color)
            .moveTo(args[0], -args[1])
            .arc(args[4], -args[5], radius, startAngle, endAngle, antiClockwise)
            .lineStyle(lineWidth=0)
            .beginFill(color)
            .drawCircle(args[0], -args[1], args[6])
            .drawCircle(args[2], -args[3], args[6])
            .endFill();
    }

    arc.interactive = true;
    arc.hitArea = new Circle(args[4], -args[5], radius + args[6]);
    arc.click = function(){
        if (mode != "zoom") {
            if(startAngle == endAngle){
                selectionRect.clear()
                    .lineStyle(lineWidth=LINE_WIDTH)
                    .drawCircle(args[4], -args[5], radius + args[6])
                    .drawCircle(args[4], -args[5], radius - args[6])
            }
            else{
                selectionRect.clear()
                    .lineStyle(lineWidth=LINE_WIDTH)
                    .moveTo(args[0] + Math.cos(startAngle) * args[6], -args[1] + Math.sin(startAngle) * args[6])
                    .arc(args[4], -args[5], radius + args[6], startAngle, endAngle, antiClockwise)
                    .arc(args[2], -args[3], args[6], endAngle, startAngle, antiClockwise)
                    .arc(args[4], -args[5], radius - args[6], endAngle, startAngle, !antiClockwise)
                    .arc(args[0], -args[1], args[6], endAngle, startAngle, antiClockwise)
            }

            isClickOnShape = true;
            addClickTwiceListener(arc);
        }
    };

    if (shapes.isEmpty()) {
        setCenter(args[4], -args[5]);
    }

    shapes.addChild(arc);

    var newImageLayer = {};
    newImageLayer.image = arc;

    if (startAngle == endAngle) {
        newImageLayer.points = [
            drawPoint(args[4], -args[5])
        ];
    }
    else {
        newImageLayer.points = [
            drawPoint(args[0], -args[1]),
            drawPoint(args[2], -args[3]),
            drawPoint(args[4], -args[5])
        ];
    }

    return newImageLayer;
}


function drawRectangle(attributes) {
    var args = attributes[4].split(", ");
    for(var i = 0; i < args.length; i++) {
        args[i] = parseInt(args[i]) / HUNDRED_THOUSAND;
    }

    var rectangle = new Graphics()
        .beginFill(color)
        .drawRect(args[0], -args[1], args[2], args[3])
        .endFill();

    rectangle.interactive = true;
    rectangle.click = function() {
        if (mode != "zoom") {
            selectionRect.clear()
                .lineStyle(lineWidth=LINE_WIDTH)
                .moveTo(args[0], -args[1])
                .lineTo(args[0] + args[2], -args[1])
                .lineTo(args[0] + args[2], -args[1] + args[3])
                .lineTo(args[0], -args[1] + args[3] )
                .lineTo(args[0], -args[1])

            isClickOnShape = true;
            addClickTwiceListener(rectangle);
        }
    }

    if (shapes.isEmpty()) {
        setCenter(args[0], -args[1]);
    }

    shapes.addChild(rectangle);

    var newImageLayer = {};
    newImageLayer.image = rectangle;
    newImageLayer.points = [
        drawPoint(args[0], -args[1]),
        drawPoint(args[0] + args[2], -args[1]),
        drawPoint(args[0], -args[1] + args[3]),
        drawPoint(args[0] + args[2], -args[1] + args[3])
    ]

    return newImageLayer;
}


function drawCircle(attributes) {
    var args = attributes[4].split(", ");
    for(var i = 0; i < args.length; i++) {
        args[i] = parseInt(args[i]) / HUNDRED_THOUSAND;
    }

    var circle = new Graphics()
        .beginFill(color)
        .drawCircle(args[0], -args[1], args[2])
        .endFill();

    circle.interactive = true;
    circle.click = function() {
        if (mode != "zoom") {
            selectionRect.clear()
                .lineStyle(lineWidth=LINE_WIDTH)
                .drawCircle(args[0], -args[1], args[2]);

            isClickOnShape = true;
            addClickTwiceListener(circle);
        }
    }

    if (shapes.isEmpty()) {
        setCenter(args[0], -args[1]);
    }

    shapes.addChild(circle);

    var newImageLayer = {};
    newImageLayer.image = circle;
    newImageLayer.points = [drawPoint(args[0], -args[1])];

    return newImageLayer;
}


function drawContour(attributes) {
    var args = [];
    var polygonCount;
    var newImageLayer = {};
    newImageLayer.points = [];

    polygonCount = parseInt(attributes[4]);

    for(var i = 0, j = 5; i < polygonCount; i++){
        var pointCount = parseInt(attributes[j++]);

        args[i] = [];
        for(var k = 0; k < pointCount; k++){
            var tempArg = attributes[j++].split(", ");

            args[i].push(parseInt(tempArg[0]) / HUNDRED_THOUSAND);
            args[i].push(-parseInt(tempArg[1]) / HUNDRED_THOUSAND);
        }
    }

    var polygon = new Graphics()
        .beginFill(color)
        .drawPolygon(args[0]);

    for(var i = 1; i < polygonCount; i++){
        polygon.drawPolygon(args[i]).addHole();
    }

    polygon.endFill();

    polygon.interactive = true;
    polygon.hitArea = new Polygon(args[0]);
    polygon.click = function(){
        if (mode != "zoom") {
            selectionRect.clear()
                .lineStyle(lineWidth=LINE_WIDTH)
                .moveTo(args[0][args[0].length - 2], args[0][args[0].length - 1]);

            for(var i = 0; i < args[0].length; i += 2){
                selectionRect.lineTo(args[0][i], args[0][i + 1]);
            }

            isClickOnShape = true;
            addClickTwiceListener(polygon);
        }
    };

    if (shapes.isEmpty()) {
        setCenter(args[0][0], args[0][1]);
    }

    for(var i = 0; i < args.length; i++){
        for(var j = 0; j < args[i].length; j += 2){
            newImageLayer.points.push(drawPoint(args[i][j], args[i][j + 1]));
        }
    }

    newImageLayer.image = polygon;

    shapes.addChild(polygon);

    return newImageLayer;
}


function addClickTwiceListener(shape) {
    if(chosenShape == shape){
        shapes.setChildIndex(shape, 0);
        selectionRect.clear();
        chosenShape = undefined;
    }
    else{
        chosenShape = shape;
    }
}


function drawPoint(xCoordinate, yCoordinate) {
    var point = new Graphics()
        .beginFill(0x000000)
        .drawCircle(xCoordinate, yCoordinate, 2)
        .endFill();

    point.alpha = 0;
    point.interactive = true;
    point.xCoordinate = xCoordinate;
    point.yCoordinate = yCoordinate;

    points.addChild(point);

    var coordinate = new Text(
        (xCoordinate * THOUSANDTH).toFixed(8) + ", " +
        (-yCoordinate * THOUSANDTH).toFixed(8));
    coordinate.x = xCoordinate;
    coordinate.y = yCoordinate;
    coordinate.style.fontSize = 72;

    point.mouseover = function() {
        if (mode == "query") {
            point.alpha = 1;

            coordinate.scale.x = 1.0 / images.scale.x * 0.4;
            coordinate.scale.y = 1.0 / images.scale.y * 0.4;
            points.addChild(coordinate);
        }
    };

    point.mouseout = function() {
        point.alpha = 0;

        points.removeChild(coordinate);
    };

    return point;
}


function setCenter(xCoordinate, yCoordinate) {
    images.x = app.view.width / 2;
    images.y = app.view.height / 2;

    images.x -= xCoordinate * images.scale.x;
    images.y -= yCoordinate * images.scale.y;

    console.log()
}


function deleteImageLayer(spanElement) {
    var filename = spanElement.parentElement.childNodes[1].innerHTML;

    for(var i = 0; i < imageLayers.length; i++) {
        if (imageLayers[i].filename == filename) {
            shapes.removeChild(imageLayers[i].image);
            for(var j = 0; j < imageLayers[i].points.length; j++) {
                points.removeChild(imageLayers[i].points[j]);
            }

            imageLayers.splice(i, 1);

            imageStates.removeChild(spanElement.parentElement);
            return;
        }
    }
}


function hideImage(spanElement) {
    var filename = spanElement.parentElement.childNodes[1].innerHTML;

    for(var i = 0; i < imageLayers.length; i++) {
        if (imageLayers[i].filename == filename) {
            imageLayers[i].image.alpha = !imageLayers[i].image.alpha;
            imageLayers[i].image.interactive = !imageLayers[i].image.interactive;

            for(var j = 0; j < imageLayers[i].points.length; j++) {
                imageLayers[i].points[j].interactive = !imageLayers[i].points[j].interactive;
            }

            spanElement.parentElement.childNodes[3].innerHTML =
                imageLayers[i].image.alpha? "ON": "OFF";

            return;
        }
    }
}


function setZoomMode() {
    setDefaulMode();
    mode = "zoom";

    functionMenu.childNodes[1].style.backgroundColor = "#6fcf97";
}


function setQueryMode() {
    setDefaulMode();
    mode = "query";

    functionMenu.childNodes[5].style.backgroundColor = "#6fcf97";
}


function backHome() {
    var maxX, minX, maxY, minY;
    var centerX, centerY;
    var width, height;
    var newScale, widthScale, heightScale;

    setDefaulMode();

    if (shapes.isEmpty()) {
        return;
    }

    for(var i = 0; i < imageLayers.length; i++) {
        for(var j = 0; j < imageLayers[i].points.length; j++) {
            if (maxX != undefined) {
                if (imageLayers[i].points[j].xCoordinate > maxX) {
                    maxX = imageLayers[i].points[j].xCoordinate;
                }
                else if (imageLayers[i].points[j].xCoordinate < minX) {
                    minX = imageLayers[i].points[j].xCoordinate;
                }

                if (imageLayers[i].points[j].yCoordinate > maxY) {
                    maxY = imageLayers[i].points[j].yCoordinate;
                }
                else if (imageLayers[i].points[j].yCoordinate < minY) {
                    minY = imageLayers[i].points[j].yCoordinate;
                }
            }
            else{
                maxX = minX = imageLayers[i].points[j].xCoordinate;
                maxY = minY = imageLayers[i].points[j].yCoordinate;
            }
        }
    }

    width = Math.abs(maxX - minX);
    height = Math.abs(maxY - minY);

    widthScale = width == 0? 1.25: app.view.width / width;
    heightScale = height == 0? 1.25: app.view.height / height;

    newScale = widthScale > heightScale? heightScale: widthScale;
    newScale *= 0.8;

    images.scale.set(newScale, newScale);

    centerX = (maxX + minX) / 2;
    centerY = (maxY + minY) / 2;
    setCenter(centerX, centerY);
}


function setDefaulMode() {
    mode = "default";
    mouseDown = false;
    zooming = false;

    functionMenu.childNodes[1].style.backgroundColor = "#e5e5e5";
    functionMenu.childNodes[3].style.backgroundColor = "#e5e5e5";
    functionMenu.childNodes[5].style.backgroundColor = "#e5e5e5";

    selectionRect.clear();
}


function resize() {
    app.view.width = content.offsetWidth;
    app.view.height = content.offsetHeight - 90;
}