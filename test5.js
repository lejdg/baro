window.addEventListener("load", function(){

    $("#test").draggable({

        containment:"#container",

        stop:function(e,ui){

            const fields = {
                date:"03/07/2026",
                "comment-63778":
                    ui.position.left + "," + ui.position.top
            };

            console.log(fields);

            $.ajax({

                type:"POST",
                url:"/PdBoard/AddStaticTeambaroResult",

                data:{
                    pdBoardId:"7018",
                    happy:0,
                    normal:0,
                    sad:0,
                    locked:false,
                    chkPlace:JSON.stringify(fields)
                },

                success:function(){
                    console.log("GESPEICHERT");
                },

                error:function(xhr){
                    console.log("FEHLER", xhr.status);
                }

            });

        }
    });

});
