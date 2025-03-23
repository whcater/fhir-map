// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';

/**
 * FHIR映射设计器的WebView面板
 */
class FhirMapDesignerPanel {
  public static currentPanel: FhirMapDesignerPanel | undefined;
  private static readonly viewType = 'fhirMapDesigner';
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  /**
   * 创建或显示设计器面板
   */
  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // 如果已经有面板，就显示它
    if (FhirMapDesignerPanel.currentPanel) {
      FhirMapDesignerPanel.currentPanel._panel.reveal(column);
      return;
    }

    // 否则，创建一个新面板
    const panel = vscode.window.createWebviewPanel(
      FhirMapDesignerPanel.viewType,
      'FHIR 映射设计器',
      column || vscode.ViewColumn.One,
      {
        // 启用JavaScript
        enableScripts: true,
        // 只允许访问特定资源
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'resources'),
          vscode.Uri.joinPath(extensionUri, 'webview-ui/build')
        ],
        // 保持内容不丢失
        retainContextWhenHidden: true
      }
    );

    FhirMapDesignerPanel.currentPanel = new FhirMapDesignerPanel(panel, extensionUri);
  }

  /**
   * 创建新的映射
   */
  public static createNewMapping(extensionUri: vscode.Uri) {
    FhirMapDesignerPanel.createOrShow(extensionUri);
    // 向Webview发送创建新映射的消息
    if (FhirMapDesignerPanel.currentPanel) {
      FhirMapDesignerPanel.currentPanel._panel.webview.postMessage({
        command: 'createNewMapping'
      });
    }
  }

  /**
   * 导入映射
   */
  public static importMapping(extensionUri: vscode.Uri) {
    // 先显示设计器
    FhirMapDesignerPanel.createOrShow(extensionUri);

    // 打开文件选择对话框
    vscode.window.showOpenDialog({
      canSelectMany: false,
      filters: {
        'Mapping Files': ['json', 'xml']
      },
      title: '选择要导入的映射文件'
    }).then((fileUri: vscode.Uri[] | undefined) => {
      if (fileUri && fileUri.length > 0) {
        // 读取文件内容并发送到Webview
        vscode.workspace.fs.readFile(fileUri[0]).then(
          (content: Uint8Array) => {
            if (FhirMapDesignerPanel.currentPanel) {
              FhirMapDesignerPanel.currentPanel._panel.webview.postMessage({
                command: 'importMapping',
                data: Buffer.from(content).toString()
              });
            }
          },
          (error: Error) => {
            vscode.window.showErrorMessage(`无法读取文件: ${error.message}`);
          }
        );
      }
    });
  }

  /**
   * 构造函数
   */
  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // 设置WebView内容
    this._update();

    // 监听面板关闭事件
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // 处理来自WebView的消息
    this._panel.webview.onDidReceiveMessage(
      async (message: { command: string; text?: string; data?: string; format?: string; name?: string }) => {
        switch (message.command) {
          case 'alert':
            if (message.text) {
              vscode.window.showInformationMessage(message.text);
            }
            return;
          case 'exportMapping':
            if (message.data && message.format) {
              await this._handleExport(message.data, message.format);
            }
            return;
          case 'saveMapping':
            // 保存到工作区
            if (message.data && message.name) {
              await this._handleSave(message.data, message.name);
            }
            return;
        }
      },
      null,
      this._disposables
    );
  }

  /**
   * 处理导出映射请求
   */
  private async _handleExport(data: string, format: string) {
    // 打开文件保存对话框
    const fileUri = await vscode.window.showSaveDialog({
      filters: {
        'FHIR Mapping': [format]
      },
      saveLabel: '导出',
      title: '导出FHIR映射'
    });

    if (fileUri) {
      try {
        // 将数据写入文件
        await vscode.workspace.fs.writeFile(
          fileUri,
          new Uint8Array(Buffer.from(data))
        );
        vscode.window.showInformationMessage('映射已成功导出');
      } catch (error) {
        vscode.window.showErrorMessage(`导出失败: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * 处理保存映射请求
   */
  private async _handleSave(data: string, name: string) {
    if (!vscode.workspace.workspaceFolders) {
      vscode.window.showErrorMessage('没有打开的工作区，无法保存映射');
      return;
    }

    const workspaceFolder = vscode.workspace.workspaceFolders[0];
    const mappingFolder = vscode.Uri.joinPath(workspaceFolder.uri, 'fhir-mappings');

    try {
      // 确保目录存在
      try {
        await vscode.workspace.fs.stat(mappingFolder);
      } catch {
        await vscode.workspace.fs.createDirectory(mappingFolder);
      }

      // 保存文件
      const fileUri = vscode.Uri.joinPath(mappingFolder, `${name}.json`);
      await vscode.workspace.fs.writeFile(
        fileUri,
        new Uint8Array(Buffer.from(data))
      );
      vscode.window.showInformationMessage(`映射 "${name}" 已保存`);
    } catch (error) {
      vscode.window.showErrorMessage(`保存失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 更新WebView内容
   */
  private _update() {
    this._panel.title = 'FHIR 映射设计器';
    this._panel.webview.html = this._getHtmlForWebview();
  }

  /**
   * 获取WebView HTML内容
   */
  private _getHtmlForWebview() {
    // WebView中使用的简单HTML模板
    return `<!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>FHIR 映射设计器</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          padding: 0;
          margin: 0;
          background-color: var(--vscode-editor-background);
          color: var(--vscode-editor-foreground);
        }
        .container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          padding: 20px;
        }
        .placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
        }
        button {
          background-color: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: none;
          padding: 8px 12px;
          margin: 5px;
          cursor: pointer;
          border-radius: 2px;
        }
        button:hover {
          background-color: var(--vscode-button-hoverBackground);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="placeholder">
          <h2>FHIR 映射逻辑模型设计器</h2>
          <p>正在开发中，请使用以下按钮进行测试:</p>
          <div>
            <button id="newBtn">创建新映射</button>
            <button id="testBtn">测试消息</button>
          </div>
        </div>
      </div>
      <script>
        const vscode = acquireVsCodeApi();
        
        // 测试按钮
        document.getElementById('testBtn').addEventListener('click', () => {
          vscode.postMessage({
            command: 'alert',
            text: 'FHIR 映射设计器准备就绪!'
          });
        });
        
        // 新建映射按钮
        document.getElementById('newBtn').addEventListener('click', () => {
          vscode.postMessage({
            command: 'alert',
            text: '新建映射功能开发中...'
          });
        });
        
        // 处理来自扩展的消息
        window.addEventListener('message', event => {
          const message = event.data;
          switch (message.command) {
            case 'createNewMapping':
              // 处理创建新映射的消息
              break;
            case 'importMapping':
              // 处理导入映射的消息
              break;
          }
        });
      </script>
    </body>
    </html>`;
  }

  /**
   * 释放资源
   */
  public dispose() {
    FhirMapDesignerPanel.currentPanel = undefined;

    // 清理资源
    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}

/**
 * 激活扩展
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('FHIR 映射逻辑模型设计器扩展已激活');

  // 注册命令: 打开映射设计器
  context.subscriptions.push(
    vscode.commands.registerCommand('fhir-map.openMapDesigner', () => {
      FhirMapDesignerPanel.createOrShow(context.extensionUri);
    })
  );

  // 注册命令: 创建新映射
  context.subscriptions.push(
    vscode.commands.registerCommand('fhir-map.createNewMapping', () => {
      FhirMapDesignerPanel.createNewMapping(context.extensionUri);
    })
  );

  // 注册命令: 导入映射
  context.subscriptions.push(
    vscode.commands.registerCommand('fhir-map.importMapping', () => {
      FhirMapDesignerPanel.importMapping(context.extensionUri);
    })
  );

  // 注册命令: 导出映射
  context.subscriptions.push(
    vscode.commands.registerCommand('fhir-map.exportMapping', () => {
      vscode.window.showInformationMessage('请在映射设计器中使用导出功能');
    })
  );
}

/**
 * 停用扩展
 */
export function deactivate() {
  // 清理资源
} 