$(function(){

    console.log("READY");

    $("#test").draggable({
        containment:"#container",
        stop:function(e,ui){
            console.log(ui.position);
        }
    });

});
