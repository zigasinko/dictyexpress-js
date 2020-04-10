import * as React from 'react';
import { Button } from '@progress/kendo-react-buttons';
import { AppBarContainer, NavBar, ShortDescription } from './AppBar.styles';
import { Container } from '../Container.styles';

const AppBar: React.FunctionComponent = () => (
    <AppBarContainer>
        <Container>
            <NavBar>
                <Button look="flat">Home</Button>
                <Button look="flat">Screenshots</Button>
                <Button look="flat">Citing</Button>
                <Button look="flat">Contact</Button>
                <Button look="flat">Run dictyExpress</Button>
                <ShortDescription>Analysis of gene expression in Dictyostelium</ShortDescription>
            </NavBar>
        </Container>
    </AppBarContainer>
);

export default AppBar;
