
angular.module('myApp').controller('userController', ['$scope','$http','$window','$rootScope','$location','$routeParams',function($scope,$http,$window,$rootScope,$location,$routeParams) {

  $scope.loggedinUserType = $routeParams.name;
	
  $scope.login = function(){
    console.log("login page data is called")
      
  var params = {
    'username':$scope.username,
    'password':$scope.password
  };
 
$http.post('/login',params).success(function(data) {
   
  $window.localStorage.setItem('userlabel', data.username );      
      
  var userlabel = $window.localStorage.getItem('userlabel'); 
  $rootScope.userlabel = userlabel;
      
  $window.localStorage.setItem("isLoggedinHospital", true);  
  
  $location.path('/kiosk/dashboard');

}).error(function(data) {
  alert('Invalid Username or Password')
      console.log('Error: ' + data);
  });
    };

}]);




