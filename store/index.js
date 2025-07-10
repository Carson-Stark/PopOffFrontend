import { configureStore } from '@reduxjs/toolkit';

const initialState = {
  isAuthenticated: false,
  username: "",
  blockedUsers: []  // track blocked users
};

function authenticatedReducer(state = initialState, action) {
  switch (action.type) {
    case 'login':
      return { ...state, isAuthenticated: true, username: action.payload.username };
    case 'logout':
      return { ...state, isAuthenticated: false, username: "" };
    case 'block_user':
      return {
        ...state,
        blockedUsers: state.blockedUsers.includes(action.payload.username)
          ? state.blockedUsers
          : [...state.blockedUsers, action.payload.username]
      };
    default:
      return state;
  }
}

const store = configureStore({
  reducer: authenticatedReducer,
});

export default store;