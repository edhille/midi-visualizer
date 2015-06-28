/* jshint expr: true */
'use strict';

var sinon = require('sinon');

function createMockMidi() {
	return {
		header: {
			timeDivision: 96
		},
		tracks: [
			{
				events: [
					{ type: 'note', subtype: 'on', note: 1 },
					{ type: 'note', subtype: 'off', note: 1 },
					{ type: 'note', subtype: 'on', note: 10 },
					{ type: 'note', subtype: 'off', note: 10 },
					{ type: 'note', subtype: 'on', note: 5 },
					{ type: 'note', subtype: 'off', note: 5 }
				]
			},
			{
				events: []
			},
			{
				events: [
					{ type: 'note', subtype: 'on', note: 20 },
					{ type: 'note', subtype: 'off', note: 20 },
					{ type: 'note', subtype: 'on', note: 10 },
					{ type: 'note', subtype: 'off', note: 10 },
					{ type: 'note', subtype: 'on', note: 30 },
					{ type: 'note', subtype: 'off', note: 30 }
				]
			},
		]
	};
}

function createMockDoc() {
	return {
		appendChild: sinon.spy()
	};
}

module.exports = {
	createMockMidi: createMockMidi,
	createMockDoc: createMockDoc
};
