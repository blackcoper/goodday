// helper functions

/**
 * Provides requestAnimationFrame in a cross browser way.
 */
 var prev = Date.now || function () {return new Date().getTime();};
 function fallback(fn) {
   var curr = Date.now || function () {return new Date().getTime();};
   var ms = Math.max(0, 16 - (curr - prev));
   var req = setTimeout(fn, ms);
   prev = curr;
   return req;
 }
window.requestAnimFrame = (function() {
  return window.requestAnimationFrame ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame ||
         window.oRequestAnimationFrame ||
         window.msRequestAnimationFrame ||
         fallback;
})();

/**
 * Provides cancelRequestAnimationFrame in a cross browser way.
 */
window.cancelRequestAnimFrame = (function() {
  return window.cancelAnimationFrame ||
         window.webkitCancelRequestAnimationFrame ||
         window.mozCancelRequestAnimationFrame ||
         window.oCancelRequestAnimationFrame ||
         window.msCancelRequestAnimationFrame ||
         window.clearTimeout;
})();

// video support utility functions
function supports_video() {
  return !!document.createElement('video').canPlayType;
}

function supports_h264_baseline_video() {
  if (!supports_video()) { return false; }
  var v = document.createElement("video");
  return v.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
}

function supports_ogg_theora_video() {
  if (!supports_video()) { return false; }
  var v = document.createElement("video");
  return v.canPlayType('video/ogg; codecs="theora, vorbis"');
}

function supports_webm_video() {
  if (!supports_video()) { return false; }
  var v = document.createElement("video");
  return v.canPlayType('video/webm; codecs="vp8.0, vorbis"');
}

function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {
  var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
  return { width: srcWidth*ratio, height: srcHeight*ratio };
}

