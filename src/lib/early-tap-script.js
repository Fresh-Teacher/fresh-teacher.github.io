function installEarlyTapQueue() {
  var w = window;
  if (w.__ftEarlyTap)
    return;
  w.__ftEarlyTap = true;
  var SELECTOR = '[data-toggle],button,[role="button"],a[href="#"]';
  var pending = null;
  var ready = function(el) {
    for (var key in el)
      if (key.indexOf("__reactProps$") === 0)
        return true;
    return false;
  };
  var locate = function(item) {
    if (item.el.isConnected)
      return item.el;
    var candidate = document.querySelectorAll(SELECTOR)[item.index];
    return candidate && candidate.textContent === item.text ? candidate : null;
  };
  var earlyControl = null;
  var clearEarly = function() {
    earlyControl = null;
    var open = document.querySelectorAll("[data-early-open]");
    for (var i = 0;i < open.length; i++) {
      var group = open[i];
      if (!group)
        continue;
      group.removeAttribute("data-early-open");
      var list = group.querySelector(":scope>.dropdown-menu");
      if (list) {
        list.style.removeProperty("display");
        list.style.removeProperty("visibility");
        list.style.removeProperty("opacity");
      }
    }
  };
  var showEarly = function(control) {
    var group = control.parentElement;
    var wasOpen = earlyControl === control;
    clearEarly();
    if (control.getAttribute("data-toggle") !== "dropdown" || !group)
      return true;
    if (wasOpen)
      return false;
    earlyControl = control;
    group.setAttribute("data-early-open", "");
    var list = group.querySelector(":scope>.dropdown-menu");
    if (list) {
      list.style.setProperty("display", "block", "important");
      list.style.setProperty("visibility", "visible", "important");
      list.style.setProperty("opacity", "1", "important");
    }
    return true;
  };
  var root = document.documentElement;
  var unlockShelves = function() {
    var shelves = document.querySelector(".page-wrapper");
    if (shelves && root.hasAttribute("data-early-door"))
      shelves.removeAttribute("inert");
  };
  var openDoorEarly = function() {
    if (root.hasAttribute("data-early-door"))
      return;
    root.setAttribute("data-early-door", "");
    unlockShelves();
    var audio = document.getElementById("audiocracker");
    if (audio && typeof audio.play === "function") {
      audio.setAttribute("data-early-played", "");
      try {
        var started = audio.play();
        if (started && typeof started.catch === "function")
          started.catch(function() {
            audio?.removeAttribute("data-early-played");
          });
      } catch (error) {
        audio.removeAttribute("data-early-played");
      }
    }
  };
  try {
    if (sessionStorage.getItem("library-door-open") === "1") {
      root.setAttribute("data-early-door", "");
      document.addEventListener("DOMContentLoaded", unlockShelves);
    }
  } catch (error) {}
  if (!document.getElementById("ft-early-open-style")) {
    var style = document.createElement("style");
    style.id = "ft-early-open-style";
    style.textContent = "html body [data-early-open]>.dropdown-menu,html body [data-early-open]>.dropdown-menu[hidden]{display:block!important;visibility:visible!important;opacity:1!important}" + "html[data-early-door] .leftcurtain{transform:translateX(-100%);visibility:hidden;pointer-events:none;transition:none;will-change:auto}" + "html[data-early-door] .rightcurtain{transform:translateX(100%);visibility:hidden;pointer-events:none;transition:none;will-change:auto}" + "html[data-early-door] .rope{visibility:hidden;pointer-events:none;transition:none}";
    (document.head || document.documentElement).appendChild(style);
  }
  var replay = function() {
    if (!pending)
      return;
    var target = locate(pending);
    if (target && ready(target)) {
      pending = null;
      setTimeout(function() {
        clearEarly();
        target.click();
      }, 0);
      return;
    }
    if (Date.now() - pending.started > 20000) {
      pending = null;
      clearEarly();
      return;
    }
    setTimeout(replay, 50);
  };
  document.addEventListener("click", function(event) {
    var origin = event.target;
    if (!origin || !origin.closest)
      return;
    var control = origin.closest(SELECTOR);
    if (!control || ready(control))
      return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (control.closest(".leftcurtain,.rightcurtain,.rope"))
      openDoorEarly();
    var waiting = pending !== null;
    if (!showEarly(control)) {
      pending = null;
      return;
    }
    pending = { el: control, index: Array.prototype.indexOf.call(document.querySelectorAll(SELECTOR), control), text: control.textContent || "", started: Date.now() };
    if (!waiting)
      replay();
  }, true);
}

installEarlyTapQueue();
