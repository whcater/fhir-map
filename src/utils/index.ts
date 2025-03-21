import { FieldMetadata, FieldType } from '../types';
import { parseString } from 'xml2js';

/**
 * 生成唯一ID
 */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

/**
 * 从JSON对象自动生成字段元数据
 * @param jsonObj JSON对象
 * @param parentId 父字段ID
 */
export const generateFieldsFromJson = (
  jsonObj: Record<string, any>,
  parentId?: string
): FieldMetadata[] => {
  return Object.entries(jsonObj).map(([key, value]) => {
    const type = determineType(value);
    const field: FieldMetadata = {
      id: generateId(),
      name: key,
      type,
      isRequired: true,
      parentId
    };

    if (type === FieldType.OBJECT && value) {
      field.children = generateFieldsFromJson(value, field.id);
    } else if (type === FieldType.ARRAY && Array.isArray(value) && value.length > 0) {
      if (typeof value[0] === 'object' && value[0] !== null) {
        field.children = generateFieldsFromJson(value[0], field.id);
      }
    }

    return field;
  });
};

/**
 * 从XML字符串自动生成字段元数据
 * @param xmlString XML字符串
 */
export const generateFieldsFromXml = (
  xmlString: string
): Promise<FieldMetadata[]> => {
  return new Promise((resolve, reject) => {
    parseString(xmlString, (err: Error | null, result: Record<string, any>) => {
      if (err) {
        reject(err);
        return;
      }

      const fields = generateFieldsFromJson(result);
      resolve(fields);
    });
  });
};

/**
 * 确定值的类型
 * @param value 需要确定类型的值
 */
export const determineType = (value: any): FieldType => {
  if (value === null || value === undefined) {
    return FieldType.STRING;
  }

  if (Array.isArray(value)) {
    return FieldType.ARRAY;
  }

  if (value instanceof Date) {
    return FieldType.DATETIME;
  }

  if (typeof value === 'object') {
    return FieldType.OBJECT;
  }

  if (typeof value === 'number') {
    return FieldType.NUMBER;
  }

  if (typeof value === 'boolean') {
    return FieldType.BOOLEAN;
  }

  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return FieldType.DATE;
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      return FieldType.DATETIME;
    }
    return FieldType.STRING;
  }

  return FieldType.STRING;
};

/**
 * 深度克隆对象
 * @param obj 需要克隆的对象
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * 格式化日期时间
 * @param date 日期对象或日期字符串
 */
export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().replace('T', ' ').substring(0, 19);
};

/**
 * 下载JSON文件
 * @param data 要下载的数据
 * @param filename 文件名
 */
export const downloadJson = (data: any, filename: string): void => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const href = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(href);
}; 