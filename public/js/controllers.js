'use strict';

// ####################################################
// ########          Init controller           ########
// ####################################################

    monsterApp.controller('initCtrl', ['$scope', '$rootScope', '$state', '$http', function($scope, $rootScope, $state, $http) {
        $rootScope.log('game', 'Init');

        $rootScope.message = "Zet webcam aan";

        // Init socket events
        // Listen for game sessions from server, so we can start the game when needed
        $rootScope.socket.on('game:start', function (session) {
            if(!$rootScope.engine.socketEnabled) return;

            // Update dat.GUI
            $rootScope.session.durationCount  = 0;
            $rootScope.session.countdownCount = 0;
            $rootScope.session.idleCount      = 0;
            $rootScope.session.player         = session.player;
            $rootScope.session.score          = 0;

            // Get game data from server
            $http({method: 'GET', url: 'http://teammonster.nl:2403/games/' + session.gameID}).
                success(function(game) {
                    $rootScope.game.name       = game.name.toLowerCase().replace(/\s+/g, '');
                    $rootScope.game.countdown  = game.countdown;
                    $rootScope.game.remote     = game.remote;
                    $rootScope.game.reset      = game.reset;
                    $rootScope.game.conditions = game.conditions;

                    $rootScope.log('game', 'Received game data from server');
                }).
                error(function() {
                    $rootScope.log('game', 'Error getting game data');
                });

            $rootScope.log('socket.io', 'Received game session ' + session.id + ' ' + $rootScope.game.name);

            $state.go('countdown');
        });

        // Listen for game updates from server, in case game needs to be stopped
        $rootScope.socket.on('game:update', function (session) {
            if(!$rootScope.engine.socketEnabled) return;

            // Only stop inactive sessions
            if(session.active) return;

            $rootScope.log('socket.io', 'Stopped game session ' + session.id);

            $state.go('finished');
        });
    }]);


// ####################################################
// ########          Idle controller           ########
// ####################################################

    monsterApp.controller('idleCtrl', ['$scope', '$rootScope', function($scope, $rootScope) {
        $rootScope.log('game', 'Idle');

        $rootScope.message = "Selecteer een spel";

        // Update dat.GUI
        $rootScope.session.durationCount  = 0;
        $rootScope.session.countdownCount = 0;
        $rootScope.session.idleCount      = 0;
        $rootScope.session.game           = "";
        $rootScope.session.player         = "";
        $rootScope.session.score          = 0;
    }]);


// ####################################################
// ########        Countdown controller        ########
// ####################################################

    monsterApp.controller('countdownCtrl', ['$scope', '$rootScope', '$state', '$timeout', function($scope, $rootScope, $state, $timeout) {
        // Skip countdown if not needed
        if($rootScope.game.countdown == 0) $state.go('start'); return;

        $rootScope.log('game', 'Counting down');

        // Count down and go to play state
        $rootScope.message = $rootScope.session.countdownCount;

        $scope.timer = function() {
            $rootScope.game.countdownTimer = $timeout(function() {
                $rootScope.session.countdownCount--;
                $rootScope.message = $rootScope.session.countdownCount;

                if($rootScope.session.countdownCount < 1) {
                    $rootScope.log('game', 'Moving to ' + $rootScope.game.name);

                    $rootScope.message = false;

                    $timeout.cancel($rootScope.game.countdownTimer);
                    $state.go('start');
                } else {
                    $rootScope.log('countdown', $rootScope.session.countdownCount);
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

                if($rootScope.session.idleCount >= $rootScope.game.reset) {
                    $rootScope.log('game', 'Player idle for too long, resetting the game');

                    $rootScope.session.idleCount = 0;

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

    monsterApp.controller('finishedCtrl', ['$scope', '$rootScope', '$state', '$timeout', function($scope, $rootScope, $state, $timeout) {
        $rootScope.log('game', 'Finished');

        // Cancel timers
        $timeout.cancel($rootScope.game.durationTimer);
        $timeout.cancel($rootScope.game.countdownTimer);
        $timeout.cancel($rootScope.game.idleTimer);

        $rootScope.message = "Het spel is afgelopen";

        $scope.showScore = function() {
            $timeout(function() {
                if($rootScope.message === "")
                    $rootScope.message = "Je score is " + $rootScope.session.score;

                $scope.goIdle();
            }, 5000);
        };
        $scope.showScore();

        $scope.goIdle = function() {
            $timeout(function() {
                $state.go('idle');
            }, 5000);
        };

    }]);