var express = require('express');
var router = express.Router();
var checkUser = require('../lib/authenticate');
var city_m = require('../models/city');
var users_m = require('../models/users');
var experiments_m = require('../models/experiments');
var config = require('../config/config');
var mongoose_connection = require('../lib/database_lib')(true);
var crypto = require('crypto');
var mail_lib = require('../lib/email_lib');
var upload = require('../lib/upload');
var mail = new mail_lib();

var Queue = require('bull'),
fs = require('fs'),
path = require('path'),
url = require('url'),
_ = require('underscore'),
os = require('os'),
cluster = require('cluster'),
renderer = [];

// DEBUG QUEUE BULL
// var matador = require('bull-ui/app')({
//   redis: {
//     host: config.redis_host,
//     port: config.redis_port
//   }
// });
// matador.listen(config.bull_ui_port, function(){
//   console.log('bull-ui is listening on port', this.address().port);
// });
// ----------------------------------------
router.all('*', function(req, res, next){
	res.locals.url = (req.url).split("/");
	res.locals.loged_in = req.session.loged_in;
	res.locals.port_io_http = config.port_io_http;
	res.locals.port_io_https = config.port_io_https;
	res.locals.user_id = req.session.user_id;
	res.locals.user_name = req.session.user_name;
	res.locals.user_group = req.session.user_group;
	// res.cookie('XSRF-TOKEN', req.csrfToken());
	// res.locals._csrf = req.csrfToken();
	res.locals.cities = []
	city_m.find({}).lean().exec(function(err, city){
		if(err){console.log(err); return;}
		res.locals.cities = city;
		next();
	});
});
// SETUP WORKER & CLUSTER
cluster.setupMaster({
  exec: './commands/renderVideo.js',
});
var workerMessageHandler;
function workerMessageHandlerWrapper(message) {
  if(workerMessageHandler) {
    workerMessageHandler(message);
  }
};
var workers = [];
var worker;
var _i = 0;
for(_i; _i < os.cpus().length - 1; _i++) {
  worker = cluster.fork();
  worker.on('message', workerMessageHandlerWrapper);
  workers.push(worker);
  console.log('Worker spawned: #', worker.id);
};

var renderQueue = Queue('renderVideo', config.redis_port, config.redis_host);
workerMessageHandler = function(job) {
  console.log('process.send');
};

global.io_experiment = io.of('/experiment');
io_experiment.on('connection', function(socket) {
  console.log(socket.id + ' connected io /experiment');
  socket.on('disconnect', function(e) {
    _.every(renderer,function(target){
      if(_.contains(target.socket,this.id)){
        target.socket = _.without(target.socket,this.id)
        if(target.socket.length==0){
          renderer = _.without(renderer,target)
          renderQueue.getJob(target.job).then(function (returnedJob) {
            returnedJob.moveToFailed(new Error('user disconnected.'));
          });
        }
        return false;
      }else{
        return true;
      }
    })
    // var target=_.findWhere(renderer, {socket: this.id});
    // if(target){
    //   renderQueue.getJob(target.job).then(function (returnedJob) {
    //     returnedJob.moveToFailed(new Error('user disconnected.'));
    //   });
    // }
    console.log(this.id+' disconnected');
  });
  socket.on('worker_renderVideo_progress', function(msg){
    var target=_.findWhere(renderer, {job: msg.id});
    if(target){
      _.each(target.socket,function(subtarget){
        if(io_experiment.sockets[subtarget]){
          io_experiment.sockets[subtarget].emit("client_renderVideo_progress", msg.progress);
        }
      })
    }
  });
  socket.on('worker_renderVideo_failed', function(msg){
    console.log("failed:"+JSON.stringify(msg))
    var target=_.findWhere(renderer, {job: msg.id});
    renderer = _.without(renderer, target);
    if(target){
      _.each(target.socket,function(subtarget){
        if(io_experiment.sockets[subtarget]){
          io_experiment.sockets[subtarget].emit("client_renderVideo_failed", msg.error);
        }
      })
      // if(io_experiment.sockets[target.socket]){
      //   io_experiment.sockets[target.socket].emit("client_renderVideo_failed", msg.error);
      // }
    }
  });
  socket.on('worker_renderVideo_completed', function(msg){
    // console.log("completed:"+JSON.stringify(msg))
    var video_url = './userfiles/'+msg.data.user+'/'+msg.data.exp+'.mp4';
    var target=_.findWhere(renderer, {job: msg.id});
    renderer = _.without(renderer, target);
    if(target){
      var result = {
        video_url : video_url
      }
      _.each(target.socket,function(subtarget){
        if(io_experiment.sockets[subtarget]){
          io_experiment.sockets[subtarget].emit("client_renderVideo_completed", JSON.stringify(result));
        }
      })
      // if(io_experiment.sockets[target.socket]){
      //   io_experiment.sockets[target.socket].emit("client_renderVideo_completed", JSON.stringify(result));
      // }
    }
  });
});

