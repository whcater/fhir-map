import React, { useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  Panel,
  useNodesState,
  useEdgesState,
  NodeTypes,
  EdgeTypes
} from 'reactflow';
import 'reactflow/dist/style.css';

import { DataDomain } from '../../types/metadata';
import { LogicToFhirMapping, ThirdPartyToLogicMapping } from '../../types/mapping';
import { createFullDomainVisual } from '../../utils/visualizationUtils';

// 自定义节点组件
const LogicNode: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md border-2 border-blue-500 bg-white">
      <div className="font-bold text-lg text-blue-800">{data.label}</div>
      {data.description && <div className="text-xs text-gray-500">{data.description}</div>}
    </div>
  );
};

const FhirNode: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md border-2 border-green-500 bg-white">
      <div className="font-bold text-lg text-green-800">{data.label}</div>
      {data.description && <div className="text-xs text-gray-500">{data.description}</div>}
    </div>
  );
};

const ThirdPartyNode: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md border-2 border-purple-500 bg-white">
      <div className="font-bold text-lg text-purple-800">{data.label}</div>
      {data.description && <div className="text-xs text-gray-500">{data.description}</div>}
    </div>
  );
};

// 定义节点类型
const nodeTypes = {
  logic: LogicNode,
  fhir: FhirNode,
  thirdParty: ThirdPartyNode
};

interface LogicModelGraphProps {
  dataDomain: DataDomain;
  logicToFhirMappings: LogicToFhirMapping[];
  thirdPartyToLogicMappings: ThirdPartyToLogicMapping[];
}

const LogicModelGraph: React.FC<LogicModelGraphProps> = ({ 
  dataDomain, 
  logicToFhirMappings, 
  thirdPartyToLogicMappings 
}) => {
  // 从映射数据生成节点和边
  const { nodes: initialNodes, edges: initialEdges } = createFullDomainVisual(
    dataDomain,
    logicToFhirMappings,
    thirdPartyToLogicMappings
  );
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  const onLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = createFullDomainVisual(
      dataDomain,
      logicToFhirMappings,
      thirdPartyToLogicMappings
    );
    
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
  }, [dataDomain, logicToFhirMappings, thirdPartyToLogicMappings, setNodes, setEdges]);
  
  return (
    <div className="h-[600px] w-full border border-gray-300 rounded-lg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
        <Panel position="top-right">
          <button 
            onClick={onLayout}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700 transition-colors"
          >
            重新布局
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default LogicModelGraph; 