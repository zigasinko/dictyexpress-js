import { FooterControlsContainer } from 'components/genexpress/common/dictyModal/dictyModal.styles';
import styled from 'styled-components';

export const AssociationsGridWrapper = styled.div`
    height: 400px;
`;

export const GOEnrichmentFooterControlsContainer = styled(FooterControlsContainer)`
    justify-content: flex-end;
`;

export const TermInfo = styled.h2`
    margin: 0 0 10px 0;
`;

export const AmigoLink = styled.a`
    margin-left: 1ex;

    & img {
        height: 20px;
        position: relative;
        top: 3px;
    }
`;
