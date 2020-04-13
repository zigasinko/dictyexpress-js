import React, { ReactElement } from 'react';
import Container from '../common/Container.styles';
import { HomeContainer } from './Home.styles';

const AppBar = (): ReactElement => (
    <HomeContainer id="home">
        <Container>
            orem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque quis lacus aliquet,
            suscipit ex et, vehicula sapien. Nulla gravida diam ac porttitor rhoncus. Sed fringilla,
            ipsum non cursus imperdiet, quam lacus euismod ipsum, sed faucibus lacus lectus vitae
            justo. Quisque quis est sed tellus tincidunt aliquet. Proin sit amet velit neque. Sed ut
            dolor nunc. Duis lacinia magna quis odio pellentesque, nec fringilla ex suscipit. Nam
            eros lectus, mattis sed scelerisque quis, sollicitudin ut sem. Sed vitae erat eget
            mauris hendrerit consequat sed nec urna. Pellentesque sit amet gravida lorem.
            Pellentesque purus nisi, dapibus luctus sem non, convallis tempor sapien. Maecenas
            tellus risus, vehicula at luctus eget, auctor id lectus. Phasellus convallis justo non
            volutpat aliquam. Nullam ut maximus elit. Duis fringilla sit amet risus at feugiat.
            Morbi a purus dignissim, pulvinar erat sed, lobortis ante. In ante mauris, convallis
            eget velit a, venenatis convallis dolor. Morbi a ultrices diam, id commodo odio.
            Curabitur vestibulum sem ornare, elementum ante at, faucibus sapien. Nam eleifend, mi eu
            hendrerit hendrerit, erat nunc dapibus enim, a pharetra lacus lorem eget mauris. Donec
            dignissim felis at tristique maximus. Vivamus pellentesque nisl sapien, et tempus enim
            rutrum id. Aliquam enim purus, suscipit sed nisl non, vehicula tincidunt eros. Fusce eu
            dolor lorem. Praesent a tellus gravida ligula rhoncus semper quis sit amet diam.
        </Container>
    </HomeContainer>
);

export default AppBar;
