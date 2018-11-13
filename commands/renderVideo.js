console.log('start process renderVideo '+process.pid);

var fs = require('fs'),
path = require('path'),
config = require('../config/config'),
upload = require('../lib/upload'),
Queue = require('bull');
// gm = require('gm');
var path_ffmpeg = require('ffmpeg-static');
var path_ffprobe = require('ffprobe-static');


var Canvas = require('canvas')
, OpenType = require('opentype.js')
, Font = undefined
, Image = Canvas.Image;
commandffmpeg = require('fluent-ffmpeg');
commandffmpeg.setFfmpegPath(path_ffmpeg.path);
commandffmpeg.setFfprobePath(path_ffprobe.path);

var Font = OpenType.loadSync(__dirname+'/../public/fonts/DINCond-Bold.ttf');
// console.log(Font)
// console.log(Canvas.registerFont)

// Canvas.registerFont(__dirname+'/../public/fonts/SwistblnkMonthoers.ttf', {family: 'SwistblnkMonthoers'});
// var SwistblnkMonthoers = new Font('SwistblnkMonthoers', __dirname+'/../public/fonts/SwistblnkMonthoers.ttf');
var STD_QUEUE_NAME = 'renderVideo';
function buildQueue(name) {
  var qName = name || STD_QUEUE_NAME;
  return new Queue(qName, config.redis_port, config.redis_host);
}
var LimitedRange = function(value, inMin, inMax, outMin, outMax) {
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}
var deleteFolderRecursive = function(path) {
  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};
var measureText = function(text,fontSize) {
    var ascent = 0;
    var descent = 0;
    var width = 0;
    var scale = 1 / Font.unitsPerEm * fontSize;
    var glyphs = Font.stringToGlyphs(text);

    for (var i = 0; i < glyphs.length; i++) {
        var glyph = glyphs[i];
        if (glyph.advanceWidth) {
            width += glyph.advanceWidth * scale;
        }
        if (i < glyphs.length - 1) {
            kerningValue = Font.getKerningValue(glyph, glyphs[i + 1]);
            width += kerningValue * scale;
        }
        ascent = Math.max(ascent, glyph.yMax);
        descent = Math.min(descent, glyph.yMin);
    }

    return {
        width: width,
        actualBoundingBoxAscent: ascent * scale,
        actualBoundingBoxDescent: descent * scale,
        fontBoundingBoxAscent: Font.ascender * scale,
        fontBoundingBoxDescent: Font.descender * scale
    };
};
function wrapText(context, text, x, y, maxWidth, lineHeight, fontSize) {
    fontSize = fontSize || 40;
    var words = Array.from(text);//text.split(' ');
    var line = '';

    for(var n = 0; n < words.length; n++) {
      var testLine = line + words[n] + '';

      var metrics = measureText(testLine,fontSize);
      var testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        // context.fillText(line, x, y);
        var path = Font.getPath(line, x, y, fontSize,{kerning: true});
        path.fill = '#ffa';
        path.draw(context);
        line = words[n] + '';
        y += lineHeight;
      }
      else {
        line = testLine;
      }
    }
    // context.fillText(line, x, y);
    var path = Font.getPath(line, x, y, fontSize,{kerning: true});
    path.fill = '#ffa';
    path.draw(context);
}
var socket = require('socket.io-client')('http://'+config.host_socket_io+':'+config.port_io_http+'/experiment');

