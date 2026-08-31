(function(){
  'use strict';
console.log("DG BARO VERSION 1.4");
  let baroSessionId = null;
  let baroMySymbol = null;
  let baroAllSymbols = {};
  let baroDraggingId = null;   // ← statt baroIsDragging: trackt welches Element gezogen wird
  let baroLastHash = null;

  const baropdBoardId = document.getElementById("PdBoardId").value;
  const baroAdrKennzeichen = ["🐶","🐱","🦊","🐻","🐼","🦁","🐯","🐨","🐵","🐸"];
  'const baroAdrKennzeichen = ["💣","🧯","🔥","⚡","🔆","☠️","☣️","🧪","⚠️","☢"];
  const BARO_SYMBOL_KEY = "barometer_my_symbol_v2";

  function normalizeSymbolObject(obj){
    return {
      left: +(parseFloat(obj.left).toFixed(5)),
      top:  +(parseFloat(obj.top).toFixed(5)),
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

  /* ──────────────────────────────────────────────────────
     NEU: Kontrolle auf eindeutige Symbole zwischen Usern
  ────────────────────────────────────────────────────── */
  function getSymbolsUsedByOthers(){
    const used = new Set();
    for(const val of Object.values(baroAllSymbols)){
      if(val.sessionId !== baroSessionId){
        used.add(val.symbol);
      }
    }
    return used;
  }

  function pickNextAvailableSymbol(preferred){
    const used = getSymbolsUsedByOthers();
    if(!used.has(preferred)) return preferred;

    const startIdx = baroAdrKennzeichen.indexOf(preferred);
    for(let i = 1; i <= baroAdrKennzeichen.length; i++){
      const idx = (startIdx + i) % baroAdrKennzeichen.length;
      const candidate = baroAdrKennzeichen[idx];
      if(!used.has(candidate)) return candidate;
    }
    // Alle Symbole vergeben -> Fallback: bevorzugtes Symbol behalten
    return preferred;
  }

  function ensureUniqueSymbol(){
    // Nur automatisch wechseln, solange ich selbst noch keine Symbole
    // platziert habe – sonst würde es inkonsistent zu meinen liegenden
    // Symbolen werden (die tragen ihr eigenes "symbol"-Feld schon fest).
    const ownPlaced = Object.values(baroAllSymbols).some(s => s.sessionId === baroSessionId);
    if(ownPlaced) return;

    const next = pickNextAvailableSymbol(baroMySymbol);
    if(next !== baroMySymbol){
      baroMySymbol = next;
      localStorage.setItem(BARO_SYMBOL_KEY, baroMySymbol);
      $("#symbol-display").text(baroMySymbol);
    }
  }

  function initializeSession(){
    baroSessionId = localStorage.getItem("barometer_session_id");
    if(!baroSessionId){
      baroSessionId = "user_" + Date.now() + "_" + Math.random().toString(36).substr(2,9);
      localStorage.setItem("barometer_session_id", baroSessionId);
    }
    baroMySymbol = localStorage.getItem(BARO_SYMBOL_KEY);
    if(!baroMySymbol){
      baroMySymbol = baroAdrKennzeichen[Math.floor(Math.random() * baroAdrKennzeichen.length)];
      localStorage.setItem(BARO_SYMBOL_KEY, baroMySymbol);
    }
    $("#symbol-display").text(baroMySymbol);
    $("#symbol-display")
  .css("cursor", "pointer")
  .attr("title", "Symbol wechseln")
  .off("click")
  .on("click", function(){

    const existing = Object.values(baroAllSymbols)
      .filter(s => s.sessionId === baroSessionId);

    if(existing.length > 0){
      alert("Bitte zuerst deine Symbole entfernen, bevor du das Symbol wechselst.");
      return;
    }

    const used = getSymbolsUsedByOthers();
    let idx = baroAdrKennzeichen.indexOf(baroMySymbol);
    let nextSymbol = baroMySymbol;

    // Zyklisch weiterschalten, dabei von anderen belegte Symbole überspringen
    for(let i = 1; i <= baroAdrKennzeichen.length; i++){
      const candidateIdx = (idx + i) % baroAdrKennzeichen.length;
      const candidate = baroAdrKennzeichen[candidateIdx];
      if(!used.has(candidate)){
        nextSymbol = candidate;
        break;
      }
    }

    baroMySymbol = nextSymbol;

    localStorage.setItem(BARO_SYMBOL_KEY, baroMySymbol);

    $("#symbol-display").text(baroMySymbol);
  });
  }

function saveAllSymbols(){

  const state = {
    date: getBaroCurrentDate(),
    "comment-63778":
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

  function createSymbolElement(id, symbol, leftRel, topRel, ownerSessionId, isMine){
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
        symbol: baroMySymbol,
        sessionId: baroSessionId
      };

      saveAllSymbols();
    }

  }, $s[0]);
}
return $s;
}
  
  function addMySymbols(){
    const existing = Object.values(baroAllSymbols).filter(s => s.sessionId === baroSessionId);
    if(existing.length >= 3){
      alert("Du hast bereits 3 Symbole!");
      return;
    }

    // Letzte Sicherheitsprüfung direkt vor dem Platzieren (Race-Condition-Schutz):
    // falls zwischenzeitlich ein anderer User genau mein Symbol belegt hat.
    ensureUniqueSymbol();

    const $c = $("#container");
    const CW = $c.width(), CH = $c.height();

    for(let i = 0; i < 3; i++){
      const id   = baroSessionId + "_stern_" + Date.now() + "_" + i;
      const left = +((100 + i * 80) / CW).toFixed(5);
      const top  = +(100 / CH).toFixed(5);

      createSymbolElement(id, baroMySymbol, left, top, baroSessionId, true);
      baroAllSymbols[id] = { left, top, symbol: baroMySymbol, sessionId: baroSessionId };
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

    // 1. Entferne Symbole, die im Server-State nicht mehr vorhanden sind
    //    – aber NIE das aktuell gezogene Element entfernen
    for(const key of existingKeys){
      if(!incomingKeys.has(key) && key !== baroDraggingId){
        $("#" + key).remove();
      }
    }

    // 2. Füge neue hinzu oder aktualisiere bestehende Positionen
    for(const [key, val] of Object.entries(normalized)){
      const isMine = val.sessionId === baroSessionId;
      const $existing = $("#" + key);

      if($existing.length === 0){
        // Neues Symbol → erstellen
        createSymbolElement(key, val.symbol, val.left, val.top, val.sessionId, isMine);
      } else {
        // Bestehendes Symbol → Position nur aktualisieren wenn es NICHT
        // gerade von diesem User gezogen wird
        if(key !== baroDraggingId){
          $existing.css({
            left: (val.left * w) + "px",
            top:  (val.top  * h) + "px"
          });
        }
      }
    }

    // Lokalen State synchronisieren (außer das gezogene Element)
    for(const [key, val] of Object.entries(normalized)){
      if(key !== baroDraggingId){
        baroAllSymbols[key] = val;
      }
    }
    // Lokal gelöschte entfernen
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

const raw = data["comment-63778"];

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

        // Hash ignoriert das gezogene Element – sonst würde jeder Drag
        // einen Hash-Mismatch erzeugen und ein unnötiges Re-Diff auslösen
        const hashable = {};
        for(const [k, v] of Object.entries(normalized)){
          if(k !== baroDraggingId) hashable[k] = v;
        }
        const newHash = generateStateHash(hashable);
        if(newHash === baroLastHash) return;
        baroLastHash = newHash;

        applySymbolDiff(normalized);

        // NEU: nach jedem Update prüfen, ob mein aktuelles Symbol
        // inzwischen von jemand anderem belegt wurde
        ensureUniqueSymbol();
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

  // Poll läuft immer – das Diff-Update überspringt intern das gezogene Element
  setInterval(loadAllSymbols, 1000);

})();
