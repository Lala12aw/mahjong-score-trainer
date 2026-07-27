(function (global) {
  "use strict";

  // 漢字（熟語単位）→読み。長い語から先に判定するので、複合語と単漢字が
  // 両方登録されていても複合語が優先してルビ表示される。
  var DICT_ENTRIES = [
    ["翻計算", "はんけいさん"],
    ["点数計算", "てんすうけいさん"],
    ["点数早見表", "てんすうはやみひょう"],
    ["符計算", "ふけいさん"],
    ["丸暗記", "まるあんき"],
    ["半分", "はんぶん"],
    ["本来", "ほんらい"],
    ["大小", "だいしょう"],
    ["頭打ち", "あたまうち"],
    ["無視", "むし"],
    ["段階", "だんかい"],
    ["覚えれば", "おぼえれば"],
    ["覚えましょう", "おぼえましょう"],
    ["計算", "けいさん"],
    ["満貫", "まんがん"],
    ["跳満", "はねまん"],
    ["倍満", "ばいまん"],
    ["三倍満", "さんばいまん"],
    ["役満", "やくまん"],
    ["連続正解", "れんぞくせいかい"],
    ["出題数", "しゅつだいすう"],
    ["正解", "せいかい"],
    ["何点", "なんてん"],
    ["次の問題", "つぎのもんだい"],
    ["決まる", "きまる"],
    ["不要", "ふよう"],
    ["翻数", "はんすう"],
    ["名前", "なまえ"],
    ["自動", "じどう"],
    ["記録", "きろく"],
    ["何度", "なんど"],
    ["直せます", "なおせます"],
    ["部品", "ぶひん"],
    ["暗記", "あんき"],
    ["一覧", "いちらん"],
    ["見る", "みる"],
    ["必ず", "かならず"],
    ["副底", "ふーてい"],
    ["始まり", "はじまり"],
    ["以下", "いか"],
    ["足して", "たして"],
    ["足し算", "たしざん"],
    ["単体", "たんたい"],
    ["組み合わせて", "くみあわせて"],
    ["練習", "れんしゅう"],
    ["待ち方", "まちかた"],
    ["和了り方", "あがりかた"],
    ["和了った", "あがった"],
    ["和了", "あがり"],
    ["支払い", "しはらい"],
    ["両面", "りゃんめん"],
    ["嵌張", "カンチャン"],
    ["辺張", "ペンチャン"],
    ["単騎", "タンキ"],
    ["門前", "メンゼン"],
    ["副露", "フーロ"],
    ["鳴き", "なき"],
    ["鳴いた", "ないた"],
    ["通常時", "つうじょうじ"],
    ["雀頭", "ジャントウ"],
    ["客風牌", "オタカゼハイ"],
    ["数牌", "すうはい"],
    ["役牌", "やくはい"],
    ["三元牌", "さんげんぱい"],
    ["自風", "じかぜ"],
    ["場風", "ばかぜ"],
    ["么九牌", "ヤオチューハイ"],
    ["字牌", "じはい"],
    ["中張牌", "チュンチャンパイ"],
    ["明刻", "ミンコー"],
    ["暗刻", "アンコー"],
    ["明槓", "ミンカン"],
    ["暗槓", "アンカン"],
    ["大明槓", "ダイミンカン"],
    ["加槓", "カカン"],
    ["刻子", "コーツ"],
    ["槓子", "カンツ"],
    ["面子", "メンツ"],
    ["種類", "しゅるい"],
    ["早見表", "はやみひょう"],
    ["完成", "かんせい"],
    ["総合練習", "そうごうれんしゅう"],
    ["総合", "そうごう"],
    ["合計", "ごうけい"],
    ["内容", "ないよう"],
    ["手順", "てじゅん"],
    ["基本点", "きほんてん"],
    ["掛け合わせる", "かけあわせる"],
    ["流れ", "ながれ"],
    ["内訳", "うちわけ"],
    ["未満", "みまん"],
    ["分かれば", "わかれば"],
    ["毎回", "まいかい"],
    ["読み取る", "よみとる"],
    ["固定", "こてい"],
    ["各", "かく"],
    ["補足", "ほそく"],
    ["感覚的", "かんかくてき"],
    ["採用", "さいよう"],
    ["場合", "ばあい"],
    ["切り上げ", "きりあげ"],
    ["理屈", "りくつ"],
    ["問題", "もんだい"],
    ["卓", "たく"],
    ["代表的", "だいひょうてき"],
    ["一例", "いちれい"],
    ["用語", "ようご"],
    ["地域", "ちいき"],
    ["分かれる", "わかれる"],
    ["実際", "じっさい"],
    ["対局", "たいきょく"],
    ["聞き取れる", "ききとれる"],
    ["頭", "あたま"],
    ["親", "おや"],
    ["符", "ふ"],
    ["翻", "はん"],
    ["手", "て"],
    ["中", "なか"],
    ["明", "ミン"],
    ["暗", "アン"],
    ["点", "てん"],
    ["子", "こ"]
  ];

  DICT_ENTRIES.sort(function (a, b) {
    return b[0].length - a[0].length;
  });

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  var READING = {};
  DICT_ENTRIES.forEach(function (e) {
    READING[e[0]] = e[1];
  });

  var PATTERN = new RegExp(
    DICT_ENTRIES.map(function (e) { return escapeRegExp(e[0]); }).join("|"),
    "g"
  );

  function shouldSkip(node) {
    var p = node.parentNode;
    while (p) {
      if (p.nodeType === 1) {
        var tag = p.tagName;
        if (tag === "RT" || tag === "RUBY" || tag === "SCRIPT" || tag === "STYLE") return true;
        if (p.hasAttribute && p.hasAttribute("data-no-furigana")) return true;
      }
      p = p.parentNode;
    }
    return false;
  }

  function apply(root) {
    root = root || document.body;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var targets = [];
    var n;
    while ((n = walker.nextNode())) {
      if (!n.nodeValue) continue;
      PATTERN.lastIndex = 0;
      if (!PATTERN.test(n.nodeValue)) continue;
      if (shouldSkip(n)) continue;
      targets.push(n);
    }
    targets.forEach(function (textNode) {
      var text = textNode.nodeValue;
      PATTERN.lastIndex = 0;
      var frag = document.createDocumentFragment();
      var lastIndex = 0;
      var m;
      while ((m = PATTERN.exec(text))) {
        if (m.index > lastIndex) {
          frag.appendChild(document.createTextNode(text.slice(lastIndex, m.index)));
        }
        var ruby = document.createElement("ruby");
        ruby.appendChild(document.createTextNode(m[0]));
        var rt = document.createElement("rt");
        rt.textContent = READING[m[0]];
        ruby.appendChild(rt);
        frag.appendChild(ruby);
        lastIndex = m.index + m[0].length;
      }
      if (lastIndex < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex)));
      }
      textNode.parentNode.replaceChild(frag, textNode);
    });
  }

  global.Furigana = { apply: apply };
})(window);
