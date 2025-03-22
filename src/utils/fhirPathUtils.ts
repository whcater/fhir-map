import * as fhirpath from 'fhirpath';

/**
 * 在JSON对象中查找可能的路径
 * @param obj JSON对象
 * @param targetValue 目标值
 * @param currentPath 当前路径
 * @param result 结果数组
 * @returns 可能的路径数组
 */
export const findPossiblePaths = (obj: any, targetValue: string, currentPath: string = '', result: string[] = []): string[] => {
  if (!obj || typeof obj !== 'object') return result;
  
  // 资源类型处理
  if (obj.resourceType && currentPath === '') {
    currentPath = obj.resourceType;
  }
  
  // 遍历所有属性
  for (const key in obj) {
    if (key === 'resourceType') continue;
    
    const value = obj[key];
    const newPath = currentPath ? `${currentPath}.${key}` : key;
    
    // 检查当前属性是否匹配目标值
    if (key === targetValue || (typeof value === 'string' && value === targetValue)) {
      result.push(newPath);
    }
    
    // 数组处理
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const arrayItemPath = `${newPath}[${i}]`;
        
        // 检查数组项是否直接匹配
        if (value[i] === targetValue) {
          result.push(arrayItemPath);
        }
        
        // 递归处理数组项
        if (typeof value[i] === 'object' && value[i] !== null) {
          findPossiblePaths(value[i], targetValue, arrayItemPath, result);
        }
      }
    } 
    // 对象处理
    else if (typeof value === 'object' && value !== null) {
      findPossiblePaths(value, targetValue, newPath, result);
    }
  }
  
  return result;
};

/**
 * 从指定位置的token计算FHIR路径
 * @param token Token信息
 * @param json JSON对象
 * @returns FHIR路径
 */
export const calculatePathFromToken = (token: { type: string; value: string; column: number }, json: any): string => {
  // 如果是resourceType，直接返回资源类型
  if (token.type === 'property' && token.value === 'resourceType') {
    return json.resourceType || '';
  }
  
  if (token.type === 'value' && token.column === 0) {
    // 假设这是资源类型的值
    return token.value;
  }
  
  // 使用FHIRPath库尝试计算路径
  try {
    // 首先检查是否有resourceType字段
    const resourceType = json.resourceType;
    if (!resourceType) return '';
    
    // 构建基本路径
    let basePath = resourceType;
    
    // 查找当前token在JSON中的位置
    const paths = findPossiblePaths(json, token.value);
    if (paths.length > 0) {
      // 返回第一个找到的路径
      // 多个匹配时可以考虑上下文等因素进行选择
      return paths[0];
    }
    
    return basePath;
  } catch (error) {
    console.error('FHIRPath计算错误:', error);
    return '';
  }
};

/**
 * 在指定文本中查找指定位置的token
 * @param lineContent 行内容
 * @param column 列位置
 * @returns Token信息或null
 */
export const findTokenAtPosition = (lineContent: string, column: number): { type: string; value: string; column: number } | null => {
  // 简化的token查找逻辑，实际中可能需要更复杂的解析
  const propertyRegex = /"([^"]+)"\s*:/g;
  const valueRegex = /:\s*("[^"]*"|[\d\.]+|true|false|null|\{|\[)/g;
  
  let match;
  // 查找属性名
  while ((match = propertyRegex.exec(lineContent)) !== null) {
    const start = match.index + 1; // 跳过开始引号
    const end = start + match[1].length; // 不包括结束引号
    
    if (column >= start && column <= end) {
      return { type: 'property', value: match[1], column: start };
    }
  }
  
  // 查找值
  valueRegex.lastIndex = 0;
  while ((match = valueRegex.exec(lineContent)) !== null) {
    const valueStart = match.index + match[0].indexOf(match[1]);
    const valueEnd = valueStart + match[1].length;
    
    if (column >= valueStart && column <= valueEnd) {
      let value = match[1];
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1); // 移除引号
      }
      return { type: 'value', value, column: valueStart };
    }
  }
  
  return null;
};

/**
 * 使用FHIRPath库执行FHIRPath表达式
 * @param expression FHIRPath表达式
 * @param resource FHIR资源
 * @returns 执行结果数组
 */
export const evaluateFhirPath = (expression: string, resource: any): any[] => {
  try {
    // 使用fhirpath库执行表达式
    const result = fhirpath.evaluate(resource, expression);
    // 确保返回数组
    return Array.isArray(result) ? result : [result];
  } catch (error) {
    console.error('FHIRPath执行错误:', error);
    return [];
  }
};

/**
 * 添加FHIRPath where函数
 * @param path 基础路径
 * @param condition 条件表达式
 * @returns 处理后的FHIRPath
 */
export const applyWhereFunction = (path: string, condition: string): string => {
  return `${path}.where(${condition})`;
};

/**
 * 添加FHIRPath select函数
 * @param path 基础路径
 * @param projection 投影表达式
 * @returns 处理后的FHIRPath
 */
export const applySelectFunction = (path: string, projection: string): string => {
  return `${path}.select(${projection})`;
};

/**
 * 添加FHIRPath ofType函数
 * @param path 基础路径
 * @param resourceType 资源类型
 * @returns 处理后的FHIRPath
 */
export const applyOfTypeFunction = (path: string, resourceType: string): string => {
  return `${path}.ofType(${resourceType})`;
};

/**
 * 解析并计算高级查询FHIRPath
 * @param basePath 基础路径
 * @param query 查询表达式
 * @returns 处理后的FHIRPath
 */
export const getPathWithAdvancedQuery = (basePath: string, query: string = ''): string => {
  if (!query.trim()) return basePath;
  
  // 解析查询条件
  try {
    // 尝试将查询解析为一个FHIRPath表达式
    if (query.startsWith('where')) {
      // 例如：where(gender='male')
      return applyWhereFunction(basePath, query.substring(6, query.length - 1));
    } else if (query.startsWith('select')) {
      // 例如：select(name)
      return applySelectFunction(basePath, query.substring(7, query.length - 1));
    } else if (query.startsWith('ofType')) {
      // 例如：ofType(Patient)
      return applyOfTypeFunction(basePath, query.substring(7, query.length - 1));
    } else {
      // 假设是属性访问
      return `${basePath}.${query}`;
    }
  } catch (error) {
    console.error('查询解析错误:', error);
    return basePath;
  }
}; 