router.get('/', function(req, res, next){
	res.render('home', {title: 'Home'});
});
router.get('/experiment', checkUser('user', './#login'), function(req, res, next){
  // res.locals.fb_appid = config.FB_APPID;
  res.locals.fb_appid = config.FB_APPID;
	res.locals.fb_text = config.fb_text;
	res.locals.tw_text = config.tw_text;
	res.render('experiment', {title:'Start Experiment'});
});
router.get('/experiment/:exp_id', function(req, res, next){
	if(req.params.exp_id){
		experiments_m.findOne({_id :req.params.exp_id},function(err, experiment){
	    // if (err) throw err;
			res.locals.fb_appid = config.FB_APPID;
			res.locals.fb_text = config.fb_text;
			res.locals.tw_text = config.tw_text;
	    if(experiment){
				ex_data = JSON.parse(JSON.stringify(experiment));
				try{
					var stats = fs.lstatSync('./public/userfiles/' + experiment.user + '/' + experiment._id + '.mp4');
					ex_data.fileReady = stats.isFile()+'';
			  }catch(e){}
	      // console.log(experiment.fileReady);
	      res.render('experiment', {title:'Start Experiment',data:JSON.stringify(ex_data)});
	    }else{
	      res.redirect('/experiment');
	    }
	  })
	}else{
		res.redirect('/experiment');
	}
});

//POST
// socket id nsp#id
// user_id : user id session
// exp_id : experiment_id
// accessories : id accessories choosen
router.post('/experiment/download', function(req, res, next){
  var user_id = req.body.user != '' ? req.body.user : res.locals.user_id;
  try{
    var stats = fs.lstatSync('./public/userfiles/' + user_id + '/' + req.body.exp_id + '.mp4');
    if(stats.isFile()){
      return res.send('{"success":"ready to download","url_video":"./userfiles/' + user_id + '/' + req.body.exp_id + '.mp4"}')
    }
  }catch(e){}
  try{
  	stats = fs.lstatSync('./public/userfiles/' + user_id);
  	if (!stats.isDirectory()) {
  			return res.send('{"error":"userfiles folder not found."}')
  	}
  }catch(e){
    return res.send('{"error":"userfiles folder not found."}')
  }
  try{
  	stats = fs.lstatSync('./public/userfiles/' + user_id + '/face-' + req.body.exp_id + '.png');
  	if (!stats.isFile()) {
  			return res.send('{"error":"face file not found."}')
  	}
  }catch(e){
    return res.send('{"error":"face file not found."}')
  }
  try{
  	stats = fs.lstatSync('./public/userfiles/' + user_id + '/mouth-' + req.body.exp_id + '.png');
  	if (!stats.isFile()) {
  			return res.send('{"error":"mouth file not found."}')
  	}
  }catch(e){
    return res.send('{"error":"mouth file not found."}')
  }
	if (typeof(req.body.socket_id) == 'undefined') {
			return res.send('{"error":"socket.io is not connected."}')
	}
	var target=_.findWhere(renderer, {exp: req.body.exp_id});
	if(target){ // also check by exp_id and connect the socket fisrt request.
    socket =_.findWhere(target.socket, {socket: req.body.socket_id});
    if(!socket){
      target.socket.push(req.body.socket_id); // NOT TESTED
    }
		return res.send('{"error":"already request job id:'+target.job+'"}')
	}
	renderQueue.add({ // MAYBE, COLLECT DATA FROM MONGODB.
		socket  : req.body.socket_id,
    user    : user_id,
		gender  : req.body.gender,
		exp     : req.body.exp_id,
		acc     : req.body.accessories,
    video   : {
      id : req.body.video_id,
      url : req.body.video_url,
      name : req.body.video_name,
      message : req.body.message
    }
	}).then(function (job) {
		renderer.push({'exp':req.body.exp_id,'socket':[job.data.socket],'job':job.jobId})
	});
	res.send('{"result":"success create process render image to video"}');
});
router.get('/force-download',function(req,res,next){
  var parts = url.parse(req.url, true);
  var query = parts.query;
  var file = __dirname + '/../public/'+query.url;
  return res.download(file);
  var filename = path.basename(file);
  // var mimetype = mime.lookup(file);
  res.setHeader('Content-disposition', 'attachment; filename=' + filename);
  res.setHeader('Content-type', 'video/mp4');
  var filestream = fs.createReadStream(file);
  filestream.pipe(res);
})
router.post('/experiment/upload',checkUser('user', '/'), function(req,res,next){
	upload.uploadImage("./public/uploads/temp",req.files.image,function(e){
		res.json([e.path]);
	});
});
// POST SAVE EXPERIMENT
/* req.body.gender = 'male'
*  req.body.faceimage = base64 image encoded
*  req.body.mouthimage = base64 image encoded */
router.post('/experiment/save',checkUser('user', '/'), function(req,res,next){
	var data = {
		user	: res.locals.user_id,
    options	: {
			gender:req.body.gender,
      video: req.body.video,
      accessories: req.body.accessories,
			message: ''
		},
	}
	var experiment = new experiments_m(data);
	experiment.save(function(err,result){
		if(err) {
			res.json({'error':err});
		}else{
			id = experiment._id;
			// var id = Date.now();
			upload.uploadRawImage("./public/userfiles/"+res.locals.user_id,'face-'+id+'.png',req.body.faceimage,function(c){
				if(c.error)return res.json({'error':c.error});
				upload.uploadRawImage("./public/userfiles/"+res.locals.user_id,'mouth-'+id+'.png',req.body.mouthimage,function(e){
					if(e.error)return res.json({'error':e.error});
					res.json({status:'success', id:id, mouth:e.path, face:c.path});
				});
			});
		}
	});
});

