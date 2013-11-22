'use strict';

// ####################################################
// ########      Prototype 01 controller       ########
// ####################################################

    monsterApp.controller('prototype01Ctrl', ['$scope', '$rootScope', '$state', '$timeout', function($scope, $rootScope, $state, $timeout) {
        console.log('[Game] Started ' + game.session.game);

        // When object is hit, do something
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
    }]);