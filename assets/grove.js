/* Mounts the ThreeUI Sylva living-world scene, then pins the timeline to its root.
   The homepage keeps the roots unscanned, so only the sky shows, and the
   butterfly flies in from off screen to rest above 「作品」. Entering the
   works page replays the scene's own growth pulse. */
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
    var departing = false
    var arriving = false

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
      return { u: u, oy: oy0 - lift, lift: lift, box: box, boxH: boxH }
    }

    function isGate() {
      var desk = document.getElementById("desk")
      return !!(desk && desk.classList.contains("gate"))
    }

    function applyPose() {
      var m = metrics()
      var doc = frame.contentDocument
      var stage = doc && doc.getElementById("stage")
      if (stage) {
        stage.style.transformOrigin = "left center"
        stage.style.transform = "translate(0px," + (-m.lift) + "px)"
      }
      if (doc && doc.documentElement) doc.documentElement.classList.toggle("is-sky", isGate())
      var win = frame.contentWindow
      if (win) win.dispatchEvent(new Event("resize"))
      return m
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

    function holdBranch() {
      applyPose()
      var win = frame.contentWindow
      if (win && win.__groveHold) win.__groveHold()
    }

    function growBranch() {
      var doc = frame.contentDocument
      if (doc && doc.documentElement) doc.documentElement.classList.remove("is-sky")
      applyPose()
      var win = frame.contentWindow
      if (win && win.__groveGrow) win.__groveGrow()
    }

    function markOf() {
      var link = document.querySelector("a.to-works")
      if (!link) return null
      var r = link.getBoundingClientRect()
      return { x: r.left + 22, y: r.top - 18 }
    }

    function parkGuide() {
      var win = frame.contentWindow
      if (!win || departing || arriving || !isGate()) return
      var mark = markOf()
      if (!mark) return
      win.__groveGuide = { x: mark.x, y: mark.y, hold: true }
    }

    function arriveGuide() {
      var win = frame.contentWindow
      var to = markOf()
      if (!win || !to) return
      if (reduce) { arriving = false; departing = false; parkGuide(); return }
      arriving = true
      departing = true
      win.__groveGuide = { x: to.x, y: to.y, mode: "arrive" }
      var t0 = performance.now()
      function step(now) {
        if (!isGate()) { arriving = false; departing = false; return }
        var live = markOf() || to
        if (win.__groveGuide && win.__groveGuide.mode === "arrive") {
          win.__groveGuide.x = live.x
          win.__groveGuide.y = live.y
        }
        if (now - t0 < 5600) window.requestAnimationFrame(step)
        else { arriving = false; departing = false; parkGuide() }
      }
      window.requestAnimationFrame(step)
    }

    function departGuide() {
      var win = frame.contentWindow
      if (!win) return
      departing = true
      arriving = false
      win.__groveGuide = {
        x: window.innerWidth + 260,
        y: 40 + Math.random() * 140,
        mode: "depart"
      }
      window.setTimeout(function () {
        if (win.__groveGuide && win.__groveGuide.mode === "depart") win.__groveGuide = { hide: true }
      }, 3200)
    }

    function track() {
      parkGuide()
      window.requestAnimationFrame(track)
    }

    frame.addEventListener("load", function () {
      if (isGate()) {
        placeBuds(holdBranch())
        arriveGuide()
      } else {
        placeBuds(applyPose())
      }
    })
    container.appendChild(frame)
    frame.src = "/assets/sylva/scene.html?v=15"
    container.classList.remove("is-fallback")
    track()

    window.addEventListener("resize", function () {
      if (isGate()) placeBuds(holdBranch())
      else placeBuds(applyPose())
    })
    document.addEventListener("site:swap", function () {
      window.requestAnimationFrame(function () {
        var desk = document.getElementById("desk")
        if (isGate()) {
          departing = false
          placeBuds(holdBranch())
          arriveGuide()
        } else if (desk && desk.classList.contains("limb-page")) {
          placeBuds(applyPose())
          growBranch()
        } else {
          placeBuds(applyPose())
        }
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
        growBranch()
      }
    })
    return function () {}
  }

  window.Grove = { mountGrove: mountGrove }
})()
