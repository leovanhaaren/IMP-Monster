'use strict';

// ####################################################
// ########        Skaterace controller        ########
// ####################################################

    monsterApp.controller('skateraceCtrl', ['$scope', '$rootScope', '$state', '$timeout', function($scope, $rootScope, $state, $timeout) {
        console.log('[Game] Started ' + game.session.game);

        // Set borders
        var player1Limit = game.session.limit;
        var player2Limit = 100 - game.session.limit;

        $(".border1").css("left", player1Limit +'%');
        $(".border2").css("left", player2Limit +'%');

        var linepos = 49;

        // When object is hit, do something
        $(window).on('hit', function(ev, data){
            // Reset idle timer
            game.session.idleCount = 0;

            //Check if object is locked, else lock it
            if($(data.spot.el).hasClass('locked'))
                return;
            else
                $(data.spot.el).addClass('locked');

            // Get data from objects
            var player  = $(data.spot.el).attr('class').split(' ')[1];
            var score   = parseInt($(data.spot.el).html());

            // Update score according to session time
            score = Math.exp(1 * game.session.timer / 25);

            // Move the middle line
            if(player === "player1")
                linepos += score;
            else
                linepos -= score;

            // Update scene positions
            $(".line").css("left", linepos +'%');

            var corrLinepos = linepos +1;
            var subsLinepos = 100 - corrLinepos;
            $(".player1").css("width", corrLinepos +'%');
            $(".player2").css("width", subsLinepos +'%');

            var player1Limit = game.session.limit;
            var player2Limit = 100 - game.session.limit;

            if(corrLinepos <= player1Limit || corrLinepos >= player2Limit){
                $timeout.cancel(game.session.idleTimer);

                // Update winner
                game.session.winner = player;

                hotspots = [];
                $state.go('finished');
            }

            // Remove locked state after x seconds
            setTimeout(function () {
                $(data.spot.el).removeClass('locked');
            }, 2000);

            console.log('[Game] ' + player + ' scored ' + score + '%');
        });
    }]);