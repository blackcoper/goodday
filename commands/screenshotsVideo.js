console.log('start process screenshotsVideo '+process.pid);

var fs = require('fs'),
path = require('path'),
config = require('../config/config'),
Queue = require('bull'),
path_ffmpeg = require('ffmpeg-static'),
path_ffprobe = require('ffprobe-static'),
commandffmpeg = require('fluent-ffmpeg');

commandffmpeg.setFfmpegPath(path_ffmpeg.path);
commandffmpeg.setFfprobePath(path_ffprobe.path);

var STD_QUEUE_NAME = 'extractVideo';
function buildQueue(name) {
  var qName = name || STD_QUEUE_NAME;
  return new Queue(qName, config.redis_port, config.redis_host);
}
var LimitedRange = function(value, inMin, inMax, outMin, outMax) {
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}
var socket = require('socket.io-client')('http://'+config.host_socket_io+':'+config.port_io_http+'/developer');
// socket.on('client_extractVideo_disconnect', function(id, msg){
//   console.log(id, msg);
// })

var queue = buildQueue();
queue.empty();
queue.on('progress', function(job, progress){
  socket.emit('worker_extractVideo_progress', { id: job.jobId, progress:progress});
})
.on('failed', function(job, err){
  socket.emit('worker_extractVideo_failed', { id: job.jobId, error:err.message});
})
.on('completed', function (job) {
  socket.emit('worker_extractVideo_completed', { id: job.jobId});
});

queue.process(1, function(job, jobDone) {
  fs.readFile(job.data.json, "utf8", function(err, data) {

      if (err || data == undefined) {
          // res.send('{"error":"json file cannot read."}')
          return jobDone(Error('json file cannot read.'));
      }
      var temp = JSON.parse(data);
      var length = temp.length;
      var _path = path.parse(job.data.video)
      var start_screenshots = function() {
          var proc = new commandffmpeg(__dirname + '/../' + job.data.video)
              .on('start', function(commandLine) {
                  // console.log('Spawned Ffmpeg with command: ' + commandLine);
              })
              .on('codecData', function(data) {
                  // console.log('Input is ' + data.audio + ' audio ' + 'with ' + data.video + ' video');
              })
              .on('progress', function(progress) {
                  job.isFailed().then(function(isFailed){
                    if(isFailed){
                      // console.log('killing process')
                      proc.kill('SIGKILL');
                      return false;
                    }
                  });
                  // console.log('Processing: ' + progress + '% done');
              })
              .on('error', function(err, stdout, stderr) {
                  jobDone(Error('error screenshot video: ' + err.message));
              })
              .on('end', function() {
                  // console.log('Processing finished !');
                  if (temp.length > 0) {
                      job.isFailed().then(function(isFailed){
                        if(isFailed){
                          // console.log('killing process')
                          proc.kill('SIGKILL');
                          return false;
                        }
                        cur = length - temp.length;
                        job.progress(LimitedRange(cur, 0, length, 0, 100));
                        start_screenshots();
                      })
                  } else {
                    job.isFailed().then(function(isFailed){
                      if(isFailed){
                        // console.log('killing process')
                        proc.kill('SIGKILL');
                        return false;
                      }
                      job.progress(100);
                      jobDone();
                      process.send({
                        id: job.jobId,
                        data: job.data
                      });
                    })
                  }
              }).noAudio()
              .screenshots({
                  // Will take screens at 20%, 40%, 60% and 80% of the video
                  filename: '%s.png',
                  timestamps: temp.splice(0, 100),
                  folder: __dirname + '/../public/video/images/' + _path.name
              });
          job.progress(0);
      }
      start_screenshots();
  });
  // setTimeout(function(){
  //   job.isFailed().then(function(isFailed){
  //     if(isFailed)return false;
  //     job.progress(30);
  //   })
  // },1000)
  // setTimeout(function(){
  //   job.isFailed().then(function(isFailed){
  //     if(isFailed)return false;
  //     job.progress(75);
  //   })
  // },3000)
  // setTimeout(function(){
  //   job.isFailed().then(function(isFailed){
  //     if(isFailed)return false;
  //     job.progress(100);
  //     jobDone();
  //     process.send({
  //       id: job.jobId,
  //       data: job.data
  //     });
  //   })
  // },10000)
});
process.on('disconnect', function () {
  console.log('disconnect')
  queue.close().then(function () {
//    process.exit(0);
  }).catch(function (err) {
    console.err(err);
  //  process.exit(-1);
  });
});
