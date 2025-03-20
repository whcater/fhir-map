import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { DataDomain } from '../../types/metadata';
import { LogicToFhirMapping, ThirdPartyToLogicMapping } from '../../types/mapping';
import { generateMermaidDiagram } from '../../utils/visualizationUtils';

interface MermaidDiagramProps {
  dataDomain: DataDomain;
  logicToFhirMappings: LogicToFhirMapping[];
  thirdPartyToLogicMappings: ThirdPartyToLogicMapping[];
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({
  dataDomain,
  logicToFhirMappings,
  thirdPartyToLogicMappings
}) => {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const mermaidCode = generateMermaidDiagram(
    dataDomain,
    logicToFhirMappings,
    thirdPartyToLogicMappings
  );

  useEffect(() => {
    if (mermaidRef.current) {
      mermaid.initialize({
        startOnLoad: true,
        theme: 'default',
        securityLevel: 'loose',
        flowchart: {
          htmlLabels: true,
          curve: 'basis'
        }
      });
      
      try {
        // 清除之前的内容
        mermaidRef.current.innerHTML = '';
        
        // 使用随机ID以避免重复
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const div = document.createElement('div');
        div.id = id;
        div.className = 'mermaid';
        div.textContent = mermaidCode;
        mermaidRef.current.appendChild(div);
        
        // 渲染图表
        mermaid.contentLoaded();
      } catch (error) {
        console.error('Mermaid 渲染错误:', error);
      }
    }
  }, [mermaidCode]);

  return (
    <div className="mb-4">
      <div className="border rounded-lg p-4 bg-white overflow-auto" style={{ minHeight: '400px' }}>
        <div ref={mermaidRef}></div>
      </div>
      <div className="mt-4">
        <h3 className="text-lg font-medium mb-2">Mermaid图表代码</h3>
        <div className="bg-gray-800 text-white p-4 rounded-lg overflow-auto">
          <pre className="text-sm">{mermaidCode}</pre>
        </div>
      </div>
    </div>
  );
};

export default MermaidDiagram; 