router.post('/experiment/saveMessage',checkUser('user','/'), function(req,res,next){
		var query = {_id:req.body.id};
		options = {message:req.body.message};
		// {$set: {'address.street': 'new street name'}},
		experiments_m.findOneAndUpdate(query, {$set :{'options.message':req.body.message}}, function(err, doc){
		    if (err) return res.status(500).send({ error: err });
		    res.json({status:'success', id:req.body.id, message:req.body.message});
		});
})

router.get('/syarat-ketentuan', function(req, res, next){
	res.render('tnc', {title:'Syarat dan Ketentuan'});
});

router.route('/forgot')
	.get(function(req, res, next){
		res.render('forgot', {title:'Forgot Password', errors:{}});
	})
	.post(
		function(req, res, next){
			console.log('post');
			var schema = {
				'email': {
					isEmail: {
						errorMessage: 'Email must a valid email'
					},
					notEmpty: true,
					errorMessage: 'Email is required'
				},
			}
			req.sanitizeBody('name').trim();
			req.checkBody(schema);

			var errors = req.validationErrors(true);
			if(errors){
				res.render('forgot', {title:'Forgot Password', errors:errors});
			}else{
				next();
			}
		},
		function(req, res, next){
			users_m.findOne({email: req.body.email}, function(err, user){
				if(err) console.log(err);
				if(!user){
					errors = {
						0:{
							msg:'User Not Found',
						}
					}
					res.render('forgot', {title:'Forgot Password', errors:errors});
				}else{
					crypto.randomBytes(20, function(err, buf) {
						var token = buf.toString('hex');

						user.reset_token = token;
						user.reset_expires = Date.now() + 3600000;

						user.save(function(err, result){
							if(err){
								errors = {
									0:{
										msg:'Failed to reset password',
									}
								}
								res.render('forgot', {title:'Forgot Password', errors:errors});
							}else{
								var $data = {
									email: user.email,
									subject: 'Reset Password',
									html: '',
									text: 'reset password link: \n\n https://' + config.hostname  + config.site_url + '/reset/' + token,
								};
								mail.sendEmail($data, function(err, responseStatus){
									if(err){
										console.log('err '+err);
									}else{
										errors = {
											0:{
												msg:'Reset password success, please check your email',
											}
										}
										res.render('forgot', {title:'Forgot Password', errors:errors});
									}
								});
							}
						});
					});
				}
			}
		);
	});

router.route('/reset/:token')
	.get(function(req, res, next){
		users_m.findOne({reset_token:req.params.token, reset_expires:{$gt:Date.now()}}, function(err, user){
			if(!user){
				res.redirect('/');
			}else{
				res.render('reset', {title: 'Reset Password', errors:{}});
			}
		})
	})
	.post(
		function(req, res, next){
			var schema = {
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
			}
			req.sanitizeBody('pass').trim();
			req.sanitizeBody('conf_pass').trim();
			req.checkBody(schema);

			var errors = req.validationErrors(true);
			if(errors){
				res.render('reset', {title:'Reset Password', errors:errors});
			}else{
				next();
			}
		},
		function(req, res, next){
			users_m.findOne({reset_token:req.params.token, reset_expires:{$gt:Date.now()}}, function(err, user){
				if(err) console.log(err);
				if(!user){
					errors = {
						0:{
							msg:'Reset token invalid or expired',
						}
					}
					res.render('forgot', {title:'Reset Password', errors:errors});
				}else{
					user.pass = req.body.pass;

					user.save(function(err, result){
						if(err) console.log(err);
						if(result){
							var $data = {
								email: user.email,
								subject: 'Reset Password Success',
								html: '',
								text: 'reset password success, please login to your acount with your new password',
							};
							mail.sendEmail($data, function(err, responseStatus){
								if(err){
									console.log('err '+err);
								}else{
									errors = {
										0:{
											msg:'Reset password success, please check your email',
										}
									}
									res.render('reset', {title:'Reset Password', errors:errors});
								}
							});
						}
					});
				}
			});
		}
	);

module.exports = router;
