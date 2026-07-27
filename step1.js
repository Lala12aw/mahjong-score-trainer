(function(){
  "use strict";

  var BRACKETS = [
    { min:5,  max:5,  name:"満貫",   ko:8000,  oya:12000 },
    { min:6,  max:7,  name:"跳満",   ko:12000, oya:18000 },
    { min:8,  max:10, name:"倍満",   ko:16000, oya:24000 },
    { min:11, max:12, name:"三倍満", ko:24000, oya:36000 },
    { min:13, max:13, name:"役満",   ko:32000, oya:48000 }
  ];

  function bracketForHan(han){
    for (var i=0;i<BRACKETS.length;i++){
      if (han >= BRACKETS[i].min && han <= BRACKETS[i].max) return BRACKETS[i];
    }
    return BRACKETS[BRACKETS.length-1];
  }

  function fmt(n){ return n.toLocaleString("ja-JP") + "点"; }

  function uniqueValues(){
    var set = {};
    BRACKETS.forEach(function(b){ set[b.ko]=1; set[b.oya]=1; });
    return Object.keys(set).map(Number);
  }
  var ALL_VALUES = uniqueValues();

  function shuffle(arr){
    var a = arr.slice();
    for (var i=a.length-1;i>0;i--){
      var j = Math.floor(Math.random()*(i+1));
      var t=a[i]; a[i]=a[j]; a[j]=t;
    }
    return a;
  }

  var STORE_KEY = "hankei-drill-stats-v1";
  var stats = { correct:0, total:0, streak:0 };
  try {
    var saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (saved) stats = saved;
  } catch(e){}

  function saveStats(){
    try { localStorage.setItem(STORE_KEY, JSON.stringify(stats)); } catch(e){}
  }

  function renderStats(){
    document.getElementById("statCorrect").textContent = stats.correct;
    document.getElementById("statTotal").textContent = stats.total;
    document.getElementById("statStreak").textContent = stats.streak;
  }

  var current = null;

  function newQuestion(){
    var han = 5 + Math.floor(Math.random()*9); // 5..13
    var isDealer = Math.random() < 0.5;
    var bracket = bracketForHan(han);
    var correct = isDealer ? bracket.oya : bracket.ko;

    var distractorPool = [];
    distractorPool.push(isDealer ? bracket.ko : bracket.oya); // 役割違い
    var idx = BRACKETS.indexOf(bracket);
    if (BRACKETS[idx-1]) distractorPool.push(isDealer ? BRACKETS[idx-1].oya : BRACKETS[idx-1].ko);
    if (BRACKETS[idx+1]) distractorPool.push(isDealer ? BRACKETS[idx+1].oya : BRACKETS[idx+1].ko);
    ALL_VALUES.forEach(function(v){ if (v!==correct && distractorPool.indexOf(v)===-1) distractorPool.push(v); });

    var distractors = [];
    shuffle(distractorPool).forEach(function(v){
      if (distractors.length<3 && v!==correct && distractors.indexOf(v)===-1) distractors.push(v);
    });

    var choices = shuffle([correct].concat(distractors));

    current = { han:han, isDealer:isDealer, bracket:bracket, correct:correct, answered:false };

    document.getElementById("roleBadge").textContent = isDealer ? "親" : "子";
    document.getElementById("hanText").innerHTML = han + "<sup>翻</sup>";

    var wrap = document.getElementById("choices");
    wrap.innerHTML = "";
    choices.forEach(function(v){
      var btn = document.createElement("button");
      btn.className = "choice";
      btn.type = "button";
      btn.textContent = fmt(v);
      btn.addEventListener("click", function(){ onAnswer(v, btn); });
      wrap.appendChild(btn);
    });

    var fb = document.getElementById("feedback");
    fb.className = "feedback";
    fb.innerHTML = "";
    document.getElementById("nextBtn").classList.remove("show");

    Furigana.apply(document.querySelector(".qcard"));
  }

  function onAnswer(value, btnEl){
    if (current.answered) return;
    current.answered = true;
    var isCorrect = value === current.correct;

    stats.total += 1;
    if (isCorrect){ stats.correct += 1; stats.streak += 1; }
    else { stats.streak = 0; }
    saveStats();
    renderStats();

    var buttons = document.querySelectorAll("#choices .choice");
    buttons.forEach(function(b){
      b.disabled = true;
      var v = parseInt(b.textContent.replace(/[^0-9]/g,""),10);
      if (v === current.correct) b.classList.add("correct");
      else if (b === btnEl) b.classList.add("wrong");
      else b.classList.add("dim");
    });

    var fb = document.getElementById("feedback");
    fb.className = "feedback " + (isCorrect ? "ok" : "ng");
    var roleLabel = current.isDealer ? "親" : "子";
    fb.innerHTML = isCorrect
      ? "<div><div class=\"fb-title\">正解！</div>" + current.han + "翻（" + current.bracket.name + "）" + roleLabel + "のロンは " + fmt(current.correct) + "</div>"
      : "<div><div class=\"fb-title\">おしい</div>正解は " + fmt(current.correct) + "（" + current.han + "翻＝" + current.bracket.name + "、" + roleLabel + "）</div>";

    document.getElementById("nextBtn").classList.add("show");
    Furigana.apply(fb);
  }

  function renderRefTable(){
    var body = document.getElementById("refBody");
    body.innerHTML = "";
    BRACKETS.forEach(function(b){
      var label = b.min===b.max ? (b.min+"翻") : (b.min+"〜"+b.max+"翻");
      var tr = document.createElement("tr");
      tr.innerHTML = "<td>"+label+"</td><td>"+b.name+"</td><td>"+fmt(b.ko)+"</td><td>"+fmt(b.oya)+"</td>";
      body.appendChild(tr);
    });
  }

  document.getElementById("nextBtn").addEventListener("click", newQuestion);

  renderStats();
  renderRefTable();
  newQuestion();
  Furigana.apply(document.body);
  Glossary.apply(document.body);
})();
