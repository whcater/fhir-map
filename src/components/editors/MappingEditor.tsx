import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  FieldMapping, 
  LogicModelMetadata, 
  MappingConfig, 
  TransformationType 
} from '../../types/models';

// 定义映射表单验证模式
const mappingConfigSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, '映射名称不能为空'),
  description: z.string().optional(),
  sourceModelId: z.string().min(1, '请选择源模型'),
  targetModelId: z.string().min(1, '请选择目标模型'),
  domain: z.string().min(1, '数据领域不能为空'),
});

type MappingFormData = z.infer<typeof mappingConfigSchema>;

interface MappingEditorProps {
  availableModels: LogicModelMetadata[];
  initialData?: MappingConfig;
  onSave: (data: MappingConfig) => void;
}

const MappingEditor: React.FC<MappingEditorProps> = ({ 
  availableModels, 
  initialData, 
  onSave 
}) => {
  // 源模型和目标模型
  const [sourceModel, setSourceModel] = useState<LogicModelMetadata | null>(null);
  const [targetModel, setTargetModel] = useState<LogicModelMetadata | null>(null);

  // 已映射字段列表
  const [mappings, setMappings] = useState<FieldMapping[]>(initialData?.mappings || []);

  // 拖拽状态
  const [draggingField, setDraggingField] = useState<{id: string, isSource: boolean} | null>(null);
  
  const { control, handleSubmit, formState: { errors }, watch } = useForm<MappingFormData>({
    resolver: zodResolver(mappingConfigSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      sourceModelId: '',
      targetModelId: '',
      domain: '',
    },
  });

  // 监听源模型和目标模型的选择变化
  const sourceModelId = watch('sourceModelId');
  const targetModelId = watch('targetModelId');

  useEffect(() => {
    if (sourceModelId) {
      const model = availableModels.find(m => m.id === sourceModelId);
      setSourceModel(model || null);
    } else {
      setSourceModel(null);
    }
  }, [sourceModelId, availableModels]);

  useEffect(() => {
    if (targetModelId) {
      const model = availableModels.find(m => m.id === targetModelId);
      setTargetModel(model || null);
    } else {
      setTargetModel(null);
    }
  }, [targetModelId, availableModels]);

  // 处理字段拖拽开始
  const handleDragStart = (fieldId: string, isSource: boolean) => {
    setDraggingField({ id: fieldId, isSource });
  };

  // 处理字段拖放
  const handleDrop = (fieldId: string, isSource: boolean) => {
    if (draggingField && draggingField.isSource !== isSource) {
      // 确保源字段到目标字段的映射
      const sourceFieldId = draggingField.isSource ? draggingField.id : fieldId;
      const targetFieldId = draggingField.isSource ? fieldId : draggingField.id;
      
      // 检查是否已存在相同映射
      const existingMapping = mappings.find(
        m => m.sourceFieldId === sourceFieldId && m.targetFieldId === targetFieldId
      );
      
      if (!existingMapping) {
        // 添加新映射
        const newMapping: FieldMapping = {
          sourceFieldId,
          targetFieldId,
          transformations: [
            {
              type: TransformationType.DIRECT, // 默认为直接映射
              params: {}
            }
          ]
        };
        
        setMappings([...mappings, newMapping]);
      }
    }
    
    setDraggingField(null);
  };

  // 删除映射
  const removeMapping = (sourceFieldId: string, targetFieldId: string) => {
    setMappings(mappings.filter(
      m => !(m.sourceFieldId === sourceFieldId && m.targetFieldId === targetFieldId)
    ));
  };

  // 获取字段完整路径
  const getFieldPath = (fieldId: string, isSource: boolean) => {
    const model = isSource ? sourceModel : targetModel;
    if (!model) return '';
    
    const findFieldPath = (fields: any[], id: string): string => {
      for (const field of fields) {
        if (field.id === id) {
          return field.path;
        }
        if (field.children && field.children.length > 0) {
          const path = findFieldPath(field.children, id);
          if (path) return path;
        }
      }
      return '';
    };
    
    return findFieldPath(model.fields, fieldId);
  };

  // 保存映射配置
  const onSubmit = (data: MappingFormData) => {
    if (mappings.length === 0) {
      alert('请至少添加一个字段映射');
      return;
    }
    
    const mappingConfig: MappingConfig = {
      ...data,
      id: data.id || `mapping_${Date.now()}`,
      mappings
    };
    
    onSave(mappingConfig);
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-semibold mb-6">映射配置编辑器</h2>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              映射名称 <span className="text-red-500">*</span>
            </label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <input {...field} className="input" placeholder="输入映射名称" />
              )}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              数据领域 <span className="text-red-500">*</span>
            </label>
            <Controller
              name="domain"
              control={control}
              render={({ field }) => (
                <input {...field} className="input" placeholder="如 患者信息、检验报告等" />
              )}
            />
            {errors.domain && (
              <p className="mt-1 text-sm text-red-600">{errors.domain.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              源模型 <span className="text-red-500">*</span>
            </label>
            <Controller
              name="sourceModelId"
              control={control}
              render={({ field }) => (
                <select {...field} className="input">
                  <option value="">请选择源模型</option>
                  {availableModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} (v{model.version})
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.sourceModelId && (
              <p className="mt-1 text-sm text-red-600">{errors.sourceModelId.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              目标模型 <span className="text-red-500">*</span>
            </label>
            <Controller
              name="targetModelId"
              control={control}
              render={({ field }) => (
                <select {...field} className="input">
                  <option value="">请选择目标模型</option>
                  {availableModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} (v{model.version})
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.targetModelId && (
              <p className="mt-1 text-sm text-red-600">{errors.targetModelId.message}</p>
            )}
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              描述
            </label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  className="input h-24"
                  placeholder="映射配置描述..."
                />
              )}
            />
          </div>
        </div>
        
        {/* 映射区域 */}
        {sourceModel && targetModel && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">字段映射</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              通过拖拽字段来创建映射关系。从源模型拖拽到目标模型，或从目标模型拖拽到源模型。
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 源模型字段列表 */}
              <div>
                <h4 className="text-lg font-medium mb-2">源模型: {sourceModel.name}</h4>
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 h-96 overflow-y-auto">
                  {sourceModel.fields.map((field) => (
                    <div
                      key={field.id}
                      className="bg-white dark:bg-gray-700 p-2 mb-2 rounded border border-gray-200 dark:border-gray-600 cursor-move"
                      draggable
                      onDragStart={() => handleDragStart(field.id, true)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(field.id, true)}
                    >
                      <div className="font-medium">{field.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{field.path}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 目标模型字段列表 */}
              <div>
                <h4 className="text-lg font-medium mb-2">目标模型: {targetModel.name}</h4>
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 h-96 overflow-y-auto">
                  {targetModel.fields.map((field) => (
                    <div
                      key={field.id}
                      className="bg-white dark:bg-gray-700 p-2 mb-2 rounded border border-gray-200 dark:border-gray-600 cursor-move"
                      draggable
                      onDragStart={() => handleDragStart(field.id, false)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(field.id, false)}
                    >
                      <div className="font-medium">{field.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{field.path}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 当前映射列表 */}
        {mappings.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">已创建的映射</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      源字段
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      目标字段
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      转换
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                  {mappings.map((mapping, index) => (
                    <tr key={`${mapping.sourceFieldId}-${mapping.targetFieldId}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {getFieldPath(mapping.sourceFieldId, true)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {getFieldPath(mapping.targetFieldId, false)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {mapping.transformations && mapping.transformations.length > 0 
                          ? mapping.transformations.map(t => t.type).join(', ') 
                          : '直接映射'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          type="button"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => removeMapping(mapping.sourceFieldId, mapping.targetFieldId)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary">
            保存映射配置
          </button>
        </div>
      </form>
    </div>
  );
};

export default MappingEditor; 