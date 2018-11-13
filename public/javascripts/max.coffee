# ----------------------------
# max.coffee
# ----------------------------
# - choose accessories
# - choose video
# - get json data
# - sync timeline animation with video
# - animation head & mouth
# ----------------------------
# PUBLIC VARIABLE
initChooseVideo = undefined
initAccessories = undefined
showVideo = undefined
initRender = undefined
setMessageVideo = undefined
destroyAccessories = undefined
tw_btn = undefined
$ ->
  'use strict'
  PLAYER_WIDTH = 720#480#720 #368
  PLAYER_HEIGHT = 405#272#405 #246
  video_ext = ['mp4']
  url_video_male = [site_url+'/video/India_Cowok_01_scaled',site_url+'/video/Coachella CO Rev_scaled',site_url+'/video/HipHop CO rev 2_scaled',site_url+'/video/Jepang CO_scaled']
  url_video_female = [site_url+'/video/India_Cewek_01_scaled',site_url+'/video/Coachella CE Rev_scaled',site_url+'/video/Hiphop CE rev 2_scaled',site_url+'/video/Jepang CE_scaled']
  list_effect = ['confetti','confetti2','plasma','fireworks']
  option = {}
  timepass = []
  timeline = []
  data = []
  player = undefined
  overlay = undefined
  stageOverlay = undefined
  head = undefined
  face = undefined
  mouth = undefined
  message = undefined
  size = 0
  offset = undefined
  t_player = undefined
  t_acc = undefined
  _scale = 0
  _fps = 0
  fb_quote = _fb_text
  initChooseVideo = (e)->
    $('#chooseVideo').html('')
    _url = if e == 'male' then url_video_male else url_video_female
    for h in _url
      _vid = $('<video>')
      _div = $('<div class="box">')
      _div.append($('<i class="active">'))
      _div.append(_vid)
      $('#chooseVideo').append(_div)
      _vid.attr('poster',h+'.png')
      for j in video_ext
        if j is 'mp4' and supports_h264_baseline_video()
          if _vid.src is '' then _vid.src = h+'.'+j
          $(_vid).append $('<source>').attr
            src:h+'.'+j
            type:'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'
        else if j is 'webm' and supports_webm_video()
          if _vid.src is '' then _vid.src = h+'.'+j
          $(_vid).append $('<source>').attr
            src:h+'.'+j
            type:'video/webm; codecs="vp8.0, vorbis"'
        else if j is 'ogv' and supports_ogg_theora_video()
          if _vid.src is '' then _vid.src = h+'.'+j
          $(_vid).append $('<source>').attr
            src:h+'.'+j
            type:'video/ogg; codecs="theora, vorbis"'
        $(_vid).on 'timeupdate',->
          if @.currentTime > 2
            @.currentTime = 0
            # @.pause()
    # $('#chooseVideo video').each ->
    #   # reset
    #   $(@).removeAttr('src')
    #   $(@).find('source').remove()
    #   i = $('#chooseVideo video').index(@)
    $('#chooseVideo video').off('mouseenter').on 'mouseenter',->
      if @.currentTime < 2
        @.play()
    .off('mouseleave').on 'mouseleave',->
      @.pause()
    .off('click').on 'click',->
      if $('#chooseVideo video.active').length>0
        $('#chooseVideo i.active.show').removeClass 'show'
        $('#chooseVideo video.active').removeClass 'active'

      $(@).addClass 'active'
      $(@).siblings('i.active').addClass 'show'
      $('#chooseVideo video').each ->
        @.pause()
      # @.play()
  effect = []
  destroyAccessories = ->
    if(effect.length > 0)
      for i in effect
        i.stop()
      effect = []
    $('#chooseAccessories').html('')
  initAccessories = ->
    destroyAccessories()
    for i in list_effect
      $('#chooseAccessories').append($('<div class="box"><img src="'+site_url+'/video/accessories/'+i+'.png"/><i class="active"></i><canvas id="'+i+'"></canvas></div>'))
      $('#chooseAccessories canvas').attr
        width:$('#chooseAccessories canvas').width()
        height:$('#chooseAccessories canvas').height()
      if i is 'confetti'
        effect.push(init_conetti())
      else if i is 'confetti2'
        effect.push(init_conetti2())
      else if i is 'plasma'
        effect.push(init_plasma(true))
      else if i is 'fireworks'
        effect.push(init_firework())
    $('#chooseAccessories .box').off('mouseenter').on 'mouseenter',->
      $(@).find('img').hide()
      _id = $('#chooseAccessories .box').index(@)
      effect[_id].start()
    .off('mouseleave').on 'mouseleave',->
      $(@).find('img').show()
      _id = $('#chooseAccessories .box').index(@)
      effect[_id].stop()
    .off('click').on 'click',->
      if $('#chooseAccessories canvas.active').length>0
        if  $('#chooseAccessories canvas.active')[0] != $(@).find('canvas')[0]
          $('#chooseAccessories i.active.show').removeClass 'show'
          $('#chooseAccessories canvas.active').removeClass 'active'
          $(@).find('canvas').addClass 'active'
          $(@).find('i.active').addClass 'show'
        else
          $('#chooseAccessories i.active.show').removeClass 'show'
          $('#chooseAccessories canvas.active').removeClass 'active'
      else
        $(@).find('canvas').addClass 'active'
        $(@).find('i.active').addClass 'show'
      $('#chooseAccessories .box').each ->
        for i in effect
          i.stop()
      _id = $('#chooseAccessories .box').index(@)
      effect[_id].start()
  wrapText = (t,c,x,y,w,lh)->
    _sc = $('#render #player').width()/PLAYER_WIDTH
    message.text = t
    message.font = (30*_sc)+'px Arial'
    message.color = c
    message.x = x*_sc
    message.y = y*_sc
    message.lineWidth = w*_sc
    message.lineHeight = lh*_sc
    message.visible = true
    stageOverlay.update()
  frameSkip = (c)->
    if typeof timeline[1] isnt 'undefined'
      if player.currentTime > timeline[1]
        timepass.push(timeline.splice(0,1))
        return frameSkip(c)
    c()
  onTimeUpdate = ()->
    # player.currentTime;
    # timeline = _time;
    # data = _data;
    # stage.addChild(circle);
    if timeline.length>0
      thisLoop = new Date
      fps = Math.round(1000 / (thisLoop - _fps))
      _fps = thisLoop
      # $('.left #test').text('C: current:'+fps+'fps')

      frameSkip ->
        if player.currentTime > timeline[0]
          timepass.push(timeline.splice(0,1))
          i = timepass.length-1
          _sc = $('#render #player').width()/PLAYER_WIDTH
          if data[i]
            # if option.gender is 'male'
            #   _s = data[i].w / 160 #193 175
            # else
            _s = (data[i].w / 165)*_sc#155 #188 180
            # console.log data[i].w/155,data[i].w/188 #193
            head.scaleX = head.scaleY = _s
            # $('.left #test').text(_s+' :::: '+_sc)
            mouth.y = data[i].m #* _s
            halfx = 180/2 # if option.gender is 'male' then 179/2 else 180/2 #188/2 else 193/2
            halfy = 260/2 # if option.gender is 'male' then 227/2 else 260/2 #227/2 else 260/2
            head.x = (data[i].x*_sc) + halfx * _s
            head.y = (data[i].y*_sc) - ( 60 * _s) + halfy * _s
            head.rotation = -data[i].r
            head.regX=256# * _scale # local.x # 93
            head.regY=256# * _scale #local.y # 118
            head.visible = true
            stageOverlay.update()
          else
            head.visible = false
            stageOverlay.update()
          # url_video_male = [India_Cowok_01_scaled',Coachella CO Rev_scaled',HipHop CO rev 2_scaled',Jepang CO_scaled']
          # url_video_female = [India_Cewek_01_scaled',Coachella CE Rev_scaled',Hiphop CE rev 2_scaled',Jepang CE_scaled']

          if i >= 950 and option.gender == 'female' and option.video == '1' #'Coachella CE Rev_scaled'
            wrapText option.message, '#ffa', 92, 94, 480, 45
          else if i >= 940 and option.gender == 'male' and option.video == '1' #'Coachella CO Rev_scaled'
            wrapText option.message, '#ffa', 100, 93, 484, 45
          else if i >= 982 and option.gender == 'female' and option.video == '2' #'Hiphop CE rev 2_scaled'
            wrapText option.message, '#ffa', 100, 95, 512, 45
          else if i >= 980 and option.gender == 'male' and option.video == '2' #'HipHop CO rev 2_scaled'
            wrapText option.message, '#ffa', 100, 95, 512, 45
          else if i >= 1025 and option.gender == 'female' and option.video == '0' #'India_Cewek_01_scaled'
            wrapText option.message, '#ffa', 131, 104, 420, 45
          else if i >= 1048 and option.gender == 'male' and option.video == '0' #'India_Cowok_01_scaled'
            wrapText option.message, '#ffa', 111, 104, 503, 45
          else if i >= 1114 and option.gender == 'female' and option.video == '3' #'Jepang CE_scaled'
            wrapText option.message, '#ffa', 105, 98, 495, 45
          else if i >= 1110 and option.gender == 'male' and option.video == '3' #'India_Cewek_01_scaled'
            wrapText option.message, '#ffa', 105, 98, 495, 45
          else
            message.visible = false
            stageOverlay.update()
  endedVideo = ()->
    $('#render i.played').show()
    if t_acc then t_acc.stop()
    if t_player
      t_player.pause()
      timeline = timepass.concat(timeline)
      timepass = []
    console.log 'ended'
    # $('#render #overlay').trigger 'click'
    # SHOW THE SHARE FEATURE
  showVideo = (opt)->
    if opt
      option = opt
    _src = option.src
    $('#render #player').remove()
    $('#render .left').append($('<video id="player">'))
    player = $('#render #player').get(0)
    player.width = $('#render #player').width()#PLAYER_WIDTH
    player.height = $('#render #player').height()#PLAYER_HEIGHT
    if player.src is '' then player.src = _src
    $(player).append $('<source>').attr
      src:_src
      type:'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'
    player.addEventListener('ended',endedVideo,false);
    player.loop = false;
    player.controls = false;
    $('#render i.played').show()
    $('#render canvas, #render i.played').off('click').on 'click',()->
      if player.paused
        player.play()
        $('#render i.played').hide()
        # t_player.start()
        # if t_acc then t_acc.start()
      else
        player.pause()
        $('#render i.played').show()
        # t_player.pause()
        # if t_acc then t_acc.stop()
  initRender = (opt,c)->
    option = opt
    # option.gender = 'female' #test
    # option.video = 2
    _url = if option.gender == 'male' then url_video_male else url_video_female
    if _url[option.video]
      $('#render #player').remove()
      $('#render .left').append($('<video id="player">'))
      name = /([^\/]+)(?=\w*$)/ig.exec(_url[option.video])
      player = $('#render #player').get(0)
      player.width = $('#render #player').width()#PLAYER_WIDTH
      player.height = $('#render #player').height()#PLAYER_HEIGHT
      h = _url[option.video]
      if isMobile.any
        h = h.replace('_scaled','_small')
      for j in video_ext
        if j is 'mp4' and supports_h264_baseline_video()
          if player.src is '' then player.src = h+'.'+j
          $(player).append $('<source>').attr
            src:h+'.'+j
            type:'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'
        else if j is 'webm' and supports_webm_video()
          if player.src is '' then player.src = h+'.'+j
          $(player).append $('<source>').attr
            src:h+'.'+j
            type:'video/webm; codecs="vp8.0, vorbis"'
        else if j is 'ogv' and supports_ogg_theora_video()
          if player.src is '' then player.src = h+'.'+j
          $(player).append $('<source>').attr
            src:h+'.'+j
            type:'video/ogg; codecs="theora, vorbis"'
      # v.addEventListener('progress',onProgress,false);
      # v.addEventListener('loadstart',loadeddata,false);
      # v.addEventListener('loadeddata',loadeddata,false);
      # player.addEventListener('timeupdate',onTimeUpdate,false);
      # t_player = new FpsCtrl(30, onTimeUpdate) # deactive mode canvas
      player.addEventListener('ended',endedVideo,false);
      player.loop = false;
      player.controls = false;
      # player.preload = 'none';
      # $.ajax
      #   url: site_url+'/json/'+name[0]+'.json'
      #   type: 'GET'
      #   dataType: 'JSON'
      #   success: (e)->
      #     $.ajax
      #       url: site_url+'/json/result/'+name[0]+'.json'
      #       type: 'GET'
      #       dataType: 'JSON'
      #       success: (d)->
      #         render(e,d)
      #       error: (e)->
      #         console.log(e)
      #   error: (e)->
      #     console.log(e)
      if typeof(c)=='function' then c()
      # fb_quote = _tw_text+' '+site_url+'/experiment/'+option.resource.id
      tw_btn()
  render = (_time,_data)-> # deactive canvas mode
    timeline = _time
    data = _data
    if timeline.length is 0 or data.length is 0 then return alert('no data/timeline');
    # alert $('#render #player').attr('src')+''+$('#render #player').width()+'x'+$('#render #player').height()
    $('#render #overlay').attr
      width:$('#render #player').width()#PLAYER_WIDTH
      height:$('#render #player').height()#PLAYER_HEIGHT
    stageOverlay = new createjs.Stage 'overlay'
    #createjs.Ticker.addEventListener "tick",()->
    #  stageOverlay.update()
    head = new createjs.Container()
    message = new createjs.Text
    face = new createjs.Bitmap
    mouth = new createjs.Bitmap option.resource.mouth
    _img = new Image()
    _img.onload = ->
      offset = if option.gender is 'male' then {x:160,y:120} else {x:160,y:90}
      size = calculateAspectRatioFit(@width, @height, PLAYER_WIDTH, PLAYER_HEIGHT)
      _scale = size.width / @width
      face.image = @
      face.scaleX = mouth.scaleX = face.scaleY = mouth.scaleY = 1
      face.cache(0, 0, @width, @height)
      mouth.cache(0, 0, @width, @height)
      # face.cache(161, 89, 189, 263)
      # mouth.cache(161, 89, 189, 263)
      head.addChild face
      head.addChild mouth
      # head.visible = false
      stageOverlay.addChild head
      stageOverlay.addChild message
      _s = 1
      if data.length > 0
        if data[0]
          if option.gender is 'male'
            _s = data[0].w / 193 #193 175
          else
            _s = data[0].w / 188 #188 180

          head.scaleX = head.scaleY = _s
          # console.log _s
          # mouth.y = data[0].m #* _s
          halfx = if option.gender is 'male' then 188/2 else 193/2
          halfy = if option.gender is 'male' then 227/2 else 260/2
          head.x = data[0].x + halfx * _s
          head.y = data[0].y - ( 40 * _s) + halfy * _s
          head.rotation = -data[0].r
          head.regX=256# * _scale # local.x # 93
          head.regY=256# * _scale #local.y # 118
          head.visible = true
        else
          head.visible = false
      stageOverlay.update()
    _img.src = option.resource.face
    i = list_effect[option.accessories]
    if i isnt -1
      $('#render .left').append($('<canvas id="'+i+'" width="'+PLAYER_WIDTH+'" height="'+PLAYER_HEIGHT+'">'))
      if i is 'confetti'
        t_acc = init_conetti()
      else if i is 'confetti2'
        t_acc = init_conetti2()
      else if i is 'plasma'
        t_acc = init_plasma(true)
      else if i is 'fireworks'
        t_acc = init_firework()

    #DEBUG
    # $('.left').prepend('<div id="test">')
    # $('.left #test').css({
    #   'z-index': 9999,
    #   'position': 'absolute'
    # })
    # $('#render i.played').hide()
    $('#render canvas, #render i.played').on 'click',()->
      if player.paused
        player.play()
        t_player.start()
        $('#render i.played').hide()
        if t_acc then t_acc.start()
      else
        player.pause()
        t_player.pause()
        $('#render i.played').show()
        if t_acc then t_acc.stop()
  $('#download').on 'click',()->
    ga('send', 'event', 'button', 'click', 'Download')
    _url = if option.gender == 'male' then url_video_male[option.video] else url_video_female[option.video]
    name = /([^\/]+)(?=\w*$)/ig.exec(_url)
    $.ajax
      url:site_url+'/experiment/download'
      type:'POST'
      dataType:'JSON'
      data:
        user: if typeof(option.user) is 'undefined' then '' else option.user,
        socket_id:ioadmin.nsp+'#'+ioadmin.id,
        exp_id:option.resource.id,
        accessories:list_effect[option.accessories],
        gender:option.gender,
        _csrf:_csrf,
        video_id:option.video,
        video_url: _url,
        video_name: name[0],
        message: option.message
      beforeSend:->
        $('.loader').show()
      success:(e)->
        console.log(e)
        if e.success
          if e.success == 'ready to download'
            # return window.location.href = site_url+e.url_video
            $('.loader').hide()
            $.fileDownload site_url+'/force-download',
              httpMethod: "GET",
              data: {url:e.url_video},
              contentType: "video/mp4"
            option.src = site_url+'/'+e.url_video
            showVideo()
      error:(e)->
        console.log(e)
        $('.loader').hide()
  setMessageVideo = (_text)->
    option.message = _text;
    $('#download').trigger('click')
    # $('#render canvas, #render i.played').off('click').on 'click',()->
    #   if player.paused
    #     player.play()
    #     $('#render i.played').hide()
    #   else
    #     player.pause()
    #     $('#render i.played').show()
  # EVENT HANDLER
  tw_btn = ()->
    $('#share-tw').empty()
    # <a rel="nofollow" target="_blank" href="https://twitter.com/intent/tweet?url=http://www.mywebebsite.com/the-url/&amp;text=Blog Title" onclick="javascript:window.open(this.href,
    #   '', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600');return false;">
    #     <i class="icon-twitter"></i> Share on Twitter
    #   </a>
    _url_share = site_url+'/experiment/'+ if typeof(option.resource)!='undefined' then option.resource.id else ''
    clone = $('<a target="_blank" id="twitter-share-button" href="https://twitter.com/intent/tweet?url='+_url_share+'&text='+_tw_text+'">&nbsp;</a>')
    # clone.attr("data-text", _tw_text)
    # clone.attr("data-url", site_url+'/experiment/'+ if typeof(option.resource)!='undefined' then option.resource.id else '')
    # clone.attr("data-show-count", 'false')
    # clone.attr("class", "twitter-share-button");
    $('#share-tw').append(clone)
    $('#share-tw a').click ->
      ga('send', 'event', 'button', 'click', 'Share Twitter')
    # window.twttr.widgets.load();
  $(document).ready ()->
    $.ajaxSetup {cache:true}
    $.getScript '//connect.facebook.net/en_US/sdk.js',()->
      FB.init
        appId: _fb_appid,
        version: 'v2.7' # or v2.1, v2.2, v2.3, ...
      $('#share-fb').click ->
        ga('send', 'event', 'button', 'click', 'Share Facebook')
        FB.ui
          method: 'share',
          display: 'popup',
          href: site_url+'/experiment/'+option.resource.id,
          hashtag:'goodday-experiment',
          picture:site_url+'/img/good-day.png',
          title:'Jendela Eksperimen',
          description:_fb_text
      # FB.getLoginStatus(updateStatusCallback);
    tw_btn()
    # $.getScript '//platform.twitter.com/widgets.js',()->
    #   t = window.twttr || {}
    #   t._e = []
    #   t.ready = (f)->
    #     t._e.push f
    #   window.twttr = t
    #   tw_btn()
      # twtr_btn = twttr.widgets.createShareButton(
      #   window.location.origin+'/experiment/'+ if option then option.resource.id else '',
      #   document.getElementById('share-tw'),
      #   {
      #     count: 'none',
      #     text: 'test text'
      #   })
    io_ready ->
      ioadmin.on 'client_renderVideo_progress',(e)->
        # console.log(e)
        $('#download').text('render '+parseInt(e)+'%')
        $('.loader .loading').html('<p>'+parseInt(e)+'%</p>')
        $('title').text('('+parseInt(e)+'%)'+" Start Experiment")
        # $('.progress-bar').css('width', e+'%').attr('aria-valuenow', e).html(Math.ceil(parseFloat(e))+'%')
      ioadmin.on 'client_renderVideo_completed',(e)->
        $('#download').text('download')
        $('.loader .loading').text('')
        $('title').text("Start Experiment")
        result = JSON.parse(e)
        $('.loader').hide()
        option.src = site_url+'/'+result.video_url
        showVideo()
        # $.fileDownload site_url+'/force-download',
        #   httpMethod: "GET",
        #   data: {url:result.video_url},
        #   contentType: "video/mp4"
        $('.progress-bar').removeClass('progress-bar-info progress-bar-danger').addClass('progress-bar-success')
        $('#start_convert').removeClass('btn-danger disabled').addClass('btn-success').html('CONVERT').removeAttr('disabled');
      ioadmin.on 'client_renderVideo_failed',(e)->
        console.log(e)
        $('.progress-bar').removeClass('progress-bar-info progress-bar-success').addClass('progress-bar-danger')
        $('#start_convert').removeClass('btn-danger disabled').addClass('btn-success').html('CONVERT').removeAttr('disabled');
