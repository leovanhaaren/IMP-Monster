'use strict';

// ####################################################
// ########          Init controller           ########
// ####################################################

    monsterApp.controller('initCtrl', ['$scope', '$rootScope', '$state', function($scope, $rootScope, $state) {
        console.log('[Game] Init');

        $rootScope.message = "Zet webcam aan";

        // Init socket events

        // Listen for game sessions from server, so we can start the game when needed
        $rootScope.socket.on('game:start', function (session) {
            console.log('[Socket.io] Received game session: ' + session.id);
            if(session.player != "test") return;

            // Update dat.GUI
            game.session.game       = session.gameName;
            game.session.player     = session.player;
            game.session.score      = 0;
            game.session.frameCount = 0;

            $state.go('countdown');
        });

        // Listen for game updates from server, in case game needs to be stopped
        $rootScope.socket.on('game:update', function (session) {
            if(session.active) return;
            if(session.player != "test") return;

            console.log('[Socket.io] Stopped game session: ' + session.id);

            $state.go('idle');
        });
    }]);


// ####################################################
// ########          Idle controller           ########
// ####################################################

    monsterApp.controller('idleCtrl', ['$scope', '$rootScope', function($scope, $rootScope) {
        console.log('[Game] Idle');

        $rootScope.message = "Selecteer een spel";

        // Update dat.GUI
        game.session.game   = "";
        game.session.player = "";
        game.session.score  = 0;
    }]);


// ####################################################
// ########        Countdown controller        ########
// ####################################################

    monsterApp.controller('countdownCtrl', ['$scope', '$rootScope', '$state', '$timeout', function($scope, $rootScope, $state, $timeout) {
        console.log('[Game] Counting down');

        // Close all GUI
        f1.close();
        f2.close();
        f3.close();

        // Count down and go to play state
        var timer
        $rootScope.message = 5;

        $scope.timer = function() {
            timer = $timeout(function() {
                $rootScope.message--;

                if($rootScope.message < 1) {
                    console.log('[Game] Moving to ' + game.session.game);

                    $timeout.cancel(timer);
                    $state.go('start');
                } else {
                    console.log('[Game] ' + $rootScope.message);
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
        console.log('[Game] Init game');

        // Init idle timer
        $scope.timer = function() {
            game.session.idleTimer = $timeout(function() {
                game.session.timer++;
                game.session.idleCount++;

                if(game.session.idleCount >= game.reset) {
                    console.log('[Game] Player idle for too long, resetting game');
                    game.idleCount = 0;

                    $timeout.cancel(game.session.idleTimer);

                    hotspots = [];
                    $state.go('idle');
                } else
                    $scope.timer();
            }, 1000);
        };
        $scope.timer();

        // Move to game
        $state.go(game.session.game);
    }]);


// ####################################################
// ########        Game end controller         ########
// ####################################################

    monsterApp.controller('finishedCtrl', ['$scope', '$rootScope', '$state', '$timeout', function($scope, $rootScope, $state, $timeout) {
        console.log('[Game] Finished');

        $rootScope.message = "Het spel is afgelopen";

        $scope.showScore = function() {
            $timeout(function() {
                if(game.session.winner.length === "")
                    $rootScope.message = "Je score is " + game.session.score;
                else
                    $rootScope.message = game.session.winner + " heeft gewonnen";

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