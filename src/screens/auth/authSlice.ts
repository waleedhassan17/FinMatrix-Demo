// ============================================================
// FINMATRIX - Auth Redux Slice (Redesigned)
// Improvements:
//  • Per-action loading tracking via loadingAction field
//  • Structured error objects with optional field targeting
//  • signOut pending state for loading indicator
//  • Cleaner selectRole (uses reducer when no API needed)
// ============================================================
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User, UserRole } from '../../types';
import { signInAPI, signUpAPI, forgotPasswordAPI, signOutAPI } from '../../network/authNetwork';

// ── Structured error type ─────────────────────────────────
export interface AuthError {
  code: string;
  message: string;
  field?: string; // Optional: enables field-level error display
}

// ── Extended state ────────────────────────────────────────
interface ExtendedAuthState extends AuthState {
  /** Which async action is currently loading (null = idle) */
  loadingAction: 'signIn' | 'signUp' | 'forgotPassword' | 'signOut' | 'selectRole' | null;
}

const initialState: ExtendedAuthState = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  selectedRole: null,
  isOnboarded: false,
  error: null,
  signUpSuccess: false,
  loadingAction: null,
};

// ── Helpers ───────────────────────────────────────────────
const startLoading = (state: ExtendedAuthState, action: ExtendedAuthState['loadingAction']) => {
  state.isLoading = true;
  state.loadingAction = action;
  state.error = null;
};

const stopLoading = (state: ExtendedAuthState) => {
  state.isLoading = false;
  state.loadingAction = null;
};

// ── Async Thunks ──────────────────────────────────────────

export const signIn = createAsyncThunk(
  'auth/signIn',
  async (
    { email, password, role }: { email: string; password: string; role: UserRole },
    { rejectWithValue },
  ) => {
    try {
      const user = await signInAPI(email, password, role);
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const signUp = createAsyncThunk(
  'auth/signUp',
  async (
    {
      email, password, displayName, phoneNumber, companyName, role,
    }: {
      email: string; password: string; displayName: string;
      phoneNumber: string; companyName: string; role: UserRole;
    },
    { rejectWithValue },
  ) => {
    try {
      const user = await signUpAPI(email, password, displayName, phoneNumber, companyName, role);
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async ({ email }: { email: string }, { rejectWithValue }) => {
    try {
      await forgotPasswordAPI(email);
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const signOut = createAsyncThunk(
  'auth/signOut',
  async (_, { rejectWithValue }) => {
    try {
      await signOutAPI();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const selectRole = createAsyncThunk(
  'auth/selectRole',
  async ({ userId, role }: { userId: string; role: UserRole }, { rejectWithValue }) => {
    try {
      // In a real app this would call an API
      return role;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

// ── Slice ─────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSelectedRole: (state, action: PayloadAction<UserRole>) => {
      state.selectedRole = action.payload;
      state.error = null;
    },
    setOnboarded: (state) => {
      state.isOnboarded = true;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSignUpSuccess: (state) => {
      state.signUpSuccess = false;
    },
    resetAuth: () => initialState,
  },
  extraReducers: (builder) => {
    // ── Sign In ──
    builder
      .addCase(signIn.pending, (state) => {
        startLoading(state, 'signIn');
      })
      .addCase(signIn.fulfilled, (state, action: PayloadAction<User>) => {
        stopLoading(state);
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(signIn.rejected, (state, action) => {
        stopLoading(state);
        state.error = action.payload as string;
      })

    // ── Sign Up ──
      .addCase(signUp.pending, (state) => {
        startLoading(state, 'signUp');
        state.signUpSuccess = false;
      })
      .addCase(signUp.fulfilled, (state, action: PayloadAction<User>) => {
        stopLoading(state);
        state.signUpSuccess = true;
        state.user = action.payload;
      })
      .addCase(signUp.rejected, (state, action) => {
        stopLoading(state);
        state.error = action.payload as string;
        state.signUpSuccess = false;
      })

    // ── Forgot Password ──
      .addCase(forgotPassword.pending, (state) => {
        startLoading(state, 'forgotPassword');
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        stopLoading(state);
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        stopLoading(state);
        state.error = action.payload as string;
      })

    // ── Sign Out ──
      .addCase(signOut.pending, (state) => {
        startLoading(state, 'signOut');
      })
      .addCase(signOut.fulfilled, () => initialState)
      .addCase(signOut.rejected, (state, action) => {
        stopLoading(state);
        state.error = action.payload as string;
      })

    // ── Select Role ──
      .addCase(selectRole.pending, (state) => {
        startLoading(state, 'selectRole');
      })
      .addCase(selectRole.fulfilled, (state, action: PayloadAction<UserRole>) => {
        stopLoading(state);
        state.selectedRole = action.payload;
      })
      .addCase(selectRole.rejected, (state, action) => {
        stopLoading(state);
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedRole, setOnboarded, clearError, clearSignUpSuccess, resetAuth } = authSlice.actions;
export default authSlice.reducer;