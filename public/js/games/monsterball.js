'use strict';

// ####################################################
// ########     Prototype 01/02 controller     ########
// ####################################################

monsterApp.controller('monsterballCtrl', ['$scope', '$rootScope', '$state', function($scope, $rootScope, $state) {
    $rootScope.log('game', 'Started ' + $rootScope.game.name);
    $rootScope.log('game', 'Time: '   + $rootScope.game.conditions.time);
    $rootScope.log('game', 'Score: '  + $rootScope.game.conditions.score);


    // ########     Hits
    // ########     ----

    $scope.hotspotHit = function(powerup) {
        $rootScope.session.idleCount = 0;

        if(!isNaN(powerup.attr("data-score")))
            $rootScope.session.score += parseInt(powerup.attr("data-score"));

        powerup.remove();

        var respawn = setTimeout(function () {
            $('#hotspots').prepend(powerup.get(0));
        }, powerup.attr("data-respawn") * 1000);

    }


    // ########     Conditions
    // ########     ----------

    $scope.checkWin = function() {
        if($rootScope.session.score >= $rootScope.game.conditions.score) {
            // Set message for end screen
            $rootScope.message = "Het spel is afgelopen<br/>Je score is " + $rootScope.session.score;

            // Play win sound
            var instance = createjs.Sound.play("win");
            instance.volume = 1;

            $state.go('finished');
        }
    }


    // ########     Game events
    // ########     -----------

    $(window).on('tick', function(ev){

    });

    $(window).on('hit', function(ev, hotspot){
        hotspot = $(hotspot);

        $scope.hotspotHit(hotspot);

        $scope.checkWin();
    });

}]);