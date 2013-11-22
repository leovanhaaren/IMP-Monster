'use strict';

// ####################################################
// ########      Prototype 02 controller       ########
// ####################################################

    monsterApp.controller('prototype02Ctrl', ['$scope', '$rootScope', '$state', '$timeout', function($scope, $rootScope, $state, $timeout) {
        console.log('[Game] Playing ' + game.session.game);

        // When object is hit, assign the score to player
        $(window).on('hit', function(ev, data){
            // Reset idle timer
            game.idleCount = 0;

            // Get data from object and remove it from scene
            var id    = $(data.spot.el).attr('id');
            var score = $(data.spot.el).html();
            $(data.spot.el).remove();

            console.log('[Game] Player scored ' + score);

            // Update score
            game.session.score += parseInt(score);

            if(game.session.score >= game.session.limit){
                $timeout.cancel(timer);

                hotspots = [];
                $state.go('finished');
            } else
                setTimeout(function () {
                    $('#hotspots').append('<div id="' + id + '">' + score + '</div>');
                }, 5000);
        });

        // And finally add a counter that checks if player is idle for too long
        var timer
        $scope.timer = function() {
            timer = $timeout(function() {
                game.idleCount++;

                if(game.idleCount >= game.reset) {
                    console.log('[Game] Player idle for too long, resetting game');
                    game.idleCount = 0;

                    $timeout.cancel(timer);

                    hotspots = [];
                    $state.go('idle');
                } else
                    $scope.timer();
            }, 1000);
        };
        $scope.timer();
    }]);