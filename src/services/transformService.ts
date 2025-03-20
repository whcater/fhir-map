import { MappingConfig } from '../types/logicModel';
import { evaluate } from 'mathjs';
import * as _ from 'lodash';

export class TransformService {
  async transform(source: any, mappingConfig: MappingConfig): Promise<any> {
    const result: any = {};

    // 如果源数据是XML格式，先转换为JSON
    let sourceData = source;
    if (typeof source === 'string' && source.trim().startsWith('<?xml')) {
      sourceData = this.xmlToJson(source);
    }

    for (const mapping of mappingConfig.mappings) {
      try {
        const sourceValue = _.get(sourceData, mapping.sourceField);
        let targetValue = sourceValue;

        // 应用转换表达式
        if (mapping.transformation) {
          targetValue = this.applyTransformation(sourceValue, mapping.transformation);
        }

        // 设置目标值
        _.set(result, mapping.targetField, targetValue);
      } catch (error) {
        console.error(`转换字段 ${mapping.sourceField} 时出错:`, error);
      }
    }

    return result;
  }

  private xmlToJson(xmlString: string): any {
    try {
      // 使用浏览器原生的 DOMParser 代替 xml2js
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "text/xml");
      
      // 简单的递归函数将 XML 转换为 JSON 对象
      const convertXmlToJson = (node: Element): any => {
        const obj: any = {};
        
        // 处理属性
        Array.from(node.attributes).forEach(attr => {
          obj[`@${attr.name}`] = attr.value;
        });
        
        // 处理子元素
        Array.from(node.children).forEach(child => {
          const childName = child.nodeName;
          const childJson = convertXmlToJson(child);
          
          if (obj[childName]) {
            // 如果已经存在同名子元素，则转为数组
            if (!Array.isArray(obj[childName])) {
              obj[childName] = [obj[childName]];
            }
            obj[childName].push(childJson);
          } else {
            obj[childName] = childJson;
          }
        });
        
        // 如果节点只有文本内容，且没有属性和子节点
        if (Object.keys(obj).length === 0 && node.textContent) {
          return node.textContent.trim();
        }
        
        // 如果节点有文本内容，且有属性或子节点
        if (node.textContent && node.textContent.trim() && Object.keys(obj).length > 0) {
          obj['#text'] = node.textContent.trim();
        }
        
        return obj;
      };
      
      // 获取根元素并转换
      const rootElement = xmlDoc.documentElement;
      const result: any = {};
      result[rootElement.nodeName] = convertXmlToJson(rootElement);
      
      return result;
    } catch (error) {
      console.error('XML 解析错误:', error);
      return {};
    }
  }

  private applyTransformation(value: any, transformation: string): any {
    // 支持基本的数学运算
    if (transformation.includes('${value}')) {
      const expr = transformation.replace(/\${value}/g, value.toString());
      try {
        return evaluate(expr);
      } catch {
        return value;
      }
    }

    // 支持日期格式转换
    if (transformation.startsWith('date.')) {
      const format = transformation.split('.')[1];
      try {
        const date = new Date(value);
        // 这里可以添加更多日期格式化逻辑
        return date.toISOString();
      } catch {
        return value;
      }
    }

    // 支持字符串操作
    if (transformation.startsWith('string.')) {
      const op = transformation.split('.')[1];
      switch (op) {
        case 'uppercase':
          return String(value).toUpperCase();
        case 'lowercase':
          return String(value).toLowerCase();
        case 'trim':
          return String(value).trim();
        default:
          return value;
      }
    }

    return value;
  }

  // FHIR特定的转换方法
  async transformToFHIR(logicDto: any, mappingConfig: MappingConfig): Promise<any> {
    const fhirResource = await this.transform(logicDto, mappingConfig);
    
    // 添加FHIR资源必需的属性
    fhirResource.resourceType = mappingConfig.targetType;
    if (!fhirResource.id) {
      fhirResource.id = this.generateUUID();
    }
    
    return fhirResource;
  }

  async transformFromFHIR(fhirResource: any, mappingConfig: MappingConfig): Promise<any> {
    return this.transform(fhirResource, mappingConfig);
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
} 