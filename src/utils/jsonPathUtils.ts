/**
 * 自定义Position接口，与monaco-editor解耦
 */
export interface EditorPosition {
  lineNumber: number;
  column: number;
}

/**
 * 计算指定位置在JSON中的路径
 * 此函数基于简单的行列位置信息计算JSON Path
 * 
 * @param json 解析后的JSON对象
 * @param position 编辑器中的位置(行、列)
 * @param jsonText 原始JSON文本
 * @returns 计算出的JSON Path
 */
export const calculateJsonPathAtPosition = (
  json: any, 
  position: EditorPosition, 
  jsonText: string
): string => {
  if (!json || !jsonText) return '';
  
  // 将JSON文本分割为行
  const lines = jsonText.split('\n');
  
  // 获取光标所在行的内容
  const lineContent = position.lineNumber <= lines.length 
    ? lines[position.lineNumber - 1] 
    : '';
  
  // 查找当前行的token（属性或值）
  const token = findTokenAtPosition(lineContent, position.column);
  if (!token) return '';
  
  // 基于token寻找可能的路径
  return findJsonPathForToken(json, token.value, token.type);
};

/**
 * 在一行文本中查找特定位置的token
 * 
 * @param lineContent 一行JSON文本
 * @param column 列位置
 * @returns token信息或null
 */
export const findTokenAtPosition = (
  lineContent: string, 
  column: number
): { type: 'property' | 'value'; value: string } | null => {
  // 查找属性名
  const propertyRegex = /"([^"]+)"\s*:/g;
  let match;
  
  while ((match = propertyRegex.exec(lineContent)) !== null) {
    const start = match.index + 1; // 跳过开始引号
    const end = start + match[1].length; // 不包括结束引号
    
    if (column >= start && column <= end) {
      return { type: 'property', value: match[1] };
    }
  }
  
  // 查找值
  const valueRegex = /:\s*("[^"]*"|[-\d\.]+|true|false|null)/g;
  
  while ((match = valueRegex.exec(lineContent)) !== null) {
    const valueStartIndex = match[0].indexOf(match[1], 1);
    const start = match.index + valueStartIndex;
    const end = start + match[1].length;
    
    if (column >= start && column <= end) {
      let value = match[1];
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1); // 移除引号
      }
      return { type: 'value', value };
    }
  }
  
  return null;
};

/**
 * 在JSON对象中查找指定token的JSON Path
 * 
 * @param json JSON对象
 * @param tokenValue token值
 * @param tokenType token类型
 * @returns JSON Path字符串
 */
export const findJsonPathForToken = (
  json: any, 
  tokenValue: string, 
  tokenType: 'property' | 'value'
): string => {
  const paths: string[] = [];
  
  // 递归搜索JSON结构
  const search = (obj: any, currentPath: string = '$') => {
    if (!obj || typeof obj !== 'object') return;
    
    if (Array.isArray(obj)) {
      // 数组处理
      obj.forEach((item, index) => {
        const itemPath = `${currentPath}[${index}]`;
        
        // 检查值
        if (tokenType === 'value' && 
            (item === tokenValue || 
             (typeof item === 'string' && item === tokenValue) ||
             (typeof item === 'number' && item.toString() === tokenValue) ||
             (typeof item === 'boolean' && item.toString() === tokenValue))) {
          paths.push(itemPath);
        }
        
        // 递归处理对象或数组
        if (typeof item === 'object' && item !== null) {
          search(item, itemPath);
        }
      });
    } else {
      // 对象处理
      for (const key in obj) {
        const value = obj[key];
        const newPath = currentPath === '$' ? `${currentPath}.${key}` : `${currentPath}.${key}`;
        
        // 检查属性名
        if (tokenType === 'property' && key === tokenValue) {
          paths.push(currentPath === '$' ? `${currentPath}.${key}` : `${currentPath}.${key}`);
        }
        
        // 检查值
        if (tokenType === 'value' && 
            (value === tokenValue || 
             (typeof value === 'string' && value === tokenValue) ||
             (typeof value === 'number' && value.toString() === tokenValue) ||
             (typeof value === 'boolean' && value.toString() === tokenValue))) {
          paths.push(newPath);
        }
        
        // 递归处理对象或数组
        if (typeof value === 'object' && value !== null) {
          search(value, newPath);
        }
      }
    }
  };
  
  search(json);
  return paths.length > 0 ? paths[0] : '';
};

/**
 * 将JSON Path转换为FHIR Path
 * 
 * @param jsonPath JSON Path字符串
 * @param json JSON对象
 * @returns FHIR Path字符串
 */
export const convertJsonPathToFhirPath = (jsonPath: string, json: any): string => {
  if (!jsonPath || !json) return '';
  
  // 移除开始的$符号
  let fhirPath = jsonPath.startsWith('$') ? jsonPath.substring(1) : jsonPath;
  
  // 判断是否有resourceType
  const resourceType = json.resourceType;
  
  // 如果有resourceType，将其作为FHIR Path的开头
  if (resourceType) {
    // 移除开头的点
    if (fhirPath.startsWith('.')) {
      fhirPath = fhirPath.substring(1);
    }
    
    // 如果第一个部分不是resourceType，则添加resourceType
    const firstPart = fhirPath.split('.')[0];
    if (firstPart !== resourceType) {
      fhirPath = `${resourceType}.${fhirPath}`;
    }
  }
  
  return fhirPath;
}; 