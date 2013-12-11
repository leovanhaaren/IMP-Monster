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
        if(hotspot.attr("data-locked") > 0) return;

        // Update score exponential according to session time
        var score = Math.exp(hotspot.attr("data-score") * $rootScope.session.durationCount / 25);

        // Move the area divider by score %
        if(hotspot.attr("data-player") === "player1")
            $scope.areaPercentage += score;

        if(hotspot.attr("data-player") === "player2")
            $scope.areaPercentage -= score;

        // Raise locked attr so we cant score again for 2 sec
        hotspot.attr("data-locked", 2);

        // Update scene
        $(".player1").css("width", $scope.areaPercentage +'%');
        $(".player2").css("width", (100 - $scope.areaPercentage) +'%');

        // Log game score
        $rootScope.log('game', hotspot.attr("data-player") + ' claimed ' + score +'% of playfield');
    }


    // ########     Conditions
    // ########     ----------

    $scope.checkWin = function(hotspot) {
        if($scope.areaPercentage <= $scope.player1Limit || $scope.areaPercentage >= $scope.player2Limit){
            // Set message for end screen
            $rootScope.message = "Het spel is afgelopen<br/>" + hotspot.attr("data-player") + " is de winnaar";

            $state.go('finished');
        }
    }


    // ########     Game events
    // ########     -----------

    $(window).on('tick', function(ev){
        // Lower the hotspot lock by 1
        $('#hotspots').children().each(function (i) {
            var currentLock = $(this).attr('data-locked');

            // Escape if lock is already 0
            if(currentLock != 0)
                $(this).attr("data-locked", currentLock--);
        });
    });


    // When object is hit, calculate new area
    $(window).on('hit', function(ev, hotspot){
        hotspot = $(hotspot);

        // Reset idle timer
        $rootScope.session.idleCount = 0;

        $scope.hotspotHit(hotspot);

        //$scope.checkWin(hotspot);
    });

}]);