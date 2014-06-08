/* vim: set expandtab ts=3 sw=3 */
/* jshint expr: true, es5: true */
/* globals describe: true, before: true, beforeEach: true, afterEach: true, it: true, Uint8Array: true, xit: true */
'use strict';

var chai = require('../public/js/chai.js'),
	expect = chai.expect,
	midiPipelineRenderFactory = require('../lib/midi-visualizer/renderers.js');

describe('midi-visualizer pipeline-renderer factory', function () {

	chai.should();
	
	it('should be able to list a set of predefined renderers', function () {
		var rendererIds = midiPipelineRenderFactory.getAvailableRenderers();

		rendererIds.length.should.be.greaterThan(0);
	});

	it('should be able to add a new renderer only once', function () {
		midiPipelineRenderFactory.addRenderer('TEST', {});

		midiPipelineRenderFactory.getAvailableRenderers().should.contain('TEST');

		expect(function () {
			midiPipelineRenderFactory.addRenderer('TEST', {});
		}).to.throw();
	});

	it('should be able to retrieve a specific renderer', function () {
		midiPipelineRenderFactory.getRenderer('dom').should.not.be.undefined;
	});
});
