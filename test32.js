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

    console.log("JQUERY", $.fn.jquery);

    console.log(
      "WINDOW JQUERY",
      window.jQuery === $
    );

    console.log(
      "UI",
      $.ui
    );

    console.log(
      "UI DRAGGABLE",
      $.ui ? $.ui.draggable : "NO UI"
    );

    console.log(
      "DOM ELEMENT",
      document.getElementById(id)
    );

    $("#" + id).draggable();

    console.log(
      "HAS CLASS",
      $("#" + id).hasClass("ui-draggable")
    );

    console.log(
      "DRAG OBJECT",
      $("#" + id).data("ui-draggable")
    );

    console.log(
      "CLASSNAME",
      $("#" + id)[0].className
    );
  }

  return $s;
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

    console.log("JQUERY", $.fn.jquery);

    console.log(
      "WINDOW JQUERY",
      window.jQuery === $
    );

    console.log(
      "UI",
      $.ui
    );

    console.log(
      "UI DRAGGABLE",
      $.ui ? $.ui.draggable : "NO UI"
    );

    console.log(
      "DOM ELEMENT",
      document.getElementById(id)
    );

    $("#" + id).draggable();

    console.log(
      "HAS CLASS",
      $("#" + id).hasClass("ui-draggable")
    );

    console.log(
      "DRAG OBJECT",
      $("#" + id).data("ui-draggable")
    );

    console.log(
      "CLASSNAME",
      $("#" + id)[0].className
    );
  }

  return $s;
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
