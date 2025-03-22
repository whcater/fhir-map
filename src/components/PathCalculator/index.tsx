import React from 'react';

interface PathCalculatorProps {
  selectedPath: string;
  setSelectedPath: (path: string) => void;
  pathInputRef: React.RefObject<HTMLInputElement>;
  initializePathBuilderWithPath: (path: string) => void;
  setShowFhirPathBuilder: (show: boolean) => void;
  handleGetPathFromCursor: () => void;
  hoveredPath?: string;
  onApplyHoveredPath?: () => void;
}

const PathCalculator: React.FC<PathCalculatorProps> = ({
  selectedPath,
  setSelectedPath,
  pathInputRef,
  initializePathBuilderWithPath,
  setShowFhirPathBuilder,
  handleGetPathFromCursor,
  hoveredPath,
  onApplyHoveredPath
}) => {
  return (
    <div>
      <div className="mb-4 flex items-center space-x-2">
        <input
          ref={pathInputRef}
          type="text"
          placeholder="FHIR Path"
          value={selectedPath}
          onChange={(e) => setSelectedPath(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <button
          onClick={() => {
            if (selectedPath) {
              initializePathBuilderWithPath(selectedPath);
            }
            setShowFhirPathBuilder(true);
          }}
          className="px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
          title="打开高级FHIR Path构建器"
        >
          <i className="fas fa-tools mr-1"></i>
          高级
        </button>
        
        <button
          onClick={handleGetPathFromCursor}
          className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <i className="fas fa-magic mr-1"></i>
          从编辑器获取
        </button>
      </div>
      
      {hoveredPath && (
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              当前悬停路径: 
              <span className="ml-2 font-medium text-blue-500">{hoveredPath}</span>
            </div>
            <button
              onClick={onApplyHoveredPath}
              className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800 text-sm"
            >
              <i className="fas fa-arrow-up mr-1"></i>
              应用此路径
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PathCalculator; 