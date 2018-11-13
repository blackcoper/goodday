var express = require('express');
var router = express.Router();
var users_m = require('../models/users');
var config = require('../config/config');
var mongoose_connection = require('../lib/database_lib')(true);

router.route('/login')
	.all(function(req, res, next){
		// console.log(req.session)
		if(req.session.loged_in && req.session.user_group=='user'){
			res.redirect(config.site_url+'/')
		}else{
			next();
		}
	})
	.post(function(req, res){
		var schema = {
			'email': {
				isEmail: {
					errorMessage: 'Email must a valid email'
				},
				notEmpty: true,
				errorMessage: 'Email is required'
			},
			'pass': {
      			matches: {
					options: [/^[a-zA-Z0-9]+$/],
					errorMessage: 'Password must only contains alphanumeric',
				},
				notEmpty: true,
				errorMessage: 'Password is required',
			},
		};

		req.checkBody(schema);
		var errors = req.validationErrors(true);
		if(errors){
			console.log(errors)
			res.json({status: false, errors:errors});
		}else{
			users_m.findOne({ email: req.body.email.toLowerCase(), group:'user' }, function(err, user) {
			    if (err) throw err;
			    if(user){
				    user.comparePassword(req.body.pass, function(err, isMatch) {
				        if (err) throw err;
				        if(isMatch){
				        	req.session.loged_in = true;
				        	req.session.user_id = user._id;
				        	req.session.user_name = user.name;
				        	req.session.user_group = user.group;

				        	res.json({status: true, url:config.site_url+"/"});

				        }else{
				        	var errors = {
								0:{
									msg:'email or password invalid',
								}
							}
							res.json({status: false, errors:errors});
						}
				    });
				}else{
					var errors = {
						0:{
							msg:'email or password invalid',
						}
					}
					res.json({status: false, errors:errors});
				}
			});
		}
	});

router.route('/register')
	.all(function(req, res, next){
		if(req.session.loged_in && req.session.user_group=='user'){
			res.redirect(config.site_url+'/')
		}else{
			next();
		}
	})
	.post(function(req, res) {
		var schema = {
			'name': {
				matches: {
					options: [/^[a-zA-Z\s]+$/],
					errorMessage: 'Name must only contain alphabet and space',
				},
				notEmpty: true,
				errorMessage: 'Name is required'
			},
			'email': {
				isEmail: {
					errorMessage: 'Email must a valid email'
				},
				notEmpty: true,
				errorMessage: 'Email is required'
			},
			'pass': {
				isLength: {
      				options: [{ min: 6}],
      				errorMessage: 'Password min 6 chars long',
      			},
      			matches: {
					options: [/^[a-zA-Z0-9]+$/],
					errorMessage: 'Password must only contains alphanumeric',
				},
				notEmpty: true,
				errorMessage: 'Password is required',
			},
			'conf_pass': {
				equals: {
					options: [req.body.pass],
					errorMessage: 'Confirm Password must equal to Password'
				},
				notEmpty: true,
				errorMessage: 'Confirm Password is required'
			},
			'phone': {
				isLength: {
      				options: [{ min: 10, max: 15}],
      				errorMessage: 'Phone must between 10 and 15 number',
      			},
      			matches: {
					options: [/^[0-9]+$/],
					errorMessage: 'Phone must only contains number',
				},
				notEmpty: true,
      			errorMessage: 'Phone is required',
			},
			/*'date_birth': {
      			matches: {
					options: [/^[0-9]+$/],
					errorMessage: 'Date Birth must only contains number',
				},
				notEmpty: true,
      			errorMessage: 'Date Birth is required',
			},
			'month_birth': {
      			matches: {
					options: [/^[0-9]+$/],
					errorMessage: 'Month Birth must only contains number',
				},
				notEmpty: true,
      			errorMessage: 'Month Birth is required',
			},
			'year_birth': {
      			matches: {
					options: [/^[0-9]+$/],
					errorMessage: 'Year Birth must only contains number',
				},
				notEmpty: true,
      			errorMessage: 'Year Birth is required',
			},*/
			'city': {
      			matches: {
					options: [/^[a-zA-Z\s]+$/],
					errorMessage: 'City must only contains alphabet',
				},
				notEmpty: true,
      			errorMessage: 'City is required',
			},
			/*'tnc':{
				notEmpty: true,
				errorMessage: 'You Must Agree the TNC',
			}*/
		};

		req.sanitizeBody('name').trim();
		req.checkBody(schema);

		var errors = req.validationErrors(true);
		var data = {
			name: req.body.name,
			email: req.body.email.toLowerCase(),
			pass: req.body.pass,
			conf_pass: req.body.conf_pass,
			phone: req.body.phone,
			date_birth: req.body.date_birth,
			month_birth: req.body.month_birth,
			year_birth: req.body.year_birth,
			city: req.body.city,
			tnc: req.body.tnc,
		}

		if (errors) {
			res.json({status:false, errors: errors, data:data});
			return;
		} else {
			users_m.findOne({ 'email' :  data.email }, function(err, user) {
				if(user){
					var errors = {
						0:{
							msg:"Sorry we can't register your account at the moment..",
						}
					}
					res.json({status:false, errors: errors, data:data})
					return;
				}else{
					//data.dob = new Date(data.year_birth+'-'+data.month_birth+'-'+data.date_birth).toISOString();
					var user = new users_m(data);
					user.save(function(err,result){
						if(err) {
							console.log(err);
						}else{
							req.session.loged_in = true;
				        	req.session.user_id = user._id;
				        	req.session.user_name = user.name;
				        	req.session.user_group = user.group;

				        	res.json({status:true, url:config.site_url+"/"})
						}
					});
				}
			});
		}
	});

router.get('/logout', function(req, res, next){
	req.session.destroy(function(err){
		res.redirect(config.site_url+'/');
	});
});

module.exports = router;
