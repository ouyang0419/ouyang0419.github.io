/* Mounts the ThreeUI Sylva living-world scene, then pins the timeline to its root. */
(function () {
  var ARCH = { w: 1900, left: -180, top: 306, aspect: 2800 / 1377 }
  var ARCH_N = { w: 1120, left: -290, top: 555, aspect: 2800 / 1377 }

  function mountGrove(container) {
    if (!container || container.querySelector("iframe")) return function () {}
    var frame = document.createElement("iframe")
    frame.src = "/assets/sylva/scene.html?v=4"
    frame.title = ""
    frame.setAttribute("aria-hidden", "true")
    frame.tabIndex = -1
    container.appendChild(frame)
    container.classList.remove("is-fallback")

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
      var lift = Math.max(0, lowest - (heroH - 170))
      return { u: u, oy: oy0 - lift, lift: lift, box: box, boxH: boxH }
    }

    function placeBuds() {
      var m = metrics()
      var doc = frame.contentDocument
      var stage = doc && doc.getElementById("stage")
      if (stage) {
        stage.style.transform = "translateY(" + (-m.lift) + "px)"
        if (frame.contentWindow) frame.contentWindow.dispatchEvent(new Event("resize"))
      }
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

    function publishMark() {
      var win = frame.contentWindow
      if (!win) return
      var desk = document.getElementById("desk")
      var link = desk && desk.classList.contains("gate") ? document.querySelector("a.to-works") : null
      if (!link) { win.__groveMark = null; return }
      var r = link.getBoundingClientRect()
      win.__groveMark = { x: r.right + 46, y: r.top + r.height * 0.42 }
    }

    function watchMark() {
      publishMark()
      window.requestAnimationFrame(watchMark)
    }

    frame.addEventListener("load", placeBuds)
    placeBuds()
    watchMark()
    window.addEventListener("resize", placeBuds)
    document.addEventListener("site:swap", function () {
      window.requestAnimationFrame(placeBuds)
    })
    return function () {}
  }

  window.Grove = { mountGrove: mountGrove }
})()
