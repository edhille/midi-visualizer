var requestAnimationFrame = (function(){
   return window.requestAnimationFrame  ||
     window.webkitRequestAnimationFrame ||
     window.mozRequestAnimationFrame    ||
     window.oRequestAnimationFrame      ||
     window.msRequestAnimationFrame     ||
     function(callback){
     window.setTimeout(callback, 1000 / 60);
   };
})();

var ContextClass = (window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.oAudioContext || window.msAudioContext);

var context;
var paused = false;
var firstTimestamp = 0;
var lastTimestamp = 0;
var animationClock = 0;
var microsecondsPerTick = 0;
var events = [];

window.onclick = function() { paused = !paused; };

if (ContextClass) {
   context = new ContextClass();
   loadSound();
   // setupVisualization();
} else {
   console.error('Unable to setup audio context');
}

function animate(timestamp) {
   firstTimestamp = firstTimestamp || timestamp;

   var relativeTimestamp = timestamp - firstTimestamp;
   var delta = relativeTimestamp - lastTimestamp;
   var eventsToRender = [];
   var lowestEventTick = Math.floor(lastTimestamp) * 1000;
   var highestEventTick = Math.ceil(relativeTimestamp) * 1000;

   for (var i = lowestEventTick; i < highestEventTick; ++i) {
      if (events[i]) {
         eventsToRender.push(i);
      }
   }

   if (eventsToRender.length) {
      console.log('timestamp', timestamp, 'relative', relativeTimestamp, 'delta', delta);
      console.log({ lastTimestamp: lastTimestamp, lowestEventTick: lowestEventTick, highestEventTick: highestEventTick });
      console.log('eventTimes', eventsToRender);
   }

   lastTimestamp = relativeTimestamp;

   if (!paused) requestAnimationFrame(animate);
}

function loadSound() {
   var request = new XMLHttpRequest();
   request.open('GET', '/bass.wav', true);
   request.responseType = 'arraybuffer';

   request.onload = function() {
      var oReq = new XMLHttpRequest();
      oReq.open('GET', '/bass.mid', true);
      oReq.responseType = 'arraybuffer';

      oReq.onload = function (oEvent) {
         var arrayBuffer = oReq.response; // Note: not oReq.responseText

         if (arrayBuffer) {
            var byteArray = new Uint8Array(arrayBuffer);
            var midi = new Midi({midiByteArray: byteArray});
            var tempo = midi.tracks[0].tempo;
            var noteToggleEventTimes = Object.keys(midi.tracks[1].eventsByTime);
            microsecondsPerTick = tempo/midi.header.timeDivision;
            // console.log('midi', midi);
            // console.log('timeDivision', midi.header.timeDivision, 'tempo', tempo, 'microsecondsPerTick', microsecondsPerTick);
            // console.log('eventOffsets', noteToggleEventTimes.join(', '));
            // console.log('timeOffsets', noteToggleEventTimes.map(function(eventOffset){return eventOffset * microsecondsPerTick;}).join(', '));
            events = midi.tracks[1].eventsByTime;
            requestAnimationFrame(animate);
         }

         context.decodeAudioData(request.response, function (buffer) {
            // playAudio(buffer);
         }, function () { console.error('CRAP!', arguments); });
      };

      oReq.send();
   };

   request.send();
}

function playAudio(buffer) {
   var source = context.createBufferSource();
   source.buffer = buffer;
   source.connect(context.destination);
   source.start(0);
}

function setupVisualization() {
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
}
