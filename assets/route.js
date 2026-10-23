(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  var busy = false

  function same(url) {
    return url.pathname === location.pathname && url.search === location.search
  }

  function show(html, url) {
    var doc = new DOMParser().parseFromString(html, "text/html")
    var next = doc.getElementById("desk")
    var desk = document.getElementById("desk")
    if (!next || !desk) {
      location.href = url
      return
    }
    document.dispatchEvent(new CustomEvent("site:swap"))
    desk.className = next.className + (reduce ? "" : " is-enter")
    desk.innerHTML = next.innerHTML
    document.title = doc.title
    document.body.classList.remove("is-crossing")
    var veil = document.querySelector(".veil")
    var nextVeil = doc.querySelector(".veil")
    if (veil && nextVeil) veil.className = nextVeil.className
    window.scrollTo(0, 0)
    if (window.SiteBits) window.SiteBits.refresh()
    if (!reduce) {
      window.setTimeout(function () {
        desk.classList.remove("is-enter")
      }, 1100)
    }
  }

  function go(url, push) {
    if (busy) return
    var desk = document.getElementById("desk")
    if (!desk) {
      location.href = url
      return
    }
    busy = true
    var leavingGate = desk.classList.contains("gate")
    if (!reduce) {
      desk.classList.add("is-leave")
      if (leavingGate) document.body.classList.add("is-crossing")
    }
    window.setTimeout(function () {
      fetch(url, { credentials: "same-origin" })
        .then(function (response) {
          if (!response.ok) throw new Error("status")
          return response.text()
        })
        .then(function (html) {
          if (push) history.pushState({ href: url }, "", url)
          show(html, url)
          busy = false
        })
        .catch(function () {
          location.href = url
        })
    }, reduce ? 0 : (leavingGate ? 720 : 380))
  }

  document.addEventListener("click", function (event) {
    if (event.defaultPrevented || event.button !== 0) return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    var link = event.target.closest("a[href]")
    if (!link || link.target === "_blank" || link.hasAttribute("download")) return
    var url
    try { url = new URL(link.href, location.href) } catch (error) { return }
    if (url.origin !== location.origin) return
    if (same(url)) return
    event.preventDefault()
    go(url.href, true)
  })

  window.addEventListener("popstate", function () {
    go(location.href, false)
  })
})()
