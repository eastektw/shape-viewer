//Aliases
var Application = PIXI.Application;
var Container = PIXI.Container;
var Graphics = PIXI.Graphics;
var Text = PIXI.Text;

const HUNDRED_THOUSAND = 100000;
const THOUSANDTH = 0.001;

var content = document.getElementById("content");
var imageStates = document.getElementById("imageStates");
var functionMenu = document.getElementById("functionMenu");
var prompt = document.getElementById("prompt");

var mousePosition;
var mode = "default";
var mouseDown = false;
var zooming = false;

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
        console.log("newScale = " + newScale);

        images.scale.x = newScale;
        images.scale.y = newScale;

        setCenter(selectionRect.centerX, selectionRect.centerY);

        selectionRect.clear();
    }
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
    imageStates.insertBefore(cloneInputRow, imageStates.LastChild);
}


function draw(fileContent) {
    var attributes = fileContent.split("\n");
    var shapeType = attributes[1].replace("shapeType=", "").trim();

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
        .lineStyle(lineWidth=args[4] * 2, color=0xeb5757)
        .moveTo(args[0], -args[1])
        .lineTo(args[2], -args[3])
        .lineStyle(lineWidth=0)
        .beginFill(0xeb5757)
        .drawCircle(args[0], -args[1], args[4])
        .drawCircle(args[2], -args[3], args[4])
        .endFill();

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

    var arc = new Graphics()
        .lineStyle(lineWidth=args[6] * 2, color=0xeb5757)
        .moveTo(args[0], -args[1])
        .arc(args[4], -args[5], radius, startAngle, endAngle, antiClockwise)
        .lineStyle(lineWidth=0)
        .beginFill(0xeb5757)
        .drawCircle(args[0], -args[1], args[6])
        .drawCircle(args[2], -args[3], args[6])
        .endFill();

    if (shapes.isEmpty()) {
        setCenter(args[4], -args[5]);
    }

    shapes.addChild(arc);

    var newImageLayer = {};
    newImageLayer.image = arc;
    newImageLayer.points = [
        drawPoint(args[0], -args[1]),
        drawPoint(args[2], -args[3]),
        drawPoint(args[4], -args[5])
    ];

    return newImageLayer;
}


function drawRectangle(attributes) {
    var args = attributes[4].split(", ");
    for(var i = 0; i < args.length; i++) {
        args[i] = parseInt(args[i]) / HUNDRED_THOUSAND;
    }

    var rectangle = new Graphics()
        .beginFill(0xeb5757)
        .drawRect(args[0], -args[1], args[2], args[3])
        .endFill();

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
        .beginFill(0xeb5757)
        .drawCircle(args[0], -args[1], args[2])
        .endFill();

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
    var numberOfHoles;
    var currentLine;
    var newImageLayer = {};
    newImageLayer.points = [];

    for(var i = 4; i < attributes.length; i++) {
        var tempArg = attributes[i].split(", ");

        if (tempArg.length == 2) {
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
        .beginFill(0xeb5757)
        .moveTo(args[currentLine][0], args[currentLine][1]);

    newImageLayer.points.push(drawPoint(args[currentLine][0], args[currentLine][1]));

    if (shapes.isEmpty()) {
        setCenter(args[currentLine][0], args[currentLine][1]);
    }
    currentLine++

    for(var i = 1; i < args[1]; i++, currentLine++) {
        polygon.lineTo(args[currentLine][0], args[currentLine][1]);
        newImageLayer.points.push(drawPoint(args[currentLine][0], args[currentLine][1]));
    }

    for(var i = 0; i < numberOfHoles; i++) {
        var pointCount = args[currentLine++];

        polygon.moveTo(args[currentLine][0], args[currentLine][1]);
        newImageLayer.points.push(drawPoint(args[currentLine][0], args[currentLine][1]));
        currentLine++;

        for(var j = 1; j < pointCount; currentLine++, j++) {
            polygon.lineTo(args[currentLine][0], args[currentLine][1]);
            newImageLayer.points.push(drawPoint(args[currentLine][0], args[currentLine][1]));
        }
        polygon.addHole();
    }
    polygon.endFill();

    newImageLayer.image = polygon;

    shapes.addChild(polygon);

    return newImageLayer;
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
