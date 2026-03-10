// ============================================================
// FINMATRIX - Employees Redux Slice
// ============================================================

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Employee } from '../../dummy-data/employees';
import { Department } from '../../models/employeeModel';
import {
  getEmployeesAPI,
  createEmployeeAPI,
  updateEmployeeAPI,
  toggleEmployeeActiveAPI,
} from '../../network/employeeNetwork';

// ─── Helpers ────────────────────────────────────────────────
type SortKey = 'name' | 'department';
type DepartmentFilter = 'all' | Department;

const applyFilters = (
  list: Employee[],
  search: string,
  deptFilter: DepartmentFilter,
  sortKey: SortKey,
): Employee[] => {
  let filtered = [...list];

  // Department filter
  if (deptFilter !== 'all') {
    filtered = filtered.filter((e) => e.department === deptFilter);
  }

  // Search by name
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.firstName.toLowerCase().includes(q) ||
        e.lastName.toLowerCase().includes(q) ||
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(q),
    );
  }

  // Sort
  switch (sortKey) {
    case 'name':
      filtered.sort((a, b) =>
        `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`),
      );
      break;
    case 'department':
      filtered.sort((a, b) => a.department.localeCompare(b.department));
      break;
  }

  return filtered;
};

// ─── State ──────────────────────────────────────────────────
interface EmployeeState {
  employees: Employee[];
  filteredEmployees: Employee[];
  searchQuery: string;
  departmentFilter: DepartmentFilter;
  sortKey: SortKey;
  isLoading: boolean;
  error: string | null;
}

const initialState: EmployeeState = {
  employees: [],
  filteredEmployees: [],
  searchQuery: '',
  departmentFilter: 'all',
  sortKey: 'name',
  isLoading: false,
  error: null,
};

// ─── Thunks ─────────────────────────────────────────────────
export const fetchEmployees = createAsyncThunk(
  'employees/fetchEmployees',
  async (_, { rejectWithValue }) => {
    try {
      return await getEmployeesAPI();
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to fetch employees');
    }
  },
);

export const createEmployee = createAsyncThunk(
  'employees/createEmployee',
  async (data: Omit<Employee, 'employeeId'>, { rejectWithValue }) => {
    try {
      return await createEmployeeAPI(data);
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to create employee');
    }
  },
);

export const updateEmployee = createAsyncThunk(
  'employees/updateEmployee',
  async ({ id, data }: { id: string; data: Partial<Employee> }, { rejectWithValue }) => {
    try {
      return await updateEmployeeAPI(id, data);
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to update employee');
    }
  },
);

export const toggleEmployeeActive = createAsyncThunk(
  'employees/toggleEmployeeActive',
  async (id: string, { rejectWithValue }) => {
    try {
      return await toggleEmployeeActiveAPI(id);
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to toggle employee status');
    }
  },
);

// ─── Slice ──────────────────────────────────────────────────
const employeeSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
      state.filteredEmployees = applyFilters(
        state.employees,
        action.payload,
        state.departmentFilter,
        state.sortKey,
      );
    },
    setDepartmentFilter(state, action: PayloadAction<DepartmentFilter>) {
      state.departmentFilter = action.payload;
      state.filteredEmployees = applyFilters(
        state.employees,
        state.searchQuery,
        action.payload,
        state.sortKey,
      );
    },
    setSortKey(state, action: PayloadAction<SortKey>) {
      state.sortKey = action.payload;
      state.filteredEmployees = applyFilters(
        state.employees,
        state.searchQuery,
        state.departmentFilter,
        action.payload,
      );
    },
  },
  extraReducers: (builder) => {
    // fetch
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.isLoading = false;
        state.employees = action.payload;
        state.filteredEmployees = applyFilters(
          action.payload,
          state.searchQuery,
          state.departmentFilter,
          state.sortKey,
        );
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // create
    builder.addCase(createEmployee.fulfilled, (state, action) => {
      state.employees.push(action.payload);
      state.filteredEmployees = applyFilters(
        state.employees,
        state.searchQuery,
        state.departmentFilter,
        state.sortKey,
      );
    });

    // update
    builder.addCase(updateEmployee.fulfilled, (state, action) => {
      const idx = state.employees.findIndex(
        (e) => e.employeeId === action.payload.employeeId,
      );
      if (idx !== -1) state.employees[idx] = action.payload;
      state.filteredEmployees = applyFilters(
        state.employees,
        state.searchQuery,
        state.departmentFilter,
        state.sortKey,
      );
    });

    // toggle active
    builder.addCase(toggleEmployeeActive.fulfilled, (state, action) => {
      const idx = state.employees.findIndex(
        (e) => e.employeeId === action.payload.employeeId,
      );
      if (idx !== -1) state.employees[idx] = action.payload;
      state.filteredEmployees = applyFilters(
        state.employees,
        state.searchQuery,
        state.departmentFilter,
        state.sortKey,
      );
    });
  },
});

export const { setSearchQuery, setDepartmentFilter, setSortKey } =
  employeeSlice.actions;
export default employeeSlice.reducer;
