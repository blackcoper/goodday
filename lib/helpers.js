var fs = require('fs'),
	_ = require('underscore');
var install_data = require('../installer/data');
var config = require('../config/config');
//var users_m = require('../models/users');
//var city_m = require('../models/city');

module.exports = function(parent, config) {
	var init_function = function(callback){
		_.each(install_data, function(value, index){
			var model = require(value.target_model);

			model.count({}, function(err, count){
				if(count==0){
					model.create(value.data, function(err, data){
						if(err) console.log(err);
					});
				}
			})
		});
		callback();
	}

	/*var init_city_function = function(callback){
		city_m.count({}, function(err, count){
			if(err) console.log(err);

			if(count==0){

			}
		});
		callback();
	}*/

	init_function(function(){
		console.log('installer jalan');
	});

	parent.use(function(req,res,next){
		res.locals.site_url = function(){
			var port =   config.port_http || parent.get('port');
			// return req.protocol + '://' + req.hostname  + ( port == 80 || port == 443 ? '' : ':'+port );
			return 'http://' + config.hostname  + config.site_url;
		};

		next();
	});
}
