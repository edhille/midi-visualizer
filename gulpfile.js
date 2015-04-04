/* jshint node: true, es5: true */
'use strict';

var gulp = require('gulp');

var minimist = require('minimist');
var knownOptions = [
	{ string: 'html-output', 'default': false }
];
var options = minimist(process.argv.slice(2), knownOptions);

function clean(cb) {
	var del = require('del');

	del([
		'./dist/*',
		'./coverage/*'
	], cb);
}

function build() {
	var browserify = require('browserify');
	var through2 = require('through2');
	var rename = require('gulp-rename');

    return gulp.src('./src/main.js')
        .pipe(through2.obj(function (file, enc, next) {
            browserify(file.path, { debug: process.env.NODE_ENV === 'development' })
                .bundle(function (err, res) {
                    if (err) { return next(err); }
 
                    file.contents = res;
                    next(null, file);
                });
        }))
        .on('error', function (error) {
            console.log(error.stack);
            this.emit('end');
        })
        .pipe(rename('bundle.js'))
        .pipe(gulp.dest('./dist'));
}

function test(cb, doCoverage) {
	return gulp.src('test/**/*.spec.js', { read: false })
		.pipe(require('gulp-spawn-mocha')({
			istanbul: doCoverage
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
gulp.task('build', ['clean'], build);
gulp.task('test', ['clean'], test);
gulp.task('coverage', ['clean'], coverage);
gulp.task('watch', watch);
gulp.task('default', ['build']);
