/* Mounts the ThreeUI Sylva living-world scene, then pins the timeline to its root.
   On the homepage the roots sit off the left edge and the butterfly rests above
   「作品」. Entering the works page, the butterfly leaves and the roots grow in
   from the left. */
(function () {
  var ARCH = { w: 1900, left: -180, top: 306, aspect: 2800 / 1377 }
  var ARCH_N = { w: 1120, left: -290, top: 555, aspect: 2800 / 1377 }

  function mountGrove(container) {
    if (!container || container.querySelector("iframe")) return function () {}
    var frame = document.createElement("iframe")
    frame.title = ""
    frame.setAttribute("aria-hidden", "true")
    frame.tabIndex = -1
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    var pose = { x: 0, y: 0 }
    var goalKey = ""
    var anim = 0
    var departing = false

    function metrics() {
      var narrow = window.innerWidth <= 900
      var design = narrow ? 760 : 1600
      var u = window.innerWidth / design
      var stageH = (narrow ? 1625 : 880) * u
      var heroH = window.innerHeight
      var oy0 = narrow ? 0 : (heroH - stageH) / 2
      var box = narrow ? ARCH_N : ARCH
      var boxH = box.w / box.aspect
      var lowest = 0
      var nodes = document.querySelectorAll(".bud")
      for (var i = 0; i < nodes.length; i++) {
        var fy = Number(nodes[i].getAttribute("data-fy"))
        if (!isFinite(fy)) continue
        var y = oy0 + (box.top + fy * boxH) * u
        if (y > lowest) lowest = y
      }
      if (lowest === 0) lowest = oy0 + (box.top + 0.58 * boxH) * u
      var lift = Math.max(0, lowest - (heroH - 170))
      var hideX = -((box.left + box.w) * u + 760)
      return { u: u, oy: oy0 - lift, lift: lift, box: box, boxH: boxH, hideX: hideX }
    }

    function isGate() {
      var desk = document.getElementById("desk")
      return !!(desk && desk.classList.contains("gate"))
    }

    function applyPose(p) {
      pose.x = p.x
      pose.y = p.y
      var doc = frame.contentDocument
      var stage = doc && doc.getElementById("stage")
      if (stage) {
        stage.style.transformOrigin = "left center"
        stage.style.transform = "translate(" + p.x + "px," + p.y + "px)"
      }
      if (doc && doc.documentElement) doc.documentElement.classList.toggle("is-sky", p.x < -40)
      var win = frame.contentWindow
      if (win) win.dispatchEvent(new Event("resize"))
    }

    function animatePose(target) {
      var key = target.x + "," + target.y
      if (goalKey === key) return
      goalKey = key
      if (reduce || (Math.abs(target.x - pose.x) < 1 && Math.abs(target.y - pose.y) < 1)) {
        applyPose(target)
        return
      }
      var token = ++anim
      var fromX = pose.x
      var fromY = pose.y
      var t0 = performance.now()
      function step(now) {
        if (token !== anim) return
        var t = Math.min(1, (now - t0) / 1400)
        var e = 1 - Math.pow(1 - t, 3)
        applyPose({ x: fromX + (target.x - fromX) * e, y: fromY + (target.y - fromY) * e })
        if (t < 1) window.requestAnimationFrame(step)
      }
      window.requestAnimationFrame(step)
    }

    function targetFor(gate) {
      var m = metrics()
      return { m: m, pose: gate ? { x: m.hideX, y: -m.lift } : { x: 0, y: -m.lift } }
    }

    function sync(animate) {
      var next = targetFor(isGate())
      if (animate) animatePose(next.pose)
      else {
        goalKey = next.pose.x + "," + next.pose.y
        applyPose(next.pose)
      }
      return next.m
    }

    function placeBuds(m) {
      if (!m) m = metrics()
      var nodes = document.querySelectorAll(".bud")
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i]
        var fx = Number(node.getAttribute("data-fx"))
        var fy = Number(node.getAttribute("data-fy"))
        if (!isFinite(fx) || !isFinite(fy)) continue
        var x = (m.box.left + fx * m.box.w) * m.u
        var y = m.oy + (m.box.top + fy * m.boxH) * m.u
        node.style.left = x + "px"
        node.style.top = y + "px"
        var edge = x > window.innerWidth * 0.72 ? "end" : x < window.innerWidth * 0.22 ? "start" : "mid"
        if (node.getAttribute("data-edge") !== edge) node.setAttribute("data-edge", edge)
      }
    }

    function parkGuide() {
      var win = frame.contentWindow
      if (!win || departing || !isGate()) return
      var link = document.querySelector("a.to-works")
      if (!link) return
      var r = link.getBoundingClientRect()
      win.__groveGuide = { x: r.left + 22, y: r.top - 18, hold: true }
    }

    function departGuide() {
      var win = frame.contentWindow
      if (!win) return
      departing = true
      var from = win.__groveGuide && isFinite(win.__groveGuide.x) ? win.__groveGuide : { x: 120, y: window.innerHeight * 0.62 }
      var toX = window.innerWidth * 0.86
      var toY = -120
      var t0 = performance.now()
      function step(now) {
        var t = Math.min(1, (now - t0) / 1000)
        var e = t * t
        win.__groveGuide = {
          x: from.x + (toX - from.x) * e,
          y: from.y + (toY - from.y) * e,
          hold: false
        }
        if (t < 1) window.requestAnimationFrame(step)
        else win.__groveGuide = { hide: true }
      }
      window.requestAnimationFrame(step)
    }

    function track() {
      parkGuide()
      window.requestAnimationFrame(track)
    }

    frame.addEventListener("load", function () {
      placeBuds(sync(false))
      parkGuide()
    })
    container.appendChild(frame)
    frame.src = "/assets/sylva/scene.html?v=9"
    container.classList.remove("is-fallback")
    track()

    window.addEventListener("resize", function () {
      placeBuds(sync(false))
    })
    document.addEventListener("site:swap", function () {
      window.requestAnimationFrame(function () {
        if (isGate()) departing = false
        placeBuds(sync(true))
        parkGuide()
      })
    })
    document.addEventListener("click", function (event) {
      var link = event.target.closest && event.target.closest("a[href]")
      if (!link || link.target === "_blank") return
      var url
      try { url = new URL(link.href, location.href) } catch (error) { return }
      if (url.origin !== location.origin) return
      var path = url.pathname
      if (/\/works\.html$/.test(path)) {
        departGuide()
        animatePose(targetFor(false).pose)
      } else if (path === "/" || /\/index\.html$/.test(path)) {
        departing = false
        animatePose(targetFor(true).pose)
      }
    })
    return function () {}
  }

  window.Grove = { mountGrove: mountGrove }
})()
