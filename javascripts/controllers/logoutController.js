angular.module('myApp').controller('logoutController', ['$scope','$http','$window','$rootScope','$location','$route',function($scope,$http,$window,$rootScope,$location,$route) {
    
  $location.path('/');
    
    
}]);