// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { join } from 'path';

// 保存 WebviewPanel 的实例，便于后续访问
let currentPanel: vscode.WebviewPanel | undefined = undefined;

// 获取当前主题
function getCurrentTheme(): 'light' | 'dark' {
	return vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark 
		|| vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.HighContrast 
		? 'dark' : 'light';
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "fhir-map" is now active in the web extension host!');
	
	// 监听主题变化
	context.subscriptions.push(
		vscode.window.onDidChangeActiveColorTheme(theme => {
			if (currentPanel) {
				// 发送主题变化消息到 webview
				currentPanel.webview.postMessage({
					command: 'themeChanged',
					theme: getCurrentTheme()
				});
			}
		})
	);

	// 注册打开 FHIR 映射设计器的命令
	const disposable = vscode.commands.registerCommand('fhir-map.openFhirMapDesigner', () => {
		const columnToShowIn = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		if (currentPanel) {
			// 如果面板已经存在，则激活它
			currentPanel.reveal(columnToShowIn);
			return;
		}

		// 创建并显示新的 webview 面板
		currentPanel = vscode.window.createWebviewPanel(
			'fhirMapDesigner', // 标识符
			'FHIR 映射逻辑模型设计器', // 面板标题
			columnToShowIn || vscode.ViewColumn.One, // 显示在编辑器的位置
			{
				// 启用 JavaScript
				enableScripts: true,
				// 保持 webview 在后台运行
				retainContextWhenHidden: true,
				// 限制 webview 可访问的资源
				localResourceRoots: [
					vscode.Uri.joinPath(context.extensionUri, 'dist'),
					vscode.Uri.joinPath(context.extensionUri, 'resources'),
					vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview'),
					vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview', 'assets'),
					vscode.Uri.joinPath(context.extensionUri, 'webview-ui/build'),
					vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview', 'assets', 'App-*.js'),
					vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview', 'assets', 'vendor-*.js')
				  ],
			}
		);

		// 设置 webview 的初始 HTML 内容
		currentPanel.webview.html = getReactWebviewContent(context, currentPanel.webview);

		// 处理 webview 关闭事件
		currentPanel.onDidDispose(
			() => {
				currentPanel = undefined;
			},
			null,
			context.subscriptions
		);

		// 处理来自 webview 的消息
		currentPanel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'alert':
						vscode.window.showInformationMessage(message.text);
						// 发送响应回 webview
						currentPanel?.webview.postMessage({
							command: 'response',
							text: `收到消息: "${message.text}"`
						});
						return;
					case 'showInformationMessage':
						vscode.window.showInformationMessage(message.text);
						return;
					case 'showErrorMessage':
						vscode.window.showErrorMessage(message.text);
						return;
					case 'getTheme':
						// 发送当前主题信息到 webview
						currentPanel?.webview.postMessage({
							command: 'themeChanged',
							theme: getCurrentTheme()
						});
						return;
					case 'getResourcePath':
						// 处理资源路径请求
						if (message.path && currentPanel) {
							// 构建VS Code资源URI
							let resourceUri;
							try {
								// 如果是绝对路径，直接使用
								if (message.path.startsWith('/')) {
									resourceUri = vscode.Uri.file(message.path);
								} else {
									// 相对路径，从扩展资源目录解析
									resourceUri = vscode.Uri.joinPath(context.extensionUri, 'resources', message.path);
								}
								
								// 转换为Webview可用的URI
								const webviewResourceUri = currentPanel.webview.asWebviewUri(resourceUri).toString();
								
								// 返回处理后的资源路径
								currentPanel.webview.postMessage({
									command: 'resourcePath',
									resourcePath: webviewResourceUri,
									originalPath: message.path
								});
							} catch (error) {
								// 发送错误信息
								currentPanel.webview.postMessage({
									command: 'resourcePathError',
									error: `处理资源路径错误: ${error instanceof Error ? error.message : String(error)}`,
									originalPath: message.path
								});
							}
						}
						return;
				}
			},
			undefined,
			context.subscriptions
		);
	});

	context.subscriptions.push(disposable);

	// 保留原有的 helloWorld 命令以保持兼容性
	const helloWorldDisposable = vscode.commands.registerCommand('fhir-map.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from fhir-map in a web extension host!');
	});

	context.subscriptions.push(helloWorldDisposable);
}

/**
 * 获取加载 React 应用的 webview HTML 内容
 */
function getReactWebviewContent(context: vscode.ExtensionContext, webview: vscode.Webview): string {
	// 创建对资源的引用
	const scriptUri = webview.asWebviewUri(
		vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview', 'index.js')
	);
	
	const styleUri = webview.asWebviewUri(
		vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview', 'index.css')
	);
	
	return `<!DOCTYPE html>
	<html lang="zh-CN">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<meta http-equiv="Content-Security-Policy" content="default-src 'none'; connect-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src ${webview.cspSource} 'unsafe-inline' 'unsafe-eval'; style-src ${webview.cspSource} 'unsafe-inline';">
		<title>FHIR 映射逻辑模型设计器</title>
		<link href="${styleUri}" rel="stylesheet" />
	</head>
	<body>
		<div id="root"></div>
		<script type="module" src="${scriptUri}"></script>
		<!-- 添加一个调试信息 -->
		<script>
			console.log('WebView 已加载，正在尝试初始化 React 应用...');
			window.onerror = function(message, source, lineno, colno, error) {
				console.error('WebView 错误:', message, 'at', source, lineno, colno);
				document.getElementById('root').innerHTML = '<div style="color:var(--vscode-errorForeground);padding:20px;"><h2>加载错误</h2><p>' + message + '</p><p>位置: ' + source + ':' + lineno + ':' + colno + '</p></div>';
				return true;
			};
		</script>
	</body>
	</html>`;
}

// This method is called when your extension is deactivated
export function deactivate() {}
