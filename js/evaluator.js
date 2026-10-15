(function () {
  "use strict";

  const STORE_KEY = "logicChallenge_evaluator_v1";
  const el = (id) => document.getElementById(id);

  // store[participantKey] = { submission: {...}, scores: {problemId: {critKey: num}}, feedback: {...} }
  let store = loadStore();
  let activeKey = null;

  function loadStore() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return {};
  }

  function persistStore() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* ignore */ }
  }

  function keyFor(submission) {
    return (submission.participant.name + "__" + submission.participant.team + "__" + submission.startedAt)
      .toLowerCase().replace(/\s+/g, "_");
  }

  // ---- file loading ----------------------------------------------------------

  const dropZone = el("dropZone");
  const fileInput = el("fileInput");

  dropZone.addEventListener("click", () => fileInput.click());

  dropZone.addEventListener("dragover", (e) => { e.preventDefault(); dropZone.classList.add("drag-over"); });
  dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    handleFiles(e.dataTransfer.files);
  });

  fileInput.addEventListener("change", () => handleFiles(fileInput.files));

  function handleFiles(fileList) {
    Array.from(fileList).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const submission = JSON.parse(reader.result);
          if (!submission.participant || !submission.problems) {
            alert(file.name + " doesn't look like a Logic Challenge submission file.");
            return;
          }
          const key = keyFor(submission);
          if (!store[key]) {
            store[key] = { submission, scores: {}, feedback: {} };
          } else {
            store[key].submission = submission; // refresh in case re-loaded
          }
          persistStore();
          renderRoster();
          if (!activeKey) selectParticipant(key);
        } catch (e) {
          alert("Could not read " + file.name + " — is it a valid exported JSON file?");
        }
      };
      reader.readAsText(file);
    });
    fileInput.value = "";
  }

  // ---- scoring helpers ---------------------------------------------------------

  function problemTotal(entry, problemId) {
    const s = (entry.scores[problemId]) || {};
    return RUBRIC_CRITERIA.reduce((sum, c) => sum + (Number(s[c.key]) || 0), 0);
  }

  function grandTotal(entry) {
    return PROBLEMS.reduce((sum, p) => sum + problemTotal(entry, p.id), 0);
  }

  const MAX_PER_PROBLEM = RUBRIC_CRITERIA.reduce((s, c) => s + c.max, 0); // 20
  const MAX_TOTAL = MAX_PER_PROBLEM * PROBLEMS.length; // 100

  // ---- roster --------------------------------------------------------------------

  function renderRoster() {
    const keys = Object.keys(store);
    const roster = el("roster");
    if (!keys.length) {
      roster.innerHTML = '<div class="roster-empty">No submissions loaded yet.</div>';
      return;
    }
    roster.innerHTML = "";
    keys
      .sort((a, b) => store[a].submission.participant.name.localeCompare(store[b].submission.participant.name))
      .forEach((key) => {
        const entry = store[key];
        const sub = entry.submission;
        const div = document.createElement("div");
        div.className = "roster-item" + (key === activeKey ? " active" : "");
        div.innerHTML =
          '<div class="r-name">' + escapeHtml(sub.participant.name) + "</div>" +
          '<div class="r-meta">' + escapeHtml(sub.participant.team) + " &middot; " + escapeHtml(sub.durationLabel || "") + "</div>" +
          '<div class="r-score">' + grandTotal(entry) + " / " + MAX_TOTAL + " marks</div>";
        div.addEventListener("click", () => selectParticipant(key));
        roster.appendChild(div);
      });
  }

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // ---- detail / scoring panel ------------------------------------------------------

  function selectParticipant(key) {
    activeKey = key;
    renderRoster();
    renderDetail();
  }

  function renderDetail() {
    const panel = el("detailPanel");
    if (!activeKey || !store[activeKey]) {
      panel.innerHTML = '<div class="detail-empty">Load one or more submission files, then select a participant on the left to review and score their answers.</div>';
      return;
    }
    const entry = store[activeKey];
    const sub = entry.submission;

    panel.innerHTML = "";

    const top = document.createElement("div");
    top.className = "detail-top";
    top.innerHTML =
      '<div><h2>' + escapeHtml(sub.participant.name) + '</h2>' +
      '<div class="detail-meta">' + escapeHtml(sub.participant.team) +
      ' &middot; started ' + new Date(sub.startedAt).toLocaleString() +
      ' &middot; took ' + escapeHtml(sub.durationLabel || "") + '</div></div>' +
      '<div class="total-badge" id="grandTotalBadge">' + grandTotal(entry) + ' / ' + MAX_TOTAL + '<small>total marks</small></div>';
    panel.appendChild(top);

    PROBLEMS.forEach((p) => {
      const subProblem = sub.problems.find((x) => x.id === p.id) || { answers: [], bonusAnswer: "" };

      const block = document.createElement("div");
      block.className = "eval-problem";

      const h = document.createElement("h3");
      h.textContent = "Problem " + p.id + " — " + p.title;
      block.appendChild(h);
      const sub2 = document.createElement("div");
      sub2.className = "ep-sub";
      sub2.textContent = p.focus.join(" · ");
      block.appendChild(sub2);

      (subProblem.answers || []).forEach((qa) => {
        const qaDiv = document.createElement("div");
        qaDiv.className = "eval-qa";
        const qDiv = document.createElement("div");
        qDiv.className = "q";
        qDiv.textContent = qa.question;
        qaDiv.appendChild(qDiv);
        const aDiv = document.createElement("div");
        aDiv.className = "a" + (qa.answer && qa.answer.trim() ? "" : " empty");
        aDiv.textContent = qa.answer && qa.answer.trim() ? qa.answer : "(left blank)";
        qaDiv.appendChild(aDiv);
        block.appendChild(qaDiv);
      });

      if (subProblem.bonusAnswer && subProblem.bonusAnswer.trim()) {
        const qaDiv = document.createElement("div");
        qaDiv.className = "eval-qa";
        qaDiv.innerHTML = '<div class="q">Bonus: ' + escapeHtml(subProblem.bonusQuestion || "") + '</div>';
        const aDiv = document.createElement("div");
        aDiv.className = "a";
        aDiv.textContent = subProblem.bonusAnswer;
        qaDiv.appendChild(aDiv);
        block.appendChild(qaDiv);
      }

      // rubric
      const rubricDiv = document.createElement("div");
      rubricDiv.className = "rubric";
      if (!entry.scores[p.id]) entry.scores[p.id] = {};

      RUBRIC_CRITERIA.forEach((c) => {
        const row = document.createElement("div");
        row.className = "rubric-row";
        const label = document.createElement("div");
        label.textContent = c.label;
        const select = document.createElement("select");
        for (let v = 0; v <= c.max; v++) {
          const opt = document.createElement("option");
          opt.value = v;
          opt.textContent = v + " / " + c.max;
          if ((entry.scores[p.id][c.key] || 0) === v) opt.selected = true;
          select.appendChild(opt);
        }
        select.addEventListener("change", () => {
          entry.scores[p.id][c.key] = Number(select.value);
          persistStore();
          updateTotals();
        });
        row.appendChild(label);
        row.appendChild(select);
        rubricDiv.appendChild(row);
      });

      const rowTotal = document.createElement("div");
      rowTotal.className = "rubric-total";
      rowTotal.id = "problemTotal_" + p.id;
      rowTotal.textContent = "Problem total: " + problemTotal(entry, p.id) + " / " + MAX_PER_PROBLEM;
      rubricDiv.appendChild(rowTotal);

      block.appendChild(rubricDiv);
      panel.appendChild(block);
    });

    // overall feedback
    const fbWrap = document.createElement("div");
    fbWrap.className = "feedback-grid";
    fbWrap.innerHTML = '<div class="section-label" style="margin-bottom:14px;">Overall feedback</div>';
    const fields = [
      ["strengths", "Strengths observed"],
      ["improve", "Areas to improve"],
      ["bestReasoning", "Best reasoning or question raised"],
      ["followUp", "Suggested follow-up activity"],
    ];
    fields.forEach(([key, label]) => {
      const fdiv = document.createElement("div");
      fdiv.className = "feedback-field";
      const l = document.createElement("label");
      l.textContent = label;
      const ta = document.createElement("textarea");
      ta.value = entry.feedback[key] || "";
      ta.addEventListener("input", () => {
        entry.feedback[key] = ta.value;
        persistStore();
      });
      fdiv.appendChild(l);
      fdiv.appendChild(ta);
      fbWrap.appendChild(fdiv);
    });
    panel.appendChild(fbWrap);

    // actions
    const actions = document.createElement("div");
    actions.className = "eval-actions";
    const btnExport = document.createElement("button");
    btnExport.className = "btn btn--brass";
    btnExport.textContent = "Export scorecard (this participant)";
    btnExport.addEventListener("click", () => exportScorecard(entry));
    const btnExportAll = document.createElement("button");
    btnExportAll.className = "btn btn--ghost";
    btnExportAll.textContent = "Export summary CSV (all loaded)";
    btnExportAll.addEventListener("click", exportSummaryCSV);
    actions.appendChild(btnExport);
    actions.appendChild(btnExportAll);
    panel.appendChild(actions);
  }

  function updateTotals() {
    const entry = store[activeKey];
    PROBLEMS.forEach((p) => {
      const node = el("problemTotal_" + p.id);
      if (node) node.textContent = "Problem total: " + problemTotal(entry, p.id) + " / " + MAX_PER_PROBLEM;
    });
    const badge = el("grandTotalBadge");
    if (badge) badge.innerHTML = grandTotal(entry) + ' / ' + MAX_TOTAL + '<small>total marks</small>';
    renderRoster();
  }

  // ---- exports ---------------------------------------------------------------------

  function downloadBlob(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function exportScorecard(entry) {
    const sub = entry.submission;
    const out = {
      participant: sub.participant,
      startedAt: sub.startedAt,
      submittedAt: sub.submittedAt,
      durationLabel: sub.durationLabel,
      scoresByProblem: PROBLEMS.map((p) => ({
        problem: p.title,
        criteria: RUBRIC_CRITERIA.map((c) => ({ label: c.label, score: (entry.scores[p.id] || {})[c.key] || 0, max: c.max })),
        total: problemTotal(entry, p.id),
        maxTotal: MAX_PER_PROBLEM,
      })),
      grandTotal: grandTotal(entry),
      maxGrandTotal: MAX_TOTAL,
      feedback: entry.feedback,
    };
    const safeName = sub.participant.name.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "");
    downloadBlob(JSON.stringify(out, null, 2), "Scorecard_" + safeName + ".json", "application/json");
  }

  function exportSummaryCSV() {
    const keys = Object.keys(store);
    if (!keys.length) { alert("No submissions loaded."); return; }
    const header = ["Name", "Team", "Duration", ...PROBLEMS.map((p) => "P" + p.id + " total"), "Grand total", "Out of"];
    const rows = [header];
    keys.forEach((key) => {
      const entry = store[key];
      const sub = entry.submission;
      const row = [
        sub.participant.name,
        sub.participant.team,
        sub.durationLabel || "",
        ...PROBLEMS.map((p) => problemTotal(entry, p.id)),
        grandTotal(entry),
        MAX_TOTAL,
      ];
      rows.push(row);
    });
    const csv = rows.map((r) => r.map((cell) => '"' + String(cell).replace(/"/g, '""') + '"').join(",")).join("\r\n");
    downloadBlob(csv, "LogicChallenge_Summary.csv", "text/csv");
  }

  // ---- boot --------------------------------------------------------------------------

  renderRoster();
  renderDetail();
})();
