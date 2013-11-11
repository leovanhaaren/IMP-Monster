/**
 * Created by Leo on 24-10-13.
 */

    // Method to store a point we click/drag
function point(x, y) {
    return {
        x: x,
        y: y
    };
}

// Method to get distance between points
function dist(p1, p2) {
    return Math.sqrt((p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y));
}

// Method used to get the area of interest handle(s)
function getAreaHandle(mouse, settings) {
    if (dist(mouse, point(settings.areaOfInterest.x, settings.areaOfInterest.y)) <= settings.areaOfInterest.handlesSize) return 'topleft';
    if (dist(mouse, point(settings.areaOfInterest.x + settings.areaOfInterest.w, settings.areaOfInterest.y)) <= settings.areaOfInterest.handlesSize) return 'topright';
    if (dist(mouse, point(settings.areaOfInterest.x, settings.areaOfInterest.y + settings.areaOfInterest.h)) <= settings.areaOfInterest.handlesSize) return 'bottomleft';
    if (dist(mouse, point(settings.areaOfInterest.x + settings.areaOfInterest.w, settings.areaOfInterest.y + settings.areaOfInterest.h)) <= settings.areaOfInterest.handlesSize) return 'bottomright';
    if (dist(mouse, point(settings.areaOfInterest.x + settings.areaOfInterest.w / 2, settings.areaOfInterest.y)) <= settings.areaOfInterest.handlesSize) return 'top';
    if (dist(mouse, point(settings.areaOfInterest.x, settings.areaOfInterest.y + settings.areaOfInterest.h / 2)) <= settings.areaOfInterest.handlesSize) return 'left';
    if (dist(mouse, point(settings.areaOfInterest.x + settings.areaOfInterest.w / 2, settings.areaOfInterest.y + settings.areaOfInterest.h)) <= settings.areaOfInterest.handlesSize) return 'bottom';
    if (dist(mouse, point(settings.areaOfInterest.x + settings.areaOfInterest.w, settings.areaOfInterest.y + settings.areaOfInterest.h / 2)) <= settings.areaOfInterest.handlesSize) return 'right';
    return false;
}

function mouseDown() {
    if (settings.areaOfInterest.currentHandle) settings.areaOfInterest.drag = true;
    //drawAreaOfInterest();
}

function mouseUp() {
    settings.areaOfInterest.drag          = false;
    settings.areaOfInterest.currentHandle = false;
    //drawAreaOfInterest();
}

function mouseMove(e) {
    var previousHandle = settings.areaOfInterest.currentHandle;
    if (!settings.areaOfInterest.drag) settings.areaOfInterest.currentHandle = getAreaHandle(point(e.pageX - this.offsetLeft, e.pageY - this.offsetTop));
    if (settings.areaOfInterest.currentHandle && settings.areaOfInterest.drag) {
        var mousePos = point(e.pageX - this.offsetLeft, e.pageY - this.offsetTop);
        switch (settings.areaOfInterest.currentHandle) {
            case 'topleft':
                settings.areaOfInterest.w += settings.areaOfInterest.x - mousePos.x;
                settings.areaOfInterest.h += settings.areaOfInterest.y - mousePos.y;
                settings.areaOfInterest.x = mousePos.x;
                settings.areaOfInterest.y = mousePos.y;
                break;
            case 'topright':
                settings.areaOfInterest.w = mousePos.x - settings.areaOfInterest.x;
                settings.areaOfInterest.h += settings.areaOfInterest.y - mousePos.y;
                settings.areaOfInterest.y = mousePos.y;
                break;
            case 'bottomleft':
                settings.areaOfInterest.w += settings.areaOfInterest.x - mousePos.x;
                settings.areaOfInterest.x = mousePos.x;
                settings.areaOfInterest.h = mousePos.y - settings.areaOfInterest.y;
                break;
            case 'bottomright':
                settings.areaOfInterest.w = mousePos.x - settings.areaOfInterest.x;
                settings.areaOfInterest.h = mousePos.y - settings.areaOfInterest.y;
                break;

            case 'top':
                settings.areaOfInterest.h += settings.areaOfInterest.y - mousePos.y;
                settings.areaOfInterest.y = mousePos.y;
                break;

            case 'left':
                settings.areaOfInterest.w += settings.areaOfInterest.x - mousePos.x;
                settings.areaOfInterest.x = mousePos.x;
                break;

            case 'bottom':
                settings.areaOfInterest.h = mousePos.y - settings.areaOfInterest.y;
                break;

            case 'right':
                settings.areaOfInterest.w = mousePos.x - settings.areaOfInterest.x;
                break;
        }
    }
    //if (settings.areaOfInterest.drag || settings.areaOfInterest.currentHandle != previousHandle) drawAreaOfInterest();
}

function drawAreaOfInterest(scene, settings) {
    //scene.canvas.clearRect(0, 0, scene.width, scene.height);
    //scene.canvas.fillStyle = settings.areaOfInterest.color;
    //scene.canvas.fillRect(settings.areaOfInterest.x, settings.areaOfInterest.y, settings.areaOfInterest.w, settings.areaOfInterest.h);
    scene.canvas.strokeStyle = settings.areaOfInterest.color;
    scene.canvas.strokeRect(settings.areaOfInterest.x, settings.areaOfInterest.y, settings.areaOfInterest.w, settings.areaOfInterest.h);
    if (settings.areaOfInterest.currentHandle) {
        var posHandle = point(0, 0);
        switch (settings.areaOfInterest.currentHandle) {
            case 'topleft':
                posHandle.x = settings.areaOfInterest.x;
                posHandle.y = settings.areaOfInterest.y;
                break;
            case 'topright':
                posHandle.x = settings.areaOfInterest.x + settings.areaOfInterest.w;
                posHandle.y = settings.areaOfInterest.y;
                break;
            case 'bottomleft':
                posHandle.x = settings.areaOfInterest.x;
                posHandle.y = settings.areaOfInterest.y + settings.areaOfInterest.h;
                break;
            case 'bottomright':
                posHandle.x = settings.areaOfInterest.x + settings.areaOfInterest.w;
                posHandle.y = settings.areaOfInterest.y + settings.areaOfInterest.h;
                break;
            case 'top':
                posHandle.x = settings.areaOfInterest.x + settings.areaOfInterest.w / 2;
                posHandle.y = settings.areaOfInterest.y;
                break;
            case 'left':
                posHandle.x = settings.areaOfInterest.x;
                posHandle.y = settings.areaOfInterest.y + settings.areaOfInterest.h / 2;
                break;
            case 'bottom':
                posHandle.x = settings.areaOfInterest.x + settings.areaOfInterest.w / 2;
                posHandle.y = settings.areaOfInterest.y + settings.areaOfInterest.h;
                break;
            case 'right':
                posHandle.x = settings.areaOfInterest.x + settings.areaOfInterest.w;
                posHandle.y = settings.areaOfInterest.y + settings.areaOfInterest.h / 2;
                break;
        }
        scene.canvas.globalCompositeOperation = 'xor';
        scene.canvas.beginPath();
        scene.canvas.arc(posHandle.x, posHandle.y, settings.areaOfInterest.handlesSize, 0, 2 * Math.PI);
        scene.canvas.fill();
        scene.canvas.globalCompositeOperation = 'source-over';
    }
}

// Method to init the canvas mouse interaction
function init() {
    //canvas.addEventListener('mousedown', mouseDown(), false);
    //canvas.addEventListener('mouseup', mouseUp(), false);
    //canvas.addEventListener('mousemove', mouseMove(e), false);
}
init();