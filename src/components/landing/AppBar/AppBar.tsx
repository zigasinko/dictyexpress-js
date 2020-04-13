import React, { useEffect, useState } from 'react';
import { Button } from '@progress/kendo-react-buttons';
import { useLocation, useHistory } from 'react-router-dom';
import { AppBarContainer, NavBar, ShortDescription, AppBarSpacer } from './AppBar.styles';
import Container from '../common/Container.styles';
import SectionNames from '../common/constants';

const AppBar = (): React.ReactElement => {
    const [activeSectionHash, setActiveSectionHash] = useState('');
    const location = useLocation();
    const history = useHistory();

    useEffect(() => {
        setActiveSectionHash(location.hash);
    }, [location]);

    const isActive = (sectionName: string): boolean => activeSectionHash === sectionName;

    const onClickHandle = (hashFragment: string): void => {
        history.push(`/${hashFragment}`);
    };

    return (
        <>
            <AppBarContainer>
                <Container>
                    <NavBar>
                        <Button
                            look="bare"
                            primary={isActive('')}
                            onClick={(): void => onClickHandle('')}
                        >
                            Home
                        </Button>
                        <Button
                            look="flat"
                            primary={isActive(`#${SectionNames.FEATURES}`)}
                            onClick={(): void => onClickHandle(`#${SectionNames.FEATURES}`)}
                        >
                            Features
                        </Button>
                        <Button
                            look="flat"
                            primary={isActive(`#${SectionNames.SCREENSHOTS}`)}
                            onClick={(): void => onClickHandle(`#${SectionNames.SCREENSHOTS}`)}
                        >
                            Screenshots
                        </Button>
                        <Button
                            look="flat"
                            primary={isActive(`#${SectionNames.CITING}`)}
                            onClick={(): void => onClickHandle(`#${SectionNames.CITING}`)}
                        >
                            Citing
                        </Button>
                        <ShortDescription>
                            Analysis of gene expression in Dictyostelium
                        </ShortDescription>
                    </NavBar>
                </Container>
            </AppBarContainer>
            <AppBarSpacer />
        </>
    );
};

export default AppBar;
