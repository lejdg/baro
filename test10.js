console.log("START");

window.addEventListener("load", function () {

    document.addEventListener("mousedown", function(e){

        console.log(
            "GEKLICKT:",
            e.target,
            "ID:",
            e.target.id,
            "CLASS:",
            e.target.className
        );

    });

});
