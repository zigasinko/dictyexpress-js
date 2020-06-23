import _ from 'lodash';
import { Gene, GenesById } from 'redux/models/internal';
import { generateGenesById, generateGene } from 'tests/mock';
import genesReducer, {
    genesSelected,
    GenesState,
    geneSelected,
    geneDeselected,
    getSelectedGenes,
    allGenesDeselected,
    geneHighlighted,
    genesHighlighted,
    geneUnhighlighted,
    pastedGenesFetchStarted,
    pastedGenesFetchEnded,
} from './genes';
import { timeSeriesSelected } from './timeSeries';

describe('genes store', () => {
    let initialState: GenesState;
    let genesById: GenesById;
    let genes: Gene[];

    beforeEach(() => {
        genesById = generateGenesById(2);
    });

    describe('empty initial state', () => {
        beforeEach(() => {
            initialState = {
                byId: {},
                highlightedGenesNames: [],
                isFetchingPastedGenes: false,
            };

            genes = _.flatMap(genesById);
        });

        it('should add a gene to byId with selected action', () => {
            const geneToSelect = genes[0];
            const newState = genesReducer(initialState, geneSelected(geneToSelect));
            const expectedState = {
                ...initialState,
                byId: { [geneToSelect.name]: genesById[geneToSelect.name] },
            };

            expect(newState).toEqual(expectedState);
        });

        it('should add genes to byId with selectedMultiple action', () => {
            const newState = genesReducer(initialState, genesSelected(genes));
            const expectedState = { ...initialState, byId: genesById };

            expect(newState).toEqual(expectedState);
        });

        it('should highlight a gene', () => {
            const newState = genesReducer(initialState, geneHighlighted(genes[0].name));
            const expectedState = { ...initialState, highlightedGenesNames: [genes[0].name] };

            expect(newState).toEqual(expectedState);
        });

        it('should highlight multiple genes', () => {
            const newState = genesReducer(
                initialState,
                genesHighlighted([genes[0].name, genes[1].name]),
            );
            const expectedState = {
                ...initialState,
                highlightedGenesNames: [genes[0].name, genes[1].name],
            };

            expect(newState).toEqual(expectedState);
        });

        it('should unhighlight gene', () => {
            const newState = genesReducer(initialState, geneUnhighlighted('asdf'));
            const expectedState = { ...initialState };

            expect(newState).toEqual(expectedState);
        });

        it('should set isFetchingPastedGenes to true with pastedGenesFetchStarted action', () => {
            const newState = genesReducer(initialState, pastedGenesFetchStarted());
            const expectedState = { ...initialState, isFetchingPastedGenes: true };

            expect(newState).toEqual(expectedState);
        });
    });

    describe('not empty initial state', () => {
        beforeEach(() => {
            initialState = {
                byId: genesById,
                highlightedGenesNames: [],
                isFetchingPastedGenes: true,
            };

            genes = getSelectedGenes(initialState);
            initialState.highlightedGenesNames = [genes[0].name];
        });

        it('should add a gene to byId with selected action', () => {
            const geneToSelect = generateGene(456);
            const newState = genesReducer(initialState, geneSelected(geneToSelect));
            const expectedState = {
                ...initialState,
                byId: { ...genesById, [geneToSelect.name]: geneToSelect },
            };

            expect(newState).toEqual(expectedState);
        });

        it('should add genes to byId with selectedMultiple action', () => {
            const genesByIdToSelect = generateGenesById(2);
            const genesToSelect = _.flatMap(genesByIdToSelect);

            const newState = genesReducer(initialState, genesSelected(genesToSelect));
            const expectedState = { ...initialState, byId: genesByIdToSelect };

            expect(newState).toEqual(expectedState);
        });

        it('should remove a gene from byId with geneDeselected action', () => {
            const newState = genesReducer(initialState, geneDeselected(genes[0]));
            const expectedState = {
                ...initialState,
                byId: { [genes[1].name]: genes[1] },
            };

            expect(newState).toEqual(expectedState);
        });

        it('should clear selected genes byId with deselectAll action', () => {
            const newState = genesReducer(initialState, allGenesDeselected());
            const expectedState = {
                ...initialState,
                byId: {},
            };

            expect(newState).toEqual(expectedState);
        });

        it('should clear selected genes byId when timeSeries is selected', () => {
            const newState = genesReducer(initialState, timeSeriesSelected(0));
            const expectedState = {
                ...initialState,
                byId: {},
            };

            expect(newState).toEqual(expectedState);
        });

        it('should highlight a gene', () => {
            const highlightedGeneName = 'asdf';
            const newState = genesReducer(initialState, geneHighlighted(highlightedGeneName));
            const expectedState = {
                ...initialState,
                highlightedGenesNames: [...initialState.highlightedGenesNames, highlightedGeneName],
            };

            expect(newState).toEqual(expectedState);
        });

        it('should highlight multiple genes', () => {
            const highlightedGenesNames = ['asdf', 'qwer'];
            const newState = genesReducer(initialState, genesHighlighted(highlightedGenesNames));
            const expectedState = {
                ...initialState,
                highlightedGenesNames: [...highlightedGenesNames],
            };

            expect(newState).toEqual(expectedState);
        });

        it('should unhighlight gene', () => {
            const newState = genesReducer(initialState, geneUnhighlighted('asdf'));
            const expectedState = { ...initialState };

            expect(newState).toEqual(expectedState);
        });

        it('should set isFetchingPastedGenes to false with pastedGenesFetchEnded action', () => {
            const newState = genesReducer(initialState, pastedGenesFetchEnded());
            const expectedState = { ...initialState, isFetchingPastedGenes: false };

            expect(newState).toEqual(expectedState);
        });
    });
});
