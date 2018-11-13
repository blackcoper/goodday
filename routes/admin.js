//===========================================================================
// INITIALIZE
//===========================================================================
var fs = require('fs'),
_ = require('underscore'),
path = require('path'),
Queue = require('bull'),
os = require('os'),
cluster = require('cluster'),
converter = [];

var express = require('express');
var router = express.Router();
var nodeExcel = require('excel-export');
var users_m = require('../models/users');
var exp_m = require('../models/experiments');
var config = require('../config/config');
var mongoose_connection = require('../lib/database_lib')(true);
var checkUser = require('../lib/authenticate');

//===========================================================================
// HELPER
//===========================================================================


fs.mkdirParent = function(dirPath) {
	var path = dirPath.replace(/\/$/, '').split('/');

	for (var i = 1; i <= path.length; i++) {
		var segment = path.slice(0, i).join('/');
		!fs.existsSync(segment) ? fs.mkdirSync(segment) : null ;
	}
};
/* GET home page. */
router.all('*', function(req, res, next){
	res.locals.admin_url = config.admin_url;
	res.locals.port_io_http = config.port_io_http;
	res.locals.port_io_https = config.port_io_https;
	next();
});

var workerMessageHandler;
function workerMessageHandlerWrapper(message) {
	if(workerMessageHandler) {
		workerMessageHandler(message);
	}
};
cluster.setupMaster({
	exec: './commands/screenshotsVideo.js',
	// args: ['--socket', 'abc','--video', '12354','--json', '123asdb']
});
var workers = [];
var worker;
var _i = 0;
for(_i; _i < os.cpus().length - 1; _i++) {
	worker = cluster.fork();
	worker.on('message', workerMessageHandlerWrapper);
	workers.push(worker);
	console.log('Worker spawned: #', worker.id);
};

var extractQueue = Queue('extractVideo', config.redis_port, config.redis_host);
workerMessageHandler = function(job) {
	console.log('process.send');
};

global.io_developer = io.of('/developer');
io_developer.on('connection', function(socket) {
	console.log(socket.id + ' connected io /developer');
	io_developer.sockets[socket.id].emit("whisper", 'test');
	socket.on('disconnect', function(e) {
		var target=_.findWhere(converter, {socket: this.id});
		if(target){
			extractQueue.getJob(target.job).then(function (returnedJob) {
				returnedJob.moveToFailed(new Error('user disconnected.'));
			});
		}
		console.log(this.id+' disconnected');
	});
	socket.on('worker_extractVideo_progress', function(msg){
		var target=_.findWhere(converter, {job: msg.id});
		if(target){
			console.log(target.socket);
			if(io_developer.sockets[target.socket]){
				io_developer.sockets[target.socket].emit("client_extractVideo_progress", msg.progress);
			}
		}
	});
	socket.on('worker_extractVideo_failed', function(msg){
		console.log("failed:"+JSON.stringify(msg))
		var target=_.findWhere(converter, {job: msg.id});
		converter = _.without(converter, target);
		if(target){
			if(io_developer.sockets[target.socket]){
				io_developer.sockets[target.socket].emit("client_extractVideo_failed", msg.error);
			}
		}
	});
	socket.on('worker_extractVideo_completed', function(msg){
		console.log("completed:"+JSON.stringify(msg))
		var target=_.findWhere(converter, {job: msg.id});
		converter = _.without(converter, target);
		if(target){
			if(io_developer.sockets[target.socket]){
				io_developer.sockets[target.socket].emit("client_extractVideo_completed", "job id:"+msg.id+' completed');
			}
		}
	});
});

//===========================================================================
// ROUTE VIEW
//===========================================================================

