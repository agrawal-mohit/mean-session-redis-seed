'use strict';

angular.module('users').controller('AuthenticationController', ['$scope', '$http', '$location', 'Authentication',
	function($scope, $http, $location, Authentication) {
		$scope.authentication = Authentication;
		$scope.basicCredentials = {'strategy' : 'local'};
		$scope.ldapCredentials = {'strategy' : 'WindowsAuthentication'};
		$scope.samlCredentials = {'strategy' : 'WindowsAuthentication'};
		
		// If user is signed in then redirect back home
		if ($scope.authentication.user) $location.path('/');

		$scope.signup = function() {
			$http.post('/auth/signup', $scope.credentials).success(function(response) {
				// If successful we assign the response to the global user model
				$scope.authentication.user = response;

				// And redirect to the index page
				$location.path('/');
			}).error(function(response) {
				$scope.error = response.message;
			});
		};

		$scope.basicSignin = function() {
			$http.post('/auth/signin' , $scope.basicCredentials).success(function(response) {
				// If successful we assign the response to the global user model
				$scope.authentication.user = response;
				// And redirect to the index page
				$location.path('/');
			}).error(function(response) {
				if(response=='Session exists'){
					//$('.modal').modal('toggle');
					var input = confirm('You are already logged in! Press OK to end previous sesison and login.')
					if(input==true) {
						$scope.basicCredentials.overwrite=true;
						$scope.basicSignin();
					}
				} else {
					$scope.basicError = response.message;
				}
			});
		};


		$scope.ldapSignin = function() {
			$http.post('/auth/signin' , $scope.ldapCredentials).success(function(response) {
				// If successful we assign the response to the global user model
				$scope.authentication.user = response;
				// And redirect to the index page
				$location.path('/');
			}).error(function(response) {
				if(response=='Session exists'){
					//$('.modal').modal('toggle');
					var input = confirm('You are already logged in! Press OK to end previous sesison and login.')
					if(input==true) {
						$scope.ldapCredentials.overwrite=true;
						$scope.ldapSignin();
					}
				} else {
					$scope.ldapError = response.message;
				}
			});
		};

		$scope.samlSignin = function() {
			$http.post('/auth/samlSignin' , $scope.samlCredentials).success(function(response) {
				// If successful we assign the response to the global user model
				$scope.authentication.user = response;
				// And redirect to the index page
				$location.path('/');
			}).error(function(response) {
				if(response=='Session exists'){
					//$('.modal').modal('toggle');
					var input = confirm('You are already logged in! Press OK to end previous sesison and login.')
					if(input==true) {
						$scope.ldapCredentials.overwrite=true;
						$scope.ldapSignin();
					}
				} else {
					$scope.ldapError = response.message;
				}
			});
		};


	}
]);