import React, { ReactElement } from 'react';
import SectionNames from '../common/constants';
import {
    SectionContentContainer,
    AlignCenter,
    DarkSectionContainer,
} from '../common/layout.styles';
import { Title } from '../common/title.styles';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import experimentAndGeneSelection from '../../../images/modules/ExperimentAndGeneSelection.png';
import expressionTC from '../../../images/modules/ExpressionTC.png';
import hierarchicalClusteringImage from '../../../images/modules/HierarchicalClustering.png';
import geneOntologyImage from '../../../images/modules/GeneOntology.png';
import volcanoPlotImage from '../../../images/modules/VolcanoPlot.png';
import volcanoPlotSelection from '../../../images/modules/VolcanoPlotSelection.png';
import experimentComparison from '../../../images/modules/ExperimentComparison.png';
// eslint-disable-next-line import/no-cycle
import { Arrow, Screenshot, SliderContainer } from './screenshots.styles';

const SliderArrow = ({ onClick, type }: SliderArrowProps): JSX.Element => (
    <Arrow
        onClick={onClick}
        type={type}
        className={`k-icon ${
            type === 'next' ? 'k-i-arrow-chevron-right' : 'k-i-arrow-chevron-left'
        }`}
    />
);

export type SliderArrowProps = {
    onClick?: (event: React.MouseEvent<HTMLSpanElement>) => void | undefined;
    type: 'previous' | 'next';
};

const Screenshots = (): ReactElement => {
    return (
        <DarkSectionContainer>
            <SectionContentContainer id={SectionNames.SCREENSHOTS} centerText>
                <Title>Screenshots</Title>
                <AlignCenter>
                    <SliderContainer
                        dots={false}
                        infinite
                        speed={500}
                        slidesToShow={1}
                        slidesToScroll={1}
                        nextArrow={<SliderArrow type="next" />}
                        prevArrow={<SliderArrow type="previous" />}
                    >
                        <div>
                            <Screenshot
                                src={experimentAndGeneSelection}
                                alt="Experiment and Gene Selection module"
                            />
                            <p>
                                The <b>Experiment and Gene selection module</b> sets the experiment
                                and a set of genes for the analysis.
                            </p>
                        </div>
                        <div>
                            <Screenshot src={expressionTC} alt="Expression Time Courses module" />
                            <p>
                                The <b>Expression Time Courses module</b> displays the gene
                                expression profiles (time-series) of selected genes.
                            </p>
                        </div>
                        <div>
                            <Screenshot
                                src={hierarchicalClusteringImage}
                                alt="Hierarchical Clustering module"
                            />
                            <p>
                                The <b>Hierarchical Clustering module</b> displays a clustering
                                dendrogram and a heatmap for a selected set of genes. Clustering is
                                computed on gene expression profile curves.
                            </p>
                        </div>
                        <div>
                            <Screenshot
                                src={geneOntologyImage}
                                alt="Gene Ontology Enrichment module"
                            />
                            <p>
                                The <b>Gene Ontology Enrichment module</b> computes an enrichment
                                score for selected genes and displays the associated Gene Ontology
                                terms.
                            </p>
                        </div>
                        <div>
                            <Screenshot
                                src={volcanoPlotImage}
                                alt="Differential Expression module"
                            />
                            <p>
                                The <b>Differential Expression module</b> displays significant
                                changes in expression. The x-axis indicates the fold change and the
                                y-axis indicates the level of confidence.
                            </p>
                        </div>
                        <div>
                            <Screenshot
                                src={volcanoPlotSelection}
                                alt="Differential Expression - Selection module"
                            />
                            <p>
                                In the <b>Differential Expression -Selection module</b> you can make
                                a rough selection by clicking & dragging. After that the
                                Differential Expression - Selection window appears where you can
                                filter and select the genes.
                            </p>
                        </div>
                        <div>
                            <Screenshot
                                src={experimentComparison}
                                alt="Experiment Comparison module"
                            />
                            <p>
                                The <b>Experiment Comparison module</b> helps you compare gene
                                expressions across experiments.
                            </p>
                        </div>
                    </SliderContainer>
                </AlignCenter>
            </SectionContentContainer>
        </DarkSectionContainer>
    );
};

export default Screenshots;
