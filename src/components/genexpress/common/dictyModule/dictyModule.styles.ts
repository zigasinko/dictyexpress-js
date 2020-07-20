import styled from 'styled-components';

export const ModuleContainer = styled.div`
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.6);
    height: 100%;
`;

export const ModuleHeader = styled.div`
    width: 100%;
    font-size: 1rem;
    background-color: #eee;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    cursor: pointer;
    text-align: center;
    padding: 5px 0;
    position: absolute;
    top: 0;
    left: 0;
`;

export const ModuleContent = styled.div`
    position: absolute;
    top: 30px;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 10px 10px 10px;
    box-sizing: border-box;
`;
