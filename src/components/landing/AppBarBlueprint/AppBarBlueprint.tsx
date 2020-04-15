import React, { useEffect, useState } from 'react';
import { Button } from '@blueprintjs/core';
import { useLocation, useHistory } from 'react-router-dom';
import { AppBarContainer, NavBar, ShortDescription, NavButton } from '../AppBar/AppBar.styles';
import Container from '../common/Container.styles';
import SectionNames from '../common/constants';
import { AppBarContainerBlueprint, NavButtonBlueprint } from './AppBarBlueprint.styles';

const AppBarBlueprint = (): React.ReactElement => {
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
            <AppBarContainerBlueprint>
                <Container>
                    <NavBar>
                        <NavButtonBlueprint
                            onClick={(): void => onClickHandle(`#${SectionNames.FEATURES}`)}
                            active={isActive(`#${SectionNames.FEATURES}`)}
                        >
                            Features
                        </NavButtonBlueprint>
                        <NavButtonBlueprint
                            onClick={(): void => onClickHandle(`#${SectionNames.CITING}`)}
                            active={isActive(`#${SectionNames.CITING}`)}
                        >
                            Citing
                        </NavButtonBlueprint>
                        <ShortDescription>
                            Analysis of gene expression in Dictyostelium
                        </ShortDescription>
                    </NavBar>
                </Container>
            </AppBarContainerBlueprint>
        </>
    );
};

export default AppBarBlueprint;
