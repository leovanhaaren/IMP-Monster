'use strict';


// Declare app level module which depends on filters, and services
angular.module('app', [
  'ui.router',
  'filters',
  'services',
  'directives',
  'controllers'
]).
config(function($stateProvider, $urlRouterProvider) {
        //
        // For any unmatched url, redirect to /state1
        $urlRouterProvider.otherwise("/idle");
        //
        // Now set up the states
        $stateProvider
            .state('idle', {
                url: "/idle",
                controller: "idleCtrl"
            })
            .state('play', {
                url: "/play",
                templateUrl: "games/testgame.html",
                controller: "playCtrl"
            })
    }).
    run(['$rootScope', '$state', '$stateParams', function ($rootScope, $state, $stateParams) {
        $rootScope.$state       = $state;
        $rootScope.$stateParams = $stateParams;
    }]);
