import React, { useEffect, useState } from 'react';
import ReactFlow, { 
  Node, 
  Edge, 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { MappingConfig, LogicModelMetadata } from '../../types/models';

interface MappingVisualizerProps {
  mappingConfig: MappingConfig;
  sourceModel: LogicModelMetadata;
  targetModel: LogicModelMetadata;
}

// 自定义节点类型
const nodeTypes = {}; // 可以根据需求实现自定义节点组件

const MappingVisualizer: React.FC<MappingVisualizerProps> = ({
  mappingConfig,
  sourceModel,
  targetModel
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (mappingConfig && sourceModel && targetModel) {
      generateGraph();
    }
  }, [mappingConfig, sourceModel, targetModel]);

  const generateGraph = () => {
    setIsLoading(true);
    
    try {
      // 创建源模型和目标模型的节点
      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];
      
      // 添加源模型节点
      sourceModel.fields.forEach((field: any, index: number) => {
        newNodes.push({
          id: `source-${field.id}`,
          type: 'default',
          data: { 
            label: (
              <div className="text-left">
                <div className="font-medium">{field.name}</div>
                <div className="text-xs text-gray-500">{field.path}</div>
                <div className="text-xs">{field.dataType}</div>
              </div>
            ),
            field 
          },
          position: { x: 0, y: index * 100 },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          style: {
            background: '#f9d5e5',
            border: '1px solid #333',
            borderRadius: '5px',
            padding: '10px',
            width: 200,
          }
        });
      });
      
      // 添加目标模型节点
      targetModel.fields.forEach((field: any, index: number) => {
        newNodes.push({
          id: `target-${field.id}`,
          type: 'default',
          data: { 
            label: (
              <div className="text-left">
                <div className="font-medium">{field.name}</div>
                <div className="text-xs text-gray-500">{field.path}</div>
                <div className="text-xs">{field.dataType}</div>
              </div>
            ),
            field 
          },
          position: { x: 500, y: index * 100 },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          style: {
            background: '#e5f9d5',
            border: '1px solid #333',
            borderRadius: '5px',
            padding: '10px',
            width: 200,
          }
        });
      });
      
      // 添加映射关系边
      mappingConfig.mappings.forEach((mapping: any, index: number) => {
        const sourceNodeId = `source-${mapping.sourceFieldId}`;
        const targetNodeId = `target-${mapping.targetFieldId}`;
        
        // 如果有转换操作，添加转换节点
        if (mapping.transformations && mapping.transformations.length > 0) {
          const transformNodeId = `transform-${index}`;
          
          // 添加转换节点
          newNodes.push({
            id: transformNodeId,
            type: 'default',
            data: { 
              label: (
                <div className="text-xs p-1">
                  {mapping.transformations.map((t: any) => t.type).join(', ')}
                </div>
              ),
              transformations: mapping.transformations 
            },
            position: { x: 250, y: index * 100 + 20 },
            style: {
              background: '#d5e8f9',
              border: '1px solid #333',
              borderRadius: '50%',
              width: 80,
              height: 40,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }
          });
          
          // 从源字段到转换节点的边
          newEdges.push({
            id: `edge-${sourceNodeId}-${transformNodeId}`,
            source: sourceNodeId,
            target: transformNodeId,
            animated: true,
            style: { stroke: '#6366f1' }
          });
          
          // 从转换节点到目标字段的边
          newEdges.push({
            id: `edge-${transformNodeId}-${targetNodeId}`,
            source: transformNodeId,
            target: targetNodeId,
            animated: true,
            style: { stroke: '#6366f1' }
          });
        } else {
          // 直接从源字段到目标字段的边
          newEdges.push({
            id: `edge-${sourceNodeId}-${targetNodeId}`,
            source: sourceNodeId,
            target: targetNodeId,
            animated: true,
            style: { stroke: '#6366f1' }
          });
        }
      });
      
      setNodes(newNodes);
      setEdges(newEdges);
    } catch (error) {
      console.error('生成图形时出错:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card h-[800px]">
      <h2 className="text-2xl font-semibold mb-6">映射可视化</h2>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-full">
          <div className="text-lg text-gray-600 dark:text-gray-400">
            <i className="fas fa-spinner fa-spin mr-2"></i> 正在生成映射图...
          </div>
        </div>
      ) : (
        <div className="h-[700px] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
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
          </ReactFlow>
        </div>
      )}
    </div>
  );
};

export default MappingVisualizer; 