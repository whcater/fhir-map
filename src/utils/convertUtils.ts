import { LogicDto, ThirdPartyDto, FhirMapping, ThirdPartyMapping } from '../types/metadata';
import { FhirResource, FhirBundle } from '../types/fhir';
import { FieldMapping } from '../types/mapping';
import { parseString } from 'xml2js';
import { promisify } from 'util';
import { DataDomain } from '../types/metadata';

const parseXmlAsync = promisify(parseString);

/**
 * 解析JSON路径并获取值
 */
export const getValueByJsonPath = (obj: any, path: string): any => {
  if (!path) return undefined;
  
  // 移除可能的jsonpath前缀
  const normalizedPath = path.startsWith('$') ? path.substring(1) : path;
  
  // 处理空路径
  if (!normalizedPath || normalizedPath === '') return obj;
  
  // 分割路径
  const parts = normalizedPath.split('.');
  let current = obj;
  
  for (let i = 0; i < parts.length; i++) {
    // 处理数组访问，如 items[0]
    const match = parts[i].match(/(\w+)\[(\d+)\]/);
    if (match) {
      const prop = match[1];
      const index = parseInt(match[2], 10);
      if (current[prop] && Array.isArray(current[prop]) && current[prop].length > index) {
        current = current[prop][index];
      } else {
        return undefined;
      }
    } else if (current[parts[i]] !== undefined) {
      current = current[parts[i]];
    } else {
      return undefined;
    }
  }
  
  return current;
};

/**
 * 设置对象的值
 */
export const setValueByPath = (obj: any, path: string, value: any): any => {
  if (!path) return obj;
  
  // 移除可能的jsonpath前缀
  const normalizedPath = path.startsWith('$') ? path.substring(1) : path;
  
  // 处理空路径
  if (!normalizedPath || normalizedPath === '') {
    return { ...obj, ...value };
  }
  
  const result = { ...obj };
  const parts = normalizedPath.split('.');
  let current = result;
  
  for (let i = 0; i < parts.length; i++) {
    // 处理数组访问，如 items[0]
    const match = parts[i].match(/(\w+)\[(\d+)\]/);
    
    if (match) {
      const prop = match[1];
      const index = parseInt(match[2], 10);
      
      if (i === parts.length - 1) {
        // 最后一部分，设置值
        if (!current[prop]) {
          current[prop] = [];
        }
        // 确保数组足够长
        while (current[prop].length <= index) {
          current[prop].push(undefined);
        }
        current[prop][index] = value;
      } else {
        // 中间部分，确保对象存在
        if (!current[prop]) {
          current[prop] = [];
        }
        // 确保数组足够长
        while (current[prop].length <= index) {
          current[prop].push({});
        }
        if (!current[prop][index]) {
          current[prop][index] = {};
        }
        current = current[prop][index];
      }
    } else {
      if (i === parts.length - 1) {
        // 最后一部分，设置值
        current[parts[i]] = value;
      } else {
        // 中间部分，确保对象存在
        if (!current[parts[i]]) {
          current[parts[i]] = {};
        }
        current = current[parts[i]];
      }
    }
  }
  
  return result;
};

/**
 * 应用转换函数
 */
export const applyTransform = (value: any, transform: string | undefined): any => {
  if (!transform) return value;
  
  try {
    // 使用Function构造函数创建转换函数
    const transformFn = new Function('value', `return ${transform}`);
    return transformFn(value);
  } catch (error) {
    console.error('转换函数执行失败:', error);
    return value;
  }
};

/**
 * 评估条件
 */
export const evaluateCondition = (data: any, condition: string | undefined): boolean => {
  if (!condition) return true;
  
  try {
    // 使用Function构造函数创建条件函数
    const conditionFn = new Function('data', `return ${condition}`);
    return conditionFn(data);
  } catch (error) {
    console.error('条件函数执行失败:', error);
    return false;
  }
};

/**
 * 将第三方数据转换为逻辑模型
 */
export const thirdPartyToLogic = (
  thirdPartyData: any, 
  logicDto: LogicDto, 
  fieldMappings: FieldMapping[]
): any => {
  const result: any = {};
  
  // 遍历所有映射字段
  fieldMappings.forEach(mapping => {
    // 获取源字段值
    const sourceValue = getValueByJsonPath(thirdPartyData, mapping.sourcePath);
    
    // 应用转换
    const transformedValue = applyTransform(sourceValue, mapping.transform);
    
    // 设置目标字段值
    if (transformedValue !== undefined) {
      setValueByPath(result, mapping.targetPath, transformedValue);
    }
  });
  
  return result;
};

/**
 * 将逻辑模型转换为FHIR资源
 */
export const logicToFhir = (
  logicData: any, 
  resourceType: string, 
  fieldMappings: FieldMapping[]
): FhirResource => {
  const result: FhirResource = {
    resourceType
  };
  
  // 遍历所有映射字段
  fieldMappings.forEach(mapping => {
    // 获取源字段值
    const sourceValue = getValueByJsonPath(logicData, mapping.sourcePath);
    
    // 应用转换
    const transformedValue = applyTransform(sourceValue, mapping.transform);
    
    // 评估条件
    if (evaluateCondition(logicData, mapping.condition)) {
      // 设置目标字段值
      if (transformedValue !== undefined) {
        setValueByPath(result, mapping.targetPath, transformedValue);
      }
    }
  });
  
  return result;
};

