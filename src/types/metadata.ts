import { z } from 'zod';

export interface Field {
  name: string;
  type: string;
  description: string;
  required?: boolean;
  defaultValue?: any;
  fhir_mapping?: {
    path: string;
    type: string;
  };
  third_party_mapping?: {
    third_party_dto: string;
    field_desc: string;
    field_path: string;
  };
}

export interface Meta {
  fields: Field[];
}

// FHIR映射验证Schema
export const fhirMappingSchema = z.object({
  path: z.string().min(1, '路径不能为空'),
  type: z.string().min(1, '类型不能为空'),
  transform: z.string().optional(),
  condition: z.string().optional()
});

// 第三方映射验证Schema
export const thirdPartyMappingSchema = z.object({
  third_party_dto: z.string().min(1, '第三方DTO不能为空'),
  field_path: z.string().min(1, '字段路径不能为空'),
  field_desc: z.string().min(1, '字段描述不能为空'),
  transform: z.string().optional()
});

// 逻辑DTO字段验证Schema
export const logicDtoFieldSchema = z.object({
  name: z.string().min(1, '字段名不能为空'),
  type: z.string().min(1, '字段类型不能为空'),
  description: z.string().min(1, '字段描述不能为空'),
  required: z.boolean().default(false),
  fhir_mapping: fhirMappingSchema.optional(),
  third_party_mapping: thirdPartyMappingSchema.optional()
});

// 第三方DTO字段验证Schema
export const thirdPartyDtoFieldSchema = z.object({
  name: z.string().min(1, '字段名不能为空'),
  type: z.string().min(1, '字段类型不能为空'),
  description: z.string().min(1, '字段描述不能为空'),
  desc: z.string().min(1, '字段描述不能为空')
});

// 逻辑DTO验证Schema
export const logicDtoSchema = z.object({
  id: z.string().min(1, 'ID不能为空'),
  name: z.string().min(1, '名称不能为空'),
  description: z.string().min(1, '描述不能为空'),
  meta: z.object({
    fields: z.array(logicDtoFieldSchema)
  })
});

// 第三方DTO验证Schema
export const thirdPartyDtoSchema = z.object({
  id: z.string().min(1, 'ID不能为空'),
  name: z.string().min(1, '名称不能为空'),
  description: z.string().min(1, '描述不能为空'),
  meta: z.object({
    fields: z.array(thirdPartyDtoFieldSchema)
  })
});

// 数据域验证Schema
export const dataDomainSchema = z.object({
  id: z.string().min(1, 'ID不能为空'),
  name: z.string().min(1, '名称不能为空'),
  description: z.string().min(1, '描述不能为空'),
  logicalDtos: z.array(logicDtoSchema),
  thirdPartyDtos: z.array(thirdPartyDtoSchema)
});

export interface FhirMapping {
  path: string;
  type: string;
  transform?: string;
  condition?: string;
}

export interface ThirdPartyMapping {
  third_party_dto: string;
  field_path: string;
  field_desc: string;
  transform?: string;
}

export interface LogicDtoField {
  name: string;
  type: string;
  description: string;
  required: boolean;
  defaultValue?: any;
  fhir_mapping?: FhirMapping;
  third_party_mapping?: ThirdPartyMapping;
}

export interface ThirdPartyDtoField {
  name: string;
  type: string;
  description: string;
  desc: string;
}

export interface LogicDto {
  id: string;
  name: string;
  description: string;
  meta: {
    fields: LogicDtoField[];
  };
}

export interface ThirdPartyDto {
  id: string;
  name: string;
  description: string;
  meta: {
    fields: ThirdPartyDtoField[];
  };
}

export interface DataDomain {
  id: string;
  name: string;
  description: string;
  logicalDtos: LogicDto[];
  thirdPartyDtos: ThirdPartyDto[];
}

export interface DomainRelation {
  id: string;
  sourceDomainId: string;
  targetDomainId: string;
  relationType: 'extends' | 'composes' | 'references';
  description?: string;
}

export interface AppConfig {
  domains: DataDomain[];
  domain_relations: DomainRelation[];
} 