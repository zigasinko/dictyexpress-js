import React, { ReactElement, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Menu, MenuItem, IconButton } from '@material-ui/core';
import { MoreVert as MoreIcon } from '@material-ui/icons';
import {
    NavButton,
    AppBarWrapper,
    ShortDescription,
    MobileSection,
    DesktopSection,
    ToolbarWrapper,
} from './appBar.styles';
import SectionNames from '../common/constants';
import { scrollToTargetAdjusted } from '../../../utils/documentHelpers';
import { appBarHeight } from '../../app/globalStyle';
import { ContentContainer } from '../common/layout.styles';

const scrollButtonsData = [
    {
        name: 'Home',
        sectionHash: '',
    },
    {
        name: 'Features',
        sectionHash: SectionNames.FEATURES,
    },
    {
        name: 'Screenshots',
        sectionHash: SectionNames.SCREENSHOTS,
    },
    {
        name: 'Citing',
        sectionHash: SectionNames.CITING,
    },
    {
        name: 'Contact',
        sectionHash: SectionNames.CONTACT,
    },
];

const AppBar = (): ReactElement => {
    const mobileMoreButtonElement = useRef(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const history = useHistory();

    const navigateToDictyExpress = (): void => {
        history.push(`/bcm`);
    };

    const closeMobileMenu = (): void => {
        setIsMobileMenuOpen(false);
    };

    const openMobileMenu = (): void => {
        setIsMobileMenuOpen(true);
    };

    const scrollToSection = (hash: string): void => {
        scrollToTargetAdjusted(hash, appBarHeight);
        closeMobileMenu();
    };

    const getScrollButton = (name: string, sectionHash: string): ReactElement => (
        <NavButton onClick={(): void => scrollToSection(sectionHash)}>{name}</NavButton>
    );

    const runDictyButton = <NavButton onClick={navigateToDictyExpress}>Run dictyExpress</NavButton>;

    const renderMobileMenu = (
        <Menu
            anchorEl={mobileMoreButtonElement.current}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            keepMounted
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            open={isMobileMenuOpen}
            onClose={closeMobileMenu}
        >
            {scrollButtonsData.map((buttonData) => (
                <MenuItem>{getScrollButton(buttonData.name, buttonData.sectionHash)}</MenuItem>
            ))}
            <MenuItem>{runDictyButton}</MenuItem>
        </Menu>
    );

    return (
        <>
            <AppBarWrapper position="fixed">
                <ContentContainer>
                    <ToolbarWrapper disableGutters>
                        <DesktopSection>
                            {scrollButtonsData.map((buttonData) =>
                                getScrollButton(buttonData.name, buttonData.sectionHash),
                            )}
                            {runDictyButton}
                            <ShortDescription>
                                Analysis of gene expression in <i>Dictyostelium</i>
                            </ShortDescription>
                        </DesktopSection>
                        <MobileSection>
                            <IconButton
                                ref={mobileMoreButtonElement}
                                aria-label="show more"
                                aria-haspopup="true"
                                onClick={openMobileMenu}
                                color="inherit"
                            >
                                <MoreIcon color="action" />
                            </IconButton>
                        </MobileSection>
                    </ToolbarWrapper>
                </ContentContainer>
            </AppBarWrapper>
            {renderMobileMenu}
        </>
    );
};

export default AppBar;
