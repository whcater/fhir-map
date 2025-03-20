import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Position,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { DataDomain, LogicDto, ThirdPartyDto } from '../../types/metadata';
import { MappingVisualNode, MappingVisualEdge } from '../../types/mapping';

interface LogicModelGraphProps {
  dataDomains: DataDomain[];
  onNodeClick?: (node: MappingVisualNode) => void;
}

const LogicModelGraph: React.FC<LogicModelGraphProps> = ({ dataDomains, onNodeClick }) => {
  // 生成节点和边的数据
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let nodeId = 0;

    // 添加逻辑模型节点
    dataDomains.forEach((domain: DataDomain) => {
      domain.logicalDtos.forEach((dto: LogicDto) => {
        nodes.push({
          id: `logic-${dto.id}`,
          type: 'logic',
          position: { x: nodeId * 250, y: 0 },
          data: {
            label: dto.name,
            description: dto.description,
            fields: dto.meta.fields
          }
        });
        nodeId++;
      });

      // 添加第三方模型节点
      domain.thirdPartyDtos.forEach((dto: ThirdPartyDto) => {
        nodes.push({
          id: `third-party-${dto.id}`,
          type: 'thirdParty',
          position: { x: nodeId * 250, y: 200 },
          data: {
            label: dto.name,
            description: dto.description,
            fields: dto.meta.fields
          }
        });
        nodeId++;
      });

      // 添加边
      domain.logicalDtos.forEach((logicDto: LogicDto) => {
        logicDto.meta.fields.forEach((field: any) => {
          if (field.third_party_mapping) {
            edges.push({
              id: `edge-${logicDto.id}-${field.third_party_mapping.third_party_dto}`,
              source: `logic-${logicDto.id}`,
              target: `third-party-${field.third_party_mapping.third_party_dto}`,
              type: 'smoothstep',
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 20,
                height: 20,
                color: '#b1b1b7',
              },
              label: field.name
            });
          }
        });
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [dataDomains]);

  const [nodes, _, onNodesChange] = useNodesState(initialNodes);
  const [edges, __, onEdgesChange] = useEdgesState(initialEdges);

  // 节点点击处理
  const onNodeClickHandler = useCallback((_: React.MouseEvent, node: Node) => {
    if (onNodeClick) {
      onNodeClick({
        id: node.id,
        type: node.type as 'logic' | 'fhir' | 'thirdParty',
        data: node.data,
        position: node.position
      });
    }
  }, [onNodeClick]);

  // 自定义节点样式
  const nodeTypes = useMemo(() => ({
    logic: ({ data }: { data: any }) => (
      <div className="px-4 py-2 shadow-lg rounded-lg bg-white border-2 border-blue-500">
        <div className="font-bold text-blue-600">{data.label}</div>
        {data.description && (
          <div className="text-sm text-gray-500">{data.description}</div>
        )}
        <div className="mt-2 text-sm">
          {data.fields?.length} 个字段
        </div>
      </div>
    ),
    thirdParty: ({ data }: { data: any }) => (
      <div className="px-4 py-2 shadow-lg rounded-lg bg-white border-2 border-green-500">
        <div className="font-bold text-green-600">{data.label}</div>
        {data.description && (
          <div className="text-sm text-gray-500">{data.description}</div>
        )}
        <div className="mt-2 text-sm">
          {data.fields?.length} 个字段
        </div>
      </div>
    )
  }), []);

  return (
    <div className="w-full h-[600px] border rounded-lg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClickHandler}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default LogicModelGraph; 