var queue = buildQueue();
queue.empty();
queue.on('progress', function(job, progress){
  socket.emit('worker_renderVideo_progress', { id: job.jobId, progress:progress});
})
.on('failed', function(job, err){
  socket.emit('worker_renderVideo_failed', { id: job.jobId, error:err.message});
})
.on('completed', function (job) {
  socket.emit('worker_renderVideo_completed', { id: job.jobId, data:job.data});
});
queue.process(1, function(job, jobDone) {
  var option = {
    gender:job.data.gender,
    id_exp :job.data.exp,
    dir:path.resolve('./public/userfiles/'+job.data.user+'/'+job.data.exp+'/'),
    img1:path.resolve('./public/userfiles/'+job.data.user+'/face-'+job.data.exp+'.png'),
    img2:path.resolve('./public/userfiles/'+job.data.user+'/mouth-'+job.data.exp+'.png'),
    acc:job.data.acc,
    video:{
      name:job.data.video.name,
      message: job.data.video.message
    }
  }
  head_crop_male={x:163,y:123,w:188,h:227}
  head_crop_female={x:160,y:90,w:193,h:260}
  head_crop = option.gender == 'male' ? head_crop_male:head_crop_female;
  var data_pass = []
  var url_result = []
  var total_data = 0
  var FACE,MOUTH;
  var FPS = 30;
  fs.readFile(__dirname +'/../public/json/'+option.video.name+'.json', "utf8", function(err, _data_time) {
    if (err || _data_time == undefined) {
        return jobDone(Error(__dirname +'/../public/json/'+option.video.name+'.json file cannot read.'));
    }
    var data_time = JSON.parse(_data_time);
    var length = data_time.length;
    fs.readFile(__dirname +'/../public/json/result/'+option.video.name+'.json', "utf8", function(err, _data_tranform) {
      if (err || _data_tranform == undefined) {
          return jobDone(Error(__dirname +'/../public/json/result/'+option.video.name+'.json file cannot read.'));
      }
      var data_tranform = JSON.parse(_data_tranform);
      total_data = data_time.length+'';
      total_data = total_data.length;
      // data_pass.push(data_time.splice(0, 581));
      var start = new Date()
      var renderImg = function(){
        // console.log(data_time.length);
        if(data_time.length>0){
          name = data_time[0];
          data_pass.push(data_time.splice(0, 1));
          i = data_pass.length-1;
          transform = data_tranform[i];
          // console.log(name)
          fs.readFile(__dirname +'/../public/video/images/'+option.video.name+'/'+name+'.png',function(err,data){
            if(err)console.log('error image video',err);
            img_video = new Image;
            img_video.onload = function(){
              var canvas = new Canvas(img_video.width, img_video.height)
              , ctx = canvas.getContext('2d');
              // ctx.addFont(SwistblnkMonthoers);
              ctx.drawImage(img_video, 0, 0, img_video.width, img_video.height);
              if(transform){
                var scale = transform.w / 165;//  option.gender == 'male' ? transform.w / 140 : //transform.w / 193 : transform.w / 188;
                var halfx = transform.w/2;
                var halfy = transform.h/2;
                ctx.save();
                ctx.translate( transform.x+halfx,transform.y+halfy);
                ctx.scale(scale, scale);
                ctx.rotate( -transform.r *Math.PI/180 );
                ctx.drawImage(FACE,-256,-256);
                ctx.scale(1.08, 1.08);
                ctx.drawImage(MOUTH,-256,-260);
                // ctx.drawImage(MOUTH,-256,-256+transform.m);
                ctx.restore();
              }
              str = data_pass.length+''
              name_image = '0'.repeat(total_data-str.length)+data_pass.length
              // shameless ;(
              // ctx.font = '30px sans-serif';
              // ctx.fillStyle = '#ffa';
              _text = option.video.message;
              //test
              // _text = "abcdefh asdjfkf dsjdl as dasd \n sdasdj ahsd asd as\n asdas das\na sdasdasdas"
              // console.log("_text",_text,option);
              if(_text){
                if(data_pass.length >= 950 && option.video.name == "Coachella CE Rev_scaled"){ //
                  wrapText(ctx, _text, 100, 110, 480, 45);
                }else if(data_pass.length >= 940 && option.video.name == "Coachella CO Rev_scaled"){
                  wrapText(ctx, _text, 100, 110, 480, 45);
                }else if(data_pass.length >= 982 && option.video.name == "Hiphop CE rev 2_scaled"){
                  wrapText(ctx, _text, 100, 110, 512, 45);
                }else if(data_pass.length >= 980 && option.video.name == "HipHop CO rev 2_scaled"){
                  wrapText(ctx, _text, 100, 110, 512, 45);
                }else if(data_pass.length >= 1025 && option.video.name == "India_Cewek_01_scaled"){
                  ctx.font = '25px sans-serif';
                  wrapText(ctx, _text, 131, 125, 420, 35, 30);
                }else if(data_pass.length >= 1048 && option.video.name == "India_Cowok_01_scaled"){
                  wrapText(ctx, _text, 115, 115, 503, 45);
                }else if(data_pass.length >= 1114 && option.video.name == "Jepang CE_scaled"){
                  wrapText(ctx, _text, 110, 110, 500, 45);
                }else if(data_pass.length >= 1110 && option.video.name == "Jepang CO_scaled"){
                  wrapText(ctx, _text, 110, 110, 500, 45);
                }
              }
              if(typeof(option.acc)!== 'undefined'){
                fs.readFile(__dirname +'/../public/video/accessories/'+option.acc+'/'+option.video.name+'/'+name+'.png',function(err,data){
                  img_acc = new Image;
                  img_acc.onload = function(){
                    ctx.drawImage(img_acc,0,0,img_acc.width,img_acc.height);
                    var out = fs.createWriteStream(option.dir+'/'+name_image+'.png');
                    canvas.pngStream().pipe(out);
                    out.on('finish', function () {
                      job.isFailed().then(function(isFailed){
                        if(isFailed){
                          console.log('killing process')
                          // proc.kill('SIGKILL');
                          return false;
                        }
                        job.progress(LimitedRange(data_pass.length, 0, length, 0, 90));
                        renderImg()
                      });
                    })
                  }
                  img_acc.src = data;

                });
              }else{
                var out = fs.createWriteStream(option.dir+'/'+name_image+'.png');
                canvas.pngStream().pipe(out);
                out.on('finish', function () {
                  job.isFailed().then(function(isFailed){
                    if(isFailed){
                      console.log('killing process')
                      // proc.kill('SIGKILL');
                      return false;
                    }
                    job.progress(LimitedRange(data_pass.length, 0, length, 0, 90));
                    renderImg()
                  })
                })
              }
            }
            img_video.src = data;
          });
        }else{
          console.log('rendering in %dms', new Date() - start)
          console.log('complete create images, now rendering to video')
          // USE FFMPEG-FLUENT
          // ffmpeg -framerate 25 -i "%04d.png" out.mp4
          // ffmpeg.exe" -i %1 -b 1500k -vcodec libx264 -vpre slow -vpre baseline -g 30 -s 640x360 %1.mp4
          // ffmpeg.exe" -i %1 -b 1500k -vcodec libvpx -acodec libvorbis -ab 160000 -f webm -g 30 -s 640x360 %1.webm
          // ffmpeg.exe" -i %1 -b 1500k -vcodec libtheora -acodec libvorbis -ab 160000 -g 30 -s 640x360 %1.ogv

          var proc = new commandffmpeg()
          .addInput(option.dir+'/%0'+total_data+'d.png')
          .inputFPS(FPS)
          .addInput(__dirname +'/../public/video/'+option.video.name+'.mp3')
          // .videoBitrate(1024)
          // .videoCodec('libx264')
          // .audioCodec('libmp3lame') //.audioCodec('libfaac')
          .outputFPS(FPS)
          .outputOptions(['-c:v libx264','-profile:v baseline','-level 3.0','-pix_fmt yuv420p'])//'-c:v libx264',
          .output(__dirname +'/../public/userfiles/'+job.data.user+'/'+option.id_exp+'.mp4')
          // .duration(data_pass.length*1000/30/1000) // CUTTED AUDIO if more.
          .on('start', function(commandLine) {
            console.log('Spawned Ffmpeg with command: ' + commandLine);
          })
          .on('progress', function(progress) {
            job.isFailed().then(function(isFailed){
              if(isFailed){
                console.log('killing process')
                proc.kill('SIGKILL');
                return false;
              }
              _t = progress.percent > 100 ? 100 : progress.percent;
              job.progress(LimitedRange(_t, 0, 100, 90, 100));
              console.log('Processing: ' + progress.percent + '% done');
            });
          })
          .on('error', function(err, stdout, stderr) {
            console.log('Cannot process video: ',err,stderr);
          })
          .on('end', function(stdout, stderr) {
            console.log('Transcoding succeeded !', new Date() - start)
            job.isFailed().then(function(isFailed){
              if(isFailed){
                console.log('killing process')
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
            deleteFolderRecursive(option.dir);
          })
          .run();
        }
      }
      upload.checkDirectorySync(option.dir,function(){
        fs.readFile(option.img1,function(err,data){
          if(err)console.log(err);
          img1 = new Image;
          img1.onload = function(){
            FACE = img1;
            fs.readFile(option.img2,function(err,data){
              if(err)console.log(err);
              img2 = new Image;
              img2.onload = function(){
                MOUTH = img2;
                console.log('start rendering video')
                renderImg();
                data = null
              }
              img2.src = data;
              console.log('start rendering img2',option.img2)
            });
          }
          img1.src = data;
          console.log('start rendering img1',option.img1)
        });
      })
    })
  })
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
