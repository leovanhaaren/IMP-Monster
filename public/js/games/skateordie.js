'use strict';

// ####################################################
// ########        Skaterace controller        ########
// ####################################################

    monsterApp.controller('skateordieCtrl', ['$scope', '$rootScope', '$state', function($scope, $rootScope, $state) {
        $rootScope.log('game', 'Started ' + $rootScope.game.name);
        $rootScope.log('game', 'Time: '   + $rootScope.game.conditions.time);
        $rootScope.log('game', 'Score: '  + $rootScope.game.conditions.score);

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

        $scope.monsterHit = function(monster) {
            $rootScope.log('game', 'Monster was hit');

            // If monster is not animating, return
            if ($scope.monster.hasClass('invulnerable')) return;

            // Update monster state
            $scope.stopMonster();
            $scope.monster.find("img").attr("src", 'svg/monster_gameover.svg');

            $scope.gameover = true;

            // Animate scene background
            $('#bg').addClass('gameover');

            // Play gameover sound
            var instance = createjs.Sound.play("gameover");
            instance.volume = 1;

            var timer = setTimeout(function () {
                monster.remove();

                $rootScope.message = "Het spel is afgelopen<br/>Je score is " + $rootScope.session.score;

                $state.go('finished');
            }, 5000);
        }

        $scope.stopMonster = function() {
            $rootScope.log('game', 'Stopping monster');

            // Stop current animation
            $scope.monster.stop();
            $scope.monster.addClass('invulnerable');
        }

        $scope.restoreMonster = function(powerup) {
            $rootScope.log('game', 'Restoring monster');

            var timer = setTimeout(function () {
                if($scope.gameover) return;

                $scope.monster.removeClass('invulnerable');
                $scope.monster.removeClass('rotate');

                // Let the monster roam again
                $scope.monster.find("img").attr("src", 'svg/monster_roaming.svg');
                $scope.animateMonster();

                // Respawn powerup
                var respawn = setTimeout(function () {
                    $scope.spawnPowerup(powerup);
                }, (powerup.attr("data-respawn") - powerup.attr("data-duration") * 1000));

            }, powerup.data("duration") * 1000);
        }

        $scope.shockHit = function(powerup) {
            $rootScope.log('game', 'Hit shock powerup');

            // Check for NaN bug
            if(isNaN(powerup.attr("data-score"))){
                $rootScope.log('game', '*** Score was NaN ***');
                return;
            }

            // Raise score
            $rootScope.session.score += parseInt(powerup.attr("data-score"));

            // Play shock sound
            var instance = createjs.Sound.play("sounds/shock.mp3");
            instance.volume = 1;

            $scope.stopMonster();

            // Animate monster
            $scope.monster.find("img").attr("src", 'svg/monster_shock.svg');
            $scope.monster.addClass('rotate');

            // Restore monster after x seconds
            $scope.restoreMonster(powerup);

            // Remove powerup from scene
            powerup.remove();
        }

        $scope.silenceHit = function(powerup) {
            $rootScope.log('game', 'Hit silence powerup');

            // Check for NaN bug
            if(isNaN(powerup.attr("data-score"))){
                $rootScope.log('game', '*** Score was NaN ***');
                return;
            }

            // Raise score
            $rootScope.session.score += parseInt(powerup.attr("data-score"));

            // Play silence sound
            var instance = createjs.Sound.play("sounds/silence.mp3");
            instance.volume = 1;

            $scope.stopMonster();

            // Animate monster
            $scope.monster.find("img").attr("src", 'svg/monster_silence.svg');

            // Restore monster after x seconds
            $scope.restoreMonster(powerup);

            // Remove powerup from scene
            powerup.remove();
        }


        // ########     Conditions
        // ########     ----------

        $scope.checkWin = function() {
            // Check if we have a winner
            if($rootScope.session.score >= $rootScope.game.conditions.score) {
                // Set message for end screen
                $rootScope.message = "Het spel is afgelopen<br/>Je score is " + $rootScope.session.score;

                // Play win sound
                var instance = createjs.Sound.play("win");
                instance.volume = 1;

                $state.go('finished');
            }
        }


        // ########     Game events
        // ########     -----------

        $(window).on('tick', function(ev){
            $rootScope.session.idleCount = 0;

            // Return if game is over
            if(!$scope.gameover)
                $rootScope.session.score++;

            $scope.checkWin();
        });

        // When object is hit, trigger monster or powerup
        $(window).on('hit', function(ev, hotspot){
            hotspot = $(hotspot);

            if(!$scope.gameover)
                switch(hotspot.attr("data-type")) {
                    case 'monster':
                        $scope.monsterHit(hotspot);
                    case 'shock':
                        $scope.shockHit(hotspot);
                    case 'silence':
                        $scope.silenceHit(hotspot);
                    default:
                        return;
                }
        });


        // ########     Init
        // ########     ----

        $scope.init = function() {
            // Spawn powerups
            $scope.newPowerupPosition(".powerup[data-type='shock'");
            $scope.newPowerupPosition(".powerup[data-type='silence'");

            // Start monster
            $rootScope.log('game', 'Monster roaming');
            $scope.animateMonster();
        }
        $scope.init();

    }]);