import React, { ReactElement, useState, useEffect, useRef } from 'react';
import { Button, Popover, Tooltip } from '@material-ui/core';
import { Bookmark as BookmarkIcon } from '@material-ui/icons';
import dictyLogo from 'images/favicon.ico';
import { connect, ConnectedProps, useStore } from 'react-redux';
import { RootState } from 'redux/rootReducer';
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
import { saveBookmarkState } from 'managers/bookmarkStateManager';
import { setClipboardText } from 'utils/documentHelpers';
import {
    GenexpressAppBarWrapper,
    DictyLogo,
    TitleContainer,
    GenexpressTitle,
    DesktopSectionContainer,
    ActionsContainer,
    DownloadIcon,
    BookmarkLinkContainer,
    BookmarkUrl,
} from './genexpressAppBar.styles';
import Login from '../login/login';
import { LoadingBar } from '../common/dictyModule/dictyModule.styles';
import * as reportBuilder from '../common/reportBuilder/reportBuilder';
import IconButtonWithTooltip from '../common/iconButtonWithTooltip/iconButtonWithTooltip';
import TextInputModal from '../common/textInputModal/textInputModal';
import { ModalHeader } from '../common/dictyModal/dictyModal.styles';
import { DictyUrlQueryParameter } from '../common/constants';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const mapStateToProps = (state: RootState) => {
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
    const [exportPrefixModalOpened, setExportPrefixModalOpened] = useState(false);
    const [bookmarkPopoverOpened, setBookmarkPopoverOpened] = useState(false);
    const store = useStore();
    const bookmarkButtonElement = useRef<HTMLButtonElement>(null);
    const [bookmark, setBookmark] = useState('');

    useEffect(() => {
        if (isLoggedIn) {
            setLoginModalOpened(false);
        }
    }, [isLoggedIn]);

    /**
     * Execute export once user clicks on Export button in export prefix modal.
     */
    const handleExportPrefix = (prefix: string): void => {
        void reportBuilder.exportToZip(prefix);
    };

    const handleBookmarkClick = async (): Promise<void> => {
        const url = new URL(window.location.href);

        url.searchParams.set(
            DictyUrlQueryParameter.appState,
            await saveBookmarkState(store.getState()),
        );
        /* const url = updateUrlParameter(
        window.location.href,
        DictyUrlQueryParameter.appState,
        await saveBookmarkState(store.getState()),
    ); */
        setBookmark(url.toString());
        setBookmarkPopoverOpened(true);
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
                    title="Bookmark"
                    onClick={handleBookmarkClick}
                    disabled={isFetchingTimeSeries}
                    ref={bookmarkButtonElement}
                >
                    <BookmarkIcon />
                </IconButtonWithTooltip>
                <IconButtonWithTooltip
                    title={
                        areExportingModulesLoading
                            ? 'Export will be available when all modules are loaded.'
                            : 'Export'
                    }
                    disabled={areExportingModulesLoading}
                    onClick={(): void => {
                        setExportPrefixModalOpened(true);
                    }}
                >
                    <DownloadIcon />
                </IconButtonWithTooltip>
                <Button onClick={connectedLayoutsReset}>Default layout</Button>
                {isLoggedIn ? (
                    <Tooltip title="Logout">
                        <Button
                            onClick={(): void => {
                                connectedLogout();
                            }}
                        >
                            {user.first_name} {user.last_name}
                        </Button>
                    </Tooltip>
                ) : (
                    <Button
                        onClick={(): void => {
                            setLoginModalOpened(true);
                        }}
                    >
                        Login
                    </Button>
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
            {exportPrefixModalOpened && (
                <TextInputModal
                    title="Export"
                    placeholder="Optional prefix of exported files"
                    confirmButtonLabel="Export"
                    validationRegex={/^[A-Za-z0-9 .\-_()[\]]*$/}
                    onClose={(): void => setExportPrefixModalOpened(false)}
                    onConfirm={handleExportPrefix}
                />
            )}
            <Popover
                id="bookmarkPopover"
                open={bookmarkPopoverOpened}
                anchorEl={bookmarkButtonElement.current}
                onClose={(): void => {
                    setBookmarkPopoverOpened(false);
                }}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
            >
                <ModalHeader>Bookmark URL</ModalHeader>
                <BookmarkLinkContainer>
                    <BookmarkUrl href={bookmark} rel="noopener noreferrer" target="_blank">
                        {bookmark}
                    </BookmarkUrl>
                    <Button
                        type="button"
                        onClick={(): void => {
                            setClipboardText(bookmark);
                        }}
                    >
                        Copy
                    </Button>
                </BookmarkLinkContainer>
            </Popover>
        </>
    );
};

export default connector(GenexpressAppBar);
