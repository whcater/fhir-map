import { 
  DataDomain, 
  LogicDto, 
  ThirdPartyDto,
  LogicDtoField,
  ThirdPartyDtoField
} from '../types/metadata';
import { 
  MappingVisualNode, 
  MappingVisualEdge,
  LogicToFhirMapping,
  ThirdPartyToLogicMapping,
  FhirToLogicMapping,
  LogicToThirdPartyMapping,
  MappingConfig
} from '../types/mapping';
import { Position } from 'reactflow';
import dagre from 'dagre';
import { DataDomainRelation } from '../services/domainRelationService';

// 布局配置
const NODE_WIDTH = 200;
const NODE_HEIGHT = 40;
const NODE_MARGIN_X = 200;
const NODE_MARGIN_Y = 100;

export interface VisualNode {
  id: string;
  type: 'domain' | 'logic' | 'fhir' | 'thirdParty';
  data: any;
  position: { x: number; y: number };
  style: Record<string, any>;
}

export interface VisualEdge {
  id: string;
  source: string;
  target: string;
  type: 'mapping' | 'relation';
  data: {
    mappingConfig?: MappingConfig;
    relationType?: string;
  };
  style: Record<string, any>;
}

export interface VisualGraph {
  nodes: VisualNode[];
  edges: VisualEdge[];
}

export class VisualizationUtils {
  // 生成逻辑模型图
  static generateLogicModelGraph(
    domains: DataDomain[],
    relations: DataDomainRelation[]
  ): VisualGraph {
    const nodes: VisualNode[] = [];
    const edges: VisualEdge[] = [];
    let xOffset = 0;
    const yOffset = 100;

    // 添加数据域节点
    domains.forEach(domain => {
      nodes.push({
        id: `domain-${domain.id}`,
        type: 'domain',
        data: domain,
        position: { x: xOffset, y: 0 },
        style: {
          backgroundColor: '#e6f3ff',
          borderColor: '#1890ff',
          borderWidth: 2
        }
      });

      // 添加逻辑模型节点
      domain.logicalDtos.forEach((dto: LogicDto, index: number) => {
        nodes.push({
          id: `logic-${dto.id}`,
          type: 'logic',
          data: dto,
          position: { x: xOffset, y: yOffset + index * 100 },
          style: {
            backgroundColor: '#f6ffed',
            borderColor: '#52c41a',
            borderWidth: 2
          }
        });

        // 添加数据域到逻辑模型的边
        edges.push({
          id: `edge-domain-logic-${dto.id}`,
          source: `domain-${domain.id}`,
          target: `logic-${dto.id}`,
          type: 'relation',
          data: { relationType: 'contains' },
          style: {
            stroke: '#1890ff',
            strokeWidth: 2
          }
        });
      });

      // 添加第三方模型节点
      domain.thirdPartyDtos.forEach((dto: ThirdPartyDto, index: number) => {
        nodes.push({
          id: `third-party-${dto.id}`,
          type: 'thirdParty',
          data: dto,
          position: { x: xOffset, y: yOffset * 2 + index * 100 },
          style: {
            backgroundColor: '#fff7e6',
            borderColor: '#fa8c16',
            borderWidth: 2
          }
        });

        // 添加数据域到第三方模型的边
        edges.push({
          id: `edge-domain-third-party-${dto.id}`,
          source: `domain-${domain.id}`,
          target: `third-party-${dto.id}`,
          type: 'relation',
          data: { relationType: 'contains' },
          style: {
            stroke: '#1890ff',
            strokeWidth: 2
          }
        });
      });

      xOffset += 300;
    });

    // 添加数据域关系边
    relations.forEach(relation => {
      edges.push({
        id: `edge-relation-${relation.id}`,
        source: `domain-${relation.sourceDomainId}`,
        target: `domain-${relation.targetDomainId}`,
        type: 'relation',
        data: { relationType: relation.relationType },
        style: {
          stroke: this.getRelationColor(relation.relationType),
          strokeWidth: 2,
          strokeDasharray: relation.relationType === 'references' ? '5,5' : undefined
        }
      });
    });

    return { nodes, edges };
  }

