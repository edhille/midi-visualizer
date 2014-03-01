(function($) {

	var $loaderDeferred = $.ajax(
		'/vunder.mid',
		{
			method: 'GET',
			dataType: 'text'
		}
	);

	$loaderDeferred.done(function(rawMidi) {
		//var midi = new Midi({ midiString: rawMidi });
		var byteParser = new ByteParser(rawMidi);
		var nextByte = byteParser.nextByte();

		while (typeof nextByte !== 'undefined') {
			console.log(nextByte);
		}
	});
})(jQuery);
