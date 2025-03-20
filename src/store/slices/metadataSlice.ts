import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Field {
  id: string;
  name: string;
  type: string;
  description?: string;
  required: boolean;
  nestedFields?: Field[];
}

interface LogicalDto {
  id: string;
  name: string;
  description?: string;
  fields: Field[];
}

interface ThirdPartyDto {
  id: string;
  name: string;
  description?: string;
  fields: Field[];
}

interface Domain {
  id: string;
  name: string;
  description?: string;
  logicalDtos: LogicalDto[];
  thirdPartyDtos: ThirdPartyDto[];
}

interface MetadataState {
  domains: Record<string, Domain>;
  loading: boolean;
  error: string | null;
}

const initialState: MetadataState = {
  domains: {},
  loading: false,
  error: null,
};

const metadataSlice = createSlice({
  name: 'metadata',
  initialState,
  reducers: {
    addDomain: (state, action: PayloadAction<Domain>) => {
      state.domains[action.payload.id] = action.payload;
    },
    updateDomain: (state, action: PayloadAction<{ id: string; domain: Partial<Domain> }>) => {
      const { id, domain } = action.payload;
      if (state.domains[id]) {
        state.domains[id] = { ...state.domains[id], ...domain };
      }
    },
    removeDomain: (state, action: PayloadAction<string>) => {
      delete state.domains[action.payload];
    },
    addLogicalDto: (state, action: PayloadAction<{ domainId: string; dto: LogicalDto }>) => {
      const { domainId, dto } = action.payload;
      if (state.domains[domainId]) {
        state.domains[domainId].logicalDtos.push(dto);
      }
    },
    updateLogicalDto: (state, action: PayloadAction<{ domainId: string; dtoId: string; dto: Partial<LogicalDto> }>) => {
      const { domainId, dtoId, dto } = action.payload;
      if (state.domains[domainId]) {
        const index = state.domains[domainId].logicalDtos.findIndex(d => d.id === dtoId);
        if (index >= 0) {
          state.domains[domainId].logicalDtos[index] = {
            ...state.domains[domainId].logicalDtos[index],
            ...dto
          };
        }
      }
    },
    removeLogicalDto: (state, action: PayloadAction<{ domainId: string; dtoId: string }>) => {
      const { domainId, dtoId } = action.payload;
      if (state.domains[domainId]) {
        state.domains[domainId].logicalDtos = state.domains[domainId].logicalDtos.filter(
          dto => dto.id !== dtoId
        );
      }
    },
    addThirdPartyDto: (state, action: PayloadAction<{ domainId: string; dto: ThirdPartyDto }>) => {
      const { domainId, dto } = action.payload;
      if (state.domains[domainId]) {
        state.domains[domainId].thirdPartyDtos.push(dto);
      }
    },
    updateThirdPartyDto: (state, action: PayloadAction<{ domainId: string; dtoId: string; dto: Partial<ThirdPartyDto> }>) => {
      const { domainId, dtoId, dto } = action.payload;
      if (state.domains[domainId]) {
        const index = state.domains[domainId].thirdPartyDtos.findIndex(d => d.id === dtoId);
        if (index >= 0) {
          state.domains[domainId].thirdPartyDtos[index] = {
            ...state.domains[domainId].thirdPartyDtos[index],
            ...dto
          };
        }
      }
    },
    removeThirdPartyDto: (state, action: PayloadAction<{ domainId: string; dtoId: string }>) => {
      const { domainId, dtoId } = action.payload;
      if (state.domains[domainId]) {
        state.domains[domainId].thirdPartyDtos = state.domains[domainId].thirdPartyDtos.filter(
          dto => dto.id !== dtoId
        );
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const metadataActions = metadataSlice.actions;
export default metadataSlice.reducer; 