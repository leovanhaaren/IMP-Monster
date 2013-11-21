'use strict';

/* Controllers */

angular.module('controllers', []).
    controller('initCtrl', ['$scope', '$rootScope', function($scope, $rootScope) {
        console.log('[Game] Init.');

        $rootScope.message = "Zet webcam aan";
    }]).

    controller('idleCtrl', ['$scope', '$rootScope', '$state', function($scope, $rootScope, $state) {
        console.log('[Game] Idle.');

        $rootScope.message = "Selecteer een spel";

        // Update dat.GUI
        game.session.game   = "";
        game.session.player = "";
        game.session.score  = 0;

        f1.close();
        f2.close();
        f3.close();

        $rootScope.socket.on('game:start', function (session) {
            console.log('[Socket.io] Received game session: ' + session.id);
            if(session.player != "test") return;

            // Update dat.GUI
            game.session.game   = session.gameName;
            game.session.player = session.player;
            game.session.score  = 0;

            $state.go('countdown');
        });
    }]).

    controller('countdownCtrl', ['$scope', '$rootScope', '$state', '$timeout', function($scope, $rootScope, $state, $timeout) {
        console.log('[Game] Counting down.');

        f1.close();
        f2.close();
        f3.open();

        // Count down and go to play state
        var timer
        $rootScope.message = 5;

        $scope.timer = function() {
            timer = $timeout(function() {
                console.log('[Game] ' + $rootScope.message);

                $rootScope.message--;
                if($rootScope.message < 1) {
                    $timeout.cancel(timer);
                    $state.go('play');
                } else
                    $scope.timer();
            }, 1000);
        };
        $scope.timer();
    }]).

    controller('gameCtrl', ['$scope', '$rootScope', '$state', '$timeout', function($scope, $rootScope, $state, $timeout) {
        console.log('[Game] Playing.');

        game.frameCount = 0;

        f3.open();

        // When object is hit, assign the score to player
        $(window).on('hit', function(ev, data){
            console.log('[Game] Player scored.');

            // Reset idle timer
            game.idleCount = 0;

            // Get data from object and remove it from scene
            var id    = $(data.spot.el).attr('id');
            var score = $(data.spot.el).html();
            $(data.spot.el).remove();

            // Update score
            game.session.score += parseInt(score);

            if(game.session.score >= game.session.limit){
                $timeout.cancel(timer);

                hotspots = [];
                $state.go('finished');
            } else
                setTimeout(function () {
                    $('#hotspots').append('<div id="' + id + '">' + score + '</div>');
                }, 5000);
        });

        // Listen for game updates from server, in case game needs to be stopped
        $rootScope.socket.on('game:update', function (session) {
            if(session.active) return;
            if(session.player != "test") return;

            console.log('[Socket.io] Stopped game session: ' + session.id);

            $state.go('idle');
        });

        // And finally add a counter that checks if player is idle for too long
        var timer
        $scope.timer = function() {
            timer = $timeout(function() {
                game.idleCount++;

                if(game.idleCount >= game.reset) {
                    console.log('[Game] Player idle for too long, resetting game.');
                    game.idleCount = 0;

                    $timeout.cancel(timer);

                    hotspots = [];
                    $state.go('idle');
                } else
                    $scope.timer();
            }, 1000);
        };
        $scope.timer();
    }]).
    controller('finishedCtrl', ['$scope', '$rootScope', '$state', '$timeout', function($scope, $rootScope, $state, $timeout) {
        console.log('[Game] Finished.');

        $rootScope.message = "Het spel is afgelopen";

        setTimeout(function () {
            // Countdown on screen
            var timer
            $rootScope.message = 10;

            $scope.timer = function() {
                timer = $timeout(function() {
                    console.log('[Game] Resetting in ' + $rootScope.message + '.');
                    $rootScope.message--;

                    if($rootScope.message < 1) {
                        console.log('[Game] Timer expired, moving to idle.');

                        $timeout.cancel(timer);
                        $state.go('idle');
                    } else
                        $scope.timer();
                }, 1000);
            };
            $scope.timer();
        }, 10000);
    }]);