(function () {
  "use strict";

  const STORAGE_KEY = "logicChallenge_submission_v1";
  const TOTAL_SECONDS = ASSESSMENT.totalMinutes * 60;

  const el = (id) => document.getElementById(id);

  // ---- state --------------------------------------------------------------

  function blankAnswers() {
    const out = {};
    PROBLEMS.forEach((p) => {
      out[p.id] = { q: p.questions.map(() => ""), bonus: "" };
    });
    return out;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* corrupt or blocked storage: start fresh */ }
    return {
      name: "",
      email: "",
      team: "",
      startedAt: null,
      currentIndex: 0,
      answers: blankAnswers(),
      visited: [],
      submitted: false,
      submittedAt: null,
    };
  }

  let state = loadState();
  let saveTimer = null;

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      el("autosaveNote").textContent = "Saved " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch (e) {
      el("autosaveNote").textContent = "Could not autosave (storage unavailable) — remember to export often.";
    }
  }

  function persistDebounced() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persist, 350);
  }

  // ---- screen switching -----------------------------------------------------

  function showScreen(name) {
    ["start", "exam", "done"].forEach((s) => {
      el("screen-" + s).style.display = s === name ? "" : "none";
    });
    el("examBar").style.display = name === "exam" ? "" : "none";
  }

  // ---- START screen ----------------------------------------------------------

  function renderStart() {
    el("taglineText").textContent = ASSESSMENT.tagline;
    el("objectiveText").textContent = ASSESSMENT.objective;

    const ul = el("instructionsList");
    ul.innerHTML = "";
    ASSESSMENT.instructions.forEach((text) => {
      const li = document.createElement("li");
      li.textContent = text;
      ul.appendChild(li);
    });

    const strip = el("scheduleStrip");
    strip.innerHTML = "";
    PROBLEMS.forEach((p) => {
      const d = document.createElement("div");
      d.className = "slot";
      d.innerHTML = '<div class="num">' + p.id + "</div><div class=\"min\">" + ASSESSMENT.minutesPerProblem + " min</div>";
      strip.appendChild(d);
    });

    const nameSelect = el("inpName");
    nameSelect.innerHTML = '<option value="">— Select your name —</option>';
    EMPLOYEES.forEach((emp) => {
      const opt = document.createElement("option");
      opt.value = emp.email;
      opt.textContent = emp.name;
      nameSelect.appendChild(opt);
    });
    nameSelect.value = state.email || "";
    el("inpEmail").value = state.email || "";
    el("inpTeam").value = state.team || "";

    nameSelect.addEventListener("change", () => {
      const emp = EMPLOYEES.find((e) => e.email === nameSelect.value);
      el("inpEmail").value = emp ? emp.email : "";
    });
  }

  el("btnStart").addEventListener("click", () => {
    const selectedEmail = el("inpName").value;
    const team = el("inpTeam").value.trim();
    const emp = EMPLOYEES.find((e) => e.email === selectedEmail);

    if (!emp) {
      el("startError").textContent = "Please select your name from the list — this assessment is restricted to invited participants.";
      el("startError").style.display = "";
      return;
    }
    if (!team) {
      el("startError").textContent = "Please enter your team/department before starting.";
      el("startError").style.display = "";
      return;
    }
    el("startError").style.display = "none";
    state.name = emp.name;
    state.email = emp.email;
    state.team = team;
    if (!state.startedAt) state.startedAt = Date.now();
    persist();
    enterExam();
  });

  // ---- EXAM screen -------------------------------------------------------------

  function enterExam() {
    el("barName").textContent = state.name + " (" + state.email + ") · " + state.team;
    showScreen("exam");
    renderProgressRail();
    renderProblem(state.currentIndex);
    startClock();
  }

  function renderProgressRail() {
    const rail = el("progressRail");
    rail.innerHTML = "";
    PROBLEMS.forEach((p, i) => {
      const tab = document.createElement("div");
      let cls = "tab";
      if (i === state.currentIndex) cls += " current";
      else if (state.visited.includes(p.id)) cls += " done";
      tab.className = cls;
      tab.textContent = "Problem " + p.id;
      tab.style.cursor = "pointer";
      tab.addEventListener("click", () => {
        saveCurrentProblemVisited();
        state.currentIndex = i;
        persist();
        renderProgressRail();
        renderProblem(i);
      });
      rail.appendChild(tab);
    });
  }

  function saveCurrentProblemVisited() {
    const p = PROBLEMS[state.currentIndex];
    const a = state.answers[p.id];
    const hasContent = a.q.some((t) => t.trim()) || a.bonus.trim();
    if (hasContent && !state.visited.includes(p.id)) state.visited.push(p.id);
  }

  function renderProblem(index) {
    const p = PROBLEMS[index];
    const answers = state.answers[p.id];

    el("probNo").textContent = "Problem " + p.id + " of " + PROBLEMS.length;
    el("probTitle").textContent = p.title;

    const focusWrap = el("probFocus");
    focusWrap.innerHTML = "";
    p.focus.forEach((f) => {
      const s = document.createElement("span");
      s.textContent = f;
      focusWrap.appendChild(s);
    });

    el("probStatement").textContent = p.statement;

    const qWrap = el("questionsContainer");
    qWrap.innerHTML = "";
    p.questions.forEach((qtext, qi) => {
      const block = document.createElement("div");
      block.className = "question-block";

      const row = document.createElement("div");
      row.className = "q-row";
      const num = document.createElement("div");
      num.className = "q-num";
      num.textContent = qi + 1;
      const txt = document.createElement("div");
      txt.className = "q-text";
      txt.textContent = qtext;
      row.appendChild(num);
      row.appendChild(txt);
      block.appendChild(row);

      const ta = document.createElement("textarea");
      ta.value = answers.q[qi] || "";
      ta.placeholder = "Your reasoning...";
      ta.addEventListener("input", () => {
        state.answers[p.id].q[qi] = ta.value;
        persistDebounced();
      });
      block.appendChild(ta);

      qWrap.appendChild(block);
    });

    el("bonusText").textContent = p.bonus;
    const bonusTa = el("bonusAnswer");
    bonusTa.value = answers.bonus || "";
    bonusTa.oninput = () => {
      state.answers[p.id].bonus = bonusTa.value;
      persistDebounced();
    };

    const isLast = index === PROBLEMS.length - 1;
    el("btnNext").textContent = isLast ? "Submit assessment →" : "Next →";
    el("btnPrev").disabled = index === 0;

    el("autosaveNote").innerHTML = "&nbsp;";
  }

  el("btnPrev").addEventListener("click", () => {
    if (state.currentIndex === 0) return;
    saveCurrentProblemVisited();
    state.currentIndex -= 1;
    persist();
    renderProgressRail();
    renderProblem(state.currentIndex);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  el("btnNext").addEventListener("click", () => {
    saveCurrentProblemVisited();
    const isLast = state.currentIndex === PROBLEMS.length - 1;
    if (isLast) {
      submitAssessment();
      return;
    }
    state.currentIndex += 1;
    persist();
    renderProgressRail();
    renderProblem(state.currentIndex);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // ---- Timer -----------------------------------------------------------------

  let clockInterval = null;

  function startClock() {
    tickClock();
    clearInterval(clockInterval);
    clockInterval = setInterval(tickClock, 1000);
  }

  function tickClock() {
    const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
    const remaining = Math.max(0, TOTAL_SECONDS - elapsed);
    const m = Math.floor(remaining / 60).toString().padStart(2, "0");
    const s = (remaining % 60).toString().padStart(2, "0");
    const clockEl = el("clock");
    clockEl.textContent = m + ":" + s;
    clockEl.classList.toggle("low", remaining <= 120);
    if (remaining <= 0) {
      clockEl.textContent = "00:00";
      clearInterval(clockInterval);
    }
  }

  // ---- Submit / export ---------------------------------------------------------

  function submitAssessment() {
    state.submitted = true;
    state.submittedAt = Date.now();
    persist();
    clearInterval(clockInterval);

    const payload = buildExportPayload();
    const safeName = state.name.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "");
    const dateStr = new Date(state.submittedAt).toISOString().slice(0, 10);
    const filename = "LogicChallenge_" + safeName + "_" + dateStr + ".json";

    sendToSheet(payload);

    showScreen("done");
    el("filenameChip").textContent = filename;

    el("btnDownload").onclick = () => downloadJSON(payload, filename);
  }

  function buildExportPayload() {
    const durationSec = Math.round((state.submittedAt - state.startedAt) / 1000);
    return {
      assessment: ASSESSMENT.title + " " + ASSESSMENT.subtitle,
      participant: { name: state.name, email: state.email, team: state.team },
      startedAt: new Date(state.startedAt).toISOString(),
      submittedAt: new Date(state.submittedAt).toISOString(),
      durationSeconds: durationSec,
      durationLabel: Math.floor(durationSec / 60) + "m " + (durationSec % 60) + "s",
      problems: PROBLEMS.map((p) => ({
        id: p.id,
        title: p.title,
        answers: p.questions.map((qtext, qi) => ({
          question: qtext,
          answer: state.answers[p.id].q[qi] || "",
        })),
        bonusQuestion: p.bonus,
        bonusAnswer: state.answers[p.id].bonus || "",
      })),
    };
  }

  function sendToSheet(payload) {
    if (typeof SHEET_WEBHOOK_URL === "undefined" || !SHEET_WEBHOOK_URL) return;
    try {
      fetch(SHEET_WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      }).catch(() => { /* best-effort — the local download is the fallback */ });
    } catch (e) { /* fetch unavailable or blocked — local download still works */ }
  }

  function downloadJSON(obj, filename) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  // ---- boot ------------------------------------------------------------------

  renderStart();
  if (state.submitted) {
    const payload = buildExportPayload();
    const safeName = (state.name || "participant").replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "");
    const dateStr = new Date(state.submittedAt).toISOString().slice(0, 10);
    const filename = "LogicChallenge_" + safeName + "_" + dateStr + ".json";
    showScreen("done");
    el("filenameChip").textContent = filename;
    el("btnDownload").onclick = () => downloadJSON(payload, filename);
  } else if (state.startedAt) {
    enterExam();
  } else {
    showScreen("start");
  }
})();
