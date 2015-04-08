'use strict';

// Articles controller
angular.module('articles').controller('ArticlesController', ['$scope', '$http','$stateParams', '$location', 'Authentication', 'Articles',
	function($scope, $http, $stateParams, $location, Authentication, Articles) {
		$scope.authentication = Authentication;

		// Create new Article
		$scope.create = function() {
			// Create new Article object
			var article = new Articles({
				title: this.title,
				content: this.content
			});

			// Redirect after save
			article.$save(function(response) {
				$location.path('articles/' + response.id);

				// Clear form fields
				$scope.title = '';
				$scope.content = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Article
		$scope.remove = function(article) {
			if (article) {
				article.$remove();

				for (var i in $scope.articles) {
					if ($scope.articles[i] === article) {
						$scope.articles.splice(i, 1);
					}
				}
			} else {
				$scope.article.$remove(function() {
					$location.path('articles');
				});
			}
		};

		//edit article

		$scope.edit = function() {
			console.log($scope.article.id);
			console.log($scope.authentication.user._id);

			$http({
			    url: '/article/edit',
			    method: "GET",
			    params: {'articleId' : $scope.article.id, 'userId' : $scope.authentication.user._id}
			}).success(
				function(response) {
			        console.log(response);
			        if(response.allowed){
			        	location.href = '/#!/articles/' + $scope.article.id + '/edit';
			        } else {
			        	$scope.editError = response.msg;
			        }
			    }
			).error(
				function(error) { // optional
			        console.log(error);
			    }
			);
		};
			

		// Update existing Article
		$scope.update = function(valid) {
			
			// client.del($scope.article._id, function(err, reply){
			// 	alert(reply);
			// })

			var article = $scope.article;

			article.$update(function() {
				$location.path('articles/' + article.id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		$scope.cancelUpdate = function(){
			var articleId = $scope.article.id;
			$http({
			    url: '/cancelUpdate',
			    method: "GET",
			    params: {'articleId' : articleId}
			}).success(function(){
				location.href = "#!/articles/"+ articleId;
			}).error(function(err){
				$scope.error = err;
			});
		};

		// Find a list of Articles
		$scope.find = function() {
			$scope.articles = Articles.query();
		};

		// Find existing Article
		$scope.findOne = function() {
			$scope.article = Articles.get({
				articleId: $stateParams.articleId
			});
		};



	}
]);