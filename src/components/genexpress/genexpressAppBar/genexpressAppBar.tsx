import React, { ReactElement, useState, useEffect } from 'react';
import { Button, Tooltip } from '@material-ui/core';
import dictyLogo from 'images/favicon.ico';
import { connect, ConnectedProps } from 'react-redux';
import { RootState } from 'redux/rootReducer';
import { User } from '@genialis/resolwe/dist/api/types/rest';
import { getUser, getIsLoggedIn } from 'redux/stores/authentication';
import { logout } from 'redux/epics/authenticationEpics';
import DictyAppBar from 'components/common/dictyAppBar/dictyAppBar';
import { layoutsReset } from 'redux/stores/layouts';
import {
    GenexpressAppBarWrapper,
    DictyLogo,
    TitleContainer,
    GenexpressTitle,
    DesktopSectionContainer,
    ActionsContainer,
} from './genexpressAppBar.styles';
import Login from '../login/login';
import { LoadingBar } from '../common/dictyModule/dictyModule.styles';

const mapStateToProps = (state: RootState): { user: User; isLoggedIn: boolean } => {
    return {
        user: getUser(state.authentication),
        isLoggedIn: getIsLoggedIn(state.authentication),
    };
};

const connector = connect(mapStateToProps, {
    connectedLogout: logout,
    connectedLayoutsReset: layoutsReset,
});

type PropsFromRedux = ConnectedProps<typeof connector>;

type GenexpressAppBarProps = {
    isLoading: boolean;
} & PropsFromRedux;

const GenexpressAppBar = ({
    user,
    isLoggedIn,
    isLoading,
    connectedLogout,
    connectedLayoutsReset,
}: GenexpressAppBarProps): ReactElement => {
    const [loginModalOpened, setLoginModalOpened] = useState(false);

    useEffect(() => {
        if (isLoggedIn) {
            setLoginModalOpened(false);
        }
    }, [isLoggedIn]);

    const handleLoginClick = (): void => {
        setLoginModalOpened((previousLoginModalOpened) => !previousLoginModalOpened);
    };

    const handleLogoutClick = (): void => {
        connectedLogout();
    };

    const handleDefaultLayoutClick = (): void => {
        connectedLayoutsReset();
    };

    const desktopSection = (
        <DesktopSectionContainer>
            <TitleContainer>
                <DictyLogo src={dictyLogo} alt="dictyExpress logo" />
                <GenexpressTitle>dictyExpress</GenexpressTitle>
            </TitleContainer>
            <ActionsContainer>
                <Button onClick={handleDefaultLayoutClick}>Default layout</Button>
                {isLoggedIn ? (
                    <Tooltip title="Logout">
                        <Button onClick={handleLogoutClick}>
                            {user.first_name} {user.last_name}
                        </Button>
                    </Tooltip>
                ) : (
                    <Button onClick={handleLoginClick}>Login</Button>
                )}
            </ActionsContainer>
            {isLoading && <LoadingBar />}
        </DesktopSectionContainer>
    );

    return (
        <>
            <GenexpressAppBarWrapper position="sticky">
                <DictyAppBar desktopSection={desktopSection} />
            </GenexpressAppBarWrapper>
            {loginModalOpened && <Login closeModal={(): void => setLoginModalOpened(false)} />}
        </>
    );
};

export default connector(GenexpressAppBar);
