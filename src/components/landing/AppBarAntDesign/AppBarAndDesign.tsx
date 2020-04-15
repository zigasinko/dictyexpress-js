import React, { useEffect, useState } from 'react';
import { Menu, Row, Col } from 'antd';
import { useLocation, useHistory } from 'react-router-dom';
import { ShortDescription } from '../AppBar/AppBar.styles';
import Container from '../common/Container.styles';
import SectionNames from '../common/constants';
import AppBarContainerAntDesign from './AppBarAntDesign.styles';

const AppBarAntDesign = (): React.ReactElement => {
    const [, setActiveSectionHash] = useState('');
    const location = useLocation();
    const history = useHistory();

    useEffect(() => {
        setActiveSectionHash(location.hash);
    }, [location]);

    const onClickHandle = (hashFragment: string): void => {
        history.push(`/${hashFragment}`);
    };

    return (
        <>
            <AppBarContainerAntDesign>
                <Container>
                    <Row align="middle">
                        <Col span={14}>
                            <Menu mode="horizontal">
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
                            </Menu>
                        </Col>
                        <Col span={10}>
                            <ShortDescription>
                                Analysis of gene expression in Dictyostelium
                            </ShortDescription>
                        </Col>
                    </Row>
                </Container>
            </AppBarContainerAntDesign>
        </>
    );
};

export default AppBarAntDesign;
