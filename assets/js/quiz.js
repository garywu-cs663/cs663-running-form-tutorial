/* CS 663 Project 1 — three-question knowledge check (Gary Wu). */
(function () {
  var questions = [
    {
      topic: "Frame-based versus temporal analysis",
      prompt: "Two video frames show a runner with the same knee angle and trunk lean. What can a temporal model learn that a single-frame model cannot?",
      options: [
        { text: "The runner's exact body weight.", correct: false,
          why: "Neither frame-based nor temporal video models in this tutorial measure body weight, and estimating physical quantities is outside this tutorial's scope." },
        { text: "Whether the frame comes from stance or swing, and how long that phase lasts.", correct: true,
          why: "Correct. The same posture can occur in different phases. Looking at neighboring frames reveals which phase the runner is in, plus the duration and order of phases." },
        { text: "Nothing. If the posture is identical, the movement is identical.", correct: false,
          why: "Identical posture at one instant does not mean identical movement. Speed, duration, and the order of events can all differ between the two sequences." },
        { text: "The color of the runner's shoes more accurately.", correct: false,
          why: "Shoe color is an appearance detail that one frame already shows. It says nothing about movement over time." }
      ]
    },
    {
      topic: "TCNs, LSTMs, and transformers",
      prompt: "Which statement best describes how the three temporal models use context?",
      options: [
        { text: "All three look only at the current frame.", correct: false,
          why: "The whole point of these models is to use context from other time steps." },
        { text: "A TCN uses a fixed window of nearby steps; an LSTM carries a hidden state forward step by step; a transformer lets every step attend to every other step.", correct: true,
          why: "Correct. This is the core difference in how each model sees time, and it explains their strengths: local events (TCN), ordered memory (LSTM), and long-range relationships (transformer)." },
        { text: "Transformers can only look at the previous frame, while LSTMs look at the whole video at once.", correct: false,
          why: "This reverses them. Self-attention can relate all steps at once; an LSTM processes steps in order." },
        { text: "TCNs are recurrent networks that must process frames one at a time.", correct: false,
          why: "TCNs are convolutional. They process all time steps in parallel, which is one of their practical advantages over recurrent models." }
      ]
    },
    {
      topic: "Subjective quality labels",
      prompt: "Why are action-quality labels for running form harder to define than diving scores?",
      options: [
        { text: "Running has no movement phases.", correct: false,
          why: "Running has clear repeating phases. The difficulty is in deciding what counts as good execution within them." },
        { text: "Diving has an official judging system, while what counts as good running form depends on the runner's speed, goals, and body, and experts may disagree.", correct: true,
          why: "Correct. Diving datasets can use official judges' scores. Running has no single official rubric, so labels depend on who annotates and which goal they assume." },
        { text: "Running videos cannot be annotated by humans.", correct: false,
          why: "Humans can annotate running videos. The challenge is agreeing on what the labels should mean." },
        { text: "Quality labels are never subjective in any sport.", correct: false,
          why: "Even judged sports involve human judgment. Several AQA methods model this uncertainty instead of treating scores as perfectly objective." }
      ]
    }
  ];

  var root = document.getElementById("quiz");
  if (!root) return;

  var answered = [];
  var scoreEl = document.getElementById("quiz-score");
  var resetBtn = document.getElementById("quiz-reset");

  function build() {
    root.innerHTML = "";
    answered = questions.map(function () { return null; });

    questions.forEach(function (q, qi) {
      var fieldset = document.createElement("fieldset");
      fieldset.className = "quiz-question";

      var legend = document.createElement("legend");
      legend.textContent = "Question " + (qi + 1) + " of " + questions.length + ": " + q.topic;
      fieldset.appendChild(legend);

      var prompt = document.createElement("p");
      prompt.textContent = q.prompt;
      fieldset.appendChild(prompt);

      q.options.forEach(function (opt, oi) {
        var label = document.createElement("label");
        var input = document.createElement("input");
        input.type = "radio";
        input.name = "q" + qi;
        input.value = String(oi);
        input.addEventListener("change", function () { answer(qi, oi, fieldset); });
        label.appendChild(input);
        label.appendChild(document.createTextNode(opt.text));
        fieldset.appendChild(label);
      });

      var feedback = document.createElement("div");
      feedback.className = "quiz-feedback";
      feedback.setAttribute("aria-live", "polite");
      feedback.hidden = true;
      fieldset.appendChild(feedback);

      root.appendChild(fieldset);
    });

    updateScore();
  }

  function answer(qi, oi, fieldset) {
    if (answered[qi] !== null) return;
    var q = questions[qi];
    var chosen = q.options[oi];
    answered[qi] = chosen.correct;

    var labels = fieldset.querySelectorAll("label");
    labels.forEach(function (label, i) {
      label.querySelector("input").disabled = true;
      if (q.options[i].correct) label.classList.add("is-correct");
      else if (i === oi) label.classList.add("is-wrong");
    });

    var correctOpt = q.options.filter(function (o) { return o.correct; })[0];
    var feedback = fieldset.querySelector(".quiz-feedback");
    feedback.hidden = false;
    feedback.className = "quiz-feedback " + (chosen.correct ? "correct" : "incorrect");
    feedback.innerHTML = "";

    var head = document.createElement("strong");
    head.textContent = chosen.correct ? "Correct. " : "Not quite. ";
    feedback.appendChild(head);
    feedback.appendChild(document.createTextNode(chosen.correct ? chosen.why.replace(/^Correct\.\s*/, "") : chosen.why));

    if (!chosen.correct) {
      var p = document.createElement("p");
      p.style.margin = "0.5rem 0 0";
      p.textContent = "Correct answer: " + correctOpt.text + " " + correctOpt.why.replace(/^Correct\.\s*/, "");
      feedback.appendChild(p);
    }

    updateScore();
  }

  function updateScore() {
    var done = answered.filter(function (a) { return a !== null; }).length;
    var right = answered.filter(function (a) { return a === true; }).length;
    if (done < questions.length) {
      scoreEl.textContent = "Answered " + done + " of " + questions.length + ". Your final score will appear here.";
    } else {
      var msg = "Final score: " + right + " out of " + questions.length + ". ";
      if (right === questions.length) msg += "Excellent work. You have the main ideas of the tutorial.";
      else if (right >= 2) msg += "Good work. Review the explanation above for the question you missed.";
      else msg += "Consider revisiting Sections 1 through 4, then reset and try again.";
      scoreEl.textContent = msg;
    }
  }

  resetBtn.addEventListener("click", function () {
    build();
    var first = root.querySelector("input");
    if (first) first.focus();
  });

  build();
})();
