'use strict';

// ####################################################
// ########     Prototype 01/02 controller     ########
// ####################################################

    monsterApp.controller('prototype01Ctrl', ['$scope', '$rootScope', '$state', function($scope, $rootScope, $state) {
        $rootScope.log('game', 'Started ' + $rootScope.game.name);

        // When object is hit, do something
        $(window).on('hit', function(ev, data){
            // Reset idle timer
            $rootScope.session.idleCount = 0;

            // Get data from object and remove it from scene
            var id    = $(data.spot.el).attr('class');
            var score = $(data.spot.el).html();
            $(data.spot.el).remove();

            $rootScope.log('game', 'Player scored ' + score);

            // Update score
            $rootScope.session.score += parseInt(score);

            if($rootScope.session.score >= $rootScope.game.conditions.score){
                $state.go('finished');
            } else
                setTimeout(function () {
                    $('#hotspots').append('<div class="' + id + '">' + score + '</div>');
                }, 5000);
        });
    }]);