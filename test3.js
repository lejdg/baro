
window.addEventListener("load", function(){

    console.log("LOAD");
    console.log("jQuery", typeof $);

    $("#test").draggable({
        containment:"#container",
        stop:function(e,ui){
            console.log(ui.position);
        }
    });

});
