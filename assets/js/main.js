/* CS 663 Project 1 — shared page behavior (Gary Wu). No dependencies. */
document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", function () {
  setUpNavToggle();
  setUpNarration();
  setUpRunningTimeline();
  setUpModelExplorer();
});

/* ---------- Mobile navigation ---------- */

function setUpNavToggle() {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && nav.classList.contains("open")) {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.focus();
    }
  });
}

/* ---------- Narration: recorded audio + SpeechSynthesis test fallback ---------- */

function setUpNarration() {
  var audio = document.querySelector("[data-narration-audio]");
  var status = document.querySelector("[data-audio-status]");
  var speakBtn = document.querySelector("[data-speak]");
  var stopBtn = document.querySelector("[data-speak-stop]");
  var textEl = document.querySelector("[data-narration-text]");
  var fallback = document.querySelectorAll(".speech-controls, .speech-note");

  if (audio) {
    fallback.forEach(function (el) { el.style.display = "none"; });
  }

  if (audio && status) {
    var showMissing = function () {
      var file = audio.getAttribute("src");
      status.textContent =
        "The recorded narration file (" + file + ") could not be loaded. " +
        "You can use the browser voice button below to hear the script instead.";
      status.hidden = false;
      fallback.forEach(function (el) { el.style.display = ""; });
    };
    audio.addEventListener("error", showMissing);
    // The error event may fire before this script runs.
    if (audio.error || audio.networkState === 3) showMissing();
  }

  if (!speakBtn || !stopBtn || !textEl) return;

  if (!("speechSynthesis" in window)) {
    speakBtn.disabled = true;
    speakBtn.textContent = "Browser voice not supported here";
    return;
  }

  speakBtn.addEventListener("click", function () {
    window.speechSynthesis.cancel();
    if (audio && !audio.paused) audio.pause();
    var utterance = new SpeechSynthesisUtterance(textEl.textContent.replace(/\s+/g, " ").trim());
    utterance.rate = 1;
    utterance.lang = "en-US";
    utterance.onend = utterance.onerror = function () {
      stopBtn.disabled = true;
    };
    stopBtn.disabled = false;
    window.speechSynthesis.speak(utterance);
  });

  stopBtn.addEventListener("click", function () {
    window.speechSynthesis.cancel();
    stopBtn.disabled = true;
  });

  window.addEventListener("pagehide", function () {
    window.speechSynthesis.cancel();
  });
}

/* ---------- Interactive running-cycle timeline (movement-over-time.html) ---------- */

function setUpRunningTimeline() {
  var slider = document.getElementById("cycle-slider");
  if (!slider) return;

  // Illustrative proportions only; real phase durations change with speed and runner.
  var phases = [
    {
      id: "contact", start: 0, end: 6, name: "Initial contact",
      body: "The foot first touches the ground and the body begins to absorb the landing.",
      frame: "A single frame shows where the foot lands relative to the body and the knee angle at that instant.",
      sequence: "Only the sequence shows when contact begins, how quickly the landing is absorbed, and whether the previous swing led smoothly into it.",
      model: "A temporal model looks for the boundary where the label changes from swing to contact. This boundary is short and easy to miss at low frame rates."
    },
    {
      id: "stance", start: 6, end: 30, name: "Stance (loading and midstance)",
      body: "The foot stays on the ground while the body passes over it.",
      frame: "A frame at midstance shows posture: trunk lean, knee bend, and hip position.",
      sequence: "The sequence shows how long the foot stays on the ground and whether the body moves over the foot steadily or stalls.",
      model: "Duration is the key temporal feature here. Two runners can share the same midstance posture but spend very different amounts of time in stance."
    },
    {
      id: "pushoff", start: 30, end: 40, name: "Push-off (toe-off)",
      body: "The runner extends through the hip, knee, and ankle and the foot leaves the ground.",
      frame: "A frame shows leg extension at one moment, which may or may not be the moment of toe-off.",
      sequence: "The sequence reveals the exact transition from stance to swing and the order in which the joints extend.",
      model: "This is a transition event. Segmentation models often predict a transition probability so the boundary is placed precisely instead of drifting by a few frames."
    },
    {
      id: "swing", start: 40, end: 100, name: "Swing (including flight)",
      body: "The leg recovers forward. In running, part of swing is a flight phase where neither foot touches the ground.",
      frame: "A swing frame can look very similar to a frame from late stance or early contact of the other leg.",
      sequence: "The sequence shows the swing's rhythm, the flight time, and how the leg prepares for the next contact.",
      model: "Long-range models can compare this swing with earlier strides to check stride-to-stride consistency, which no single frame can show."
    }
  ];

  var bar = document.querySelectorAll("#cycle-bar span");
  var out = {
    pct: document.getElementById("cycle-pct"),
    name: document.getElementById("cycle-phase-name"),
    body: document.getElementById("cycle-body"),
    frame: document.getElementById("cycle-frame"),
    sequence: document.getElementById("cycle-sequence"),
    model: document.getElementById("cycle-model")
  };

  function update() {
    var value = Number(slider.value);
    var phase = phases[phases.length - 1];
    for (var i = 0; i < phases.length; i++) {
      if (value >= phases[i].start && value < phases[i].end) { phase = phases[i]; break; }
    }
    out.pct.textContent = value + "%";
    out.name.textContent = phase.name;
    out.body.textContent = phase.body;
    out.frame.textContent = phase.frame;
    out.sequence.textContent = phase.sequence;
    out.model.textContent = phase.model;
    slider.setAttribute("aria-valuetext", value + "% of the stride, " + phase.name);
    bar.forEach(function (span) {
      span.classList.toggle("active", span.getAttribute("data-phase") === phase.id);
    });
  }

  slider.addEventListener("input", update);
  update();
}

