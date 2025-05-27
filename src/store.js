import { legacy_createStore as createStore } from 'redux'

const initialState = {
  sidebarShow: true,
  theme: 'light',
  avatar: null, // Estado inicial para el avatar
}

const changeState = (state = initialState, { type, ...rest }) => {
  switch (type) {
    case 'set':
      return { ...state, ...rest }
    case 'setAvatar': // Nuevo caso para actualizar el avatar
      return { ...state, avatar: rest.avatar }
    default:
      return state
  }
}

const store = createStore(changeState)
export default store
