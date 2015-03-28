/* vim: set expandtab ts=3 sw=3: */
/* globals document: true, window: true */

'use strict';

var AbstractRenderer = require('./abstract.js'),
    THREE = require('three');

function ThreeJsRenderer() {
   AbstractRenderer.apply(this, arguments);

   this.scene = null;
   this.camera = null;
   this.renderer = null;
}

ThreeJsRenderer.prototype = Object.create(AbstractRenderer.prototype);

ThreeJsRenderer.prototype.prepDOM = function prepDOM(midiVisualizer, callback) {

   this.scene = new THREE.Scene();
   this.camera = new THREE.PerspectiveCamera( 75, this.width / this.height, 0.1, 1000 );
   this.renderer = new THREE.WebGLRenderer();

   this.renderer.setSize(this.width, this.height);

   midiVisualizer.dom.appendChild(this.renderer.domElement);

   callback(null);
};

ThreeJsRenderer.prototype.prepResume = function prepResume(midiVisualizer) {
   this.renderer.render(this.scene, this.camera);
};

ThreeJsRenderer.prototype.render = function(time, animData) {
   throw new Error('subclass should implement render');
};

ThreeJsRenderer.prototype.setColor = function setColor(event) {
   throw new Error('subclass should implement setColor');
};

module.exports = ThreeJsRenderer;
