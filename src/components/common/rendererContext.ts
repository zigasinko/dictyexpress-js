import { createContext } from 'react';
import { DictyRenderers } from 'redux/models/internal';

// eslint-disable-next-line import/prefer-default-export
export const RendererContext = createContext<DictyRenderers>('canvas');
