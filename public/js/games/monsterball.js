'use strict';

// ####################################################
// ########     Prototype 01/02 controller     ########
// ####################################################

monsterApp.controller('monsterballCtrl', ['$scope', '$rootScope', '$state', function($scope, $rootScope, $state) {
    $rootScope.log('game', 'Started ' + $rootScope.game.name);
    $rootScope.log('game', 'Time: ' + $rootScope.game.conditions.time);
    $rootScope.log('game', 'Score: ' + $rootScope.game.conditions.score);


    // ########     Hits
    // ########     ----

    $scope.hotspotHit = function(powerup) {
        // Raise score
        $rootScope.session.score += powerup.data("score");

        // Remove powerup from scene
        powerup.remove();

        // Respawn hotspot after x seconds
        var respawn = setTimeout(function () {
            $('#hotspots').prepend(powerup.get(0));
        }, powerup.data("respawn") * 1000);

    }


    // ########     Conditions
    // ########     ----------

    $scope.checkWin = function() {
        // Check if we have a winner
        if($rootScope.session.score >= $rootScope.game.conditions.score) {
            // Set message for end screen
            $rootScope.message = "Het spel is afgelopen<br/>Je score is " + $rootScope.session.score;

            $state.go('finished');
        }
    }

    $scope.checkDuration = function() {
        // Check if we have a winner
        if($rootScope.session.durationCount >= $rootScope.game.conditions.time) {
            // Set message for end screen
            $rootScope.message = "Het spel is afgelopen<br/>Je score is " + $rootScope.session.score;

            $state.go('finished');
        }
    }


    // ########     Game events
    // ########     -----------

    $(window).on('hit', function(ev, data){
        // Reset idle timer
        $rootScope.session.idleCount = 0;

        var hotspot = $(data.spot.el);

        $scope.hotspotHit(hotspot);

        $scope.checkWin();

        $scope.checkDuration();
    });

}]);