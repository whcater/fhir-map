import React, { useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card } from 'antd';
import type { MappingConfig, Field } from '../../../types/logicModel';

interface VisualMapperProps {
  mappingConfig: MappingConfig;
  sourceFields: Field[];
  targetFields: Field[];
}

const VisualMapper: React.FC<VisualMapperProps> = ({
  mappingConfig,
  sourceFields,
  targetFields,
}) => {
  const initialNodes: Node[] = [
    ...sourceFields.map((field, index) => ({
      id: `source-${field.name}`,
      data: { label: `${field.name}\n(${field.description})` },
      position: { x: 0, y: index * 60 },
      type: 'input',
    })),
    ...targetFields.map((field, index) => ({
      id: `target-${field.name}`,
      data: { label: `${field.name}\n(${field.description})` },
      position: { x: 400, y: index * 60 },
      type: 'output',
    })),
  ];

  const initialEdges: Edge[] = mappingConfig.mappings.map((mapping, index) => ({
    id: `edge-${index}`,
    source: `source-${mapping.sourceField}`,
    target: `target-${mapping.targetField}`,
    label: mapping.transformation || '',
    type: 'smoothstep',
    animated: true,
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback((params: any) => {
    setEdges((eds) => addEdge(params, eds));
  }, [setEdges]);

  return (
    <Card title="映射可视化" style={{ height: '600px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </Card>
  );
};

export default VisualMapper; 