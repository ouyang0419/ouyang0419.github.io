/* React Bits — Magnet, Click Spark, Shiny Text
   https://reactbits.dev  David Haz. Used as part of this site. */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches

  function smoothstep(edge0, edge1, value) {
    var t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)))
    return t * t * (3 - 2 * t)
  }

  var registry = []
  var pointer = null
  var owner = null
  var attached = false

  function reach(rect) {
    var dx = pointer.x - (rect.left + rect.width / 2)
    var dy = pointer.y - (rect.top + rect.height / 2)
    var outside = Math.hypot(
      Math.max(0, Math.abs(dx) - rect.width / 2),
      Math.max(0, Math.abs(dy) - rect.height / 2)
    )
    return { dx: dx, dy: dy, outside: outside }
  }

  function arbitrate() {
    var winner = null
    var nearest = Infinity
    var closest = Infinity
    registry.forEach(function (entry) {
      var near = null
      if (pointer && !reduce) {
        near = reach(entry.wrapper.getBoundingClientRect())
        if (near.outside > entry.padding) near = null
      }
      if (!near) return
      var center = Math.hypot(near.dx, near.dy)
      if (near.outside < nearest || (near.outside === nearest && center < closest)) {
        winner = entry
        nearest = near.outside
        closest = center
      }
    })
    var previous = owner
    owner = winner
    if (previous && previous !== winner) previous.wake()
    if (winner) winner.wake()
    registry.forEach(function (entry) {
      if (entry.active && entry !== winner) entry.wake()
    })
  }

  function attach() {
    if (attached) return
    attached = true
    window.addEventListener("pointermove", function (event) {
      if (event.pointerType === "touch") return
      pointer = { x: event.clientX, y: event.clientY }
      arbitrate()
    }, { passive: true })
    document.documentElement.addEventListener("pointerleave", function () {
      pointer = null
      arbitrate()
    })
  }

  function magnetize(el) {
    if (!el || reduce) return
    var outer = document.createElement("span")
    outer.className = "magnet"
    var inner = document.createElement("span")
    inner.className = "magnet-inner"
    el.parentNode.insertBefore(outer, el)
    inner.appendChild(el)
    outer.appendChild(inner)

    var padding = 72
    var strength = 5
    var maxOffset = 14
    var tilt = 7
    var scaleTo = 1.035
    var stiffness = 170
    var damping = 16
    var current = { x: 0, y: 0, tiltX: 0, tiltY: 0, scale: 1 }
    var velocity = { x: 0, y: 0, tiltX: 0, tiltY: 0, scale: 0 }
    var raf = 0
    var last = 0
    var entry = { wrapper: outer, padding: padding, active: false, wake: wake }
    registry.push(entry)
    attach()

    function measure() {
      var target = { x: 0, y: 0, tiltX: 0, tiltY: 0, scale: 1 }
      if (!pointer || owner !== entry) return target
      var rect = outer.getBoundingClientRect()
      var hit = reach(rect)
      if (hit.outside > padding) return target
      var pull = 1 - smoothstep(padding * 0.5, padding, hit.outside)
      var x = (hit.dx / strength) * pull
      var y = (hit.dy / strength) * pull
      var length = Math.hypot(x, y)
      if (length > maxOffset) {
        x *= maxOffset / length
        y *= maxOffset / length
      }
      var nx = Math.max(-1, Math.min(1, hit.dx / Math.max(rect.width / 2, 1)))
      var ny = Math.max(-1, Math.min(1, hit.dy / Math.max(rect.height / 2, 1)))
      target.x = x
      target.y = y
      target.tiltX = -ny * tilt * pull
      target.tiltY = nx * tilt * pull
      target.scale = 1 + (scaleTo - 1) * pull
      return target
    }

    function apply() {
      var turned = Math.abs(current.tiltX) > 0.01 || Math.abs(current.tiltY) > 0.01
      inner.style.transform =
        "translate3d(" + current.x.toFixed(2) + "px," + current.y.toFixed(2) + "px,0)" +
        (turned
          ? " perspective(800px) rotateX(" + current.tiltX.toFixed(2) + "deg) rotateY(" + current.tiltY.toFixed(2) + "deg)"
          : "") +
        (Math.abs(current.scale - 1) > 0.0005 ? " scale(" + current.scale.toFixed(4) + ")" : "")
    }

    function frame(now) {
      raf = 0
      var dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60
      last = now
      var target = measure()
      var engaged = target.x !== 0 || target.y !== 0 || target.scale !== 1
      entry.active = engaged
      var steps = Math.ceil(dt / (1 / 120))
      var resting = true
      var keys = ["x", "y", "tiltX", "tiltY", "scale"]
      for (var step = 0; step < steps; step++) {
        keys.forEach(function (key) {
          var force = stiffness * (target[key] - current[key]) - damping * velocity[key]
          velocity[key] += force * (dt / steps)
          current[key] += velocity[key] * (dt / steps)
          var epsilon = key === "scale" ? 0.001 : 0.05
          if (Math.abs(target[key] - current[key]) > epsilon || Math.abs(velocity[key]) > epsilon) resting = false
        })
      }
      if (resting) {
        keys.forEach(function (key) {
          current[key] = target[key]
          velocity[key] = 0
        })
      }
      apply()
      if (!resting) raf = requestAnimationFrame(frame)
      else last = 0
    }

    function wake() {
      if (!raf) raf = requestAnimationFrame(frame)
    }
  }

  function mountMagnets() {
    registry = registry.filter(function (item) { return item.wrapper.isConnected })
    document.querySelectorAll(".door, .mark, .gh, .back, .to-works, .entry").forEach(function (el) {
      if (el.closest(".magnet")) return
      magnetize(el)
    })
  }

  mountMagnets()

  var sparks = document.getElementById("sparks")
  if (sparks && !reduce) {
    var bursts = []
    var sparkRaf = 0
    var colors = ["#c6e0b4", "#f4f6f1", "#ffffff"]

    function starPath(ctx, x, y, radius, rotation) {
      var pinch = radius * 0.16
      ctx.beginPath()
      ctx.moveTo(x + Math.cos(rotation) * radius, y + Math.sin(rotation) * radius)
      for (var i = 1; i <= 4; i++) {
        var a = rotation + (i * Math.PI) / 2
        var mid = a - Math.PI / 4
        ctx.quadraticCurveTo(
          x + Math.cos(mid) * pinch,
          y + Math.sin(mid) * pinch,
          x + Math.cos(a) * radius,
          y + Math.sin(a) * radius
        )
      }
      ctx.closePath()
    }

    function paintBursts(now) {
      sparkRaf = 0
      bursts.slice().forEach(function (burst) {
        var elapsed = now - burst.start
        var ctx = burst.ctx
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.clearRect(0, 0, burst.canvas.width, burst.canvas.height)
        ctx.setTransform(burst.ratio, 0, 0, burst.ratio, -burst.left * burst.ratio, -burst.top * burst.ratio)
        var alive = false
        burst.sparks.forEach(function (spark) {
          var life = 560 * spark.life
          var p = elapsed / life
          if (p >= 1) return
          var e = 1 - Math.pow(1 - Math.min(1, p), 3)
          var distance = 46 * spark.reach * e
          var fade = 1 - smoothstep(0.7, 1, p)
          var twinkle = Math.pow(Math.sin(Math.PI * Math.min(1, p * 1.1)), 0.7)
          var radius = 8 * spark.scale * twinkle
          if (radius <= 0.05) return
          var x = burst.x + Math.cos(spark.angle) * distance
          var y = burst.y + Math.sin(spark.angle) * distance
          ctx.globalAlpha = fade * 0.2
          ctx.fillStyle = spark.color
          ctx.beginPath()
          ctx.arc(x, y, radius * 1.1, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = fade
          starPath(ctx, x, y, radius, spark.angle + spark.spin * p * Math.PI * 0.5)
          ctx.fill()
          alive = true
        })
        ctx.globalAlpha = 1
        if (!alive) {
          burst.canvas.remove()
          bursts.splice(bursts.indexOf(burst), 1)
        }
      })
      if (bursts.length) sparkRaf = requestAnimationFrame(paintBursts)
    }

    window.addEventListener("pointerdown", function (event) {
      if (event.pointerType === "touch" || event.button !== 0) return
      var count = 10
      var list = []
      for (var i = 0; i < count; i++) {
        list.push({
          angle: (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4,
          reach: 1 + (Math.random() - 0.5) * 0.35,
          scale: 1 + (Math.random() - 0.5) * 0.4,
          life: 1 + (Math.random() - 0.5) * 0.25,
          spin: Math.random() - 0.5,
          color: colors[i % colors.length]
        })
      }
      var reach = 70
      var ratio = Math.min(window.devicePixelRatio || 1, 2)
      var left = Math.max(event.clientX - reach, 0)
      var top = Math.max(event.clientY - reach, 0)
      var canvas = document.createElement("canvas")
      canvas.width = Math.ceil(reach * 2 * ratio)
      canvas.height = Math.ceil(reach * 2 * ratio)
      canvas.style.position = "absolute"
      canvas.style.left = left + "px"
      canvas.style.top = top + "px"
      canvas.style.width = reach * 2 + "px"
      canvas.style.height = reach * 2 + "px"
      canvas.setAttribute("aria-hidden", "true")
      sparks.appendChild(canvas)
      bursts.push({
        x: event.clientX,
        y: event.clientY,
        start: performance.now(),
        sparks: list,
        canvas: canvas,
        ctx: canvas.getContext("2d"),
        ratio: ratio,
        left: left,
        top: top
      })
      if (!sparkRaf) sparkRaf = requestAnimationFrame(paintBursts)
    })
  }

  function parseColor(value) {
    var probe = document.createElement("canvas").getContext("2d")
    if (!probe) return null
    probe.fillStyle = "#000000"
    probe.fillStyle = value
    var text = String(probe.fillStyle)
    if (text.charAt(0) === "#") {
      return [1, 3, 5].map(function (i) { return parseInt(text.slice(i, i + 2), 16) }).concat([1])
    }
    return null
  }

  function blend(from, to, amount) {
    function channel(a, b) {
      return Math.round(Math.pow(Math.pow(a / 255, 2.2) * (1 - amount) + Math.pow(b / 255, 2.2) * amount, 1 / 2.2) * 255)
    }
    return "rgba(" + channel(from[0], to[0]) + "," + channel(from[1], to[1]) + "," + channel(from[2], to[2]) + ",1)"
  }

  function mountShine() {
  document.querySelectorAll("h1 span").forEach(function (node) {
    if (node.classList.contains("shiny-text")) return
    node.classList.add("shiny-text")
    if (reduce) {
      node.style.backgroundImage = "linear-gradient(#f6f3ee, #f6f3ee)"
      return
    }
    var base = parseColor("#f6f3ee")
    var shine = parseColor("#ffffff")
    var from = -50
    var to = 160
    var duration = 2800

    function draw(at) {
      var half = 22
      var stops = []
      ;[-1, 1].forEach(function (side) {
        ;[0, 0.35, 0.7, 1].forEach(function (f) {
          var place = at + side * (half * 0.2 + half * 0.8 * (1 - f))
          stops.push([place, f * f * (3 - 2 * f)])
        })
      })
      stops.sort(function (a, b) { return a[0] - b[0] })
      var list = stops.map(function (stop) {
        return blend(base, shine, stop[1]) + " " + stop[0].toFixed(1) + "%"
      })
      node.style.backgroundImage = "linear-gradient(120deg," + blend(base, shine, 0) + " 0%," + list.join(",") + "," + blend(base, shine, 0) + " 100%)"
    }

    function sweep(start) {
      function tick(now) {
        if (!node.isConnected) return
        var t = Math.min(1, Math.max(0, (now - start) / duration))
        var eased = 0.5 - Math.cos(Math.PI * t) / 2
        draw(from + (to - from) * eased)
        if (t < 1) requestAnimationFrame(tick)
        else window.setTimeout(function () { sweep(performance.now()) }, 1100)
      }
      requestAnimationFrame(tick)
    }
    draw(from)
    window.setTimeout(function () { sweep(performance.now()) }, 200 + Math.random() * 500)
  })
  }

  mountShine()

  function placeHole() {
    var field = document.getElementById("field")
    var desk = document.getElementById("desk")
    var hello = document.querySelector(".hello")
    if (!field) return
    var sheet = document.querySelector(".sheet")
    var open = desk && desk.classList.contains("is-open")
    var mask = "none"
    if (field.querySelector("iframe")) {
      mask = "none"
    } else if (!open && desk && desk.classList.contains("limb-page")) {
      mask = "none"
    } else if (!open && document.querySelector(".case")) {
      mask = window.innerWidth > 800
        ? "linear-gradient(90deg, transparent 0%, transparent 20%, #000 32%, #000 44%, transparent 54%, transparent 100%)"
        : "linear-gradient(180deg, transparent 0%, transparent 92%, #000 100%)"
    } else if (!open && sheet) {
      mask = window.innerWidth > 800
        ? "linear-gradient(90deg, transparent 0%, transparent 36%, #000 64%)"
        : "linear-gradient(180deg, transparent 0%, transparent 92%, #000 100%)"
    } else if (!open && hello) {
      var rect = hello.getBoundingClientRect()
      var cx = ((rect.left + rect.width / 2) / window.innerWidth) * 100
      var cy = ((rect.top + rect.height / 2) / window.innerHeight) * 100
      var rx = ((rect.width / 2) * 2.7 / window.innerWidth) * 100
      var ry = ((rect.height / 2) * 2.7 / window.innerHeight) * 100
      mask = "radial-gradient(ellipse " + rx.toFixed(1) + "% " + ry.toFixed(1) + "% at " + cx.toFixed(1) + "% " + cy.toFixed(1) + "%, transparent 0%, transparent 58%, #000 100%)"
    }
    field.style.webkitMaskImage = mask
    field.style.maskImage = mask
    var canvas = field.querySelector("canvas")
    if (canvas) {
      canvas.style.webkitMaskImage = mask
      canvas.style.maskImage = mask
    }
  }

  window.SiteBits = {
    refresh: function () {
      mountMagnets()
      mountShine()
      placeHole()
    }
  }

  placeHole()
  window.addEventListener("resize", placeHole)
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeHole)
  var desk = document.getElementById("desk")
  if (desk && window.MutationObserver) {
    new MutationObserver(placeHole).observe(desk, { attributes: true, attributeFilter: ["class"] })
  }
  var field = document.getElementById("field")
  if (field && window.MutationObserver) {
    new MutationObserver(placeHole).observe(field, { childList: true })
  }
})()
