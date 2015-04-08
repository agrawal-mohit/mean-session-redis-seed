'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport'),
	WindowsStrategy = require('passport-windowsauth'),
	User = require('mongoose').model('User');

module.exports = function() {
	// Use local strategy
	passport.use(new WindowsStrategy({
			// usernameField: 'username',
			// passwordField: 'password',
			ldap: {
				    url:             'ldap://10.1.2.3:389',
				    base:            'DC=mu-sigma,DC=local',
				    bindDN:          'CN=,OU=Service_Accounts,OU=Aviator,OU=Sites,DC=mu-sigma,DC=local',
				    bindCredentials: ''
				  },
			integrated:false,
		},
		function(profile, done) {		
			if (!profile) {
				return done(null, false, {
					message: 'Unknown user or invalid password'
				});
			} else {
					User.findOne({
						username: profile.emails[0].value.toLowerCase(),
						provider : 'WindowsAuthentication'
					}, function(err, user) {
						if (err) {
							return done(err);
						}
						if (!user) {

							var user = new User({
								displayName : profile.displayName,
								provider : 'WindowsAuthentication',
								username : profile.emails[0].value.toLowerCase(),
								salt : undefined,
								password: undefined,
								email: profile.emails[0].value,
								lastName: profile.name.familyName,
								firstName: profile.name.givenName 
							});

							user.save(function(err) {
								if (err) {
									return res.status(400).send({
										message: errorHandler.getErrorMessage(err)
									});
								} else {
									User.findOne({
										username: profile.emails[0].value.toLowerCase(),
										provider : 'WindowsAuthentication'
									}, function(err, user) {
										if (err) {
											return done(err);
										}
										if (!user) {
											return done(null, false, {
												message: 'Unknown user or invalid password'
											});
										}
										return done(null, user);
									})
								} //end of else
							});	
						} else {
							console.log("User found!")
							return done(null, user);
						}
					});
			} //end of else

		
		} //end of function
	));

};
