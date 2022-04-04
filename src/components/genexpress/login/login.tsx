import React, { ReactElement, useState } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { RootState } from 'redux/rootReducer';
import { getIsLoggingIn } from 'redux/stores/authentication';
import { TextField, Button } from '@mui/material';
import { login } from 'redux/epics/epicsActions';
import {
    ModalHeader,
    ModalContainer,
    CenteredModal,
    ModalBody,
    ModalFooter,
} from '../common/dictyModal/dictyModal.styles';
import { LoadingBar } from '../common/dictyModule/dictyModule.styles';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const mapStateToProps = (state: RootState) => {
    return {
        isLoggingIn: getIsLoggingIn(state.authentication),
    };
};

const connector = connect(mapStateToProps, {
    connectedLogin: login,
});

type PropsFromRedux = ConnectedProps<typeof connector>;

type LoginProps = {
    closeModal: () => void;
} & PropsFromRedux;

const Login = ({ connectedLogin, isLoggingIn, closeModal }: LoginProps): ReactElement => {
    const [userData, setUserData] = useState<{ email: string; password: string }>({
        email: '',
        password: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const { name, value } = e.target;
        setUserData((previousUserData) => ({ ...previousUserData, [name]: value }));
    };

    const handleOnSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        connectedLogin(userData);
    };

    return (
        <CenteredModal
            open
            aria-labelledby="modalTitle"
            aria-describedby="modalDescription"
            onClose={closeModal}
        >
            <ModalContainer>
                <ModalHeader id="modalTitle">
                    Sign in
                    {isLoggingIn && <LoadingBar />}
                </ModalHeader>

                <ModalBody>
                    <form name="loginForm" id="loginForm" onSubmit={handleOnSubmit}>
                        <TextField
                            id="email"
                            name="email"
                            variant="outlined"
                            required
                            label="E-mail"
                            color="secondary"
                            size="small"
                            fullWidth
                            margin="normal"
                            onChange={handleChange}
                            value={userData.email}
                        />
                        <TextField
                            id="password"
                            name="password"
                            variant="outlined"
                            type="password"
                            label="Password"
                            color="secondary"
                            required
                            fullWidth
                            margin="normal"
                            autoComplete="current-password"
                            size="small"
                            onChange={handleChange}
                            value={userData.password}
                        />
                    </form>
                </ModalBody>
                <ModalFooter>
                    <Button
                        form="loginForm"
                        type="submit"
                        disabled={!userData.email || !userData.password}
                        data-testid="submit-credentials"
                    >
                        SIGN IN
                    </Button>
                    <Button onClick={closeModal}>Close</Button>
                </ModalFooter>
            </ModalContainer>
        </CenteredModal>
    );
};

export default connector(Login);
