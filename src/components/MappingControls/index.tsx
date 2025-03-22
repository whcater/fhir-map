import React from 'react';
import { MappingConfiguration } from '../../types';

interface MappingControlsProps {
  activeMapping: MappingConfiguration | null;
  onSaveMapping: () => void;
}

const MappingControls: React.FC<MappingControlsProps> = ({ 
  activeMapping, 
  onSaveMapping 
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
      <div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          已映射 <span className="font-medium text-blue-500">{activeMapping?.fieldMappings.length || 0}</span> 个字段
        </span>
      </div>
      
      <div>
        <button
          onClick={onSaveMapping}
          disabled={!activeMapping}
          className={`px-4 py-2 rounded-md ${!activeMapping ? 'bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'} focus:outline-none focus:ring-2 focus:ring-green-500`}
        >
          <i className="fas fa-save mr-1"></i>
          保存映射
        </button>
      </div>
    </div>
  );
};

export default MappingControls; 