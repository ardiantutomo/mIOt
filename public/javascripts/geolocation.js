$(document).on("pagecontainershow", function (event, ui) {
    pageId = $("body").pagecontainer("getActivePage").prop('id');
    switch (pageId) {
        case "sign-in-page":
            $("#save-info-form").submit(function (e) {
                e.preventDefault();
                
                var request = $.ajax({
                    url: '/shareGeoLoc',
                    data: $(this).serialize(),
                    method: "POST"
                });
                
                request.done(function (response) {
                    if(response.status === "ERROR"){
                        alert("INTERNAL SERVER ERROR" + response.message);
                    } else {
                        alert(response.message);
                    }
                });
            });
            break;
        
    }
});
