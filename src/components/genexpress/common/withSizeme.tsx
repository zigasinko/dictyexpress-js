/* eslint-disable react/jsx-props-no-spreading */
import React, { FC, forwardRef, ReactElement } from 'react';
import { SizeMe } from 'react-sizeme';

/**
 * react-sizeme withSize HOC doesn't forward refs. That's why we need a custom one.
 * @param Component - Component to track size is tracked (size property is injected).
 */
const withSizeme = <P,>(
    Component: FC<P>,
): React.ForwardRefExoticComponent<
    React.PropsWithoutRef<Pick<P, Exclude<keyof P, 'size'>>> & React.RefAttributes<unknown>
> =>
    forwardRef(({ ...props }: Pick<P, Exclude<keyof P, 'size'>>, ref): ReactElement => {
        return (
            <SizeMe refreshRate={100} refreshMode="debounce" monitorHeight>
                {({ size }): ReactElement => <Component size={size} {...(props as P)} ref={ref} />}
            </SizeMe>
        );
    });

export default withSizeme;
