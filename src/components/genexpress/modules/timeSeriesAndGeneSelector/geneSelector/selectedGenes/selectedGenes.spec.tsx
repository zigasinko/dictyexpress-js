import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { customRender } from 'tests/test-utils';
import { generateGene, mockStore, testState } from 'tests/mock';
import { allGenesDeselected } from 'redux/stores/genes';
import { BasketInfoData } from 'components/genexpress/common/constants';
import SelectedGenes from './selectedGenes';

const initialTestState = testState();
const testGenes = [generateGene(0), generateGene(1)];

initialTestState.timeSeries.selectedSamplesInfo = {
    source: BasketInfoData.SOURCE,
    species: BasketInfoData.SPECIES,
    type: 'gene',
};
initialTestState.selectedGenes.byId = {
    [testGenes[0].name]: testGenes[0],
    [testGenes[1].name]: testGenes[1],
};

const mockedStore = mockStore(initialTestState);

Object.assign(navigator, {
    clipboard: {
        writeText: (): void => {},
    },
});

describe('selectedGenes', () => {
    it('should show genes', () => {
        customRender(<SelectedGenes selectedGenes={testGenes} highlightedGenesNames={[]} />, {
            mockedStore,
        });

        // All genes should be visible.
        testGenes.forEach((gene) => screen.getByText(gene.name));
    });

    it('should copy selected genes names', () => {
        customRender(<SelectedGenes selectedGenes={testGenes} highlightedGenesNames={[]} />, {
            mockedStore,
        });

        const clipboardSpy = jest.spyOn(navigator.clipboard, 'writeText');

        fireEvent.click(screen.getByLabelText(`Copy ${testGenes.length} genes to clipboard`));

        // All genes should be visible.
        expect(clipboardSpy).toHaveBeenCalledWith(testGenes.map((gene) => gene.name).join(', '));
    });

    it('should clear all genes', () => {
        customRender(<SelectedGenes selectedGenes={testGenes} highlightedGenesNames={[]} />, {
            mockedStore,
        });

        fireEvent.click(screen.getByLabelText('Clear all'));

        expect(mockedStore.getActions()).toEqual([allGenesDeselected()]);
    });
});
