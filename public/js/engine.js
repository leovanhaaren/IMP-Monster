// Engine based on the work of: https://github.com/anvaka/oflow

$(document).ready(function() {

        // Engine settings
    var settings = {
            debug:     false,
            gridSize:  8,
            direction: false,
            directionStrength: 8,
            areaOfInterest: {
                x: 100,
                y: 100,
                w: 200,
                h: 200,
                color: 'white',
                handlesSize: 8,
                currentHandle: false,
                drag: false
            }
        },

        // Get webcam footage
        video  = document.getElementById('videoOut'),
        canvas = document.getElementById('scene'),

        // Get oflow tracker
        webCamFlow   = new oflow.WebCamFlow(video, settings.gridSize),

        video = {
            width:   video.videoWidth,
            height:  video.videoHeight
        },

        scene = {
            canvas: canvas.getContext('2d'),
            width:  canvas.width,
            height: canvas.height
        },

        tracker = {
            x: scene.width  / 2,
            y: scene.height / 2,
            mx: 0,
            my: 0,
            visible: true,
            updateRate: 3,
            logPosition: false,
            zones: 0
        },

        game = {
            startedOn: new Date(),
            duration: null,
            updates: 0,
            paused: false,
            score: 0
        };

    // Needed?
    scene.canvas.fillStyle = '#bada55';

    webCamFlow.onCalculated( function (direction) {
        game.updates++;
        game.duration = new Date() - game.startedOn;

        // Reset motion data for next frame
        tracker.mx = 0;
        tracker.my = 0;
        tracker.zones = 0;

        // Clear scene
        scene.canvas.clearRect(0, 0, scene.width, scene.height);

        // Loop through zones
        for(var i = 0; i < direction.zones.length; ++i) {
            var zone = direction.zones[i];

            // Continue next iteration when not in area of interest
            if ( zone.x >= settings.areaOfInterest.x && zone.x <= settings.areaOfInterest.x + settings.areaOfInterest.w &&   zone.y >= settings.areaOfInterest.y && zone.y <= settings.areaOfInterest.y + settings.areaOfInterest.h )
                continue;

            // Continue next iteration when movement not strong enough
            if(dist(zone.x, zone.y, (zone.x - zone.u), zone.y + zone.v) < 8)
                continue;

            // Add motion distance to tracker obj
            tracker.mx += zone.x;
            tracker.my += zone.y;
            tracker.zones++;

            // Draw debugging zones
            if(settings.debug)
                drawDebugShape(scene, zone, "line", "direction");
        }

        // Get center of motion
        tracker.mx = Math.round(tracker.mx / tracker.zones);
        tracker.my = Math.round(tracker.my / tracker.zones);

        // render ball:
        scene.canvas.clearRect(0, 0, ballSceneW, ballSceneH);
        scene.canvas.beginPath();

        if(settings.direction) {
            // Push the tracker based on direction
            tracker.x -= direction.u * settings.directionStrength;
            tracker.y += direction.v * settings.directionStrength;
        } else {
            // Update position every half second
            if(game.updates % tracker.updateRate == 0) {
                tracker.x = tracker.mx;
                tracker.y = tracker.my;
            }

            // Update game stats
            drawGameStats(settings, game, tracker);
        }

        // Force tracker within scene
        constrainTrackerToScene(scene, tracker);

        // Draw tracker if enabled
        if(tracker.visible)
            drawTrackerShape(scene, 50, 'yellow');

        drawAreaOfInterest();

        if(tracker.logPosition) {
            // Save to database
            if(!dpd) return;

            dpd.location.post({
             x: tracker.x,
             y: tracker.y
             }, function(location, error) {
             if (error) return showError(error);
             });
        }

    });
    webCamFlow.startCapture();

    // Method to make sure tracker does not leave scene
    function constrainTrackerToScene(scene, tracker) {
        if (tracker.x < 0)            tracker.x = 0;
        if (tracker.x > scene.width)  tracker.x = scene.width;
        if (tracker.y < 0)            tracker.y = 0;
        if (tracker.y > scene.height) tracker.y = scene.height;
    }

    // Method to init the canvas mouse interaction
    function init() {
        canvas.addEventListener('mousedown', mouseDown, false);
        canvas.addEventListener('mouseup', mouseUp, false);
        canvas.addEventListener('mousemove', mouseMove, false);
    }
    init();

});