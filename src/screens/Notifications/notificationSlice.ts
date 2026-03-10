// ============================================================
// FINMATRIX - Notifications Redux Slice
// ============================================================

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  AppNotification,
  notifications as SEED,
} from '../../dummy-data/notifications';

// ─── State ──────────────────────────────────────────────────
interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  filter: string;
  isLoading: boolean;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  filter: 'all',
  isLoading: false,
};

// ─── Helpers ────────────────────────────────────────────────
const calcUnread = (items: AppNotification[]) =>
  items.filter((n) => !n.isRead).length;

// ─── Thunks ─────────────────────────────────────────────────
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async () => {
    await new Promise((r) => setTimeout(r, 600));
    // Return sorted newest-first
    return [...SEED].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },
);

export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (id: string) => {
    await new Promise((r) => setTimeout(r, 200));
    return id;
  },
);

export const markAllRead = createAsyncThunk(
  'notifications/markAllRead',
  async () => {
    await new Promise((r) => setTimeout(r, 300));
    return true;
  },
);

export const dismissNotification = createAsyncThunk(
  'notifications/dismissNotification',
  async (id: string) => {
    await new Promise((r) => setTimeout(r, 200));
    return id;
  },
);

// ─── Slice ──────────────────────────────────────────────────
const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setFilter(state, action: PayloadAction<string>) {
      state.filter = action.payload;
    },
    updateNotification(state, action: PayloadAction<AppNotification>) {
      const idx = state.notifications.findIndex((n) => n.id === action.payload.id);
      if (idx !== -1) {
        state.notifications[idx] = action.payload;
        state.unreadCount = calcUnread(state.notifications);
      }
    },
    removeNotification(state, action: PayloadAction<string>) {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
      state.unreadCount = calcUnread(state.notifications);
    },
    /** Injected by realtimeMiddleware for cross-role notifications */
    addRealtimeNotification(state, action: PayloadAction<AppNotification>) {
      state.notifications.unshift(action.payload);
      state.unreadCount = calcUnread(state.notifications);
    },
  },
  extraReducers: (builder) => {
    // fetchNotifications
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload;
        state.unreadCount = calcUnread(action.payload);
      })
      .addCase(fetchNotifications.rejected, (state) => {
        state.isLoading = false;
      });

    // markAsRead
    builder.addCase(markAsRead.fulfilled, (state, action) => {
      const idx = state.notifications.findIndex((n) => n.id === action.payload);
      if (idx !== -1) {
        state.notifications[idx] = { ...state.notifications[idx], isRead: true };
        state.unreadCount = calcUnread(state.notifications);
      }
    });

    // markAllRead
    builder.addCase(markAllRead.fulfilled, (state) => {
      state.notifications = state.notifications.map((n) => ({ ...n, isRead: true }));
      state.unreadCount = 0;
    });

    // dismissNotification
    builder.addCase(dismissNotification.fulfilled, (state, action) => {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
      state.unreadCount = calcUnread(state.notifications);
    });
  },
});

export const { setFilter, updateNotification, removeNotification, addRealtimeNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
