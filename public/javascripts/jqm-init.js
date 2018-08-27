$(function () {
    $("[data-role='navbar']").navbar();
    $("[data-role='header'], [data-role='footer']").toolbar();
    $("#mypanel").enhanceWithin().panel();
});

$(document).on("pagecontainerchange", function () {
    var current = $(".ui-page-active").jqmData("title");
    $("[data-role='header'] h1").text(current);
    $("[data-role='navbar'] a.ui-btn-active").removeClass("ui-btn-active");
    $("[data-role='navbar'] a").attr("data-prefetch", true);
    $("[data-role='navbar'] a").each(function () {
        if ($(this).text() === current) {
            $(this).addClass("ui-btn-active");
        }
    });
});

$(document).on('mobileinit', function () {

    $(document).on("pagecontainershow", function (event, ui) {
        ui.prevPage.remove();
    });
});
