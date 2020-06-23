import React from 'react';
import { render } from '@testing-library/react';
import App from './app';

describe('app', () => {
    it('app renders', () => {
        const { getByText } = render(<App />);
        const headerElement = getByText('dictyExpress');
        expect(headerElement).toBeInTheDocument();
    });
});
