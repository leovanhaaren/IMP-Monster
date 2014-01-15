'use strict';

// ####################################################
// ########        Skaterace controller        ########
// ####################################################

monsterApp.controller('skateraceCtrl', ['$scope', '$rootScope', '$state', function($scope, $rootScope, $state) {
    $rootScope.log('game', 'Started '     + $rootScope.game.name);
    $rootScope.log('game', 'Time: '       + $rootScope.game.conditions.time);
    $rootScope.log('game', 'Area limit: ' + $rootScope.game.conditions.area);

    // Locking
    $scope.player1lock = 0;
    $scope.player2lock = 0;


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

    $scope.player1Score = function(hotspot) {
        if($scope.player1lock > 0)
            return;

        $scope.score(hotspot);

        $scope.player1lock = 2;
    }

    $scope.player2Score = function(hotspot) {
        if($scope.player2lock > 0)
            return;

        $scope.score(hotspot);

        $scope.player2lock = 2;
    }

    $scope.score = function(hotspot) {
        // Update score exponential according to session time
        var score = Math.exp(hotspot.attr("data-score") * $rootScope.session.durationCount / 25);

        // Move the area divider by score %
        if(hotspot.attr("data-player") === "player1")
            $scope.areaPercentage += score;

        if(hotspot.attr("data-player") === "player2")
            $scope.areaPercentage -= score;

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
            $rootScope.message = "Het spel is afgelopen<br/>" + hotspot.attr("data-color") + " is de winnaar";

            // Set winner
            $rootScope.session.winner = hotspot.attr("data-color");

            // Play win sound
            var instance = createjs.Sound.play("win");
            instance.volume = 1;

            $state.go('finished');
        }
    }


    // ########     Game events
    // ########     -----------

    $(window).on('tick', function(ev){
        // Lower the hotspot lock by 1
        if($scope.player1lock > 0)
            $scope.player1lock--;

        if($scope.player2lock > 0)
            $scope.player2lock--;
    });


    // When object is hit, calculate new area
    $(window).on('hit', function(ev, hotspot){
        hotspot = $(hotspot);

        // Reset idle timer
        $rootScope.session.idleCount = 0;

        if(hotspot.attr("data-player") === "player1")
            $scope.player1Score(hotspot);

        if(hotspot.attr("data-player") === "player2")
            $scope.player2Score(hotspot);

        $scope.checkWin(hotspot);
    });

}]);