/* vim: set expandtab ts=3 sw=3: */

'use strict';

var utils = require('funtils'),
    partial = utils.partial,
    dispatch = utils.dispatch,
    THREE = require('three'),
    renderers = require('./midi-visualizer-renderers.js'),
    threeJsRenderer = renderers.threejs.renderer,
    types = require('./midi-visualizer-types.js'),
    ThreeJsRenderState = types.ThreeJsRenderState,
    AnimEvent = types.AnimEvent,
    RenderEvent = types.RenderEvent;

// Set constants for track identities
var BASS_TRACK = 1,
    DRUM_TRACK = 2,
    VIBRAPHONE_TRACK = 3,
    PLUCK_TRACK = 4,
    LEAD_1_TRACK = 5,
    HORN_TRACK = 6,
    WASH_TRACK = 7,
    LEAD_2_TRACK = 8,
    KEYS_TRACK = 9,
    GUITAR_TRACK = 10;

// TODO: make general renderer util function
function formatHsl(h, s, l) {
   return 'hsl(' + h + ', ' + s + '%, ' + l + '%)';
}

// processing functions to map animEvents to renderEvents
function processDrums(state, animEvent) {
   return [
      new RenderEvent({
         id: animEvent.id,
         length: animEvent.length,
         subtype: animEvent.event.subtype,
         color: setColor(state, animEvent),
         x: drumX(animEvent.event, state.width),
         y: drumY(animEvent.event, state.height),
         r: drumScale(animEvent.event, function(val) {return val;})
      })
   ];
}

function processBass(state, animEvent) {
   var scales = state.scales[animEvent.track];
   var radius = scales.note(r(animEvent.event));

   return [
      new RenderEvent({
         id: animEvent.id,
         length: animEvent.length,
         subtype: animEvent.event.subtype,
         color: setColor(state, animEvent),
         radius: radius,
         x: state.width / 2,
         y: state.height
      })
   ];
}

function processVibraphone(state, animEvent) {
   var scales = state.scales[animEvent.track];
   var radius = scales.note(r(animEvent.event));

   return [
      new RenderEvent({
         id: animEvent.id,
         length: animEvent.length,
         subtype: animEvent.event.subtype,
         color: setColor(state, animEvent),
         radius: radius,
         x: state.width / 2,
         y: state.height / 2
      })
   ];
}

function processPluck(state, animEvent) {
   var scales = state.scales[animEvent.track];
   var radius = scales.note(r(animEvent.event));
   var color = setColor(state, animEvent);
   var y = state.height;

   return [
      new RenderEvent({
         id: animEvent.id + '-' + 0,
         length: animEvent.length,
         subtype: animEvent.event.subtype,
         color: color,
         radius: radius,
         x: 0,
         y: y
      }),
      new RenderEvent({
         id: animEvent.id + '-' + 1,
         length: animEvent.length,
         subtype: animEvent.event.subtype,
         color: color,
         radius: radius,
         x: state.width,
         y: y
      })
   ];
}

function processGuitar(state, animEvent) {
   var scales = state.scales[animEvent.track];
   var radius = scales.note(r(animEvent.event));
   var color = setColor(state, animEvent);

   return [
      new RenderEvent({
         id: animEvent.id + '-' + 0,
         length: animEvent.length,
         subtype: animEvent.event.subtype,
         color: color,
         radius: radius,
         x: 0,
         y: 0
      }),
      new RenderEvent({
         id: animEvent.id + '-' + 1,
         length: animEvent.length,
         subtype: animEvent.event.subtype,
         color: color,
         radius: radius,
         x: state.width,
         y: 0
      })
   ];
}

function processWash(state, animEvent) {
   var scales = state.scales[animEvent.track];
   var radius = scales.note(r(animEvent.event));

   return [
      new RenderEvent({
         id: animEvent.id + '-' + 0,
         length: animEvent.length,
         subtype: animEvent.event.subtype,
         color: setColor(state, animEvent),
         radius: radius,
         x: state.width / 2,
         y: 0
      })
   ];
}

