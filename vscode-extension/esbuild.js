const esbuild = require('esbuild');
const glob = require('glob');
const path = require('path');
const polyfill = require('@esbuild-plugins/node-globals-polyfill');
const fs = require('fs');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * This plugin hooks into the build process to print errors in a format that the problem matcher in
 * Visual Studio Code can understand.
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
	name: 'esbuild-problem-matcher',

	setup(build) {
		build.onStart(() => {
			console.log('[watch] build started');
		});
		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				console.error(`    ${location.file}:${location.line}:${location.column}:`);
			});
			console.log('[watch] build finished');
		});
	},
};


/**
 * For web extension, all tests, including the test runner, need to be bundled into
 * a single module that has a exported `run` function .
 * This plugin bundles implements a virtual file extensionTests.ts that bundles all these together.
 * @type {import('esbuild').Plugin}
 */
const testBundlePlugin = {
	name: 'testBundlePlugin',
	setup(build) {
		build.onResolve({ filter: /[\/\\]extensionTests\.ts$/ }, args => {
			if (args.kind === 'entry-point') {
				return { path: path.resolve(args.path) };
			}
		});
		build.onLoad({ filter: /[\/\\]extensionTests\.ts$/ }, async args => {
			const testsRoot = path.join(__dirname, 'src/web/test/suite');
			const files = await glob.glob('*.test.{ts,tsx}', { cwd: testsRoot, posix: true });
			return {
				contents:
					`export { run } from './mochaTestRunner.ts';` +
					files.map(f => `import('./${f}');`).join(''),
				watchDirs: files.map(f => path.dirname(path.resolve(testsRoot, f))),
				watchFiles: files.map(f => path.resolve(testsRoot, f))
			};
		});
	}
};

async function main() {
	const ctx = await esbuild.context({
		entryPoints: [
			'src/web/extension.ts',
			'src/web/test/suite/extensionTests.ts',
		],
		bundle: true,
		format: 'cjs',
		minify: production,
		sourcemap: !production,
		sourcesContent: false,
		platform: 'browser',
		outdir: 'dist/web',
		external: ['vscode'],
		logLevel: 'silent',
		// Node.js global to browser globalThis
		define: {
			global: 'globalThis',
		},

		plugins: [
			polyfill.NodeGlobalsPolyfillPlugin({
				process: true,
				buffer: true,
			}),
			testBundlePlugin,
			esbuildProblemMatcherPlugin, /* add to the end of plugins array */
		],
	});
	
	// 单独配置 webview 的构建，输出到 dist/webview 目录
	await esbuild.build({
		entryPoints: ['src/webview/index.tsx'],
		bundle: true,
		minify: production,
		sourcemap: !production,
		format: 'esm', // 使用 ESM 格式
		outfile: 'dist/webview/index.js',
		platform: 'browser',
		target: ['es2020'],
		define: {
			'process.env.NODE_ENV': production ? '"production"' : '"development"',
			'global': 'window'
		},
		loader: {
			'.tsx': 'tsx',
			'.ts': 'tsx',
			'.jsx': 'jsx',
			'.js': 'jsx',
		},
		plugins: [
			esbuildProblemMatcherPlugin,
		],
		logLevel: 'info', // 添加详细日志
	});
	
	// 复制 CSS 文件到输出目录
	const cssContent = await fs.promises.readFile('src/webview/index.css', 'utf8');
	await fs.promises.mkdir('dist/webview', { recursive: true });
	await fs.promises.writeFile('dist/webview/index.css', cssContent);
	
	if (watch) {
		await ctx.watch();
		
		// 在观察模式下监视 CSS 文件的变化
		fs.watch('src/webview/index.css', async () => {
			try {
				const updatedCss = await fs.promises.readFile('src/webview/index.css', 'utf8');
				await fs.promises.writeFile('dist/webview/index.css', updatedCss);
				console.log('[watch] CSS file updated');
			} catch (error) {
				console.error('Error updating CSS file:', error);
			}
		});
	} else {
		await ctx.rebuild();
		await ctx.dispose();
	}
}

main().catch(e => {
	console.error(e);
	process.exit(1);
});
