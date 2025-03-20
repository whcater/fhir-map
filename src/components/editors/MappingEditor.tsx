import React, { useState } from 'react';
import { Card, Tabs } from 'antd';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DataDomain, LogicDto, ThirdPartyDto, LogicDtoField } from '../../types/metadata';
import { 
  LogicToFhirMapping, 
  ThirdPartyToLogicMapping,
  FhirToLogicMapping,
  LogicToThirdPartyMapping,
  FieldMapping
} from '../../types/mapping';
import { commonFhirResources } from '../../types/fhir';

const { TabPane } = Tabs;

interface MappingEditorProps {
  dataDomains?: DataDomain[];
  onSave?: (mappingConfig: any) => void;
}

const MappingEditor: React.FC<MappingEditorProps> = ({ dataDomains = [], onSave }) => {
  const [activeTab, setActiveTab] = useState('logic-to-fhir');

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  return (
    <Card title="映射配置">
      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        <TabPane tab="逻辑模型到FHIR映射" key="logic-to-fhir">
          <LogicToFhirMappingEditor dataDomains={dataDomains} />
        </TabPane>
        <TabPane tab="第三方数据到逻辑模型映射" key="third-party-to-logic">
          <ThirdPartyToLogicMappingEditor dataDomains={dataDomains} />
        </TabPane>
      </Tabs>
    </Card>
  );
};

// 字段映射验证Schema
const fieldMappingSchema = z.object({
  sourcePath: z.string().min(1, '源字段不能为空'),
  targetPath: z.string().min(1, '目标字段不能为空'),
  transform: z.string().optional(),
  condition: z.string().optional()
});

// LogicToFhir映射验证Schema
const logicToFhirMappingSchema = z.object({
  dataDomainId: z.string().min(1, '数据域ID不能为空'),
  logicDtoId: z.string().min(1, '逻辑DTO ID不能为空'),
  fhirResourceType: z.string().min(1, 'FHIR资源类型不能为空'),
  fieldMappings: z.array(fieldMappingSchema)
});

// ThirdPartyToLogic映射验证Schema
const thirdPartyToLogicMappingSchema = z.object({
  dataDomainId: z.string().min(1, '数据域ID不能为空'),
  thirdPartyDtoId: z.string().min(1, '第三方DTO ID不能为空'),
  logicDtoId: z.string().min(1, '逻辑DTO ID不能为空'),
  fieldMappings: z.array(fieldMappingSchema)
});

interface LogicToFhirMappingEditorProps {
  dataDomains: DataDomain[];
  initialMapping?: any;
  onSave?: (mapping: any) => void;
}

