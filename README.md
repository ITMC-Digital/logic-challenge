# Logic & System Design Challenge

A local, no-install assessment tool built from `Real_World_Logical_Thinking_System_Design_Challenge.docx`.
Pure HTML/CSS/JS — no server, no build step required. Only the optional Google Sheet
auto-save (see below) touches the network; everything else runs fully offline.

## Running it

Just open `index.html` in a browser (double-click the file, or right-click → Open with → your browser).

Works equally well served over your office LAN if you'd rather everyone hit one URL — any static file server works, e.g. from this folder:

```
python -m http.server 8080
```

then share `http://<your-machine-ip>:8080/` with the room.

## Restricting who can take it

Only the people listed in [`js/employees.js`](js/employees.js) can start the assessment —
on the start screen they pick their name from a dropdown (not free text), which locks in
their official email. Add, remove, or edit participants by editing that file directly;
no other setup is needed for this part.

## Centralized auto-save (optional but recommended)

By default, each submission only downloads a local `.json` file. To have every submission
also land automatically as a row in one shared Google Sheet you control — so you can see
who answered what without anyone emailing you a file — follow the one-time ~2 minute setup
in [`google-apps-script/SETUP.md`](google-apps-script/SETUP.md), then paste the resulting
URL into [`js/config.js`](js/config.js). Leave `js/config.js` as-is to skip this; the
download-a-file flow works either way.

## How it works

**Participants** (`index.html`): pick their name from the allowed list (email auto-fills),
enter their team, click Begin, and the 60-minute clock starts. They work through the 5
problems (8 questions + an optional bonus each, 12 minutes each), with everything autosaved
to their own browser as they type — a refresh or accidental tab close won't lose their
answers. On the last problem, "Submit" posts the answers to the Sheet (if configured) and
also generates a `LogicChallenge_<Name>_<date>.json` backup file for them to download.

**Grading**: there's no automatic scoring. Bring the collected submissions (the Sheet rows,
or the downloaded `.json` files) to a chat with Claude and go through them together — or
use `evaluator.html` below to self-score against the rubric.

**You, the evaluator** (`evaluator.html`): drop in everyone's exported `.json` files. Each
person shows up in the left-hand roster. Click one to see every question alongside their
actual answer, score each problem against the same 5-criteria rubric from the source
document (4 marks × 5 criteria = 20/problem, 100 total), and fill in the overall feedback
fields. Export a scorecard per person, or a summary CSV ranking everyone at once.

## Notes

- Apart from the optional Sheet auto-save POST, no data leaves the browser. Everyone's
  answers live in their own browser's local storage until they're exported or synced.
- Re-opening `index.html` mid-assessment resumes exactly where they left off (same browser,
  same machine) — the timer keeps counting from when they actually started.
- The evaluator dashboard also saves your scores locally as you enter them, so you can close
  and come back without re-scoring everyone from scratch.
