(function (global) {
  "use strict";

  // 意味の説明を出したい語を登録する。
  // 漢字を含む語（ふりがなが振られる語）は furigana.js の辞書エントリと表記を一致させること。
  // カタカナ・ひらがなだけの語（シャンポン等）はここに書くだけで自動的に検出される。
  var GLOSSARY = {
    "待ち方": "あと1枚がそろえば和了れる状態の、その最後の1枚の待ち方の種類のこと。",
    "両面": "例：3・4を持っていて2か5を待つように、隣り合う2枚から両側の牌で和了れる待ち方。",
    "シャンポン": "同じ牌の対子が2組ある状態から、どちらかが刻子になるのを待つ形。",
    "嵌張": "3・5を持っていて間の4を待つように、真ん中の1種類の牌だけを待つ形。",
    "辺張": "1・2を持っていて3を待つように、端の並びで1種類の牌だけを待つ形。",
    "単騎": "頭（対子）の片方だけが手の中にあり、もう1枚が出てくるのを待つ形。",
    "和了り方": "ツモ和了りかロン和了りか、鳴いているかいないかの組み合わせのこと。",
    "門前": "ポン・チー・明槓を一度もしていない、鳴いていない状態のこと。",
    "副露": "ポン・チー・明槓など、他の人の牌を使って面子を作ること。「鳴く」ともいう。",
    "雀頭": "同じ牌が2枚そろって「頭」になっている部分。",
    "頭": "同じ牌が2枚そろって対子になっている部分。「雀頭」ともいう。",
    "客風牌": "自分の風でも場の風でもない、役がつかない風牌。",
    "役牌": "三元牌・自風・場風など、刻子や槓子にすると役がつく牌。",
    "三元牌": "白・發・中の3種類の字牌のこと。",
    "自風": "自分の座席の風（東・南・西・北のいずれか）にあたる牌。",
    "場風": "その局の場（東場・南場など）にあたる風牌。",
    "面子": "3枚（槓子は4枚）そろった牌のかたまり。順子・刻子・槓子の総称。",
    "明刻": "ポンなど、他家の牌をもらって完成させた刻子。",
    "暗刻": "誰の牌も使わず、自分の手の中だけで完成させた刻子。",
    "明槓": "ポンと同じく、鳴いて完成させた槓子。",
    "暗槓": "誰の牌も使わず、自分の手の中だけで完成させた槓子。",
    "中張牌": "2〜8の数牌のこと。端でも字牌でもない牌。",
    "么九牌": "1・9の数牌と、すべての字牌をまとめた呼び方。",
    "順子": "同じ種類の数牌が3つ連続した面子（例：2・3・4）。符はつかない。",
    "刻子": "同じ牌が3枚そろった面子。",
    "槓子": "同じ牌が4枚そろった面子。",
    "副底": "どんな手でも必ずもらえる、符計算のベースになる20符のこと。"
  };

  var tipEl = null;
  var currentTarget = null;

  function ensureTip() {
    if (tipEl) return tipEl;
    tipEl = document.createElement("div");
    tipEl.className = "gloss-tip";
    tipEl.setAttribute("role", "tooltip");
    document.body.appendChild(tipEl);
    return tipEl;
  }

  function hideTip() {
    if (tipEl) tipEl.classList.remove("show");
    currentTarget = null;
  }

  function showTip(target, key, def) {
    var tip = ensureTip();
    tip.innerHTML = "<strong>" + key + "</strong><span>" + def + "</span>";
    tip.classList.add("show");
    tip.style.left = "0px";
    tip.style.top = "0px";

    var r = target.getBoundingClientRect();
    var tw = tip.offsetWidth;
    var th = tip.offsetHeight;
    var left = r.left;
    var top = r.bottom + 8;

    if (left + tw > window.innerWidth - 12) left = window.innerWidth - tw - 12;
    if (left < 12) left = 12;
    if (top + th > window.innerHeight - 12) top = r.top - th - 8;

    tip.style.left = left + "px";
    tip.style.top = top + "px";
    currentTarget = target;
  }

  document.addEventListener("click", function (ev) {
    if (!currentTarget) return;
    if (currentTarget.contains(ev.target)) return;
    if (tipEl && tipEl.contains(ev.target)) return;
    hideTip();
  });
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") hideTip();
  });
  window.addEventListener("scroll", hideTip, true);

  function bindTerm(el, key, def) {
    el.classList.add("gloss");
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", key + "の説明を見る");
    el.addEventListener("click", function (ev) {
      ev.stopPropagation();
      if (currentTarget === el) { hideTip(); return; }
      showTip(el, key, def);
    });
    el.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        el.click();
      }
    });
  }

  // --- パス1: すでに <ruby> になっている語（漢字を含む語）にクリック機能を付ける ---
  function applyRuby(root) {
    var rubies = root.querySelectorAll("ruby");
    rubies.forEach(function (r) {
      if (r.dataset.glossBound) return;
      var baseNode = r.childNodes[0];
      var key = baseNode && baseNode.nodeType === 3 ? baseNode.nodeValue : "";
      var def = GLOSSARY[key];
      if (!def) return;
      r.dataset.glossBound = "1";
      bindTerm(r, key, def);
    });
  }

  // --- パス2: ルビが付かない語（カタカナ・ひらがなのみ）をテキストから直接検出する ---
  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  var TEXT_KEYS = Object.keys(GLOSSARY).sort(function (a, b) { return b.length - a.length; });
  var TEXT_PATTERN = new RegExp(TEXT_KEYS.map(escapeRegExp).join("|"), "g");

  function shouldSkipText(node) {
    var p = node.parentNode;
    while (p) {
      if (p.nodeType === 1) {
        var tag = p.tagName;
        if (tag === "RUBY" || tag === "RT" || tag === "SCRIPT" || tag === "STYLE") return true;
        if (p.classList && p.classList.contains("gloss")) return true;
        if (p.hasAttribute && p.hasAttribute("data-no-furigana")) return true;
      }
      p = p.parentNode;
    }
    return false;
  }

  function applyText(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var targets = [];
    var n;
    while ((n = walker.nextNode())) {
      if (!n.nodeValue) continue;
      TEXT_PATTERN.lastIndex = 0;
      if (!TEXT_PATTERN.test(n.nodeValue)) continue;
      if (shouldSkipText(n)) continue;
      targets.push(n);
    }
    targets.forEach(function (textNode) {
      var text = textNode.nodeValue;
      TEXT_PATTERN.lastIndex = 0;
      var frag = document.createDocumentFragment();
      var lastIndex = 0;
      var m;
      while ((m = TEXT_PATTERN.exec(text))) {
        if (m.index > lastIndex) {
          frag.appendChild(document.createTextNode(text.slice(lastIndex, m.index)));
        }
        var span = document.createElement("span");
        span.textContent = m[0];
        bindTerm(span, m[0], GLOSSARY[m[0]]);
        frag.appendChild(span);
        lastIndex = m.index + m[0].length;
      }
      if (lastIndex < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex)));
      }
      textNode.parentNode.replaceChild(frag, textNode);
    });
  }

  function apply(root) {
    root = root || document.body;
    applyRuby(root);
    applyText(root);
  }

  global.Glossary = { apply: apply };
})(window);
