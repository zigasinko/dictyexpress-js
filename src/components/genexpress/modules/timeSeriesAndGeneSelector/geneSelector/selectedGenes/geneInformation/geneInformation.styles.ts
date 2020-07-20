import styled from 'styled-components';

export const GeneInformationContainer = styled.div`
    min-width: 240px;
    max-width: 300px;
    border: 1px solid;
    padding: ${(props): string => `${props.theme.spacing(1)}px`};
    background-color: ${(props): string => props.theme.palette.background.paper};
`;

export const GeneInformationHeader = styled.div`
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-between;
    align-content: center;
    margin-bottom: 10px;
`;

export const GeneInformationTitle = styled.h3`
    margin: 0;
    display: flex;
    align-self: center;
`;

export const GeneInformationLabel = styled.div`
    color: #bdbdbd;
    margin-bottom: 5px;
`;

export const GeneInformationValue = styled.div`
    margin-bottom: 10px;
`;

export const DictyBaseLogo = styled.img`
    height: 25px;
`;
