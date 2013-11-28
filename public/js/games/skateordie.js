'use strict';

// ####################################################
// ########        Skaterace controller        ########
// ####################################################

    monsterApp.controller('skateordieCtrl', ['$scope', '$rootScope', '$state', function($scope, $rootScope, $state) {
        $rootScope.log('game', 'Started ' + $rootScope.game.name);

        // Hotspot data, updated on every hit
        $scope.hotspot = null;
        $scope.type    = "";

        $scope.getHotspot = function(data) {
            // Get specific hotspot
            $scope.hotspot = $(data.spot.el);

            // Get player who scored
            $scope.type    = $(data.spot.el).data("type");
        }

        $scope.newMonsterPosition = function() {
            // Get scene dimensions minus size of the div
            var h = $('#scene').height() - $('.monster').height();
            var w = $('#scene').width()  - $('.monster').width();

            var nh = Math.floor(Math.random() * h);
            var nw = Math.floor(Math.random() * w);

            return [nh, nw];

        }

        $scope.animateMonster = function() {
            var $target = $('.monster');
            var newq    = $scope.newMonsterPosition();
            var oldq    = $target.offset();
            var speed   = $scope.calculateMonsterSpeed([oldq.top, oldq.left], newq);

            $rootScope.log('monster', 'Moving to ' + newq[0] + ' ' + newq[1] +' duration ' + speed / 1000 + 'sec');

            $('.monster').animate({
                top: newq[0],
                left: newq[1]
            }, speed, function() {
                $scope.animateMonster();
            });
        };

        $scope.calculateMonsterSpeed = function(prev, next) {
            var x = Math.abs(prev[1] - next[1]);
            var y = Math.abs(prev[0] - next[0]);

            var greatest = x > y ? x : y;

            var speedModifier = 0.1;

            var speed = Math.ceil(greatest / speedModifier);

            return speed;
        }

        $scope.updateScore = function() {
            $rootScope.session.score += $scope.score;

            // Log game score
            $rootScope.log('game', 'Player scored ' + $scope.score);
        }

        $scope.updateMonster = function() {

        }

        $scope.checkWin = function() {
            // Check if we have a winner
            if($rootScope.session.score >= $rootScope.game.conditions.score) {
                // Set message for end screen
                $rootScope.message = "Het spel is afgelopen<br/>Je score is " + $rootScope.session.score;

                $state.go('finished');
            }
        }

        $(window).on('tick', function(){
            $rootScope.session.score++;
        });

        // When object is hit, calculate new area
        $(window).on('hit', function(ev, data){
            // Reset idle timer
            $rootScope.session.idleCount = 0;

            $scope.getHotspot(data);

            $scope.updateScore();

            $scope.updateMonster();

            $scope.checkWin();
        });

        $rootScope.log('monster', 'Roaming');
        $scope.animateMonster();
    }]);