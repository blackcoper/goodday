//===========================================================================
// INITIALIZE
//===========================================================================
var fs = require('fs'),
    _ = require('underscore'),
    path = require('path'),
    express = require('express'),
    router = express.Router(),
    config = require('../config/config'),
    Queue = require('bull'),
    os = require('os'),
    cluster = require('cluster'),
    converter = [];


fs.mkdirParent = function(dirPath) {
    var path = dirPath.replace(/\/$/, '').split('/');

    for (var i = 1; i <= path.length; i++) {
        var segment = path.slice(0, i).join('/');
        !fs.existsSync(segment) ? fs.mkdirSync(segment) : null ;
    }
};

router.all('*', function(req, res, next) {
    res.locals.port_io_http = config.port_io_http;
    res.locals.port_io_https = config.port_io_https;
    next();
});

cluster.setupMaster({
  exec: './commands/screenshotsVideo.js',
  // args: ['--socket', 'abc','--video', '12354','--json', '123asdb']
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

var extractQueue = Queue('extractVideo', config.redis_port, config.redis_host);
workerMessageHandler = function(job) {
  console.log('process.send');
};

global.io_developer = io.of('/developer');
io_developer.on('connection', function(socket) {
  console.log(socket.id + ' connected io /developer');
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
// for(_i; _i < workers.length; _i++) {
//   workers[_i].kill();
// }

//===========================================================================
// ROUTE VIEW
//===========================================================================
router.get('/', function(req, res, next) {
    res.render('developer/home', {
        title: 'NOTES'
    });
});
router.get('/generate/current_time', function(req, res, next) {
    res.render('developer/current_time', {
        title: 'Get Current Time'
    });
});
router.get('/generate/detect_face', function(req, res, next) {
    res.render('developer/detect_face', {
        title: 'Detect Face'
    });
});
router.get('/generate/accessories', function(req, res, next) {
    res.render('developer/accessories', {
        title: 'Detect Face'
    });
});
router.get('/poisson',function(req, res, next){
    res.render('developer/poisson', {
        title: 'Detect Face'
    });
})

//===========================================================================
// ROUTE API
//===========================================================================
// ****** GET ******
// get all file json in folder json
router.get('/generate/current_time/json_time', function(req, res, next) {
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
router.get('/generate/detect_face/img_folder', function(req, res, next) {
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
router.put('/generate/current_time/json_time', function(req, res, next) {
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
router.put('/generate/detect_face/json_result', function(req, res, next) {
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
router.post('/generate/video_to_images', function(req, res, next) {
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
router.post('/generate/accessories/upload',function(req, res, next){
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
//===========================================================================
// HELPER
//===========================================================================

module.exports = router;
