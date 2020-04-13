import React, { ReactElement } from 'react';
import SectionNames from '../common/constants';
import Container from '../common/Container.styles';
import { Title } from '../common/Title.styles';

const Citing = (): ReactElement => (
    <Container id={SectionNames.CITING}>
        <Title>Citing dictyExpress</Title>
        <p>
            Stajdohar M, Rosengarten RD, Kokosar J, Jeran L, Blenkus D, Shaulsky G, Zupan B.{' '}
            <a href="https://bmcbioinformatics.biomedcentral.com/articles/10.1186/s12859-017-1706-9">
                &quot;dictyExpress: a web-based platform for sequence data management and analytics
                in <i>Dictyostelium</i> and beyond.&quot;
            </a>{' '}
            BMC Bioinformatics. 2017. 18(1):291
        </p>
    </Container>
);

export default Citing;
