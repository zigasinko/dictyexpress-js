import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import GeneExpressGrid from 'components/genexpress/geneExpressGrid';
import { customRender, waitForButtonEnabled } from 'tests/test-utils';
import { testState } from 'tests/mock';
import * as documentHelpers from 'utils/documentHelpers';

jest.setTimeout(10000);
describe('reportBuilder integration', () => {
    beforeEach(() => {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        window.URL.createObjectURL = jest.fn();
        // eslint-disable-next-line @typescript-eslint/unbound-method
        window.URL.revokeObjectURL = jest.fn();
    });

    it('should download zip after export is clicked', async () => {
        const initialState = testState();
        customRender(<GeneExpressGrid />, {
            initialState,
        });

        // There is no clean way to unit test file download, so all we can do is spy on saveAs
        // (documentHelpers) method.
        const saveAsSpy = jest.spyOn(documentHelpers, 'saveAs').mockImplementation(() => {});

        await waitForButtonEnabled(() => screen.getByLabelText('Export'));

        // Export button in app bar.
        fireEvent.click(screen.getByLabelText('Export'));

        // Export button in prefix modal.
        fireEvent.click(await screen.findByRole('button', { name: 'Export' }));

        expect(screen.queryByTestId('GetAppIcon')).toBeNull();
        screen.getByRole('progressbar');

        await waitFor(() => {
            expect(saveAsSpy).toBeCalled();
        });

        screen.getByTestId('GetAppIcon');
        expect(screen.queryByRole('progressbar')).toBeNull();
    });
});