function angleRadians(p1, p2){
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

function angleDeg(p1, p2){
  return Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
}

function LimitedRange(value, inMin, inMax, outMin, outMax) {
  return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

function distanceBetweenPoints(p1, p2)
{
	var dx = p1.x - p2.x;
	var dy = p1.y - p2.y;

	var dist = Math.sqrt(dx * dx + dy * dy);

	return dist;
}
function dataURItoBlob(dataURI) {
  var byteString, i, ia, mimeString;
  byteString = void 0;
  if (dataURI.split(',')[0].indexOf('base64') >= 0) {
    byteString = atob(dataURI.split(',')[1]);
  } else {
    byteString = unescape(dataURI.split(',')[1]);
  }
  mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  ia = new Uint8Array(byteString.length);
  i = 0;
  while (i < byteString.length) {
    ia[i] = byteString.charCodeAt(i);
    i++;
  }
  return new Blob([ia], {
    type: mimeString
  });
};
function loadScript(opt, callback)
{
    option = opt || {url:'',id:false};
    var cc = function(){callback.call(null,option);}
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    if(option.id)script.setAttribute('id',option.id)
    script.type = 'text/javascript';
    script.src = option.url;
    script.onreadystatechange = cc;
    script.onload = cc;
    head.appendChild(script);
}
function FpsCtrl(fps, callback) {

	var	delay = 1000 / fps,
		time = null,
		frame = -1;
	var tref;
  var isPlaying = false;

	loop = function(timestamp) {
    if (!isPlaying) {
        return;
    }
		if (time === null) time = timestamp;
		var seg = Math.floor((timestamp - time) / delay);
		if (seg > frame) {
			frame = seg;
			callback({
				time: timestamp,
				frame: frame
			})
		}
		tref = window.requestAnimFrame(loop)
	}


	frameRate = function(newfps) {
		if (!arguments.length) return fps;
		fps = newfps;
		delay = 1000 / fps;
		frame = -1;
		time = null;
	};

	this.start = function() {
		if (!isPlaying) {
			isPlaying = true;
			tref = window.requestAnimFrame(loop);
		}
	};

	this.pause = function() {
		if (isPlaying) {
			window.cancelRequestAnimFrame(tref);
      tref = null;
			isPlaying = false;
			time = null;
			frame = -1;
		}
	};
}

function ArraytoBlob(_mime,_array)
{
    // ArrayBufferやUint8Arrayなら入れなおす工数がなくなります
    var arr = new Uint8Array(_array.length);
    for (var i = 0; i < _array.length; i++) {arr[i] = _array[i];}

    var blob = new Blob([arr], { type: _mime });
    return blob;
}
function saveBlob(_blob,_file)
{
    if( /*@cc_on ! @*/ false )
    {   // IEの場合
        window.navigator.msSaveBlob(_blob, _file);
    }
    else
    {
        var url = (window.URL || window.webkitURL);
        var data = url.createObjectURL(_blob);
        var e = document.createEvent("MouseEvents");
        e.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        var a = document.createElementNS("http://www.w3.org/1999/xhtml", "a");
        a.href = data;
        a.download = _file;
        a.dispatchEvent(e);
    }
}
function Base64toBlob(_base64)
{
    var i;
    var tmp = _base64.split(',');
    var data = atob(tmp[1]);
	var mime = tmp[0].split(':')[1].split(';')[0];

    //var buff = new ArrayBuffer(data.length);
    //var arr = new Uint8Array(buff);
	var arr = new Uint8Array(data.length);
	for (i = 0; i < data.length; i++) {arr[i] = data.charCodeAt(i);}
	var blob = new Blob([arr], { type: mime });
    return blob;
}
function saveResult(canvas, name) {
  var base64 = canvas.toDataURL();
  var blob = Base64toBlob(base64);
  saveBlob(blob,name);
}
(function (global) {
    var apple_phone         = /iPhone/i,
        apple_ipod          = /iPod/i,
        apple_tablet        = /iPad/i,
        android_phone       = /(?=.*\bAndroid\b)(?=.*\bMobile\b)/i, // Match 'Android' AND 'Mobile'
        android_tablet      = /Android/i,
        amazon_phone        = /(?=.*\bAndroid\b)(?=.*\bSD4930UR\b)/i,
        amazon_tablet       = /(?=.*\bAndroid\b)(?=.*\b(?:KFOT|KFTT|KFJWI|KFJWA|KFSOWI|KFTHWI|KFTHWA|KFAPWI|KFAPWA|KFARWI|KFASWI|KFSAWI|KFSAWA)\b)/i,
        windows_phone       = /IEMobile/i,
        windows_tablet      = /(?=.*\bWindows\b)(?=.*\bARM\b)/i, // Match 'Windows' AND 'ARM'
        other_blackberry    = /BlackBerry/i,
        other_blackberry_10 = /BB10/i,
        other_opera         = /Opera Mini/i,
        other_chrome        = /(CriOS|Chrome)(?=.*\bMobile\b)/i,
        other_firefox       = /(?=.*\bFirefox\b)(?=.*\bMobile\b)/i, // Match 'Firefox' AND 'Mobile'
        seven_inch = new RegExp(
            '(?:' +         // Non-capturing group

            'Nexus 7' +     // Nexus 7

            '|' +           // OR

            'BNTV250' +     // B&N Nook Tablet 7 inch

            '|' +           // OR

            'Kindle Fire' + // Kindle Fire

            '|' +           // OR

            'Silk' +        // Kindle Fire, Silk Accelerated

            '|' +           // OR

            'GT-P1000' +    // Galaxy Tab 7 inch

            ')',            // End non-capturing group

            'i');           // Case-insensitive matching
    var match = function(regex, userAgent) {
        return regex.test(userAgent);
    };
    var IsMobileClass = function(userAgent) {
        var ua = userAgent || navigator.userAgent;
        // Facebook mobile app's integrated browser adds a bunch of strings that
        // match everything. Strip it out if it exists.
        var tmp = ua.split('[FBAN');
        if (typeof tmp[1] !== 'undefined') {
            ua = tmp[0];
        }
        // Twitter mobile app's integrated browser on iPad adds a "Twitter for
        // iPhone" string. Same probable happens on other tablet platforms.
        // This will confuse detection so strip it out if it exists.
        tmp = ua.split('Twitter');
        if (typeof tmp[1] !== 'undefined') {
            ua = tmp[0];
        }
        this.apple = {
            phone:  match(apple_phone, ua),
            ipod:   match(apple_ipod, ua),
            tablet: !match(apple_phone, ua) && match(apple_tablet, ua),
            device: match(apple_phone, ua) || match(apple_ipod, ua) || match(apple_tablet, ua)
        };
        this.amazon = {
            phone:  match(amazon_phone, ua),
            tablet: !match(amazon_phone, ua) && match(amazon_tablet, ua),
            device: match(amazon_phone, ua) || match(amazon_tablet, ua)
        };
        this.android = {
            phone:  match(amazon_phone, ua) || match(android_phone, ua),
            tablet: !match(amazon_phone, ua) && !match(android_phone, ua) && (match(amazon_tablet, ua) || match(android_tablet, ua)),
            device: match(amazon_phone, ua) || match(amazon_tablet, ua) || match(android_phone, ua) || match(android_tablet, ua)
        };
        this.windows = {
            phone:  match(windows_phone, ua),
            tablet: match(windows_tablet, ua),
            device: match(windows_phone, ua) || match(windows_tablet, ua)
        };
        this.other = {
            blackberry:   match(other_blackberry, ua),
            blackberry10: match(other_blackberry_10, ua),
            opera:        match(other_opera, ua),
            firefox:      match(other_firefox, ua),
            chrome:       match(other_chrome, ua),
            device:       match(other_blackberry, ua) || match(other_blackberry_10, ua) || match(other_opera, ua) || match(other_firefox, ua) || match(other_chrome, ua)
        };
        this.seven_inch = match(seven_inch, ua);
        this.any = this.apple.device || this.android.device || this.windows.device || this.other.device || this.seven_inch;
        // excludes 'other' devices and ipods, targeting touchscreen phones
        this.phone = this.apple.phone || this.android.phone || this.windows.phone;
        // excludes 7 inch devices, classifying as phone or tablet is left to the user
        this.tablet = this.apple.tablet || this.android.tablet || this.windows.tablet;
        if (typeof window === 'undefined') {
            return this;
        }
    };
    var instantiate = function() {
        var IM = new IsMobileClass();
        IM.Class = IsMobileClass;
        return IM;
    };
    if (typeof module !== 'undefined' && module.exports && typeof window === 'undefined') {
        //node
        module.exports = IsMobileClass;
    } else if (typeof module !== 'undefined' && module.exports && typeof window !== 'undefined') {
        //browserify
        module.exports = instantiate();
    } else if (typeof define === 'function' && define.amd) {
        //AMD
        define('isMobile', [], global.isMobile = instantiate());
    } else {
        global.isMobile = instantiate();
    }
    window.onpopstate = function(e){
      if(e.state){
          document.getElementById("content").innerHTML = e.state.html;
          document.title = e.state.pageTitle;
      }
    };
})(this);
