'use strict';

// ####################################################
// ########     Prototype 01/02 controller     ########
// ####################################################

    monsterApp.controller('prototype01Ctrl', ['$scope', '$rootScope', '$state', '$timeout', function($scope, $rootScope, $state, $timeout) {
        console.log('[Game] Started ' + game.session.game);

        // When object is hit, do something
        $(window).on('hit', function(ev, data){
            // Reset idle timer
            game.session.idleCount = 0;

            // Get data from object and remove it from scene
            var id    = $(data.spot.el).attr('class');
            var score = $(data.spot.el).html();
            $(data.spot.el).remove();

            console.log('[Game] Player scored ' + score);

            // Update score
            game.session.score += parseInt(score);

            if(game.session.score >= game.session.limit){
                $timeout.cancel(game.session.idleTimer);

                hotspots = [];
                $state.go('finished');
            } else
                setTimeout(function () {
                    $('#hotspots').append('<div class="' + id + '">' + score + '</div>');
                }, 5000);
        });
    }]);