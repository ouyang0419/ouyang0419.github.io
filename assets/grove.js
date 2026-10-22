/* Wireframe grove. Original scene, in the spirit of a living-world landing. */
(function () {
  function mountGrove(container) {
    if (!container) return function () {}
    var canvas = document.createElement("canvas")
    canvas.setAttribute("aria-hidden", "true")
    container.appendChild(canvas)
    var ctx = canvas.getContext("2d")
    if (!ctx) {
      container.classList.add("is-fallback")
      return function () {}
    }
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    var cols = 48
    var rows = 30
    var width = 1
    var height = 1
    var dpr = 1
    var stars = []
    for (var i = 0; i < 28; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random() * 0.46,
        s: 2 + Math.random() * 3.5,
        a: 0.18 + Math.random() * 0.35
      })
    }
    var raf = 0
    var alive = true

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      width = Math.max(1, container.clientWidth)
      height = Math.max(1, container.clientHeight)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = width + "px"
      canvas.style.height = height + "px"
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function ridge(x, z) {
      return Math.sin(z * 0.72 + x * 0.1) * 1.05
        + Math.sin(x * 0.62 + z * 0.16) * 0.34
        + Math.cos(z * 0.3 - x * 0.26) * 0.28
    }

    function project(x, y, z) {
      var depth = z + 1.7
      var scale = height * 1.2
      return [
        width * 0.58 + (x / depth) * scale,
        height * 0.74 - (y / depth) * scale,
        depth
      ]
    }

    function paint(now) {
      var time = reduce ? 1.2 : now * 0.00018
      ctx.clearRect(0, 0, width, height)
      var sky = ctx.createLinearGradient(0, 0, 0, height)
      sky.addColorStop(0, "#141a16")
      sky.addColorStop(0.42, "#1b2420")
      sky.addColorStop(1, "#0d110f")
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, width, height)

      var glow = ctx.createRadialGradient(width * 0.62, height * 0.7, 10, width * 0.58, height * 0.72, height * 0.62)
      glow.addColorStop(0, "rgba(126, 156, 112, 0.2)")
      glow.addColorStop(1, "rgba(13, 17, 15, 0)")
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, width, height)

      ctx.lineWidth = 1
      ctx.strokeStyle = "rgba(214, 228, 206, 0.28)"
      stars.forEach(function (star) {
        var x = star.x * width
        var y = star.y * height
        ctx.globalAlpha = star.a
        ctx.beginPath()
        ctx.moveTo(x - star.s, y)
        ctx.lineTo(x + star.s, y)
        ctx.moveTo(x, y - star.s)
        ctx.lineTo(x, y + star.s)
        ctx.stroke()
      })
      ctx.globalAlpha = 1

      var grid = []
      for (var r = 0; r < rows; r++) {
        grid[r] = []
        var z = (r / (rows - 1)) * 6.4
        for (var c = 0; c < cols; c++) {
          var x = (c / (cols - 1) - 0.5) * 8.4
          var y = ridge(x, z + time * 2.4)
          grid[r][c] = project(x, y * 0.72, z)
        }
      }

      function strokeLine(points, alpha) {
        ctx.beginPath()
        ctx.moveTo(points[0][0], points[0][1])
        for (var i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1])
        ctx.strokeStyle = "rgba(198, 224, 180, " + alpha.toFixed(3) + ")"
        ctx.stroke()
      }

      for (var row = 0; row < rows; row++) {
        var depth = grid[row][0][2]
        var alpha = Math.max(0.05, 0.55 * (1 - depth / 9.2))
        strokeLine(grid[row], alpha)
      }
      for (var col = 0; col < cols; col++) {
        var column = []
        for (var rr = 0; rr < rows; rr++) column.push(grid[rr][col])
        strokeLine(column, 0.16)
      }

      var fog = ctx.createLinearGradient(0, height * 0.35, 0, height)
      fog.addColorStop(0, "rgba(13, 17, 15, 0)")
      fog.addColorStop(1, "rgba(13, 17, 15, 0.28)")
      ctx.fillStyle = fog
      ctx.fillRect(0, 0, width, height)

      if (alive && !reduce) raf = requestAnimationFrame(paint)
    }

    resize()
    paint(0)
    var observer = window.ResizeObserver ? new ResizeObserver(function () {
      resize()
      if (reduce) paint(0)
    }) : null
    if (observer) observer.observe(container)
    window.addEventListener("resize", resize)

    return function () {
      alive = false
      cancelAnimationFrame(raf)
      if (observer) observer.disconnect()
      window.removeEventListener("resize", resize)
      canvas.remove()
    }
  }

  window.Grove = { mountGrove: mountGrove }
})()