// router.get('/', function(req, res, next) {
//     res.render('developer/home', {
//         title: 'NOTES'
//     });
// });
var matador = require('bull-ui/app')({
	redis: {
    host: config.redis_host,
    port: config.redis_port
  }
});
router.use('/matador', function(req, res, next){
	console.log(req.originalUrl);
	_url = '//'+config.hostname+'/'+config.admin_url+'/matador'
	// if(req.originalUrl.indexOf('api') > -1){
	// 	_url = ''
	// }
	//http://192.168.88.15/p4n3lb04rd/matador/
	// if(req.originalUrl == '/p4n3lb04rd/matador'){
	// 	_url = './matador'
	// }else{
	// 	_url = '../matador'
	// }
	req.basepath = _url;
  res.locals.basepath =_url;
  next();
}, matador);

router.get('/current_time', checkUser('admin', '/'+config.admin_url+'/login'), function(req, res, next) {
    res.render('admin/current_time', {
        title: 'Get Current Time'
    });
});
router.get('/detect_face', checkUser('admin', '/'+config.admin_url+'/login'), function(req, res, next) {
    res.render('admin/detect_face', {
        title: 'Detect Face'
    });
});
router.get('/accessories', checkUser('admin', '/'+config.admin_url+'/login'), function(req, res, next) {
    res.render('admin/accessories', {
        title: 'create accessories images'
    });
});
router.get('/poisson', checkUser('admin', '/'+config.admin_url+'/login'), function(req, res, next){
    res.render('admin/poisson', {
        title: 'Detect Face'
    });
})

router.route('/').all(checkUser('admin', '/'+config.admin_url+'/login')).get(function(req, res){
	res.render('admin/index', { title: 'Dashboard' });
});

router.get('/report/export', checkUser('admin', '/'+config.admin_url+'/login'), function(req, res){
	end = new Date();
	end.setHours(23, 59, 59);
	query = {group:'user', datecreated:{$lt:end.toISOString()}}

	if(start=req.query.date_from){
		query.datecreated.$gte = new Date(start).toISOString();
	}

	if(end=req.query.date_to){
		end = new Date(end);
		end.setHours(23, 59, 59);
		query.datecreated.$lt = end.toISOString();
	}

	users_m.find(query).select('name email dob phone city datecreated').lean().exec(function(err, user){
		if(err){console.log(err); return;}
		var conf ={};
	    conf.name = "Report";
	  	conf.cols = [{
			caption:'Name',
	        type:'string',
	        width: 60,
		},{
			caption:'Email',
			type:'string',
			width: 35,
	  	},{
			caption:'Dob',
			type:'string',
			width: 25,
		},{
			caption:'Phone',
			type:'string',
			width: 20,
		},{
			caption:'City',
			type:'string',
			width: 35,
		},{
			caption:'Date Register',
			type:'string',
			width: 25,
	  	}];
	  	conf.rows = [];
	  	month = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
	  	for(var i = 0; i < user.length; i++){
	  		dob = new Date(user[i].dob);
	  		datecreated = new Date(user[i].datecreated);
	  		data =[user[i].name, user[i].email, dob.getDate()+' '+month[dob.getMonth()]+' '+dob.getFullYear(), user[i].phone, user[i].city, datecreated.getDate()+' '+month[datecreated.getMonth()]+' '+datecreated.getFullYear()];
	  		conf.rows.push(data);
	  	}
	  	var result = nodeExcel.execute(conf);
	  	res.setHeader('Content-Type', 'application/vnd.openxmlformats');
	  	res.setHeader("Content-Disposition", "attachment; filename=" + "GoodayReport.xlsx");
	  	res.end(result, 'binary');
	});
});

