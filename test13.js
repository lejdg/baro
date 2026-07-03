
console.log("START");

window.addEventListener("load", function(){

    $("#test").draggable({
        containment: document.getElementById("container")
    });

    console.log("DRAG AKTIV");

});
