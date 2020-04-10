import React from 'react';
import { render } from '@testing-library/react';
import App from './app';

test('app renders', () => {
    const { getByText } = render(<App />);
    const headerElement = getByText('dictyExpress');
    expect(headerElement).toBeInTheDocument();
});
