import React, { ReactElement } from 'react';
import Button from '@material-ui/core/Button';
import { Gene } from '../../../../../../../redux/models/internal';
import {
    GeneInformationContainer,
    GeneInformationTitle,
    GeneInformationValue,
    GeneInformationLabel,
    DictyBaseLogo,
    GeneInformationHeader,
} from './geneInformation.styles';
import dictyBaseLogo from '../../../../../../../images/dictybase_logo2.jpg';

export interface GeneInformationProps {
    gene: Gene;
    highlighted?: boolean;
    onHighlight?: () => void;
    onUnhighlight?: () => void;
}
const GeneInformation = ({
    gene,
    onHighlight,
    onUnhighlight,
    highlighted,
}: GeneInformationProps): ReactElement => {
    return (
        <GeneInformationContainer>
            <GeneInformationHeader>
                <GeneInformationTitle>Gene information</GeneInformationTitle>
                {highlighted ? (
                    <Button
                        onClick={onUnhighlight}
                        color="secondary"
                        variant="contained"
                        size="small"
                    >
                        Unhighlight
                    </Button>
                ) : (
                    <Button
                        onClick={onHighlight}
                        color="secondary"
                        variant="contained"
                        size="small"
                    >
                        Highlight
                    </Button>
                )}
            </GeneInformationHeader>
            <p>{gene.name}</p>
            <div>
                <GeneInformationLabel>Alternatives:</GeneInformationLabel>
                <GeneInformationValue>{gene.aliases?.join(', ')}</GeneInformationValue>
            </div>
            <div>
                <GeneInformationLabel>Database link:</GeneInformationLabel>
                <GeneInformationValue>
                    <a
                        href={`http://dictybase.org/id/${gene.feature_id}`}
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        Open in dictyBase
                        <DictyBaseLogo src={dictyBaseLogo} alt="Open in dictyBase." />
                    </a>
                </GeneInformationValue>
            </div>
            <div>
                <GeneInformationLabel>Description:</GeneInformationLabel>
                <GeneInformationValue>{gene.description}</GeneInformationValue>
            </div>
        </GeneInformationContainer>
    );
};

export default GeneInformation;
