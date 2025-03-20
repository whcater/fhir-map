import { MappingConfig } from '../types/mapping';
import { FhirResource } from '../types/fhir';
import { evaluateExpression } from '../utils/expressionUtils';

interface ConversionResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * 执行转换表达式
 * @param expression 转换表达式
 * @param context 上下文数据
 * @returns 转换结果
 */
function executeTransform(expression: string, context: any): any {
  try {
    return evaluateExpression(expression, context);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`表达式执行失败: ${error.message}`);
    }
    throw error;
  }
}

/**
 * 将第三方数据转换为FHIR资源
 * @param data 第三方数据
 * @param mappingConfig 映射配置
 * @returns 转换结果
 */
export async function convertToFhir(data: any, mappingConfig: MappingConfig): Promise<ConversionResult> {
  try {
    if (!mappingConfig.targetResourceType) {
      throw new Error('未指定目标资源类型');
    }

    const result: FhirResource = {
      resourceType: mappingConfig.targetResourceType,
      id: data.id || generateId(),
      meta: {
        profile: mappingConfig.targetProfile ? [mappingConfig.targetProfile] : []
      }
    };

    for (const mapping of mappingConfig.fieldMappings) {
      const sourceValue = getValueByPath(data, mapping.sourcePath);
      
      if (mapping.transform) {
        const context = {
          source: sourceValue,
          data
        };
        const transformedValue = executeTransform(mapping.transform, context);
        setValueByPath(result, mapping.targetPath, transformedValue);
      } else {
        setValueByPath(result, mapping.targetPath, sourceValue);
      }
    }

    return {
      success: true,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '转换失败'
    };
  }
}

/**
 * 将FHIR资源转换为第三方数据
 * @param resource FHIR资源
 * @param mappingConfig 映射配置
 * @returns 转换结果
 */
export async function convertFromFhir(resource: FhirResource, mappingConfig: MappingConfig): Promise<ConversionResult> {
  try {
    const result: any = {};

    for (const mapping of mappingConfig.fieldMappings) {
      const sourceValue = getValueByPath(resource, mapping.sourcePath);
      
      if (mapping.transform) {
        const context = {
          source: sourceValue,
          resource
        };
        const transformedValue = executeTransform(mapping.transform, context);
        setValueByPath(result, mapping.targetPath, transformedValue);
      } else {
        setValueByPath(result, mapping.targetPath, sourceValue);
      }
    }

    return {
      success: true,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '转换失败'
    };
  }
}

/**
 * 根据路径获取对象中的值
 * @param obj 对象
 * @param path 路径
 * @returns 值
 */
function getValueByPath(obj: any, path: string): any {
  return path.split('.').reduce((value, key) => value?.[key], obj);
}

/**
 * 根据路径设置对象中的值
 * @param obj 对象
 * @param path 路径
 * @param value 值
 */
function setValueByPath(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((obj, key) => {
    if (!obj[key]) {
      obj[key] = {};
    }
    return obj[key];
  }, obj);
  target[lastKey] = value;
}

/**
 * 生成唯一ID
 * @returns 唯一ID
 */
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
} 