import { SubdirectoryArrowRight } from '@material-ui/icons';
import styled from 'styled-components';

export const TermCellContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    position: relative;
    width: 100%;
    height: 100%;
`;

export const TermIndentationIcon = styled(SubdirectoryArrowRight)<{ depth: number }>`
    margin-left: ${(props): string => (props.depth * 15).toString()}px;
    font-size: 0.75rem;
`;
