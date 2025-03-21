import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  AppState, 
  LogicDtoModel, 
  ThirdPartyModel, 
  MappingConfiguration,
  DataDomain
} from '../types';

// 初始状态
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

// 定义操作
interface AppActions {
  // 数据领域操作
  addDomain: (domain: DataDomain) => void;
  updateDomain: (domain: DataDomain) => void;
  deleteDomain: (domainId: string) => void;
  
  // 逻辑模型操作
  addLogicDtoModel: (model: LogicDtoModel) => void;
  updateLogicDtoModel: (model: LogicDtoModel) => void;
  deleteLogicDtoModel: (modelId: string) => void;
  
  // 第三方模型操作
  addThirdPartyModel: (model: ThirdPartyModel) => void;
  updateThirdPartyModel: (model: ThirdPartyModel) => void;
  deleteThirdPartyModel: (modelId: string) => void;
  
  // 映射配置操作
  addMappingConfiguration: (config: MappingConfiguration) => void;
  updateMappingConfiguration: (config: MappingConfiguration) => void;
  deleteMappingConfiguration: (configId: string) => void;
}

// 创建存储
export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set) => ({
      ...initialState,
      
      // 领域操作
      addDomain: (domain) => set((state) => ({
        domains: [...state.domains, domain]
      })),
      updateDomain: (domain) => set((state) => ({
        domains: state.domains.map(d => d.id === domain.id ? domain : d)
      })),
      deleteDomain: (domainId) => set((state) => ({
        domains: state.domains.filter(d => d.id !== domainId)
      })),
      
      // 逻辑模型操作
      addLogicDtoModel: (model) => set((state) => ({
        logicDtoModels: [...state.logicDtoModels, model]
      })),
      updateLogicDtoModel: (model) => set((state) => ({
        logicDtoModels: state.logicDtoModels.map(m => m.id === model.id ? model : m)
      })),
      deleteLogicDtoModel: (modelId) => set((state) => ({
        logicDtoModels: state.logicDtoModels.filter(m => m.id !== modelId)
      })),
      
      // 第三方模型操作
      addThirdPartyModel: (model) => set((state) => ({
        thirdPartyModels: [...state.thirdPartyModels, model]
      })),
      updateThirdPartyModel: (model) => set((state) => ({
        thirdPartyModels: state.thirdPartyModels.map(m => m.id === model.id ? model : m)
      })),
      deleteThirdPartyModel: (modelId) => set((state) => ({
        thirdPartyModels: state.thirdPartyModels.filter(m => m.id !== modelId)
      })),
      
      // 映射配置操作
      addMappingConfiguration: (config) => set((state) => ({
        mappingConfigurations: [...state.mappingConfigurations, config]
      })),
      updateMappingConfiguration: (config) => set((state) => ({
        mappingConfigurations: state.mappingConfigurations.map(c => c.id === config.id ? config : c)
      })),
      deleteMappingConfiguration: (configId) => set((state) => ({
        mappingConfigurations: state.mappingConfigurations.filter(c => c.id !== configId)
      })),
    }),
    {
      name: 'fhir-map-storage', // 本地存储的键名
    }
  )
); 