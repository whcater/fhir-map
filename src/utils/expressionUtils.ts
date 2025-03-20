/**
 * 安全地执行表达式
 * @param expression 表达式字符串
 * @param context 上下文对象
 * @returns 表达式执行结果
 */
export function evaluateExpression(expression: string, context: any): any {
  try {
    // 创建一个安全的函数上下文
    const contextKeys = Object.keys(context);
    const contextValues = Object.values(context);
    
    // 构建函数体
    const functionBody = `
      'use strict';
      const { ${contextKeys.join(', ')} } = arguments[0];
      return ${expression};
    `;

    // 创建并执行函数
    const fn = new Function(functionBody);
    return fn(context);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`表达式执行失败: ${error.message}`);
    }
    throw error;
  }
}

/**
 * 使用处理器链来转换数据
 * @param data 要转换的数据
 * @param processors 处理器数组，每个处理器是一个函数
 * @returns 转换后的数据
 */
export function processWithPipeline<T>(data: T, processors: Array<(data: T) => T>): T {
  return processors.reduce((result, processor) => processor(result), data);
}

/**
 * 执行命名函数
 * @param funcName 函数名称
 * @param args 函数参数
 * @returns 函数执行结果
 */
export function executeFunction(funcName: string, ...args: any[]): any {
  // 定义可用的函数库
  const functions: Record<string, (...args: any[]) => any> = {
    // 字符串处理
    toUpper: (str: string) => str.toUpperCase(),
    toLower: (str: string) => str.toLowerCase(),
    trim: (str: string) => str.trim(),
    substring: (str: string, start: number, end?: number) => str.substring(start, end),
    replace: (str: string, search: string | RegExp, replacement: string) => str.replace(search, replacement),
    
    // 数字处理
    toNumber: (val: any) => Number(val),
    round: (num: number, precision: number = 0) => {
      const factor = Math.pow(10, precision);
      return Math.round(num * factor) / factor;
    },
    floor: (num: number) => Math.floor(num),
    ceil: (num: number) => Math.ceil(num),
    
    // 日期处理
    formatDate: (date: Date | string, format: string = 'YYYY-MM-DD') => {
      // 简单的日期格式化，实际应用中可能需要更复杂的逻辑
      const d = typeof date === 'string' ? new Date(date) : date;
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      
      return format
        .replace('YYYY', year.toString())
        .replace('MM', month)
        .replace('DD', day);
    },
    
    // 类型转换
    toString: (val: any) => String(val),
    toBoolean: (val: any) => Boolean(val),
    
    // 条件处理
    ifThen: (condition: boolean, thenValue: any, elseValue: any) => condition ? thenValue : elseValue,
    
    // 数组处理
    arrayJoin: (arr: any[], separator: string = ',') => arr.join(separator),
    arrayMap: (arr: any[], mapFunc: (item: any) => any) => arr.map(mapFunc),
    arrayFilter: (arr: any[], filterFunc: (item: any) => boolean) => arr.filter(filterFunc)
  };
  
  // 检查函数是否存在
  if (typeof functions[funcName] !== 'function') {
    throw new Error(`未找到函数: ${funcName}`);
  }
  
  // 执行函数
  return functions[funcName](...args);
} 