import styled from 'styled-components';

// eslint-disable-next-line import/prefer-default-export
export const SelectedGenesContainer = styled.div`
    width: 100%;
    display: flex;
    flex-flow: row wrap;
    max-height: 90px;
    overflow-y: auto;
`;

export const ActionsContainer = styled.div`
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
`;

export const ActionIconStyle = styled.span`
    font-size: 16px;
    margin-left: 10px;
    color: white;
`;
