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

  var field = document.getElementById("field")
  if (field && window.AeroShards) {
    window.AeroShards.mountAeroShards(field, {
      backgroundColor: "#000000",
      dpr: Math.min(window.devicePixelRatio || 1, 1.5),
      onError: function () {
        field.classList.add("is-fallback")
      }
    })
  } else if (field) {
    field.classList.add("is-fallback")
  }
})()
