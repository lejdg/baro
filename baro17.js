(function(){
  'use strict';

  let baroSessionId = null;
  let baroMySymbol = null;
  let baroAllSymbols = {};
  let baroDraggingId = null;
  let baroLastHash = null;

  const baroPdBoardId = "7018";
  const baroAdrKennzeichen = ["💣","🧯","🔥","⚡","🔆","☠️","☣️","🧪","⚠️","☢"];

  function normalizeSymbolObject(obj){
    return {
      left: +(parseFloat(obj.left).toFixed(5)),
      top:  +(parseFloat(obj.top).toFixed(5)),
      symbol: String(obj.symbol),
      sessionId: String(obj.sessionId)
    };
  }

  function getBaroCurrentDate(){
    const now = new Date();
    return `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;
  }

  function initializeSession(){
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

    $("#symbol-display").text(baroMySymbol);

    console.log("[INIT]", baroSessionId, baroMySymbol);
  }

  function saveAllSymbols(){
    console.log("[SAVE] sending", baroAllSymbols);

    $.ajax({
      type: "POST",
      url: "/PdBoard/AddStaticTeambaroResult",
      data: {
        pdBoardId: baroPdBoardId,
        happy: 1,
        normal: 0,
        sad: 0,
        locked: false,
        chkPlace: JSON.stringify({
          date: getBaroCurrentDate(),
          symbols: JSON.stringify(baroAllSymbols)
        })
      },
      success: function(){
        console.log("[SAVE SUCCESS]");
      },
      error: function (xhr) {
        console.log("[SAVE ERROR]", xhr.responseText);
      }
    });
  }

  function createSymbolElement(id, symbol, leftRel, topRel, ownerSessionId, isMine){
    const $container = $("#container");
    const w = $container.outerWidth();
    const h = $container.outerHeight();

    const $s = $("<div class='stern'>" + symbol + "</div>")
      .attr("id", id)
      .attr("data-session", ownerSessionId)
      .addClass(isMine ? "my-symbol" : "other-symbol")
      .css({ left: (leftRel * w) + "px", top: (topRel * h) + "px" });

    $container.append($s);

    if(isMine){
      console.log("[DRAG INIT]", id);

      $s.draggable({
        containment: "#container",

        start: (e, ui) => {
          baroDraggingId = id;
          console.log("[DRAG START]", id, ui.position);
        },

        drag: (e, ui) => {
          console.log("[DRAG MOVE]", id, ui.position);
        },

        stop: (e, ui) => {
          console.log("[DRAG STOP RAW]", id, ui.position);

          const w2 = $("#container").outerWidth();
          const h2 = $("#container").outerHeight();

          console.log("[CONTAINER SIZE]", w2, h2);

          const leftRel = ui.position.left / w2;
          const topRel  = ui.position.top  / h2;

          console.log("[CALC REL]", leftRel, topRel);

          baroAllSymbols[id] = {
            left: +leftRel.toFixed(5),
            top:  +topRel.toFixed(5),
            symbol: baroMySymbol,
            sessionId: baroSessionId
          };

          console.log("[UPDATED STATE]", baroAllSymbols[id]);

          saveAllSymbols();

          // kleines Delay gegen Poll überschreibung
          setTimeout(() => {
            baroDraggingId = null;
            console.log("[DRAG END CLEAN]");
          }, 200);
        }
      });
    }

    return $s;
  }

  function removeMySymbols(){
  console.log("[REMOVE] before", baroAllSymbols);

  $(`.stern[data-session="${baroSessionId}"]`).remove();

  for(const key of Object.keys(baroAllSymbols)){
    if(baroAllSymbols[key].sessionId === baroSessionId){
      delete baroAllSymbols[key];
    }
  }

  console.log("[REMOVE] after", baroAllSymbols);

  saveAllSymbols();
}

  function addMySymbols(){
    const existing = Object.values(baroAllSymbols).filter(s => s.sessionId === baroSessionId);

    console.log("[ADD SYMBOLS] existing", existing.length);

    if(existing.length >= 3){
      alert("Du hast bereits 3 Symbole!");
      return;
    }

    const $c = $("#container");
    const CW = $c.outerWidth(), CH = $c.outerHeight();

    for(let i = 0; i < 3; i++){
      const id   = baroSessionId + "_stern_" + Date.now() + "_" + i;
      const left = +((100 + i * 80) / CW).toFixed(5);
      const top  = +(100 / CH).toFixed(5);

      createSymbolElement(id, baroMySymbol, left, top, baroSessionId, true);
      baroAllSymbols[id] = { left, top, symbol: baroMySymbol, sessionId: baroSessionId };
    }

    saveAllSymbols();
  }

  function loadAllSymbols(){
    $.ajax({
      type: "GET",
      url: "/PdBoard/GetTeamBaroChkPlace",
      data: { pdBoardId: baroPdBoardId },
      success: function(resp){
        console.log("[LOAD RAW]", resp);

        if(!resp) return;

        let data;
        try { data = JSON.parse(resp); } catch { return; }

        if(!data || data.date !== getBaroCurrentDate() || !data.symbols) return;

        let parsedSymbols;
        try {
          parsedSymbols = typeof data.symbols === "string"
            ? JSON.parse(data.symbols)
            : data.symbols;
        } catch {
          return;
        }

        console.log("[LOAD PARSED]", parsedSymbols);

        baroAllSymbols = parsedSymbols;
      }
    });
  }

  $(document).ready(function(){
    initializeSession();
    $("#addMyStarsBtn").click(addMySymbols);

    loadAllSymbols();
  });

  setInterval(loadAllSymbols, 2000);

})();
