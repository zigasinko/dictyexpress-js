import styled from 'styled-components';
import { AppBar } from '@material-ui/core';
import { Title } from 'components/landing/common/title.styles';
import { GetApp } from '@material-ui/icons';

export const GenexpressAppBarWrapper = styled(AppBar)`
    background-color: #fff;
`;

export const DesktopSectionContainer = styled.div`
    display: inline-flex;
    width: 100%;
    flex-flow: row wrap;
    justify-content: space-between;
`;

export const DictyLogo = styled.img`
    margin: 10px;
    height: 25px;
    width: 25px;
`;

export const LoggedInInformation = styled.div`
    color: black;
`;

export const TitleContainer = styled.div`
    display: inline-flex;
    flex-flow: row nowrap;
    align-items: center;
    padding-left: 10px;
`;

export const GenexpressTitle = styled(Title)`
    font-size: 1rem;
    padding: 0;
    margin: 0;
`;

export const ActionsContainer = styled.div`
    padding-right: 20px;
    display: inline-flex;
    flex-flow: row nowrap;
    align-items: center;
`;

export const DownloadIcon = styled(GetApp)`
    font-size: 1.2rem;
`;

export const BookmarkLinkContainer = styled.div`
    display: flex;
    align-items: center;
    padding: 15px;
    justify-content: space-between;
`;

export const BookmarkUrl = styled.a`
    margin-right: 24px;
`;
