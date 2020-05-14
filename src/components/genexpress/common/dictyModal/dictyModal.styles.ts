import styled from 'styled-components';
import { Modal } from '@material-ui/core';

export const CenteredModal = styled(Modal)`
    display: flex;
    align-items: center;
    justify-content: center;
`;

export const ModalContainer = styled.div`
    background-color: ${(props): string => props.theme.palette.background.paper};
    width: 600px;
`;

export const ModalHeader = styled.h3`
    border-bottom: 1px solid #e5e5e5;
    min-height: 16px;
    margin: 0;
    padding: 15px;
`;

export const ModalBody = styled.div`
    position: relative;
    padding: 15px;
`;

export const ModalFooter = styled.div`
    padding: 15px;
    text-align: right;
    border-top: 1px solid #e5e5e5;
`;
