console.log("START");

window.addEventListener("load", function () {

    const el = document.getElementById("test");

    el.addEventListener("mousedown", function(){
        console.log("MOUSEDOWN");
    });

    el.addEventListener("mouseup", function(){
        console.log("MOUSEUP");
    });

    console.log("LOAD");
    console.log("Test gefunden:", $("#test").length);
    console.log("Draggable:", typeof $.fn.draggable);

    $("#test").draggable({

        containment: "#container",

        start: function(){
            console.log("START DRAG");
        },

        stop: function (e, ui) {
            console.log("STOP DRAG", ui.position);
        }

    });

    console.log("DRAGGABLE AKTIV");

});
