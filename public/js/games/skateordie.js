'use strict';

// ####################################################
// ########        Skaterace controller        ########
// ####################################################

    monsterApp.controller('skateordieCtrl', ['$scope', '$rootScope', '$state', function($scope, $rootScope, $state) {
        $rootScope.log('game', 'Started ' + $rootScope.game.name);
        $rootScope.log('game', 'Time: ' + $rootScope.game.conditions.time);
        $rootScope.log('game', 'Score: ' + $rootScope.game.conditions.score);

        // Settings
        $scope.monster = $('.monster');

        $scope.gameover = false;


        // ########     Positioning
        // ########     -----------

        $scope.newScenePosition = function(element) {
            // Get scene dimensions minus size of the div
            var h = $('#scene').height() - $(element).height();
            var w = $('#scene').width()  - $(element).width();

            var nh = Math.floor(Math.random() * h);
            var nw = Math.floor(Math.random() * w);

            return [nh, nw];
        }

        $scope.animateMonster = function() {
            var newq      = $scope.newScenePosition('.monster');
            var oldq      = $scope.monster.position();
            var direction = newq[1] > oldq.left ? 'right':'left';
            var speed     = $scope.calculateMovementSpeed([oldq.top, oldq.left], newq);

            // Flip svg image based on direction
            $scope.monster.removeClass('flip');
            if(direction === "right")
                $scope.monster.addClass('flip');

            $scope.monster.animate({
                top: newq[0],
                left: newq[1]
            }, speed, function() {
                $scope.animateMonster();
            });
        };

        $scope.calculateMovementSpeed = function(prev, next) {
            var x = Math.abs(prev[1] - next[1]);
            var y = Math.abs(prev[0] - next[0]);

            var greatest = x > y ? x : y;

            var speedModifier = 0.1;

            var speed = Math.ceil(greatest / speedModifier);

            return speed;
        }

        $scope.newPowerupPosition = function(element) {
            var newp = $scope.newScenePosition(element);

            $(element).css({
                top: newp[0],
                left: newp[1]
            });
        }

        $scope.spawnPowerup = function(powerup) {
            // Create element
            powerup = $('#hotspots').prepend(powerup.get(0));

            // Set position
            $scope.newPowerupPosition(powerup);
        }


        // ########     Hits
        // ########     ----

        $scope.changeMonsterState = function(powerup) {
            // Stop current animation
            $scope.monster.stop();
            $scope.monster.addClass('invulnerable');

            // Animate monster
            $scope.monster.find("img").attr("src", 'svg/monster_' + powerup.data("type") + '.svg');

            // End function if we have a monster
            if(powerup.data("type") === "gameover")
                return;

            // Spin monster
            if(powerup.data("type") === "shock")
                $scope.monster.addClass('rotate');

            // Init timer for state reset
            var timer = setTimeout(function () {
                $scope.monster.removeClass('invulnerable');

                // Let the monster roam again
                $('.monster').find("img").attr("src", 'svg/monster_roaming.svg');
                $scope.animateMonster();

                // Remove spin
                $('.monster').removeClass('rotate');

                var respawn = setTimeout(function () {
                    $scope.spawnPowerup(powerup);
                }, (powerup.data("respawn") - powerup.data("duration") * 1000));

            }, powerup.data("duration") * 1000);
        }

        $scope.monsterHit = function(monster) {
            // If monster is not animating, return
            if ($scope.monster.hasClass('invulnerable')) return;

            $scope.gameover = true;

            $('#bg').addClass('gameover');

            // Update monster state
            $scope.changeMonsterState(monster);

            var timer = setTimeout(function () {
                monster.remove();

                $rootScope.message = "Het spel is afgelopen<br/>Je score is " + $rootScope.session.score;

                $state.go('finished');
            }, monster.data("duration") * 1000);
        }

        $scope.powerupHit = function(powerup) {
            // Raise score
            $rootScope.session.score += powerup.data("score");

            // Remove powerup from scene
            powerup.remove();

            // Update monster state
            $scope.changeMonsterState(powerup);
        }


        // ########     Conditions
        // ########     ----------

        $scope.checkWin = function() {
            // Check if we have a winner
            if($rootScope.session.score >= $rootScope.game.conditions.score) {
                // Set message for end screen
                $rootScope.message = "Het spel is afgelopen<br/>Je score is " + $rootScope.session.score;

                $state.go('finished');
            }
        }

        $scope.checkDuration = function() {
            // Check if we have a winner
            if($rootScope.session.durationCount >= $rootScope.game.conditions.time) {
                // Set message for end screen
                $rootScope.message = "Het spel is afgelopen<br/>Je score is " + $rootScope.session.score;

                $state.go('finished');
            }
        }


        // ########     Game events
        // ########     -----------

        $(window).on('tick', function(ev){
            // Reset idle timer
            $rootScope.session.idleCount = 0;

            // Return if game is over
            if($scope.gameover) return;

            $rootScope.session.score++;

            $scope.checkWin();

            $scope.checkDuration();
        });

        // When object is hit, trigger monster or powerup
        $(window).on('hit', function(ev, data){
            var hotspot = $(data.spot.el);

            // Return if game is over
            if($scope.gameover) return;

            // Check for monster hit
            if(hotspot.data("type") === "gameover")
                $scope.monsterHit(hotspot);

            // Check for powerups
            if(hotspot.data("type") === "shock")
                $scope.powerupHit(hotspot);

            if(hotspot.data("type") === "silence")
                $scope.powerupHit(hotspot);
        });


        // ########     Init
        // ########     ----

        $scope.init = function() {
            // Spawn powerups
            $scope.newPowerupPosition(".powerup[data-type='shock'");
            $scope.newPowerupPosition(".powerup[data-type='silence'");

            // Start monster
            $rootScope.log('monster', 'Roaming');
            $scope.animateMonster();
        }
        $scope.init();

    }]);