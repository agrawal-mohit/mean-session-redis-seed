'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Article Schema
 */
var SessionSchema = new Schema({
	expires: {
		type: Date
	},
	_id: {
		type: String
	},
	session: {
		type: String
	}
});

mongoose.model('Session', SessionSchema);
