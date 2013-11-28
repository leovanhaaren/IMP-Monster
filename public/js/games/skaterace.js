'use strict';

// ####################################################
// ########        Skaterace controller        ########
// ####################################################

    monsterApp.controller('skateraceCtrl', ['$scope', '$rootScope', '$state', function($scope, $rootScope, $state) {
        $rootScope.log('game', 'Started ' + $rootScope.game.name);

        // Playfield divider, representing the score in this game in %
        $scope.areaPercentage = 50;

        // Set score limits
        $scope.player1Limit = $rootScope.game.conditions.area;
        $scope.player2Limit = 100 - $rootScope.game.conditions.area;

        // Update borders
        $(".border1").css("width", $rootScope.game.conditions.area +'%');
        $(".border2").css("width", $rootScope.game.conditions.area +'%');

        // Hotspot data, updated on every hit
        $scope.hotspot = null;
        $scope.player  = "";
        $scope.score   = 0;

        $scope.getHotspot = function(data) {
            // Get specific hotspot
            $scope.hotspot = $(data.spot.el);

            // Get player who scored
            $scope.player  = $(data.spot.el).attr('class').split(' ')[1];

            // Get score from the hotspot
            $scope.score   = parseInt($(data.spot.el).html());
        }

        $scope.lockHotspot = function() {
            //Check if object is locked, else lock it
            if($scope.hotspot.hasClass('locked'))
                return true;
            else
                $scope.hotspot.addClass('locked');

            // TODO: FIX THIS TIMER
            // Remove locked state after x seconds
            setTimeout(function () {
                $scope.hotspot.removeClass('locked');
            }, 2000);
        }

        $scope.updateScore = function() {
            // Update score exponential according to session time
            $scope.score = Math.exp($scope.score * $rootScope.session.durationCount / 25);

            // Move the area divider by score %
            if($scope.player === "player1")
                $scope.areaPercentage += $scope.score;
            else
                $scope.areaPercentage -= $scope.score;

            // Log game score
            $rootScope.log('game', $scope.player + ' claimed ' + $scope.score +'% of playfield');
        }

        $scope.updateScene = function() {
            // Get rest percentage
            var restPercentage = 100 - $scope.areaPercentage;

            // Update scene so we get correct area coverage
            $(".player1").css("width", $scope.areaPercentage +'%');
            $(".player2").css("width", restPercentage +'%');
        }

        $scope.checkWin = function() {
            // Check if we have a winner
            if($scope.areaPercentage <= $scope.player1Limit || $scope.areaPercentage >= $scope.player2Limit){
                // Set message for end screen
                $rootScope.message = "Het spel is afgelopen<br/>" + $scope.player + " is de winnaar";

                $state.go('finished');
            }
        }

        // When object is hit, calculate new area
        $(window).on('hit', function(ev, data){
            // Reset idle timer
            $rootScope.session.idleCount = 0;

            $scope.getHotspot(data);

            if($scope.lockHotspot()) return;

            $scope.updateScore();

            $scope.updateScene();

            $scope.checkWin();
        });
    }]);