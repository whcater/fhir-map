import { configureStore } from '@reduxjs/toolkit';
import metadataReducer from './slices/metadataSlice';
import mappingReducer from './slices/mappingSlice';
import conversionReducer from './slices/conversionSlice';

export const store = configureStore({
  reducer: {
    metadata: metadataReducer,
    mapping: mappingReducer,
    conversion: conversionReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 