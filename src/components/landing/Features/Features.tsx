import React, { ReactElement } from 'react';
import Container from '../common/Container.styles';
import { Title } from '../common/Title.styles';
import { FeaturesWrapper } from './Features.styles';
import timeCoursesImage from '../../../images/feature1.png';
import dendrogramImage from '../../../images/feature2.png';
import dnkImage from '../../../images/feature3.png';
import mouseClickImage from '../../../images/feature4.png';
import SectionNames from '../common/constants';
import Feature from './Feature';

const Features = (): ReactElement => (
    <Container id={SectionNames.FEATURES}>
        <Title>Features</Title>
        <FeaturesWrapper>
            <Feature imageSrc={timeCoursesImage} name="Time courses">
                Plot and explore RNA-seq gene expressions of <i>D. discoideum</i> and{' '}
                <i>D. purpureum</i>
            </Feature>
            <Feature imageSrc={dendrogramImage} name="Dendrogram">
                Find clusters of expressed genes and play with Gene Ontology enrichment analysis
            </Feature>
            <Feature imageSrc={dnkImage} name="DNK">
                Compare gene expression across different strains and explore cell-type specific
                expressions
            </Feature>
            <Feature imageSrc={mouseClickImage} name="Mouse click">
                Interactive design with clickable plots where selections propagate to other modules
            </Feature>
        </FeaturesWrapper>
    </Container>
);

export default Features;
