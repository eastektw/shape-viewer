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
var imageAttributes = document.getElementById("imageAttributes");

var mousePosition;
var mode = "default";
var mouseDown = false;
var zooming = false;
var isClickOnShape = false;
var drawCount = 0;
var color;
var chosenShape;
var chosenShapeColor;

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

var points = new Container();
var shapes = new Container();
shapes.isEmpty = function() {
    return shapes.children.length <= 0;
};
images.addChild(shapes);

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
        else {
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
    else {
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
            .lineStyle(1, 0x000000)
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
        imageAttributes.innerHTML = "";
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
    var newImageLayer = imageLayer(file.result);
    newImageLayer.filename = file.filename;
    imageLayers.push(newImageLayer);

    var inputRow = document.getElementById("imageLayerTemplate");
    var cloneInputRow = inputRow.cloneNode(true);

    cloneInputRow.style.display = "table";
    cloneInputRow.childNodes[1].innerHTML = file.filename;
    cloneInputRow.childNodes[1].style.background = "#" + color.toString(16);
    imageStates.insertBefore(cloneInputRow, imageStates.LastChild);
}


function imageLayer(fileContent) {
    var attributes = fileContent.split("\n");
    var shapeType = attributes[1].replace("shapeType=", "").trim();
    color = COLORS[(drawCount++) % COLORS.length];

    switch(shapeType) {
        case "Line":
            return line(attributes);
        case "Arc":
            return arc(attributes);
        case "Rect":
            return rectangle(attributes);
        case "Circle":
            return circle(attributes);
        case "Contour":
            return contour(attributes);
    }
}


function line(attributes) {
    var newImageLayer = {};
    var line = new Graphics();
    var args = parseArgs(attributes);

    line.xS = args[0];
    line.yS = -args[1];
    line.xE = args[2];
    line.yE = -args[3];
    line.penRadius = args[4];

    newImageLayer.image = line;
    newImageLayer.points = [
        point(line.xS, line.yS),
        point(line.xE, line.yE)
    ];

    drawLine(line);
    setLineInteraction(line, attributes);

    if (shapes.isEmpty())
        setCenter(line.xS, line.yS);

    shapes.addChild(line);

    return newImageLayer;
}


function drawLine(line) {
    line.lineStyle(line.penRadius * 2, color)
        .moveTo(line.xS, line.yS)
        .lineTo(line.xE, line.yE)
        .lineStyle(0)
        .beginFill(color)
        .drawCircle(line.xS, line.yS, line.penRadius)
        .drawCircle(line.xE, line.yE, line.penRadius)
        .endFill();
}


function setLineInteraction(line, attributes) {
    var hitRectX = line.xS > line.xE? line.xE - line.penRadius: line.xS - line.penRadius;
    var hitRectY = -line.yS < -line.yE? line.yE - line.penRadius: line.yS - line.penRadius;
    var hitRectWidth = Math.abs(line.xE - line.xS) + line.penRadius * 2;
    var hitRectHeight = Math.abs(line.yE - line.yS) + line.penRadius * 2;

    line.interactive = true;
    line.hitArea = new Rectangle(hitRectX, hitRectY, hitRectWidth, hitRectHeight);

    line.click = function() {
        if (mode != "zoom") {
            isClickOnShape = true;

            drawLineFrame(line);
            setImageAttributes(attributes);
            addClickTwiceListener(line);
        }
    };
}


function drawLineFrame(line) {
    var theta = -Math.atan((line.yS - line.yE) / (line.xS - line.xE));
    if (line.xE < line.xS) {
        theta += Math.PI;
    }

    var xDisplacement = Math.sin(theta) * line.penRadius;
    var yDisplacement = Math.cos(theta) * line.penRadius;

    var startAngle = Math.atan(yDisplacement / xDisplacement);

    // 因為 Math.atan() 只會回傳 PI/2 ~ -PI/2 的值，因此要針對不同象限的點做調整
    if (xDisplacement < 0)
        startAngle += Math.PI;

    var endAngle = startAngle + Math.PI;

    selectionRect.clear()
        .lineStyle(LINE_WIDTH)
        .moveTo(line.xS + xDisplacement, line.yS + yDisplacement, 2)
        .lineTo(line.xE + xDisplacement, line.yE + yDisplacement, 2)
        .arc(line.xE, line.yE, line.penRadius, startAngle, endAngle, true)
        .lineTo(line.xS - xDisplacement, line.yS - yDisplacement, 2)
        .arc(line.xS, line.yS, line.penRadius, endAngle, startAngle, true);
}


function arc(attributes) {
    var newImageLayer = {};
    var arc = new Graphics();
    var args = parseArgs(attributes);

    arc.xS = args[0];
    arc.yS = -args[1];
    arc.xE = args[2];
    arc.yE = -args[3];
    arc.xC = args[4];
    arc.yC = -args[5];
    arc.penRadius = args[6];
    arc.antiClockwise = (args[7].trim() == "scCCW");

    arc.radius = Math.sqrt((arc.xS - arc.xC)**2 + (arc.yS - arc.yC)**2);
    arc.startAngle = Math.atan((arc.yS - arc.yC) / (arc.xS - arc.xC));
    arc.endAngle = Math.atan((arc.yE - arc.yC) / (arc.xE - arc.xC));

    // 因為 Math.atan() 只會回傳 PI/2 ~ -PI/2 的值，因此要針對不同象限的點做調整
    if (arc.xS < arc.xC)
        arc.startAngle += Math.PI;

    if (arc.xE < arc.xC)
        arc.endAngle += Math.PI;

    newImageLayer.image = arc;
    newImageLayer.points = [point(arc.xC, arc.yC)];
    if (arc.startAngle != arc.endAngle){
        newImageLayer.points.push(point(arc.xS, arc.yS));
        newImageLayer.points.push(point(arc.xE, arc.yE));
    }

    drawArc(arc);
    setArcInteraction(arc, attributes);

    if (shapes.isEmpty())
        setCenter(arc.xC, arc.yC);

    shapes.addChild(arc);

    return newImageLayer;
}


function drawArc(arc) {
    if (arc.startAngle == arc.endAngle) {
        arc.lineStyle(arc.penRadius * 2, color)
            .drawCircle(arc.xC, arc.yC, arc.radius);
    }
    else {
        arc.lineStyle(arc.penRadius * 2, color)
            .arc(arc.xC, arc.yC, arc.radius,
                arc.startAngle, arc.endAngle, arc.antiClockwise)
            .lineStyle(0)
            .beginFill(color)
            .drawCircle(arc.xS, arc.yS, arc.penRadius)
            .drawCircle(arc.xE, arc.yE, arc.penRadius)
            .endFill();
    }
}


function setArcInteraction(arc, attributes) {
    arc.interactive = true;
    arc.hitArea = new Circle(arc.xC, arc.yC, arc.radius + arc.penRadius);

    arc.click = function() {
        if (mode != "zoom") {
            isClickOnShape = true;

            drawArcFrame(arc);
            setImageAttributes(attributes);
            addClickTwiceListener(arc);
        }
    };
}


function drawArcFrame(arc) {
    if (arc.startAngle == arc.endAngle) {
        selectionRect.clear()
            .lineStyle(LINE_WIDTH)
            .drawCircle(arc.xC, arc.yC, arc.radius + arc.penRadius)
            .drawCircle(arc.xC, arc.yC, arc.radius - arc.penRadius)
    }
    else {
        selectionRect.clear()
            .lineStyle(LINE_WIDTH)
            .moveTo(arc.xS + Math.cos(arc.startAngle) * arc.penRadius,
                arc.yS + Math.sin(arc.startAngle) * arc.penRadius)

            .arc(arc.xC, arc.yC, arc.radius + arc.penRadius,
                arc.startAngle, arc.endAngle, arc.antiClockwise)

            .arc(arc.xE, arc.yE, arc.penRadius,
                arc.endAngle, arc.startAngle, arc.antiClockwise)

            .arc(arc.xC, arc.yC, arc.radius - arc.penRadius,
                arc.endAngle, arc.startAngle, !arc.antiClockwise)

            .arc(arc.xS, arc.yS, arc.penRadius,
                arc.endAngle, arc.startAngle, arc.antiClockwise)
    }
}


function rectangle(attributes) {
    var newImageLayer = {};
    var rectangle = new Graphics();
    var args = parseArgs(attributes);

    rectangle._x = args[0];
    rectangle._y = -args[1];
    rectangle._width = args[2];
    rectangle._height = args[3];

    newImageLayer.image = rectangle;
    newImageLayer.points = [
        point(rectangle._x, rectangle._y),
        point(rectangle._x + rectangle._width, rectangle._y),
        point(rectangle._x, rectangle._y + rectangle._height),
        point(rectangle._x + rectangle._width, rectangle._y + rectangle._height)
    ]

    drawRectangle(rectangle);
    setRectangleInteraction(rectangle, attributes);

    if (shapes.isEmpty()) {
        setCenter(args[0], -args[1]);
    }

    shapes.addChild(rectangle);

    return newImageLayer;
}


function drawRectangle(rectangle) {
    rectangle
        .beginFill(color)
        .drawRect(rectangle._x, rectangle._y, rectangle._width, rectangle._height)
        .endFill();
}


function setRectangleInteraction(rectangle, attributes) {
    rectangle.interactive = true;

    rectangle.click = function() {
        if (mode != "zoom") {
            isClickOnShape = true;

            drawRectangleFrame(rectangle);
            setImageAttributes(attributes);
            addClickTwiceListener(rectangle);
        }
    };
}


function drawRectangleFrame(rectangle) {
    selectionRect.clear()
        .lineStyle(LINE_WIDTH)
        .moveTo(rectangle._x, rectangle._y)
        .lineTo(rectangle._x + rectangle._width, rectangle._y)
        .lineTo(rectangle._x + rectangle._width, rectangle._y + rectangle._height)
        .lineTo(rectangle._x, rectangle._y + rectangle._height)
        .lineTo(rectangle._x, rectangle._y)
}


function circle(attributes) {
    var newImageLayer = {};
    var circle = new Graphics();
    var args = parseArgs(attributes);

    circle._x = args[0];
    circle._y = -args[1];
    circle.radius = args[2];

    newImageLayer.image = circle;
    newImageLayer.points = [point(args[0], -args[1])];

    drawCircle(circle);
    setCircleInteraction(circle, attributes);

    if (shapes.isEmpty())
        setCenter(args[0], -args[1]);

    shapes.addChild(circle);

    return newImageLayer;
}


function drawCircle(circle) {
    circle
        .beginFill(color)
        .drawCircle(circle._x, circle._y, circle.radius)
        .endFill();
}


function setCircleInteraction(circle, attributes) {
    circle.interactive = true;

    circle.click = function() {
        if (mode != "zoom") {
            isClickOnShape = true;

            drawCircleFrame(circle);
            setImageAttributes(attributes);
            addClickTwiceListener(circle);
        }
    }
}


function drawCircleFrame(circle) {
    selectionRect.clear()
        .lineStyle(LINE_WIDTH)
        .drawCircle(circle._x, circle._y, circle.radius);
}


function contour(attributes) {
    var newImageLayer = {"points": []};
    var polygon = new Graphics();
    var args = [];

    polygon.polygonCount = parseInt(attributes[4]);

    for(var i = 0, j = 5; i < polygon.polygonCount; i++) {
        var pointCount = parseInt(attributes[j++]);

        args[i] = [];
        for(var k = 0; k < pointCount; k++) {
            var tempArg = attributes[j++].split(", ");

            args[i].push(parseInt(tempArg[0]) / HUNDRED_THOUSAND);
            args[i].push(-parseInt(tempArg[1]) / HUNDRED_THOUSAND);
        }
    }

    newImageLayer.image = polygon;
    for(var i = 0; i < args.length; i++) {
        for(var j = 0; j < args[i].length; j += 2) {
            newImageLayer.points.push(point(args[i][j], args[i][j + 1]));
        }
    }

    drawPolygon(polygon, args);
    setPolygonInteraction(polygon, attributes, args);

    if (shapes.isEmpty())
        setCenter(args[0][0], args[0][1]);

    shapes.addChild(polygon);

    return newImageLayer;
}


function drawPolygon(polygon, args) {
    polygon
        .beginFill(color)
        .drawPolygon(args[0]);

    for(var i = 1; i < polygon.polygonCount; i++) {
        polygon.drawPolygon(args[i]).addHole();
    }

    polygon.endFill();
}


function setPolygonInteraction(polygon, attributes, args) {
    polygon.interactive = true;
    polygon.hitArea = new Polygon(args[0]);

    polygon.click = function() {
        if (mode != "zoom") {
            isClickOnShape = true;

            drawPolygonFrame(args);
            setImageAttributes(attributes);
            addClickTwiceListener(polygon);
        }
    };
}


function drawPolygonFrame(args) {
    selectionRect.clear()
        .lineStyle(LINE_WIDTH)
        .moveTo(args[0][args[0].length - 2], args[0][args[0].length - 1]);

    for(var i = 0; i < args[0].length; i += 2) {
        selectionRect.lineTo(args[0][i], args[0][i + 1]);
    }
}


function parseArgs(attributes) {
    var args = attributes[4].split(", ");
    for(var i = 0; i < args.length; i++) {
        if (!isNaN(parseInt(args[i]) / HUNDRED_THOUSAND)) {
            args[i] = parseInt(args[i]) / HUNDRED_THOUSAND;
        }
    }

    return args;
}


function setImageAttributes(attributes) {
    imageAttributes.innerHTML = "";
    for(var i = 0; i < 4; i< i++) {
        imageAttributes.innerHTML += attributes[i];
        imageAttributes.innerHTML += "<br>";
    }
}


function addClickTwiceListener(shape) {
    if (chosenShape == shape) {
        shapes.setChildIndex(shape, 0);
        selectionRect.clear();
        chosenShape = undefined;
        imageAttributes.innerHTML = "";
    }
    else {
        chosenShape = shape;
    }
}


function point(xCoordinate, yCoordinate) {
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

    images.addChild(points);
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
            else {
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

    images.removeChild(points);
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
