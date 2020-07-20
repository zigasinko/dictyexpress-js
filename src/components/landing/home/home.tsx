import React, { ReactElement } from 'react';
import { SectionContentContainer } from '../common/layout.styles';
import {
    HomeContainer,
    HomeWrapper,
    HomeRunDictyButton,
    HomeDescription,
    HomeDemo,
} from './home.styles';
import dictyLogo from '../../../images/logo_dicty.1.png';
import dictyDemo from '../../../images/Time-Courses.gif';

const Home = (): ReactElement => (
    <HomeContainer id="home">
        <SectionContentContainer>
            <HomeWrapper>
                <HomeDescription>
                    <img src={dictyLogo} alt="dictyExpress logo" />
                    <h1>dictyExpress</h1>
                    <p>
                        An interactive, exploratory data analytics web-app that provides access to
                        gene expression experiments in <i>Dictyostelium</i> by Baylor College of
                        Medicine.
                    </p>
                    <p>
                        <HomeRunDictyButton variant="outlined">
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
