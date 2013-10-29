(function(){


	// consider using a debounce utility if you get too many consecutive events
	$(window).on('motion', function(ev, data){
		console.log('detected motion at', new Date(), 'with data:', data);
		var spot = $(data.spot.el);
		spot.addClass('active');
		setTimeout(function(){
			spot.removeClass('active');
		}, 230);
	});
	// examples for id usage
	$('#ball').on('motion', function(){
        $('#ball').css( "opacity", $('#ball').css('opacity') - 0.01 );
		console.log('touched ball');
	});

})();