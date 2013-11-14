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

        f1.open();
        f2.close();
        f3.close();

        $rootScope.socket.on('game:start', function (session) {
            console.log('[Socket.io] Received game session: ' + session.id);

            // Update dat.GUI
            game.session.game   = session.gameName;
            game.session.player = session.player;
            game.session.score  = 0;

            f1.close();
            f2.open();

            $state.go('countdown');
        });
    }]).

    controller('countdownCtrl', ['$scope', '$rootScope', '$state', '$timeout', function($scope, $rootScope, $state, $timeout) {
        console.log('[Game] Counting down.');

        // Count down and go to play state
        $rootScope.message = 5;
        $rootScope.onTimeout = function(){
            $rootScope.message--;
            timer = $timeout($rootScope.onTimeout,1000);
            if($rootScope.message < 1) {
                $state.go('play');
                $timeout.cancel(timer);
            }
        }
        var timer = $timeout($rootScope.onTimeout,1000);
    }]).

    controller('playCtrl', ['$scope', '$rootScope', '$state', function($scope, $rootScope, $state) {
        console.log('[Game] Playing.');

        game.frameCount = 0;

        f3.open();

        $rootScope.socket.on('game:update', function (session) {
            if(session.active) return;

            console.log('[Socket.io] Stopped game session: ' + session.id);

            $state.go('idle');
        });
    }]);