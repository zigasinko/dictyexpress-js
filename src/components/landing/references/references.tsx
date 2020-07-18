import React, { ReactElement } from 'react';
import { SectionContentContainer } from 'components/landing/common/layout.styles';
import { Title } from 'components/landing/common/title.styles';
import SectionNames from 'components/landing/common/constants';
import { ReferencesContainer } from './references.styles';
import Reference from './reference';

const References = (): ReactElement => (
    <SectionContentContainer id={SectionNames.REFERENCES}>
        <Title>References</Title>
        <ReferencesContainer>
            <Reference
                authors="Rosengarten RD, Santhanam B, Kokosar J, Shaulsky G"
                source="Genes|Genomes|Genetics (G3) 2017"
            >
                <a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5295588/">
                    The long noncoding RNA transcriptome of <i>Dictyostelium discoideum</i>{' '}
                    development
                </a>
            </Reference>
            <Reference
                authors="Chen X, Köllner TG, Jia Q, Norris A, Santhanam B, Rabe P, Dickschat JS, Shaulsky G, Gershenzon J, Chen F"
                source="PNAS 2016"
            >
                <a href="https://www.ncbi.nlm.nih.gov/pubmed/27790999">
                    Terpene synthase genes in eukaryotes beyond <br />
                    plants and fungi: Occurrence in social amoebae
                </a>
            </Reference>
            <Reference
                authors="Santhanam B, Cai H, Devreotes PN, Shaulsky G, Katoh-Kurasawa M"
                source="Nature Communications 2015"
            >
                <a href="https://www.ncbi.nlm.nih.gov/pubmed/26144553">
                    The GATA transcription factor GtaC regulates early developmental gene expression
                    dynamics in <i>Dictyostelium</i>
                </a>
            </Reference>
            <Reference
                authors="Parikh A, Miranda ER, Katoh-Kurasawa M, Fuller D, Rot G, Zagar L, Curk T, Sucgang R, Chen R, Zupan B, Loomis WF, Kuspa A, Shaulsky G"
                source="Genome Biology 2010"
            >
                <a href="http://genomebiology.com/2010/11/3/R35">
                    Conserved developmental transcriptomes <br /> in evolutionary divergent species
                </a>
            </Reference>
            <Reference
                authors="Rot G, Parikh A, Curk T, Kuspa A, Shaulsky G, Zupan B"
                source="BMC Bioinformatics 2009"
            >
                <a href="http://www.biomedcentral.com/1471-2105/10/265">
                    dictyExpress: A <i>Dictyostelium discoideum</i> gene expression database with an
                    explorative data analysis web-based interface
                </a>
            </Reference>
        </ReferencesContainer>
    </SectionContentContainer>
);

export default References;
