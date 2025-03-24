import * as esbuild from 'esbuild';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径
const __dirname = dirname(fileURLToPath(import.meta.url));

// 获取命令行参数
const args = process.argv.slice(2);
const watch = args.includes('--watch');
const production = args.includes('--production');

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

// 设置构建选项
const buildOptions = {
	entryPoints: ['src/webview/index.tsx'],
	bundle: true,
	outfile: 'dist/webview/index.js',
	minify: production,
	sourcemap: !production,
	platform: 'browser',
	format: 'esm',
	target: ['chrome89', 'edge89', 'firefox89', 'safari15'], // VS Code使用的最低浏览器版本
	jsx: 'automatic',
	loader: {
		'.ts': 'ts',
		'.tsx': 'tsx',
		'.js': 'js',
		'.jsx': 'jsx',
		'.css': 'css'
	},
	external: ['vscode', 'fs', 'path', 'os', 'child_process'],
	define: {
		'process.env.NODE_ENV': production ? '"production"' : '"development"'
	},
	inject: ['./src/webview/process-shim.js'], // 可选：如果需要process对象
	logLevel: 'info'
};

// 如果处于开发模式且启用了观察模式
if (watch) {
	// 启动观察模式
	const context = await esbuild.context(buildOptions);
	await context.watch();
	console.log('监视中...');
} else {
	// 执行一次性构建
	const result = await esbuild.build(buildOptions);
	
	if (result.errors.length > 0) {
		console.error('构建过程中出现错误:', result.errors);
		process.exit(1);
	}
	
	if (result.warnings.length > 0) {
		console.warn('构建过程中出现警告:', result.warnings);
	}
	
	console.log('构建完成!');
	
	// 复制CSS文件到输出目录
	try {
		// 读取并写入CSS文件
		const cssContent = readFileSync('src/webview/index.css', 'utf8');
		const fs = await import('fs/promises');
		await fs.mkdir('dist/webview', { recursive: true });
		await fs.writeFile('dist/webview/index.css', cssContent);
		console.log('CSS文件已复制到输出目录');
	} catch (error) {
		console.error('复制CSS文件时出错:', error);
	}
}
