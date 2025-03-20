import React, { useEffect, useRef, useMemo } from 'react';
import mermaid from 'mermaid';
import { DataDomain, LogicDto, ThirdPartyDto } from '../../types/metadata';

interface MermaidDiagramProps {
  dataDomains: DataDomain[];
  type?: 'er' | 'flowchart' | 'sequence';
}

// 初始化mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis'
  }
});

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ dataDomains, type = 'er' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 生成ER图
  const generateErDiagram = useMemo(() => {
    let diagram = 'erDiagram\n';
    
    // 添加逻辑模型实体
    dataDomains.forEach((domain: DataDomain) => {
      domain.logicalDtos.forEach((dto: LogicDto) => {
        diagram += `    ${dto.name} {\n`;
        dto.meta.fields.forEach((field: any) => {
          diagram += `        ${field.type} ${field.name}\n`;
        });
        diagram += '    }\n\n';
      });

      // 添加第三方模型实体
      domain.thirdPartyDtos.forEach((dto: ThirdPartyDto) => {
        diagram += `    ${dto.name} {\n`;
        dto.meta.fields.forEach((field: any) => {
          diagram += `        ${field.type} ${field.name}\n`;
        });
        diagram += '    }\n\n';
      });

      // 添加关系
      domain.logicalDtos.forEach((logicDto: LogicDto) => {
        logicDto.meta.fields.forEach((field: any) => {
          if (field.third_party_mapping) {
            diagram += `    ${logicDto.name} ||--o{ ${field.third_party_mapping.third_party_dto} : "maps to"\n`;
          }
        });
      });
    });

    return diagram;
  }, [dataDomains]);

  // 生成流程图
  const generateFlowchart = useMemo(() => {
    let diagram = 'graph TD\n';
    
    dataDomains.forEach((domain: DataDomain) => {
      domain.logicalDtos.forEach((dto: LogicDto) => {
        diagram += `    ${dto.name}[${dto.name}]\n`;
      });

      domain.thirdPartyDtos.forEach((dto: ThirdPartyDto) => {
        diagram += `    ${dto.name}[${dto.name}]\n`;
      });

      domain.logicalDtos.forEach((logicDto: LogicDto) => {
        logicDto.meta.fields.forEach((field: any) => {
          if (field.third_party_mapping) {
            diagram += `    ${logicDto.name} --> ${field.third_party_mapping.third_party_dto}\n`;
          }
        });
      });
    });

    return diagram;
  }, [dataDomains]);

  // 生成序列图
  const generateSequenceDiagram = useMemo(() => {
    let diagram = 'sequenceDiagram\n';
    
    dataDomains.forEach((domain: DataDomain) => {
      domain.logicalDtos.forEach((logicDto: LogicDto) => {
        diagram += `    participant ${logicDto.name}\n`;
      });

      domain.thirdPartyDtos.forEach((dto: ThirdPartyDto) => {
        diagram += `    participant ${dto.name}\n`;
      });

      domain.logicalDtos.forEach((logicDto: LogicDto) => {
        logicDto.meta.fields.forEach((field: any) => {
          if (field.third_party_mapping) {
            diagram += `    ${logicDto.name}->>${field.third_party_mapping.third_party_dto}: Map field ${field.name}\n`;
            diagram += `    ${field.third_party_mapping.third_party_dto}-->>${logicDto.name}: Return mapped value\n`;
          }
        });
      });
    });

    return diagram;
  }, [dataDomains]);

  const diagram = useMemo(() => {
    switch (type) {
      case 'er':
        return generateErDiagram;
      case 'flowchart':
        return generateFlowchart;
      case 'sequence':
        return generateSequenceDiagram;
      default:
        return generateErDiagram;
    }
  }, [type, generateErDiagram, generateFlowchart, generateSequenceDiagram]);

  useEffect(() => {
    if (containerRef.current) {
      // 清空容器内容
      containerRef.current.innerHTML = '';
      
      // 创建新的div元素
      const diagramElement = document.createElement('div');
      diagramElement.id = `mermaid-${Date.now()}`;
      diagramElement.className = 'mermaid';
      diagramElement.textContent = diagram;
      
      // 添加到容器
      containerRef.current.appendChild(diagramElement);
      
      // 渲染图表
      try {
        mermaid.contentLoaded();
      } catch (error) {
        console.error('Mermaid rendering failed:', error);
      }
    }
  }, [diagram]);

  return (
    <div className="w-full border rounded-lg p-4">
      <div ref={containerRef} />
    </div>
  );
};

export default MermaidDiagram; 