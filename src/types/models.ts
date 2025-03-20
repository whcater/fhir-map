// 逻辑模型相关类型定义

// 字段元数据
export interface FieldMetadata {
  id: string;
  name: string;
  path: string;
  dataType: DataType;
  isRequired: boolean;
  description?: string;
  parentId?: string;
  children?: FieldMetadata[];
}

// 逻辑模型DTO元数据
export interface LogicModelMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  domain: string; // 数据领域
  fields: FieldMetadata[];
}

// 第三方数据DTO元数据
export interface ThirdPartyModelMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  fields: FieldMetadata[];
}

// 数据类型枚举
export enum DataType {
  STRING = 'string',
  NUMBER = 'number',
  INTEGER = 'integer',
  BOOLEAN = 'boolean',
  DATE = 'date',
  DATETIME = 'datetime',
  ARRAY = 'array',
  OBJECT = 'object',
  REFERENCE = 'reference',
  ID = 'id',
  // FHIR特定类型
  CODE = 'code',
  CODING = 'coding',
  CODEABLECONCEPT = 'codeableConcept',
  QUANTITY = 'quantity',
  PERIOD = 'period',
  RESOURCE = 'resource',
  // 其他类型可以根据需要添加
}

// 字段映射配置
export interface FieldMapping {
  sourceFieldId: string; // 源字段ID
  targetFieldId: string; // 目标字段ID
  transformations?: Transformation[]; // 转换操作列表
}

// 转换操作
export interface Transformation {
  type: TransformationType;
  params?: Record<string, any>; // 转换操作的参数
}

// 转换操作类型
export enum TransformationType {
  DIRECT = 'direct', // 直接赋值
  FORMAT = 'format', // 格式化（如日期格式转换）
  CONCATENATE = 'concatenate', // 字符串拼接
  SPLIT = 'split', // 字符串分割
  MAP = 'map', // 值映射（如代码转换）
  MATH = 'math', // 数学运算
  CONDITIONAL = 'conditional', // 条件表达式
  // 其他转换操作可以根据需要添加
}

// 映射配置
export interface MappingConfig {
  id: string;
  name: string;
  description?: string;
  sourceModelId: string; // 源模型ID
  targetModelId: string; // 目标模型ID
  mappings: FieldMapping[]; // 字段映射列表
  domain: string; // 数据领域
}

// 可视化节点类型
export interface ModelNode {
  id: string;
  type: 'source' | 'target' | 'transform';
  data: {
    label: string;
    field?: FieldMetadata;
    transformation?: Transformation;
  };
  position: { x: number; y: number };
}

// 可视化边类型
export interface ModelEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
  label?: string;
  type?: string;
} 