function processHorns(state, animEvent) {
   var scales = state.scales[animEvent.track];
   var radius = scales.note(r(animEvent.event));
   var color = setColor(state, animEvent);
   var y = state.height / 2;

   return [
      new RenderEvent({
         id: animEvent.id + '-' + 0,
         length: animEvent.length,
         subtype: animEvent.event.subtype,
         color: color,
         radius: radius,
         x: 0,
         y: y
      }),
      new RenderEvent({
         id: animEvent.id + '-' + 1,
         length: animEvent.length,
         subtype: animEvent.event.subtype,
         color: color,
         radius: radius,
         x: state.width,
         y: y
      })
   ];
}

function processKeys(state, animEvent) {
   var scales = state.scales[animEvent.track];
   var radius = scales.note(r(animEvent.event));
   var color = setColor(state, animEvent);
   var lx = state.width / 4;
   var rx = state.width - lx;
   var ty = state.height / 4;
   var by = ty;

   return [
      new RenderEvent({
         id: animEvent.id + '-' + 0,
         length: animEvent.length,
         subtype: animEvent.event.subtype,
         color: color,
         x: lx,
         y: ty,
         radius: radius
      }),
      new RenderEvent({
         id: animEvent.id + '-' + 1,
         length: animEvent.length,
         subtype: animEvent.event.subtype,
         color: color,
         x: rx,
         y: ty,
         radius: radius
      }),
      new RenderEvent({
         id: animEvent.id + '-' + 2,
         length: animEvent.length,
         subtype: animEvent.event.subtype,
         color: color,
         x: lx,
         y: by,
         radius: radius
      }),
      new RenderEvent({
         id: animEvent.id + '-' + 3,
         length: animEvent.length,
         subtype: animEvent.event.subtype,
         color: color,
         x: rx,
         y: by,
         radius: radius
      })
   ];
}

function processLeadOne(state, animEvent) {
   var scales = state.scales[animEvent.track];
   var radius = scales.note(r(animEvent.event));

   return [
      new RenderEvent({
         id: animEvent.id,
         length: animEvent.length,
         subtype: animEvent.event.subtype,
         color: setColor(state, animEvent),
         radius: radius,
         x: state.width / 2,
         y: state.height / 2
      })
   ];
}

function processLeadTwo(state, animEvent) {
   var scales = state.scales[animEvent.track];
   var radius = scales.note(r(animEvent.event));

   return [
      new RenderEvent({
         id: animEvent.id,
         length: animEvent.length,
         subtype: animEvent.event.subtype,
         color: setColor(state, animEvent),
         radius: radius,
         x: state.width / 4,
         y: state.height / 4
      })
   ];
}

function generateEventMatcher(track) {
   return function _eventMatcher(eventTrack) {
      return track === eventTrack;
   };
}

function generateEventGuard(eventTrack, processor) {
   var eventMatches = generateEventMatcher(eventTrack);

   return function _testEvent(state, animEvent) {
      if (eventMatches(animEvent.track)) return processor.apply(null, arguments);
   };
}

var processEvent = dispatch(
   generateEventGuard(DRUM_TRACK, processDrums),
   generateEventGuard(BASS_TRACK, processBass),
   generateEventGuard(VIBRAPHONE_TRACK, processVibraphone),
   generateEventGuard(PLUCK_TRACK, processPluck),
   generateEventGuard(GUITAR_TRACK, processGuitar),
   generateEventGuard(HORN_TRACK, processHorns),
   generateEventGuard(WASH_TRACK, processWash),
   generateEventGuard(LEAD_1_TRACK, processLeadOne),
   generateEventGuard(LEAD_2_TRACK, processLeadTwo),
   generateEventGuard(KEYS_TRACK, processKeys),
   // TODO: how to throw away events we do not want??
   generateEventGuard(0, function (state, animEvent) { return [animEvent]; }),
   function _noMatch(state, animEvent) { throw new Error('unknown event (track "' + animEvent.track + '")'); }
);

