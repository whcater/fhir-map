import React, { useState } from 'react';
import { useForm, Controller, useFieldArray, FieldError } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { DataType, FieldMetadata, LogicModelMetadata } from '../../types/models';

// 简化方法定义字段模式，避免复杂递归类型
const fieldSchema: any = z.object({
  id: z.string().optional(),
  name: z.string().min(1, '字段名称不能为空'),
  path: z.string().min(1, '字段路径不能为空'),
  dataType: z.nativeEnum(DataType),
  isRequired: z.boolean(),
  description: z.string().optional(),
  children: z.array(z.lazy(() => fieldSchema)).optional(),
});

// 逻辑模型表单验证模式
const logicModelSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, '模型名称不能为空'),
  version: z.string().min(1, '版本号不能为空'),
  description: z.string().optional(),
  domain: z.string().min(1, '数据领域不能为空'),
  fields: z.array(fieldSchema),
});

type LogicModelFormData = z.infer<typeof logicModelSchema>;

interface MetadataEditorProps {
  initialData?: LogicModelMetadata;
  onSave: (data: LogicModelMetadata) => void;
}

const MetadataEditor: React.FC<MetadataEditorProps> = ({ initialData, onSave }) => {
  const [jsonInput, setJsonInput] = useState<string>('');
  const [showJsonInput, setShowJsonInput] = useState<boolean>(false);

  const { control, handleSubmit, formState: { errors }, reset, setValue } = useForm<LogicModelFormData>({
    resolver: zodResolver(logicModelSchema),
    defaultValues: initialData || {
      name: '',
      version: '1.0.0',
      description: '',
      domain: '',
      fields: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'fields',
  });

  const onSubmit = (data: LogicModelFormData) => {
    // 生成ID（如果没有）
    if (!data.id) {
      data.id = `model_${Date.now()}`;
    }
    
    // 为字段生成ID（如果没有）
    data.fields = data.fields.map(field => {
      if (!field.id) {
        field.id = `field_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      }
      return field;
    });
    
    onSave(data as LogicModelMetadata);
  };

  const handleJsonImport = () => {
    try {
      const parsedData = JSON.parse(jsonInput);
      
      // 简单的结构分析和字段提取
      const extractedFields: FieldMetadata[] = [];
      
      // 简化的递归提取函数
      const extractFields = (obj: any, parentPath = ''): FieldMetadata[] => {
        const fields: FieldMetadata[] = [];
        
        if (typeof obj !== 'object' || obj === null) {
          return fields;
        }
        
        Object.entries(obj).forEach(([key, value]) => {
          const currentPath = parentPath ? `${parentPath}.${key}` : key;
          const field: FieldMetadata = {
            id: `field_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            name: key,
            path: currentPath,
            dataType: DataType.STRING, // 默认类型，实际使用时可以根据值类型推断
            isRequired: false,
            description: '',
          };
          
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            field.dataType = DataType.OBJECT;
            field.children = extractFields(value, currentPath);
          } else if (Array.isArray(value)) {
            field.dataType = DataType.ARRAY;
            // 可以进一步处理数组内部元素
          } else if (typeof value === 'number') {
            field.dataType = DataType.NUMBER;
          } else if (typeof value === 'boolean') {
            field.dataType = DataType.BOOLEAN;
          }
          
          fields.push(field);
        });
        
        return fields;
      };
      
      const extractedTopLevelFields = extractFields(parsedData);
      extractedTopLevelFields.forEach(field => extractedFields.push(field));
      
      // 更新表单数据
      reset({
        name: `导入的模型_${new Date().toLocaleDateString()}`,
        version: '1.0.0',
        description: '从JSON导入的模型',
        domain: '',
        fields: extractedFields,
      });
      
      setShowJsonInput(false);
    } catch (error) {
      alert('JSON解析错误，请检查格式');
      console.error(error);
    }
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-semibold mb-6">逻辑模型元数据编辑器</h2>
      
      <div className="mb-8 flex justify-end">
        <button
          type="button"
          className="btn btn-outline flex items-center"
          onClick={() => setShowJsonInput(!showJsonInput)}
        >
          <i className="fas fa-file-import mr-2"></i>
          从JSON导入
        </button>
      </div>

      {showJsonInput && (
        <div className="mb-8 p-4 border border-gray-300 dark:border-gray-600 rounded-lg">
          <h3 className="text-lg font-medium mb-4">JSON导入</h3>
          <textarea
            className="input font-mono h-64"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="粘贴JSON数据..."
          />
          <div className="mt-4 flex justify-end space-x-4">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setShowJsonInput(false)}
            >
              取消
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleJsonImport}
            >
              导入
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              模型名称 <span className="text-red-500">*</span>
            </label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <input {...field} className="input" placeholder="输入模型名称" />
              )}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              版本号 <span className="text-red-500">*</span>
            </label>
            <Controller
              name="version"
              control={control}
              render={({ field }) => (
                <input {...field} className="input" placeholder="如 1.0.0" />
              )}
            />
            {errors.version && (
              <p className="mt-1 text-sm text-red-600">{errors.version.message}</p>
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
                  placeholder="模型描述..."
                />
              )}
            />
          </div>
        </div>

        <h3 className="text-xl font-semibold mb-4">字段列表</h3>
        <div className="space-y-6 mb-6">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-medium">字段 #{index + 1}</h4>
                <button
                  type="button"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => remove(index)}
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    字段名称 <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name={`fields.${index}.name`}
                    control={control}
                    render={({ field }) => (
                      <input {...field} className="input" placeholder="字段名称" />
                    )}
                  />
                  {errors.fields && errors.fields[index] && (
                    <p className="mt-1 text-sm text-red-600">
                      {(errors.fields[index] as any)?.name?.message || '字段名称错误'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    字段路径 <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name={`fields.${index}.path`}
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        className="input"
                        placeholder="如 patient.name"
                      />
                    )}
                  />
                  {errors.fields && errors.fields[index] && (
                    <p className="mt-1 text-sm text-red-600">
                      {(errors.fields[index] as any)?.path?.message || '字段路径错误'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    数据类型 <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name={`fields.${index}.dataType`}
                    control={control}
                    render={({ field }) => (
                      <select {...field} className="input">
                        {Object.values(DataType).map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </div>

                <div className="flex items-center mt-6">
                  <Controller
                    name={`fields.${index}.isRequired`}
                    control={control}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                      />
                    )}
                  />
                  <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    是否必填
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    描述
                  </label>
                  <Controller
                    name={`fields.${index}.description`}
                    control={control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        className="input"
                        placeholder="字段描述..."
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <button
            type="button"
            className="btn btn-outline flex items-center"
            onClick={() =>
              append({
                name: '',
                path: '',
                dataType: DataType.STRING,
                isRequired: false,
                description: '',
              })
            }
          >
            <i className="fas fa-plus mr-2"></i>
            添加字段
          </button>

          <button type="submit" className="btn btn-primary">
            保存模型
          </button>
        </div>
      </form>
    </div>
  );
};

export default MetadataEditor; 