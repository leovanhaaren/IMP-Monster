'use strict';

// ####################################################
// ########          Init controller           ########
// ####################################################

    monsterApp.controller('initCtrl', ['$scope', '$rootScope', '$state', '$timeout', '$http', function($scope, $rootScope, $state, $timeout, $http) {
        $rootScope.log('game', 'Init');

        $rootScope.message = "Zet webcam aan";

        // Init socket events
        // Listen for game sessions from server, so we can start the game when needed
        $rootScope.socket.on('session:start', function (session) {
            if(!$rootScope.engine.socketEnabled) return;

            // Cancel timers
            $timeout.cancel($rootScope.game.durationTimer);
            $timeout.cancel($rootScope.game.countdownTimer);
            $timeout.cancel($rootScope.game.idleTimer);

            // Remove event handler
            $(window).off('tick');

            // Prepare session
            $rootScope.session.id             = session.id;
            $rootScope.session.durationCount  = 0;
            $rootScope.session.countdownCount = 0;
            $rootScope.session.idleCount      = 0;
            $rootScope.session.player         = session.player;
            $rootScope.session.state          = session.state;
            $rootScope.session.score          = 0;

            // Get game data from server
            $http({method: 'GET', url: 'http://teammonster.nl/games/' + session.gameID}).
                success(function(game) {
                    $rootScope.game.name       = game.prototype;
                    $rootScope.game.countdown  = game.countdown;
                    $rootScope.game.cooldown   = game.cooldown;
                    $rootScope.game.reset      = game.reset;
                    $rootScope.game.remote     = game.remote;
                    $rootScope.game.conditions = game.conditions;

                    $rootScope.log('socket.io', 'Received game session ' + session.id + ' ' + $rootScope.game.name);

                    $state.go('countdown');
                }).
                error(function() {
                    $rootScope.log('game', 'Error getting game data for session ' + session.id);

                    $state.go('idle');
                });
        });

        // Listen for game updates from server, in case game needs to be stopped
        $rootScope.socket.on('session:cancel', function (session) {
            if(!$rootScope.engine.socketEnabled) return;

            // Cancel event when countdown is not finished yet
            if($rootScope.session.countdownCount > 0) return;

            $rootScope.log('socket.io', 'Stopped game session ' + session.id);

            $state.go('finished');
        });
    }]);


// ####################################################
// ########          Idle controller           ########
// ####################################################

    monsterApp.controller('idleCtrl', ['$scope', '$rootScope', function($scope, $rootScope) {
        $rootScope.log('game', 'Idle');

        $rootScope.message = "Selecteer een spel<br/>op de tablet";

        // Reset dat.GUI
        $rootScope.session.id             = "";
        $rootScope.session.durationCount  = 0;
        $rootScope.session.countdownCount = 0;
        $rootScope.session.idleCount      = 0;
        $rootScope.session.game           = "";
        $rootScope.session.player         = "";
        $rootScope.session.state          = "";
        $rootScope.session.score          = 0;
    }]);


// ####################################################
// ########        Countdown controller        ########
// ####################################################

    monsterApp.controller('countdownCtrl', ['$scope', '$rootScope', '$state', '$timeout', function($scope, $rootScope, $state, $timeout) {
        // Skip countdown if not needed
        if($rootScope.game.countdown == 0) {
            $state.go('start');
            return;
        }

        $rootScope.log('game', 'Counting down');

        // Count down and go to play state
        $rootScope.session.countdownCount = $rootScope.game.countdown;
        $rootScope.message = $rootScope.session.countdownCount.toString();

        $scope.timer = function() {
            $rootScope.game.countdownTimer = $timeout(function() {
                $rootScope.message = $rootScope.session.countdownCount.toString();

                if($rootScope.session.countdownCount < 1) {
                    $rootScope.log('game', 'Moving to ' + $rootScope.game.name);

                    $rootScope.message = false;

                    $timeout.cancel($rootScope.game.countdownTimer);
                    $state.go('start');
                } else {
                    $rootScope.log('countdown', $rootScope.session.countdownCount);

                    $rootScope.session.countdownCount--;
                    $scope.timer();
                }
            }, 1000);
        };
        $scope.timer();
    }]);


// ####################################################
// ########       Game start controller        ########
// ####################################################

    monsterApp.controller('startCtrl', ['$scope', '$rootScope', '$state', '$timeout', function($scope, $rootScope, $state, $timeout) {
        $rootScope.log('game', 'Init game');

        // Init idle timer
        $scope.timer = function() {
            $rootScope.game.idleTimer = $timeout(function() {
                $rootScope.session.durationCount++;
                $rootScope.session.idleCount++;

                // Broadcast a tick for the minigames to raise score
                $(window).trigger('tick');

                if($rootScope.session.idleCount >= $rootScope.game.reset) {
                    $rootScope.log('game', 'Player idle for too long, resetting the game');

                    $timeout.cancel($rootScope.game.idleTimer);

                    $state.go('idle');
                } else
                    $scope.timer();
            }, 1000);
        };
        $scope.timer();

        // Move to game
        $state.go($rootScope.game.name);
    }]);


// ####################################################
// ########        Game end controller         ########
// ####################################################

    monsterApp.controller('finishedCtrl', ['$scope', '$rootScope', '$state', '$timeout', '$compile', '$http', function($scope, $rootScope, $state, $timeout, $compile, $http) {
        $rootScope.log('game', 'Finished');

        // Cancel timers
        $timeout.cancel($rootScope.game.durationTimer);
        $timeout.cancel($rootScope.game.countdownTimer);
        $timeout.cancel($rootScope.game.idleTimer);

        // Remove event handler
        $(window).off('tick');

        // Update message if empty
        if($rootScope.message == "")
            $rootScope.message = "Het spel is afgelopen";

        // Update score and state
        $http({
            method: 'POST',
            url: 'http://teammonster.nl/gamesessions/' + $rootScope.session.id,
            data:
            {
                "score": $rootScope.session.score,
                "state": "ended"
            }
        });

        // Go to idle state after cooldown has expired
        $scope.timer = function() {
            $timeout(function() {
                $state.go('idle');
            }, $rootScope.game.cooldown * 1000);
        };
        $scope.timer();
    }]);