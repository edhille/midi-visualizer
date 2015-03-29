/* jshint node: true, es5: true */
'use strict';

var gulp = require('gulp');
var del = require('del');
var browserify = require('browserify');
var babelify = require('babelify');
var through2 = require('through2');
var rename = require('gulp-rename');
var lab = require('gulp-lab');
var minimist = require('minimist');

var knownOptions = [
	{
		string: 'file'
	}
];

var options = minimist(process.argv.slice(2), knownOptions);
 
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

gulp.task('default', ['build']);
