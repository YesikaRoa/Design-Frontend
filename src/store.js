import { legacy_createStore as createStore } from 'redux'

const initialState = {
  sidebarShow: true,
  theme: 'light',
  avatar: null, // Estado inicial para el avatar
}

const changeState = (state = initialState, { type, ...rest }) => {
  switch (type) {
    case 'setAvatar': // Actualizar solo el avatar
      return { ...state, avatar: rest.avatar }
    case 'set': // Cambiar otros estados
      return { ...state, ...rest }
    default:
      return state
  }
}

const store = createStore(changeState)
export default store
