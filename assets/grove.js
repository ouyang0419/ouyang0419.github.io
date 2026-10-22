/* Mounts the ThreeUI Sylva living-world scene, then pins the timeline to its root. */
(function () {
  var ARCH = { w: 1900, left: -180, top: 306, aspect: 2800 / 1377 }
  var ARCH_N = { w: 1120, left: -290, top: 555, aspect: 2800 / 1377 }

  function mountGrove(container) {
    if (!container || container.querySelector("iframe")) return function () {}
    var frame = document.createElement("iframe")
    frame.src = "/assets/sylva/scene.html"
    frame.title = ""
    frame.setAttribute("aria-hidden", "true")
    frame.tabIndex = -1
    container.appendChild(frame)
    container.classList.remove("is-fallback")

    function placeBuds() {
      var narrow = window.innerWidth <= 900
      var design = narrow ? 760 : 1600
      var u = window.innerWidth / design
      var stageH = (narrow ? 1625 : 880) * u
      var heroH = Math.max(window.innerHeight, narrow ? stageH : 0)
      var oy = narrow ? 0 : (heroH - stageH) / 2
      var box = narrow ? ARCH_N : ARCH
      var boxH = box.w / box.aspect
      var nodes = document.querySelectorAll(".bud")
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i]
        var fx = Number(node.getAttribute("data-fx"))
        var fy = Number(node.getAttribute("data-fy"))
        if (!isFinite(fx) || !isFinite(fy)) continue
        var x = (box.left + fx * box.w) * u
        var y = oy + (box.top + fy * boxH) * u
        node.style.left = x + "px"
        node.style.top = y + "px"
        var edge = x > window.innerWidth * 0.72 ? "end" : x < window.innerWidth * 0.22 ? "start" : "mid"
        if (node.getAttribute("data-edge") !== edge) node.setAttribute("data-edge", edge)
      }
    }

    placeBuds()
    window.addEventListener("resize", placeBuds)
    document.addEventListener("site:swap", function () {
      window.requestAnimationFrame(placeBuds)
    })
    return function () {}
  }

  window.Grove = { mountGrove: mountGrove }
})()
