import React, { ReactElement, ReactNode } from 'react';
import {
    ModuleHeader,
    ModuleContent,
    ModuleContainer,
    ModuleHeaderLoadingBar,
} from './dictyModule.styles';

type SelectedGenesProps = {
    children: ReactNode;
    title: string;
    isLoading: boolean;
};

const DictyModule = ({ children, title, isLoading }: SelectedGenesProps): ReactElement => {
    return (
        <ModuleContainer>
            <ModuleHeader className="dragHandle">
                {title}
                {isLoading && <ModuleHeaderLoadingBar color="secondary" />}
            </ModuleHeader>
            <ModuleContent>{children}</ModuleContent>
        </ModuleContainer>
    );
};

export default DictyModule;
