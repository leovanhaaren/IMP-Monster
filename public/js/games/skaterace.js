'use strict';

// ####################################################
// ########        Skaterace controller        ########
// ####################################################

monsterApp.controller('skateraceCtrl', ['$scope', '$rootScope', '$state', function($scope, $rootScope, $state) {
    $rootScope.log('game', 'Started '     + $rootScope.game.name);
    $rootScope.log('game', 'Time: '       + $rootScope.game.conditions.time);
    $rootScope.log('game', 'Area limit: ' + $rootScope.game.conditions.area);


    // ########     Positioning
    // ########     -----------

    // Playfield divider, representing the score in this game in %
    $scope.areaPercentage = 50;

    // Set score limits
    $scope.player1Limit =       $rootScope.game.conditions.area;
    $scope.player2Limit = 100 - $rootScope.game.conditions.area;

    // Update borders
    $(".border1").css("width", $rootScope.game.conditions.area +'%');
    $(".border2").css("width", $rootScope.game.conditions.area +'%');


    // ########     Hits
    // ########     ----

    $scope.hotspotHit = function(hotspot) {
        // Update score exponential according to session time
        var score = Math.exp(hotspot.data("score") * $rootScope.session.durationCount / 25);

        // Move the area divider by score %
        if(hotspot.data("player") === "player1")
            $scope.areaPercentage += score;

        if(hotspot.attr("player") === "player2")
            $scope.areaPercentage -= score;

        // Raise locked attr so we cant score again for 2 sec
        hotspot.attr("data-locked", 2);

        // Update scene
        $(".player1").css("width", $scope.areaPercentage +'%');
        $(".player2").css("width", (100 - $scope.areaPercentage) +'%');

        // Log game score
        $rootScope.log('game', hotspot.data("player") + ' claimed ' + score +'% of playfield');
    }


    // ########     Conditions
    // ########     ----------

    $scope.checkWin = function(hotspot) {
        // Check if we have a winner
        if($scope.areaPercentage <= $scope.player1Limit || $scope.areaPercentage >= $scope.player2Limit){
            // Set message for end screen
            $rootScope.message = "Het spel is afgelopen<br/>" + hotspot.data("player") + " is de winnaar";

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

    $(window).on('tick', function(ev){
        // Lower the hotspot lock by 1
        $('#hotspots').children().each(function (i) {
            var currentLock = $(this).data('locked');

            // Escape if lock is already 0
            if(currentLock == 0) return;

            // Lower lock
            $(this).attr("data-locked", currentLock--);
        });

        $scope.checkDuration();
    });


    // When object is hit, calculate new area
    $(window).on('hit', function(ev, data){
        var hotspot = $(data.spot.el);

        // Reset idle timer
        $rootScope.session.idleCount = 0;

        if(hotspot.data("locked") == 0)
            $scope.hotspotHit(hotspot);

        //$scope.checkWin(hotspot);
    });

}]);