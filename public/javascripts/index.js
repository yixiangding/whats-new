$( function () {

    $('input').autocomplete({
        source: function (request, response) {
            $.ajax({
                url: "/autocomplete",
                dataType: "json",
                data: {
                    q: request.term
                },
                success: function( data ) {
                    response( data );
                }
            });
        },
        onSelect: function (suggestion) {
            console.log('suggestion value:', suggestion.value, 'suggestion data', suggestion.data);
        }
    });
});