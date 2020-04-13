import React, { ReactElement, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AppBar from './AppBar/AppBar';
import Home from './Home/Home';
import Features from './Features/Features';
import Citing from './Citing/Citing';
import References from './References/References';
import scrollToTargetAdjusted from '../../utils/documentHelpers';
import { appBarHeight } from '../App/globalStyle';

const LandingPage = (): ReactElement => {
    const location = useLocation();

    useEffect(() => {
        scrollToTargetAdjusted(location.hash, appBarHeight);
    }, [location]);

    return (
        <>
            <AppBar />
            <Home />
            <Features />
            <Citing />
            <References />
        </>
    );
};

export default LandingPage;
