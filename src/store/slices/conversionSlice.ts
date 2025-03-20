import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FhirResource, FhirBundle } from '../../types/fhir';
import { LogicDto, ThirdPartyDto } from '../../types/metadata';

interface ConversionState {
  // 源数据
  sourceData: any;
  sourceType: 'fhir' | 'logic' | 'thirdParty' | null;
  sourceFormat: 'json' | 'xml' | null;
  
  // 目标数据
  targetData: any;
  targetType: 'fhir' | 'logic' | 'thirdParty' | null;
  targetFormat: 'json' | 'xml' | null;
  
  // 转换配置
  selectedDomain: string | null;
  selectedLogicDtoId: string | null;
  selectedThirdPartyDtoId: string | null;
  selectedFhirResourceType: string | null;
  
  // 状态
  isConverting: boolean;
  conversionError: string | null;
  conversionSuccess: boolean;
}

const initialState: ConversionState = {
  sourceData: null,
  sourceType: null,
  sourceFormat: null,
  
  targetData: null,
  targetType: null,
  targetFormat: null,
  
  selectedDomain: null,
  selectedLogicDtoId: null,
  selectedThirdPartyDtoId: null,
  selectedFhirResourceType: null,
  
  isConverting: false,
  conversionError: null,
  conversionSuccess: false
};

const conversionSlice = createSlice({
  name: 'conversion',
  initialState,
  reducers: {
    startConversion: (state, action: PayloadAction<{
      domain: string;
      type: string;
      sourceData: any;
    }>) => {
      const { domain, type, sourceData } = action.payload;
      state.selectedDomain = domain;
      state.sourceData = sourceData;
      state.isConverting = true;
      state.conversionError = null;
      
      if (type === '3rdToFhir') {
        state.sourceType = 'thirdParty';
        state.targetType = 'fhir';
      } else if (type === 'fhirTo3rd') {
        state.sourceType = 'fhir';
        state.targetType = 'thirdParty';
      }
      
      state.sourceFormat = 'json';
      state.targetFormat = 'json';
    },
    
    completeConversion: (state, action: PayloadAction<{
      success: boolean;
      data?: any;
      error?: string;
    }>) => {
      const { success, data, error } = action.payload;
      state.isConverting = false;
      state.conversionSuccess = success;
      
      if (success && data) {
        state.targetData = data;
        state.conversionError = null;
      } else if (!success && error) {
        state.conversionError = error;
      }
    },
    
    setSourceData: (state, action: PayloadAction<any>) => {
      state.sourceData = action.payload;
    },
    setSourceType: (state, action: PayloadAction<'fhir' | 'logic' | 'thirdParty' | null>) => {
      state.sourceType = action.payload;
    },
    setSourceFormat: (state, action: PayloadAction<'json' | 'xml' | null>) => {
      state.sourceFormat = action.payload;
    },
    
    setTargetData: (state, action: PayloadAction<any>) => {
      state.targetData = action.payload;
    },
    setTargetType: (state, action: PayloadAction<'fhir' | 'logic' | 'thirdParty' | null>) => {
      state.targetType = action.payload;
    },
    setTargetFormat: (state, action: PayloadAction<'json' | 'xml' | null>) => {
      state.targetFormat = action.payload;
    },
    
    setSelectedDomain: (state, action: PayloadAction<string | null>) => {
      state.selectedDomain = action.payload;
    },
    setSelectedLogicDtoId: (state, action: PayloadAction<string | null>) => {
      state.selectedLogicDtoId = action.payload;
    },
    setSelectedThirdPartyDtoId: (state, action: PayloadAction<string | null>) => {
      state.selectedThirdPartyDtoId = action.payload;
    },
    setSelectedFhirResourceType: (state, action: PayloadAction<string | null>) => {
      state.selectedFhirResourceType = action.payload;
    },
    
    setIsConverting: (state, action: PayloadAction<boolean>) => {
      state.isConverting = action.payload;
    },
    setConversionError: (state, action: PayloadAction<string | null>) => {
      state.conversionError = action.payload;
      state.conversionSuccess = action.payload === null;
    },
    setConversionSuccess: (state, action: PayloadAction<boolean>) => {
      state.conversionSuccess = action.payload;
      if (action.payload) {
        state.conversionError = null;
      }
    },
    
    resetConversion: (state) => {
      return initialState;
    },
    
    resetSourceData: (state) => {
      state.sourceData = null;
      state.sourceType = null;
      state.sourceFormat = null;
    },
    
    resetTargetData: (state) => {
      state.targetData = null;
      state.targetType = null;
      state.targetFormat = null;
    }
  }
});

export const conversionActions = conversionSlice.actions;
export default conversionSlice.reducer; 