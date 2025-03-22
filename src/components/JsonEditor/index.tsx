import React, { useEffect } from 'react';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

interface JsonEditorProps {
  jsonEditorValue: string;
  setJsonEditorValue: (value: string) => void;
  setParsedJson: (json: any) => void;
  isDarkMode: boolean;
  handleEditorDidMount: OnMount;
  showJsonEditor: boolean;
  setShowJsonEditor: (show: boolean) => void;
  onCursorPositionChange?: (position: monaco.Position) => void;
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
  const customEditorDidMount: OnMount = (editor, monaco) => {
    // 先调用原来的handleEditorDidMount处理初始化
    handleEditorDidMount(editor, monaco);
    
    // 添加光标位置变化监听
    editor.onDidChangeCursorPosition(e => {
      // 确保每次光标移动时JSON已被解析
      try {
        const currentValue = editor.getValue();
        const json = JSON.parse(currentValue);
        setParsedJson(json);
        
        if (onCursorPositionChange) {
          console.log('光标位置变化', e.position);
          onCursorPositionChange(e.position);
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
          <Editor
            height="100%"
            defaultLanguage="json"
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
            options={{
              minimap: { enabled: false },
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              wrappingIndent: 'deepIndent',
              automaticLayout: true,
              fontSize: 13,
              formatOnPaste: true,
              readOnly: false
            }}
            onMount={customEditorDidMount}
            theme={isDarkMode ? 'vs-dark' : 'vs'}
          />
        </div>
      </div>
    );
  };
  
  // 更新JSON编辑器对话框使用Monaco编辑器
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
              <Editor
                height="100%"
                defaultLanguage="json"
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
                options={{
                  minimap: { enabled: true },
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  wrappingIndent: 'deepIndent',
                  automaticLayout: true,
                  fontSize: 14,
                  formatOnPaste: true
                }}
                theme={isDarkMode ? 'vs-dark' : 'vs'}
                onMount={customEditorDidMount}
              />
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
                    alert(`JSON 无效: ${error}`);
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