'use strict';

// ####################################################
// ########     Prototype 01/02 controller     ########
// ####################################################

    monsterApp.controller('monsterballCtrl', ['$scope', '$rootScope', '$state', function($scope, $rootScope, $state) {
        $rootScope.log('game', 'Started ' + $rootScope.game.name);

        // Hotspot data, updated on every hit
        $scope.hotspot = null;
        $scope.class   = "";
        $scope.respawn = 0;
        $scope.score   = 0;

        $scope.getHotspot = function(data) {
            // Get specific hotspot
            $scope.hotspot = $(data.spot.el);

            // Get hotspot class
            $scope.class   = $(data.spot.el).attr('class');

            // Get respawn rate
            $scope.respawn = $(data.spot.el).data("respawn");

            // Get score from the hotspot
            $scope.score   = parseInt($(data.spot.el).html());
        }

        $scope.updateScore = function() {
            $rootScope.session.score += $scope.score;

            // Log game score
            $rootScope.log('game', 'Player scored ' + $scope.score);
        }

        $scope.updateScene = function() {
            // Remove hotspot
            $scope.hotspot.remove();
        }

        $scope.respawnElement = function() {
            var respawn = setTimeout(function () {
                $('#hotspots').append('<div class="' + $scope.class + '">' + $scope.score + '</div>');
            }, $scope.respawn * 1000);
        }

        $scope.checkWin = function() {
            // Check if we have a winner
            if($rootScope.session.score >= $rootScope.game.conditions.score) {
                // Set message for end screen
                $rootScope.message = "Het spel is afgelopen<br/>Je score is " + $rootScope.session.score;

                $state.go('finished');
            } else
                $scope.respawnElement();

        }

        // When object is hit, calculate new area
        $(window).on('hit', function(ev, data){
            // Reset idle timer
            $rootScope.session.idleCount = 0;

            $scope.getHotspot(data);

            $scope.updateScore();

            $scope.updateScene();

            $scope.checkWin();
        });
    }]);