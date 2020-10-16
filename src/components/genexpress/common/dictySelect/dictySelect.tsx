import { FormControl, InputLabel, Select } from '@material-ui/core';
import React, { ChangeEvent, ReactElement, ReactNode } from 'react';
import { generateRandomString } from 'utils/stringUtils';

type DictySelectProps = {
    children: ReactNode;
    label: string;
    value: unknown;
    disabled?: boolean;
    handleOnChange: (event: ChangeEvent<{ value: unknown }>) => void;
};

const labelId = `${generateRandomString(5)}Label`;

const DictySelect = ({
    children,
    label,
    value,
    handleOnChange,
    disabled,
}: DictySelectProps): ReactElement => {
    return (
        <FormControl variant="outlined">
            <InputLabel id={labelId}>{label}</InputLabel>
            <Select
                labelId={labelId}
                value={value}
                onChange={handleOnChange}
                label={label}
                disabled={disabled}
            >
                {children}
            </Select>
        </FormControl>
    );
};

export default DictySelect;
