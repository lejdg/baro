(function(){
  'use strict';

  console.log("BARO VERSION 28");

  let baroSessionId = null;
  let baroMySymbol = null;
  let baroAllSymbols = {};
  let baroDraggingId = null;
  let baroLastHash = null;

  const baroPdBoardId = "7018";
  const BARO_STORAGE_FIELD = "comment-63778";

  const baroAdrKennzeichen = ["💣","🧯","🔥","⚡","🔆","☠️","☣️","🧪","⚠️","☢"];

  function normalizeSymbolObject(obj){
    return {
      left: +(parseFloat(obj.left).toFixed(5)),
      top: +(parseFloat(obj.top).toFixed(5)),
      symbol: String(obj.symbol),
      sessionId: String(obj.sessionId)
    };
  }

  function stableStringify(obj){
    return JSON.stringify(obj, Object.keys(obj).sort());
  }

  function getBaroCurrentDate(){
    const now = new Date();
    return `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;
  }

  function generateStateHash(symbols){

    let ordered = Object.keys(symbols)
      .sort()
      .map(k => k + ":" + stableStringify(symbols[k]))
      .join("|");

    let hash = 0;

    for(let i = 0; i < ordered.length; i++){
      hash = (hash * 31 + ordered.charCodeAt(i)) >>> 0;
    }

    return hash;
  }

  function initializeSession(){

    baroSessionId = localStorage.getItem("barometer_session_id");

    if(!baroSessionId){
      baroSessionId = "user_" + Date.now() + "_" + Math.random().toString(36).substr(2,9);
      localStorage.setItem("barometer_session_id", baroSessionId);
    }

    baroMySymbol = localStorage.getItem("barometer_my_symbol");

    if(!baroMySymbol){
      baroMySymbol = baroAdrKennzeichen[
        Math.floor(Math.random() * baroAdrKennzeichen.length)
      ];

      localStorage.setItem(
        "barometer_my_symbol",
        baroMySymbol
      );
    }

    $("#symbol-display").text(baroMySymbol);
  }

function saveAllSymbols(){

  const state = {
    date: getBaroCurrentDate(),
    "comment-63778":
      "__BARO__" + JSON.stringify(baroAllSymbols)
  };

  console.log("SAVE STATE", state);

  $.ajax({

    type: "POST",
    url: "/PdBoard/AddStaticTeambaroResult",

    data: {
      pdBoardId: baroPdBoardId,
      happy: 0,
      normal: 0,
      sad: 0,
      locked: false,
      chkPlace: JSON.stringify(state)
    },

    success: function(){
      console.log("GESPEICHERT");
    },

    error: function(xhr){
      console.log("FEHLER", xhr.status);
    }

  });

}

function createSymbolElement(id, symbol, leftRel, topRel, ownerSessionId, isMine){

  const $container = $("#container");

  const w = $container.width();
  const h = $container.height();

  const $s = $("<div class='stern'>" + symbol + "</div>")
    .attr("id", id)
    .attr("data-session", ownerSessionId)
    .addClass(isMine ? "my-symbol" : "other-symbol")
    .css({
      position: "absolute",
      left: (leftRel * w) + "px",
      top: (topRel * h) + "px",
      background: "yellow",
      border: "1px solid black",
      padding: "10px",
      cursor: "move",
      zIndex: 999999,
      pointerEvents: "auto"
    });

  $container.append($s);

  console.log("CREATE", id, "isMine=", isMine);

  $s.on("mousedown", function(){
    console.log("MOUSEDOWN", id);
  });

  $s.on("mouseup", function(){
    console.log("MOUSEUP", id);
  });

  if(isMine){

    console.log("DRAG BIND", id);
    console.log("AFTER DRAGGABLE", typeof $s.draggable);

    $s.draggable({

      containment: document.getElementById("container"),

      start: function(){

        console.log("START DRAG", id);

        baroDraggingId = id;
      },

      drag: function(e, ui){

        console.log(
          "DRAGGING",
          ui.position.left,
          ui.position.top
        );
      },

      stop: function(e, ui){

        console.log("STOP DRAG", id);

        baroDraggingId = null;

        const w2 = $("#container").width();
        const h2 = $("#container").height();

        baroAllSymbols[id] = {

          left: +(ui.position.left / w2).toFixed(5),

          top: +(ui.position.top / h2).toFixed(5),

          symbol: baroMySymbol,

          sessionId: baroSessionId
        };

        console.log(
          "SAVE",
          baroAllSymbols[id]
        );

        saveAllSymbols();
      }
    });

    console.log(
      "HAS CLASS",
      $s.hasClass("ui-draggable")
    );

    console.log(
      "DRAG OBJECT",
      $s.data("ui-draggable")
    );
  }

  return $s;
}

  function addMySymbols(){

    const existing = Object.values(baroAllSymbols)
      .filter(s => s.sessionId === baroSessionId);

    if(existing.length >= 3){
      alert("Du hast bereits 3 Symbole!");
      return;
    }

    const $c = $("#container");

    const CW = $c.width();
    const CH = $c.height();

    for(let i = 0; i < 3; i++){

      const id =
        baroSessionId +
        "_stern_" +
        Date.now() +
        "_" +
        i;

      const left = +((100 + i * 80) / CW).toFixed(5);
      const top = +(100 / CH).toFixed(5);

      createSymbolElement(
        id,
        baroMySymbol,
        left,
        top,
        baroSessionId,
        true
      );

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

    $(`.stern[data-session="${baroSessionId}"]`).remove();

    for(const key of Object.keys(baroAllSymbols)){
      if(baroAllSymbols[key].sessionId === baroSessionId){
        delete baroAllSymbols[key];
      }
    }

    saveAllSymbols();
  }

  function clearAllSymbols(){

    if(confirm("Wirklich ALLES löschen?")){

      $(".stern").remove();

      baroAllSymbols = {};

      saveAllSymbols();
    }
  }

  function applySymbolDiff(normalized){

    const $container = $("#container");

    const w = $container.width();
    const h = $container.height();

    const incomingKeys = new Set(Object.keys(normalized));

    const existingKeys = new Set(
      $(".stern").map(function(){
        return this.id;
      }).get()
    );

    for(const key of existingKeys){

      if(!incomingKeys.has(key) && key !== baroDraggingId){
        $("#" + key).remove();
      }
    }

    for(const [key,val] of Object.entries(normalized)){

console.log(
  "CHECK SESSION",
  val.sessionId,
  baroSessionId
);

      const isMine = val.sessionId === baroSessionId;

console.log(
  "ISMINE",
  key,
  isMine
);

      const $existing = $("#" + key);

      if($existing.length === 0){

        createSymbolElement(
          key,
          val.symbol,
          val.left,
          val.top,
          val.sessionId,
          isMine
        );

      } else {

        if(key !== baroDraggingId){

          $existing.css({
            left: (val.left * w) + "px",
            top: (val.top * h) + "px"
          });
        }
      }
    }

    for(const [key,val] of Object.entries(normalized)){
      if(key !== baroDraggingId){
        baroAllSymbols[key] = val;
      }
    }

    for(const key of Object.keys(baroAllSymbols)){
      if(!incomingKeys.has(key) && key !== baroDraggingId){
        delete baroAllSymbols[key];
      }
    }
  }

  function loadAllSymbols(){

    $.ajax({

      type: "GET",

      url: "/PdBoard/GetTeamBaroChkPlace",

      data:{
        pdBoardId: baroPdBoardId
      },

      success:function(resp){

        if(!resp) return;

        let data;

        try{
          data = JSON.parse(resp);
        }
        catch(e){
          return;
        }

        console.log("SERVER DATA", data);

        if(!data) return;

        if(data.date !== getBaroCurrentDate()) return;

        const raw = data[BARO_STORAGE_FIELD];

        if(!raw || typeof raw !== "string") return;

        const match = raw.match(/__BARO__(.*)$/s);

        if(!match) return;

        let symbols;

        try{
          symbols = JSON.parse(match[1]);
        }
        catch(e){
          console.log("BARO JSON Fehler", e);
          return;
        }

        const normalized = {};

        Object.keys(symbols)
          .sort()
          .forEach(key => {
            normalized[key] =
              normalizeSymbolObject(symbols[key]);
          });

        const hashable = {};

        for(const [k,v] of Object.entries(normalized)){
          if(k !== baroDraggingId){
            hashable[k] = v;
          }
        }

        const newHash = generateStateHash(hashable);

        if(newHash === baroLastHash){
          return;
        }

        baroLastHash = newHash;

        applySymbolDiff(normalized);
      }
    });
  }

  window.addEventListener("load", function(){

    console.log("BARO LOAD");

    initializeSession();

    $("#addMyStarsBtn").click(addMySymbols);
    $("#removeMyStarsBtn").click(removeMySymbols);
    $("#clearAllBtn").click(clearAllSymbols);

    loadAllSymbols();

    //setInterval(loadAllSymbols, 1000);

  });

})();