/* ---------- Interactive temporal-context explorer (temporal-methods.html) ---------- */

function setUpModelExplorer() {
  var row = document.getElementById("timestep-row");
  if (!row) return;

  var steps = 12;
  var state = { model: "tcn", target: 6 };
  var explain = document.getElementById("model-explain");
  var modelButtons = document.querySelectorAll("[data-model]");

  var descriptions = {
    tcn: "TCN: the output at the selected time step depends on a fixed window of nearby steps (here, three on each side, as if from stacked dilated convolutions). Steps outside the window have no direct influence. This suits short, local events such as a contact or push-off boundary.",
    lstm: "LSTM: the output depends on every earlier step through the hidden state, but older information has to survive many gate updates, so it tends to fade (lighter shading). Future steps are not used unless a second, backward LSTM is added.",
    transformer: "Transformer: self-attention lets the selected step look at every step in the sequence at once, including distant strides. The cost of comparing all pairs grows quickly as sequences get longer, and these models usually need more training data."
  };

  for (var i = 0; i < steps; i++) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "timestep";
    btn.textContent = "t" + (i + 1);
    btn.setAttribute("data-step", String(i));
    btn.addEventListener("click", function (event) {
      state.target = Number(event.currentTarget.getAttribute("data-step"));
      render();
    });
    row.appendChild(btn);
  }

  modelButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      state.model = button.getAttribute("data-model");
      render();
    });
  });

  function contextFor(step) {
    var d = Math.abs(step - state.target);
    if (step === state.target) return "target";
    if (state.model === "tcn") return d <= 3 ? "in" : "none";
    if (state.model === "lstm") {
      if (step > state.target) return "none";
      return d <= 3 ? "in" : "weak";
    }
    return "in";
  }

  function render() {
    var count = 0;
    row.querySelectorAll(".timestep").forEach(function (btn) {
      var step = Number(btn.getAttribute("data-step"));
      var c = contextFor(step);
      btn.classList.toggle("target", c === "target");
      btn.classList.toggle("in-context", c === "in");
      btn.classList.toggle("weak-context", c === "weak");
      var label = "Time step " + (step + 1);
      if (c === "target") label += ", selected output step";
      else if (c === "in") { label += ", strongly used"; count++; }
      else if (c === "weak") { label += ", weakly used"; count++; }
      else label += ", not used";
      btn.setAttribute("aria-label", label);
      btn.setAttribute("aria-pressed", c === "target" ? "true" : "false");
    });
    modelButtons.forEach(function (button) {
      button.setAttribute("aria-pressed", button.getAttribute("data-model") === state.model ? "true" : "false");
    });
    explain.textContent = descriptions[state.model] +
      " For step t" + (state.target + 1) + ", " + count + " of the other " + (steps - 1) + " steps contribute.";
  }

  render();
}
