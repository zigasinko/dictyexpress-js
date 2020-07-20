import React, { ReactElement, ReactNode } from 'react';
import { ModuleHeader, ModuleContent, ModuleContainer } from './dictyModule.styles';

type SelectedGenesProps = {
    children: ReactNode;
    title: string;
};

const DictyModule = ({ children, title }: SelectedGenesProps): ReactElement => {
    return (
        <ModuleContainer>
            <ModuleHeader className="dragHandle">{title}</ModuleHeader>
            <ModuleContent>{children}</ModuleContent>
        </ModuleContainer>
    );
};

export default DictyModule;