  // 获取关系类型的颜色
  private static getRelationColor(relationType: string): string {
    switch (relationType) {
      case 'extends':
        return '#722ed1';
      case 'composes':
        return '#13c2c2';
      case 'references':
        return '#faad14';
      default:
        return '#1890ff';
    }
  }

  // 计算节点布局
  static calculateLayout(graph: VisualGraph): VisualGraph {
    const { nodes, edges } = graph;
    const layoutedNodes = [...nodes];
    
    // 实现力导向布局算法
    const iterations = 100;
    const k = 100; // 弹簧系数
    const repulsion = 1000; // 斥力系数

    for (let i = 0; i < iterations; i++) {
      // 计算节点间的斥力
      for (let j = 0; j < nodes.length; j++) {
        for (let k = j + 1; k < nodes.length; k++) {
          const dx = nodes[j].position.x - nodes[k].position.x;
          const dy = nodes[j].position.y - nodes[k].position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            const force = repulsion / (distance * distance);
            const fx = force * dx / distance;
            const fy = force * dy / distance;
            
            layoutedNodes[j].position.x += fx;
            layoutedNodes[j].position.y += fy;
            layoutedNodes[k].position.x -= fx;
            layoutedNodes[k].position.y -= fy;
          }
        }
      }

      // 计算边的弹簧力
      edges.forEach(edge => {
        const sourceNode = layoutedNodes.find(n => n.id === edge.source);
        const targetNode = layoutedNodes.find(n => n.id === edge.target);
        
        if (sourceNode && targetNode) {
          const dx = targetNode.position.x - sourceNode.position.x;
          const dy = targetNode.position.y - sourceNode.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            const force = (distance - k) / distance;
            const fx = force * dx;
            const fy = force * dy;
            
            sourceNode.position.x += fx;
            sourceNode.position.y += fy;
            targetNode.position.x -= fx;
            targetNode.position.y -= fy;
          }
        }
      });
    }

    return {
      nodes: layoutedNodes,
      edges
    };
  }

  // 生成Mermaid图
  static generateMermaidGraph(graph: VisualGraph): string {
    let mermaid = 'graph TD;\n';
    
    // 添加节点
    graph.nodes.forEach(node => {
      const shape = this.getMermaidShape(node.type);
      mermaid += `${node.id}${shape}${node.data.name}\n`;
    });
    
    // 添加边
    graph.edges.forEach(edge => {
      const style = this.getMermaidEdgeStyle(edge.type, edge.data.relationType);
      mermaid += `${edge.source} ${style} ${edge.target}\n`;
    });
    
    return mermaid;
  }

  private static getMermaidShape(type: string): string {
    switch (type) {
      case 'domain':
        return '((';
      case 'logic':
        return '[';
      case 'thirdParty':
        return '{';
      default:
        return '(';
    }
  }

  private static getMermaidEdgeStyle(type: string, relationType?: string): string {
    switch (relationType) {
      case 'extends':
        return '--|extends|-->';
      case 'composes':
        return '--|composes|-->';
      case 'references':
        return '--|references|-->';
      default:
        return '-->';
    }
  }
}

/**
 * 创建逻辑模型视觉节点
 */
export const createLogicDtoNode = (
  logicDto: LogicDto, 
  x: number, 
  y: number
): MappingVisualNode => {
  return {
    id: `logic-${logicDto.id}`,
    type: 'logic',
    data: {
      label: logicDto.name,
      description: logicDto.description,
      fields: logicDto.meta.fields
    },
    position: { x, y }
  };
};

/**
 * 创建FHIR资源视觉节点
 */
export const createFhirResourceNode = (
  resourceType: string, 
  x: number, 
  y: number,
  description?: string
): MappingVisualNode => {
  return {
    id: `fhir-${resourceType}`,
    type: 'fhir',
    data: {
      label: resourceType,
      description: description || `FHIR ${resourceType} Resource`
    },
    position: { x, y }
  };
};

