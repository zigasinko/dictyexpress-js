import React, { ReactElement, useState, useEffect } from 'react';
import { Button, Tooltip } from '@material-ui/core';
import dictyLogo from 'images/favicon.ico';
import { connect, ConnectedProps } from 'react-redux';
import { RootState } from 'redux/rootReducer';
import { User } from '@genialis/resolwe/dist/api/types/rest';
import { getUser, getIsLoggedIn } from 'redux/stores/authentication';
import DictyAppBar from 'components/common/dictyAppBar/dictyAppBar';
import { layoutsReset } from 'redux/stores/layouts';
import { logout } from 'redux/epics/epicsActions';
import {
    getIsFetchingDifferentialExpressions,
    getIsFetchingDifferentialExpressionsData,
} from 'redux/stores/differentialExpressions';
import { getTimeSeriesIsFetching, getIsAddingToBasket } from 'redux/stores/timeSeries';
import { getIsFetchingSamplesExpressions } from 'redux/stores/samplesExpressions';
import { getIsFetchingGOEnrichmentJson } from 'redux/stores/gOEnrichment';
import {
    GenexpressAppBarWrapper,
    DictyLogo,
    TitleContainer,
    GenexpressTitle,
    DesktopSectionContainer,
    ActionsContainer,
    DownloadIcon,
} from './genexpressAppBar.styles';
import Login from '../login/login';
import { LoadingBar } from '../common/dictyModule/dictyModule.styles';
import * as reportBuilder from '../common/reportBuilder/reportBuilder';
import IconButtonWithTooltip from '../common/iconButtonWithTooltip/iconButtonWithTooltip';

const mapStateToProps = (
    state: RootState,
): {
    user: User;
    isLoggedIn: boolean;
    isFetchingDifferentialExpressions: boolean;
    isFetchingDifferentialExpressionsData: boolean;
    isFetchingTimeSeries: boolean;
    isAddingToBasket: boolean;
    isFetchingSamplesExpressions: boolean;
    isFetchingGOEnrichmentJson: boolean;
} => {
    return {
        user: getUser(state.authentication),
        isLoggedIn: getIsLoggedIn(state.authentication),
        isFetchingDifferentialExpressions: getIsFetchingDifferentialExpressions(
            state.differentialExpressions,
        ),
        isFetchingDifferentialExpressionsData: getIsFetchingDifferentialExpressionsData(
            state.differentialExpressions,
        ),
        isFetchingTimeSeries: getTimeSeriesIsFetching(state.timeSeries),
        isAddingToBasket: getIsAddingToBasket(state.timeSeries),
        isFetchingSamplesExpressions: getIsFetchingSamplesExpressions(state.samplesExpressions),
        isFetchingGOEnrichmentJson: getIsFetchingGOEnrichmentJson(state.gOEnrichment),
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
    isFetchingDifferentialExpressions,
    isFetchingDifferentialExpressionsData,
    isFetchingTimeSeries,
    isAddingToBasket,
    isFetchingSamplesExpressions,
    isFetchingGOEnrichmentJson,
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

    const handleExportClick = (): void => {
        reportBuilder.exportToZip();
    };

    const areExportingModulesLoading =
        isFetchingDifferentialExpressions ||
        isFetchingDifferentialExpressionsData ||
        isFetchingTimeSeries ||
        isAddingToBasket ||
        isFetchingSamplesExpressions ||
        isFetchingGOEnrichmentJson;

    const desktopSection = (
        <DesktopSectionContainer>
            <TitleContainer>
                <DictyLogo src={dictyLogo} alt="dictyExpress logo" />
                <GenexpressTitle>dictyExpress</GenexpressTitle>
            </TitleContainer>
            <ActionsContainer>
                <IconButtonWithTooltip
                    title={
                        areExportingModulesLoading
                            ? 'Export will be available when all modules are loaded.'
                            : 'Export'
                    }
                    disabled={areExportingModulesLoading}
                    onClick={handleExportClick}
                >
                    <DownloadIcon />
                </IconButtonWithTooltip>
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
