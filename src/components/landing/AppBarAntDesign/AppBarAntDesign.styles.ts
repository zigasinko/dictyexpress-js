import styled from 'styled-components';
import { Button } from '@progress/kendo-react-buttons';
import { appBarHeight } from '../../App/globalStyle';

const AppBarContainerAntDesign = styled.div`
    height: ${appBarHeight}px;
    position: fixed;
    top: ${appBarHeight}px;
    right: 0;
    left: 0;
    background-color: #fff;
    z-index: 1030;
`;

export default AppBarContainerAntDesign;