/**
 * 将FHIR资源转换为逻辑模型
 */
export const fhirToLogic = (
  fhirResource: FhirResource, 
  fieldMappings: FieldMapping[]
): any => {
  const result: any = {};
  
  // 遍历所有映射字段
  fieldMappings.forEach(mapping => {
    // 获取源字段值
    const sourceValue = getValueByJsonPath(fhirResource, mapping.sourcePath);
    
    // 应用转换
    const transformedValue = applyTransform(sourceValue, mapping.transform);
    
    // 设置目标字段值
    if (transformedValue !== undefined) {
      setValueByPath(result, mapping.targetPath, transformedValue);
    }
  });
  
  return result;
};

/**
 * 将逻辑模型转换为第三方数据
 */
export const logicToThirdParty = (
  logicData: any, 
  fieldMappings: FieldMapping[]
): any => {
  const result: any = {};
  
  // 遍历所有映射字段
  fieldMappings.forEach(mapping => {
    // 获取源字段值
    const sourceValue = getValueByJsonPath(logicData, mapping.sourcePath);
    
    // 应用转换
    const transformedValue = applyTransform(sourceValue, mapping.transform);
    
    // 设置目标字段值
    if (transformedValue !== undefined) {
      setValueByPath(result, mapping.targetPath, transformedValue);
    }
  });
  
  return result;
};

/**
 * 将JSON字符串转换为对象
 */
export const parseJsonString = (jsonString: string): any => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON解析失败:', error);
    return null;
  }
};

/**
 * 从JSON或XML字符串自动生成元数据结构
 */
export const generateMetadataFromData = (data: string, isXml: boolean = false): any => {
  let parsedData;
  
  // 解析数据
  if (isXml) {
    // 需要引入xml2js包处理XML
    console.warn('XML处理需要额外引入xml2js包');
    return null;
  } else {
    try {
      parsedData = JSON.parse(data);
    } catch (error) {
      console.error('JSON解析失败:', error);
      return null;
    }
  }
  
  // 递归提取字段信息
  const extractFields = (obj: any, path: string = ''): any[] => {
    if (!obj || typeof obj !== 'object') return [];
    
    const fields: any[] = [];
    
    Object.entries(obj).forEach(([key, value]) => {
      const fieldPath = path ? `${path}.${key}` : key;
      const field: any = {
        name: key,
        type: Array.isArray(value) ? 'array' : typeof value,
        description: '',
      };
      
      // 针对对象和数组进行递归处理
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value) && value.length > 0) {
          // 数组元素的类型
          field.type = `array<${typeof value[0] === 'object' ? 'object' : typeof value[0]}>`;
          
          // 如果数组元素是对象，递归处理
          if (typeof value[0] === 'object' && value[0] !== null) {
            field.children = extractFields(value[0], `${fieldPath}[0]`);
          }
        } else if (!Array.isArray(value)) {
          // 对象类型递归处理
          field.children = extractFields(value, fieldPath);
        }
      }
      
      fields.push(field);
    });
    
    return fields;
  };
  
  return {
    fields: extractFields(parsedData)
  };
};

/**
 * 将JSON字符串转换为元数据对象
 * @param jsonString JSON字符串
 * @returns 元数据对象
 */
export async function parseJson(jsonString: string): Promise<DataDomain> {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    throw new Error(`JSON解析错误: ${error}`);
  }
}

/**
 * 将XML字符串转换为元数据对象
 * @param xmlString XML字符串
 * @returns 元数据对象
 */
export async function parseXml(xmlString: string): Promise<DataDomain> {
  try {
    const result = await parseXmlAsync(xmlString);
    return result as DataDomain;
  } catch (error) {
    throw new Error(`XML解析错误: ${error}`);
  }
}

/**
 * 将任意数据转换为DataDomain对象
 * @param data 输入数据
 * @returns DataDomain对象
 */
function transformToDataDomain(data: any): DataDomain {
  // TODO: 实现数据转换逻辑
  return data as DataDomain;
}

const transformToLogicDto = (data: any): LogicDto => {
  return {
    name: data.name || '',
    id: data.id || '',
    description: data.description || '',
    meta: {
      fields: Array.isArray(data.meta?.fields) ? data.meta.fields.map((field: any) => ({
        name: field.name || '',
        type: field.type || 'string',
        description: field.description || '',
        required: field.required || false,
        fhir_mapping: field.fhir_mapping ? {
          path: field.fhir_mapping.path || '',
          type: field.fhir_mapping.type || 'string',
          transform: field.fhir_mapping.transform,
          condition: field.fhir_mapping.condition
        } : undefined,
        third_party_mapping: field.third_party_mapping ? {
          third_party_dto: field.third_party_mapping.third_party_dto || '',
          field_desc: field.third_party_mapping.field_desc || '',
          field_path: field.third_party_mapping.field_path || '',
          transform: field.third_party_mapping.transform
        } : undefined
      })) : []
    }
  };
};

const transformToThirdPartyDto = (data: any): ThirdPartyDto => {
  return {
    name: data.name || '',
    id: data.id || '',
    description: data.description || '',
    meta: {
      fields: Array.isArray(data.meta?.fields) ? data.meta.fields.map((field: any) => ({
        name: field.name || '',
        desc: field.desc || '',
        type: field.type || 'string',
        description: field.description || ''
      })) : []
    }
  };
}; 