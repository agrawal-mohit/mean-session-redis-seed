'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	Article = mongoose.model('Article'),
	_ = require('lodash');

var Redis = {};
var redis = require('redis');
var client = redis.createClient(); //creates a new client default host=127.0.0.1, port=6379

Redis.addArticle = function(article){
	// client.rpush('articles', JSON.stringify(article),  function (err) {
	//     if (err) {
	//       console.log('Error saving article in Redis');
	//       console.log(err);
	//     } else {
	//     	// Successful set
	//     	console.log('Article saved in Redis!');	
	//     }    
	// });
	client.hmset('article/'+article.id+'/', article,  function (err) {
	    if (err) {
	      console.log('Redis :: Error saving article!');
	      console.log(err);
	      return err;
	    } else {
	    	client.sadd('articles', article.id, function(err){
	    		if(err){
	    			console.log('Redis :: Error adding Id to article list!');
	      			console.log(err);
	      			return err;
	      		} else return null
	    	});
	    }
	});

}

Redis.findById = function(id, callback){
	client.hgetall('article/'+ id +'/', function(err, article){
		if(err) {
			console.log('Redis :: Error retrieving article ' + id);
			console.log(err);
			callback(err, null)
		} else {
			console.log('Redis :: Article ' + id + ' retrieved!')
			callback(null, article);
		}
	})
}

Redis.list = function(callback){
	var articles = [];
	client.smembers('articles', function(err, idList){
		var articles = [];
		if(err){
			console.log('Redis :: Error getting list of articles!')
			console.log(err);
		} else if(idList.length>0){
			console.log('idList : ' +  idList);
			Redis.getArticles(idList, [], function(articlesList){
				callback(null, articlesList)
			})
		}
	});
}

Redis.getArticles = function(idList, articlesList, callback){
	Redis.findById(idList.pop(), function(err, article){
		articlesList.push(article);
		console.log("Article : " + article.id + ' fetched');
		if(idList.length){
			Redis.getArticles(idList, articlesList, callback);
		} else {
			callback(articlesList);
		}
	});
}

Redis.edit = function(articleId, userId, callback){
	client.get('editing/'+articleId+'/', function(err, reply){
		if(err){
			callback({'allowed' : false , 'msg' : 'Error connecting to database, please try again!'});
		} else if(reply==null) {
			client.set('editing/'+articleId+'/', userId, function(err){
				if(err){
					callback({'allowed' : false, 'msg' : 'Error connecting to database, please try again!'});
				} else {
					callback({'allowed' : true});
				}
			});
		} else if(reply==userId){ 
			callback({'allowed' : true});
		} else {
			callback({'allowed' : false , 'msg' : 'Article is currently being edited by user : ' + reply});
		}
	});
}


Redis.update = function(article, callback){
	Redis.addArticle(article);
	client.del('editing/'+article._id+'/', function(err){
		if(err){
			callback({'updated' : false, 'msg' : err});
		} else {
			callback({'updated' : true});
		}
	});
}


Redis.delete = function(article, callback) {
	client.del('article/'+article._id+'/', function(err){
		if(err){
			callback({'deleted' : false, 'msg' : err});
		} else {
			callback({'deleted' : true});
		}
	})
}

/**
 * Create a article
 */
exports.create = function(req, res) {
	var data = req.body;
	var article = new Article(data);
	article.user = req.user;

	article.save(function(err, article) {
		if (err) {
			console.log("=============create err============");
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			console.log("=====create success=========");
			Redis.addArticle(article, function(err){
				if(!err){
					console.log('Redis :: ' +  'Article/' + article._id + ' saved!')
					res.json(article);
				}	
			});
			
		}
	});
};

/**
 * Show the current article
 */
exports.read = function(req, res) {
	res.json(req.article);
};


/**
 * Edit a article
 */

exports.edit = function(req, res){
	var articleId = req.query.articleId;
	var userId = req.query.userId;	
	Redis.edit(articleId, userId, function(response){
		res.end(JSON.stringify(response));	
	});
}

/**
 * Update a article
 */
exports.update = function(req, res) {
	var article = req.article;
	var articleId = req.body._id;
	article = _.extend(article, req.body);

	/*.update(article, function(response){
		if(response.updated){
			res.json(article);		
		} else {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(response.msg)
			});
		}
	});*/

	article.save(function(err) {
		if (err) {console.log("=============save err============");
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			console.log("=============save result============");
		}
	});
};


exports.cancelUpdate = function(req, res){
	var articleId = req.query.articleId;
	client.del('editing/'+articleId+'/', function(err){
		if(err){
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.status(200);
		}
	})
}
/**
 * Delete an article
 */
exports.delete = function(req, res) {
	var article = req.article;

	Redis.delete(article,function(response){
		if(response.deleted==false){
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json(article);
		}
	});
	// article.remove(function(err) {
	// 	if (err) {
	// 		return res.status(400).send({
	// 			message: errorHandler.getErrorMessage(err)
	// 		});
	// 	} else {
	// 		res.json(article);
	// 	}
	// });
};

/**
 * List of Articles
 */
exports.list = function(req, res) {
	
	Redis.list(function(err,articles){
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.json(articles);
		}
	});
};

/**
 * Article middleware
 */
exports.articleByID = function(req, res, next, id) {

	// if (!mongoose.Types.ObjectId.isValid(id)) {
	// 	return res.status(400).send({
	// 		message: 'Article is invalid'
	// 	});
	// }
	client.exists('article/'+ id +'/', function(err, reply){
		if(reply==1){
			Redis.findById(id, function(err, article){
				if(err) return next(err);
				if (!article) {
					return res.status(404).send({
						message: 'Article not found'
					});
				}
				req.article = article;
				next();
			});
		} else {
			return res.status(400).send({
				message: 'Article is invalid'
			});
		}
	});
	
	// Article.findById(id).populate('user', 'displayName').exec(function(err, article) {
	// 	if (err) return next(err);
	// 	if (!article) {
	// 		return res.status(404).send({
	// 			message: 'Article not found'
	// 		});
	// 	}
	// 	req.article = article;
	// 	next();
	// });
};

/**
 * Article authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.article.user.id !== req.user.id) {
		return res.status(403).send({
			message: 'User is not authorized'
		});
	}
	next();
};


exports.testRedis = function(req, res){

	jsonObj = req.body.jsonObj;
	console.log(jsonObj);
	client.jsondocset('jsonObj', jsonObj, function(err, reply){
		if (err) console.log(err);
		else {
			console.log(reply);
		}
	})
}





