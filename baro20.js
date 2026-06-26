(function(){
  'use strict';

  console.log("INIT Script gestartet");

  let baroSessionId = null;
  let baroMySymbol = null;
  let baroAllSymbols = {};
  let baroDraggingId = null;
  let baroLastHash = null;

  function getRealBoardId(){
    console.log("getRealBoardId()");
    const match = window.location.pathname.match(/[A-F0-9-]{36}/);
    const result = match ? match[0] : null;
    console.log("BoardId:", result);
    return result;
  }

  const baroPdBoardId = "7018";
  const baroAdrKennzeichen = ["💣","🧯","🔥","⚡","🔆","☠️","☣️","🧪","⚠️","☢"];

  function normalizeSymbolObject(obj){
    console.log("normalizeSymbolObject()", obj);
    const result = {
      left: +(parseFloat(obj.left).toFixed(5)),
      top:  +(parseFloat(obj.top).toFixed(5)),
      symbol: String(obj.symbol),
      sessionId: String(obj.sessionId)
    };
    console.log("normalized:", result);
    return result;
  }

  function stableStringify(obj){
    const result = JSON.stringify(obj, Object.keys(obj).sort());
    console.log("stableStringify()", result);
    return result;
  }

  function getBaroCurrentDate(){
    const now = new Date();
    const result = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;
    console.log("getBaroCurrentDate()", result);
    return result;
  }

  function generateStateHash(symbols){
    console.log("generateStateHash()");
    let ordered = Object.keys(symbols)
      .sort()
      .map(k => k + ":" + stableStringify(symbols[k]))
      .join("|");

    let hash = 0;
    for(let i = 0; i < ordered.length; i++){
      hash = (hash * 31 + ordered.charCodeAt(i)) >>> 0;
    }
    console.log("Hash:", hash);
    return hash;
  }

  function initializeSession(){
    console.log("initializeSession()");
    baroSessionId = localStorage.getItem("barometer_session_id");

    if(!baroSessionId){
      baroSessionId = "user_" + Date.now() + "_" + Math.random().toString(36).substr(2,9);
      localStorage.setItem("barometer_session_id", baroSessionId);
    }

    baroMySymbol = localStorage.getItem("barometer_my_symbol");

    if(!baroMySymbol){
      baroMySymbol = baroAdrKennzeichen[Math.floor(Math.random() * baroAdrKennzeichen.length)];
      localStorage.setItem("barometer_my_symbol", baroMySymbol);
    }

    console.log("Session:", baroSessionId, "Symbol:", baroMySymbol);
    $("#symbol-display").text(baroMySymbol);
  }

  function saveAllSymbols(){
    console.log("saveAllSymbols()", baroAllSymbols);

    const data = {};
    data.date = getBaroCurrentDate();

    Object.values(baroAllSymbols).forEach((sym, index) => {
      console.log("Processing symbol:", sym);

      const id = sym.sessionId || ("temp" + index);
      const key = "baro" + id.replace(/\D/g, '').slice(-5);

      data[key] = sym.symbol;
      data["comment-" + id] = "";
    });

    console.log("POST data:", data);

    $.ajax({
      type: "POST",
      url: "/PDboard/GetTeamBaroChkPlace",
      data: {
        pdBoardId: baroPdBoardId,
        ...data
      },
      success: function(res){
        console.log("✅ gespeichert", res);
      },
      error: function(err){
        console.log("❌ Fehler:", err.responseText);
      }
    });
  }

  function createSymbolElement(id, symbol, leftRel, topRel, ownerSessionId, isMine){
    console.log("createSymbolElement()", id, symbol, leftRel, topRel, isMine);

    const $container = $("#container");
    const w = $container.width();
    const h = $container.height();

    const $s = $("<div class='stern'>" + symbol + "</div>")
      .attr("id", id)
      .attr("data-session", ownerSessionId)
      .addClass(isMine ? "my-symbol" : "other-symbol")
      .css({ left: (leftRel * w) + "px", top: (topRel * h) + "px" });

    $container.append($s);

    if(isMine){
      $s.draggable({
        containment: "#container",
        start: () => {
          console.log("Drag START:", id);
          baroDraggingId = id;
        },
        stop: (e, ui) => {
          console.log("Drag STOP:", id, ui.position);
          baroDraggingId = null;

          const w2 = $("#container").width();
          const h2 = $("#container").height();

          baroAllSymbols[id] = {
            left: +(ui.position.left / w2).toFixed(5),
            top:  +(ui.position.top  / h2).toFixed(5),
            symbol: baroMySymbol,
            sessionId: baroSessionId
          };

          console.log("Updated symbol after drag:", baroAllSymbols[id]);
          saveAllSymbols();
        }
      });
    }

    return $s;
  }

  function addMySymbols(){
    console.log("addMySymbols()");
    const existing = Object.values(baroAllSymbols).filter(s => s.sessionId === baroSessionId);

    if(existing.length >= 3){
      alert("Du hast bereits 3 Symbole!");
      return;
    }

    const $c = $("#container");
    const CW = $c.width(), CH = $c.height();

    for(let i = 0; i < 3; i++){
      const id   = baroSessionId + "_stern_" + Date.now() + "_" + i;
      const left = +((100 + i * 80) / CW).toFixed(5);
      const top  = +(100 / CH).toFixed(5);

      createSymbolElement(id, baroMySymbol, left, top, baroSessionId, true);

      baroAllSymbols[id] = { left, top, symbol: baroMySymbol, sessionId: baroSessionId };
      console.log("Added symbol:", id, baroAllSymbols[id]);
    }

    saveAllSymbols();
  }

  function removeMySymbols(){
    console.log("removeMySymbols()");
    $(`.stern[data-session="${baroSessionId}"]`).remove();

    for(const key of Object.keys(baroAllSymbols)){
      if(baroAllSymbols[key].sessionId === baroSessionId){
        console.log("Removing symbol:", key);
        delete baroAllSymbols[key];
      }
    }

    saveAllSymbols();
  }

  function clearAllSymbols(){
    console.log("clearAllSymbols()");
    if(confirm("Wirklich ALLES löschen?")){
      $(".stern").remove();
      baroAllSymbols = {};
      console.log("All symbols cleared");
      saveAllSymbols();
    }
  }

  function applySymbolDiff(normalized){
    console.log("applySymbolDiff()", normalized);

    const $container = $("#container");
    const w = $container.width();
    const h = $container.height();

    const incomingKeys = new Set(Object.keys(normalized));
    const existingKeys = new Set(
      $(".stern").map(function(){ return this.id; }).get()
    );

    for(const key of existingKeys){
      if(!incomingKeys.has(key) && key !== baroDraggingId){
        console.log("Removing obsolete:", key);
        $("#" + key).remove();
      }
    }

    for(const [key, val] of Object.entries(normalized)){
      const isMine = val.sessionId === baroSessionId;
      const $existing = $("#" + key);

      if($existing.length === 0){
        console.log("Creating new symbol:", key);
        createSymbolElement(key, val.symbol, val.left, val.top, val.sessionId, isMine);
      } else {
        if(key !== baroDraggingId){
          $existing.css({
            left: (val.left * w) + "px",
            top:  (val.top  * h) + "px"
          });
        }
      }
    }

    for(const [key, val] of Object.entries(normalized)){
      if(key !== baroDraggingId){
        baroAllSymbols[key] = val;
      }
    }

    for(const key of Object.keys(baroAllSymbols)){
      if(!incomingKeys.has(key) && key !== baroDraggingId){
        delete baroAllSymbols[key];
      }
    }

    console.log("State after diff:", baroAllSymbols);
  }

  function loadAllSymbols(){
    console.log("loadAllSymbols()");

    $.ajax({
      type: "GET",
      url: "/PdBoard/GetTeamBaroChkPlace",
      data: { PdBoardId: baroPdBoardId },
      success: function(resp){
        console.log("Server response:", resp);

        if(!resp) return;

        let data;
        try { data = JSON.parse(resp); } catch (e) {
          console.log("JSON parse error");
          return;
        }

        if(!data || data.date !== getBaroCurrentDate() || !data.symbols){
          console.log("Invalid data or wrong date");
          return;
        }

        const normalized = {};

for(const key of Object.keys(data)){
  if(!key.startsWith("baro")) continue;

  const mood = data[key];

  normalized[key] = {
    left: Math.random() * 0.8 + 0.1,   // Fake-Position
    top: Math.random() * 0.8 + 0.1,
    symbol: mood,                      // oder Mapping
    sessionId: key.replace("baro", "")
  };
}

        const hashable = {};
        for(const [k, v] of Object.entries(normalized)){
          if(k !== baroDraggingId) hashable[k] = v;
        }

        const newHash = generateStateHash(hashable);

        if(newHash === baroLastHash){
          console.log("No changes detected");
          return;
        }

        console.log("New state detected");
        baroLastHash = newHash;

        applySymbolDiff(normalized);
      }
    });
  }

  $(document).ready(function(){
    console.log("DOM ready");
    initializeSession();
    $("#addMyStarsBtn").click(addMySymbols);
    $("#removeMyStarsBtn").click(removeMySymbols);
    $("#clearAllBtn").click(clearAllSymbols);
    loadAllSymbols();
  });

  setInterval(loadAllSymbols, 1000);

})();
