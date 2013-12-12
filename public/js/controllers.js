'use strict';

// ####################################################
// ########          Init controller           ########
// ####################################################

    monsterApp.controller('initCtrl', ['$scope', '$rootScope', function($scope, $rootScope) {
        $rootScope.log('game', 'Init');

        $rootScope.message = "Zet webcam aan";
    }]);


// ####################################################
// ########          Idle controller           ########
// ####################################################

    monsterApp.controller('idleCtrl', ['$scope', '$rootScope', function($scope, $rootScope) {
        $rootScope.log('game', 'Idle');

        $rootScope.message = "Selecteer een spel<br/>op de tablet";

        // Reset dat.GUI
        $rootScope.game.name              = "";
        $rootScope.game.countdown         = 0;
        $rootScope.game.cooldown          = 0;
        $rootScope.game.reset             = 0;
        $rootScope.game.remote            = 0;
        $rootScope.game.conditions        = "";

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
        $rootScope.log('game', 'Counting down');

        // Make countdown big
        $('h1').addClass('enlarge');

        // Count down and go to play state
        $rootScope.session.countdownCount = $rootScope.game.countdown;
        $rootScope.message = $rootScope.session.countdownCount.toString();

        // Play sound on each countdown iteration
        var instance = createjs.Sound.play("countdown");
        instance.volume = 1;

        $rootScope.log('countdown', $rootScope.session.countdownCount);

        $scope.timer = function() {
            $rootScope.game.countdownTimer = $timeout(function() {
                if($rootScope.session.countdownCount <= 1) {
                    $rootScope.log('game', 'Moving to ' + $rootScope.game.name);

                    $rootScope.message = false;
                    $('h1').removeClass('enlarge');

                    // Play start sound
                    var instance = createjs.Sound.play("start");
                    instance.volume = 1;

                    $rootScope.log('countdown', $rootScope.session.countdownCount);

                    $timeout.cancel($rootScope.game.countdownTimer);
                    $state.go('start');
                } else {
                    // Play sound on each countdown iteration
                    var instance = createjs.Sound.play("countdown");
                    instance.volume = 1;

                    $rootScope.session.countdownCount--;
                    $rootScope.message = $rootScope.session.countdownCount.toString();

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

                // Broadcast a tick for the minigames to raise score
                $(window).trigger('tick');

                // Cancel game if player is idle for too long
                if($rootScope.session.idleCount >= $rootScope.game.reset) {
                    $rootScope.log('game', 'Player idle for too long, resetting the game');

                    $state.go('idle');
                }
                else if($rootScope.session.durationCount >= $rootScope.game.conditions.time) {
                    $rootScope.log('game', 'Game time reached');

                    // Set message for end screen
                    $rootScope.message = "Het spel is afgelopen<br/>Je score is " + $rootScope.session.score;

                    $state.go('finished');
                } else {
                    $scope.timer();
                }
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