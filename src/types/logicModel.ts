export interface Field {
  name: string;
  type: string;
  description: string;
  required?: boolean;
  defaultValue?: any;
}

export interface LogicDto {
  id: string;
  name: string;
  description: string;
  fields: Field[];
  version?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DataDomain {
  id: string;
  name: string;
  description: string;
  logicalDtos: LogicDto[];
}

export interface ThirdPartyDto {
  id: string;
  name: string;
  description: string;
  format: 'json' | 'xml';
  schema: any;
  fields: Field[];
}

export interface MappingConfig {
  id: string;
  name: string;
  description: string;
  sourceType: 'ThirdPartyDto' | 'LogicDto' | 'FHIR';
  targetType: 'ThirdPartyDto' | 'LogicDto' | 'FHIR';
  sourceId: string;
  targetId: string;
  mappings: FieldMapping[];
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
  condition?: string;
} 