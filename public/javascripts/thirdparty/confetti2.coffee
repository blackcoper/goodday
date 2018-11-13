init_conetti2 = ->
  NUM_CONFETTI = 200
  COLORS = [[85,71,106], [174,61,99], [219,56,83], [244,92,68], [248,182,70]]
  PI_2 = 2*Math.PI

  if isMobile.any
    NUM_CONFETTI = 80

  canvas = document.getElementById "confetti2"
  context = canvas.getContext "2d"
  retina = window.devicePixelRatio
  # canvasParent = canvas.parentNode
  canvasWidth = canvas.offsetWidth
  canvasHeight = canvas.offsetHeight
  # canvas.width = canvasWidth * retina
  # canvas.height = canvasHeight * retina
  window.w = canvas.width
  window.h = canvas.height

  range = (a,b) -> (b-a)*Math.random() + a

  drawCircle = (x,y,r,style) ->
    context.beginPath()
    context.arc(x,y,r,0,PI_2,false)
    context.fillStyle = style
    context.fill()

  xpos = 0.5

  class Confetti

    constructor: ->
      @style = COLORS[~~range(0,5)]
      @rgb = "rgba(#{@style[0]},#{@style[1]},#{@style[2]}"
      @r = ~~range(2,6)
      @r2 = 2*@r
      @replace()

    replace: ->
      @opacity = 0
      @dop = 0.03*range(1,4)
      @x = range(-@r2,w-@r2)
      @y = range(-20,h-@r2)
      @xmax = w-@r
      @ymax = h-@r
      @vx = range(0,2)+8*xpos-5
      @vy = 0.4*@r+range(-1,1) #0.7*@r+range(-1,1)

    draw: ->
      @x += @vx
      @y += @vy
      @opacity += @dop
      if @opacity > 1
        @opacity = 1
        @dop *= -1
      @replace() if @opacity < 0 or @y > @ymax
      if !(0 < @x < @xmax)
        @x = (@x + @xmax) % @xmax
      drawCircle(~~@x,~~@y,@r,"#{@rgb},#{@opacity})")


  confetti = (new Confetti for i in [1..NUM_CONFETTI])
  id_interval = undefined
  delaying = false
  window.step = ->
    if !delaying
      delaying = true
      xpos = Math.random()
      setTimeout ->
        delaying = false
      ,range(1000,5000)
    id_interval = requestAnimFrame(step)
    context.clearRect(0,0,w,h)
    c.draw() for c in confetti
  stop = ->
    cancelRequestAnimFrame(id_interval)
  # step()
  return {
    'start' : step
    'stop'  : stop
  }