router.get('/report_exp/export', checkUser('admin', '/'+config.admin_url+'/login'), function(req, res){
	end = new Date();
	end.setHours(23, 59, 59);
	query = {datecreated:{$lt:end.toISOString()}}

	if(start=req.query.date_from){
		query.datecreated.$gte = new Date(start).toISOString();
	}

	if(end=req.query.date_to){
		end = new Date(end);
		end.setHours(23, 59, 59);
		query.datecreated.$lt = end.toISOString();
	}
	exp_m.find(query).sort({datecreated:'desc'}).populate({path: 'user',select:'name '}).exec(function(err, exp){
	// users_m.find(query).select('name email dob phone city datecreated').lean().exec(function(err, user){
		if(err){console.log(err); return;}
		var conf ={};
	    conf.name = "Report Video Experiments";
	  	conf.cols = [{
			caption:'Name',
	        type:'string',
	        width: 50,
		},{
			caption:'Date Created',
			type:'string',
			width: 40,
	  },{
			caption:'Gender',
			type:'string',
			width: 20,
	  },{
			caption:'Video',
			type:'string',
			width: 20,
		},{
			caption:'Accessories',
			type:'string',
			width: 20,
		},{
			caption:'Message',
			type:'string',
			width: 100,
		}];
  	conf.rows = [];
  	month = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
		list_video = ['India','Coachella ','HipHop','Jepang'];
		list_effect = ['confetti','confetti2','plasma','fireworks'];
  	for(var i = 0; i < exp.length; i++){
  		datecreated = new Date(exp[i].datecreated);
  		data =[exp[i].user.name, datecreated.getDate()+' '+month[datecreated.getMonth()]+' '+datecreated.getFullYear()+' ' +datecreated.getHours()+':'+datecreated.getMinutes(),exp[i].options.gender, list_video[exp[i].options.video] || '', list_effect[exp[i].options.accessories] || '',exp[i].options.message];
  		conf.rows.push(data);
  	}
  	var result = nodeExcel.execute(conf);
  	res.setHeader('Content-Type', 'application/vnd.openxmlformats');
  	res.setHeader("Content-Disposition", "attachment; filename=" + "GoodayVideoReport.xlsx");
  	res.end(result, 'binary');
	});
});

router.route('/report/:page?')
	.all(checkUser('admin', '/'+config.admin_url+'/login'))
	.get(function(req, res) {
		page = req.params.page || 1;
		to = new Date();
		to.setHours(23, 59, 59);
		query = {group:'user', datecreated:{$lte:to.toISOString()}}
		filter = req.session.filter || {};

		if(start=filter.date_from){
			query.datecreated.$gte = new Date(start).toISOString();
		}

		if(end=filter.date_to){
			end = new Date(end);
			end.setHours(23, 59, 59);
			query.datecreated.$lte = end.toISOString();
		}

		users_m.find(query).limit(config.limit_per_page).skip(config.limit_per_page*(page-1)).select('name email dob phone city datecreated').sort({datecreated:'desc'}).exec(function(err, user){
			if(err){console.log(err); return;}
			users_m.count(query).exec(err, function(err, count){
				if(err){console.log(err); return;}
				user.page = page;
				user.pages = Math.ceil(count / config.limit_per_page);
				user.limit = config.limit_per_page;
				res.render('admin/report', { title: 'Report', filter:filter, users:user });
			})
		});
	})
	.post(function(req, res){
		page = req.params.page || 1;
		to = new Date();
		to.setHours(23, 59, 59);
		query = {group:'user', datecreated:{$lte:to.toISOString()}}
		filter = {};
		req.session.filter= filter;

		if(start=req.body.date_from){
			query.datecreated.$gte = new Date(start).toISOString();
			filter.date_from = start;
		}

		if(end=req.body.date_to){
			filter.date_to = end;
			end = new Date(end);
			end.setHours(23, 59, 59);
			query.datecreated.$lte = end.toISOString();
		}

		req.session.filter= filter;
		users_m.find(query).limit(config.limit_per_page).skip(config.limit_per_page*(page-1)).select('name email dob phone city datecreated').sort({datecreated:'desc'}).exec(function(err, user){
			if(err){console.log(err); return;}
			users_m.count(query).exec(err, function(err, count){
				if(err){console.log(err); return;}
				user.page = page;
				user.pages = Math.ceil(count / config.limit_per_page);
				user.limit = config.limit_per_page;
				res.render('admin/report', { title: 'Report', filter:filter, users:user });
			})
		});
	});
