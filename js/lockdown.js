// Copy/inspect deterrents for the exam screen.
//
// Honest limit: none of this can stop someone from reading a question with
// their own eyes and retyping it elsewhere, or photographing the screen with
// a second device — no web page can prevent that. This only raises the bar
// against the casual one-click path (select-all, right-click copy, Ctrl+C,
// view-source, DevTools) so the question text can't be lifted automatically.

(function () {
  "use strict";

  function isFormField(target) {
    return !!target && (target.tagName === "TEXTAREA" || target.tagName === "INPUT");
  }

  document.addEventListener("contextmenu", (e) => e.preventDefault());
  document.addEventListener("dragstart", (e) => e.preventDefault());

  document.addEventListener("copy", (e) => { if (!isFormField(e.target)) e.preventDefault(); });
  document.addEventListener("cut", (e) => { if (!isFormField(e.target)) e.preventDefault(); });
  document.addEventListener("selectstart", (e) => { if (!isFormField(e.target)) e.preventDefault(); });

  // Block common shortcuts for view-source, save-page, print, and DevTools.
  document.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    const blocked =
      e.key === "F12" ||
      (e.ctrlKey && !e.altKey && !e.shiftKey && ["u", "s", "p"].includes(k)) ||
      (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(k)) ||
      (e.metaKey && e.altKey && ["i", "j", "c"].includes(k)); // Mac Cmd+Opt+I/J/C
    if (blocked) e.preventDefault();
  });

  // Heuristic DevTools-open detector: when DevTools docks inside the browser
  // window, the gap between the outer window size and the inner viewport
  // grows sharply. Shows a blocking overlay until it closes again. This is a
  // deterrent, not a guarantee — an undocked DevTools window, some browsers,
  // or a second device pointed at the screen won't trigger it.
  const GAP_THRESHOLD = 160;

  function checkDevTools() {
    const overlay = document.getElementById("devtoolsWarning");
    if (!overlay) return;
    const widthGap = window.outerWidth - window.innerWidth;
    const heightGap = window.outerHeight - window.innerHeight;
    const open = widthGap > GAP_THRESHOLD || heightGap > GAP_THRESHOLD;
    overlay.style.display = open ? "flex" : "none";
  }

  setInterval(checkDevTools, 1000);
  window.addEventListener("resize", checkDevTools);
})();
