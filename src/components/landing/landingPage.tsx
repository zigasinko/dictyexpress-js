import React, { ReactElement } from 'react';
import Home from './home/home';
import Features from './features/features';
import Citing from './citing/citing';
import References from './references/references';
import Credits from './credits/credits';
import { SectionHorizontalLine } from './common/layout.styles';
import Footer from './footer/footer';
import Screenshots from './screenshots/screenshots';
import AppBar from './appBar/appBar';

const LandingPage = (): ReactElement => {
    return (
        <>
            <AppBar />
            <Home />
            <Features />
            <Screenshots />
            <Citing />
            <SectionHorizontalLine />
            <References />
            <Credits />
            <Footer />
        </>
    );
};

export default LandingPage;
