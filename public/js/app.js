// 'use strict';


// Declare app level module which depends on filters, and services
angular.module('app', [
  'ui.router',
  'filters',
  'services',
  'directives',
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
            .state('play', {
                url: "/play",
                //templateUrl: "partials/testgame.html",
                controller: "playCtrl"
            })
    }).
    run(['$rootScope', '$state', '$stateParams', function ($rootScope, $state, $stateParams) {
        // state hack
        $rootScope.$state       = $state;
        $rootScope.$stateParams = $stateParams;

        console.log('[Engine] Initializing.');

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
                x: 85,
                y: 35,
                width: 485,
                height: 420,
                thickness: 2,
                color: '#16CFDC',
                toggle: function() { $("#input").toggle(); }
            },
            toggleFullscreen: function() {
                if (screenfull.enabled) {
                    screenfull.toggle($('body')[0]);
                    console.log('[Window] Toggling fullscreen mode.');
                }
            }
        };

        // FPS meter
        meter = new FPSMeter({
            theme: 'transparent',
            heat:  1,
            graph: 1,
            history: 25
        });


        // ####################################################
        // ########           Game settings            ########
        // ####################################################

        game = {
            debug: false,
            threshold: 50,
            frameCount: 0
        };

        game.session = {
            game: "",
            player: "",
            hotspots: [],
            score: 0
        };

        // ####################################################
        // ########            HTML settings           ########
        // ####################################################

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


        function setupGUI() {
            console.log('[Engine] Initialized GUI.');

            // Define DAT.GUI
            gui = new dat.GUI();
            //var gui = new dat.GUI({ autoPlace: false });
            //$('#content').append(gui.domElement);

            f1 = gui.addFolder('Input');
            // Area settings
            f1.add(settings, 'debug').onFinishChange(function(){
                // Clear canvas
                contextInput.clearRect(0, 0, canvasInput.width, canvasInput.height);
                contextDetection.clearRect(0, 0, canvasDetection.width, canvasDetection.height);
            });
            f1.add(settings.areaOfInterest, 'x', 0, 640).step(5);
            f1.add(settings.areaOfInterest, 'y', 0, 480).step(5);
            f1.add(settings.areaOfInterest, 'width', 0, 640).step(5);
            f1.add(settings.areaOfInterest, 'height', 0, 480).step(5);

            // Line settings
            f1.add(settings.areaOfInterest, 'toggle');
            f1.add(settings.detection, 'mirrorHorizontal');
            f1.add(settings.detection, 'mirrorVertical');
            f1.add(settings, 'toggleFullscreen');
            f1.open();

            f2 = gui.addFolder('Game');
            f2.add(game, 'debug');
            f2.add(game, 'threshold', 0, 255);
            f2.add(game, 'frameCount').listen();

            f3 = gui.addFolder('Game session');
            f3.add(game.session, 'game').listen();
            f3.add(game.session, 'player').listen();
            f3.add(game.session, 'score').listen();
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
                console.log('[Engine] Initialized webcam.');

                setupGUI();
                startLoop();

                $state.go('idle');
            }, webcamError);
        }


        // ####################################################
        // ########            Resize setup            ########
        // ####################################################

        var resize = function () {
            //console.log('[Engine] Resizing.');

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


        // ####################################################
        // ########              Game loop             ########
        // ####################################################

        function startLoop() {
            console.log('[Engine] Starting game loop.');
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
            hotspots = [];

            $('#hotspots').children().each(function (i, el) {
                var ratio = $("#detection").width() / $('video').width();
                hotspots[i] = {
                    x:      this.offsetLeft   / ratio,
                    y:      this.offsetTop    / ratio,
                    width:  this.scrollWidth  / ratio,
                    height: this.scrollHeight / ratio,
                    el:     el
                };

                //var rect = el.getBoundingClientRect();
                //if(game.debug) console.log('[hotspot] ' + rect.top, rect.right, rect.bottom, rect.left);
            });
        }

        function checkHotspots() {
            var data;

            if(hotspots.length < 1) return;
            for (var h = 0; h < hotspots.length; h++) {
                var canvasData = contextDetection.getImageData(hotspots[h].x, hotspots[h].y, hotspots[h].width, hotspots[h].height);
                var i = 0;
                var average = 0;

                // make an average between the color channel
                while (i < (canvasData.data.length * 0.25)) {
                    average += (canvasData.data[i * 4] + canvasData.data[i * 4 + 1] + canvasData.data[i * 4 + 2]) / 3;
                    ++i;
                }
                // calculate an average between the color values of the spot area
                average = Math.round(average / (canvasData.data.length * 0.25));

                if(game.debug) console.log(average);

                // over a small limit, consider that a movement is detected
                if (average > game.threshold) {
                    data = {confidence: average, spot: hotspots[h]};

                    $(data.spot.el).trigger('hit', data);
                }
            }
        }

    }]);