router.route('/report_exp/:page?')
	.all(checkUser('admin', '/'+config.admin_url+'/login'))
	.get(function(req, res) {
		page = req.params.page || 1;
		to = new Date();
		to.setHours(23, 59, 59);
		query = {datecreated:{$lte:to.toISOString()}}
		filter = req.session.filter || {};

		if(start=filter.date_from){
			query.datecreated.$gte = new Date(start).toISOString();
		}

		if(end=filter.date_to){
			end = new Date(end);
			end.setHours(23, 59, 59);
			query.datecreated.$lte = end.toISOString();
		}

		exp_m.find(query).limit(config.limit_per_page).skip(config.limit_per_page*(page-1)).sort({datecreated:'desc'}).populate({path: 'user',select:'name '}).exec(function(err, exp){
			console.log(exp[0]);
			if(err){console.log(err); return;}
			exp_m.count(query).exec(err, function(err, count){
				if(err){console.log(err); return;}
				exp.page = page;
				exp.pages = Math.ceil(count / config.limit_per_page);
				exp.limit = config.limit_per_page;
				res.render('admin/report_exp', { title: 'Report', filter:filter, exps:exp });
			})
		});
	})
	.post(function(req, res){
		page = req.params.page || 1;
		to = new Date();
		to.setHours(23, 59, 59);
		query = {group:'user', datecreated:{$lte:to.toISOString()}}
		filter = {};
		req.session.filter= filter;

		if(start=req.body.date_from){
			query.datecreated.$gte = new Date(start).toISOString();
			filter.date_from = start;
		}

		if(end=req.body.date_to){
			filter.date_to = end;
			end = new Date(end);
			end.setHours(23, 59, 59);
			query.datecreated.$lte = end.toISOString();
		}

		req.session.filter= filter;
		users_m.find(query).limit(config.limit_per_page).skip(config.limit_per_page*(page-1)).select('name email dob phone city datecreated').sort({datecreated:'desc'}).exec(function(err, user){
			if(err){console.log(err); return;}
			users_m.count(query).exec(err, function(err, count){
				if(err){console.log(err); return;}
				user.page = page;
				user.pages = Math.ceil(count / config.limit_per_page);
				user.limit = config.limit_per_page;
				res.render('admin/report', { title: 'Report', filter:filter, users:user });
			})
		});
	});
router.route('/login')
	.all(function(req, res, next){
		if(req.session.loged_in && req.session.user_group=='admin'){
			res.redirect('./');
		}else{
			next();
		}
	})
	.get(function(req, res) {
		res.render('admin/login', { title: 'Login', errors:'' });
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
			'password': {
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
			res.render('admin/login', { title: 'Login', errors:errors });
		}else{
			users_m.findOne({ email: req.body.email, group:'admin' }, function(err, user) {
			    if (err) throw err;
			    if(user){
				    user.comparePassword(req.body.password, function(err, isMatch) {
				        if (err) throw err;
				        if(isMatch){
				        	req.session.loged_in = true;
				        	req.session.user_id = user._id;
				        	req.session.user_name = user.name;
				        	req.session.user_group = user.group;
				        }
				        res.redirect('./');
				    });
				}else{
					var errors = {
						0:{
							msg:'email or password invalid',
						}
					}
					res.render('admin/login', { title: 'Login', errors:errors });
				}
			});
		}
	});

router.get('/logout', function(req, res, next){
	req.session.destroy(function(err){
		res.redirect('/'+config.admin_url+'/login');
	});
});

