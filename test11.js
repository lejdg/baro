console.log("START");

window.addEventListener("load", function () {

    const test = document.getElementById("test");

    test.addEventListener("mousedown", function () {
        console.log("MOUSEDOWN");
    });

    $("#test").draggable();

    console.log("DRAG AKTIV");

});
