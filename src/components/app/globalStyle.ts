import { createGlobalStyle } from 'styled-components';
import fsJoeyWebRegularWoff from '../../fonts/FSJoeyRegular.woff';
import fsJoeyWebRegularEot from '../../fonts/FSJoeyRegular.eot';
import fsJoeyWebRegularTtf from '../../fonts/FSJoeyRegular.ttf';

import fsJoeyWebBoldWoff from '../../fonts/FSJoeyBold.woff';
import fsJoeyWebBoldEot from '../../fonts/FSJoeyBold.eot';
import fsJoeyWebBoldTtf from '../../fonts/FSJoeyBold.ttf';

import fsJoeyWebHeavyWoff from '../../fonts/FSJoeyHeavy.woff';
import fsJoeyWebHeavyEot from '../../fonts/FSJoeyHeavy.eot';
import fsJoeyWebHeavyTtf from '../../fonts/FSJoeyHeavy.ttf';

export const GlobalStyle = createGlobalStyle`
  @font-face {
    font-family: 'FS Joey Web Bold';
    src: url(${fsJoeyWebBoldEot}) format('embedded-opentype'),
    url(${fsJoeyWebBoldWoff}) format('woff'),
    url(${fsJoeyWebBoldTtf}) format('opentype');
    font-weight: bold;
    font-style: normal;
  }

  @font-face {
    font-family: 'FS Joey Web Regular';
    src: url(${fsJoeyWebRegularEot}) format('embedded-opentype'),
    url(${fsJoeyWebRegularWoff}) format('woff'),
    url(${fsJoeyWebRegularTtf}) format('opentype');
    font-weight: normal;
    font-style: normal;
  }

  @font-face {
    font-family: 'FS Joey Web Heavy';
    src: url(${fsJoeyWebHeavyEot}) format('embedded-opentype'),
    url(${fsJoeyWebHeavyWoff}) format('woff'),
    url(${fsJoeyWebHeavyTtf}) format('opentype');
    font-weight: 800;
    font-style: normal;
  }

  body {
    margin: 0;
    min-width: 360px;
    padding-top: 0px;
    font-family: "FS Joey Web Regular",Helvetica,Arial,Verdana,sans-serif;
    font-size: 0.875rem;
    font-style: normal;
    font-weight: normal;
  }

  h1 {
    font-family: "FS Joey Web Bold",Helvetica,Arial,Verdana,sans-serif;
    font-size: 4rem;
    margin-top: 10px;
    margin-bottom:20px;
  }

  h2, h3, h4, h5, h6 {
    font-family: "FS Joey Web Regular",Helvetica,Arial,Verdana,sans-serif;
    margin-top: 20px;
    margin-bottom: 10px;
  }

  p {
    font-size: 1.3rem;
    line-height: 1.2em;
    margin: 0 0 10px;
  }

  a {
    color: #428bca;
    text-decoration: none;
  }
`;

export const breakpoints = {
    small: 768,
    mid: 992,
    big: 1200,
};

export const appBarHeight = 56;
