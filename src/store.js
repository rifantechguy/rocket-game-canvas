// src/store.js
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { INITIAL_ROTATION } from './components/config';

const initialState = {
  isFiring: false,
  rocketPosition: { x: 0, y: 0, rAngle:INITIAL_ROTATION },
  launchTime: null,
  holdDuration: 0,
  tokens: 10, // Initial number of tokens
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    startFiring: (state) => {
      state.isFiring = true;
      state.launchTime = Date.now();
    },
    stopFiring: (state) => {
      state.isFiring = false;
      state.holdDuration = (Date.now() - state.launchTime) / 1000; // in seconds
      state.launchTime = null;
      state.tokens -= 1;
    },
    updateRocketPosition: (state, action) => {
      state.rocketPosition = action.payload;
    },
    resetHoldDuration: (state) => {
      state.holdDuration = 0;
    },
  },
});

export const { startFiring, stopFiring, updateRocketPosition, resetHoldDuration } = gameSlice.actions;

export const store = configureStore({
  reducer: {
    game: gameSlice.reducer,
  },
});
