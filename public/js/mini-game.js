(function(){

    // Score
    var score  = 0;

    $('#circles').hide().delay(1000).fadeIn(5000);

    // Count down
    var countdown = 5;
    var timer = setInterval(function () {
        countdown--;
        $('#countdown').text(countdown);

        // Stop timer if reached 0
        if(countdown < 0) {
            // Stop timer
            clearInterval(timer);

            $('#countdown').remove();

            // Add ball to start the game!
            $('#hotSpots').append('<div id="ball" class=""></div>');

            $('#score').text('Score: ' + score);
        }
    }, 1000);

	$(window).on('motion', function(ev, data){
        var spot = $(data.spot.el);

        // Remove the circle from screen
        spot.remove();

        // Update score
        score++;
        $('#score').text('Score: ' + score);

        // Add scene effect
        $('#circles').addClass('respawn');

        setTimeout(function(){
            // Create new cricle
            $('#hotSpots').append('<div id="ball" class=""></div>');

            // Remove scene effect
            $('#circles').removeClass('respawn');
        }, 3000);
	});

})();