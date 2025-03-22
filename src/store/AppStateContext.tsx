import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AppState, MappingConfiguration } from '../types';

// 从app.json加载初始状态
const initialState: AppState = {
  metadata: {
    version: '1.0.0',
    appName: 'FHIR映射逻辑模型设计器'
  },
  domains: [
    {
      id: 'patient',
      name: '患者信息',
      description: '患者基本信息领域'
    },
    {
      id: 'medication',
      name: '用药信息',
      description: '患者用药信息领域'
    },
    {
      id: 'diagnosis',
      name: '诊断信息',
      description: '患者诊断信息领域'
    }
  ],
  logicDtoModels: [],
  thirdPartyModels: [],
  mappingConfigurations: []
};

// 定义操作类型
type Action =
  | { type: 'ADD_LOGIC_MODEL'; payload: any }
  | { type: 'UPDATE_LOGIC_MODEL'; payload: { id: string; updates: any } }
  | { type: 'DELETE_LOGIC_MODEL'; payload: string }
  | { type: 'ADD_THIRD_PARTY_MODEL'; payload: any }
  | { type: 'UPDATE_THIRD_PARTY_MODEL'; payload: { id: string; updates: any } }
  | { type: 'DELETE_THIRD_PARTY_MODEL'; payload: string }
  | { type: 'ADD_MAPPING_CONFIGURATION'; payload: MappingConfiguration }
  | { type: 'UPDATE_MAPPING_CONFIGURATION'; payload: { id: string; updates: MappingConfiguration } }
  | { type: 'DELETE_MAPPING_CONFIGURATION'; payload: string };

// 创建状态处理器
const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'ADD_LOGIC_MODEL':
      return {
        ...state,
        logicDtoModels: [...state.logicDtoModels, action.payload]
      };
    
    case 'UPDATE_LOGIC_MODEL':
      return {
        ...state,
        logicDtoModels: state.logicDtoModels.map(model => 
          model.id === action.payload.id ? { ...model, ...action.payload.updates } : model
        )
      };
    
    case 'DELETE_LOGIC_MODEL':
      return {
        ...state,
        logicDtoModels: state.logicDtoModels.filter(model => model.id !== action.payload)
      };
    
    case 'ADD_THIRD_PARTY_MODEL':
      return {
        ...state,
        thirdPartyModels: [...state.thirdPartyModels, action.payload]
      };
    
    case 'UPDATE_THIRD_PARTY_MODEL':
      return {
        ...state,
        thirdPartyModels: state.thirdPartyModels.map(model => 
          model.id === action.payload.id ? { ...model, ...action.payload.updates } : model
        )
      };
    
    case 'DELETE_THIRD_PARTY_MODEL':
      return {
        ...state,
        thirdPartyModels: state.thirdPartyModels.filter(model => model.id !== action.payload)
      };
    
    case 'ADD_MAPPING_CONFIGURATION':
      return {
        ...state,
        mappingConfigurations: [...state.mappingConfigurations, action.payload]
      };
    
    case 'UPDATE_MAPPING_CONFIGURATION':
      return {
        ...state,
        mappingConfigurations: state.mappingConfigurations.map(config => 
          config.id === action.payload.id ? { ...config, ...action.payload.updates } : config
        )
      };
    
    case 'DELETE_MAPPING_CONFIGURATION':
      return {
        ...state,
        mappingConfigurations: state.mappingConfigurations.filter(config => config.id !== action.payload)
      };
    
    default:
      return state;
  }
};

// 创建上下文
interface AppStateContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

// 创建Provider组件
interface AppStateProviderProps {
  children: ReactNode;
}

export const AppStateProvider: React.FC<AppStateProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  
  // 在这里可以实现加载和保存状态的逻辑
  
  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
};

// 创建Hook用于访问上下文
export const useAppState = (): AppStateContextType => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}; 