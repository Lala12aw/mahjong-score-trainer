(function(){
  "use strict";

  var WAITS = [
    { label:"両面待ち", fu:0 },
    { label:"シャンポン待ち", fu:0 },
    { label:"嵌張待ち", fu:2 },
    { label:"辺張待ち", fu:2 },
    { label:"単騎待ち", fu:2 }
  ];

  var WIN_METHODS = [
    { label:"ロン・門前", fu:10 },
    { label:"ロン・副露あり", fu:0 }
  ];

  var HEADS = [
    { label:"数牌・客風の頭", fu:0 },
    { label:"役牌の頭", fu:2 }
  ];

  var MELDS = [
    { label:"面子はすべて順子", fu:0 },
    { label:"明刻（中張牌）が1つ", fu:2 },
    { label:"暗刻（中張牌）が1つ", fu:4 },
    { label:"明刻（么九牌）が1つ", fu:4 },
    { label:"暗刻（么九牌）が1つ", fu:8 },
    { label:"明槓（中張牌）が1つ", fu:8 },
    { label:"暗槓（中張牌）が1つ", fu:16 },
    { label:"明槓（么九牌）が1つ", fu:16 },
    { label:"暗槓（么九牌）が1つ", fu:32 }
  ];

  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

  function shuffle(arr){
    var a = arr.slice();
    for (var i=a.length-1;i>0;i--){
      var j = Math.floor(Math.random()*(i+1));
      var t=a[i]; a[i]=a[j]; a[j]=t;
    }
    return a;
  }

  function fmt(n){ return n.toLocaleString("ja-JP") + "点"; }
  function roundUp10(n){ return Math.ceil(n/10)*10; }
  function roundUp100(n){ return Math.ceil(n/100)*100; }

  function calcFu(wait, method, head, meld){
    var raw = 20 + wait.fu + method.fu + head.fu + meld.fu;
    return roundUp10(raw);
  }

  function calcScore(fu, han, isDealer){
    var base = fu * Math.pow(2, 2 + han);
    var mangan = false;
    if (base > 2000){ base = 2000; mangan = true; }
    if (mangan){
      return { score: isDealer ? 12000 : 8000, base: base, mangan: true };
    }
    var mult = isDealer ? 6 : 4;
    return { score: roundUp100(base * mult), base: base, mangan: false };
  }

  var STORE_KEY = "step3-drill-stats-v1";
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
    var han = 1 + Math.floor(Math.random()*4); // 1..4
    var isDealer = Math.random() < 0.5;
    var wait = pick(WAITS);
    var method = pick(WIN_METHODS);
    var head = pick(HEADS);
    var meld = pick(MELDS);

    var fu = calcFu(wait, method, head, meld);
    var result = calcScore(fu, han, isDealer);
    var correct = result.score;

    // 距離のある誤答候補を作る：翻違い・符の切り上げ忘れ・役割違い
    var distractorPool = [];
    var rawFu = 20 + wait.fu + method.fu + head.fu + meld.fu;
    if (rawFu !== fu){
      var noRound = calcScore(rawFu, han, isDealer).score;
      distractorPool.push(noRound);
    }
    [han-1, han+1].forEach(function(h){
      if (h >= 1){
        distractorPool.push(calcScore(fu, h, isDealer).score);
      }
    });
    distractorPool.push(calcScore(fu, han, !isDealer).score);
    [fu-10, fu+10].forEach(function(f){
      if (f >= 20){
        distractorPool.push(calcScore(f, han, isDealer).score);
      }
    });

    var distractors = [];
    shuffle(distractorPool).forEach(function(v){
      if (distractors.length < 3 && v !== correct && distractors.indexOf(v) === -1) {
        distractors.push(v);
      }
    });
    // 万一候補が足りない場合の保険
    var fallback = [correct + 100, correct - 100, correct * 2];
    var fi = 0;
    while (distractors.length < 3 && fi < fallback.length){
      var v = fallback[fi++];
      if (v > 0 && v !== correct && distractors.indexOf(v) === -1) distractors.push(v);
    }

    var choices = shuffle([correct].concat(distractors));

    current = {
      han:han, isDealer:isDealer, wait:wait, method:method, head:head, meld:meld,
      fu:fu, rawFu:rawFu, base:result.base, mangan:result.mangan, correct:correct, answered:false
    };

    document.getElementById("roleBadge").textContent = isDealer ? "親" : "子";
    document.getElementById("hanBadge").textContent = han + "翻";
    document.getElementById("hsWait").textContent = wait.label;
    document.getElementById("hsMethod").textContent = method.label;
    document.getElementById("hsHead").textContent = head.label;
    document.getElementById("hsMeld").textContent = meld.label;

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

    var roleLabel = current.isDealer ? "親" : "子";
    var fuLine = current.rawFu === current.fu
      ? current.fu + "符"
      : current.rawFu + "符 → 切り上げ" + current.fu + "符";
    var baseLine = current.mangan
      ? current.fu + "符 × 2^(2+" + current.han + "翻) は2000を超えるため満貫（頭打ち）"
      : current.fu + "符 × 2^(2+" + current.han + "翻) = " + current.base;

    var fb = document.getElementById("feedback");
    fb.className = "feedback " + (isCorrect ? "ok" : "ng");
    fb.innerHTML =
      "<div>" +
        "<div class=\"fb-title\">" + (isCorrect ? "正解！" : "おしい") + "</div>" +
        (isCorrect ? "" : "正解は " + fmt(current.correct)) +
        "<div class=\"fb-breakdown\">" +
          "符の内訳: 20+" + current.wait.fu + "+" + current.method.fu + "+" + current.head.fu + "+" + current.meld.fu + " = " + fuLine + "<br>" +
          baseLine + "<br>" +
          roleLabel + "・ロン: " + fmt(current.correct) +
        "</div>" +
      "</div>";

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
