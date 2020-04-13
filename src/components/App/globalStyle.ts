import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
body {
  min-width: 800px;
  padding-top: 0px;
  font-family: "FS Joey Web Regular",Helvetica,Arial,Verdana,sans-serif;
  font-size-adjust: 0.49;
  font-style: normal;
  font-weight: normal;
}`;

export const theme = {
    primary: '#6e27c5',
};

export const breakpoints = {
    small: 768,
    mid: 992,
    big: 1200,
};

export const appBarHeight = 50;
