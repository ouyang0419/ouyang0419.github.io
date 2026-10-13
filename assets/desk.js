(function () {
  var desk = document.getElementById("desk")
  var cards = Array.prototype.slice.call(document.querySelectorAll("[data-open]"))
  var current = null

  function panel(name) {
    return document.querySelector('.detail[data-project="' + name + '"]')
  }

  function close() {
    if (!current) return
    var open = current
    current = null
    desk.classList.remove("is-open")
    cards.forEach(function (card) {
      card.setAttribute("aria-pressed", "false")
    })
    open.classList.remove("is-on")
    window.setTimeout(function () {
      if (current !== open) open.hidden = true
    }, 740)
  }

  function open(name, card) {
    var next = panel(name)
    if (!next) return
    if (current && current !== next) {
      current.classList.remove("is-on")
      current.hidden = true
    }
    current = next
    next.hidden = false
    desk.classList.add("is-open")
    cards.forEach(function (item) {
      item.setAttribute("aria-pressed", item === card ? "true" : "false")
    })
    window.requestAnimationFrame(function () {
      next.classList.add("is-on")
      var back = next.querySelector("[data-close]")
      if (back) back.focus({ preventScroll: true })
      var stage = desk.querySelector(".stage")
      if (stage) stage.scrollLeft = 0
    })
  }

  cards.forEach(function (card) {
    card.setAttribute("aria-pressed", "false")
    card.addEventListener("click", function () {
      var name = card.getAttribute("data-open")
      var next = panel(name)
      if (current === next) close()
      else open(name, card)
    })
  })

  document.addEventListener("click", function (event) {
    var closer = event.target.closest("[data-close]")
    if (closer) close()
  })

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") close()
  })

  var canvas = document.getElementById("field")
  var ctx = canvas.getContext("2d", { alpha: true })
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  var running = true
  var mx = 0
  var my = 0
  var px = 0
  var py = 0
  var viewW = 1
  var viewH = 1
  var glow = null

  window.addEventListener("pointermove", function (event) {
    mx = (event.clientX / window.innerWidth - 0.5) * 22
    my = (event.clientY / window.innerHeight - 0.5) * 14
  })

  function resize() {
    var ratio = Math.min(window.devicePixelRatio || 1, 1.25)
    viewW = canvas.clientWidth || window.innerWidth
    viewH = canvas.clientHeight || window.innerHeight
    canvas.width = Math.max(1, Math.floor(viewW * ratio))
    canvas.height = Math.max(1, Math.floor(viewH * ratio))
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    glow = ctx.createRadialGradient(viewW * 0.3, viewH * 0.38, 0, viewW * 0.3, viewH * 0.38, viewW * 0.5)
    glow.addColorStop(0, "rgba(0, 245, 212, 0.09)")
    glow.addColorStop(0.4, "rgba(244, 210, 138, 0.04)")
    glow.addColorStop(1, "rgba(0, 0, 0, 0)")
  }

  function ribbon(index, time) {
    var pts = []
    var steps = 28
    for (var s = 0; s <= steps; s++) {
      var u = s / steps
      var x = (u - 0.08) * viewW * 1.16
      var wave =
        Math.sin(u * 5.2 + time * 0.38 + index * 0.85) * viewH * 0.028 +
        Math.sin(u * 2.05 - time * 0.2 + index * 1.4) * viewH * 0.048
      var band = index < 3 ? 0.06 + index * 0.08 : 0.78 + (index - 3) * 0.06
      var y = viewH * band + (0.5 - u) * viewH * 0.06 + wave
      pts.push(x, y)
    }
    return pts
  }

  function stroke(pts, color, width, ox) {
    ctx.beginPath()
    ctx.moveTo(pts[0] + ox, pts[1])
    for (var i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i] + ox, pts[i + 1])
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.stroke()
  }

  function frame(now) {
    if (!running) return
    if (!reduce) window.requestAnimationFrame(frame)
    if (Math.abs(mx - px) > 0.2 || Math.abs(my - py) > 0.2) {
      px += (mx - px) * 0.08
      py += (my - py) * 0.08
      canvas.style.transform = "translate3d(" + px.toFixed(1) + "px," + py.toFixed(1) + "px,0)"
    }
    var time = reduce ? 1.4 : now / 1000
    ctx.clearRect(0, 0, viewW, viewH)
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, viewW, viewH)
    for (var i = 0; i < 6; i++) {
      var pts = ribbon(i, time)
      var gold = i % 3 === 1
      stroke(pts, gold ? "rgba(255, 80, 48, 0.16)" : "rgba(0, 110, 255, 0.14)", 5, -1.6)
      stroke(pts, gold ? "rgba(0, 245, 212, 0.14)" : "rgba(244, 210, 138, 0.12)", 5, 1.6)
      stroke(pts, gold ? "rgba(244, 210, 138, 0.5)" : "rgba(186, 214, 230, 0.32)", gold ? 1.5 : 1.15, 0)
      if (reduce) continue
      var count = pts.length / 2
      var head = Math.floor(((time * 0.12 + i * 0.15) % 1) * (count - 8))
      ctx.beginPath()
      ctx.moveTo(pts[head * 2], pts[head * 2 + 1])
      for (var k = 1; k < 7; k++) ctx.lineTo(pts[(head + k) * 2], pts[(head + k) * 2 + 1])
      ctx.strokeStyle = gold ? "rgba(244, 210, 138, 0.22)" : "rgba(127, 216, 255, 0.16)"
      ctx.lineWidth = 8
      ctx.stroke()
      ctx.strokeStyle = gold ? "rgba(255, 244, 214, 0.95)" : "rgba(226, 242, 255, 0.82)"
      ctx.lineWidth = 1.8
      ctx.stroke()
    }
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      running = false
      return
    }
    if (!running && !reduce) {
      running = true
      window.requestAnimationFrame(frame)
    }
  })

  window.addEventListener("resize", resize)
  resize()
  window.requestAnimationFrame(frame)
})()
