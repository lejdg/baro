(function(){
console.log("Sort BARO VERSION 1.4");
  const RESET_FLAG = "barometer_session_reset_done";

  if(!localStorage.getItem(RESET_FLAG)){
    // 🔥 EINMALIG löschen
    localStorage.removeItem("barometer_session_id");
    localStorage.removeItem("barometer_my_color");

    // ✅ merken: Reset ist erledigt
    localStorage.setItem(RESET_FLAG, "true");
  }

})();

(function(){
'use strict';

let baroSessionId = null;
let baroMyColor = null;
let baroAllSymbols = {};
let baroDraggingId = null;   // ← statt baroIsDragging: merkt sich welches Element
let baroLastHash = null;

const baropdBoardId =
  document.getElementById("PdBoardId").value;

const baroColorPalette = [
  "#E6194B","#3CB44B","#FFE119","#0082C8",
  "#F58231","#911EB4","#46F0F0","#F032E6",
  "#D2F53C","#FABEBE","#008080","#E6BEFF",
  "#AA6E28","#FFFAC8","#800000","#AAFFC3",
  "#808000","#FFD8B1","#000080","#808080",
  "#FFFFFF","#000000","#5DA5DA","#B276B2"
];

function getBaroCurrentDate(){
  const n = new Date();
  return `${String(n.getDate()).padStart(2,'0')}/${String(n.getMonth()+1).padStart(2,'0')}/${n.getFullYear()}`;
}

function stableStringify(obj){
  return JSON.stringify(obj, Object.keys(obj).sort());
}

function normalizeSymbolObject(obj){
  return {
    left: +(parseFloat(obj.left).toFixed(5)),
    top:  +(parseFloat(obj.top).toFixed(5)),
    symbol: "✈",
    color: String(obj.color || "#000000"),
    sessionId: String(obj.sessionId)
  };
}

function generateStateHash(symbols){
  const ordered = Object.keys(symbols)
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

  let savedColor = localStorage.getItem("barometer_my_color");
  if(!savedColor){
    savedColor = baroColorPalette[Math.floor(Math.random() * baroColorPalette.length)];
    localStorage.setItem("barometer_my_color", savedColor);
  }
  baroMyColor = savedColor;
$("#symbol-display")
  .text("✈")
  .css("color", baroMyColor);
  
  $("#symbol-display")
  .css("cursor","pointer")
  .attr("title","Farbe wechseln")
  .off("click")
  .on("click", function(){

    const existing = Object.values(baroAllSymbols)
      .filter(s => s.sessionId === baroSessionId);

    if(existing.length > 0){
      alert(
        "Bitte zuerst deine Symbole entfernen, bevor du die Farbe wechselst."
      );
      return;
    }

    let idx = baroColorPalette.indexOf(baroMyColor);

    idx++;

    if(idx >= baroColorPalette.length){
      idx = 0;
    }

    baroMyColor = baroColorPalette[idx];

    localStorage.setItem(
      "barometer_my_color",
      baroMyColor
    );
$("#symbol-display")
  .stop(true, true)
  .css("color", baroMyColor)
  .fadeOut(80)
  .fadeIn(80);
});
  }
  
function saveAllSymbols(){

  const state = {
    date: getBaroCurrentDate(),
    "comment-59269":
      "__BARO__" + JSON.stringify(baroAllSymbols)
  };

  $.ajax({
    type: "POST",
    url: "/PdBoard/AddStaticTeambaroResult",
    data: {
      pdBoardId: baropdBoardId,
      happy: 0,
      normal: 0,
      sad: 0,
      locked: false,
      chkPlace: JSON.stringify(state)
    }
  });
}

 
function createSymbolElement(id, symbol, leftRel, topRel, ownerSessionId, color){
  const $c = $("#container");
  const w = $c.width();
  const h = $c.height();

  const $s = $(`<div class="stern">${symbol}</div>`)
    .attr("id", id)
    .attr("data-session", ownerSessionId)
    .css({
      left:  (leftRel * w) + "px",
      top:   (topRel  * h) + "px",
      color: color
    });

  if(ownerSessionId === baroSessionId){
    $s.addClass("my-symbol");
  } else {
    $s.addClass("other-symbol");
  }

  $c.append($s);

if(ownerSessionId === baroSessionId){

  new $.ui.draggable({

    containment: "#container",

    start: function(){
      baroDraggingId = id;
    },

    stop: function(e, ui){

      baroDraggingId = null;

      const w2 = $("#container").width();
      const h2 = $("#container").height();

      baroAllSymbols[id] = {
        left: +(ui.position.left / w2).toFixed(5),
        top: +(ui.position.top / h2).toFixed(5),
        symbol: "✈",
        color: baroMyColor,
        sessionId: baroSessionId
      };

      saveAllSymbols();
    }

  }, $s[0]);
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
  const CW = $c.width(), CH = $c.height();

  for(let i = 0; i < 3; i++){
    const id   = baroSessionId + "_stern_" + Date.now() + "_" + i;
    const left = +((100 + i * 80) / CW).toFixed(5);
    const top  = +(100 / CH).toFixed(5);

    createSymbolElement(id, "✈", left, top, baroSessionId, baroMyColor);
    baroAllSymbols[id] = { left, top, symbol: "✈", color: baroMyColor, sessionId: baroSessionId };
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

/* ──────────────────────────────────────────────────────
   KERNFIX: Inkrementelles Update statt Full-Re-Render
────────────────────────────────────────────────────── */
function applySymbolDiff(normalized){
  const $container = $("#container");
  const w = $container.width();
  const h = $container.height();

  const incomingKeys = new Set(Object.keys(normalized));
  const existingKeys = new Set(
    $(".stern").map(function(){ return this.id; }).get()
  );

  // 1. Entferne Symbole die nicht mehr da sind (aber NIE das gezogene)
  for(const key of existingKeys){
    if(!incomingKeys.has(key) && key !== baroDraggingId){
      $("#" + key).remove();
    }
  }

  // 2. Neue hinzufügen oder bestehende Position aktualisieren
  for(const [key, val] of Object.entries(normalized)){
    const isMine = val.sessionId === baroSessionId;
    const $existing = $("#" + key);

    if($existing.length === 0){
      // Neues Symbol → erstellen
      createSymbolElement(key, "✈", val.left, val.top, val.sessionId, val.color);
    } else {
      // Bestehendes Symbol: Position nur updaten wenn NICHT gerade gezogen
      if(key !== baroDraggingId){
        $existing.css({
          left:  (val.left * w) + "px",
          top:   (val.top  * h) + "px",
          color: val.color
        });
      }
    }
  }

  // Lokalen State synchronisieren (das gezogene Element auslassen)
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
}

function loadAllSymbols(){
  $.ajax({
    type: "GET",
    url: "/PdBoard/GetTeamBaroChkPlace",
    data: { pdBoardId: baropdBoardId },
    success: function(resp){
      if(!resp) return;

      let data;
      try { data = JSON.parse(resp); } catch { return; }

if(!data) return;

if(data.date !== getBaroCurrentDate()) return;

const raw = data["comment-59269"];

if(!raw || typeof raw !== "string") return;

const match = raw.match(/__BARO__(.*)$/s);

if(!match) return;

let symbols;

try{
  symbols = JSON.parse(match[1]);
}
catch(e){
  return;
}

const normalized = {};

for(const key of Object.keys(symbols).sort()){
  normalized[key] = normalizeSymbolObject(symbols[key]);
}

      // Hash ohne das gezogene Element berechnen
      const hashable = {};
      for(const [k, v] of Object.entries(normalized)){
        if(k !== baroDraggingId) hashable[k] = v;
      }
      const newHash = generateStateHash(hashable);
      if(newHash === baroLastHash) return;
      baroLastHash = newHash;

      applySymbolDiff(normalized);
    }
  });
}

$(document).ready(function(){
  initializeSession();
  $("#addMyStarsBtn").click(addMySymbols);
  $("#removeMyStarsBtn").click(removeMySymbols);
  $("#clearAllBtn").click(clearAllSymbols);
  loadAllSymbols();
});

// Poll läuft immer – das Diff überspringt intern das gezogene Element
setInterval(loadAllSymbols, 1000);

})();
