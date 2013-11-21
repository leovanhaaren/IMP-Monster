// 'use strict';


// Declare app level module which depends on filters, and services
angular.module('app', [
  'ui.router',
  'controllers'
]).
config(function($stateProvider, $urlRouterProvider) {
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
            .state('prototype01', {
                url: "/prototype01",
                templateUrl: "games/prototype01.html",
                controller: "prototype01Ctrl"
            })
            .state('prototype02', {
                url: "/prototype02",
                templateUrl: "games/prototype02.html",
                controller: "prototype02Ctrl"
            })
            .state('finished', {
                url: "/finished",
                controller: "finishedCtrl"
            })
    }).
    run(['$rootScope', '$state', '$stateParams', function ($rootScope, $state, $stateParams) {
        // state hack
        $rootScope.$state       = $state;
        $rootScope.$stateParams = $stateParams;

        console.log('[Engine] Initializing');

        // Socket io
        $rootScope.socket = io.connect('http://145.89.128.106:2403');
        console.log('[Socket.io] Connected to: http://145.89.128.106:2403');

        // ####################################################
        // ########          Engine settings           ########
        // ####################################################

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

        // FPS meter
        meter = new FPSMeter({
            theme:   'transparent',
            heat:    1,
            graph:   1,
            history: 25
        });


        // ####################################################
        // ########           Game settings            ########
        // ####################################################

        game = {
            debug:          false,
            canvasToggle:   function() { $("#canvas").toggle(); },
            appEnabled:     false,
            whiteThreshold: 225,
            confidence:     5,
            reset:          60,
            frameCount:     0,
            idleCount:      0
        };

        game.session = {
            game:   "",
            player: "",
            score:  0,
            limit:  25
        };

        // ####################################################
        // ########            HTML settings           ########
        // ####################################################

        var content  = $('#content');
        var video    = $('#webcam')[0];
        var canvases = $('canvas');

        var canvas   = $("#canvas")[0];

        var context  = canvas.getContext('2d');


        // ####################################################
        // ########            GUI settings            ########
        // ####################################################


        function setupGUI() {
            console.log('[Engine] Initialized GUI');

            // Define DAT.GUI
            gui = new dat.GUI();

            f1 = gui.addFolder('Input');
            // Area settings
            f1.add(settings, 'debug').onFinishChange(function(){
                // Clear canvas
                context.clearRect(0, 0, canvas.width, canvas.height);
            });
            f1.add(settings.areaOfInterest, 'x',      0, 640).step(5);
            f1.add(settings.areaOfInterest, 'y',      0, 480).step(5);
            f1.add(settings.areaOfInterest, 'width',  0, 640).step(5);
            f1.add(settings.areaOfInterest, 'height', 0, 480).step(5);

            // Line settings
            f1.add(settings.areaOfInterest, 'show');
            f1.add(settings.detection,      'mirrorHorizontal');
            f1.add(settings.detection,      'mirrorVertical');
            f1.open();

            f2 = gui.addFolder('Game');
            f2.add(game, 'debug');
            f2.add(game, 'canvasToggle');
            f2.add(game, 'appEnabled');
            f2.add(game, 'whiteThreshold', 0, 255);
            f2.add(game, 'confidence');
            f2.add(game, 'reset', 0, 120);
            f2.add(game, 'frameCount').listen();
            f2.add(game, 'idleCount').listen();

            f3 = gui.addFolder('Game session');
            f3.add(game.session, 'game').listen();
            f3.add(game.session, 'player').listen();
            f3.add(game.session, 'score').listen();
            f3.add(game.session, 'limit').listen();
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

        function startLoop() {
            console.log('[Engine] Starting game loop');
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

            // Draw the detection canvas
            draw();

            // Update hotspot in session data
            getHotspots();

            // Check session hotspots for collision with player
            checkHotspots();

            requestAnimFrame(update);

            // Check performance
            meter.tick();
        }

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