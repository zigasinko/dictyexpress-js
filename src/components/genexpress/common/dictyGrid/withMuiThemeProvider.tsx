/* eslint-disable react/jsx-props-no-spreading */
import React, { ComponentType, ReactElement } from 'react';
import { createMuiTheme, MuiThemeProvider, StylesProvider } from '@material-ui/core';
import theme from 'components/app/theme';

const appTheme = createMuiTheme(theme);

const withMuiStylesProvider = <P extends object>(Component: ComponentType<P>) => ({
    ...props
}): ReactElement => (
    <StylesProvider injectFirst>
        <MuiThemeProvider theme={appTheme}>
            <Component {...(props as P)} />
        </MuiThemeProvider>
    </StylesProvider>
);
export default withMuiStylesProvider;
