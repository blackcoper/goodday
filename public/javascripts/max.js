var destroyAccessories, initAccessories, initChooseVideo, initRender, setMessageVideo, showVideo, tw_btn;

initChooseVideo = void 0;

initAccessories = void 0;

showVideo = void 0;

initRender = void 0;

setMessageVideo = void 0;

destroyAccessories = void 0;

tw_btn = void 0;

$(function() {
  'use strict';
  var PLAYER_HEIGHT, PLAYER_WIDTH, _fps, _scale, data, effect, endedVideo, face, fb_quote, frameSkip, head, list_effect, message, mouth, offset, onTimeUpdate, option, overlay, player, render, size, stageOverlay, t_acc, t_player, timeline, timepass, url_video_female, url_video_male, video_ext, wrapText;
  PLAYER_WIDTH = 720;
  PLAYER_HEIGHT = 405;
  video_ext = ['mp4'];
  url_video_male = [site_url + '/video/India_Cowok_01_scaled', site_url + '/video/Coachella CO Rev_scaled', site_url + '/video/HipHop CO rev 2_scaled', site_url + '/video/Jepang CO_scaled'];
  url_video_female = [site_url + '/video/India_Cewek_01_scaled', site_url + '/video/Coachella CE Rev_scaled', site_url + '/video/Hiphop CE rev 2_scaled', site_url + '/video/Jepang CE_scaled'];
  list_effect = ['confetti', 'confetti2', 'plasma', 'fireworks'];
  option = {};
  timepass = [];
  timeline = [];
  data = [];
  player = void 0;
  overlay = void 0;
  stageOverlay = void 0;
  head = void 0;
  face = void 0;
  mouth = void 0;
  message = void 0;
  size = 0;
  offset = void 0;
  t_player = void 0;
  t_acc = void 0;
  _scale = 0;
  _fps = 0;
  fb_quote = _fb_text;
  initChooseVideo = function(e) {
    var _div, _url, _vid, h, j, k, l, len, len1;
    $('#chooseVideo').html('');
    _url = e === 'male' ? url_video_male : url_video_female;
    for (k = 0, len = _url.length; k < len; k++) {
      h = _url[k];
      _vid = $('<video>');
      _div = $('<div class="box">');
      _div.append($('<i class="active">'));
      _div.append(_vid);
      $('#chooseVideo').append(_div);
      _vid.attr('poster', h + '.png');
      for (l = 0, len1 = video_ext.length; l < len1; l++) {
        j = video_ext[l];
        if (j === 'mp4' && supports_h264_baseline_video()) {
          if (_vid.src === '') {
            _vid.src = h + '.' + j;
          }
          $(_vid).append($('<source>').attr({
            src: h + '.' + j,
            type: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'
          }));
        } else if (j === 'webm' && supports_webm_video()) {
          if (_vid.src === '') {
            _vid.src = h + '.' + j;
          }
          $(_vid).append($('<source>').attr({
            src: h + '.' + j,
            type: 'video/webm; codecs="vp8.0, vorbis"'
          }));
        } else if (j === 'ogv' && supports_ogg_theora_video()) {
          if (_vid.src === '') {
            _vid.src = h + '.' + j;
          }
          $(_vid).append($('<source>').attr({
            src: h + '.' + j,
            type: 'video/ogg; codecs="theora, vorbis"'
          }));
        }
        $(_vid).on('timeupdate', function() {
          if (this.currentTime > 2) {
            return this.currentTime = 0;
          }
        });
      }
    }
    return $('#chooseVideo video').off('mouseenter').on('mouseenter', function() {
      if (this.currentTime < 2) {
        return this.play();
      }
    }).off('mouseleave').on('mouseleave', function() {
      return this.pause();
    }).off('click').on('click', function() {
      if ($('#chooseVideo video.active').length > 0) {
        $('#chooseVideo i.active.show').removeClass('show');
        $('#chooseVideo video.active').removeClass('active');
      }
      $(this).addClass('active');
      $(this).siblings('i.active').addClass('show');
      return $('#chooseVideo video').each(function() {
        return this.pause();
      });
    });
  };
  effect = [];
  destroyAccessories = function() {
    var i, k, len;
    if (effect.length > 0) {
      for (k = 0, len = effect.length; k < len; k++) {
        i = effect[k];
        i.stop();
      }
      effect = [];
    }
    return $('#chooseAccessories').html('');
  };
  initAccessories = function() {
    var i, k, len;
    destroyAccessories();
    for (k = 0, len = list_effect.length; k < len; k++) {
      i = list_effect[k];
      $('#chooseAccessories').append($('<div class="box"><img src="' + site_url + '/video/accessories/' + i + '.png"/><i class="active"></i><canvas id="' + i + '"></canvas></div>'));
      $('#chooseAccessories canvas').attr({
        width: $('#chooseAccessories canvas').width(),
        height: $('#chooseAccessories canvas').height()
      });
      if (i === 'confetti') {
        effect.push(init_conetti());
      } else if (i === 'confetti2') {
        effect.push(init_conetti2());
      } else if (i === 'plasma') {
        effect.push(init_plasma(true));
      } else if (i === 'fireworks') {
        effect.push(init_firework());
      }
    }
    return $('#chooseAccessories .box').off('mouseenter').on('mouseenter', function() {
      var _id;
      $(this).find('img').hide();
      _id = $('#chooseAccessories .box').index(this);
      return effect[_id].start();
    }).off('mouseleave').on('mouseleave', function() {
      var _id;
      $(this).find('img').show();
      _id = $('#chooseAccessories .box').index(this);
      return effect[_id].stop();
    }).off('click').on('click', function() {
      var _id;
      if ($('#chooseAccessories canvas.active').length > 0) {
        if ($('#chooseAccessories canvas.active')[0] !== $(this).find('canvas')[0]) {
          $('#chooseAccessories i.active.show').removeClass('show');
          $('#chooseAccessories canvas.active').removeClass('active');
          $(this).find('canvas').addClass('active');
          $(this).find('i.active').addClass('show');
        } else {
          $('#chooseAccessories i.active.show').removeClass('show');
          $('#chooseAccessories canvas.active').removeClass('active');
        }
      } else {
        $(this).find('canvas').addClass('active');
        $(this).find('i.active').addClass('show');
      }
      $('#chooseAccessories .box').each(function() {
        var l, len1, results;
        results = [];
        for (l = 0, len1 = effect.length; l < len1; l++) {
          i = effect[l];
          results.push(i.stop());
        }
        return results;
      });
      _id = $('#chooseAccessories .box').index(this);
      return effect[_id].start();
    });
  };
  wrapText = function(t, c, x, y, w, lh) {
    var _sc;
    _sc = $('#render #player').width() / PLAYER_WIDTH;
    message.text = t;
    message.font = (30 * _sc) + 'px Arial';
    message.color = c;
    message.x = x * _sc;
    message.y = y * _sc;
    message.lineWidth = w * _sc;
    message.lineHeight = lh * _sc;
    message.visible = true;
    return stageOverlay.update();
  };
  frameSkip = function(c) {
    if (typeof timeline[1] !== 'undefined') {
      if (player.currentTime > timeline[1]) {
        timepass.push(timeline.splice(0, 1));
        return frameSkip(c);
      }
    }
    return c();
  };
  onTimeUpdate = function() {
    var fps, thisLoop;
    if (timeline.length > 0) {
      thisLoop = new Date;
      fps = Math.round(1000 / (thisLoop - _fps));
      _fps = thisLoop;
      return frameSkip(function() {
        var _s, _sc, halfx, halfy, i;
        if (player.currentTime > timeline[0]) {
          timepass.push(timeline.splice(0, 1));
          i = timepass.length - 1;
          _sc = $('#render #player').width() / PLAYER_WIDTH;
          if (data[i]) {
            _s = (data[i].w / 165) * _sc;
            head.scaleX = head.scaleY = _s;
            mouth.y = data[i].m;
            halfx = 180 / 2;
            halfy = 260 / 2;
            head.x = (data[i].x * _sc) + halfx * _s;
            head.y = (data[i].y * _sc) - (60 * _s) + halfy * _s;
            head.rotation = -data[i].r;
            head.regX = 256;
            head.regY = 256;
            head.visible = true;
            stageOverlay.update();
          } else {
            head.visible = false;
            stageOverlay.update();
          }
          if (i >= 950 && option.gender === 'female' && option.video === '1') {
            return wrapText(option.message, '#ffa', 92, 94, 480, 45);
          } else if (i >= 940 && option.gender === 'male' && option.video === '1') {
            return wrapText(option.message, '#ffa', 100, 93, 484, 45);
          } else if (i >= 982 && option.gender === 'female' && option.video === '2') {
            return wrapText(option.message, '#ffa', 100, 95, 512, 45);
          } else if (i >= 980 && option.gender === 'male' && option.video === '2') {
            return wrapText(option.message, '#ffa', 100, 95, 512, 45);
          } else if (i >= 1025 && option.gender === 'female' && option.video === '0') {
            return wrapText(option.message, '#ffa', 131, 104, 420, 45);
          } else if (i >= 1048 && option.gender === 'male' && option.video === '0') {
            return wrapText(option.message, '#ffa', 111, 104, 503, 45);
          } else if (i >= 1114 && option.gender === 'female' && option.video === '3') {
            return wrapText(option.message, '#ffa', 105, 98, 495, 45);
          } else if (i >= 1110 && option.gender === 'male' && option.video === '3') {
            return wrapText(option.message, '#ffa', 105, 98, 495, 45);
          } else {
            message.visible = false;
            return stageOverlay.update();
          }
        }
      });
    }
  };
  endedVideo = function() {
    $('#render i.played').show();
    if (t_acc) {
      t_acc.stop();
    }
    if (t_player) {
      t_player.pause();
      timeline = timepass.concat(timeline);
      timepass = [];
    }
    return console.log('ended');
  };
  showVideo = function(opt) {
    var _src;
    if (opt) {
      option = opt;
    }
    _src = option.src;
    $('#render #player').remove();
    $('#render .left').append($('<video id="player">'));
    player = $('#render #player').get(0);
    player.width = $('#render #player').width();
    player.height = $('#render #player').height();
    if (player.src === '') {
      player.src = _src;
    }
    $(player).append($('<source>').attr({
      src: _src,
      type: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'
    }));
    player.addEventListener('ended', endedVideo, false);
    player.loop = false;
    player.controls = false;
    $('#render i.played').show();
    return $('#render canvas, #render i.played').off('click').on('click', function() {
      if (player.paused) {
        player.play();
        return $('#render i.played').hide();
      } else {
        player.pause();
        return $('#render i.played').show();
      }
    });
  };
  initRender = function(opt, c) {
    var _url, h, j, k, len, name;
    option = opt;
    _url = option.gender === 'male' ? url_video_male : url_video_female;
    if (_url[option.video]) {
      $('#render #player').remove();
      $('#render .left').append($('<video id="player">'));
      name = /([^\/]+)(?=\w*$)/ig.exec(_url[option.video]);
      player = $('#render #player').get(0);
      player.width = $('#render #player').width();
      player.height = $('#render #player').height();
      h = _url[option.video];
      if (isMobile.any) {
        h = h.replace('_scaled', '_small');
      }
      for (k = 0, len = video_ext.length; k < len; k++) {
        j = video_ext[k];
        if (j === 'mp4' && supports_h264_baseline_video()) {
          if (player.src === '') {
            player.src = h + '.' + j;
          }
          $(player).append($('<source>').attr({
            src: h + '.' + j,
            type: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'
          }));
        } else if (j === 'webm' && supports_webm_video()) {
          if (player.src === '') {
            player.src = h + '.' + j;
          }
          $(player).append($('<source>').attr({
            src: h + '.' + j,
            type: 'video/webm; codecs="vp8.0, vorbis"'
          }));
        } else if (j === 'ogv' && supports_ogg_theora_video()) {
          if (player.src === '') {
            player.src = h + '.' + j;
          }
          $(player).append($('<source>').attr({
            src: h + '.' + j,
            type: 'video/ogg; codecs="theora, vorbis"'
          }));
        }
      }
      player.addEventListener('ended', endedVideo, false);
      player.loop = false;
      player.controls = false;
      if (typeof c === 'function') {
        c();
      }
      return tw_btn();
    }
  };
  render = function(_time, _data) {
    var _img, i;
    timeline = _time;
    data = _data;
    if (timeline.length === 0 || data.length === 0) {
      return alert('no data/timeline');
    }
    $('#render #overlay').attr({
      width: $('#render #player').width(),
      height: $('#render #player').height()
    });
    stageOverlay = new createjs.Stage('overlay');
    head = new createjs.Container();
    message = new createjs.Text;
    face = new createjs.Bitmap;
    mouth = new createjs.Bitmap(option.resource.mouth);
    _img = new Image();
    _img.onload = function() {
      var _s, halfx, halfy;
      offset = option.gender === 'male' ? {
        x: 160,
        y: 120
      } : {
        x: 160,
        y: 90
      };
      size = calculateAspectRatioFit(this.width, this.height, PLAYER_WIDTH, PLAYER_HEIGHT);
      _scale = size.width / this.width;
      face.image = this;
      face.scaleX = mouth.scaleX = face.scaleY = mouth.scaleY = 1;
      face.cache(0, 0, this.width, this.height);
      mouth.cache(0, 0, this.width, this.height);
      head.addChild(face);
      head.addChild(mouth);
      stageOverlay.addChild(head);
      stageOverlay.addChild(message);
      _s = 1;
      if (data.length > 0) {
        if (data[0]) {
          if (option.gender === 'male') {
            _s = data[0].w / 193;
          } else {
            _s = data[0].w / 188;
          }
          head.scaleX = head.scaleY = _s;
          halfx = option.gender === 'male' ? 188 / 2 : 193 / 2;
          halfy = option.gender === 'male' ? 227 / 2 : 260 / 2;
          head.x = data[0].x + halfx * _s;
          head.y = data[0].y - (40 * _s) + halfy * _s;
          head.rotation = -data[0].r;
          head.regX = 256;
          head.regY = 256;
          head.visible = true;
        } else {
          head.visible = false;
        }
      }
      return stageOverlay.update();
    };
    _img.src = option.resource.face;
    i = list_effect[option.accessories];
    if (i !== -1) {
      $('#render .left').append($('<canvas id="' + i + '" width="' + PLAYER_WIDTH + '" height="' + PLAYER_HEIGHT + '">'));
      if (i === 'confetti') {
        t_acc = init_conetti();
      } else if (i === 'confetti2') {
        t_acc = init_conetti2();
      } else if (i === 'plasma') {
        t_acc = init_plasma(true);
      } else if (i === 'fireworks') {
        t_acc = init_firework();
      }
    }
    return $('#render canvas, #render i.played').on('click', function() {
      if (player.paused) {
        player.play();
        t_player.start();
        $('#render i.played').hide();
        if (t_acc) {
          return t_acc.start();
        }
      } else {
        player.pause();
        t_player.pause();
        $('#render i.played').show();
        if (t_acc) {
          return t_acc.stop();
        }
      }
    });
  };
  $('#download').on('click', function() {
    var _url, name;
    ga('send', 'event', 'button', 'click', 'Download');
    _url = option.gender === 'male' ? url_video_male[option.video] : url_video_female[option.video];
    name = /([^\/]+)(?=\w*$)/ig.exec(_url);
    return $.ajax({
      url: site_url + '/experiment/download',
      type: 'POST',
      dataType: 'JSON',
      data: {
        user: typeof option.user === 'undefined' ? '' : option.user,
        socket_id: ioadmin.nsp + '#' + ioadmin.id,
        exp_id: option.resource.id,
        accessories: list_effect[option.accessories],
        gender: option.gender,
        _csrf: _csrf,
        video_id: option.video,
        video_url: _url,
        video_name: name[0],
        message: option.message
      },
      beforeSend: function() {
        return $('.loader').show();
      },
      success: function(e) {
        console.log(e);
        if (e.success) {
          if (e.success === 'ready to download') {
            $('.loader').hide();
            $.fileDownload(site_url + '/force-download', {
              httpMethod: "GET",
              data: {
                url: e.url_video
              },
              contentType: "video/mp4"
            });
            option.src = site_url + '/' + e.url_video;
            return showVideo();
          }
        }
      },
      error: function(e) {
        console.log(e);
        return $('.loader').hide();
      }
    });
  });
  setMessageVideo = function(_text) {
    option.message = _text;
    return $('#download').trigger('click');
  };
  tw_btn = function() {
    var _url_share, clone;
    $('#share-tw').empty();
    _url_share = site_url + '/experiment/' + (typeof option.resource !== 'undefined' ? option.resource.id : '');
    clone = $('<a target="_blank" id="twitter-share-button" href="https://twitter.com/intent/tweet?url=' + _url_share + '&text=' + _tw_text + '">&nbsp;</a>');
    $('#share-tw').append(clone);
    return $('#share-tw a').click(function() {
      return ga('send', 'event', 'button', 'click', 'Share Twitter');
    });
  };
  return $(document).ready(function() {
    $.ajaxSetup({
      cache: true
    });
    $.getScript('//connect.facebook.net/en_US/sdk.js', function() {
      FB.init({
        appId: _fb_appid,
        version: 'v2.7'
      });
      return $('#share-fb').click(function() {
        ga('send', 'event', 'button', 'click', 'Share Facebook');
        return FB.ui({
          method: 'share',
          display: 'popup',
          href: site_url + '/experiment/' + option.resource.id,
          hashtag: 'goodday-experiment',
          picture: site_url + '/img/good-day.png',
          title: 'Jendela Eksperimen',
          description: _fb_text
        });
      });
    });
    tw_btn();
    return io_ready(function() {
      ioadmin.on('client_renderVideo_progress', function(e) {
        $('#download').text('render ' + parseInt(e) + '%');
        $('.loader .loading').html('<p>' + parseInt(e) + '%</p>');
        return $('title').text('(' + parseInt(e) + '%)' + " Start Experiment");
      });
      ioadmin.on('client_renderVideo_completed', function(e) {
        var result;
        $('#download').text('download');
        $('.loader .loading').text('');
        $('title').text("Start Experiment");
        result = JSON.parse(e);
        $('.loader').hide();
        option.src = site_url + '/' + result.video_url;
        showVideo();
        $('.progress-bar').removeClass('progress-bar-info progress-bar-danger').addClass('progress-bar-success');
        return $('#start_convert').removeClass('btn-danger disabled').addClass('btn-success').html('CONVERT').removeAttr('disabled');
      });
      return ioadmin.on('client_renderVideo_failed', function(e) {
        console.log(e);
        $('.progress-bar').removeClass('progress-bar-info progress-bar-success').addClass('progress-bar-danger');
        return $('#start_convert').removeClass('btn-danger disabled').addClass('btn-success').html('CONVERT').removeAttr('disabled');
      });
    });
  });
});
