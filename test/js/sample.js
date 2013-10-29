(function(){

    var score  = 0;

	// consider using a debounce utility if you get too many consecutive events
	$(window).on('motion', function(ev, data){
        console.log('detected motion at object: ' + data.spot.el.id);
        var spot = $(data.spot.el);

        spot.remove();
        score++;
        $('#score').text('Score: ' + score);

        setTimeout(function(){
            $('#hotSpots').append('<div id="ball" class=""></div>');
        }, 5000);
	});

})();