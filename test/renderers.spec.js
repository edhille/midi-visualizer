/* jshint expr: true */
/* globals describe: true, beforeEach: true, afterEach: true, it: true */
'use strict';

var rewire = require('rewire');
var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');

var AnimEvent = require('../src/data-types').AnimEvent;
var renderers = rewire('../src/renderers');

function generateAnimEvents() {
	return {
		0: [new AnimEvent({ event: { note: 127 }, track: 0, length: 100 }), new AnimEvent({ event: { note: 100 }, track: 1, length: 200 })],
		100: [new AnimEvent({ event: { note: 127 }, track: 0, length: 0 })],
		200: [new AnimEvent({ event: { note: 100 }, track: 1, length: 0 })]
	};
}

describe('renderers', function () {
	var testRenderer;

	describe('#prep', function () {
		var midiStub, rendererStub, trackTransformerStub, transformMidiStub, testConfig;

		beforeEach(function (done) {
			midiStub = sinon.stub();
			rendererStub = sinon.stub();
			rendererStub.RenderState = sinon.spy();
			transformMidiStub = sinon.stub();
			transformMidiStub.returns(generateAnimEvents());
			renderers.__set__('transformMidi', transformMidiStub);
			testConfig = {
				root: 'TEST-ROOT',
				width: 666,
				height: 999,
				renderer: rendererStub,
				transformers: [
					function (animEvent) { return [{ id: 'test-0-' + animEvent.id }, { id: 'test-1-' + animEvent.id }]; },
					function (animEvent) { return [{ id: animEvent.id }]; }
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
					renderEvents: {
						0: [{ id: 'test-0-0-127' }, { id: 'test-1-0-127' }, { id: '1-100' }],
						100: [{ id: 'test-0-0-127' }, { id: 'test-1-0-127' }],
						200: [{ id: '1-100' }]
					}
				})).to.be.true;
				done();
			});
		});
	});
});
