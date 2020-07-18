import React, { ReactElement } from 'react';
import { SectionHorizontalLine } from 'components/landing/common/layout.styles';
import References from 'components/landing/references/references';
import Credits from 'components/landing/credits/credits';
import Footer from 'components/landing/footer/footer';
import Screenshots from 'components/landing/screenshots/screenshots';
import AppBar from 'components/landing/appBar/appBar';
import Citing from 'components/landing/citing/citing';
import Features from 'components/landing/features/features';
import Home from 'components/landing/home/home';

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
