/* jshint node: true, es5: true */
'use strict';

var gulp = require('gulp');

function clean(cb) {
	var del = require('del');

	del(['./coverage/*']).then(function (paths) {
		/* eslint no-console: [0] */
		console.log('Deleted:\n', paths.join('\n'));
	}).then(cb);
}

function test(cb, doCoverage) {
	return gulp.src('test/**/*.spec.js', { read: false })
		.pipe(require('gulp-spawn-mocha')({
			istanbul: doCoverage,
			asyncOnly: true,
			checkLeaks: true
		}));
}

function coverage(cb) {
	return test(cb, true);
}

function watch() {
	var sourceWatcher = gulp.watch('./src/**/*.js', ['test']);
	sourceWatcher.on('change', function (event) {
		console.log('Source file "' + event.path + '" was ' + event.type + ', running tests...');
	});

	var testWatcher = gulp.watch('./test/**/*.js', ['test']);
	testWatcher.on('change', function (event) {
		console.log('Test file "' + event.path + '" was ' + event.type + ', running tests...');
	});
}

gulp.task('clean', clean);
gulp.task('coverage', ['clean'], coverage);
gulp.task('watch', watch);
