(function(){
  'use strict';

  let baroSessionId = null;
  let baroMySymbol = null;
  let baroAllSymbols = {};
  let baroDraggingId = null;

  const baroAdrKennzeichen = ["💣","🧯","🔥","⚡","🔆","☠️","☣️","🧪","⚠️","☢"];

  // ✅ echte Board-ID holen
  function getRealBoardId(){
    const match = window.location.pathname.match(/[A-F0-9-]{36}/);
    return match ? match[0] : "7018";
  }

  const baroPdBoardId = getRealBoardId();

  function getBaroCurrentDate(){
    const now = new Date();
    return `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;
  }

  // ✅ Session / eigenes Symbol
  function initializeSession(){

    baroSessionId = localStorage.getItem("barometer_session_id");

    if(!baroSessionId){
      baroSessionId = "user_" + Date.now();
      localStorage.setItem("barometer_session_id", baroSessionId);
    }

    baroMySymbol = localStorage.getItem("barometer_my_symbol");

    if(!baroMySymbol){
      baroMySymbol = baroAdrKennzeichen[Math.floor(Math.random() * baroAdrKennzeichen.length)];
      localStorage.setItem("barometer_my_symbol", baroMySymbol);
    }

    $("#symbol-display").text(baroMySymbol);
  }

  // ✅ Symbol erstellen
  function createSymbolElement(id, symbol, leftRel, topRel, ownerSessionId, isMine){

    const $container = $("#container");
    const w = $container.width();
    const h = $container.height();

    const $s = $("<div class='stern'>" + symbol + "</div>")
      .attr("id", id)
      .attr("data-session", ownerSessionId)
      .addClass(isMine ? "my-symbol" : "other-symbol")
      .css({
        left: (leftRel * w) + "px",
        top: (topRel * h) + "px"
      });

    $container.append($s);

    if(isMine){
      $s.draggable({
        containment: "#container",
        start: () => {
          baroDraggingId = id;
        },
        stop: (e, ui) => {

          baroDraggingId = null;

          const w2 = $("#container").width();
          const h2 = $("#container").height();

          baroAllSymbols[id].left = +(ui.position.left / w2).toFixed(5);
          baroAllSymbols[id].top  = +(ui.position.top  / h2).toFixed(5);

          saveAllSymbols();
        }
      });
    }

    return $s;
  }

  // ✅ eigene Symbole platzieren
  function addMySymbols(){

    const existing = Object.values(baroAllSymbols).filter(s => s.sessionId === baroSessionId);

    if(existing.length >= 3){
      alert("Du hast bereits 3 Symbole!");
      return;
    }

    const $c = $("#container");
    const CW = $c.width(), CH = $c.height();

    for(let i = 0; i < 3; i++){

      const id = baroSessionId + "_stern_" + Date.now() + "_" + i;

      const left = +((100 + i * 80) / CW).toFixed(5);
      const top  = +(100 / CH).toFixed(5);

      createSymbolElement(id, baroMySymbol, left, top, baroSessionId, true);

      baroAllSymbols[id] = {
        left,
        top,
        symbol: baroMySymbol,
        sessionId: baroSessionId
      };
    }

    saveAllSymbols();
  }

  function removeMySymbols(){

    $(".stern[data-session='" + baroSessionId + "']").remove();

    for(const key in baroAllSymbols){
      if(baroAllSymbols[key].sessionId === baroSessionId){
        delete baroAllSymbols[key];
      }
    }

    saveAllSymbols();
  }

  function clearAllSymbols(){

    if(confirm("Alles löschen?")){
      $(".stern").remove();
      baroAllSymbols = {};
      saveAllSymbols();
    }
  }

  // ✅ SERVER-DATEN LADEN
  function loadAllSymbols(){

    $.ajax({
      type: "GET",
      url: "/PDboard/GetTeamBaroChkPlace",
      data: { pdBoardId: baroPdBoardId },
      success: function(resp){

        if(!resp) return;

        const data = typeof resp === "string" ? JSON.parse(resp) : resp;

        $(".stern").not(".my-symbol").remove();

        Object.keys(data).forEach(key => {

          if(key.startsWith("baro")){

            if($("#" + key).length) return;

            let emoji = "⚠️";

            if(data[key] === "Happy") emoji = "🔆";
            if(data[key] === "Normal") emoji = "⚡";
            if(data[key] === "Sad") emoji = "☠️";

            const left = Math.random() * 0.8;
            const top  = Math.random() * 0.8;

            createSymbolElement(key, emoji, left, top, key, false);

            baroAllSymbols[key] = {
              left,
              top,
              symbol: emoji,
              sessionId: key
            };
          }
        });
      }
    });
  }

  // ✅ SPEICHERN (angepasst an Backend)
  function saveAllSymbols(){

    const data = {
      pdBoardId: baroPdBoardId,
      date: getBaroCurrentDate()
    };

    let i = 0;

    Object.values(baroAllSymbols).forEach(sym => {

      const fakeIds = ["63817","63818","63819"];
      const id = fakeIds[i % fakeIds.length];

      data["baro" + id] =
        sym.symbol === "🔆" ? "Happy" :
        sym.symbol === "⚡" ? "Normal" :
        sym.symbol === "☠️" ? "Sad" : "Normal";

      data["comment-" + id] = "";

      i++;
    });

    $.ajax({
      type: "POST",
      url: "/PDboard/GetTeamBaroChkPlace",
      data: data,
      success: function(){
        console.log("✅ gespeichert");
      },
      error: function(err){
        console.log("❌ Fehler:", err.responseText);
      }
    });
  }

  // ✅ INIT
  $(document).ready(function(){

    console.log("✅ Barometer gestartet");
    console.log("BoardID:", baroPdBoardId);

    initializeSession();

    $("#addMyStarsBtn").click(addMySymbols);
    $("#removeMyStarsBtn").click(removeMySymbols);
    $("#clearAllBtn").click(clearAllSymbols);

    loadAllSymbols();

    setInterval(loadAllSymbols, 3000);
  });

})();
