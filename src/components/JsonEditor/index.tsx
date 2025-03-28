import React, { useEffect, lazy, Suspense } from 'react';
// 使用懒加载方式导入AceEditor组件
const AceEditor = lazy(() => import('react-ace').then(module => {
  // 处理ESM模式下的默认导出问题，优先使用命名导出
  const AceEditorComponent = module.default || module;
  return { default: AceEditorComponent };
})); 
import { isVSCodeEnvironment } from '../../utils/environment';
import { showWarning } from '../../utils/notification';

// 仅在Web环境中使用ESM兼容的解析器
if (!isVSCodeEnvironment()) {
  // 使用我们自定义的ESM兼容解析器，不带扩展名
  import('../../utils/ace-esm-resolver');
  
  // 使用动态导入方式导入所需的模块
  Promise.all([
    import('ace-builds/src-noconflict/mode-json'),
    import('ace-builds/src-noconflict/theme-github'),
    import('ace-builds/src-noconflict/theme-monokai'),
    import('ace-builds/src-noconflict/theme-chrome'),
    import('ace-builds/src-noconflict/ext-language_tools')
  ]).catch(err => console.error('加载ACE模块时出错:', err));
} else {
  // VSCode环境使用不同的加载机制
  console.log('VSCode环境: 使用VSCode环境特定的Ace配置');
  // 引入ESM解析器但不执行动态导入操作
  import('../../utils/ace-esm-resolver');
}

// 自定义Ace位置接口
interface AcePosition {
  row: number;
  column: number;
}

interface JsonEditorProps {
  jsonEditorValue: string;
  setJsonEditorValue: (value: string) => void;
  setParsedJson: (json: any) => void;
  isDarkMode: boolean;
  handleEditorDidMount: (editor: any) => void;
  showJsonEditor: boolean;
  setShowJsonEditor: (show: boolean) => void;
  onCursorPositionChange?: (position: AcePosition) => void;
}

const JsonEditor: React.FC<JsonEditorProps> = ({
  jsonEditorValue,
  setJsonEditorValue,
  setParsedJson,
  isDarkMode,
  handleEditorDidMount,
  showJsonEditor,
  setShowJsonEditor,
  onCursorPositionChange
}) => {
  // 确保初始化时解析JSON
  useEffect(() => {
    if (jsonEditorValue) {
      try {
        const json = JSON.parse(jsonEditorValue);
        setParsedJson(json);
      } catch (error) {
        console.error('初始化JSON解析错误:', error);
      }
    }
  }, []);

  // 自定义editor did mount处理，添加光标位置监听
  const editorDidMount = (editor: any) => {
    // 先调用原来的handleEditorDidMount处理初始化
    handleEditorDidMount(editor);
    
    // 添加光标位置变化监听
    editor.selection.on('changeCursor', () => {
      // 确保每次光标移动时JSON已被解析
      try {
        const currentValue = editor.getValue();
        const json = JSON.parse(currentValue);
        setParsedJson(json);
        
        if (onCursorPositionChange) {
          const position = editor.selection.getCursor();
          console.log('光标位置变化', position);
          onCursorPositionChange(position);
        }
      } catch (error) {
        console.error('光标移动时JSON解析错误:', error);
      }
    });
  };
  
  // 渲染JSON编辑器区域，添加编辑按钮
  const renderJsonEditorWithControls = () => {
    return (
      <div className="flex flex-col h-full">
        <div className="mb-2 flex justify-end">
          <button
            onClick={() => setShowJsonEditor(true)}
            className="px-3 py-1 text-xs rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            <i className="fas fa-edit mr-1"></i>
            编辑JSON
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <Suspense fallback={<div className="w-full h-full flex items-center justify-center">加载编辑器...</div>}>
            <AceEditor
              mode="json"
              theme={isDarkMode ? 'monokai' : 'github'}
              value={jsonEditorValue}
              onChange={(value) => {
                if (value) {
                  setJsonEditorValue(value);
                  try {
                    const json = JSON.parse(value);
                    setParsedJson(json);
                  } catch (error) {
                    console.error('JSON解析错误:', error);
                    // 不要将parsedJson设置为null，保持最后一个有效的值
                  }
                }
              }}
              name="json-editor-main"
              width="100%"
              height="100%"
              setOptions={{
                useWorker: false,
                showLineNumbers: true,
                tabSize: 2,
                showPrintMargin: false,
                readOnly: false,
                fontSize: 13
              }}
              editorProps={{ $blockScrolling: true }}
              onLoad={editorDidMount}
            />
          </Suspense>
        </div>
      </div>
    );
  };
  
  // 更新JSON编辑器对话框使用Ace编辑器
  const renderJsonEditorDialog = () => {
    if (!showJsonEditor) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-11/12 max-w-4xl h-[80vh] flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">编辑 FHIR JSON</h3>
            <button 
              onClick={() => setShowJsonEditor(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className="flex-1 p-4 flex flex-col">
            <div className="flex-1 border border-gray-300 dark:border-gray-600">
              <Suspense fallback={<div className="w-full h-full flex items-center justify-center">加载编辑器...</div>}>
                <AceEditor
                  mode="json"
                  theme={isDarkMode ? 'monokai' : 'github'}
                  value={jsonEditorValue}
                  onChange={(value) => {
                    if (value) {
                      setJsonEditorValue(value);
                      try {
                        const json = JSON.parse(value);
                        setParsedJson(json);
                      } catch (error) {
                        console.error('对话框JSON解析错误:', error);
                        // 不要将parsedJson设置为null
                      }
                    }
                  }}
                  name="json-editor-dialog"
                  width="100%"
                  height="100%"
                  setOptions={{
                    useWorker: false,
                    showLineNumbers: true,
                    tabSize: 2,
                    showPrintMargin: false,
                    enableBasicAutocompletion: true,
                    enableLiveAutocompletion: true,
                    fontSize: 14
                  }}
                  editorProps={{ $blockScrolling: true }}
                  onLoad={editorDidMount}
                />
              </Suspense>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowJsonEditor(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 mr-2"
              >
                取消
              </button>
              <button
                onClick={() => {
                  try {
                    // 验证JSON是否有效
                    const json = JSON.parse(jsonEditorValue);
                    setParsedJson(json);
                    setShowJsonEditor(false);
                  } catch (error) {
                    showWarning(`JSON 无效: ${error}`);
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                应用
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderJsonEditorWithControls()}
      {renderJsonEditorDialog()}
    </>
  );
};

export default JsonEditor; 