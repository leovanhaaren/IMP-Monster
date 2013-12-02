'use strict';

// ####################################################
// ########        Skaterace controller        ########
// ####################################################

    monsterApp.controller('skateordieCtrl', ['$scope', '$rootScope', '$state', function($scope, $rootScope, $state) {
        $rootScope.log('game', 'Started ' + $rootScope.game.name);

        // Hotspot data, updated on every hit
        $scope.hotspot = null;
        $scope.type    = "";


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

        $scope.newPowerupPosition = function(element) {
            var newp    = $scope.newScenePosition(element);

            $(element).css({
                top: newp[0],
                left: newp[1]
            });
        }

        $scope.spawnPowerup = function(type) {
            // Create element
            $('#hotspots').prepend('<div class="powerup" data-type="' + type + '"><img src="svg/powerup_' + type + '.svg" alt="' + type + '"></div>');

            // Set position
            $scope.newPowerupPosition(".powerup[data-type='" + type + "'");
        }

        $scope.animateMonster = function() {
            var $target   = $('.monster');
            var newq      = $scope.newScenePosition('.monster');
            var oldq      = $target.position();
            var direction = newq[1] > oldq.left ? 'right':'left';
            var speed     = $scope.calculateMovementSpeed([oldq.top, oldq.left], newq);

            // Flip svg image based on direction
            $('.monster').removeClass('flip');
            if(direction === "right")
                $('.monster').addClass('flip');

            $('.monster').animate({
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


        // ########     Hotspots
        // ########     --------

        $scope.getHotspot = function(data) {
            // Get specific hotspot
            $scope.hotspot = $(data.spot.el);

            // Get the type
            $scope.type    = $(data.spot.el).data("type");
        }

        $scope.checkHotspots = function() {
            // Check for monster hit
            if($scope.type === "monster")
                $scope.monsterHit();

            // Check for powerups
            if($scope.type === "shock")
                $scope.shockMonster();

            if($scope.type === "silence")
                $scope.silenceMonster();
        }


        // ########     Hits
        // ########     ----

        $scope.changeMonsterState = function(state, time) {
            // Stop current animation
            $('.monster').stop();

            // Animate monster
            $('.monster').find("img").attr("src", 'svg/monster_' + state + '.svg');

            // Spin monster
            if(state === "shocked")
                $('.monster').addClass('rotate');

            // Init timer for state reset
            var timer = setTimeout(function () {
                // Let the monster roam again
                $('.monster').find("img").attr("src", 'svg/monster_roaming.svg');
                $scope.animateMonster();

                // Remove spin
                $('.monster').removeClass('rotate');

                var respawn = setTimeout(function () {
                    if(state === "shocked")
                        $scope.spawnPowerup('shock');
                    if(state === "silenced")
                        $scope.spawnPowerup('silence');
                }, 5000);

            }, time * 1000);
        }

        $scope.monsterHit = function() {
            // If monster is not animating, return
            if (!$('.monster').is(':animated')) return;

            // Remove monster from scene
            $scope.hotspot.remove();

            $rootScope.message = "Het spel is afgelopen<br/>Je score is " + $rootScope.session.score;

            $state.go('finished');
        }

        $scope.shockMonster = function() {
            // Remove powerup from scene
            $scope.hotspot.remove();

            // Update monster state
            $scope.changeMonsterState('shocked', 10);

            // Raise score
            $rootScope.session.score += 5;
        }

        $scope.silenceMonster = function() {
            // Remove powerup from scene
            $scope.hotspot.remove();

            // Update monster state
            $scope.changeMonsterState('silenced', 5);

            // Raise score
            $rootScope.session.score += 5;
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


        // ########     Game events
        // ########     -----------

        $(window).on('tick', function(ev){
            $rootScope.session.score++;

            // Reset idle timer
            $rootScope.session.idleCount = 0;

            $scope.checkWin();
        });

        // When object is hit, calculate new area
        $(window).on('hit', function(ev, data){
            $scope.getHotspot(data);

            $scope.checkHotspots();
        });


        // ########     Init
        // ########     ----

        $scope.init = function() {
            // Spawn powerups
            $scope.spawnPowerup('shock');
            $scope.spawnPowerup('silence');

            // Start monster
            $rootScope.log('monster', 'Roaming');
            $scope.animateMonster();
        }
        $scope.init();

    }]);