# ----------------------------
# personalize.coffee
# ----------------------------
# - upload or webcam
# - face detection
# - head mouth editor
# - webcam functionallity
# - #BUG1touch mouth not work
# - #BUG2 position cam/video img result missed
# - preview animation mouth
# - back step functionallity:
#    a. moving head and mouth editor
#    b. replace head / mouth image
# ----------------------------
$ ->
#   'use strict'
        #['select gender','upload', 'head position', 'mouth position', 'complete', 'choose video', 'choose accessories', 'addquote', 'share']
  step = ['1/8','2/8', '3/8', '4/8', '5/8', '6/8', '7/8', '8/8', '8/8']
  step_class = ['step1','step2','step3','step4','step5','step6','step7','step8','step9']
  url = site_url+'/experiment/upload'
  MASK = [site_url+'/img/mask-male.png',site_url+'/img/mask-female.png']
  gender = ''
  choosenvideo = -1
  choosenaccessories = -1
  url_mask = ''
  url_button = site_url+'/img/button.png'
  CANVAS_WIDTH = 512
  CANVAS_HEIGHT = 512
  img_face = undefined
  img_mask = undefined
  img_result = undefined
  img_btn = undefined
  ctrack = undefined
  url_result = {face:'',mouth:''}
  # object_moved = undefined
  # drawRequest = undefined
  _textMessage = ''
  _maxQuote = 144
  _img1 = undefined
  _img2 = undefined
  _timer = undefined
  _timer_editor = undefined
  _size = undefined
  _id_exp = undefined
  p  = undefined
  process = document.getElementById('process').getContext('2d')
  tools_scale = $('#tools #scale')
  tools_rotate = $('#tools #rotate')
  stage = new createjs.Stage 'image'
  stagePreview = new createjs.Stage 'preview'
  createjs.Touch.enable(stage)
  stage.enableMouseOver(10)
  stage.mouseMoveOutside = true
  container = new createjs.Container()
  container.x = stage.canvas.width / 2
  container.y = stage.canvas.height / 2
  containerPreview = new createjs.Container()
  container_mouth = new createjs.Container()
  container_mouth.x = stage.canvas.width / 2
  container_mouth.y = stage.canvas.height / 2
  control_mouth = new createjs.Container()
  control_mouth.x = stage.canvas.width / 2
  control_mouth.y = stage.canvas.height / 2
  container1 = new createjs.Container()
  container1.x = stage.canvas.width / 2
  container1.y = stage.canvas.height / 2
  containerResult = new createjs.Container()
  containerResult.regX = containerResult.x = stage.canvas.width / 2
  containerResult.regY = containerResult.y = stage.canvas.height / 2
  stage.addChild container
  stage.addChild container_mouth
  stage.addChild container1
  stage.addChild containerResult
  bitmap_face = new createjs.Bitmap()
  bitmap_mouth = new createjs.Bitmap()
  bitmap_mask = new createjs.Bitmap()
  text_support = new createjs.Text()
  shape_mouth = new createjs.Shape()
  shape_support = new createjs.Shape()
  shape_button1 = new createjs.Shape()
  shape_button2 = new createjs.Shape()
  bitmap_button1 = new createjs.Bitmap()
  bitmap_button2 = new createjs.Bitmap()
  stage.addChild bitmap_face
  stage.addChild bitmap_mask
  elipse = undefined
  update = false
  animating = false
  vid = document.getElementById('video1')
  tick = (e)->
    if update or animating
      #update = false # idupin nanti
      stage.update()
      stagePreview.update() # matiin nanti gunain manual update biar ringan
  createjs.Ticker.addEventListener("tick", tick)
  enablestart = ->
    if videoReady and imagesReady
      startbutton = document.getElementById('startbutton')
      startbutton.value = 'start'
      startbutton.disabled = null
    return
  $('input[type="file"]').fileupload(
    url: url
    dataType: 'json'
    formData: {_csrf:_csrf}
    progressall: (e, data) ->
      progress = parseInt(data.loaded / data.total * 100, 10)
      $('#progress .progress-bar').css 'width', progress + '%'
  ).on('fileuploaddone', (e, data) ->
    if data.result
      detect_face data.result
    return
  ).prop('disabled', !$.support.fileInput).parent().addClass if $.support.fileInput then undefined else 'disabled'
  selectGender = ->
    if $('#gender .active').length>0 then $('#gender .active').removeClass 'active'
    $(@).addClass 'active'
    saveGender()
  saveGender = ->
    if $('#gender .active').length is 1
      changeStatus 1
      _i = $('#gender #selectMale,#gender #selectFemale').index($('#gender .active'))
      url_mask = MASK[_i]
      gender = if _i == 0 then 'male' else 'female'
      ga('send', 'event', 'pilih', 'Gender', gender)
      createMask(true)
      initCamera()
  backtoGender = ->
    changeStatus 0
    bitmap_mask.visible = false
    destroyCamera()
  savePicture = ->
    vid.pause()
    bitmap_mask.visible = false
    stage.update()
    process.drawImage stage.canvas, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT
    bitmap_mask.visible = true
    stage.update()
    img = process.canvas.toDataURL('image/jpeg')
    blob = dataURItoBlob(img)
    data = new FormData()
    file = new File( [blob],'canvas-'+(new Date().getTime()/1000)+'.jpg',{type:'image/jpeg'})
    data.append("image", file)
    $('input[type="file"]').fileupload(
      url: url
      dataType: 'json'
      formData: {_csrf:_csrf}
      add: (e,d)->
        d.submit()
      # autoUpload: true
      progressall: (e, data) ->
        progress = parseInt(data.loaded / data.total * 100, 10)
        $('#progress .progress-bar').css 'width', progress + '%'
        return
    ).on('fileuploaddone', (e, data) ->
      if data.result
        detect_face data.result
        destroyCamera()
      return
    )
    $('input[type="file"]').fileupload('add',{files: file})
  resetPicture = ->
    $('#resetPicture,#savePicture').hide()
    $('#takePicture').show()
    animating = true
    vid.play()
  takePicture = ->
    $(@).hide()
    $('#resetPicture,#savePicture').css('display','block')
    animating = false
    vid.pause()
  backtoPicture = ->
    stage.removeChild text_support
    stage.removeChild shape_support
    $('#saveHeadPosition').attr('disabled','disabled')
    bitmap_face.image = null
    stage.removeAllEventListeners 'stagemousedown'
    stage.removeAllEventListeners 'stagemousemove'
    stage.removeAllEventListeners 'stagemouseup'
    changeStatus 1
    container.mask = null
    initCamera()
    $('#resetPicture,#savePicture').hide()
    $('#takePicture').show()
    animating = true
  wait_clm_ready = (c)->
    if typeof(pModel) is 'undefined' or typeof(clm) is 'undefined'
      setTimeout((->
        console.log('wait clm and pmodel script')
        wait_clm_ready(c)
      ),500)
    else
      if typeof c is 'function' then c()
  detect_face = (src) ->
    # if pModel and clm
    # wait_clm_ready ()->
    #   ctrack = new (clm.tracker)(stopOnConvergence: true)
    #   ctrack.init pModel
    if src
      img_face = new Image
      img_face.onload = ->
        changeStatus(2)
        tools_scale.off 'change'
        tools_rotate.off 'change'
        _size = calculateAspectRatioFit(@width, @height, CANVAS_WIDTH, CANVAS_HEIGHT)
        bitmap_face.image = @
        bitmap_face.x =0
        bitmap_face.y =0
        bitmap_face.scaleX = bitmap_face.scaleY = _size.width / @width
        container.rotation = 0
        container.x = container.y = 0
        container.regX = container.regY = 0
        process.drawImage img_face, 0, 0, _size.width, _size.height
        # ctrack.start process.canvas
        HeadPositionEditor()
        createMask()
        #drawLoop()
      img_face.src = site_url+'/'+src
    else
      bitmap_mask.visible = false
      stage.update()
      process.drawImage stage.canvas, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT
      bitmap_mask.visible = true
      stage.update()
      # ctrack.start process.canvas
      img_face = new Image
      img_face.onload = ->
        changeStatus(2)
        _size = calculateAspectRatioFit(@width, @height, CANVAS_WIDTH, CANVAS_HEIGHT)
        bitmap_face.image = @
        bitmap_face.x =0
        bitmap_face.y =0
        bitmap_face.scaleX = bitmap_face.scaleY = _size.width / @width
        container.rotation = 0
        container.x = container.y = 0
        container.regX = container.regY = 0
        # _size = calculateAspectRatioFit(@width, @height, CANVAS_WIDTH, CANVAS_HEIGHT)
        #drawLoop()
        HeadPositionEditor()
        createMask()
        vid.mozSrcObject = ''
        vid.src = ''
      img_face.src = process.canvas.toDataURL()
      # $('#saveHeadPosition').attr('disabled','disabled')
  HeadPositionEditor = ()->
    # if _timer_editor
    #   clearTimeout _timer_editor
    # _timer_editor = setTimeout((->
      # p = ctrack.getCurrentPosition()
    container.addChild bitmap_face
    container.x = 0
    container.y = 0
    # if p
    #   _h1 = if p[20][1] <= p[16][1] then p[20][1] else p[16][1]
    #   _scale =  (p[13][0] - p[1][0]) / (_size.width/img_face.width)
    #   bitmap_face.scaleX = bitmap_face.scaleY = 1
    #   container.x +=  (-p[1][0] / (_size.width / img_face.width))* (CANVAS_WIDTH/2.75) / _scale
    #   container.y +=  (-_h1  / (_size.width / img_face.width))* (CANVAS_WIDTH/2.75) / _scale
    #   container.scaleX = container.scaleY = (CANVAS_WIDTH/2.75) / _scale
    #   local = container.globalToLocal CANVAS_WIDTH/2,CANVAS_HEIGHT/2
    #   container.regX=local.x
    #   container.regY=local.y
    #   container.x=CANVAS_WIDTH/2
    #   container.y=CANVAS_HEIGHT/2
    #   p1 =
    #     x:p[27][0]  #62
    #     y:p[27][1]
    #   p2 =
    #     x:p[32][0]  #7
    #     y:p[32][1]
    #   container.rotation = -angleDeg(p1, p2)
    elipse = new createjs.Shape();
    elipse.graphics.beginFill('black').mt(13.633,54.68)
    .bt(13.633,54.68,33.41,1.0129999999999981,95.688,0.012999999999998124)
    .bt(157.966,-0.9870000000000019,183.63299999999998,56.346,183.966,57.346)
    .bt(184.29900000000004,58.346,193.966,143.68,193.299,168.346)
    .bt(192.632,193.013,187.632,227.013,150.632,247.013)
    .bt(113.632,267.01300000000003,69.3,259.346,56.967,252.68)
    .bt(44.634,246.013,12.634,234.013,0.29999999999999716,177.347)
    .bt(-2.367,157.346,13.633,54.68,13.633,54.68)
    .cp()
    elipse.set(
      x:160
      y:90
    )
    container.mask = elipse
    tools_scale.val(LimitedRange(container.scaleX, 0, 3, 0, 100)).rangeslider('update', true)
    tools_rotate.val(LimitedRange(container.rotation, -90, 90, 0, 100)).rangeslider('update', true)
    if 'oninput' of tools_scale[0]
      tools_scale[0].oninput = onToolsChangeValue
      tools_rotate[0].oninput = onToolsChangeValue
    else
      tools_scale.on 'change',onToolsChangeValue
      tools_rotate.on 'change',onToolsChangeValue
    onMoveChangeValue()
    update = true
    $('#saveHeadPosition').removeAttr('disabled')
    # ), 500)
  backtoHeadPosition = ->
    stage.removeAllEventListeners 'stagemousedown'
    stage.removeAllEventListeners 'stagemousemove'
    stage.removeAllEventListeners 'stagemouseup'
    stage.removeChild container1
    createMask()
    onMoveChangeValue()
    changeStatus 2
  calcDistance = (a,b)->
    return {
      x:a.localToGlobal(0,0).x - b.localToGlobal(0,0).x
      y:a.localToGlobal(0,0).y - b.localToGlobal(0,0).y
    }
  offsetMouth = 12
  drawMouth = (_r)->
    lc1 = calcDistance(bitmap_button1,shape_button1)
    rc1 = calcDistance(shape_button2,bitmap_button1)
    lc2 = calcDistance(bitmap_button2,shape_button1)
    rc2 = calcDistance(shape_button2,bitmap_button2)
    yoffset = Math.max bitmap_button2.y-offsetMouth,shape_button1.y,shape_button2.y
    if _r
      shape_button1.visible = shape_button2.visible = false
      bitmap_button1.visible = bitmap_button2.visible = false
      container1.mask = elipse
      shape_support.graphics.clear().beginFill("#000")
    else
      shape_button1.visible = shape_button2.visible = true
      bitmap_button1.visible = bitmap_button2.visible = true
      container1.mask = null
      shape_support.graphics.clear().setStrokeStyle(2).beginStroke("#598C8B")
    shape_support.y = 0
    shape_support.graphics.mt(shape_button1.x,shape_button1.y)
    .qt(shape_button1.x+lc1.x*.5,bitmap_button1.y,bitmap_button1.x,bitmap_button1.y)
    .qt(shape_button2.x-rc1.x*.5,bitmap_button1.y,shape_button2.x,shape_button2.y)
    .lt(shape_button2.x,yoffset)
    .qt(shape_button2.x-rc2.x*.5,bitmap_button2.y,bitmap_button2.x,bitmap_button2.y)
    .qt(shape_button1.x+lc2.x*.5,bitmap_button2.y,shape_button1.x,yoffset)
    .cp()
    update = true
  previewMouthAnimate = ->
    animating = true
    createjs.Tween.get(control_mouth, {loop: true})
    .to({y: control_mouth.y+20}, 300, createjs.Ease.getPowInOut(4))
    .to({y: control_mouth.y}, 300, createjs.Ease.getPowInOut(2))
    setTimeout((->
      $('#saveMouthPosition').removeAttr('disabled')
      createjs.Tween.removeTweens control_mouth
      control_mouth.y = 0
      animating = false
      # update = true
    ),2000)
    $('#saveMouthPosition').attr('disabled','disabled')
  moveMouthPreview = ->
    containerPreview.removeChild shape_mouth
    drawMouth(true)
    stage.update()
    shape_mouth = shape_support.clone(true)
    shape_mouth.x += CANVAS_WIDTH/2
    shape_mouth.y += CANVAS_HEIGHT/2
    drawMouth()
    stage.update()
    container_mouth.mask = shape_mouth
    containerPreview.addChild shape_mouth
    containerResult.addChild control_mouth
  initMouthPreview = ->
    stagePreview.removeAllChildren()
    # background = new createjs.Shape()
    # background.graphics.f("#d8f2f1").dr(0,0,CANVAS_WIDTH,CANVAS_HEIGHT)
    container1.visible = false
    bitmap_mask.visible = false
    stage.update()
    process.clearRect 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT
    process.drawImage stage.canvas, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT
    container1.visible = true
    bitmap_mask.visible = true
    stage.update()
    img_result = new Image
    img_result.onload = ->
      containerResult.removeAllChildren()
      _bitmap_face = new createjs.Bitmap()
      _bitmap_face.image = @
      _bitmap_face.x =0
      _bitmap_face.y =0
      _bitmap_face.scaleX = _bitmap_face.scaleY = 1
      containerPreview = new createjs.Container()
      containerPreview.rotation = 0
      containerPreview.x = containerPreview.y = 0
      containerPreview.regX = containerPreview.regY = 0
      _elipse = elipse.clone(true)
      drawMouth(true)
      stage.update()
      shape_mouth = shape_support.clone(true)
      shape_mouth.x += CANVAS_WIDTH/2
      shape_mouth.y += CANVAS_HEIGHT/2
      drawMouth()
      stage.update()
      # stagePreview.addChild background
      containerPreview.addChild _bitmap_face
      containerResult.addChild containerPreview
      container_mouth = containerPreview.clone(true)
      container_mouth.x = container_mouth.y = 0
      container_mouth.mask = shape_mouth
      control_mouth = new createjs.Container()
      control_mouth.addChild container_mouth
      control_mouth.x = 0
      control_mouth.y = 0
      control_mouth.regX = control_mouth.regY = 0
      containerPreview.mask = _elipse
      containerPreview.addChild shape_mouth
      containerResult.addChild control_mouth
      stagePreview.addChild containerResult
      # _text = new createjs.Text()
      # _text.text = "Preview"
      # _text.font = "bold 25px Arial"
      # _text.x = CANVAS_WIDTH/2 - 50
      # _text.y = 400
      # _text.textBaseline = "alphabetic"
      # stagePreview.addChild _text
    img_result.src = process.canvas.toDataURL()
  MouthPositionEditor = ->
    shape_support.graphics.clear().setStrokeStyle(2).beginStroke("#598C8B").mt(0,0).qt(25,13,50,0).lt(50,15).qt(25,28,0,15).cp()
    # container1.addChild shape_support
    shape_button1.graphics.clear().beginFill('#DF8C17').mt(-10,-14).lt(10,0).lt(-10,14).cp()
    shape_button2.graphics.clear().beginFill('#DF8C17').mt(10,-14).lt(-10,0).lt(10,14).cp()
    img_btn = new Image
    img_btn.onload = ->
      bitmap_button1.image = @
      bitmap_button2.image = @
      bitmap_button1.regX = @.width/2
      bitmap_button1.regY = @.height/2
      bitmap_button2.regX = @.width/2
      bitmap_button2.regY = @.height/2
      container1.addChild bitmap_button1
      container1.addChild bitmap_button2
      bitmap_button1.set {x:0,y:35,scaleX:1.5,scaleY:1.5}
      bitmap_button2.set {x:0,y:65,scaleX:1.5,scaleY:1.5}
      stage.update()
      # moveObject(shape_button1)
      # moveObject(shape_button2)
      # moveObject(bitmap_button1)
      # moveObject(bitmap_button2)

      stage.addEventListener 'stagemousedown', (e) ->
        #BUG TOUCH AND MOUSE POSITION CAN BE FIXED BY SPARATE THE DOCUMENT TOP BETWEEN 0 AND document.body.scrollTop
        isTouch = if e.nativeEvent.type is 'touchstart' then true else false
        documentTop = if isTouch then document.body.scrollTop else 0
        documentLeft = if isTouch then document.body.scrollLeft else 0
        # $('h1').html(e.stageX+','+e.stageY+'\n'+stage.mouseX+','+stage.mouseY)
        offset =
          x: stage.mouseX+documentLeft
          y: stage.mouseY+documentTop
        shape_button1.offset =
          x: shape_button1.x - (stage.mouseX+documentLeft)
          y: shape_button1.y - (stage.mouseY+documentTop)
        shape_button2.offset =
          x: shape_button2.x - (stage.mouseX+documentLeft)
          y: shape_button2.y - (stage.mouseY+documentTop)
        bitmap_button1.offset =
          x: bitmap_button1.x - (stage.mouseX+documentLeft)
          y: bitmap_button1.y - (stage.mouseY+documentTop)
        bitmap_button2.offset =
          x: bitmap_button2.x - (stage.mouseX+documentLeft)
          y: bitmap_button2.y - (stage.mouseY+documentTop)
        shape_button1.pos = shape_button1.globalToLocal(offset.x, offset.y)
        shape_button2.pos = shape_button2.globalToLocal(offset.x, offset.y)
        bitmap_button1.pos = bitmap_button1.globalToLocal(offset.x, offset.y)
        bitmap_button2.pos = bitmap_button2.globalToLocal(offset.x, offset.y)
        stage.addEventListener 'stagemousemove', (evt) ->
          documentTop = if isTouch then document.body.scrollTop else 0
          documentLeft = if isTouch then document.body.scrollLeft else 0
          if shape_button1.hitTest(shape_button1.pos.x,shape_button1.pos.y)
            shape_button1.x = Math.max Math.min(stage.mouseX + documentLeft + shape_button1.offset.x,bitmap_button1.x,bitmap_button2.x),-95
            shape_button1.y = Math.max Math.min(stage.mouseY + documentTop + shape_button1.offset.y,95),-60
          else if shape_button2.hitTest(shape_button2.pos.x,shape_button2.pos.y)
            shape_button2.x = Math.min Math.max(stage.mouseX + documentLeft + shape_button2.offset.x,bitmap_button1.x,bitmap_button2.x),95
            shape_button2.y = Math.max Math.min(stage.mouseY + documentTop + shape_button2.offset.y,95),-60
          else if bitmap_button1.hitTest(bitmap_button1.pos.x,bitmap_button1.pos.y)
            bitmap_button1.x = Math.max Math.min(stage.mouseX + documentLeft + bitmap_button1.offset.x,shape_button2.x),shape_button1.x
            bitmap_button1.y = Math.max Math.min(stage.mouseY + documentTop + bitmap_button1.offset.y,bitmap_button2.y),-60
          else if bitmap_button2.hitTest(bitmap_button2.pos.x,bitmap_button2.pos.y)
            bitmap_button2.x = Math.max Math.min(stage.mouseX + documentLeft + bitmap_button2.offset.x,shape_button2.x),shape_button1.x
            bitmap_button2.y = Math.max Math.min(stage.mouseY + documentTop + bitmap_button2.offset.y,95),bitmap_button1.y
          drawMouth()
          update = true
        stage.addEventListener 'stagemouseup', ->
          moveMouthPreview()
          stage.removeAllEventListeners 'stagemousemove'
      drawMouth()
      initMouthPreview()
    # img_btn.src = url_button
    # container1.addChild shape_button1
    # container1.addChild shape_button2
    # shape_button1.set {x:-46,y:22,regX:8,scaleX:1.5,scaleY:1.5}
    # shape_button2.set {x:46,y:22,regX:-8,scaleX:1.5,scaleY:1.5}
    stage.addChild container1
    drawMouth()
    initMouthPreview()
    update = true
  saveMouthPosition = ->
    stage.removeChild container1
    # save to database
    container_mouth.visible = false
    stagePreview.update()
    process.clearRect 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT
    process.drawImage stagePreview.canvas, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT
    mask_ctx = $('<canvas>')[0].getContext('2d')
    mask_ctx.canvas.width = CANVAS_WIDTH
    mask_ctx.canvas.height = CANVAS_HEIGHT
    mask_trans = new Image()
    mask_trans.onload = ()->
      mask_ctx.drawImage this,0,0
      base_pixels = process.getImageData 0,0,CANVAS_WIDTH,CANVAS_HEIGHT
      mask_pixels = mask_ctx.getImageData 0,0,CANVAS_WIDTH,CANVAS_HEIGHT
      y = 1
      while y < CANVAS_HEIGHT - 1
        x = 1
        while x < CANVAS_WIDTH - 1
          p = (y * CANVAS_WIDTH + x) * 4
          base_pixels.data[p + 3] = mask_pixels.data[p + 3]
          x++
        y++
      process.putImageData(base_pixels, 0, 0);
      stagePreview.update()
      _img1 = process.canvas.toDataURL()
      container_mouth.visible = true
      containerPreview.visible = false
      stagePreview.update()
      process.clearRect 0,0,CANVAS_WIDTH,CANVAS_HEIGHT
      process.drawImage stagePreview.canvas,0,0,CANVAS_WIDTH,CANVAS_HEIGHT
      _img2 = process.canvas.toDataURL()
      container_mouth.visible = true
      containerPreview.visible = true
      stagePreview.update()
      # POST SAVE EXPERIMENT
      # req.body.gender = 'male'
      # req.body.faceimage = base64 image encoded
      # req.body.mouthimage = base64 image encoded
      changeStatus 4

    mask_trans.src = site_url+'/video/images/face-'+gender+'.png'
  backtoCreateNew = ->
    bitmap_mask.visible = false
    stage.removeChild text_support
    stage.removeChild shape_support
    bitmap_face.image = null
    choosenvideo = -1
    choosenaccessories = -1
    $('#gender .active').removeClass 'active'
    gender = ''
    changeStatus 0
  ContinueToNextStage = ->
    changeStatus 5
    initChooseVideo(gender)
  backtoComplete = ->
    $('#chooseVideo video.active').removeClass 'active'
    changeStatus 4
  saveChooseVideo = ->
    if $('#chooseVideo video.active').length is 1
      choosenvideo = $('#chooseVideo video').index($('#chooseVideo video.active'))
      name_video_male = ['India_Cowok_01_scaled','Coachella CO Rev_scaled','HipHop CO rev 2_scaled','Jepang CO_scaled']
      name_video_female = ['India_Cewek_01_scaled','Coachella CE Rev_scaled','Hiphop CE rev 2_scaled','Jepang CE_scaled']
      name_video = if gender == 'male' then name_video_male else name_video_female
      ga('send', 'event', 'pilih', 'Video', name_video[choosenvideo])
      changeStatus 6
      initAccessories()
  saveChooseAccessories = ->
    # if $('#chooseAccessories canvas.active').length is 1
    choosenaccessories = $('#chooseAccessories canvas').index($('#chooseAccessories canvas.active'))
    _effect = ['confetti','confetti2','plasma','fireworks']
    ga('send', 'event', 'pilih', 'Aksesoris', _effect[choosenaccessories])
    destroyAccessories()
    $.ajax
      url: site_url+'/experiment/save'
      data: {gender:gender,video:choosenvideo,accessories:choosenaccessories,faceimage:_img1,mouthimage:_img2,_csrf:_csrf}
      type: 'POST'
      dataType: 'JSON'
      success: (e)->
        _id_exp = e.id
        url_result.id = e.id
        url_result.face = site_url+'/'+e.face
        url_result.mouth = site_url+'/'+e.mouth
        changeStatus 7
        $('#form-share #tw-text-remain').html(" <span>"+(_maxQuote - $('#form-share #text-share').val().length)+"</span>characters left")
        $('#form-share #text-share').off('keypress').on('keypress',onKeypressQuote)
        $('#form-share #text-share').off('keyup').on('keyup',onKeypressQuote)
        initRender(
          gender: gender
          video:choosenvideo
          accessories:choosenaccessories
          resource:url_result
          ,tw_btn
        )
      error: (e)->
        console.log(e)
  onKeypressQuote = (e)->
    $('#form-share #tw-text-remain').html(" <span>"+(_maxQuote - $('#form-share #text-share').val().length)+"</span>characters left")
    if $('#form-share #text-share').val().length >= _maxQuote
      e.preventDefault()
      return false
  backtoChooseVideo = ->
    changeStatus 5
  createMask = (blank)->
    if _timer
      clearTimeout _timer
    _timer = setTimeout((->
      img_mask = new Image
      img_mask.onload = ->
        bitmap_mask.image = @
        bitmap_mask.visible = true
        if !blank
          text_support.text = "Eye line"
          text_support.font = "bold 25px Arial"
          text_support.x = 7
          text_support.y = 240
          text_support.textBaseline = "alphabetic"
          stage.addChild text_support
          shape_support.graphics.clear().beginFill('#DF8C17').mt(117,220).lt(137,232).lt(117,244).cp()
          shape_support.graphics.beginFill('#DF8C17').mt(375,232).lt(395,220).lt(395,244).cp()
          shape_support.graphics.setStrokeDash([20,10]).setStrokeStyle(6).beginStroke("#598C8B").mt(145,232).lineTo(368,232)
          shape_support.y = -27
          stage.addChild shape_support
        update = true
        return
      img_mask.src = url_mask
      return
    ),500)
  saveTextMessageVideo = ()->
    _textMessage = $('#form-share #text-share').val()
    setMessageVideo(_textMessage)
    $.ajax
      url: site_url+'/experiment/saveMessage'
      data: {id:_id_exp,message:_textMessage,_csrf:_csrf}
      type: 'POST'
      dataType: 'JSON'
      success: (e)->
        changeStatus 8
        _href =  site_url+'/experiment/'+_id_exp
        window.history.pushState({},$('title').text(), _href)
      error: (e)->
        console.log(e)
  skipTextMessageVideo = ()->
    _textMessage = ''
    setMessageVideo(_textMessage)
    changeStatus 8
    _href =  site_url+'/experiment/'+_id_exp
    window.history.pushState({},$('title').text(), _href)
  onMoveChangeValue = ()->
    stage.addEventListener 'stagemousedown', (e) ->
      bitmap_mask.alpha = 0.4
      container.mask = null
      update = true
      offset =
        x: container.x - (e.stageX)
        y: container.y - (e.stageY)
      stage.addEventListener 'stagemousemove', (ev) ->
        container.x = ev.stageX + offset.x
        container.y = ev.stageY + offset.y
        update = true
        return
      stage.addEventListener 'stagemouseup', ->
        bitmap_mask.alpha = 1
        container.mask = elipse
        local = container.globalToLocal CANVAS_WIDTH/2,CANVAS_HEIGHT/2
        container.regX=local.x
        container.regY=local.y
        container.x=CANVAS_WIDTH/2
        container.y=CANVAS_HEIGHT/2
        update = true
        stage.removeAllEventListeners 'stagemousemove'
        return
      return
  onToolsChangeValue = (e)->
    if this.id is 'scale'
      container.scaleX = container.scaleY = LimitedRange($(this).val(), 0, 100, 0, 3)
      update = true
    if this.id is 'rotate'
      container.rotation = LimitedRange($(this).val(), 0, 100, -90, 90)
      update = true
  changeStatus=(e)->
    $('#step').html(step[e]).parents('.wrapper-frames').attr('class','wrapper-frames').addClass(step_class[e])
    $('#gender,#source,#tools,#panels,#text,#content,#preview,#chooseVideo,#chooseAccessories,#render').hide()
    $('#backtoGender,#backtoPicture,#backtoHeadPosition,#backtoCreateNew,#backtoComplete,#backtoChooseVideo').hide()
    $('#saveGender,#savePicture,#saveHeadPosition,#saveMouthPosition,#continue,#saveChooseVideo,#saveChooseAccessories').hide()
    $('#result').hide()
    #['select gender','upload', 'head position', 'mouth position', 'complete', 'choose video', 'choose accessories', 'addquote', 'share']
    switch e
      when 0
        $('#gender').show()
        $('#saveGender').show()
      when 1
        $('#source').show()
        $('#backtoGender').show()
        $('#result').show()
      when 2
        $('#tools').show()
        $('#saveHeadPosition').show()
        $('#backtoPicture').show()
        $('#result').show()
      when 3
        $('#panels').show()
        $('#preview').css('display','inline')
        $('#saveMouthPosition').show()
        $('#backtoHeadPosition').show()
        $('#result').show()
      when 4
        $('#backtoCreateNew').show()
        $('#continue').show()
        $('#result').show()
        $('#text').show()
      when 5
        $('#chooseVideo').show()
        $('#backtoComplete').show()
        $('#saveChooseVideo').show()
      when 6
        $('#chooseAccessories').show()
        $('#backtoChooseVideo').show()
        $('#saveChooseAccessories').show()
      when 7
        $('#render').show()
        $('#render #form-share').show()
      when 8
        $('#render').show()
        $('#render #form-share').hide()

      # when 7 # RENDERING / AJAX REQUEST HEAD & MOUTH POSITION BY CURRENT DURATION
      # when 8 # PLAY VIDEO WHEN READY AND SHOW THE SHARE AND DOWNLOAD BUTTON
  cleanUp = ->
    ctrack = null
    pModel = null
    clm = null
    createjs.Ticker.removeAllEventListeners()
    stage.removeAllChildren()
    stage = null
    stagePreview.removeAllChildren()
    stagePreview = null
    p = null
  if _data
    changeStatus 8
    # write
    cleanUp();
    # console.log(_data)
    if _data.fileReady is 'true'
      showVideo(
        user: _data.user
        gender:_data.options.gender
        video:_data.options.video
        message:_data.options.message
        accessories:_data.options.accessories
        resource:
          id:_data._id
        src:site_url+'/userfiles/'+_data.user+'/'+_data._id+'.mp4'
      )
    else
      url_result.id = _data._id
      url_result.face = site_url+'/userfiles/'+_data.user+'/face-'+_data._id+'.png'
      url_result.mouth = site_url+'/userfiles/'+_data.user+'/mouth-'+_data._id+'.png'
      initRender(
        user: _data.user
        gender:_data.options.gender
        video:_data.options.video
        message:_data.options.message
        accessories:_data.options.accessories
        resource:url_result
      )
  else
    changeStatus 0
  # EVENT HANDLER
  $('#selectFemale,#selectMale').on 'click',selectGender
  $('#saveGender').on 'click',saveGender
  $('#backtoGender').on 'click',backtoGender
  $('#resetPicture').on 'click',resetPicture
  $('#takePicture').on 'click',takePicture
  $('#savePicture').on 'click',savePicture
  $('#backtoPicture').on 'click',backtoPicture
  $('#saveHeadPosition').on 'click',()->
    stage.removeAllEventListeners 'stagemousedown'
    stage.removeAllEventListeners 'stagemousemove'
    stage.removeAllEventListeners 'stagemouseup'
    changeStatus(3)
    stage.removeChild text_support
    stage.removeChild shape_support
    update = true
    MouthPositionEditor()
  $('#backtoHeadPosition').on 'click',backtoHeadPosition
  # $('#previewMouthPosition').on 'click',previewMouthAnimate
  $('#saveMouthPosition').on 'click',saveMouthPosition
  $('#backtoCreateNew').on 'click',backtoCreateNew
  $('#continue').on 'click',ContinueToNextStage
  $('#backtoComplete').on 'click',backtoComplete
  $('#saveChooseVideo').on 'click',saveChooseVideo
  $('#saveChooseAccessories').on 'click',saveChooseAccessories
  $('#backtoChooseVideo').on 'click',backtoChooseVideo
  # a#skip-share(href='javascript:void(0);') skip
  # a#submit-share.button(href="javascript:void(0);") done
  $('#submit-share').on 'click',saveTextMessageVideo
  $('#skip-share').on 'click',skipTextMessageVideo
  # document.addEventListener 'clmtrackrNotFound', ((event) ->
  #   ctrack.stop()
  #   console.log 'clmtrackrNotFound'
  #   HeadPositionEditor()
  #   createMask()
  #   return
  #   ), false
  # document.addEventListener 'clmtrackrLost', ((event) ->
  #   ctrack.stop()
  #   console.log 'clmtrackrLost'
  #   HeadPositionEditor()
  #   createMask()
  #   return
  #   ), false
  # document.addEventListener 'clmtrackrConverged', ((event) ->
  #   # cancelAnimationFrame drawRequest
  #   console.log 'clmtrackrConverged'
  #   HeadPositionEditor()
  #   createMask()
  #   return
  #   ), false
  # document.addEventListener 'clmtrackrIteration', ((event) ->
  #    stats.update()
  #   return
  #   ), false
  _getUserMedia = if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) then navigator.mediaDevices else ( if (navigator.mozGetUserMedia || navigator.webkitGetUserMedia) then {
    getUserMedia: (c)->
      return new Promise (y, n)->
        (navigator.mozGetUserMedia || navigator.webkitGetUserMedia).call(navigator, c, y, n)
  } else null)
  # navigator.getUserMedia = navigator.getUserMedia or navigator.webkitGetUserMedia or navigator.mediaDevices.getUserMedia or navigator.msGetUserMedia
  window.URL = window.URL or window.webkitURL or window.msURL or window.mozURL
  _cameraStream = null
  initCamera = ->
    if _getUserMedia
      # videoSelector = video: true
      # if window.navigator.appVersion.match(/Chrome\/(.*?) /)
      #   chromeVersion = parseInt(window.navigator.appVersion.match(/Chrome\/(\d+)\./)[1], 10)
      #   if chromeVersion < 20
      #     videoSelector = 'video'
      _getUserMedia.getUserMedia({
        # "audio": false,
        "video": true
      }).then((stream)->
        _cameraStream = stream
        vid.onloadedmetadata = ->
          vid.play()
          bitmap_face.x = bitmap_face.y = 0
          _size = calculateAspectRatioFit(@width, @height, CANVAS_WIDTH, CANVAS_HEIGHT)
          bitmap_face.image = @
          bitmap_face.x =0
          bitmap_face.y =0
          bitmap_face.scaleX = bitmap_face.scaleY = _size.width / @width
          # bitmap_face.scaleX *= -1
          container.rotation = 0
          container.x = container.y = 0
          container.regX = container.regY = 0
          # bitmap_face.x += if CANVAS_WIDTH - _size.width > 0 then CANVAS_WIDTH-(CANVAS_WIDTH-_size.width)/2 else _size.width
          # bitmap_face.y += if CANVAS_HEIGHT - _size.height > 0 then (CANVAS_HEIGHT-_size.height)/2 else 0
          animating = true
        vid.src = window.URL.createObjectURL(stream) || stream
        bitmap_face.image = vid
      ).catch ->
        $('#takePicture,#source .or').hide()
    else
      $('#takePicture,#source .or').hide()
  destroyCamera = ->
    _cameraStream
    if _getUserMedia
      if _cameraStream
        if _cameraStream.getVideoTracks
          tracks = _cameraStream.getVideoTracks();
          if tracks && tracks[0] && tracks[0].stop then tracks[0].stop()
        else if _cameraStream.stop
          _cameraStream.stop()
      # delete _cameraStream
      # delete vid
      # @_getUserMedia videoSelector, ((stream) ->
      # 	stream.getVideoTracks().forEach (track)->
      # 		track.stop()
      if vid.mozCaptureStream
        vid.mozSrcObject = null
      else
        vid.src = ""
      # @webcam.hide()

      # videoSelector = video: true
      # if window.navigator.appVersion.match(/Chrome\/(.*?) /)
      #   chromeVersion = parseInt(window.navigator.appVersion.match(/Chrome\/(\d+)\./)[1], 10)
      #   if chromeVersion < 20
      #     videoSelector = 'video'
      # navigator.getUserMedia videoSelector, ((stream) ->
      #   stream.getVideoTracks().forEach (track)->
      #     track.stop()
      #   if vid.mozCaptureStream
      #     vid.mozSrcObject = null
      #   else
      #     vid.src = ''
      # ), ->
      #   $('#takePicture').hide()

        # if supports_video()
        #   #if supports_h264_baseline_video()
        #   vid.src =  '../videos/20160622_170815.mp4' #'../videos/cap13_edit.mp4'
        #   bitmap_face.image = vid
        #   vid.addEventListener 'canplay', (->
        #     vid.play()
        #     bitmap_face.x = bitmap_face.y = 0
        #     _size = calculateAspectRatioFit(vid.videoWidth, vid.videoHeight, CANVAS_WIDTH, CANVAS_HEIGHT)
        #     bitmap_face.scaleX = bitmap_face.scaleY = _size.width / vid.videoWidth
        #     bitmap_face.scaleX *= -1
        #     bitmap_face.x += if CANVAS_WIDTH - _size.width > 0 then CANVAS_WIDTH-(CANVAS_WIDTH-_size.width)/2 else _size.width
        #     bitmap_face.y += if CANVAS_HEIGHT - _size.height > 0 then (CANVAS_HEIGHT-_size.height)/2 else 0
        #     animating = true
        #   ), false
# ---
# generated by js2coffee 2.2.0
