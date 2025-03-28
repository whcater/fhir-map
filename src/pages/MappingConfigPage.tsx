import React, { useState, useEffect, useRef, RefObject } from 'react';
import { useAppStore } from '../store';
import { MappingConfiguration, LogicDtoModel, FieldMetadata, FieldMapping, ThirdPartyModel, DataDomain } from '../types';
import { nanoid } from 'nanoid';
import * as fhirpath from 'fhirpath';
import FhirPathBuilder from '../components/FhirPathBuilder';
import JsonEditor from '../components/JsonEditor';
import LogicModelViewer from '../components/LogicModelViewer';
import PathCalculator from '../components/PathCalculator';
import MappingControls from '../components/MappingControls';
import { calculatePathFromToken, findTokenAtPosition } from '../utils/fhirPathUtils';
import { calculateJsonPathAtPosition, convertJsonPathToFhirPath, EditorPosition } from '../utils/jsonPathUtils';
import MainLayout from '../layouts/MainLayout';
import { showSuccess } from '../utils/notification';

// 自定义Ace编辑器位置接口
interface AcePosition {
  row: number;
  column: number;
}

const MappingConfigPage: React.FC = () => {
  const {
    domains,
    logicDtoModels,
    mappingConfigurations,
    addMappingConfiguration,
    updateMappingConfiguration
  } = useAppStore();

  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [selectedLogicModel, setSelectedLogicModel] = useState<string>('');
  const [activeMapping, setActiveMapping] = useState<MappingConfiguration | null>(null);
  const [jsonEditorValue, setJsonEditorValue] = useState<string>('{\n  "resourceType": "Patient",\n  "id": "example",\n  "name": [\n    {\n      "use": "official",\n      "family": "张",\n      "given": ["三"]\n    }\n  ],\n  "gender": "male",\n  "birthDate": "1974-12-25"\n}');
  const [hoveredPath, setHoveredPath] = useState<string>('');
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [mappingView, setMappingView] = useState<'visual' | 'table'>('visual');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(window.matchMedia('(prefers-color-scheme: dark)').matches);

  // 添加JSON解析和FHIR Path计算相关状态
  const [parsedJson, setParsedJson] = useState<any>(null);
  const [jsonLines, setJsonLines] = useState<Array<{ line: string, path: string, lineNumber: number }>>([]);
  const [jsonPathMap, setJsonPathMap] = useState<Map<number, string>>(new Map());

  // 显示JSON编辑器对话框
  const [showJsonEditor, setShowJsonEditor] = useState<boolean>(false);

  const jsonEditorRef = useRef<HTMLDivElement>(null);
  const pathInputRef = useRef<HTMLInputElement>(null) as RefObject<HTMLInputElement>;
  const jsonInputRef = useRef<HTMLTextAreaElement>(null);

  // 添加一个新的组件或状态来处理高级FHIR Path生成
  const [showFhirPathBuilder, setShowFhirPathBuilder] = useState<boolean>(false);
  const [availableResources, setAvailableResources] = useState<Array<{ type: string, example: string }>>([
    { type: 'Patient', example: 'Patient.name[0].family' },
    { type: 'Medication', example: 'Medication.code.coding[0].display' },
    { type: 'MedicationRequest', example: 'MedicationRequest.dosageInstruction[0].text' },
    { type: 'Organization', example: 'Organization.name' },
    { type: 'Practitioner', example: 'Practitioner.name[0].given[0]' },
    { type: 'PractitionerRole', example: 'PractitionerRole.specialty[0].coding[0].display' },
    { type: 'Composition', example: 'Composition.section[0].title' }
  ]);

  // 添加Ace编辑器的引用
  const aceEditorRef = useRef<any>(null);

  // FHIR路径计算函数 - 根据位置计算路径
  const calculateFhirPathAtPosition = (position: AcePosition): string => {
    if (!aceEditorRef.current) {
      console.log('编辑器引用不可用');
      return '';
    }

    if (!parsedJson) {
      console.log('parsedJson为null，尝试从编辑器内容重新解析');
      try {
        const text = aceEditorRef.current.getValue();
        const json = JSON.parse(text);
        // 异步更新parsedJson
        setTimeout(() => setParsedJson(json), 0);
        // 继续使用临时解析的JSON
        return calculatePathWithJson(position, json);
      } catch (error) {
        console.error('临时解析JSON失败:', error);
      }
      return '';
    }

    return calculatePathWithJson(position, parsedJson);
  };

  // 辅助函数 - 使用特定的JSON对象计算路径
  const calculatePathWithJson = (position: AcePosition, json: any): string => {
    if (!aceEditorRef.current) return '';

    try {
      // 获取行内容
      const session = aceEditorRef.current.getSession();
      const lineContent = session.getLine(position.row);
      console.log('lineContent', lineContent);
      
      // 在Ace编辑器中，column是从0开始的，而monaco是从1开始
      // 所以这里我们需要+1来保持和以前的计算方式一致
      const token = findTokenAtPosition(lineContent, position.column + 1);

      if (!token) return '';

      // 计算从根到当前位置的路径
      return calculatePathFromToken(token, json);
    } catch (error) {
      console.error('计算FHIR路径时出错，尝试使用JSON Path:', error);

      // 使用JSON Path作为备选
      try {
        // 获取整个文本
        const text = aceEditorRef.current.getValue();
        
        // 将Ace Position转换为类似Monaco Position的结构
        const editorPosition: EditorPosition = {
          lineNumber: position.row + 1,  // 转为1-based
          column: position.column + 1    // 转为1-based
        };
        
        const jsonPath = calculateJsonPathAtPosition(json, editorPosition, text);

        // 将JSON Path转换为FHIR Path
        return convertJsonPathToFhirPath(jsonPath, json);
      } catch (jsonError) {
        console.error('计算JSON路径时出错:', jsonError);
        return '';
      }
    }
  };

  // 编辑器初始化时的处理函数
  const handleEditorDidMount = (editor: any) => {
    aceEditorRef.current = editor;

    // 添加点击事件监听
    editor.on('click', () => {
      const position = editor.getCursorPosition();
      try {
        const path = calculateFhirPathAtPosition(position);
        if (path) {
          setSelectedPath(path);
          if (pathInputRef.current) {
            pathInputRef.current.value = path;
          }
        }
      } catch (error) {
        console.error('计算FHIR路径时出错:', error);
      }
    });

    // 初始化解析JSON
    try {
      const json = JSON.parse(jsonEditorValue);
      setParsedJson(json);
    } catch (error) {
      console.error('JSON解析错误:', error);
    }
  };

  // 当isDarkMode变化时，更新编辑器主题
  useEffect(() => {
    if (aceEditorRef.current) {
      aceEditorRef.current.setTheme(isDarkMode ? 'ace/theme/monokai' : 'ace/theme/chrome');
    }
  }, [isDarkMode]);

  // 加载或创建映射配置
  useEffect(() => {
    // 模拟获取数据
    if (selectedDomain && selectedLogicModel) {
      const existingMapping = mappingConfigurations.find(
        (m: MappingConfiguration) => m.domainId === selectedDomain &&
          m.sourceModelId === selectedLogicModel &&
          m.targetType === 'fhir'
      );

      if (existingMapping) {
        setActiveMapping(existingMapping);
      } else {
        // 创建新的映射配置
        const newMapping: MappingConfiguration = {
          id: nanoid(),
          name: `${logicDtoModels.find((m: LogicDtoModel) => m.id === selectedLogicModel)?.name || 'Unknown'} to FHIR Mapping`,
          description: '逻辑模型到FHIR资源的映射配置',
          domainId: selectedDomain,
          sourceType: 'logicDto',
          targetType: 'fhir',
          sourceModelId: selectedLogicModel,
          targetModelId: 'fhir',
          fieldMappings: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setActiveMapping(newMapping);
      }
    } else {
      setActiveMapping(null);
    }
  }, [selectedDomain, selectedLogicModel, mappingConfigurations, logicDtoModels]);

  // 当JSON编辑器内容变化时，解析JSON并计算路径
  useEffect(() => {
    try {
      const json = JSON.parse(jsonEditorValue);
      setParsedJson(json);

      // 计算每行的FHIR Path
      const lines = jsonEditorValue.split('\n');
      const linePathInfo: Array<{ line: string, path: string, lineNumber: number }> = [];
      const pathMap = new Map<number, string>();

      // 解析JSON结构并生成路径映射
      const calculatePaths = (obj: any, currentPath: string = '') => {
        if (!obj || typeof obj !== 'object') return;

        // 对于资源类型，确定基础路径
        if (obj.resourceType) {
          currentPath = obj.resourceType;
        }

        // 遍历所有属性
        Object.entries(obj).forEach(([key, value]) => {
          // 跳过resourceType自身
          if (key === 'resourceType') return;

          const newPath = currentPath ? `${currentPath}.${key}` : key;

          // 找到这个属性在JSON字符串中的位置
          const keyPattern = new RegExp(`"${key}"\\s*:`, 'g');
          let match;
          let jsonStr = JSON.stringify(obj, null, 2);
          let lineOffset = 0;

          // 计算此对象开始的行号偏移
          const objStr = JSON.stringify(obj);
          const objIndex = jsonEditorValue.indexOf(objStr.substring(0, Math.min(objStr.length, 20)));
          if (objIndex >= 0) {
            lineOffset = jsonEditorValue.substring(0, objIndex).split('\n').length - 1;
          }

          // 在格式化的JSON中查找属性
          const formattedObj = JSON.stringify(obj, null, 2);
          const lines = formattedObj.split('\n');
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(`"${key}"`)) {
              // 找到了属性所在行
              const actualLine = i + lineOffset;
              pathMap.set(actualLine, newPath);

              // 为数组元素添加索引
              if (Array.isArray(value)) {
                for (let j = 0; j < value.length; j++) {
                  const arrayItemPath = `${newPath}[${j}]`;
                  // 估算数组项所在行
                  const arrayLineEstimate = actualLine + 1 + j * (JSON.stringify(value[j], null, 2).split('\n').length + 1);
                  pathMap.set(arrayLineEstimate, arrayItemPath);

                  // 如果数组项是对象，递归计算其路径
                  if (value[j] && typeof value[j] === 'object') {
                    calculatePaths(value[j], arrayItemPath);
                  }
                }
              } else if (value && typeof value === 'object') {
                // 递归计算对象属性的路径
                calculatePaths(value, newPath);
              }

              break;
            }
          }
        });
      };

      calculatePaths(json);

      // 为每行匹配路径
      lines.forEach((line, index) => {
        // 查找最接近的路径
        let path = '';
        for (let i = index; i >= 0; i--) {
          if (pathMap.has(i)) {
            path = pathMap.get(i) || '';
            break;
          }
        }

        linePathInfo.push({
          line,
          path,
          lineNumber: index
        });
      });

      setJsonLines(linePathInfo);
      setJsonPathMap(pathMap);
    } catch (error) {
      console.error('JSON解析错误:', error);
    }
  }, [jsonEditorValue]);

  // FHIR Path智能获取函数
  const handleGetPathFromCursor = () => {
    if (aceEditorRef.current) {
      try {
        const position = aceEditorRef.current.getCursorPosition();
        const path = calculateFhirPathAtPosition(position);
        if (path) {
          setSelectedPath(path);
          if (pathInputRef.current) {
            pathInputRef.current.value = path;
          }
        }
      } catch (error) {
        console.error('获取光标路径时出错:', error);
      }
    }
  };

  // 保存映射
  const handleSaveMapping = () => {
    if (!activeMapping) return;

    const isNew = !mappingConfigurations.some((m: MappingConfiguration) => m.id === activeMapping.id);

    if (isNew) {
      addMappingConfiguration(activeMapping);
    } else {
      updateMappingConfiguration(activeMapping);
    }

    showSuccess('映射配置已保存！');
  };

  // 添加字段映射
  const handleAddFieldMapping = (logicField: FieldMetadata, fhirPath: string) => {
    if (!activeMapping) return;

    const newMapping: FieldMapping = {
      sourceFieldId: logicField.id,
      targetFieldId: fhirPath,
      transformationRule: ''
    };

    setActiveMapping({
      ...activeMapping,
      fieldMappings: [...activeMapping.fieldMappings, newMapping],
      updatedAt: new Date().toISOString()
    });
  };

  // 删除字段映射
  const handleRemoveFieldMapping = (sourceFieldId: string) => {
    if (!activeMapping) return;

    setActiveMapping({
      ...activeMapping,
      fieldMappings: activeMapping.fieldMappings.filter((m: FieldMapping) => m.sourceFieldId !== sourceFieldId),
      updatedAt: new Date().toISOString()
    });
  };

  // 设置模拟的JSON编辑器的鼠标悬停效果
  const handleEditorHover = (path: string) => {
    setHoveredPath(path);
  };

  // 添加修改字段映射的功能
  const handleUpdateFieldMapping = (sourceFieldId: string, fhirPath: string) => {
    if (!activeMapping) return;

    setActiveMapping({
      ...activeMapping,
      fieldMappings: activeMapping.fieldMappings.map((m: FieldMapping) =>
        m.sourceFieldId === sourceFieldId
          ? { ...m, targetFieldId: fhirPath, updatedAt: new Date().toISOString() }
          : m
      ),
      updatedAt: new Date().toISOString()
    });
  };

  // 使用现有路径初始化构建器
  const initializePathBuilderWithPath = (path: string) => {
    // 此函数已移至FhirPathBuilder组件内部实现
    if (!path) return;
    setSelectedPath(path);
  };

  // 处理编辑器光标位置变化
  const handleCursorPositionChange = (position: AcePosition) => {
    try {
      // 首先确保parsedJson已初始化
      if (!parsedJson) {
        console.log('parsedJson为null，尝试从编辑器内容重新解析');
        try {
          const json = JSON.parse(jsonEditorValue);
          setParsedJson(json);
          // 如果解析成功但尚未准备好，可以在下一个事件循环中重试
          setTimeout(() => {
            if (parsedJson) {
              const path = calculateFhirPathAtPosition(position);
              if (path) {
                setHoveredPath(path);
              }
            }
          }, 0);
          return;
        } catch (error) {
          console.error('无法解析JSON:', error);
          return;
        }
      }

      // 计算当前位置的FHIR Path
      const path = calculateFhirPathAtPosition(position);
      console.log('handleCursorPositionChange', path);
      // 如果找到了有效路径，更新悬停路径状态
      if (path) {
        setHoveredPath(path);
      }
    } catch (error) {
      console.error('处理光标位置变化时出错:', error);
    }
  };

  // 应用当前悬停路径
  const applyHoveredPath = () => {
    if (hoveredPath) {
      setSelectedPath(hoveredPath);
      if (pathInputRef.current) {
        pathInputRef.current.value = hoveredPath;
      }
    }
  };

  // 确保在组件挂载和JSON编辑器值变化时解析JSON
  useEffect(() => {
    if (jsonEditorValue) {
      try {
        const json = JSON.parse(jsonEditorValue);
        setParsedJson(json);
        console.log('成功解析JSON', json);
      } catch (error) {
        console.error('MappingConfigPage中JSON解析错误:', error);
      }
    }
  }, [jsonEditorValue]);

  return (
    <MainLayout>
      <div className={`min-h-screen flex flex-col ${isDarkMode ? 'dark' : ''}`}>
        <header className="bg-white dark:bg-gray-900 shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <i className="fas fa-project-diagram text-blue-500 mr-2"></i>
              FHIR 映射配置
            </h1>

            <div className="flex items-center space-x-4"> 
              <div>
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="mr-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">选择数据域...</option>
                  {domains.map((domain: DataDomain) => (
                    <option key={domain.id} value={domain.id}>{domain.name}</option>
                  ))}
                </select>

                <select
                  value={selectedLogicModel}
                  onChange={(e) => setSelectedLogicModel(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!selectedDomain}
                >
                  <option value="">选择逻辑模型...</option>
                  {logicDtoModels
                    .filter((model: LogicDtoModel) => !selectedDomain || model.domainId === selectedDomain)
                    .map((model: LogicDtoModel) => (
                      <option key={model.id} value={model.id}>{model.name}</option>
                    ))}
                </select>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* 左侧：逻辑模型面板 */}
          <div className="w-full md:w-1/2 p-4 overflow-hidden flex flex-col h-full bg-white dark:bg-gray-800">
            <LogicModelViewer
              activeMapping={activeMapping}
              selectedLogicModel={selectedLogicModel}
              logicDtoModels={logicDtoModels}
              searchTerm={searchTerm}
              mappingView={mappingView}
              selectedPath={selectedPath}
              setSelectedPath={setSelectedPath}
              setMappingView={setMappingView}
              setSearchTerm={setSearchTerm}
              onAddFieldMapping={handleAddFieldMapping}
              onUpdateFieldMapping={handleUpdateFieldMapping}
              onRemoveFieldMapping={handleRemoveFieldMapping}
              pathInputRef={pathInputRef}
              onSaveMapping={handleSaveMapping}
            />
          </div>

          {/* 右侧：FHIR资源编辑器面板 */}
          <div className="w-full md:w-1/2 p-4 overflow-hidden flex flex-col bg-white dark:bg-gray-800 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700">
            <div className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center">
              <i className="fas fa-code mr-2 text-blue-500"></i>
              <span>FHIR 资源</span>
            </div>

            <PathCalculator
              selectedPath={selectedPath}
              setSelectedPath={setSelectedPath}
              pathInputRef={pathInputRef}
              initializePathBuilderWithPath={initializePathBuilderWithPath}
              setShowFhirPathBuilder={setShowFhirPathBuilder}
              handleGetPathFromCursor={handleGetPathFromCursor}
              hoveredPath={hoveredPath}
              onApplyHoveredPath={applyHoveredPath}
            />

            <div className="flex-1 overflow-hidden border border-gray-200 dark:border-gray-700 rounded-md">
              <JsonEditor
                jsonEditorValue={jsonEditorValue}
                setJsonEditorValue={setJsonEditorValue}
                setParsedJson={setParsedJson}
                isDarkMode={isDarkMode}
                handleEditorDidMount={handleEditorDidMount}
                showJsonEditor={showJsonEditor}
                setShowJsonEditor={setShowJsonEditor}
                onCursorPositionChange={handleCursorPositionChange}
              />
            </div>
          </div>
        </main>

        <footer className="bg-white dark:bg-gray-900 shadow-inner">
          <MappingControls
            activeMapping={activeMapping}
            onSaveMapping={handleSaveMapping}
          />
        </footer>

        <FhirPathBuilder
          initialPath={selectedPath}
          parsedJson={parsedJson}
          isOpen={showFhirPathBuilder}
          onClose={() => setShowFhirPathBuilder(false)}
          onApplyPath={(path) => {
            setSelectedPath(path);
            setShowFhirPathBuilder(false);
          }}
          availableResources={availableResources}
        />
      </div>
    </MainLayout>
  );
};

export default MappingConfigPage; 