//===========================================================================
// ROUTE API
//===========================================================================
// ****** GET ******
// get all file json in folder json
router.get('/current_time/json_time', function(req, res, next) {
    fs.readdir('./public/json', function(err, files) {
        if (err) {
            res.send(JSON.parse(err));
        }
        var p = "./public/json";
        result = [];
        files.map(function(file) {
            return file;
        }).filter(function(file) {
            return fs.statSync(p + '/' + file).isFile();
        }).forEach(function(file) {
            result.push(file);
        });
        res.send('{"result":"success","files":' + JSON.stringify(result) + '}')
    });
});
// get all file json in folder json
router.get('/detect_face/img_folder', function(req, res, next) {
    fs.readdir('./public/video/images', function(err, files) {
        if (err) {
            res.send(JSON.parse(err));
        }
        var p = "./public/video/images";
        result = [];
        files.map(function(file) {
            return file;
        }).filter(function(file) {
            return fs.statSync(p + '/' + file).isDirectory();
        }).forEach(function(file) {
            result.push(file);
        });
        res.send('{"result":"success","folder":' + JSON.stringify(result) + '}')
    });
});
// ****** PUT ******
// put array currentTime which provide by video
// time => ['0.1345345','1.2534534' ... '12.4534534']
router.put('/current_time/json_time', function(req, res, next) {
    fs.stat('./public/json', function(err, stat) {
        if (err) {
            fs.mkdirParent('./public/json');
        }
    });
    var tempFile = fs.createWriteStream("./public/json/" + req.body.name + ".json"); //Date.now()
    tempFile.on('open', function(fd) {
        tempFile.write(req.body.time);
        tempFile.end();
        res.send('{"result":"success","path":' + JSON.stringify(path.parse(tempFile.path)) + '}');
    });
});
// put array currentTime which provide by video
// data => ['0.1345345','1.2534534' ... '12.4534534']
// name => 'name file'
router.put('/detect_face/json_result', function(req, res, next) {
    fs.stat('./public/json/result', function(err, stat) {
        if (err) {
            fs.mkdirParent('./public/json/result');
        }
    });
    var tempFile = fs.createWriteStream("./public/json/result/" + req.body.name + ".json"); //Date.now()
    tempFile.on('open', function(fd) {
        tempFile.write(req.body.data);
        tempFile.end();
        res.send('{"result":"success","path":' + JSON.stringify(path.parse(tempFile.path)) + '}');
    });
});

// ****** POST ******
// post json file name
// json => filename+ext
// video => sample 'public/video/cap13_edit.mp4'
// socket_id  => to deliver msg
router.post('/video_to_images', function(req, res, next) {
    var stats = fs.lstatSync('./public/json/' + req.body.json);
    if (!stats.isFile()) {
        return res.send('{"error":"json file not found."}')
    }
    stats = fs.lstatSync('./public/' + req.body.video);
    if (!stats.isFile()) {
        return res.send('{"error":"video file not found."}')
    }
    if (typeof(req.body.socket_id) == 'undefined') {
        return res.send('{"error":"socket.io is not connected."}')
    }
    var target=_.findWhere(converter, {socket: req.body.socket_id});
    if(target){
      return res.send('{"error":"already request job id:'+target.job+'"}')
    }
    extractQueue.add({
      socket  : req.body.socket_id,
      json    : './public/json/' + req.body.json,
      video   : './public/' + req.body.video
    }).then(function (job) {
      converter.push({'socket':job.data.socket,'job':job.jobId})
    });
    res.send('{"result":"success create process extract video to image"}');
});
// upload images accessories
// name => folder name
// filename => filename
// image => raw base64 image
router.post('/accessories/upload',function(req, res, next){
  var directory = "./public/video/accessories/"+req.body.name+'/'+req.body.video+ '/';
  fs.stat(directory, function (err, stat) {
    if (err) {
      fs.mkdirParent(directory);
    }
    var matches = req.body.image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
    imageBuffer = {};
    if (matches.length !== 3) {
      return new Error('Invalid input string');
    }
    imageBuffer.type = matches[1];
    imageBuffer.data = new Buffer(matches[2], 'base64');

    var tempFile = fs.createWriteStream("./public/video/accessories/" +req.body.name+ '/'+req.body.video+ '/' + req.body.filename + ".png"); //Date.now()
    tempFile.on('open', function(fd) {
        tempFile.write(imageBuffer.data);
        tempFile.end();
        res.send('{"result":"success","path":' + JSON.stringify(path.parse(tempFile.path)) + '}');
    });
  })
})

module.exports = router;
