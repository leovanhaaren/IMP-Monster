'use strict';

/* Controllers */

angular.module('controllers', []).
    controller('idleCtrl', ['$scope', '$rootScope', '$state', function($scope, $rootScope, $state) {
        console.log('[Game] Idle.');

        $rootScope.message = "Waiting for input..";

        socket.on('game:create', function (data) {
            console.log('[Socket.io] Received game');
            console.log('[Socket.io] Moving to game');

            $state.go('play');
        });

        // Transition to play state after x seconds
        //setTimeout(function() { $state.go('play'); }, 5000);
    }]).
    controller('playCtrl', ['$scope', '$rootScope', '$state', function($scope, $rootScope, $state) {
        console.log('[Game] Playing.');
    }]);