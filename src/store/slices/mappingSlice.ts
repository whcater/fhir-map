import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  MappingConfig, 
  LogicToFhirMapping, 
  ThirdPartyToLogicMapping,
  FhirToLogicMapping,
  LogicToThirdPartyMapping
} from '../../types/mapping';
import { DataDomain } from '../../types/metadata';

interface MappingState {
  mappingConfigs: { [dataDomainId: string]: MappingConfig };
  currentMappingConfigId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: MappingState = {
  mappingConfigs: {},
  currentMappingConfigId: null,
  loading: false,
  error: null
};

const mappingSlice = createSlice({
  name: 'mapping',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setMappingConfigs: (state, action: PayloadAction<{ [dataDomainId: string]: MappingConfig }>) => {
      state.mappingConfigs = action.payload;
    },
    setCurrentMappingConfigId: (state, action: PayloadAction<string>) => {
      state.currentMappingConfigId = action.payload;
    },
    addMappingConfig: (state, action: PayloadAction<{ dataDomain: DataDomain }>) => {
      const { dataDomain } = action.payload;
      state.mappingConfigs[dataDomain.id] = {
        id: `mapping-${dataDomain.id}`,
        name: `${dataDomain.name}映射配置`,
        description: `${dataDomain.name}的映射配置`,
        type: 'logic-to-fhir',
        dataDomainId: dataDomain.id,
        sourceDtoId: '',
        targetDtoId: '',
        fieldMappings: [],
        logicToFhirMappings: [],
        thirdPartyToLogicMappings: [],
        fhirToLogicMappings: [],
        logicToThirdPartyMappings: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    },
    updateMappingConfig: (state, action: PayloadAction<{ dataDomainId: string; updatedConfig: MappingConfig }>) => {
      const { dataDomainId, updatedConfig } = action.payload;
      state.mappingConfigs[dataDomainId] = updatedConfig;
    },
    deleteMappingConfig: (state, action: PayloadAction<string>) => {
      const dataDomainId = action.payload;
      delete state.mappingConfigs[dataDomainId];
      if (state.currentMappingConfigId === dataDomainId) {
        const remainingIds = Object.keys(state.mappingConfigs);
        state.currentMappingConfigId = remainingIds.length > 0 ? remainingIds[0] : null;
      }
    },
    // LogicToFhir映射操作
    addLogicToFhirMapping: (state, action: PayloadAction<{ dataDomainId: string; mapping: LogicToFhirMapping }>) => {
      const { dataDomainId, mapping } = action.payload;
      const config = state.mappingConfigs[dataDomainId];
      if (config) {
        if (!config.logicToFhirMappings) {
          config.logicToFhirMappings = [];
        }
        config.logicToFhirMappings.push(mapping);
      }
    },
    updateLogicToFhirMapping: (state, action: PayloadAction<{ 
      dataDomainId: string; 
      logicDtoId: string; 
      fhirResourceType: string;
      updatedMapping: LogicToFhirMapping 
    }>) => {
      const { dataDomainId, logicDtoId, fhirResourceType, updatedMapping } = action.payload;
      const config = state.mappingConfigs[dataDomainId];
      if (config) {
        if (!config.logicToFhirMappings) {
          config.logicToFhirMappings = [];
        }
        const index = config.logicToFhirMappings.findIndex(m => 
          m.logicDtoId === logicDtoId && m.fhirResourceType === fhirResourceType
        );
        if (index >= 0) {
          config.logicToFhirMappings[index] = updatedMapping;
        }
      }
    },
    deleteLogicToFhirMapping: (state, action: PayloadAction<{ 
      dataDomainId: string; 
      logicDtoId: string; 
      fhirResourceType: string 
    }>) => {
      const { dataDomainId, logicDtoId, fhirResourceType } = action.payload;
      const config = state.mappingConfigs[dataDomainId];
      if (config && config.logicToFhirMappings) {
        config.logicToFhirMappings = config.logicToFhirMappings.filter(m => 
          !(m.logicDtoId === logicDtoId && m.fhirResourceType === fhirResourceType)
        );
      }
    },
    // ThirdPartyToLogic映射操作
    addThirdPartyToLogicMapping: (state, action: PayloadAction<{ dataDomainId: string; mapping: ThirdPartyToLogicMapping }>) => {
      const { dataDomainId, mapping } = action.payload;
      const config = state.mappingConfigs[dataDomainId];
      if (config) {
        if (!config.thirdPartyToLogicMappings) {
          config.thirdPartyToLogicMappings = [];
        }
        config.thirdPartyToLogicMappings.push(mapping);
      }
    },
    updateThirdPartyToLogicMapping: (state, action: PayloadAction<{ 
      dataDomainId: string; 
      thirdPartyDtoId: string; 
      logicDtoId: string;
      updatedMapping: ThirdPartyToLogicMapping 
    }>) => {
      const { dataDomainId, thirdPartyDtoId, logicDtoId, updatedMapping } = action.payload;
      const config = state.mappingConfigs[dataDomainId];
      if (config) {
        if (!config.thirdPartyToLogicMappings) {
          config.thirdPartyToLogicMappings = [];
        }
        const index = config.thirdPartyToLogicMappings.findIndex(m => 
          m.thirdPartyDtoId === thirdPartyDtoId && m.logicDtoId === logicDtoId
        );
        if (index >= 0) {
          config.thirdPartyToLogicMappings[index] = updatedMapping;
        }
      }
    },
    deleteThirdPartyToLogicMapping: (state, action: PayloadAction<{ 
      dataDomainId: string; 
      thirdPartyDtoId: string; 
      logicDtoId: string 
    }>) => {
      const { dataDomainId, thirdPartyDtoId, logicDtoId } = action.payload;
      const config = state.mappingConfigs[dataDomainId];
      if (config && config.thirdPartyToLogicMappings) {
        config.thirdPartyToLogicMappings = config.thirdPartyToLogicMappings.filter(m => 
          !(m.thirdPartyDtoId === thirdPartyDtoId && m.logicDtoId === logicDtoId)
        );
      }
    },
    // FhirToLogic映射操作
    addFhirToLogicMapping: (state, action: PayloadAction<{ dataDomainId: string; mapping: FhirToLogicMapping }>) => {
      const { dataDomainId, mapping } = action.payload;
      const config = state.mappingConfigs[dataDomainId];
      if (config) {
        if (!config.fhirToLogicMappings) {
          config.fhirToLogicMappings = [];
        }
        config.fhirToLogicMappings.push(mapping);
      }
    },
    updateFhirToLogicMapping: (state, action: PayloadAction<{ 
      dataDomainId: string; 
      fhirResourceType: string; 
      logicDtoId: string;
      updatedMapping: FhirToLogicMapping 
    }>) => {
      const { dataDomainId, fhirResourceType, logicDtoId, updatedMapping } = action.payload;
      const config = state.mappingConfigs[dataDomainId];
      if (config) {
        if (!config.fhirToLogicMappings) {
          config.fhirToLogicMappings = [];
        }
        const index = config.fhirToLogicMappings.findIndex(m => 
          m.fhirResourceType === fhirResourceType && m.logicDtoId === logicDtoId
        );
        if (index >= 0) {
          config.fhirToLogicMappings[index] = updatedMapping;
        }
      }
    },
    deleteFhirToLogicMapping: (state, action: PayloadAction<{ 
      dataDomainId: string; 
      fhirResourceType: string; 
      logicDtoId: string 
    }>) => {
      const { dataDomainId, fhirResourceType, logicDtoId } = action.payload;
      const config = state.mappingConfigs[dataDomainId];
      if (config && config.fhirToLogicMappings) {
        config.fhirToLogicMappings = config.fhirToLogicMappings.filter(m => 
          !(m.fhirResourceType === fhirResourceType && m.logicDtoId === logicDtoId)
        );
      }
    },
    // LogicToThirdParty映射操作
    addLogicToThirdPartyMapping: (state, action: PayloadAction<{ dataDomainId: string; mapping: LogicToThirdPartyMapping }>) => {
      const { dataDomainId, mapping } = action.payload;
      const config = state.mappingConfigs[dataDomainId];
      if (config) {
        if (!config.logicToThirdPartyMappings) {
          config.logicToThirdPartyMappings = [];
        }
        config.logicToThirdPartyMappings.push(mapping);
      }
    },
    updateLogicToThirdPartyMapping: (state, action: PayloadAction<{ 
      dataDomainId: string; 
      logicDtoId: string; 
      thirdPartyDtoId: string;
      updatedMapping: LogicToThirdPartyMapping 
    }>) => {
      const { dataDomainId, logicDtoId, thirdPartyDtoId, updatedMapping } = action.payload;
      const config = state.mappingConfigs[dataDomainId];
      if (config) {
        if (!config.logicToThirdPartyMappings) {
          config.logicToThirdPartyMappings = [];
        }
        const index = config.logicToThirdPartyMappings.findIndex(m => 
          m.logicDtoId === logicDtoId && m.thirdPartyDtoId === thirdPartyDtoId
        );
        if (index >= 0) {
          config.logicToThirdPartyMappings[index] = updatedMapping;
        }
      }
    },
    deleteLogicToThirdPartyMapping: (state, action: PayloadAction<{ 
      dataDomainId: string; 
      logicDtoId: string; 
      thirdPartyDtoId: string 
    }>) => {
      const { dataDomainId, logicDtoId, thirdPartyDtoId } = action.payload;
      const config = state.mappingConfigs[dataDomainId];
      if (config && config.logicToThirdPartyMappings) {
        config.logicToThirdPartyMappings = config.logicToThirdPartyMappings.filter(m => 
          !(m.logicDtoId === logicDtoId && m.thirdPartyDtoId === thirdPartyDtoId)
        );
      }
    }
  }
});

export const { 
  setLoading, 
  setError, 
  setMappingConfigs,
  setCurrentMappingConfigId,
  addMappingConfig,
  updateMappingConfig,
  deleteMappingConfig,
  addLogicToFhirMapping,
  updateLogicToFhirMapping,
  deleteLogicToFhirMapping,
  addThirdPartyToLogicMapping,
  updateThirdPartyToLogicMapping,
  deleteThirdPartyToLogicMapping,
  addFhirToLogicMapping,
  updateFhirToLogicMapping,
  deleteFhirToLogicMapping,
  addLogicToThirdPartyMapping,
  updateLogicToThirdPartyMapping,
  deleteLogicToThirdPartyMapping
} = mappingSlice.actions;

export default mappingSlice.reducer; 