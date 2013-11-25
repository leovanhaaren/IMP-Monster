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

        console.log('[Engine] Initializing');

        // Connect with the Socket.io server
        $rootScope.socket = io.connect('http://145.89.128.162:2403');
        console.log('[Socket.io] Connected to: http://145.89.128.162:2403');

        // ####################################################
        // ########          Engine settings           ########
        // ####################################################

        // Video input settings
        settings = {
            debug: true,
            detection: {
                mirrorHorizontal: function() {
                    context.translate(canvas.width, 0);
                    context.scale(-1, 1);
                    console.log('[Detection] Flipped horizontally');
                },
                mirrorVertical:   function() {
                    context.translate(0, canvas.height);
                    context.scale(1, -1);
                    console.log('[Detection] Flipped vertically');
                }
            },
            areaOfInterest: {
                x:         85,
                y:         35,
                width:     485,
                height:    420,
                thickness: 2,
                color:     '#16CFDC',
                show:      false
            }
        };

        // FPS meter settings
        meter = new FPSMeter({
            theme:   'transparent',
            heat:    1,
            graph:   1,
            history: 25
        });


        // ####################################################
        // ########           Game settings            ########
        // ####################################################

        // General game settings
        game = {
            debug:          false,
            canvasToggle:   function() { $("#canvas").toggle(); },
            appEnabled:     false,
            whiteThreshold: 250,
            confidence:     15,
            reset:          120
        };

        // Game session settings
        game.session = {
            timer:  0,
            game:   "",
            player: "",
            winner: "",
            score:  0,
            limit:  25,
            frameCount: 0,
            idleCount:  0,
            idleTimer: null
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
        // ########            GUI settings            ########
        // ####################################################

        // DAT.gui setup, for real-time engine parameters
        function setupGUI() {
            console.log('[Engine] Initialized GUI');

            // Define DAT.GUI
            gui = new dat.GUI();

            // Video input settings
            f1 = gui.addFolder('Input');

            f1.add(settings, 'debug').onFinishChange(function(){
                // Clear canvas
                context.clearRect(0, 0, canvas.width, canvas.height);
            });
            f1.add(settings.areaOfInterest, 'x',      0, 640).step(5);
            f1.add(settings.areaOfInterest, 'y',      0, 480).step(5);
            f1.add(settings.areaOfInterest, 'width',  0, 640).step(5);
            f1.add(settings.areaOfInterest, 'height', 0, 480).step(5);
            f1.add(settings.areaOfInterest, 'show');
            f1.add(settings.detection,      'mirrorHorizontal');
            f1.add(settings.detection,      'mirrorVertical');
            f1.open();

            // General game settings
            f2 = gui.addFolder('Game');
            f2.add(game, 'debug');
            f2.add(game, 'canvasToggle');
            f2.add(game, 'appEnabled');
            f2.add(game, 'whiteThreshold', 0, 255);
            f2.add(game, 'confidence');
            f2.add(game, 'reset', 0, 300);

            // Specific game session data
            // Updates based on incoming and/or modified data
            f3 = gui.addFolder('Game session');
            f3.add(game.session, 'timer').listen();
            f3.add(game.session, 'game').listen();
            f3.add(game.session, 'player').listen();
            f3.add(game.session, 'winner').listen();
            f3.add(game.session, 'score').listen();
            f3.add(game.session, 'limit', 0, 50).listen().onFinishChange(function(){
                var player1Limit = game.session.limit;
                var player2Limit = 100 - game.session.limit;

                $(".border1").css("left", player1Limit +'%');
                $(".border2").css("left", player2Limit +'%');
            });
            f3.add(game.session, 'frameCount').listen();
            f3.add(game.session, 'idleCount').listen();
        }

        // ####################################################
        // ########            Webcam setup            ########
        // ####################################################

        // Define webcam error
        var webcamError = function (e) {
            console.log('[Input] Webcam error: ', e);
        };

        // Prepare video stream
        if (navigator.webkitGetUserMedia) {
            navigator.webkitGetUserMedia({video: true}, function (stream) {
                video.src = window.webkitURL.createObjectURL(stream);
                console.log('[Engine] Initialized webcam');

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
            console.log('[Engine] Starting game loop');
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
            game.session.frameCount++;

            // Draw the detection canvas
            draw();

            // Update hotspot in session data
            getHotspots();

            // Check session hotspots for collision with player
            checkHotspots();

            requestAnimFrame(update);

            // FPSmeter
            // Give it a tick to update fps
            meter.tick();
        }

        // Draw function which gets called each iteration
        // Only draws the video input on the canvas
        function draw() {
            // Show AOI only if enabled
            if(settings.areaOfInterest.show) {
                // Draw video input
                context.drawImage(video, 0, 0, video.width, video.height);

                // Draw selection on footage
                context.lineWidth = settings.areaOfInterest.thickness;
                context.strokeStyle = settings.areaOfInterest.color;
                context.strokeRect(settings.areaOfInterest.x, settings.areaOfInterest.y, settings.areaOfInterest.width, settings.areaOfInterest.height);
            } else {
                // Draw video input based on selection
                context.drawImage(video, settings.areaOfInterest.x,
                                         settings.areaOfInterest.y,
                                         settings.areaOfInterest.width,
                                         settings.areaOfInterest.height,
                                         0, 0, canvas.width, canvas.height);
            }
        }


        // ####################################################
        // ########            Hotspot setup           ########
        // ####################################################

        // Gets all hotspots from the scene, so we can later check if players hits one of these
        function getHotspots() {
            hotspots = [];

            $('#hotspots').children().each(function (i, el) {
                var ratio = $("#canvas").width() / $('video').width();
                hotspots[i] = {
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

            for (var h = 0; h < hotspots.length; h++) {
                var canvasData = context.getImageData(hotspots[h].x, hotspots[h].y, hotspots[h].width, hotspots[h].height);
                var i = 0;
                var white = 0;
                var confidence = 0;

                // make an average between the color channel
                while (i < (canvasData.data.length * 0.25)) {
                    white = (canvasData.data[i * 4] + canvasData.data[i * 4 + 1] + canvasData.data[i * 4 + 2]) / 3;

                    if(white >= game.whiteThreshold) confidence++;
                    ++i;
                }
                if(game.debug) console.log(confidence);

                // over a small limit, consider that a movement is detected
                if (confidence > game.confidence) {
                    data = {confidence: confidence, spot: hotspots[h]};
                    $(data.spot.el).trigger('hit', data);
                }
            }
        }

    }]);