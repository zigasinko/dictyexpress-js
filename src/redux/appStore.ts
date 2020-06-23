import { useDispatch } from 'react-redux';
import getStore from './rootStore';

const store = getStore();

export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = (): AppDispatch => useDispatch<AppDispatch>();

export default store;
