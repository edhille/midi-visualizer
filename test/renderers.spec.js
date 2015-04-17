/* jshint expr: true */
/* globals describe: true, beforeEach: true, afterEach: true, it: true */
'use strict';

var rewire = require('rewire');
var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');

var renderers = rewire('../src/renderers');

describe('renderers', function () {
	var testRenderer;

	describe('#prep', function () {
		var midiStub, rendererStub, trackTransformerStub, transformMidiStub, testConfig;

		beforeEach(function (done) {
			midiStub = sinon.stub();
			rendererStub = sinon.stub();
			rendererStub.RenderState = sinon.spy();
			trackTransformerStub = sinon.stub();
			transformMidiStub = sinon.stub();
			renderers.__set__('transformMidi', transformMidiStub);
			testConfig = {
				root: 'TEST-ROOT',
				width: 666,
				height: 999,
				renderer: rendererStub,
				transformers: [
					trackTransformerStub
				]
			};
			testRenderer = renderers.prep(midiStub, testConfig);

			done();
		});

		afterEach(function (done) {
			midiStub = rendererStub = trackTransformerStub = transformMidiStub = testConfig = null;
			done();
		});

		it('should have called our renderer', function (done) {
			expect(rendererStub.called).to.be.true;
			done();
		});

		describe('config.renderer.RenderState', function () {
			it('should have instantiated our RenderState only once (to create initial state)', function (done) {
				expect(rendererStub.RenderState.calledOnce).to.be.true;
				done();
			});

			it('should have used the render state as an object constructor', function (done) {
				expect(rendererStub.RenderState.calledWithNew()).to.be.true;
				done();
			});

			it('should have passed in the expected state params', function (done) {
				expect(rendererStub.RenderState.lastCall.calledWithExactly({
					root: testConfig.root,
					width: testConfig.width,
					height: testConfig.height,
					renderEvents: []
				})).to.be.true;
				done();
			});
		});
	});
});
