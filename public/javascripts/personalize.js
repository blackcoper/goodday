$(function() {
  var CANVAS_HEIGHT, CANVAS_WIDTH, ContinueToNextStage, HeadPositionEditor, MASK, MouthPositionEditor, _cameraStream, _getUserMedia, _id_exp, _img1, _img2, _maxQuote, _size, _textMessage, _timer, _timer_editor, animating, backtoChooseVideo, backtoComplete, backtoCreateNew, backtoGender, backtoHeadPosition, backtoPicture, bitmap_button1, bitmap_button2, bitmap_face, bitmap_mask, bitmap_mouth, calcDistance, changeStatus, choosenaccessories, choosenvideo, cleanUp, container, container1, containerPreview, containerResult, container_mouth, control_mouth, createMask, ctrack, destroyCamera, detect_face, drawMouth, elipse, enablestart, gender, img_btn, img_face, img_mask, img_result, initCamera, initMouthPreview, moveMouthPreview, offsetMouth, onKeypressQuote, onMoveChangeValue, onToolsChangeValue, p, previewMouthAnimate, process, resetPicture, saveChooseAccessories, saveChooseVideo, saveGender, saveMouthPosition, savePicture, saveTextMessageVideo, selectGender, shape_button1, shape_button2, shape_mouth, shape_support, skipTextMessageVideo, stage, stagePreview, step, step_class, takePicture, text_support, tick, tools_rotate, tools_scale, update, url, url_button, url_mask, url_result, vid, wait_clm_ready;
  step = ['1/8', '2/8', '3/8', '4/8', '5/8', '6/8', '7/8', '8/8', '8/8'];
  step_class = ['step1', 'step2', 'step3', 'step4', 'step5', 'step6', 'step7', 'step8', 'step9'];
  url = site_url + '/experiment/upload';
  MASK = [site_url + '/img/mask-male.png', site_url + '/img/mask-female.png'];
  gender = '';
  choosenvideo = -1;
  choosenaccessories = -1;
  url_mask = '';
  url_button = site_url + '/img/button.png';
  CANVAS_WIDTH = 512;
  CANVAS_HEIGHT = 512;
  img_face = void 0;
  img_mask = void 0;
  img_result = void 0;
  img_btn = void 0;
  ctrack = void 0;
  url_result = {
    face: '',
    mouth: ''
  };
  _textMessage = '';
  _maxQuote = 144;
  _img1 = void 0;
  _img2 = void 0;
  _timer = void 0;
  _timer_editor = void 0;
  _size = void 0;
  _id_exp = void 0;
  p = void 0;
  process = document.getElementById('process').getContext('2d');
  tools_scale = $('#tools #scale');
  tools_rotate = $('#tools #rotate');
  stage = new createjs.Stage('image');
  stagePreview = new createjs.Stage('preview');
  createjs.Touch.enable(stage);
  stage.enableMouseOver(10);
  stage.mouseMoveOutside = true;
  container = new createjs.Container();
  container.x = stage.canvas.width / 2;
  container.y = stage.canvas.height / 2;
  containerPreview = new createjs.Container();
  container_mouth = new createjs.Container();
  container_mouth.x = stage.canvas.width / 2;
  container_mouth.y = stage.canvas.height / 2;
  control_mouth = new createjs.Container();
  control_mouth.x = stage.canvas.width / 2;
  control_mouth.y = stage.canvas.height / 2;
  container1 = new createjs.Container();
  container1.x = stage.canvas.width / 2;
  container1.y = stage.canvas.height / 2;
  containerResult = new createjs.Container();
  containerResult.regX = containerResult.x = stage.canvas.width / 2;
  containerResult.regY = containerResult.y = stage.canvas.height / 2;
  stage.addChild(container);
  stage.addChild(container_mouth);
  stage.addChild(container1);
  stage.addChild(containerResult);
  bitmap_face = new createjs.Bitmap();
  bitmap_mouth = new createjs.Bitmap();
  bitmap_mask = new createjs.Bitmap();
  text_support = new createjs.Text();
  shape_mouth = new createjs.Shape();
  shape_support = new createjs.Shape();
  shape_button1 = new createjs.Shape();
  shape_button2 = new createjs.Shape();
  bitmap_button1 = new createjs.Bitmap();
  bitmap_button2 = new createjs.Bitmap();
  stage.addChild(bitmap_face);
  stage.addChild(bitmap_mask);
  elipse = void 0;
  update = false;
  animating = false;
  vid = document.getElementById('video1');
  tick = function(e) {
    if (update || animating) {
      stage.update();
      return stagePreview.update();
    }
  };
  createjs.Ticker.addEventListener("tick", tick);
  enablestart = function() {
    var startbutton;
    if (videoReady && imagesReady) {
      startbutton = document.getElementById('startbutton');
      startbutton.value = 'start';
      startbutton.disabled = null;
    }
  };
  $('input[type="file"]').fileupload({
    url: url,
    dataType: 'json',
    formData: {
      _csrf: _csrf
    },
    progressall: function(e, data) {
      var progress;
      progress = parseInt(data.loaded / data.total * 100, 10);
      return $('#progress .progress-bar').css('width', progress + '%');
    }
  }).on('fileuploaddone', function(e, data) {
    if (data.result) {
      detect_face(data.result);
    }
  }).prop('disabled', !$.support.fileInput).parent().addClass($.support.fileInput ? void 0 : 'disabled');
  selectGender = function() {
    if ($('#gender .active').length > 0) {
      $('#gender .active').removeClass('active');
    }
    $(this).addClass('active');
    return saveGender();
  };
  saveGender = function() {
    var _i;
    if ($('#gender .active').length === 1) {
      changeStatus(1);
      _i = $('#gender #selectMale,#gender #selectFemale').index($('#gender .active'));
      url_mask = MASK[_i];
      gender = _i === 0 ? 'male' : 'female';
      ga('send', 'event', 'pilih', 'Gender', gender);
      createMask(true);
      return initCamera();
    }
  };
  backtoGender = function() {
    changeStatus(0);
    bitmap_mask.visible = false;
    return destroyCamera();
  };
  savePicture = function() {
    var blob, data, file, img;
    vid.pause();
    bitmap_mask.visible = false;
    stage.update();
    process.drawImage(stage.canvas, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    bitmap_mask.visible = true;
    stage.update();
    img = process.canvas.toDataURL('image/jpeg');
    blob = dataURItoBlob(img);
    data = new FormData();
    file = new File([blob], 'canvas-' + (new Date().getTime() / 1000) + '.jpg', {
      type: 'image/jpeg'
    });
    data.append("image", file);
    $('input[type="file"]').fileupload({
      url: url,
      dataType: 'json',
      formData: {
        _csrf: _csrf
      },
      add: function(e, d) {
        return d.submit();
      },
      progressall: function(e, data) {
        var progress;
        progress = parseInt(data.loaded / data.total * 100, 10);
        $('#progress .progress-bar').css('width', progress + '%');
      }
    }).on('fileuploaddone', function(e, data) {
      if (data.result) {
        detect_face(data.result);
        destroyCamera();
      }
    });
    return $('input[type="file"]').fileupload('add', {
      files: file
    });
  };
  resetPicture = function() {
    $('#resetPicture,#savePicture').hide();
    $('#takePicture').show();
    animating = true;
    return vid.play();
  };
  takePicture = function() {
    $(this).hide();
    $('#resetPicture,#savePicture').css('display', 'block');
    animating = false;
    return vid.pause();
  };
  backtoPicture = function() {
    stage.removeChild(text_support);
    stage.removeChild(shape_support);
    $('#saveHeadPosition').attr('disabled', 'disabled');
    bitmap_face.image = null;
    stage.removeAllEventListeners('stagemousedown');
    stage.removeAllEventListeners('stagemousemove');
    stage.removeAllEventListeners('stagemouseup');
    changeStatus(1);
    container.mask = null;
    initCamera();
    $('#resetPicture,#savePicture').hide();
    $('#takePicture').show();
    return animating = true;
  };
  wait_clm_ready = function(c) {
    if (typeof pModel === 'undefined' || typeof clm === 'undefined') {
      return setTimeout((function() {
        console.log('wait clm and pmodel script');
        return wait_clm_ready(c);
      }), 500);
    } else {
      if (typeof c === 'function') {
        return c();
      }
    }
  };
  detect_face = function(src) {
    if (src) {
      img_face = new Image;
      img_face.onload = function() {
        changeStatus(2);
        tools_scale.off('change');
        tools_rotate.off('change');
        _size = calculateAspectRatioFit(this.width, this.height, CANVAS_WIDTH, CANVAS_HEIGHT);
        bitmap_face.image = this;
        bitmap_face.x = 0;
        bitmap_face.y = 0;
        bitmap_face.scaleX = bitmap_face.scaleY = _size.width / this.width;
        container.rotation = 0;
        container.x = container.y = 0;
        container.regX = container.regY = 0;
        process.drawImage(img_face, 0, 0, _size.width, _size.height);
        HeadPositionEditor();
        return createMask();
      };
      return img_face.src = site_url + '/' + src;
    } else {
      bitmap_mask.visible = false;
      stage.update();
      process.drawImage(stage.canvas, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      bitmap_mask.visible = true;
      stage.update();
      img_face = new Image;
      img_face.onload = function() {
        changeStatus(2);
        _size = calculateAspectRatioFit(this.width, this.height, CANVAS_WIDTH, CANVAS_HEIGHT);
        bitmap_face.image = this;
        bitmap_face.x = 0;
        bitmap_face.y = 0;
        bitmap_face.scaleX = bitmap_face.scaleY = _size.width / this.width;
        container.rotation = 0;
        container.x = container.y = 0;
        container.regX = container.regY = 0;
        HeadPositionEditor();
        createMask();
        vid.mozSrcObject = '';
        return vid.src = '';
      };
      return img_face.src = process.canvas.toDataURL();
    }
  };
  HeadPositionEditor = function() {
    container.addChild(bitmap_face);
    container.x = 0;
    container.y = 0;
    elipse = new createjs.Shape();
    elipse.graphics.beginFill('black').mt(13.633, 54.68).bt(13.633, 54.68, 33.41, 1.0129999999999981, 95.688, 0.012999999999998124).bt(157.966, -0.9870000000000019, 183.63299999999998, 56.346, 183.966, 57.346).bt(184.29900000000004, 58.346, 193.966, 143.68, 193.299, 168.346).bt(192.632, 193.013, 187.632, 227.013, 150.632, 247.013).bt(113.632, 267.01300000000003, 69.3, 259.346, 56.967, 252.68).bt(44.634, 246.013, 12.634, 234.013, 0.29999999999999716, 177.347).bt(-2.367, 157.346, 13.633, 54.68, 13.633, 54.68).cp();
    elipse.set({
      x: 160,
      y: 90
    });
    container.mask = elipse;
    tools_scale.val(LimitedRange(container.scaleX, 0, 3, 0, 100)).rangeslider('update', true);
    tools_rotate.val(LimitedRange(container.rotation, -90, 90, 0, 100)).rangeslider('update', true);
    if ('oninput' in tools_scale[0]) {
      tools_scale[0].oninput = onToolsChangeValue;
      tools_rotate[0].oninput = onToolsChangeValue;
    } else {
      tools_scale.on('change', onToolsChangeValue);
      tools_rotate.on('change', onToolsChangeValue);
    }
    onMoveChangeValue();
    update = true;
    return $('#saveHeadPosition').removeAttr('disabled');
  };
  backtoHeadPosition = function() {
    stage.removeAllEventListeners('stagemousedown');
    stage.removeAllEventListeners('stagemousemove');
    stage.removeAllEventListeners('stagemouseup');
    stage.removeChild(container1);
    createMask();
    onMoveChangeValue();
    return changeStatus(2);
  };
  calcDistance = function(a, b) {
    return {
      x: a.localToGlobal(0, 0).x - b.localToGlobal(0, 0).x,
      y: a.localToGlobal(0, 0).y - b.localToGlobal(0, 0).y
    };
  };
  offsetMouth = 12;
  drawMouth = function(_r) {
    var lc1, lc2, rc1, rc2, yoffset;
    lc1 = calcDistance(bitmap_button1, shape_button1);
    rc1 = calcDistance(shape_button2, bitmap_button1);
    lc2 = calcDistance(bitmap_button2, shape_button1);
    rc2 = calcDistance(shape_button2, bitmap_button2);
    yoffset = Math.max(bitmap_button2.y - offsetMouth, shape_button1.y, shape_button2.y);
    if (_r) {
      shape_button1.visible = shape_button2.visible = false;
      bitmap_button1.visible = bitmap_button2.visible = false;
      container1.mask = elipse;
      shape_support.graphics.clear().beginFill("#000");
    } else {
      shape_button1.visible = shape_button2.visible = true;
      bitmap_button1.visible = bitmap_button2.visible = true;
      container1.mask = null;
      shape_support.graphics.clear().setStrokeStyle(2).beginStroke("#598C8B");
    }
    shape_support.y = 0;
    shape_support.graphics.mt(shape_button1.x, shape_button1.y).qt(shape_button1.x + lc1.x * .5, bitmap_button1.y, bitmap_button1.x, bitmap_button1.y).qt(shape_button2.x - rc1.x * .5, bitmap_button1.y, shape_button2.x, shape_button2.y).lt(shape_button2.x, yoffset).qt(shape_button2.x - rc2.x * .5, bitmap_button2.y, bitmap_button2.x, bitmap_button2.y).qt(shape_button1.x + lc2.x * .5, bitmap_button2.y, shape_button1.x, yoffset).cp();
    return update = true;
  };
  previewMouthAnimate = function() {
    animating = true;
    createjs.Tween.get(control_mouth, {
      loop: true
    }).to({
      y: control_mouth.y + 20
    }, 300, createjs.Ease.getPowInOut(4)).to({
      y: control_mouth.y
    }, 300, createjs.Ease.getPowInOut(2));
    setTimeout((function() {
      $('#saveMouthPosition').removeAttr('disabled');
      createjs.Tween.removeTweens(control_mouth);
      control_mouth.y = 0;
      return animating = false;
    }), 2000);
    return $('#saveMouthPosition').attr('disabled', 'disabled');
  };
  moveMouthPreview = function() {
    containerPreview.removeChild(shape_mouth);
    drawMouth(true);
    stage.update();
    shape_mouth = shape_support.clone(true);
    shape_mouth.x += CANVAS_WIDTH / 2;
    shape_mouth.y += CANVAS_HEIGHT / 2;
    drawMouth();
    stage.update();
    container_mouth.mask = shape_mouth;
    containerPreview.addChild(shape_mouth);
    return containerResult.addChild(control_mouth);
  };
  initMouthPreview = function() {
    stagePreview.removeAllChildren();
    container1.visible = false;
    bitmap_mask.visible = false;
    stage.update();
    process.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    process.drawImage(stage.canvas, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    container1.visible = true;
    bitmap_mask.visible = true;
    stage.update();
    img_result = new Image;
    img_result.onload = function() {
      var _bitmap_face, _elipse;
      containerResult.removeAllChildren();
      _bitmap_face = new createjs.Bitmap();
      _bitmap_face.image = this;
      _bitmap_face.x = 0;
      _bitmap_face.y = 0;
      _bitmap_face.scaleX = _bitmap_face.scaleY = 1;
      containerPreview = new createjs.Container();
      containerPreview.rotation = 0;
      containerPreview.x = containerPreview.y = 0;
      containerPreview.regX = containerPreview.regY = 0;
      _elipse = elipse.clone(true);
      drawMouth(true);
      stage.update();
      shape_mouth = shape_support.clone(true);
      shape_mouth.x += CANVAS_WIDTH / 2;
      shape_mouth.y += CANVAS_HEIGHT / 2;
      drawMouth();
      stage.update();
      containerPreview.addChild(_bitmap_face);
      containerResult.addChild(containerPreview);
      container_mouth = containerPreview.clone(true);
      container_mouth.x = container_mouth.y = 0;
      container_mouth.mask = shape_mouth;
      control_mouth = new createjs.Container();
      control_mouth.addChild(container_mouth);
      control_mouth.x = 0;
      control_mouth.y = 0;
      control_mouth.regX = control_mouth.regY = 0;
      containerPreview.mask = _elipse;
      containerPreview.addChild(shape_mouth);
      containerResult.addChild(control_mouth);
      return stagePreview.addChild(containerResult);
    };
    return img_result.src = process.canvas.toDataURL();
  };
  MouthPositionEditor = function() {
    shape_support.graphics.clear().setStrokeStyle(2).beginStroke("#598C8B").mt(0, 0).qt(25, 13, 50, 0).lt(50, 15).qt(25, 28, 0, 15).cp();
    shape_button1.graphics.clear().beginFill('#DF8C17').mt(-10, -14).lt(10, 0).lt(-10, 14).cp();
    shape_button2.graphics.clear().beginFill('#DF8C17').mt(10, -14).lt(-10, 0).lt(10, 14).cp();
    img_btn = new Image;
    img_btn.onload = function() {
      bitmap_button1.image = this;
      bitmap_button2.image = this;
      bitmap_button1.regX = this.width / 2;
      bitmap_button1.regY = this.height / 2;
      bitmap_button2.regX = this.width / 2;
      bitmap_button2.regY = this.height / 2;
      container1.addChild(bitmap_button1);
      container1.addChild(bitmap_button2);
      bitmap_button1.set({
        x: 0,
        y: 35,
        scaleX: 1.5,
        scaleY: 1.5
      });
      bitmap_button2.set({
        x: 0,
        y: 65,
        scaleX: 1.5,
        scaleY: 1.5
      });
      stage.update();
      stage.addEventListener('stagemousedown', function(e) {
        var documentLeft, documentTop, isTouch, offset;
        isTouch = e.nativeEvent.type === 'touchstart' ? true : false;
        documentTop = isTouch ? document.body.scrollTop : 0;
        documentLeft = isTouch ? document.body.scrollLeft : 0;
        offset = {
          x: stage.mouseX + documentLeft,
          y: stage.mouseY + documentTop
        };
        shape_button1.offset = {
          x: shape_button1.x - (stage.mouseX + documentLeft),
          y: shape_button1.y - (stage.mouseY + documentTop)
        };
        shape_button2.offset = {
          x: shape_button2.x - (stage.mouseX + documentLeft),
          y: shape_button2.y - (stage.mouseY + documentTop)
        };
        bitmap_button1.offset = {
          x: bitmap_button1.x - (stage.mouseX + documentLeft),
          y: bitmap_button1.y - (stage.mouseY + documentTop)
        };
        bitmap_button2.offset = {
          x: bitmap_button2.x - (stage.mouseX + documentLeft),
          y: bitmap_button2.y - (stage.mouseY + documentTop)
        };
        shape_button1.pos = shape_button1.globalToLocal(offset.x, offset.y);
        shape_button2.pos = shape_button2.globalToLocal(offset.x, offset.y);
        bitmap_button1.pos = bitmap_button1.globalToLocal(offset.x, offset.y);
        bitmap_button2.pos = bitmap_button2.globalToLocal(offset.x, offset.y);
        stage.addEventListener('stagemousemove', function(evt) {
          documentTop = isTouch ? document.body.scrollTop : 0;
          documentLeft = isTouch ? document.body.scrollLeft : 0;
          if (shape_button1.hitTest(shape_button1.pos.x, shape_button1.pos.y)) {
            shape_button1.x = Math.max(Math.min(stage.mouseX + documentLeft + shape_button1.offset.x, bitmap_button1.x, bitmap_button2.x), -95);
            shape_button1.y = Math.max(Math.min(stage.mouseY + documentTop + shape_button1.offset.y, 95), -60);
          } else if (shape_button2.hitTest(shape_button2.pos.x, shape_button2.pos.y)) {
            shape_button2.x = Math.min(Math.max(stage.mouseX + documentLeft + shape_button2.offset.x, bitmap_button1.x, bitmap_button2.x), 95);
            shape_button2.y = Math.max(Math.min(stage.mouseY + documentTop + shape_button2.offset.y, 95), -60);
          } else if (bitmap_button1.hitTest(bitmap_button1.pos.x, bitmap_button1.pos.y)) {
            bitmap_button1.x = Math.max(Math.min(stage.mouseX + documentLeft + bitmap_button1.offset.x, shape_button2.x), shape_button1.x);
            bitmap_button1.y = Math.max(Math.min(stage.mouseY + documentTop + bitmap_button1.offset.y, bitmap_button2.y), -60);
          } else if (bitmap_button2.hitTest(bitmap_button2.pos.x, bitmap_button2.pos.y)) {
            bitmap_button2.x = Math.max(Math.min(stage.mouseX + documentLeft + bitmap_button2.offset.x, shape_button2.x), shape_button1.x);
            bitmap_button2.y = Math.max(Math.min(stage.mouseY + documentTop + bitmap_button2.offset.y, 95), bitmap_button1.y);
          }
          drawMouth();
          return update = true;
        });
        return stage.addEventListener('stagemouseup', function() {
          moveMouthPreview();
          return stage.removeAllEventListeners('stagemousemove');
        });
      });
      drawMouth();
      return initMouthPreview();
    };
    stage.addChild(container1);
    drawMouth();
    initMouthPreview();
    return update = true;
  };
  saveMouthPosition = function() {
    var mask_ctx, mask_trans;
    stage.removeChild(container1);
    container_mouth.visible = false;
    stagePreview.update();
    process.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    process.drawImage(stagePreview.canvas, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    mask_ctx = $('<canvas>')[0].getContext('2d');
    mask_ctx.canvas.width = CANVAS_WIDTH;
    mask_ctx.canvas.height = CANVAS_HEIGHT;
    mask_trans = new Image();
    mask_trans.onload = function() {
      var base_pixels, mask_pixels, x, y;
      mask_ctx.drawImage(this, 0, 0);
      base_pixels = process.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      mask_pixels = mask_ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      y = 1;
      while (y < CANVAS_HEIGHT - 1) {
        x = 1;
        while (x < CANVAS_WIDTH - 1) {
          p = (y * CANVAS_WIDTH + x) * 4;
          base_pixels.data[p + 3] = mask_pixels.data[p + 3];
          x++;
        }
        y++;
      }
      process.putImageData(base_pixels, 0, 0);
      stagePreview.update();
      _img1 = process.canvas.toDataURL();
      container_mouth.visible = true;
      containerPreview.visible = false;
      stagePreview.update();
      process.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      process.drawImage(stagePreview.canvas, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      _img2 = process.canvas.toDataURL();
      container_mouth.visible = true;
      containerPreview.visible = true;
      stagePreview.update();
      return changeStatus(4);
    };
    return mask_trans.src = site_url + '/video/images/face-' + gender + '.png';
  };
  backtoCreateNew = function() {
    bitmap_mask.visible = false;
    stage.removeChild(text_support);
    stage.removeChild(shape_support);
    bitmap_face.image = null;
    choosenvideo = -1;
    choosenaccessories = -1;
    $('#gender .active').removeClass('active');
    gender = '';
    return changeStatus(0);
  };
  ContinueToNextStage = function() {
    changeStatus(5);
    return initChooseVideo(gender);
  };
  backtoComplete = function() {
    $('#chooseVideo video.active').removeClass('active');
    return changeStatus(4);
  };
  saveChooseVideo = function() {
    var name_video, name_video_female, name_video_male;
    if ($('#chooseVideo video.active').length === 1) {
      choosenvideo = $('#chooseVideo video').index($('#chooseVideo video.active'));
      name_video_male = ['India_Cowok_01_scaled', 'Coachella CO Rev_scaled', 'HipHop CO rev 2_scaled', 'Jepang CO_scaled'];
      name_video_female = ['India_Cewek_01_scaled', 'Coachella CE Rev_scaled', 'Hiphop CE rev 2_scaled', 'Jepang CE_scaled'];
      name_video = gender === 'male' ? name_video_male : name_video_female;
      ga('send', 'event', 'pilih', 'Video', name_video[choosenvideo]);
      changeStatus(6);
      return initAccessories();
    }
  };
  saveChooseAccessories = function() {
    var _effect;
    choosenaccessories = $('#chooseAccessories canvas').index($('#chooseAccessories canvas.active'));
    _effect = ['confetti', 'confetti2', 'plasma', 'fireworks'];
    ga('send', 'event', 'pilih', 'Aksesoris', _effect[choosenaccessories]);
    destroyAccessories();
    return $.ajax({
      url: site_url + '/experiment/save',
      data: {
        gender: gender,
        video: choosenvideo,
        accessories: choosenaccessories,
        faceimage: _img1,
        mouthimage: _img2,
        _csrf: _csrf
      },
      type: 'POST',
      dataType: 'JSON',
      success: function(e) {
        _id_exp = e.id;
        url_result.id = e.id;
        url_result.face = site_url + '/' + e.face;
        url_result.mouth = site_url + '/' + e.mouth;
        changeStatus(7);
        $('#form-share #tw-text-remain').html(" <span>" + (_maxQuote - $('#form-share #text-share').val().length) + "</span>characters left");
        $('#form-share #text-share').off('keypress').on('keypress', onKeypressQuote);
        $('#form-share #text-share').off('keyup').on('keyup', onKeypressQuote);
        return initRender({
          gender: gender,
          video: choosenvideo,
          accessories: choosenaccessories,
          resource: url_result
        }, tw_btn);
      },
      error: function(e) {
        return console.log(e);
      }
    });
  };
  onKeypressQuote = function(e) {
    $('#form-share #tw-text-remain').html(" <span>" + (_maxQuote - $('#form-share #text-share').val().length) + "</span>characters left");
    if ($('#form-share #text-share').val().length >= _maxQuote) {
      e.preventDefault();
      return false;
    }
  };
  backtoChooseVideo = function() {
    return changeStatus(5);
  };
  createMask = function(blank) {
    if (_timer) {
      clearTimeout(_timer);
    }
    return _timer = setTimeout((function() {
      img_mask = new Image;
      img_mask.onload = function() {
        bitmap_mask.image = this;
        bitmap_mask.visible = true;
        if (!blank) {
          text_support.text = "Eye line";
          text_support.font = "bold 25px Arial";
          text_support.x = 7;
          text_support.y = 240;
          text_support.textBaseline = "alphabetic";
          stage.addChild(text_support);
          shape_support.graphics.clear().beginFill('#DF8C17').mt(117, 220).lt(137, 232).lt(117, 244).cp();
          shape_support.graphics.beginFill('#DF8C17').mt(375, 232).lt(395, 220).lt(395, 244).cp();
          shape_support.graphics.setStrokeDash([20, 10]).setStrokeStyle(6).beginStroke("#598C8B").mt(145, 232).lineTo(368, 232);
          shape_support.y = -27;
          stage.addChild(shape_support);
        }
        update = true;
      };
      img_mask.src = url_mask;
    }), 500);
  };
  saveTextMessageVideo = function() {
    _textMessage = $('#form-share #text-share').val();
    setMessageVideo(_textMessage);
    return $.ajax({
      url: site_url + '/experiment/saveMessage',
      data: {
        id: _id_exp,
        message: _textMessage,
        _csrf: _csrf
      },
      type: 'POST',
      dataType: 'JSON',
      success: function(e) {
        var _href;
        changeStatus(8);
        _href = site_url + '/experiment/' + _id_exp;
        return window.history.pushState({}, $('title').text(), _href);
      },
      error: function(e) {
        return console.log(e);
      }
    });
  };
  skipTextMessageVideo = function() {
    var _href;
    _textMessage = '';
    setMessageVideo(_textMessage);
    changeStatus(8);
    _href = site_url + '/experiment/' + _id_exp;
    return window.history.pushState({}, $('title').text(), _href);
  };
  onMoveChangeValue = function() {
    return stage.addEventListener('stagemousedown', function(e) {
      var offset;
      bitmap_mask.alpha = 0.4;
      container.mask = null;
      update = true;
      offset = {
        x: container.x - e.stageX,
        y: container.y - e.stageY
      };
      stage.addEventListener('stagemousemove', function(ev) {
        container.x = ev.stageX + offset.x;
        container.y = ev.stageY + offset.y;
        update = true;
      });
      stage.addEventListener('stagemouseup', function() {
        var local;
        bitmap_mask.alpha = 1;
        container.mask = elipse;
        local = container.globalToLocal(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        container.regX = local.x;
        container.regY = local.y;
        container.x = CANVAS_WIDTH / 2;
        container.y = CANVAS_HEIGHT / 2;
        update = true;
        stage.removeAllEventListeners('stagemousemove');
      });
    });
  };
  onToolsChangeValue = function(e) {
    if (this.id === 'scale') {
      container.scaleX = container.scaleY = LimitedRange($(this).val(), 0, 100, 0, 3);
      update = true;
    }
    if (this.id === 'rotate') {
      container.rotation = LimitedRange($(this).val(), 0, 100, -90, 90);
      return update = true;
    }
  };
  changeStatus = function(e) {
    $('#step').html(step[e]).parents('.wrapper-frames').attr('class', 'wrapper-frames').addClass(step_class[e]);
    $('#gender,#source,#tools,#panels,#text,#content,#preview,#chooseVideo,#chooseAccessories,#render').hide();
    $('#backtoGender,#backtoPicture,#backtoHeadPosition,#backtoCreateNew,#backtoComplete,#backtoChooseVideo').hide();
    $('#saveGender,#savePicture,#saveHeadPosition,#saveMouthPosition,#continue,#saveChooseVideo,#saveChooseAccessories').hide();
    $('#result').hide();
    switch (e) {
      case 0:
        $('#gender').show();
        return $('#saveGender').show();
      case 1:
        $('#source').show();
        $('#backtoGender').show();
        return $('#result').show();
      case 2:
        $('#tools').show();
        $('#saveHeadPosition').show();
        $('#backtoPicture').show();
        return $('#result').show();
      case 3:
        $('#panels').show();
        $('#preview').css('display', 'inline');
        $('#saveMouthPosition').show();
        $('#backtoHeadPosition').show();
        return $('#result').show();
      case 4:
        $('#backtoCreateNew').show();
        $('#continue').show();
        $('#result').show();
        return $('#text').show();
      case 5:
        $('#chooseVideo').show();
        $('#backtoComplete').show();
        return $('#saveChooseVideo').show();
      case 6:
        $('#chooseAccessories').show();
        $('#backtoChooseVideo').show();
        return $('#saveChooseAccessories').show();
      case 7:
        $('#render').show();
        return $('#render #form-share').show();
      case 8:
        $('#render').show();
        return $('#render #form-share').hide();
    }
  };
  cleanUp = function() {
    var clm, pModel;
    ctrack = null;
    pModel = null;
    clm = null;
    createjs.Ticker.removeAllEventListeners();
    stage.removeAllChildren();
    stage = null;
    stagePreview.removeAllChildren();
    stagePreview = null;
    return p = null;
  };
  if (_data) {
    changeStatus(8);
    cleanUp();
    if (_data.fileReady === 'true') {
      showVideo({
        user: _data.user,
        gender: _data.options.gender,
        video: _data.options.video,
        message: _data.options.message,
        accessories: _data.options.accessories,
        resource: {
          id: _data._id
        },
        src: site_url + '/userfiles/' + _data.user + '/' + _data._id + '.mp4'
      });
    } else {
      url_result.id = _data._id;
      url_result.face = site_url + '/userfiles/' + _data.user + '/face-' + _data._id + '.png';
      url_result.mouth = site_url + '/userfiles/' + _data.user + '/mouth-' + _data._id + '.png';
      initRender({
        user: _data.user,
        gender: _data.options.gender,
        video: _data.options.video,
        message: _data.options.message,
        accessories: _data.options.accessories,
        resource: url_result
      });
    }
  } else {
    changeStatus(0);
  }
  $('#selectFemale,#selectMale').on('click', selectGender);
  $('#saveGender').on('click', saveGender);
  $('#backtoGender').on('click', backtoGender);
  $('#resetPicture').on('click', resetPicture);
  $('#takePicture').on('click', takePicture);
  $('#savePicture').on('click', savePicture);
  $('#backtoPicture').on('click', backtoPicture);
  $('#saveHeadPosition').on('click', function() {
    stage.removeAllEventListeners('stagemousedown');
    stage.removeAllEventListeners('stagemousemove');
    stage.removeAllEventListeners('stagemouseup');
    changeStatus(3);
    stage.removeChild(text_support);
    stage.removeChild(shape_support);
    update = true;
    return MouthPositionEditor();
  });
  $('#backtoHeadPosition').on('click', backtoHeadPosition);
  $('#saveMouthPosition').on('click', saveMouthPosition);
  $('#backtoCreateNew').on('click', backtoCreateNew);
  $('#continue').on('click', ContinueToNextStage);
  $('#backtoComplete').on('click', backtoComplete);
  $('#saveChooseVideo').on('click', saveChooseVideo);
  $('#saveChooseAccessories').on('click', saveChooseAccessories);
  $('#backtoChooseVideo').on('click', backtoChooseVideo);
  $('#submit-share').on('click', saveTextMessageVideo);
  $('#skip-share').on('click', skipTextMessageVideo);
  _getUserMedia = navigator.mediaDevices && navigator.mediaDevices.getUserMedia ? navigator.mediaDevices : (navigator.mozGetUserMedia || navigator.webkitGetUserMedia ? {
    getUserMedia: function(c) {
      return new Promise(function(y, n) {
        return (navigator.mozGetUserMedia || navigator.webkitGetUserMedia).call(navigator, c, y, n);
      });
    }
  } : null);
  window.URL = window.URL || window.webkitURL || window.msURL || window.mozURL;
  _cameraStream = null;
  initCamera = function() {
    if (_getUserMedia) {
      return _getUserMedia.getUserMedia({
        "video": true
      }).then(function(stream) {
        _cameraStream = stream;
        vid.onloadedmetadata = function() {
          vid.play();
          bitmap_face.x = bitmap_face.y = 0;
          _size = calculateAspectRatioFit(this.width, this.height, CANVAS_WIDTH, CANVAS_HEIGHT);
          bitmap_face.image = this;
          bitmap_face.x = 0;
          bitmap_face.y = 0;
          bitmap_face.scaleX = bitmap_face.scaleY = _size.width / this.width;
          container.rotation = 0;
          container.x = container.y = 0;
          container.regX = container.regY = 0;
          return animating = true;
        };
        vid.src = window.URL.createObjectURL(stream) || stream;
        return bitmap_face.image = vid;
      })["catch"](function() {
        return $('#takePicture,#source .or').hide();
      });
    } else {
      return $('#takePicture,#source .or').hide();
    }
  };
  return destroyCamera = function() {
    _cameraStream;
    var tracks;
    if (_getUserMedia) {
      if (_cameraStream) {
        if (_cameraStream.getVideoTracks) {
          tracks = _cameraStream.getVideoTracks();
          if (tracks && tracks[0] && tracks[0].stop) {
            tracks[0].stop();
          }
        } else if (_cameraStream.stop) {
          _cameraStream.stop();
        }
      }
      if (vid.mozCaptureStream) {
        return vid.mozSrcObject = null;
      } else {
        return vid.src = "";
      }
    }
  };
});
