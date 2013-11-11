// Engine based on the work of: https://github.com/anvaka/oflow

$(document).ready(function() {

    // Engine settings
    settings = {
        debug:     true,
        gridSize:  10,
        direction: false,
        directionStrength: 5,
        areaOfInterest: {
            x: 50,
            y: 50,
            w: 540,
            h: 380,
            color: 'red',
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
        zones: 0
    },

    game = {
        startedOn: new Date(),
        duration: null,
        updates: 0,
        paused: false,
        score: 0
    };

    webCamFlow.onCalculated( function (direction) {
        game.updates++;
        game.duration = new Date() - game.startedOn;

        // Reset motion data for next frame
        tracker.mx = 0;
        tracker.my = 0;
        tracker.zones = 0;



        // Loop through zones
        for(var i = 0; i < direction.zones.length; ++i) {
            var zone = direction.zones[i];

            // Continue next iteration when not in area of interest
            //if ( zone.x >= settings.areaOfInterest.x && zone.x <= settings.areaOfInterest.x + settings.areaOfInterest.w &&   zone.y >= settings.areaOfInterest.y && zone.y <= settings.areaOfInterest.y + settings.areaOfInterest.h )
                //continue;

            // Continue next iteration when movement not strong enough
            if(dist(zone.x, zone.y, (zone.x - zone.u), zone.y + zone.v) > 12) {
                // Draw debugging zones
                //if(settings.debug)
                    //drawDebugShape(scene, zone, "circle", "direction");

                // Add motion distance to tracker obj
                tracker.mx += Math.round(zone.x);
                tracker.my += Math.round(zone.y);
                tracker.zones++;
            }

        }

        // Get center of motion
        tracker.mx = Math.round(tracker.mx / tracker.zones);
        tracker.my = Math.round(tracker.my / tracker.zones);

        drawGameStats(settings, video, scene, game, tracker);

        if(settings.direction) {
            // Push the tracker based on direction
            tracker.x += direction.u * settings.directionStrength;
            tracker.y += direction.v * settings.directionStrength;
        } else {
            if(isNaN(tracker.mx) || isNaN(tracker.my))
                return;

            if(tracker.x == tracker.mx)
                return;

            if(tracker.y == tracker.my)
                return;

            // Update tracker
            //tracker.x = tracker.mx;
            tracker.y = tracker.my;
        }

        // Force tracker within scene
        constrainTrackerToScene(scene, tracker);



        // Clear scene
        scene.canvas.clearRect(0, 0, scene.width, scene.height);

        if(tracker.visible)
            drawTrackerShape(scene, tracker, 25, 'yellow');

        drawAreaOfInterest(scene, settings);
    });
    webCamFlow.startCapture();

    // Method to make sure tracker does not leave scene
    function constrainTrackerToScene(scene, tracker) {
        if (tracker.x < 0)            tracker.x = 0;
        if (tracker.x > scene.width)  tracker.x = scene.width;
        if (tracker.y < 0)            tracker.y = 0;
        if (tracker.y > scene.height) tracker.y = scene.height;
    }

    function dist(x1, y1, x2, y2) {
        return Math.sqrt((x1 - x2) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    }

});