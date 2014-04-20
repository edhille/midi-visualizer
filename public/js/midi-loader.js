var oReq = new XMLHttpRequest();
oReq.open("GET", "/vunder.mid", true);
oReq.responseType = "arraybuffer";

oReq.onload = function (oEvent) {
//   var arrayBuffer = oReq.response; // Note: not oReq.responseText
//   if (arrayBuffer) {
//     var byteArray = new Uint8Array(arrayBuffer);
//     var midi = new Midi({midiByteArray: byteArray});
//     var stage = d3.selectAll('svg.stage');
//     var max = 0;
//     var x = d3.scale.linear()
//                .domain([0, 256])
//                .range([0, stage.attr('width')]);
//     var y = d3.scale.linear()
//                .domain([0, d3.max(midi.tracks.map(function (track) { return track.events.length > max ? track.events.length : max; }))])
//                .range([0, stage.attr('height')]);
//
//     console.log(midi, x, y);
//
//     stage.selectAll('g.track')
//        .data(midi.tracks)
//        .enter()
//        .append('g')
//        .attr('class', function() { return 'track'; })
//        .selectAll('circle')
//        .data(function (track) { return track.events; })
//        .enter()
//        .append('circle')
//        .attr('cx', function (d, i) { console.log(d.code, x(d.code)); return x(d.code); })
//        .attr('cy', function (d, i) { console.log(i, y(i)); return y(i); })
//        .attr('r', function () { return Math.floor(Math.random() * 5); });
//   }
};
oReq.send(null);
