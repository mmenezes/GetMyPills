
var myAppModule = angular.module('myApp', ['ngRoute','ngTagCloud','datatables']);

myAppModule.config(function($routeProvider,$locationProvider) {  
    $routeProvider

         .when('/:name/login', {
            templateUrl: 'views/login/signin.html',
            controller: 'userController'
        }).when('/ngo/outbreak', {
            templateUrl: 'views/diseases/outbreak.html',
            controller: 'diseasesController'
        }).when('/', {                                        
        	templateUrl: 'views/login/signin.html',
            controller: 'userController'
        }).when('/ngo/dashboard', {
            templateUrl: 'views/dashboard/dashboard.html',
            controller: 'dashboardController'
        }).when('/kiosk/dashboard', {
            templateUrl: 'views/hospital/hospitalDashboard.html',
            controller: 'hospitalDashboardController'
        }).when('/kiosk/getcustomerslist', {
            templateUrl: 'views/customer/customersList.html',
            controller: 'customerController'
        }).when('/kiosk/patientDashboard', {
            templateUrl: 'views/hospital/patientDetails.html',
            controller: 'userController'                   
        }).when('/hospital/symptomAnalysis', {
            templateUrl: 'views/hospital/symptomAnalysis.html',
            controller: 'symptomController'                   
        }).
    otherwise({redirectTo:'/'})

    
$locationProvider.html5Mode({
  enabled: true,
  requireBase: false
}); 
  
});


myAppModule.run(function($rootScope, $location){
  $rootScope.$on('routeChangeSuccess', function(event, next, current){
    if ($location.path() == '/login') {
      $rootscope.isLoggedinHospital =  false;
    };
  });
});