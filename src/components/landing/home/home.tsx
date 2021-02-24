import React, { ReactElement } from 'react';
import dictyLogo from 'images/logo_dicty.1.png';
import dictyDemo from 'images/Time-Courses.gif';
import { SectionContentContainer } from 'components/landing/common/layout.styles';
import { Version } from 'components/common/version';
import {
    HomeContainer,
    HomeWrapper,
    HomeRunDictyButton,
    HomeDescription,
    HomeDemo,
} from './home.styles';

const Home = (): ReactElement => (
    <HomeContainer id="home">
        <SectionContentContainer>
            <HomeWrapper>
                <HomeDescription>
                    <img src={dictyLogo} alt="dictyExpress logo" />
                    <section className="title">
                        <h1 className="header">{process.env.REACT_APP_NAME}</h1>
                        <Version />
                    </section>
                    <p>
                        An interactive, exploratory data analytics web-app that provides access to
                        gene expression experiments in <i>Dictyostelium</i> by Baylor College of
                        Medicine.
                    </p>
                    <p>
                        <HomeRunDictyButton variant="outlined" role="button" name="enter-app">
                            <a href="/bcm/">Run dictyExpress</a>
                        </HomeRunDictyButton>
                    </p>
                </HomeDescription>
                <HomeDemo>
                    <img src={dictyDemo} alt="Expression Time Series demo" />
                </HomeDemo>
            </HomeWrapper>
        </SectionContentContainer>
    </HomeContainer>
);

export default Home;
