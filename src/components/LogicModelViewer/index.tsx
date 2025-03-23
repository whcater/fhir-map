import React from 'react';
import { FieldMetadata, FieldMapping, LogicDtoModel, MappingConfiguration } from '../../types';
import MappingControls from '../MappingControls';

interface LogicModelViewerProps {
    activeMapping: MappingConfiguration | null;
    selectedLogicModel: string;
    logicDtoModels: LogicDtoModel[];
    searchTerm: string;
    mappingView: 'visual' | 'table';
    selectedPath: string;
    setSelectedPath: (path: string) => void;
    setMappingView: (view: 'visual' | 'table') => void;
    setSearchTerm: (term: string) => void;
    onAddFieldMapping: (field: FieldMetadata, path: string) => void;
    onUpdateFieldMapping: (fieldId: string, path: string) => void;
    onRemoveFieldMapping: (fieldId: string) => void;
    pathInputRef: React.RefObject<HTMLInputElement>;
    onSaveMapping: () => void;
}

const LogicModelViewer: React.FC<LogicModelViewerProps> = ({
    activeMapping,
    selectedLogicModel,
    logicDtoModels,
    searchTerm,
    mappingView,
    selectedPath,
    setSelectedPath,
    setMappingView,
    setSearchTerm,
    onAddFieldMapping,
    onUpdateFieldMapping,
    onRemoveFieldMapping,
    pathInputRef,
    onSaveMapping
}) => {
    // 过滤逻辑模型字段
    const filteredFields = (model?: LogicDtoModel) => {
        if (!model) return [];

        const filterFields = (fields: FieldMetadata[], parentPath = ''): FieldMetadata[] => {
            return fields.filter(field => {
                const fullName = parentPath ? `${parentPath}.${field.name}` : field.name;
                return !searchTerm || fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (field.description && field.description.toLowerCase().includes(searchTerm.toLowerCase()));
            });
        };

        return filterFields(model.fields);
    };

    // 获取字段的FHIR映射路径
    const getFieldFhirPath = (fieldId: string): string => {
        if (!activeMapping) return '';
        const mapping = activeMapping.fieldMappings.find((f: FieldMapping) => f.sourceFieldId === fieldId);
        return mapping ? mapping.targetFieldId : '';
    };

    // 渲染递归树形逻辑模型字段
    const renderLogicFields = (fields: FieldMetadata[], parentPath = '', level = 0) => {
        // 首先，将字段按层次结构整理
        const rootFields = fields.filter(field => !field.parentId);

        const getChildFields = (parentId: string) => {
            return fields.filter(field => field.parentId === parentId);
        };

        const renderField = (field: FieldMetadata, fieldPath = '', fieldLevel = 0) => {
            const fullPath = fieldPath ? `${fieldPath}.${field.name}` : field.name;
            const fhirPath = getFieldFhirPath(field.id);
            const childFields = getChildFields(field.id);

            return (
                <div key={field.id} className="border-b border-gray-200 dark:border-gray-700">
                    <div
                        className={`py-2 px-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-between`}
                        style={{ paddingLeft: `${(fieldLevel * 1.5) + 0.5}rem` }}
                    >
                        <div className="flex items-center flex-1">
                            {childFields.length > 0 ? (
                                <i className="fas fa-folder mr-2 text-blue-500"></i>
                            ) : field.type === 'array' ? (
                                <i className="fas fa-list mr-2 text-indigo-500"></i>
                            ) : (
                                <i className="fas fa-tag mr-2 text-green-500"></i>
                            )}
                            <div className="flex flex-col">
                                <span className="font-medium">{field.name}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {field.type} {field.description && `- ${field.description}`}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center">
                            {fhirPath ? (
                                <div className="flex items-center">
                                    <span className="text-sm text-green-600 dark:text-green-400 mr-2">{fhirPath}</span>
                                    <button
                                        onClick={() => {
                                            if (selectedPath) {
                                                onUpdateFieldMapping(field.id, selectedPath);
                                                setSelectedPath('');
                                                if (pathInputRef.current) {
                                                    pathInputRef.current.value = '';
                                                }
                                            } else {
                                                // 如果没有选择新路径，则将当前字段的路径设置为选中状态，以便用户修改
                                                setSelectedPath(fhirPath);
                                                if (pathInputRef.current) {
                                                    pathInputRef.current.value = fhirPath;
                                                }
                                            }
                                        }}
                                        className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mr-2"
                                    >
                                        <i className="fas fa-edit">更新映射</i>
                                    </button>
                                    <button
                                        onClick={() => onRemoveFieldMapping(field.id)}
                                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                    >
                                        <i className="fas fa-times">重置</i>
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => {
                                        if (selectedPath) {
                                            onAddFieldMapping(field, selectedPath);
                                            setSelectedPath('');
                                            if (pathInputRef.current) {
                                                pathInputRef.current.value = '';
                                            }
                                        }
                                    }}
                                    disabled={!selectedPath}
                                    className={`px-3 py-1 text-xs rounded-full ${selectedPath ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'}`}
                                >
                                    <i className="fas fa-link mr-1"></i>
                                    映射
                                </button>
                            )}
                        </div>
                    </div>

                    {childFields.length > 0 && (
                        <div className="pl-4 border-l border-gray-200 dark:border-gray-700 ml-4">
                            {childFields.map(childField => renderField(childField, fullPath, fieldLevel + 1))}
                        </div>
                    )}
                </div>
            );
        };

        return rootFields.map(field => renderField(field, parentPath, level));
    };

    // 渲染表格行
    const renderTableRows = (fields: FieldMetadata[]) => {
        // 构建扁平化的字段列表，包含完整路径
        const flattenedFields: Array<{ field: FieldMetadata, fullPath: string }> = [];

        const flattenFields = (fieldList: FieldMetadata[], parentPath = '') => {
            fieldList.forEach(field => {
                const currentPath = parentPath ? `${parentPath}.${field.name}` : field.name;
                flattenedFields.push({ field, fullPath: currentPath });

                // 查找此字段的子字段
                const childFields = fields.filter(f => f.parentId === field.id);
                if (childFields.length > 0) {
                    flattenFields(childFields, currentPath);
                }
            });
        };

        // 获取根字段（没有parentId的字段）
        const rootFields = fields.filter(field => !field.parentId);
        flattenFields(rootFields);

        // 按路径排序
        flattenedFields.sort((a, b) => a.fullPath.localeCompare(b.fullPath));

        // 渲染行
        return flattenedFields.map(({ field, fullPath }) => {
            const fhirPath = getFieldFhirPath(field.id);

            return (
                <tr key={field.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {fullPath}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {field.type}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {fhirPath || "-"}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {fhirPath ? (
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => {
                                        if (selectedPath) {
                                            onUpdateFieldMapping(field.id, selectedPath);
                                            setSelectedPath('');
                                            if (pathInputRef.current) {
                                                pathInputRef.current.value = '';
                                            }
                                        } else {
                                            setSelectedPath(fhirPath);
                                            if (pathInputRef.current) {
                                                pathInputRef.current.value = fhirPath;
                                            }
                                        }
                                    }}
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                >
                                    <i className="fas fa-edit">更新映射</i>
                                </button>
                                <button
                                    onClick={() => onRemoveFieldMapping(field.id)}
                                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                >
                                    <i className="fas fa-trash-alt">重置</i>
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => {
                                    if (selectedPath) {
                                        onAddFieldMapping(field, selectedPath);
                                        setSelectedPath('');
                                        if (pathInputRef.current) {
                                            pathInputRef.current.value = '';
                                        }
                                    }
                                }}
                                disabled={!selectedPath}
                                className={`px-3 py-1 text-xs rounded-full ${selectedPath ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'}`}
                            >
                                <i className="fas fa-link mr-1"></i>
                                映射
                            </button>
                        )}
                    </td>
                </tr>
            );
        });
    };

    const renderVisualMapping = () => {
        if (!activeMapping || !selectedLogicModel) return <div className="p-4 text-center text-gray-500">请先选择域和逻辑模型</div>;

        const model = logicDtoModels.find((m: LogicDtoModel) => m.id === selectedLogicModel);
        if (!model) return <div className="p-4 text-center text-gray-500">未找到选择的逻辑模型</div>;

        return (
            <div className="flex flex-col h-full overflow-hidden">
                <div className="flex justify-between items-center mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                    <div className="flex items-center space-x-2">
                        <i className="fas fa-filter text-blue-500"></i>
                        <input
                            type="text"
                            placeholder="搜索字段..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <button
                            onClick={() => setMappingView('visual')}
                            className={`px-3 py-1 mx-1 rounded-md ${mappingView === 'visual' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                        >
                            <i className="fas fa-sitemap mr-1"></i>
                            视觉
                        </button>
                        <button
                            onClick={() => setMappingView('table')}
                            className={`px-3 py-1 mx-1 rounded-md ${mappingView === 'table' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                        >
                            <i className="fas fa-table mr-1"></i>
                            表格
                        </button> 
        <span className="text-sm text-gray-500 dark:text-gray-400">
          已映射 <span className="font-medium text-blue-500">{activeMapping?.fieldMappings.length || 0}</span> 个字段
        </span> 
                        <button
                            onClick={onSaveMapping}
                            disabled={!activeMapping}
                            className={`px-3 py-1 mx-1 rounded-md ${!activeMapping ? 'bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'} focus:outline-none focus:ring-2 focus:ring-green-500`}
                        >
                            <i className="fas fa-save mr-1"></i>
                            保存映射
                        </button>
                    </div>
                </div>

                {mappingView === 'visual' ? (
                    <div className="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded-md">
                        {renderLogicFields(model.fields)}
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded-md">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">路径</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">类型</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">FHIR Path</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">操作</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                {renderTableRows(model.fields)}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex-1 overflow-hidden">
            <div className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center">
                <i className="fas fa-sitemap mr-2 text-blue-500"></i>
                <span>逻辑模型映射</span>
            </div>

            {renderVisualMapping()}
        </div>
    );
};

export default LogicModelViewer; 