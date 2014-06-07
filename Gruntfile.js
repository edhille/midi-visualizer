/* jshint globalstrict: true, node: true */

module.exports = function(grunt) {
   'use strict';

   // show elapsed time at the end
   require('time-grunt')(grunt);

   require('matchdep').filterAll('grunt-*').forEach(grunt.loadNpmTasks);

	var webpack = require('webpack');
	var webpackConfig = require(__dirname + '/webpack.config.js');

	grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
      express: {
         options: {
            script: 'app.js'
         },
         prod: {
            options: {
               node_env: 'production'
            }
         }
      },
      mochaTest: {
         test: {
            options: {
              reporter: 'spec'
            },
            src: ['test/**/*.js']
         }
      },
		webpack: {
			options: webpackConfig,
			build: {
				plugins: webpackConfig.plugins.concat(
					new webpack.DefinePlugin({
						'process.env': {
							'NODE_ENV': JSON.stringify('production')
						}
					}),
					new webpack.optimize.DedupePlugin(),
					new webpack.optimize.UglifyJsPlugin()
				)
			},
			'build-dev': {
				devtool: 'sourcemap',
				debug: true
			}
		},
      // TODO: this does not work...
		'webpack-dev-server': {
			options: {
				webpack: webpackConfig,
            // contentBase: 'http://localhost/',
            contentBase: __dirname
				// publicPath: webpackConfig.output.publicPath
			},
			start: {
				keepAlive: true,
				webpack: {
					devtool: 'eval',
					debug: true
				}
			}
		},
		watch: {
			app: {
				files: ['app/**/*', 'web_modules/**/*'],
				tasks: ['webpack:build-dev'],
				options: {
					spawn: false
				}
			}
		}
	});

	// The development server (the recommended option for development)
   // grunt.registerTask("default", ["webpack-dev-server:start"]);

	// Build and watch cycle (another option for development)
	// Advantage: No server required, can run app from filesystem
	// Disadvantage: Requests are not blocked until bundle is available,
	//               can serve an old app on too fast refresh
	grunt.registerTask('dev', ['webpack:build-dev', 'watch:app', 'webpack-dev-server:start']);

	// Production build
	grunt.registerTask('build', ['webpack:build']);

   // run tests by default
   grunt.registerTask('default', ['mochaTest']);

   // Heroku deploy
   grunt.registerTask('heroku', ['webpack:build', 'express:prod']);
};
