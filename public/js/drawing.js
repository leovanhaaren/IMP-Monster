/**
 * Created by Leo on 24-10-13.
 */

// Drawing method for our main tracker, representing the player's position
function drawTrackerShape(scene, size, color) {
    scene.canvas.arc(ballX, ballY, size, 0, 2 * Math.PI, false);
    scene.canvas.fillStyle = color;
    scene.canvas.fill();
    scene.canvas.stroke();
}

// Drawing method for our tracking grid locations
function drawDebugShape(scene, zone, shape, colorMode) {
    // Determine debug shape
    if(shape == "line") {
        // Determine color type
        if(colorMode == "direction")
            scene.canvas.strokeStyle = getDirectionalColor(zone.u, zone.v);
        else
            scene.canvas.strokeStyle = color;

        scene.canvas.beginPath();
        scene.canvas.moveTo(zone.x, zone.y);
        scene.canvas.lineTo((zone.x - zone.u), zone.y + zone.v);
        scene.canvas.fill();
        scene.canvas.stroke();
    } else if(shape == "circle") {
        // Determine color type
        if(colorMode == "direction")
            scene.canvas.fillStyle = getDirectionalColor(zone.u, zone.v);
        else
            scene.canvas.fillStyle = color;

        scene.canvas.beginPath();
        scene.canvas.arc(zone.x, zone.y, 10, 0, 2 * Math.PI, false);
        scene.canvas.fill();
        scene.canvas.stroke();
    }
}

// Drawing method for game stats in html
function drawGameStats(settings, game, tracker) {
    // Clear list and fill it with updated data
    $('#gamestats').empty();
    $('#gamestats').append('<li>Debug: ' + settings.debug + '</li>');
    $('#gamestats').append('<li>Grid: ' + settings.gridSize + '</li>');
    $('#gamestats').append('<li>Direction: ' + settings.direction + '</li>');
    $('#gamestats').append('<li>directionStrength: ' + settings.directionStrength + '</li>');
    $('#gamestats').append('<li>Area: X - ' + settings.areaOfInterest.x + ', Y - ' + settings.areaOfInterest.y + ', W - ' + settings.areaOfInterest.w + ', H - ' + settings.areaOfInterest.h + '</li>');
}