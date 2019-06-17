angular.module('myApp').controller('hospitalDashboardController', ['$scope', '$http', '$compile', 'DTOptionsBuilder', 'DTColumnBuilder', function ($scope, $http, $compile, DTOptionsBuilder, DTColumnBuilder) {



    /*    $scope.getpatientDetails = function () {

            $http.get('/api/getPatients').success(function (data) {
                $scope.result = data.result;
                console.log(JSON.stringify(data));

            }).error(function (data) {            
                console.log('Error: ' + data);
            });
        }; 
    	$scope.sendMessage = function(number){
    		document.getElementById("ph-Number").value = number;

    	}
        $scope.getpatientDetails();*/




    $scope.getpatientDetails = function () {
           $scope.loading = true;
        $http.get('/api/getPatients').success(function (data) {
            $scope.result = data.result;
            console.log(JSON.stringify(data.result[0]));
           // $scope.columnsReady = true;
            var dataResults = [];
            for (var i = 0 in $scope.result) {
                dataResults.push({
                    Name: $scope.result[i].patient_name,
                    Occupation: $scope.result[i].patient_occ,
                    Village_Town: $scope.result[i].City,
                    Age: $scope.result[i].patient_age,
                    Date_Reported: $scope.result[i].date_updated,
                    Key_Symptoms: $scope.result[i].Symptoms_reported
                });
            }
            var sample = dataResults[0],
                dtColumns = []

            //create columns based on first row in dataset
            for (var key in sample) dtColumns.push(
                DTColumnBuilder.newColumn(key).withTitle(key)
            )


            $scope.dtColumns = dtColumns //headers
              $scope.loading = false;
            //create options
            $scope.dtOptions = DTOptionsBuilder.newOptions()
                .withOption('data', dataResults)
                .withPaginationType('full_numbers')
                .withDisplayLength('5')
                .withOption('lengthMenu',[5,10,15])
                /*withOption('lengthMenu', [5, 10, 15, 20, 25,-1]) */
    
            //initialize the dataTable
            angular.element('#example').attr('datatable', '')
            $compile(angular.element('#example'))($scope)
            
        }).error(function (data) {
            console.log('Error: ' + data);
        });
    };

    $scope.getpatientDetails();

}]);




