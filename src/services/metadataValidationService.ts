import { DataDomain, LogicDto, ThirdPartyDto, Field } from '../types/metadata';
import { MappingConfig, FieldMapping } from '../types/mapping';

export class MetadataValidationService {
  // 验证字段类型
  static validateFieldType(field: Field): boolean {
    const validTypes = [
      'string',
      'number',
      'boolean',
      'date',
      'datetime',
      'object',
      'array',
      'reference'
    ];

    return validTypes.includes(field.type);
  }

  // 验证字段名称
  static validateFieldName(name: string): boolean {
    const nameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    return nameRegex.test(name);
  }

  // 验证逻辑模型
  static validateLogicDto(dto: LogicDto): string[] {
    const errors: string[] = [];

    // 验证基本信息
    if (!dto.id || !dto.name) {
      errors.push('逻辑模型必须包含ID和名称');
    }

    // 验证字段
    if (dto.meta?.fields) {
      dto.meta.fields.forEach((field, index) => {
        if (!this.validateFieldType(field)) {
          errors.push(`字段 ${field.name} 的类型无效`);
        }
        if (!this.validateFieldName(field.name)) {
          errors.push(`字段 ${field.name} 的名称无效`);
        }
        if (field.required && !field.defaultValue) {
          errors.push(`必填字段 ${field.name} 必须提供默认值`);
        }
      });
    }

    return errors;
  }

  // 验证第三方模型
  static validateThirdPartyDto(dto: ThirdPartyDto): string[] {
    const errors: string[] = [];

    // 验证基本信息
    if (!dto.id || !dto.name) {
      errors.push('第三方模型必须包含ID和名称');
    }

    // 验证字段
    if (dto.meta?.fields) {
      dto.meta.fields.forEach((field, index) => {
        if (!this.validateFieldType(field)) {
          errors.push(`字段 ${field.name} 的类型无效`);
        }
        if (!this.validateFieldName(field.name)) {
          errors.push(`字段 ${field.name} 的名称无效`);
        }
      });
    }

    return errors;
  }

  // 验证数据域
  static validateDataDomain(domain: DataDomain): string[] {
    const errors: string[] = [];

    // 验证基本信息
    if (!domain.id || !domain.name) {
      errors.push('数据域必须包含ID和名称');
    }

    // 验证逻辑模型
    if (domain.logicalDtos) {
      domain.logicalDtos.forEach(dto => {
        const dtoErrors = this.validateLogicDto(dto);
        errors.push(...dtoErrors.map(error => `逻辑模型 ${dto.name}: ${error}`));
      });
    }

    // 验证第三方模型
    if (domain.thirdPartyDtos) {
      domain.thirdPartyDtos.forEach(dto => {
        const dtoErrors = this.validateThirdPartyDto(dto);
        errors.push(...dtoErrors.map(error => `第三方模型 ${dto.name}: ${error}`));
      });
    }

    return errors;
  }

  // 验证映射配置
  static validateMappingConfig(config: MappingConfig): string[] {
    const errors: string[] = [];

    // 验证数据域ID
    if (!config.dataDomainId) {
      errors.push('映射配置必须包含数据域ID');
    }

    // 验证逻辑模型到FHIR的映射
    if (config.logicToFhirMappings) {
      config.logicToFhirMappings.forEach((mapping, index) => {
        const mappingErrors = this.validateFieldMappings(mapping.fieldMappings);
        errors.push(...mappingErrors.map(error => `逻辑模型到FHIR映射 ${index + 1}: ${error}`));
      });
    }

    // 验证第三方模型到逻辑模型的映射
    if (config.thirdPartyToLogicMappings) {
      config.thirdPartyToLogicMappings.forEach((mapping, index) => {
        const mappingErrors = this.validateFieldMappings(mapping.fieldMappings);
        errors.push(...mappingErrors.map(error => `第三方模型到逻辑模型映射 ${index + 1}: ${error}`));
      });
    }

    // 验证FHIR到逻辑模型的映射
    if (config.fhirToLogicMappings) {
      config.fhirToLogicMappings.forEach((mapping, index) => {
        const mappingErrors = this.validateFieldMappings(mapping.fieldMappings);
        errors.push(...mappingErrors.map(error => `FHIR到逻辑模型映射 ${index + 1}: ${error}`));
      });
    }

    // 验证逻辑模型到第三方模型的映射
    if (config.logicToThirdPartyMappings) {
      config.logicToThirdPartyMappings.forEach((mapping, index) => {
        const mappingErrors = this.validateFieldMappings(mapping.fieldMappings);
        errors.push(...mappingErrors.map(error => `逻辑模型到第三方模型映射 ${index + 1}: ${error}`));
      });
    }

    return errors;
  }

  // 验证字段映射
  private static validateFieldMappings(fieldMappings: FieldMapping[]): string[] {
    const errors: string[] = [];

    fieldMappings.forEach((mapping, index) => {
      if (!mapping.sourcePath || !mapping.targetPath) {
        errors.push(`字段映射 ${index + 1} 必须包含源字段和目标字段`);
      }
      if (mapping.transform && !this.validateTransformExpression(mapping.transform)) {
        errors.push(`字段映射 ${index + 1} 的转换表达式无效`);
      }
      if (mapping.condition && !this.validateTransformExpression(mapping.condition)) {
        errors.push(`字段映射 ${index + 1} 的条件表达式无效`);
      }
    });

    return errors;
  }

  // 验证转换表达式
  private static validateTransformExpression(expression: string): boolean {
    try {
      // 基本语法检查
      const validFunctions = [
        'concat',
        'toUpperCase',
        'toLowerCase',
        'parseInt',
        'parseFloat',
        'formatDate',
        'if',
        'coalesce',
        'map',
        'filter'
      ];

      // 检查函数调用
      const functionCallRegex = /^(\w+)\((.*)\)$/;
      const match = expression.match(functionCallRegex);
      
      if (match) {
        const [_, funcName] = match;
        return validFunctions.includes(funcName);
      }

      // 检查路径访问
      const pathRegex = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)*$/;
      return pathRegex.test(expression);
    } catch {
      return false;
    }
  }

  // 验证数据域关系
  static validateDomainRelation(relation: any): string[] {
    const errors: string[] = [];

    if (!relation.sourceDomainId || !relation.targetDomainId) {
      errors.push('数据域关系必须包含源数据域和目标数据域');
    }

    if (!['extends', 'composes', 'references'].includes(relation.relationType)) {
      errors.push('无效的关系类型');
    }

    if (relation.mappingConfig) {
      const mappingErrors = this.validateMappingConfig(relation.mappingConfig);
      errors.push(...mappingErrors);
    }

    return errors;
  }

  // 验证整个元数据模型
  static validateMetadataModel(domains: DataDomain[], relations: any[]): string[] {
    const errors: string[] = [];

    // 验证数据域
    domains.forEach(domain => {
      const domainErrors = this.validateDataDomain(domain);
      errors.push(...domainErrors);
    });

    // 验证数据域关系
    relations.forEach(relation => {
      const relationErrors = this.validateDomainRelation(relation);
      errors.push(...relationErrors);
    });

    // 验证数据域引用的完整性
    const domainIds = new Set(domains.map(d => d.id));
    relations.forEach(relation => {
      if (!domainIds.has(relation.sourceDomainId)) {
        errors.push(`源数据域 ${relation.sourceDomainId} 不存在`);
      }
      if (!domainIds.has(relation.targetDomainId)) {
        errors.push(`目标数据域 ${relation.targetDomainId} 不存在`);
      }
    });

    return errors;
  }
} 