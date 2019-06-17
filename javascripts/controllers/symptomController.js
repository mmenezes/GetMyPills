angular.module('myApp').controller('symptomController', ['$scope', '$http', '$routeParams', function ($scope, $http, $routeParams) {

	 
    $scope.getSymptoms = function () {

        console.log($routeParams)

        var redirectUrl = 'patientName=' + $routeParams.patientName + '&patientAge=' + $routeParams.patientAge + '&patientOccupation=' + $routeParams.patientOccupation + '&patientSymptoms=' + $routeParams.patientSymptoms + '&patientCountry=' + $routeParams.patientCountry + '&patientState=' + $routeParams.patientState + '&patientZip=' + $routeParams.patientZip

        $http.get('/api/getSymptoms?' + redirectUrl).success(function (data) {
            $scope.result = data.result;
            console.log(JSON.stringify(data));

        }).error(function (data) {            
            console.log('Error: ' + data);
        });
    }; 

    $scope.getSymptoms();

}]);
