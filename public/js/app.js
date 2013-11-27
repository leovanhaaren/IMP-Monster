// 'use strict';


// Declare app level module which depends on filters, and services
var monsterApp = angular.module('app', ['ui.router']);


// ####################################################
// ########           Engine config            ########
// ####################################################

    monsterApp.config(function($stateProvider, $urlRouterProvider) {
        //
        // For any unmatched url, redirect to /state1
        $urlRouterProvider.otherwise("/init");
        //
        // Now set up the states
        $stateProvider
            .state('init', {
                url: "/init",
                controller: "initCtrl"
            })
            .state('idle', {
                url: "/idle",
                controller: "idleCtrl"
            })
            .state('countdown', {
                url: "/countdown",
                controller: "countdownCtrl"
            })
            .state('start', {
                url: "/start",
                controller: "startCtrl"
            })
            .state('prototype01', {
                url: "/prototype01",
                templateUrl: "games/prototype01.html",
                controller: "prototype01Ctrl"
            })
            .state('prototype02', {
                url: "/prototype02",
                templateUrl: "games/prototype02.html",
                controller: "prototype01Ctrl"
            })
            .state('skaterace', {
                url: "/skaterace",
                templateUrl: "games/skaterace.html",
                controller: "skateraceCtrl"
            })
            .state('finished', {
                url: "/finished",
                controller: "finishedCtrl"
            })
    });