/**
 * 创建第三方数据模型视觉节点
 */
export const createThirdPartyDtoNode = (
  thirdPartyDto: ThirdPartyDto, 
  x: number, 
  y: number
): MappingVisualNode => {
  return {
    id: `thirdParty-${thirdPartyDto.name}`,
    type: 'thirdParty',
    data: {
      label: thirdPartyDto.name,
      description: thirdPartyDto.description,
      fields: thirdPartyDto.meta.fields
    },
    position: { x, y }
  };
};

/**
 * 创建映射边
 */
export const createMappingEdge = (
  sourceId: string,
  targetId: string,
  label?: string
): MappingVisualEdge => {
  return {
    id: `edge-${sourceId}-${targetId}`,
    source: sourceId,
    target: targetId,
    label: label || 'maps to'
  };
};

/**
 * 从LogicDto到FHIR资源的映射创建视觉图表元素
 */
export const createLogicToFhirVisual = (
  logicDto: LogicDto,
  resourceType: string,
  fieldMappings: LogicToFhirMapping[]
): { nodes: MappingVisualNode[], edges: MappingVisualEdge[] } => {
  const nodes: MappingVisualNode[] = [];
  const edges: MappingVisualEdge[] = [];
  
  // 创建逻辑模型节点
  const logicNode = createLogicDtoNode(logicDto, 100, 100);
  nodes.push(logicNode);
  
  // 创建FHIR资源节点
  const fhirNode = createFhirResourceNode(resourceType, 500, 100);
  nodes.push(fhirNode);
  
  // 创建映射边
  const edge = createMappingEdge(logicNode.id, fhirNode.id, 'maps to FHIR');
  edges.push(edge);
  
  // 返回节点和边
  return { nodes, edges };
};

/**
 * 从数据域创建所有映射的视觉图表元素
 */
export const createFullDomainVisual = (
  dataDomain: DataDomain,
  logicToFhirMappings: LogicToFhirMapping[],
  thirdPartyToLogicMappings: ThirdPartyToLogicMapping[]
): { nodes: MappingVisualNode[], edges: MappingVisualEdge[] } => {
  const nodes: MappingVisualNode[] = [];
  const edges: MappingVisualEdge[] = [];
  
  // 跟踪已创建的资源节点
  const createdResourceTypes = new Set<string>();
  const logicDtoMap = new Map<string, LogicDto>();
  const thirdPartyDtoMap = new Map<string, ThirdPartyDto>();
  
  // 索引所有DTO以便快速查找
  dataDomain.logicalDtos.forEach(dto => {
    logicDtoMap.set(dto.id, dto);
  });
  
  dataDomain.thirdPartyDtos.forEach(dto => {
    thirdPartyDtoMap.set(dto.id || dto.name, dto);
  });
  
  // 处理逻辑模型到FHIR资源的映射
  logicToFhirMappings.forEach((mapping, index) => {
    const logicDto = logicDtoMap.get(mapping.logicDtoId);
    if (!logicDto) return;
    
    // 创建逻辑模型节点（如果尚未创建）
    let logicNodeId = `logic-${logicDto.id}`;
    if (!nodes.find(node => node.id === logicNodeId)) {
      const logicNode = createLogicDtoNode(
        logicDto, 
        100, 
        100 + index * NODE_MARGIN_Y
      );
      nodes.push(logicNode);
    }
    
    // 创建FHIR资源节点（如果尚未创建）
    let fhirNodeId = `fhir-${mapping.fhirResourceType}`;
    if (!createdResourceTypes.has(mapping.fhirResourceType)) {
      const fhirNode = createFhirResourceNode(
        mapping.fhirResourceType, 
        500, 
        100 + index * NODE_MARGIN_Y
      );
      nodes.push(fhirNode);
      createdResourceTypes.add(mapping.fhirResourceType);
    }
    
    // 创建映射边
    const edge = createMappingEdge(
      logicNodeId, 
      fhirNodeId, 
      'maps to FHIR'
    );
    edges.push(edge);
  });
  
  // 处理第三方数据到逻辑模型的映射
  thirdPartyToLogicMappings.forEach((mapping, index) => {
    const thirdPartyDto = thirdPartyDtoMap.get(mapping.thirdPartyDtoId);
    const logicDto = logicDtoMap.get(mapping.logicDtoId);
    if (!thirdPartyDto || !logicDto) return;
    
    // 创建第三方数据节点（如果尚未创建）
    let thirdPartyNodeId = `thirdParty-${thirdPartyDto.name}`;
    if (!nodes.find(node => node.id === thirdPartyNodeId)) {
      const thirdPartyNode = createThirdPartyDtoNode(
        thirdPartyDto, 
        -300, 
        100 + index * NODE_MARGIN_Y
      );
      nodes.push(thirdPartyNode);
    }
    
    // 创建逻辑模型节点（如果尚未创建）
    let logicNodeId = `logic-${logicDto.id}`;
    if (!nodes.find(node => node.id === logicNodeId)) {
      const logicNode = createLogicDtoNode(
        logicDto, 
        100, 
        100 + index * NODE_MARGIN_Y
      );
      nodes.push(logicNode);
    }
    
    // 创建映射边
    const edge = createMappingEdge(
      thirdPartyNodeId, 
      logicNodeId, 
      'maps to Logic'
    );
    edges.push(edge);
  });
  
  // 使用dagre进行自动布局
  return getLayoutedElements(nodes, edges);
};

