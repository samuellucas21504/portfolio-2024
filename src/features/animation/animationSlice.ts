import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AnimationState {
  animationComplete: boolean;
}

const initialState: AnimationState = {
  animationComplete: false,
};

const animationSlice = createSlice({
  name: 'animation',
  initialState,
  reducers: {
    setAnimationComplete(state, action: PayloadAction<boolean>) {
      state.animationComplete = action.payload;
    },
  },
});

export const { setAnimationComplete } = animationSlice.actions;

export default animationSlice.reducer;
