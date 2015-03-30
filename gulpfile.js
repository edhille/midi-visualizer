/* jshint node: true, es5: true */
'use strict';

var gulp = require('gulp');
var del = require('del');
var browserify = require('browserify');
var babelify = require('babelify');
var through2 = require('through2');
var rename = require('gulp-rename');
var lab = require('gulp-lab');


// BEGIN CLI options parsing (NOT USED YET)
var minimist = require('minimist');
var knownOptions = [
	{ string: 'file', 'default': '*' }
];
var options = minimist(process.argv.slice(2), knownOptions);
// console.dir(options);
var filter = require('gulp-filter'); // NOT YET USED...
// END CLI options parsing (NOT USED YET)

gulp.task('clean', function (cb) {
	del([
		'./dist/*'
	], cb);
});

gulp.task('build', ['clean'], function () {
    return gulp.src('./src/main.js')
        .pipe(through2.obj(function (file, enc, next) {
            browserify(file.path, { debug: process.env.NODE_ENV === 'development' })
                .transform(babelify)
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
});

gulp.task('test', function () {
	return gulp.src('test')
		.pipe(lab('-T ./lab-es6-transformer.js -l -c'));
});

var sourceWatcher = gulp.watch('./src/**/*.js', ['test']);
sourceWatcher.on('change', function (event) {
	console.log('Source file "' + event.path + '" was ' + event.type + ', running tests...');
});

var testWatcher = gulp.watch('./test/**/*.js', ['test']);
testWatcher.on('change', function (event) {
	console.log('Test file "' + event.path + '" was ' + event.type + ', running tests...');
});

gulp.task('default', ['build']);
