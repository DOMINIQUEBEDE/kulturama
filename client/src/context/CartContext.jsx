import { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

const STORAGE_KEY = 'kulturama_cart';

function loadCart() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function cartReducer(state, action) {
  let newState;
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.find(item => item.id === action.product.id);
      if (existing) {
        newState = state.map(item =>
          item.id === action.product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, item.stock_quantity) }
            : item
        );
      } else {
        newState = [...state, { ...action.product, quantity: 1 }];
      }
      break;
    }
    case 'REMOVE_ITEM':
      newState = state.filter(item => item.id !== action.id);
      break;
    case 'UPDATE_QUANTITY':
      newState = state.map(item =>
        item.id === action.id
          ? { ...item, quantity: Math.max(1, Math.min(action.quantity, item.stock_quantity)) }
          : item
      );
      break;
    case 'CLEAR':
      newState = [];
      break;
    default:
      return state;
  }
  saveCart(newState);
  return newState;
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, [], loadCart);

  const addItem = (product) => dispatch({ type: 'ADD_ITEM', product });
  const removeItem = (id) => dispatch({ type: 'REMOVE_ITEM', id });
  const updateQuantity = (id, quantity) => dispatch({ type: 'UPDATE_QUANTITY', id, quantity });
  const clearCart = () => dispatch({ type: 'CLEAR' });

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalAmount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
