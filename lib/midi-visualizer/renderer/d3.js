/* vim: set expandtab, ts=3, sw=3 */

'use strict';

var AbstractRenderer = require('./abstract.js');

function D3Renderer() {
   AbstractRenderer.call(this);
}

D3Renderer.prototype = Object.create(AbstractRenderer);

module.exports = D3Renderer;
