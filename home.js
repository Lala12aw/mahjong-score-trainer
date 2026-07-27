(function(){
  "use strict";

  function readStats(key){
    try {
      var s = JSON.parse(localStorage.getItem(key) || "null");
      if (s && typeof s.total === "number" && s.total > 0) return s;
    } catch(e){}
    return null;
  }

  function paint(elId, key){
    var el = document.getElementById(elId);
    var s = readStats(key);
    if (s) el.textContent = "正解 " + s.correct + " / " + s.total;
  }

  paint("stat-step1", "hankei-drill-stats-v1");
  paint("stat-step2", "fu-drill-stats-v1");
  paint("stat-step3", "step3-drill-stats-v1");

  Furigana.apply(document.body);
  Glossary.apply(document.body);
})();
