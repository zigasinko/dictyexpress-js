import React, { useEffect, useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { AppBar, Toolbar, Button } from '@material-ui/core';
import { NavHashLink } from 'react-router-hash-link';
import { ShortDescription } from '../AppBar/AppBar.styles';
import Container from '../common/Container.styles';

import { AppBarContainerMD, NavButtonMD } from './AppBarMD.styles';

/* const LinkBehavior = React.forwardRef<unknown, Omit<HashLinkProps, 'to'>>((props, ref) => (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <HashLink ref={ref} to="/getting-started/installation/" {...props} />
)); */

const AppBarMD = (): React.ReactElement => {
    const [, setActiveSectionHash] = useState('');
    const location = useLocation();
    const history = useHistory();

    useEffect(() => {
        setActiveSectionHash(location.hash);
    }, [location]);

    return (
        <>
            <AppBarContainerMD>
                <Container>
                    <AppBar position="relative" style={{ background: 'white' }}>
                        <Toolbar>
                            <NavButtonMD
                                smooth
                                component={NavHashLink}
                                to="#features"
                                activeClassName="selected"
                            >
                                Features
                            </NavButtonMD>
                            <NavButtonMD
                                smooth
                                component={NavHashLink}
                                to="#citing"
                                activeClassName="selected2"
                            >
                                Citing
                            </NavButtonMD>
                            {/* <Menu mode="horizontal" selectedKeys={['2']}>
                                <Menu.Item key="1" onClick={(): void => onClickHandle('')}>
                                    <a
                                        href="/"
                                        onClick={(event): void => {
                                            event.preventDefault();
                                        }}
                                    >
                                        Home
                                    </a>
                                </Menu.Item>
                                <Menu.Item
                                    key="2"
                                    onClick={(): void => onClickHandle(`#${SectionNames.FEATURES}`)}
                                >
                                    <a
                                        href={`#${SectionNames.FEATURES}`}
                                        onClick={(event): void => {
                                            event.preventDefault();
                                        }}
                                    >
                                        Features
                                    </a>
                                </Menu.Item>
                            </Menu> */}
                            <ShortDescription>
                                Analysis of gene expression in Dictyostelium
                            </ShortDescription>
                        </Toolbar>
                    </AppBar>
                </Container>
            </AppBarContainerMD>
        </>
    );
};

export default AppBarMD;
