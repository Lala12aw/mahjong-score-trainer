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

  function calcBase(fu, han){
    var base = fu * Math.pow(2, 2 + han);
    var mangan = false;
    if (base > 2000){ base = 2000; mangan = true; }
    return { base: base, mangan: mangan };
  }

  function calcScore(fu, han, isDealer){
    var b = calcBase(fu, han);
    if (b.mangan){
      return { score: isDealer ? 12000 : 8000, base: b.base, mangan: true };
    }
    var mult = isDealer ? 6 : 4;
    return { score: roundUp100(b.base * mult), base: b.base, mangan: false };
  }

  // ツモ：子の和了りは「子が払う額-親が払う額」、親の和了りは「オール」で全員同額。
  function calcTsumoNonDealerWin(fu, han){
    var b = calcBase(fu, han).base;
    return { each: roundUp100(b), dealer: roundUp100(b * 2) };
  }
  function calcTsumoDealerWin(fu, han){
    var b = calcBase(fu, han).base;
    return { each: roundUp100(b * 2) };
  }

  var TABLE_FU = [20,25,30,40,50,60,70,80,90,100,110];
  var TABLE_HAN = [1,2,3,4];

  function renderScoreTable(){
    var body = document.getElementById("scoreTableBody");
    if (!body) return;
    body.innerHTML = "";
    TABLE_FU.forEach(function(fu){
      var tr = document.createElement("tr");
      var cells = "<td>" + fu + "符</td>";
      TABLE_HAN.forEach(function(han){
        var ko = calcScore(fu, han, false);
        var oya = calcScore(fu, han, true);
        var tsumoKo = calcTsumoNonDealerWin(fu, han);
        var tsumoOya = calcTsumoDealerWin(fu, han);
        var isLegendCell = (fu === TABLE_FU[0] && han === TABLE_HAN[0]);

        var ronPrefix = isLegendCell ? "ロン：" : "";
        var tsumoKoPrefix = isLegendCell ? "ツモ(子の時)：" : "";
        var tsumoOyaPrefix = isLegendCell ? "ツモ(親の時)：" : "";
        var koLabel = isLegendCell ? "子" : "";
        var oyaLabel = isLegendCell ? "親" : "";

        var ronLine = ko.mangan ? "満貫" : (ronPrefix + koLabel + fmt2(ko.score) + "／" + oyaLabel + fmt2(oya.score));
        var tsumoKoLine = tsumoKoPrefix + koLabel + fmt2(tsumoKo.each) + "・" + oyaLabel + fmt2(tsumoKo.dealer);
        var tsumoOyaLine = tsumoOyaPrefix + fmt2(tsumoOya.each) + "オール";
        cells += "<td>" +
          ronLine + "<br>" +
          "<span class=\"tsumo-line\">" + tsumoKoLine + "</span><br>" +
          "<span class=\"tsumo-line\">" + tsumoOyaLine + "</span>" +
        "</td>";
      });
      tr.innerHTML = cells;
      body.appendChild(tr);
    });
  }

  function fmt2(n){ return n.toLocaleString("ja-JP"); }

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

  // 各選択肢は「その符・翻の子/親両方の点数」を表示する。役割の取り違えで
  // 迷わないよう、選択肢自体に子と親の両方を書き、正誤はテキスト全体で判定する。
  function pairText(fu, han){
    var ko = calcScore(fu, han, false);
    var oya = calcScore(fu, han, true);
    return "子" + fmt(ko.score) + "／親" + fmt(oya.score);
  }

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
    var rawFu = 20 + wait.fu + method.fu + head.fu + meld.fu;

    var correctText = pairText(fu, han);

    // 距離のある誤答候補（別の符・翻の組み合わせ）を作る：
    // 符の切り上げ忘れ・翻違い・符違い。同じ符・翻の役割違いは正解と
    // 同じテキストになってしまうため候補にしない。
    var altPairs = [];
    function addAlt(f, h){
      if (f < 20 || h < 1 || (f === fu && h === han)) return;
      if (altPairs.some(function(p){ return p.fu === f && p.han === h; })) return;
      altPairs.push({ fu:f, han:h });
    }
    if (rawFu !== fu) addAlt(rawFu, han);
    addAlt(fu, han - 1);
    addAlt(fu, han + 1);
    addAlt(fu - 10, han);
    addAlt(fu + 10, han);

    var altTexts = [];
    shuffle(altPairs).forEach(function(p){
      var t = pairText(p.fu, p.han);
      if (t !== correctText && altTexts.indexOf(t) === -1) altTexts.push(t);
    });

    // 万一候補が足りない場合の保険（境界値付近など）
    var fallbackHan = [han + 2, han - 2, 1, 4];
    var fi = 0;
    while (altTexts.length < 3 && fi < fallbackHan.length){
      var fh = fallbackHan[fi++];
      if (fh >= 1){
        var ft = pairText(fu, fh);
        if (ft !== correctText && altTexts.indexOf(ft) === -1) altTexts.push(ft);
      }
    }

    var choiceTexts = shuffle([correctText].concat(altTexts.slice(0, 3)));

    current = {
      han:han, isDealer:isDealer, wait:wait, method:method, head:head, meld:meld,
      fu:fu, rawFu:rawFu, base:result.base, mangan:result.mangan, correct:correct,
      correctText:correctText, answered:false
    };

    document.getElementById("roleBadge").textContent = isDealer ? "親" : "子";
    document.getElementById("hanBadge").textContent = han + "翻";
    document.getElementById("hsWait").textContent = wait.label;
    document.getElementById("hsMethod").textContent = method.label;
    document.getElementById("hsHead").textContent = head.label;
    document.getElementById("hsMeld").textContent = meld.label;

    var wrap = document.getElementById("choices");
    wrap.innerHTML = "";
    choiceTexts.forEach(function(t){
      var btn = document.createElement("button");
      btn.className = "choice";
      btn.type = "button";
      btn.textContent = t;
      btn.addEventListener("click", function(){ onAnswer(t, btn); });
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
    var isCorrect = value === current.correctText;

    stats.total += 1;
    if (isCorrect){ stats.correct += 1; stats.streak += 1; }
    else { stats.streak = 0; }
    saveStats();
    renderStats();

    var buttons = document.querySelectorAll("#choices .choice");
    buttons.forEach(function(b){
      b.disabled = true;
      if (b.textContent === current.correctText) b.classList.add("correct");
      else if (b === btnEl) b.classList.add("wrong");
      else b.classList.add("dim");
    });

    var roleLabel = current.isDealer ? "親" : "子";
    var fuSumLine =
      "副底20符＋待ち方" + current.wait.fu + "符＋和了り方" + current.method.fu +
      "符＋頭" + current.head.fu + "符＋面子" + current.meld.fu + "符 ＝ " + current.rawFu + "符";
    var fuRoundLine = current.rawFu === current.fu
      ? "（10の位ちょうどなので切り上げなし）"
      : "→ 切り上げて " + current.fu + "符";
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
          fuSumLine + " " + fuRoundLine + "<br>" +
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
  renderScoreTable();
  newQuestion();
  Furigana.apply(document.body);
  Glossary.apply(document.body);
})();
