var body = document.getElementsByTagName('body').item(0);

d3.select('body').append('svg').classed('stage', true).attr({ width: body.scrollWidth, height: body.scrollHeight });

var midiData = { tracks: [] },
    trackCount = 10,
    maxEvents = 3,
    stage,
    xScale,
    yScale;

function updateData() {
   for (var i = 0; i < trackCount; ++i) {
      midiData.tracks[i] = midiData.tracks[i] || { events: [] };

      for (var j = 0; j < maxEvents; ++j) {
         midiData.tracks[i].events[j] = {
            id: Date.now() + i + j,
            note: Math.floor(Math.random() * 256),
            velocity: Math.floor(Math.random() * 127),
            duration: Math.floor(Math.random() * 2000)
         };
      }
   }
}

function setY(d, i, j) {
   return yScale(d.note) + d.velocity;
}

function setX(d, i, j) {
   return xScale(j) + d.velocity * i;
}

var tracks;

function initCircles(trackData) {
   stage = d3.selectAll('svg.stage');
   xScale = d3.scale.linear()
      .domain([0, trackCount])
      .range([0, stage.attr('width')]);

   yScale = d3.scale.linear()
      .domain([0, 256])
      .range([stage.attr('height'), 0]);

   tracks = stage.selectAll('g.track').data(trackData);
   updateTracks();
}

function updateTracks() {

   var events = tracks.enter()
       .append('g')
       .classed('track', true)
       .selectAll('circle')
       .data(function (track) { return track.events; }, function (d) { return d.id; });

   events.enter()
       .append('circle')
       .attr('fill', function (d, i, j) { return d3.rgb(['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'][Math.floor(Math.random() * 6)]); })
       // .attr('cy', setY)
       // .attr('cx', function (d) { return -(d.velocity / 2); })
       .attr('cx', setX)
       .attr('cy', function (d) { return stage.attr('height'); })
       .attr('r',  function (d, i, j) { return d.velocity / 2; })
       .attr('opacity', 0)
       .transition()
       .duration(function (d) { return d.duration > 100 ? 50 : 1; })
       .attr('opacity', 1)
       .transition()
       .duration(function (d) { return d.duration - 50; })
       // .attr('cx', function (d) { return stage.attr('width'); })
       .attr('cy', function (d) { return 0; })
       .transition()
       .duration(100)
       .attr('opacity', 0)
       .each('end', function() { 
         d3.select(this).remove();
       });
}

var frameCount = 0;
function doIt() {
   if (++frameCount < 100) {
      // console.log('doin it...', frameCount);
      updateData();
      updateTracks();
      setTimeout(doIt, 1000);
   }
}

updateData();
initCircles(midiData.tracks);
doIt();
