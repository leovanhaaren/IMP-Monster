/**
 * Created by Leo on 24-10-13.
 */

// Drawing method for our main tracker, representing the player's position
function drawTrackerShape(scene, tracker, size, color) {
    scene.canvas.beginPath();
    scene.canvas.strokeStyle = color;
    scene.canvas.arc(tracker.x, tracker.y, size, 0, 2 * Math.PI, false);
    scene.canvas.fillStyle = color;
    scene.canvas.fill();
    scene.canvas.stroke();
}

// Drawing method for our tracking grid locations
function drawDebugShape(scene, zone, shape, colorMode) {
    // Determine debug shape
    if(shape == "line") {
        scene.canvas.beginPath();
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
        scene.canvas.beginPath();
        // Determine color type
        if(colorMode == "direction")
            scene.canvas.fillStyle = getDirectionalColor(zone.u, zone.v);
        else
            scene.canvas.fillStyle = color;


        scene.canvas.arc(zone.x, zone.y, 10, 0, 2 * Math.PI, false);
        scene.canvas.fill();
        scene.canvas.stroke();
    }
}

// Drawing method for game stats in html
function drawGameStats(settings, video, scene, game, tracker) {
    // Clear list and fill it with updated data
    $('#gamestats').empty();
    $('#gamestats').append('<li><h4>Settings</h4></li>');
    $('#gamestats').append('<li>Debug: ' + settings.debug + '</li>');
    $('#gamestats').append('<li>Grid: ' + settings.gridSize + '</li>');
    $('#gamestats').append('<li>Direction: ' + settings.direction + '</li>');
    $('#gamestats').append('<li>directionStrength: ' + settings.directionStrength + '</li>');
    $('#gamestats').append('<li>Area: X ' + settings.areaOfInterest.x + ', Y ' + settings.areaOfInterest.y + ', W ' + settings.areaOfInterest.w + ', H ' + settings.areaOfInterest.h + '</li>');

    $('#gamestats').append('<li><h4>Scene</h4></li>');
    $('#gamestats').append('<li>Width: ' + scene.width + '</li>');
    $('#gamestats').append('<li>Height:: ' + scene.height + '</li>');

    $('#gamestats').append('<li><h4>Tracker</h4></li>');
    $('#gamestats').append('<li>X: ' + tracker.x + '</li>');
    $('#gamestats').append('<li>Y: ' + tracker.y + '</li>');
    $('#gamestats').append('<li>MX: ' + tracker.mx + '</li>');
    $('#gamestats').append('<li>MY: ' + tracker.my + '</li>');
    $('#gamestats').append('<li>Visible: ' + tracker.visible + '</li>');
    $('#gamestats').append('<li>Update rate: ' + tracker.updateRate + '</li>');
    $('#gamestats').append('<li>Zones: ' + tracker.zones + '</li>');

    $('#gamestats').append('<li><h4>Game</h4></li>');
    $('#gamestats').append('<li>Duration: ' + new Date(game.duration).getSeconds() + ' seconds and ' + new Date(game.duration).getMinutes() + ' minutes</li>');
    $('#gamestats').append('<li>Updates: ' + game.updates + '</li>');
    $('#gamestats').append('<li>Paused: ' + game.paused + '</li>');
    $('#gamestats').append('<li>Score: ' + game.score + '</li>');
}