// ####################################################
// ########          Engine bootstrap          ########
// ####################################################

    monsterApp.run(['$rootScope', '$state', '$stateParams', function ($rootScope, $state, $stateParams) {

        // State hack
        // So we know what our engine is currently doing
        $rootScope.$state       = $state;
        $rootScope.$stateParams = $stateParams;


        // ####################################################
        // ########          Engine settings           ########
        // ####################################################

        // Engine settings
        $rootScope.engine = {
            debug:                true,
            debugDetection:       false,

            socketEnabled:        true,

            detection: {
                show:             true,
                mirrorHorizontal: function() { context.translate(canvas.width, 0);  context.scale(-1, 1); },
                mirrorVertical:   function() { context.translate(0, canvas.height); context.scale(1, -1); },
                whiteThreshold:   225,
                confidence:       15
            },

            areaOfInterest: {
                show:             false,
                x:                85,
                y:                35,
                width:            485,
                height:           420,
                thickness:        2,
                color:            '#16CFDC'
            },

            frameCount:           0
        };

        // FPS meter settings
        $rootScope.meter = new FPSMeter({
            theme:   'transparent',
            heat:    1,
            graph:   1,
            history: 25
        });


        // ####################################################
        // ########           Game settings            ########
        // ####################################################

        // General game settings
        $rootScope.game = {
            name:           "",
            countdown:      0,
            remote:         false,
            reset:          0,
            cooldown:       0,

            conditions: {
                time:       120,
                score:      50,
                area:       10
            },

            durationTimer:  null,
            countdownTimer: null,
            idleTimer:      null
        };

        // Session settings
        $rootScope.session = {
            durationCount:  0,
            countdownCount: 0,
            idleCount:      0,

            game:           "",
            player:         "",

            score:          0
        };


        // ####################################################
        // ########            DOM settings            ########
        // ####################################################

        var content  = $('#content');
        var video    = $('#webcam')[0];
        var canvases = $('canvas');

        var canvas   = $("#canvas")[0];

        var context  = canvas.getContext('2d');


        // ####################################################
        // ########          Logging functions         ########
        // ####################################################

        $rootScope.log = function(type, msg) {
            if($rootScope.engine.debug)
                console.log('[' + type.toUpperCase() + '] ' + msg);
        }


        // ####################################################
        // ########       External dependencies        ########
        // ####################################################

        // Connect with the Socket.io server
        $rootScope.socket = io.connect('http://teammonster.nl:2403');

        $rootScope.socket.on('connect', function () {
            $rootScope.log('socket.io', 'Connected to server');
        });


        // ####################################################
        // ########            GUI settings            ########
        // ####################################################

        // DAT.gui setup, for real-time engine parameters
        function setupGUI() {
            $rootScope.log('engine', 'Initialized GUI');

            // Define DAT.GUI
            gui = new dat.GUI();

            // Video input settings
            f1 = gui.addFolder('Engine');

            f1.add($rootScope.engine, 'debug');
            f1.add($rootScope.engine, 'debugDetection');

            f1.add($rootScope.engine, 'socketEnabled');

            f1.add($rootScope.engine, 'frameCount').listen();


            f2 = gui.addFolder('Detection');

            f2.add($rootScope.engine.detection, 'show');
            f2.add($rootScope.engine.detection, 'mirrorHorizontal');
            f2.add($rootScope.engine.detection, 'mirrorVertical');
            f2.add($rootScope.engine.detection, 'whiteThreshold', 1, 255);
            f2.add($rootScope.engine.detection, 'confidence',     1, 100);


            f3 = gui.addFolder('Input');

            f3.add($rootScope.engine.areaOfInterest, 'show');
            f3.add($rootScope.engine.areaOfInterest, 'x',      0, 640).step(5);
            f3.add($rootScope.engine.areaOfInterest, 'y',      0, 480).step(5);
            f3.add($rootScope.engine.areaOfInterest, 'width',  0, 640).step(5);
            f3.add($rootScope.engine.areaOfInterest, 'height', 0, 480).step(5);


            // General game settings
            f4 = gui.addFolder('Game');

            f4.add($rootScope.game, 'name').listen();
            f4.add($rootScope.game, 'countdown').listen();
            f4.add($rootScope.game, 'cooldown').listen();
            f4.add($rootScope.game, 'reset').listen();
            f4.add($rootScope.game, 'remote').listen();


            // Specific game session data
            // Updates based on incoming and/or modified data
            f5 = gui.addFolder('Session');

            f5.add($rootScope.session, 'durationCount').listen();
            f5.add($rootScope.session, 'countdownCount').listen();
            f5.add($rootScope.session, 'idleCount').listen();

            f5.add($rootScope.session, 'game').listen();
            f5.add($rootScope.session, 'player').listen();

            f5.add($rootScope.session, 'score').listen();
        }


        // ####################################################
        // ########            Webcam setup            ########
        // ####################################################

        // Define webcam error
        var webcamError = function (e) {
            $rootScope.log('input', 'Webcam error: ' + e);
        };

        // Prepare video stream
        if (navigator.webkitGetUserMedia) {
            navigator.webkitGetUserMedia({video: true}, function (stream) {
                video.src = window.webkitURL.createObjectURL(stream);

                $rootScope.log('engine', 'Initialized webcam');

                setupGUI();
                startLoop();

                $state.go('idle');
            }, webcamError);
        }


        // ####################################################
        // ########            Resize setup            ########
        // ####################################################

        // Resizes the game and video input so they are lined up
        var resize = function () {
            var ratio = video.width / video.height;
            var w     = $(this).width();
            var h     = $(this).height();

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


        // ####################################################
        // ########              Game loop             ########
        // ####################################################

        // Entry point for the loop
        function startLoop() {
            $rootScope.log('engine', 'Starting game loop');

            update();
        }

        // The loop itself
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

        // Update function which gets called each iteration
        function update() {
            // Raise framecount
            $rootScope.engine.frameCount++;

            // Draw the detection canvas
            draw();

            // Update hotspot in session data
            getHotspots();

            // Check session hotspots for collision with player
            checkHotspots();

            requestAnimFrame(update);

            // FPSmeter
            // Give it a tick to update fps
            $rootScope.meter.tick();
        }

        // Draw function which gets called each iteration
        // Only draws the video input on the canvas when detection is enabled
        function draw() {
            if(!$rootScope.engine.detection.show) return;

            // Show AOI only if enabled
            if($rootScope.engine.areaOfInterest.show) {
                // Draw video input
                context.drawImage(video, 0, 0, video.width, video.height);

                // Draw selection on footage
                context.lineWidth   = $rootScope.engine.areaOfInterest.thickness;
                context.strokeStyle = $rootScope.engine.areaOfInterest.color;

                context.strokeRect( $rootScope.engine.areaOfInterest.x,
                                    $rootScope.engine.areaOfInterest.y,
                                    $rootScope.engine.areaOfInterest.width,
                                    $rootScope.engine.areaOfInterest.height );
            } else {
                // Draw video input based on selection
                context.drawImage(video, $rootScope.engine.areaOfInterest.x,
                                         $rootScope.engine.areaOfInterest.y,
                                         $rootScope.engine.areaOfInterest.width,
                                         $rootScope.engine.areaOfInterest.height,
                                         0, 0, canvas.width, canvas.height);
            }
        }


        // ####################################################
        // ########            Hotspot setup           ########
        // ####################################################

        // Gets all hotspots from the scene, so we can later check if players hits one of these
        function getHotspots() {
            $rootScope.hotspots = [];

            $('#hotspots').children().each(function (i, el) {
                var ratio = $("#canvas").width() / $('video').width();
                $rootScope.hotspots[i] = {
                    x:      this.offsetLeft   / ratio,
                    y:      this.offsetTop    / ratio,
                    width:  this.scrollWidth  / ratio,
                    height: this.scrollHeight / ratio,
                    el:     el
                };
            });
        }


        // ####################################################
        // ########        Hotspot hit detection       ########
        // ####################################################

        // Checks a portion of the canvas, based on the objects dimensions
        // Will trigger a hit event when player hits a object based on threshold
        function checkHotspots() {
            var data;
            var hotspots = $rootScope.hotspots;

            for (var h = 0; h < hotspots.length; h++) {
                var canvasData = context.getImageData(hotspots[h].x, hotspots[h].y, hotspots[h].width, hotspots[h].height);
                var i = 0;
                var white = 0;
                var confidence = 0;

                // make an average between the color channel
                while (i < (canvasData.data.length * 0.25)) {
                    white = (canvasData.data[i * 4] + canvasData.data[i * 4 + 1] + canvasData.data[i * 4 + 2]) / 3;

                    if(white >= $rootScope.engine.detection.whiteThreshold) confidence++;
                    ++i;
                }

                // over a small limit, consider that a movement is detected
                if (confidence > $rootScope.engine.detection.confidence) {
                    data = {
                        confidence: confidence,
                        spot: hotspots[h]
                    };

                    $(data.spot.el).trigger('hit', data);
                }
            }
        }

    }]);