/**
 * Created by Leo on 11/11/13.
 */

(function () {

    // ####################################################
    // ########          Engine settings           ########
    // ####################################################

    settings = {
        debug: true,
        detection: {
            mirrorHorizontal: function() {
                contextDetection.translate(canvasDetection.width, 0);
                contextDetection.scale(-1, 1);
                console.log('[Detection] Flipped horizontally.');
            },
            mirrorVertical:   function() {
                contextDetection.translate(0, canvasDetection.height);
                contextDetection.scale(1, -1);
                console.log('[Detection] Flipped vertically.');
            }
        },
        areaOfInterest: {
            x: 0,
            y: 0,
            width: 640,
            height: 480,
            thickness: 2,
            color: '#16CFDC',
            toggle: function() { $("#input").toggle(); }
        }
    };

    // FPS meter
    meter = new FPSMeter({
        theme: 'transparent',
        heat:  1,
        graph:   1,
        history: 25
    });

    // Socket io
    socket = io.connect('http://145.89.128.95:2403');

    // ####################################################
    // ########           Game settings            ########
    // ####################################################

    game = {
        debug: true,
        toggleFullscreen: function() {
            if (screenfull.enabled) {
                screenfull.toggle($('body')[0]);
                console.log('[Window] Toggling fullscreen mode.');
            }
        },
        frameCount: 0
    };


    // ####################################################
    // ########            HTML settings           ########
    // ####################################################

    var hotSpots = [];

    var content  = $('#content');
    var video    = $('#webcam')[0];
    var canvases = $('canvas');

    var canvasInput     = $("#input")[0];
    var canvasDetection = $("#detection")[0];

    var contextInput     = canvasInput.getContext('2d');
    var contextDetection = canvasDetection.getContext('2d');


    // ####################################################
    // ########            GUI settings            ########
    // ####################################################

    // Define DAT.GUI
    var gui = new dat.GUI();
    //var gui = new dat.GUI({ autoPlace: false });
    //$('#content').append(gui.domElement);

    var f1 = gui.addFolder('Input');
    // Area settings
    f1.add(settings.areaOfInterest, 'x', 0, 640).step(5);
    f1.add(settings.areaOfInterest, 'y', 0, 480).step(5);
    f1.add(settings.areaOfInterest, 'width', 0, 640).step(5);
    f1.add(settings.areaOfInterest, 'height', 0, 480).step(5);

    // Line settings
    f1.add(settings.areaOfInterest, 'toggle');
    //f1.addColor(settings.areaOfInterest, 'color');
    f1.open();

    var f2 = gui.addFolder('Detection');
    f2.add(settings.detection, 'mirrorHorizontal');
    f2.add(settings.detection, 'mirrorVertical');
    f2.open();

    var f3 = gui.addFolder('Game');
    f3.add(game, 'debug');
    f3.add(game, 'toggleFullscreen');
    f3.add(game, 'frameCount').listen();
    f3.open();


    // ####################################################
    // ########            Webcam setup            ########
    // ####################################################

    // Define webcam error
    var webcamError = function (e) {
        console.log('[Input] Webcam error: ', e);
    };

    // Prepare video stream
    if (navigator.getUserMedia) {
        navigator.getUserMedia({video: true}, function (stream) {
            video.src = stream;
            initialize();
        }, webcamError);
    } else if (navigator.webkitGetUserMedia) {
        navigator.webkitGetUserMedia({video: true}, function (stream) {
            video.src = window.webkitURL.createObjectURL(stream);
            initialize();
        }, webcamError);
    }


    // ####################################################
    // ########              Game loop             ########
    // ####################################################

    function initialize() {
        console.log('[Game] Initializing.');
        start();
    }

    function start() {
        console.log('[Game] Starting.');
        update();
    }

    window.requestAnimFrame = (function () {
        return window.requestAnimationFrame       ||
               window.webkitRequestAnimationFrame ||
               window.mozRequestAnimationFrame    ||
               window.oRequestAnimationFrame      ||
               window.msRequestAnimationFrame     ||
               function (callback) {
                   window.setTimeout(callback, 1000 / 60);
               };
    })();

    function update() {
        game.frameCount++;

        draw();
        getHotspots();

        requestAnimFrame(update);
        meter.tick();
    }

    function draw() {
        contextInput.drawImage(video, 0, 0, video.width, video.height);

        // Display canvas name
        contextInput.font = "16pt Arial";
        contextInput.fillStyle = "white";
        contextInput.fillText("Input", 570, 30);

        // Draw selection
        contextInput.lineWidth = settings.areaOfInterest.thickness;
        contextInput.strokeStyle = settings.areaOfInterest.color;
        contextInput.strokeRect(settings.areaOfInterest.x, settings.areaOfInterest.y, settings.areaOfInterest.width, settings.areaOfInterest.height);

        // Draw selection on detection canvas
        contextDetection.drawImage(video, settings.areaOfInterest.x,
                                          settings.areaOfInterest.y,
                                          settings.areaOfInterest.width,
                                          settings.areaOfInterest.height,
                                          0,0,canvasDetection.width, canvasDetection.height);

        // Display canvas name
        contextDetection.font = "16pt Arial";
        contextDetection.fillStyle = "white";
        contextDetection.fillText("Detection", 530, 30);
    }


    // ####################################################
    // ########            Hotspot setup           ########
    // ####################################################

    function getHotspots() {
        $('#hotSpots').children().each(function (i, el) {
            var ratio = $("#detection").width() / $('video').width();
            hotSpots[i] = {
                x:      this.offsetLeft / ratio,
                y:      this.offsetTop / ratio,
                width:  this.scrollWidth / ratio,
                height: this.scrollHeight / ratio,
                el:     el
            };
        });
    }


    // ####################################################
    // ########            Resize setup            ########
    // ####################################################

    var resize = function () {
        var ratio = video.width / video.height;
        var w = $(this).width();
        var h = $(this).height();

        if (content.width() > w) {
            content.width(w);
            content.height(w / ratio);
        } else {
            content.height(h);
            content.width(h * ratio);
        }
        canvases.width(content.width());
        canvases.height(content.height());
        content.css('left', (w - content.width()) / 2);
    }
    $(window).resize(resize);
    $(window).ready(function () {
        resize();
    });

})();