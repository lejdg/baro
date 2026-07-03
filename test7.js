console.log("START");

window.addEventListener("load", function () {

    console.log("LOAD");

    $("#test").draggable({

        containment: "#container",

        stop: function (e, ui) {

            console.log("DRAG", ui.position);

        }

    });

});
