(function(){
  'use strict';

  let baroSessionId = null;
  let baroMySymbol = null;
  let baroAllSymbols = {};
  let baroDraggingId = null;

  const baroAdrKennzeichen = ["💣","🧯","🔥","⚡","🔆","☠️","☣️","🧪","⚠️","☢"];

  // ✅ ECHTE BOARD ID holen
  function getRealBoardId(){
    const match = window.location.pathname.match(/[A-F0-9-]{36}/);
    return match ? match[0] : "7018"; // fallback
  }

  const baroPdBoardId = getRealBoardId();

  function getBaroCurrentDate(){
    const now = new Date();
    return `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;
  }

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

  function createSymbolElement(id, symbol, leftRel, topRel, isMine){

    const $container = $("#container");
    const w = $container.width();
    const h = $container.height();

    const $s = $("<div class='stern'>" + symbol + "</div>")
      .attr("id", id)
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

          baroAllSymbols[id].left = ui.position.left / w2;
          baroAllSymbols[id].top  = ui.position.top  / h2;

          saveAllSymbols();
        }
      });
    }

    return $s;
  }

  // ✅ SYMBOLE LADEN (aus echter API)
  function loadAllSymbols(){

    $.ajax({
      type: "GET",
      url: "/PDboard/GetTeamBaroChkPlace",
      data: { pdBoardId: baroPdBoardId },
      success: function(resp){

        if(!resp) return;

        const data = typeof resp === "string" ? JSON.parse(resp) : resp;

        $(".stern").remove();
        baroAllSymbols = {};

        Object.keys(data).forEach(key => {

          if(key.startsWith("baro")){

            let emoji = "⚠️";

            if(data[key] === "Happy") emoji = "🔆";
            if(data[key] === "Normal") emoji = "⚡";
            if(data[key] === "Sad") emoji = "☠️";

            const left = Math.random() * 0.8;
            const top  = Math.random() * 0.8;

            createSymbolElement(key, emoji, left, top, false);

            baroAllSymbols[key] = {
              left,
              top,
              symbol: emoji
            };
          }
        });
      }
    });
  }

  // ✅ SPEICHERN (richtige Struktur!)
  function saveAllSymbols(){

    const data = {
      pdBoardId: baroPdBoardId,
      date: getBaroCurrentDate()
    };

    // 👉 Test-weise auf bekannte IDs mappen
    let i = 0;

    Object.values(baroAllSymbols).forEach(sym => {

      // ⚠️ DAS ist wichtig:
      // hier brauchst du echte IDs wie baro63817
      const fakeId = ["63817","63818","63819"][i] || "63817";

      data["baro" + fakeId] = 
        sym.symbol === "🔆" ? "Happy" :
        sym.symbol === "⚡" ? "Normal" :
        sym.symbol === "☠️" ? "Sad" : "Normal";

      data["comment-" + fakeId] = "";

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

  function addMySymbols(){

    const $c = $("#container");
    const CW = $c.width();
    const CH = $c.height();

    for(let i = 0; i < 3; i++){

      const id = baroSessionId + "_" + Date.now() + "_" + i;

      const left = (100 + i * 80) / CW;
      const top  = 100 / CH;

      createSymbolElement(id, baroMySymbol, left, top, true);

      baroAllSymbols[id] = {
        left,
        top,
        symbol: baroMySymbol
      };
    }

    saveAllSymbols();
  }

  function removeMySymbols(){

    $(".my-symbol").remove();
    baroAllSymbols = {};
    saveAllSymbols();
  }

  function clearAllSymbols(){

    if(confirm("Alles löschen?")){
      $(".stern").remove();
      baroAllSymbols = {};
      saveAllSymbols();
    }
  }

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
