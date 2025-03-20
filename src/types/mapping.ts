import { DataDomain } from './metadata';
import { z } from 'zod';

// 字段映射验证Schema
export const fieldMappingSchema = z.object({
  sourcePath: z.string().min(1, '源路径不能为空'),
  targetPath: z.string().min(1, '目标路径不能为空'),
  transform: z.string().optional(),
  condition: z.string().optional()
});

// 逻辑模型到FHIR映射验证Schema
export const logicToFhirMappingSchema = z.object({
  dataDomainId: z.string().min(1, '数据域不能为空'),
  logicDtoId: z.string().min(1, '逻辑DTO不能为空'),
  fhirResourceType: z.string().min(1, 'FHIR资源类型不能为空'),
  fieldMappings: z.array(fieldMappingSchema)
});

// 第三方数据到逻辑模型映射验证Schema
export const thirdPartyToLogicMappingSchema = z.object({
  dataDomainId: z.string().min(1, '数据域不能为空'),
  thirdPartyDtoId: z.string().min(1, '第三方DTO不能为空'),
  logicDtoId: z.string().min(1, '逻辑DTO不能为空'),
  fieldMappings: z.array(fieldMappingSchema)
});

export interface FieldMapping {
  sourcePath: string;
  targetPath: string;
  transform?: string;
  condition?: string;
}

export interface DtoMapping {
  source: string;
  target: string;
  fieldMappings: FieldMapping[];
}

export interface LogicToFhirMapping {
  dataDomainId: string;
  logicDtoId: string;
  fhirResourceType: string;
  fieldMappings: FieldMapping[];
}

export interface ThirdPartyToLogicMapping {
  dataDomainId: string;
  thirdPartyDtoId: string;
  logicDtoId: string;
  fieldMappings: FieldMapping[];
}

export interface FhirToLogicMapping {
  dataDomainId: string;
  fhirResourceType: string;
  logicDtoId: string;
  fieldMappings: FieldMapping[];
}

export interface LogicToThirdPartyMapping {
  dataDomainId: string;
  logicDtoId: string;
  thirdPartyDtoId: string;
  fieldMappings: FieldMapping[];
}

export interface MappingConfig {
  id: string;
  name: string;
  description?: string;
  type: 'logic-to-fhir' | 'third-party-to-logic';
  dataDomainId: string;
  sourceDtoId: string;
  targetDtoId: string;
  targetResourceType?: string;
  targetProfile?: string;
  fieldMappings: FieldMapping[];
  logicToFhirMappings?: LogicToFhirMapping[];
  thirdPartyToLogicMappings?: ThirdPartyToLogicMapping[];
  fhirToLogicMappings?: FhirToLogicMapping[];
  logicToThirdPartyMappings?: LogicToThirdPartyMapping[];
  createdAt: string;
  updatedAt: string;
}

export interface MappingRelation {
  id: string;
  name: string;
  description?: string;
  sourceDataDomain: string;
  targetDataDomain: string;
  mappingConfig: MappingConfig;
}

// 可视化节点类型
export interface MappingVisualNode {
  id: string;
  type: 'logic' | 'fhir' | 'thirdParty';
  data: {
    label: string;
    description?: string;
    fields?: any[];
  };
  position: {
    x: number;
    y: number;
  };
}

// 可视化边类型
export interface MappingVisualEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
} 