/**
 * 使用dagre自动布局节点和边
 */
export const getLayoutedElements = (
  nodes: MappingVisualNode[], 
  edges: MappingVisualEdge[]
) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'LR' });

  // 添加节点
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  // 添加边
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // 执行布局
  dagre.layout(dagreGraph);

  // 更新节点位置
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

/**
 * 生成Mermaid图表代码
 */
export const generateMermaidDiagram = (
  dataDomain: DataDomain,
  logicToFhirMappings: LogicToFhirMapping[],
  thirdPartyToLogicMappings: ThirdPartyToLogicMapping[]
): string => {
  let mermaidCode = 'graph LR\n';
  
  // 创建数据域分组
  mermaidCode += `  subgraph ${dataDomain.name}\n`;
  
  // 添加逻辑模型节点
  dataDomain.logicalDtos.forEach(dto => {
    mermaidCode += `    L${dto.id}["${dto.name}"]\n`;
  });
  
  mermaidCode += '  end\n\n';
  
  // 创建第三方数据分组
  mermaidCode += '  subgraph 第三方数据\n';
  dataDomain.thirdPartyDtos.forEach(dto => {
    mermaidCode += `    T${dto.id || dto.name}["${dto.name}"]\n`;
  });
  mermaidCode += '  end\n\n';
  
  // 创建FHIR资源分组
  mermaidCode += '  subgraph FHIR资源\n';
  // 收集所有FHIR资源类型
  const fhirResourceTypes = new Set<string>();
  logicToFhirMappings.forEach(mapping => {
    fhirResourceTypes.add(mapping.fhirResourceType);
  });
  
  // 添加FHIR资源节点
  Array.from(fhirResourceTypes).forEach(type => {
    mermaidCode += `    F${type}["${type}"]\n`;
  });
  mermaidCode += '  end\n\n';
  
  // 添加映射关系
  logicToFhirMappings.forEach(mapping => {
    mermaidCode += `  L${mapping.logicDtoId} --> F${mapping.fhirResourceType}\n`;
  });
  
  thirdPartyToLogicMappings.forEach(mapping => {
    mermaidCode += `  T${mapping.thirdPartyDtoId} --> L${mapping.logicDtoId}\n`;
  });
  
  return mermaidCode;
}; 