function setupInstruments(renderer) {
   var geometry = new THREE.BoxGeometry(1, 1, 1);

   setupDrums(renderer, geometry);
   setupBass(renderer);
}

function setupDrums(renderer, geometry) {
   var materials = [new THREE.MeshLambertMaterial({
        color : 0xFF0000
    }), new THREE.MeshLambertMaterial({
        color : 0x00FF00
    }), new THREE.MeshLambertMaterial({
        color : 0x0000FF
    }), new THREE.MeshLambertMaterial({
        color : 0xAA0000
    }), new THREE.MeshLambertMaterial({
        color : 0x00AA00
    }), new THREE.MeshLambertMaterial({
        color : 0x0000AA
    })];

   renderer.drums = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));
}

function setupBass(renderer) {
   var geometry = new THREE.SphereGeometry(50, 16, 16),
       material = new THREE.MeshBasicMaterial( { color: 0xffff00 });

   renderer.bass = new THREE.Mesh(geometry, material);
   renderer.bass.overdraw = true;
   // renderer.bass.position = 
}

function prepDOM(state) {
   var geometry = new THREE.BoxGeometry(1, 1, 1);

   state = renderers.threejs.util.prepDOM(state);
   state = setupInstruments(state);

   state.camera.position.z = 5;

   // create a point light
   var pointLight = new THREE.PointLight(0xFFFFFF);
   pointLight.position.set(0, 300, 200);
   state.scene.add(pointLight);

   return new ThreeJsRenderState({
      root: state.root,
      width: state.width,
      height: state.height,
      animEvents: state.animEvents,
      renderEvents: state.renderEvents,
      currentRunningEvents: state.currentRunningEvents,
      scene: state.scene,
      camera: state.camera,
      renderer: state.renderer,
      geometry: geometry
   });
}

function render(state, time) {
   var renderEvents = state.renderEvents;

   state.instruments.drums.rotation.x += 0.1;
   state.instruments.drums.rotation.y += 0.1;
   
   for (var i = 0, l = renderEvents.length; i < l; ++i) {
      var event = renderEvents[i];
      if (event.type === 'note') {
         if (event.subtype === 'on') {
            switch (event.name) {
               case 'drums':
                  state.instruments.drums.scale.x = event.r;
                  state.instruments.drums.scale.y = event.r;
                  state.instruments.drums.scale.z = event.r;  
                  state.scene.add(state.instruments.drums);
                  break;
               case 'bass':
                  state.instruments.bass.scale.x = event.r;
                  state.instruments.bass.scale.y = event.r;
                  state.instruments.bass.scale.z = event.r;  
                  state.scene.add(state.instruments.bass);
                  break;
               default:
                  break;
            }
         } else if (event.subtype === 'off') {
            state.scene.remove(state.instruments[event.name]);
         }
      }
   }

   state.renderer.render(state.scene, state.camera);

   return state;
}

function setColor(event) {
   var track = event.track,
       note = event.data.note,
       velocity = event.data.velocity,
       hue = [
          0, // no hue (no track data),
          250, // bass
          200, // drums,
          300, // vibraphone 
          0, // nothing
          100, // guitar
          120, // horn
          210, // wash
          80, // lead
          270 // keys
       ];

   return formatHsl(hue[track], note, velocity);
}

function drumScale(event, scale) {
   var note = event.data.note;

   if (note === 0 || note === 1) {
      // bass drum
      return scale(1) / 2;
   } else if (note === 6) {
      // hihat
      return scale(3);
   } else {
      // assume snare...
      return scale(2);
   }
}

function drumX(event, scale, width, height) {
   return width / 2;
}

function drumY(event, scale, width, height) {
   return height / 2;
}

function r(datum) {
   if (!utils.existy(datum.data.note)) throw new Error('no note' + datum);
   return datum.data.note / 2;
}

function prepThreeJs(state, midi) {
   return renderers.threejs.utils.prep(state, midi);   
}

threeJsRenderer.lift('prep', prepThreeJs);

module.exports = threeJsRenderer;
