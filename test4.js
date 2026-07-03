window.addEventListener("load", function(){

    console.log("LOAD");

    console.log("Container:", $("#container").length);
    console.log("Test:", $("#test").length);

    $("#test").draggable({
        containment:"#container",

        stop:function(e,ui){
            console.log("Position", ui.position);
        }
    });

});
