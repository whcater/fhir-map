// 应用元数据类型
export interface AppMetadata {
  version: string;
  appName: string;
}

// 数据领域类型
export interface DataDomain {
  id: string;
  name: string;
  description: string;
}

// 字段类型枚举
export enum FieldType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  DATETIME = 'datetime',
  OBJECT = 'object',
  ARRAY = 'array'
}

// 字段元数据接口
export interface FieldMetadata {
  id: string;
  name: string;
  description?: string;
  type: FieldType;
  isRequired: boolean;
  parentId?: string;
  children?: FieldMetadata[];
}

// 逻辑模型接口
export interface LogicDtoModel {
  id: string;
  name: string;
  description?: string;
  domainId: string;
  fields: FieldMetadata[];
  createdAt: string;
  updatedAt: string;
}

// 第三方数据模型接口
export interface ThirdPartyModel {
  id: string;
  name: string;
  description?: string;
  domainId: string;
  format: 'json' | 'xml';
  fields: FieldMetadata[];
  createdAt: string;
  updatedAt: string;
}

// 字段映射接口
export interface FieldMapping {
  sourceFieldId: string;
  targetFieldId: string;
  transformationRule?: string;
}

// 映射配置接口
export interface MappingConfiguration {
  id: string;
  name: string;
  description?: string;
  domainId: string;
  sourceType: 'thirdParty' | 'logicDto' | 'fhir';
  targetType: 'thirdParty' | 'logicDto' | 'fhir';
  sourceModelId: string;
  targetModelId: string;
  fieldMappings: FieldMapping[];
  createdAt: string;
  updatedAt: string;
}

// 应用状态接口
export interface AppState {
  metadata: AppMetadata;
  domains: DataDomain[];
  logicDtoModels: LogicDtoModel[];
  thirdPartyModels: ThirdPartyModel[];
  mappingConfigurations: MappingConfiguration[];
} 