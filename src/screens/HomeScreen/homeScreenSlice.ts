
import { createSlice } from '@reduxjs/toolkit';

interface HomeState {
  isLoading: boolean;
  dashboardData: any;
}

const initialState: HomeState = {
  isLoading: false,
  dashboardData: null,
};

const homeScreenSlice = createSlice({
  name: 'home',
  initialState,
  reducers: {
    setLoading: (state, action) => { state.isLoading = action.payload; },
    setDashboardData: (state, action) => { state.dashboardData = action.payload; },
  },
});

export const { setLoading, setDashboardData } = homeScreenSlice.actions;
export default homeScreenSlice.reducer;
