// 'use strict';


// Declare app level module which depends on filters, and services
var monsterApp = angular.module('app', ['ui.router', 'ngSanitize']);


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
            .state('monsterball', {
                url: "/monsterball",
                templateUrl: "games/monsterball.html",
                controller: "monsterballCtrl"
            })
            .state('monsterballen', {
                url: "/monsterballen",
                templateUrl: "games/monsterballen.html",
                controller: "monsterballCtrl"
            })
            .state('skaterace', {
                url: "/skaterace",
                templateUrl: "games/skaterace_middle.html",
                controller: "skateraceCtrl"
            })
            .state('skateordie', {
                url: "/skateordie",
                templateUrl: "games/skateordie.html",
                controller: "skateordieCtrl"
            })
            .state('finished', {
                url: "/finished",
                controller: "finishedCtrl"
            })
    });


// ####################################################
// ########          Engine bootstrap          ########
// ####################################################

    monsterApp.run(['$rootScope', '$state', '$stateParams', '$timeout', '$http', function ($rootScope, $state, $stateParams, $timeout, $http) {

        // State hack
        // So we know what our engine is currently doing
        $rootScope.$state       = $state;
        $rootScope.$stateParams = $stateParams;

        $rootScope.$on('$stateChangeSuccess', function(event, toState){
            // Push state to database so we can broadcast it
            $http({
                method: 'PUT',
                url: 'http://teammonster.nl/prototype/c765b101241b7b01',
                data:
                {
                    "state": toState.name
                }
            });
        });


        // ####################################################
        // ########          Engine settings           ########
        // ####################################################

        // FPS meter settings
        $rootScope.meter = new FPSMeter({
            theme:   'transparent',
            heat:    1,
            graph:   1,
            history: 50
        });

        // Engine settings
        $rootScope.engine = {
            debug:                true,
            debugDetection:       true,
            socketEnabled:        true,
            resize:               false,
            fps:                  function() { $('#fpsmeter').toggle();                                   },
            source:               function() { $('#videoSource').toggle();                                },

            detection: {
                enabled:          true,
                frameSkip:        0,
                toggleVisibility: function() { $('#canvas').toggle();                                     },
                mirrorHorizontal: function() { context.translate(canvas.width, 0);  context.scale(-1, 1); },
                mirrorVertical:   function() { context.translate(0, canvas.height); context.scale(1, -1); },
                whiteThreshold:   51,
                confidence:       5,
                debug:            function() { $('#debug').toggle(); }
                },

            areaOfInterest: {
                show:             false,
                x:                0,
                y:                0,
                width:            640,
                height:           480,
                thickness:        2,
                color:            '#16CFDC'
            },

            frameCount:           0,
            skippedFrames:        0
        };


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

            id:             "",

            game:           "",
            winner:         "",

            state:          "",

            score:          0
        };


        // ####################################################
        // ########           Sound settings           ########
        // ####################################################

        // Preload sounds
        createjs.Sound.registerSound("sounds/countdown.ogg", "countdown");
        createjs.Sound.registerSound("sounds/start.ogg",     "start");
        createjs.Sound.registerSound("sounds/win.ogg",       "win");
        createjs.Sound.registerSound("sounds/gameover.ogg",  "gameover");


        // ####################################################
        // ########            DOM settings            ########
        // ####################################################

        var content      = $('#content');
        var video        = $('#webcam')[0];
        var canvases     = $('canvas');

        var canvas       = $("#canvas")[0];
        var debug        = $("#debug")[0];

        var context      = canvas.getContext('2d');
        var debugContext = debug.getContext('2d');


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
            f1.add($rootScope.engine, 'resize');
            f1.add($rootScope.engine, 'fps');
            f1.add($rootScope.engine, 'source');

            f1.add($rootScope.engine, 'frameCount').listen();
            f1.add($rootScope.engine, 'skippedFrames').listen();


            f2 = gui.addFolder('Detection');

            f2.add($rootScope.engine.detection, 'enabled');
            f2.add($rootScope.engine.detection, 'frameSkip',      0, 60);
            f2.add($rootScope.engine.detection, 'toggleVisibility');
            f2.add($rootScope.engine.detection, 'mirrorHorizontal');
            f2.add($rootScope.engine.detection, 'mirrorVertical');
            f2.add($rootScope.engine.detection, 'whiteThreshold', 1, 255);
            f2.add($rootScope.engine.detection, 'confidence',     1, 100);
            f2.add($rootScope.engine.detection, 'debug');


            f3 = gui.addFolder('Input');

            f3.add($rootScope.engine.areaOfInterest, 'show');
            f3.add($rootScope.engine.areaOfInterest, 'x',      0, 640).step(5);
            f3.add($rootScope.engine.areaOfInterest, 'y',      0, 480).step(5);
            f3.add($rootScope.engine.areaOfInterest, 'width',  0, 640).step(5);
            f3.add($rootScope.engine.areaOfInterest, 'height', 0, 480).step(5);


            // General game settings
            /*f4 = gui.addFolder('Game');

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

            f5.add($rootScope.session, 'id').listen();

            f5.add($rootScope.session, 'game').listen();
            f5.add($rootScope.session, 'winner').listen();

            f5.add($rootScope.session, 'state').listen();

            f5.add($rootScope.session, 'score').listen();*/

            gui.closed = true;
        }
        setupGUI();


        // ####################################################
        // ########            Webcam setup            ########
        // ####################################################

        var videoElement = video;
        var videoSelect = document.querySelector("select#videoSource");
        var startButton = document.querySelector("button#start");

        navigator.getUserMedia = navigator.getUserMedia ||
            navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

        function gotSources(sourceInfos) {
            for (var i = 0; i != sourceInfos.length; ++i) {
                var sourceInfo = sourceInfos[i];
                var option = document.createElement("option");
                option.value = sourceInfo.id;
                if (sourceInfo.kind === 'video') {
                    option.text = sourceInfo.label || 'camera ' + (videoSelect.length + 1);
                    videoSelect.appendChild(option);
                } else {
                    console.log('Some other kind of source: ', sourceInfo);
                }
            }
        }

        if (typeof MediaStreamTrack === 'undefined'){
            alert('This browser does not support MediaStreamTrack.\n\nTry Chrome Canary.');
        } else {
            MediaStreamTrack.getSources(gotSources);
        }


        function successCallback(stream) {
            window.stream = stream; // make stream available to console
            videoElement.src = window.URL.createObjectURL(stream);
            videoElement.play();

            startLoop();

            $state.go('idle');

            $rootScope.log('engine', 'Initialized webcam');
        }

        function errorCallback(error){
            console.log("navigator.getUserMedia error: ", error);
        }

        function start(){
            if (!!window.stream) {
                videoElement.src = null;
                window.stream.stop();
            }
            var videoSource = videoSelect.value;
            var constraints = {
                video: {
                    optional: [{sourceId: videoSource}]
                }
            };
            navigator.getUserMedia(constraints, successCallback, errorCallback);
        }

        videoSelect.onchange = start;

        start();


        // ####################################################
        // ########            Resize setup            ########
        // ####################################################

        // Resizes the game and video input so they are lined up
        var resize = function () {
            var ratio = video.width / video.height;
            var w     = $(this).width();
            var h     = $(this).height();

            if($rootScope.engine.resize) {
                if (content.width() > w) {
                    content.width(w);
                    content.height(w / ratio);
                } else {
                    content.height(h);
                    content.width(h * ratio);
                }
                content.css('left', (w - content.width()) / 2);
            } else {
                content.width('100%');
                content.height('100%');
                content.css('left', 0);
            }
            canvases.width(content.width());
            canvases.height(content.height());

            // Update font size
            $('h1').css({'font-size': $(this).height() / 12 +"px"});

            // Update promos
            $('#teampromo').css({'width': $(this).height() / 4 +"px"});
            $('#logitechpromo').css({'width': $(this).height() / 2 +"px"});
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
            //if(!$state.includes("idle")) return;

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
            //if($state.includes("idle")) return;

            delete $rootScope.hotspots;
            $rootScope.hotspots = [];

            var ratio = $("#canvas").width() / $('video').width();
            $('#hotspots').children().each(function (i, el) {
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
            //if($state.includes("idle")) return;

            var hotspots = $rootScope.hotspots;

            if(!$rootScope.engine.detection.enabled) return;

            // Frame skip if needed
            if($rootScope.engine.detection.frameSkip > 0) {
                if($rootScope.engine.skippedFrames >= $rootScope.engine.detection.frameSkip)
                    $rootScope.engine.skippedFrames = 0;
                else {
                    $rootScope.engine.skippedFrames++;
                    return;
                }
            }

            for (var h = 0; h < hotspots.length; h++) {
                // Check if the hotspots location is within the canvas, else skip it
                if(hotspots[h].x < 0) return;
                if(hotspots[h].y < 0) return;

                if((hotspots[h].x + hotspots[h].width)  >  $("#canvas").width()) return;
                if((hotspots[h].y + hotspots[h].height) >  $("#canvas").height()) return;

                var canvasData = context.getImageData(Math.round(hotspots[h].x), Math.round(hotspots[h].y), Math.round(hotspots[h].width), Math.round(hotspots[h].height));
                var i          = 0;
                var white      = 0;
                var confidence = 0;

                // make an average between the color channel
                while (i < (canvasData.data.length * 0.25)) {
                    white = (canvasData.data[i * 4] + canvasData.data[i * 4 + 1] + canvasData.data[i * 4 + 2]) / 3;

                    if(white >= $rootScope.engine.detection.whiteThreshold) confidence++;
                    ++i;

                    // over a small limit, consider that a movement is detected
                    if (confidence > $rootScope.engine.detection.confidence) {
                        $(hotspots[h].el).trigger('hit', hotspots[h].el);

                        // Debug if needed
                        if($rootScope.engine.debugDetection)
                            $rootScope.log('detection', 'Confidence: ' + confidence);
                        else
                            return;

                        debugContext.lineWidth   = 2;
                        debugContext.strokeStyle = "#FFFFFF";

                        debugContext.clearRect(0, 0, debug.width, debug.height);
                        debugContext.strokeRect(Math.round(hotspots[h].x), Math.round(hotspots[h].y), Math.round(hotspots[h].width), Math.round(hotspots[h].height));

                        return;
                    }
                }
            }
        }


        // ####################################################
        // ########         Socket.io settings         ########
        // ####################################################

        // Init socket events
        // Listen for game sessions from server, so we can start the game when needed
        $rootScope.socket.on('session:start', function (session) {
            if(!$rootScope.engine.socketEnabled) return;

            // Only allow start of new games if the game isn't already running one
            if(!$state.includes("idle")) return;

            // Prepare session
            $rootScope.session.id             = session.id;
            $rootScope.session.player         = session.player;
            $rootScope.session.state          = session.state;

            // Get game data from server
            $http({method: 'GET', url: 'http://teammonster.nl/games/' + session.gameID}).
                success(function(game) {
                    $rootScope.game.name       = game.prototype;
                    $rootScope.game.countdown  = game.countdown;
                    $rootScope.game.cooldown   = game.cooldown;
                    $rootScope.game.reset      = game.reset;
                    $rootScope.game.remote     = game.remote;
                    $rootScope.game.conditions = game.conditions;

                    $rootScope.session.id      = session.id;

                    $rootScope.log('socket.io', 'Received game session ' + $rootScope.session.id + ' ' + $rootScope.game.name);

                    if(game.countdown > 0)
                        $state.go('countdown');
                    else
                        $state.go('start');
                }).
                error(function() {
                    $rootScope.log('game', 'Error getting game data for session ' + session.id);

                    $state.go('idle');
                });
        });

        // Listen for game updates from server, in case game needs to be stopped
        $rootScope.socket.on('session:cancel', function (session) {
            if(!$rootScope.engine.socketEnabled) return;

            // Cancel event when not running a game
            if($state.includes("idle") || $state.includes("countdown") || $state.includes("finished")) return;

            $rootScope.log('socket.io', 'Stopped game session ' + session.id);

            $state.go('finished');
        });

    }]);