var fs = require('fs'),
  path = require('path');
fs.mkdirParent = function(dirPath) {
    var path = dirPath.replace(/\/$/, '').split('/');
    for (var i = 1; i <= path.length; i++) {
        var segment = path.slice(0, i).join('/');

        segment != '' && !fs.existsSync(segment) ? fs.mkdirSync(segment) : null ;
    }
};
module.exports = {
  checkDirectorySync:function(directory, pass) {
    fs.stat(directory, function (err, stat) {
      if (err) {
        fs.mkdirParent(directory);
      }
      if(pass)pass()
    })
  },
  uploadImage:function(url_upload, image, callback){
    this.checkDirectorySync(url_upload,function(){
      fs.readFile(image.path, function (err, data) {
        var newPath = url_upload+"/"+image.name;
        fs.writeFile(newPath, data, function (err) {
          var public_url = url_upload.replace('/public','')
          if(callback)callback({path:public_url+'/'+image.name});
        });
      });
    });
  },
  uploadRawImage:function(url_upload, name, raw, callback){
    this.checkDirectorySync(url_upload,function(){
      if(!raw) return false;
      var matches = raw.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
    	imageBuffer = {};
    	if (matches.length !== 3) {
        if(callback)callback({error:'error input file error.'})
    		return;
    	}
    	imageBuffer.type = matches[1];
    	imageBuffer.data = new Buffer(matches[2], 'base64');
      var newPath = url_upload+"/"+name;
      fs.writeFile(newPath, imageBuffer.data, function (err) {
        var public_url = url_upload.replace('/public','')
        if(callback)callback({path:public_url+'/'+name});
      });
    });

  	// var tempFile = fs.createWriteStream(url_upload + '/' + name ); //Date.now()
  	// tempFile.on('open', function(fd) {
  	// 		tempFile.write(imageBuffer.data);
  	// 		tempFile.end();
    //     if(callback)callback({path:JSON.stringify(path.parse(tempFile.path))});
  	// });
  }
}
