(function(){
  "use strict";

  var ITEMS = [
    { cat:"待ち方", text:"両面待ち", fu:0 },
    { cat:"待ち方", text:"シャンポン待ち", fu:0 },
    { cat:"待ち方", text:"嵌張待ち", fu:2 },
    { cat:"待ち方", text:"辺張待ち", fu:2 },
    { cat:"待ち方", text:"単騎待ち", fu:2 },

    { cat:"和了り方", text:"ツモ和了（通常時）", fu:2 },
    { cat:"和了り方", text:"ロン和了・門前", fu:10 },
    { cat:"和了り方", text:"ロン和了・副露あり（鳴きあり）", fu:0 },

    { cat:"頭（雀頭）", text:"数牌または客風牌の頭", fu:0 },
    { cat:"頭（雀頭）", text:"役牌（三元牌・自風・場風）の頭", fu:2 },

    { cat:"面子", text:"明刻（中張牌：2〜8）", fu:2 },
    { cat:"面子", text:"暗刻（中張牌：2〜8）", fu:4 },
    { cat:"面子", text:"明刻（么九牌：1・9・字牌）", fu:4 },
    { cat:"面子", text:"暗刻（么九牌：1・9・字牌）", fu:8 },
    { cat:"面子", text:"明槓（中張牌：2〜8）", fu:8 },
    { cat:"面子", text:"暗槓（中張牌：2〜8）", fu:16 },
    { cat:"面子", text:"明槓（么九牌：1・9・字牌）", fu:16 },
    { cat:"面子", text:"暗槓（么九牌：1・9・字牌）", fu:32 }
  ];

  var ALL_VALUES = Array.from(new Set(ITEMS.map(function(i){ return i.fu; })));

  function fmt(n){ return n + "符"; }

  function shuffle(arr){
    var a = arr.slice();
    for (var i=a.length-1;i>0;i--){
      var j = Math.floor(Math.random()*(i+1));
      var t=a[i]; a[i]=a[j]; a[j]=t;
    }
    return a;
  }

  var STORE_KEY = "fu-drill-stats-v1";
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
  var lastIndex = -1;

  function newQuestion(){
    var idx;
    do { idx = Math.floor(Math.random()*ITEMS.length); } while (idx === lastIndex && ITEMS.length > 1);
    lastIndex = idx;
    var item = ITEMS[idx];

    var sameCat = ITEMS.filter(function(i){ return i.cat===item.cat && i.fu!==item.fu; });
    var distractorPool = shuffle(sameCat).map(function(i){ return i.fu; });
    ALL_VALUES.forEach(function(v){ if (v!==item.fu && distractorPool.indexOf(v)===-1) distractorPool.push(v); });

    var distractors = [];
    distractorPool.forEach(function(v){
      if (distractors.length<3 && v!==item.fu && distractors.indexOf(v)===-1) distractors.push(v);
    });

    var choices = shuffle([item.fu].concat(distractors));

    current = { item:item, correct:item.fu, answered:false };

    document.getElementById("catBadge").textContent = item.cat;
    document.getElementById("qText").textContent = item.text;

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
    Glossary.apply(document.querySelector(".qcard"));
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
    fb.innerHTML = isCorrect
      ? "<div><div class=\"fb-title\">正解！</div>" + current.item.text + "＝" + fmt(current.correct) + "</div>"
      : "<div><div class=\"fb-title\">おしい</div>正解は " + fmt(current.correct) + "（" + current.item.text + "）</div>";

    document.getElementById("nextBtn").classList.add("show");
    Furigana.apply(fb);
    Glossary.apply(fb);
  }

  document.getElementById("nextBtn").addEventListener("click", newQuestion);

  renderStats();
  newQuestion();
  Furigana.apply(document.body);
  Glossary.apply(document.body);
})();