const LogicToFhirMappingEditor: React.FC<LogicToFhirMappingEditorProps> = ({ 
  dataDomains, 
  initialMapping,
  onSave 
}) => {
  const defaultValues: LogicToFhirMapping = initialMapping || {
    dataDomainId: '',
    logicDtoId: '',
    fhirResourceType: '',
    fieldMappings: []
  };

  const { control, handleSubmit, formState: { errors }, watch } = useForm<LogicToFhirMapping>({
    resolver: zodResolver(logicToFhirMappingSchema),
    defaultValues
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'fieldMappings'
  });

  const logicDtoId = watch('logicDtoId');
  const selectedLogicDto = dataDomains.find(domain => 
    domain.logicalDtos.some(dto => dto.id === logicDtoId)
  )?.logicalDtos.find(dto => dto.id === logicDtoId);

  const onSubmit = (data: LogicToFhirMapping) => {
    onSave && onSave(data);
  };

  const logicDtoFields = selectedLogicDto?.meta.fields.map((logicField: LogicDtoField) => (
    <option key={logicField.name} value={logicField.name}>
      {`${logicField.name} (${logicField.type})`}
    </option>
  )) || [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            逻辑DTO
          </label>
          <Controller
            name="logicDtoId"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">请选择逻辑DTO</option>
                {dataDomains.map(domain => (
                  domain.logicalDtos.map(dto => (
                    <option key={dto.id} value={dto.id}>
                      {`${domain.name} - ${dto.name}`}
                    </option>
                  ))
                ))}
              </select>
            )}
          />
          {errors.logicDtoId && <p className="mt-1 text-sm text-red-600">{errors.logicDtoId.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            FHIR资源类型
          </label>
          <Controller
            name="fhirResourceType"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">请选择FHIR资源类型</option>
                {commonFhirResources.map(resourceType => (
                  <option key={resourceType} value={resourceType}>{resourceType}</option>
                ))}
              </select>
            )}
          />
          {errors.fhirResourceType && <p className="mt-1 text-sm text-red-600">{errors.fhirResourceType.message}</p>}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium leading-6 text-gray-900">字段映射</h3>
          <button
            type="button"
            onClick={() => append({ sourcePath: '', targetPath: '', transform: '', condition: '' })}
            className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
            disabled={!selectedLogicDto}
          >
            添加字段映射
          </button>
        </div>

        {selectedLogicDto ? (
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="border p-4 rounded-md">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-md font-medium text-gray-900">映射 #{index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    移除
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      逻辑字段（源）
                    </label>
                    <Controller
                      name={`fieldMappings.${index}.sourcePath`}
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                          <option value="">请选择逻辑字段</option>
                          {logicDtoFields}
                        </select>
                      )}
                    />
                    {errors.fieldMappings?.[index]?.sourcePath && (
                      <p className="mt-1 text-sm text-red-600">{errors.fieldMappings[index]?.sourcePath?.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      FHIR路径（目标）
                    </label>
                    <Controller
                      name={`fieldMappings.${index}.targetPath`}
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="如 Patient.name[0].given[0]"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      )}
                    />
                    {errors.fieldMappings?.[index]?.targetPath && (
                      <p className="mt-1 text-sm text-red-600">{errors.fieldMappings[index]?.targetPath?.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      转换表达式
                    </label>
                    <Controller
                      name={`fieldMappings.${index}.transform`}
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="如 value => value.toUpperCase()"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      条件表达式
                    </label>
                    <Controller
                      name={`fieldMappings.${index}.condition`}
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="如 data => data.hasName"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500">请先选择逻辑DTO</p>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700"
        >
          保存
        </button>
      </div>
    </form>
  );
};

interface ThirdPartyToLogicMappingEditorProps {
  dataDomains: DataDomain[];
  initialMapping?: any;
  onSave?: (mapping: any) => void;
}

const ThirdPartyToLogicMappingEditor: React.FC<ThirdPartyToLogicMappingEditorProps> = ({ 
  dataDomains, 
  initialMapping,
  onSave 
}) => {
  const defaultValues: ThirdPartyToLogicMapping = initialMapping || {
    dataDomainId: '',
    thirdPartyDtoId: '',
    logicDtoId: '',
    fieldMappings: []
  };

  const { control, handleSubmit, formState: { errors }, watch } = useForm<ThirdPartyToLogicMapping>({
    resolver: zodResolver(thirdPartyToLogicMappingSchema),
    defaultValues
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'fieldMappings'
  });

  const thirdPartyDtoId = watch('thirdPartyDtoId');
  const selectedThirdPartyDto = dataDomains.find(domain => 
    domain.thirdPartyDtos.some(dto => dto.id === thirdPartyDtoId)
  )?.thirdPartyDtos.find(dto => dto.id === thirdPartyDtoId);

  const logicDtoId = watch('logicDtoId');
  const selectedLogicDto = dataDomains.find(domain => 
    domain.logicalDtos.some(dto => dto.id === logicDtoId)
  )?.logicalDtos.find(dto => dto.id === logicDtoId);

  const onSubmit = (data: ThirdPartyToLogicMapping) => {
    onSave && onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            第三方DTO
          </label>
          <Controller
            name="thirdPartyDtoId"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">请选择第三方DTO</option>
                {dataDomains.map(domain => (
                  domain.thirdPartyDtos.map(dto => (
                    <option key={dto.id} value={dto.id}>
                      {`${domain.name} - ${dto.name}`}
                    </option>
                  ))
                ))}
              </select>
            )}
          />
          {errors.thirdPartyDtoId && <p className="mt-1 text-sm text-red-600">{errors.thirdPartyDtoId.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            逻辑DTO
          </label>
          <Controller
            name="logicDtoId"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">请选择逻辑DTO</option>
                {dataDomains.map(domain => (
                  domain.logicalDtos.map(dto => (
                    <option key={dto.id} value={dto.id}>
                      {`${domain.name} - ${dto.name}`}
                    </option>
                  ))
                ))}
              </select>
            )}
          />
          {errors.logicDtoId && <p className="mt-1 text-sm text-red-600">{errors.logicDtoId.message}</p>}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium leading-6 text-gray-900">字段映射</h3>
          <button
            type="button"
            onClick={() => append({ sourcePath: '', targetPath: '', transform: '', condition: '' })}
            className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
            disabled={!selectedThirdPartyDto || !selectedLogicDto}
          >
            添加字段映射
          </button>
        </div>

        {selectedThirdPartyDto && selectedLogicDto ? (
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="border p-4 rounded-md">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-md font-medium text-gray-900">映射 #{index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    移除
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      第三方字段（源）
                    </label>
                    <Controller
                      name={`fieldMappings.${index}.sourcePath`}
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                          <option value="">请选择第三方字段</option>
                          {selectedThirdPartyDto.meta.fields.map((thirdPartyField) => (
                            <option key={thirdPartyField.name} value={thirdPartyField.name}>
                              {`${thirdPartyField.name} (${thirdPartyField.type})`}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                    {errors.fieldMappings?.[index]?.sourcePath && (
                      <p className="mt-1 text-sm text-red-600">{errors.fieldMappings[index]?.sourcePath?.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      逻辑字段（目标）
                    </label>
                    <Controller
                      name={`fieldMappings.${index}.targetPath`}
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                          <option value="">请选择逻辑字段</option>
                          {selectedLogicDto.meta.fields.map((logicField) => (
                            <option key={logicField.name} value={logicField.name}>
                              {`${logicField.name} (${logicField.type})`}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                    {errors.fieldMappings?.[index]?.targetPath && (
                      <p className="mt-1 text-sm text-red-600">{errors.fieldMappings[index]?.targetPath?.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      转换表达式
                    </label>
                    <Controller
                      name={`fieldMappings.${index}.transform`}
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="如 value => value.toUpperCase()"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      条件表达式
                    </label>
                    <Controller
                      name={`fieldMappings.${index}.condition`}
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="如 data => data.hasName"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500">请先选择第三方DTO和逻辑DTO</p>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700"
        >
          保存
        </button>
      </div>
    </form>
  );
};

export { LogicToFhirMappingEditor, ThirdPartyToLogicMappingEditor };
export default MappingEditor;