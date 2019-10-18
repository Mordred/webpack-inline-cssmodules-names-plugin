/**
 * External dependencies
 */
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const webpack = require('webpack');
const InlineCSSModulesNamesPlugin = require('..');

describe('webpack-inline-cssmodules-names-plugin', () => {
	const fixturesDirectory = path.join(__dirname, 'fixtures');
	const buildDirectory = path.join(__dirname, 'build');

	beforeAll(() => {
		rimraf.sync(buildDirectory);
	});

	afterAll(() => {
		rimraf.sync(buildDirectory);
	});

	test('should remove constant classname keys', done => {
		const inputDirectory = path.join(fixturesDirectory, 'basic');
		const outputDirectory = path.join(buildDirectory, 'basic');
		const config = {
			context: inputDirectory,
			entry: './index.js',
			mode: 'production',
			target: 'node',
			module: {
				rules: [
					{
						test: /\.css/,
						use: [{
							loader: 'css-loader',
							options: {
								modules: true,
								onlyLocals: true,
							},
						}]
					}
				]
			},
			optimization: {
				runtimeChunk: false,
				moduleIds: 'named',
				chunkIds: 'named',
				minimize: false,
			},
			output: {
				path: outputDirectory,
			},
			plugins: [
				new InlineCSSModulesNamesPlugin([/\.css$/]),
			],
		};

		webpack(config, err => {
			expect(err).toBeNull();

			const outputFile = path.join(outputDirectory, 'main.js');
			const outputFileContent = fs.readFileSync(outputFile, 'utf8');
			expect(outputFileContent).toMatchSnapshot('Output bundle should match snapshot');

			done();
		});
	});

	test('should produce expected output', done => {
		const inputDirectory = path.join(fixturesDirectory, 'with-variable');
		const outputDirectory = path.join(buildDirectory, 'with-variable');
		const config = {
			context: inputDirectory,
			entry: './index.js',
			mode: 'production',
			target: 'node',
			module: {
				rules: [
					{
						test: /\.css/,
						use: [{
							loader: 'css-loader',
							options: {
								modules: true,
								onlyLocals: true,
							},
						}]
					}
				]
			},
			optimization: {
				runtimeChunk: false,
				moduleIds: 'named',
				chunkIds: 'named',
				minimize: false,
			},
			output: {
				path: outputDirectory,
			},
			plugins: [
				new InlineCSSModulesNamesPlugin([/\.css$/]),
			],
		};

		webpack(config, err => {
			expect(err).toBeNull();

			const outputFile = path.join(outputDirectory, 'main.js');
			const outputFileContent = fs.readFileSync(outputFile, 'utf8');
			expect(outputFileContent).toMatchSnapshot('Output bundle should match snapshot');

			done();
		});
	});

});