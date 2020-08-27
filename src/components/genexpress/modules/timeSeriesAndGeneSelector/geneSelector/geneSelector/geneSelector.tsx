import React, { ReactElement, useState, useEffect, useCallback, ReactNode } from 'react';
import Tooltip from '@material-ui/core/Tooltip';
import _, { debounce } from 'lodash';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { connect, ConnectedProps, useDispatch } from 'react-redux';
import TextField from '@material-ui/core/TextField';
import { CircularProgress } from '@material-ui/core';
import { useSnackbar } from 'notistack';
import { getSelectedGenes, getHighlightedGenesNames, genesSelected } from 'redux/stores/genes';
import { Gene, SamplesInfo } from 'redux/models/internal';
import { getGenes, getGenesByNames } from 'api/featureApi';
import SelectedGenes from 'components/genexpress/modules/timeSeriesAndGeneSelector/geneSelector/selectedGenes/selectedGenes';
import { getSelectedSamplesInfo } from 'redux/stores/timeSeries';
import { RootState } from 'redux/rootReducer';
import { splitAndCleanGenesString } from 'utils/stringUtils';
import GeneSetSelector from 'components/genexpress/modules/timeSeriesAndGeneSelector/geneSelector/geneSets/geneSetSelector';
import { handleError } from 'utils/errorUtils';
import { AutoCompleteItemSpan, TitleSection } from './geneSelector.styles';

const itemRender = (option: Gene): ReactElement => {
    return (
        <div>
            <AutoCompleteItemSpan>{option.name}</AutoCompleteItemSpan>
            <AutoCompleteItemSpan>
                ({option.source}, <i>{option.species}</i>
            </AutoCompleteItemSpan>
        </div>
    );
};

const mapStateToProps = (
    state: RootState,
): {
    selectedGenes: Gene[];
    selectedSamplesInfo: SamplesInfo;
    highlightedGenesNames: string[];
} => {
    return {
        selectedGenes: getSelectedGenes(state.selectedGenes),
        selectedSamplesInfo: getSelectedSamplesInfo(state.timeSeries),
        highlightedGenesNames: getHighlightedGenesNames(state.selectedGenes),
    };
};

const connector = connect(mapStateToProps, {
    connectedGenesSelected: genesSelected,
});

type PropsFromRedux = ConnectedProps<typeof connector>;

const GeneSelector = ({
    selectedSamplesInfo,
    selectedGenes,
    highlightedGenesNames,
    connectedGenesSelected,
}: PropsFromRedux): ReactElement => {
    const {
        source: autocompleteSource,
        species: autocompleteSpecies,
        type: autocompleteType,
    } = selectedSamplesInfo;
    const [autocompleteOpen, setAutocompleteOpen] = useState(false);
    const [value, setValue] = useState<Gene[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingPastedGenes, setIsFetchingPastedGenes] = useState(false);
    const [genes, setGenes] = useState<Gene[]>([]);
    const { enqueueSnackbar } = useSnackbar();
    const dispatch = useDispatch();

    const fetchGenes = useCallback(
        debounce(async (queryValue: string): Promise<void> => {
            const genesResults = await getGenes(
                autocompleteSource,
                autocompleteSpecies,
                autocompleteType,
                queryValue,
                20,
            );

            if (genesResults != null) {
                setGenes(genesResults);
            } else {
                enqueueSnackbar('Error fetching genes.', { variant: 'error' });
            }

            setAutocompleteOpen(true);
            setIsLoading(false);
        }, 500),
        [autocompleteSource, autocompleteSpecies, autocompleteType, selectedGenes],
    );

    useEffect(() => {
        // Fetching genes is done with debounced function so that request is only sent after user is done typing.
        if (inputValue !== '') {
            setIsLoading(true);
            fetchGenes(inputValue);
        } else {
            setAutocompleteOpen(false);
        }

        /* When component is unmounted, fetchGenes async function has to be cancelled.
         * Otherwise React state update on an unmounted component error is thrown.
         */
        return (): void => {
            fetchGenes.cancel();
        };
    }, [fetchGenes, inputValue]);

    useEffect(() => {
        // If selectedGenes store data is changed (e.g. gene(s) were removed), autocomplete data also needs to get refreshed.
        setValue(selectedGenes);
    }, [selectedGenes]);

    const handleOnInputChange = (_event: unknown, newValue: string | null): void => {
        setInputValue(newValue != null ? newValue : '');
    };

    const isDisabled = _.isEmpty(selectedSamplesInfo);

    const handleOnChange = (_event: unknown, newValue: Gene[]): void => {
        setValue(newValue);
        connectedGenesSelected(newValue);
    };

    /**
     * Push entered genes names into selected state.
     * All remaining (not existing genes names) are printed into autocomplete input.
     * User has to manually do something with them (fix them).
     * @param genesNames - Array of genes names.
     */
    const handleImportedGenesNames = async (genesNames: string[]): Promise<void> => {
        setIsFetchingPastedGenes(true);

        try {
            const pastedGenes = await getGenesByNames(
                selectedSamplesInfo.source,
                selectedSamplesInfo.species,
                selectedSamplesInfo.type,
                genesNames,
            );

            connectedGenesSelected(pastedGenes);

            // Get and display not found genes.
            const notFoundGenesNames = genesNames.filter(
                (geneName) => _.find(pastedGenes, { name: geneName }) == null,
            );
            setInputValue(notFoundGenesNames.join());
        } catch (error) {
            dispatch(handleError('Error searching for pasted genes.', error));
        }

        setIsFetchingPastedGenes(false);
    };

    /**
     * Clean/retrieve entered genes names and push them into selected state.
     * All remaining (not existing genes names) are printed into autocomplete input.
     * User has to manually do something with them (fix them).
     * @param genesNamesString - Original input that the user pasted or imported with file drag.
     */
    const handleImportedGenesNamesString = (genesNamesString: string): void => {
        const enteredGenesNames = splitAndCleanGenesString(genesNamesString);

        handleImportedGenesNames(enteredGenesNames);
    };

    const handleOnPaste = (event: React.ClipboardEvent<HTMLDivElement>): void => {
        event.preventDefault();
        const clipboardData = event.clipboardData.getData('text');
        handleImportedGenesNamesString(clipboardData);
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>): void => {
        event.stopPropagation();
        // eslint-disable-next-line no-param-reassign
        event.dataTransfer.dropEffect = 'copy';
    };

    const handleFileDrop = (event: React.DragEvent<HTMLDivElement>): void => {
        event.preventDefault();
        const middle = event.dataTransfer || event.target;
        const file = middle.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = (readerEvent: ProgressEvent<FileReader>): void => {
            if (readerEvent.target?.readyState === FileReader.DONE) {
                handleImportedGenesNamesString(readerEvent.target.result as string);
            }
        };
        reader.readAsText(file.slice(0, file.size));
    };

    const closeDropDown = (): void => {
        setAutocompleteOpen(false);
    };

    const openDropDown = (): void => {
        // Display dropdown if there is anything in the input.
        if (inputValue !== '') {
            setAutocompleteOpen(true);
        }
    };

    return (
        <>
            <TitleSection>
                <h3>Genes</h3>
                <GeneSetSelector
                    onSelect={handleImportedGenesNames}
                    selectedGenes={selectedGenes}
                    disabled={isDisabled}
                />
            </TitleSection>
            <Tooltip title={isDisabled ? 'First select a time series.' : ''}>
                <Autocomplete
                    open={autocompleteOpen}
                    noOptionsText="No genes were found"
                    renderOption={itemRender}
                    size="small"
                    loading={isLoading}
                    fullWidth
                    renderTags={(): ReactNode => undefined}
                    loadingText="Loading"
                    disableCloseOnSelect
                    multiple
                    clearOnBlur={false}
                    onOpen={openDropDown}
                    onClose={closeDropDown}
                    filterSelectedOptions
                    forcePopupIcon={false}
                    disableClearable
                    disabled={isDisabled}
                    renderInput={(params): ReactElement => (
                        <TextField
                            // eslint-disable-next-line react/jsx-props-no-spreading
                            {...params}
                            variant="outlined"
                            color="secondary"
                            placeholder="Search for a gene"
                            onPaste={handleOnPaste}
                            onDragEnter={handleDragOver}
                            onDragOver={handleDragOver}
                            onDrop={handleFileDrop}
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <>
                                        {isLoading || isFetchingPastedGenes ? (
                                            <CircularProgress color="inherit" size={20} />
                                        ) : null}
                                        {params.InputProps.endAdornment}
                                    </>
                                ),
                            }}
                        />
                    )}
                    options={genes}
                    getOptionLabel={(option): string => option.name}
                    getOptionSelected={(option: Gene, itemValue: Gene): boolean => {
                        return option.feature_id === itemValue.feature_id;
                    }}
                    value={value}
                    onChange={handleOnChange}
                    inputValue={inputValue}
                    onInputChange={handleOnInputChange}
                />
            </Tooltip>
            <SelectedGenes
                selectedGenes={selectedGenes}
                highlightedGenesNames={highlightedGenesNames}
            />
        </>
    );
};

export default connector(GeneSelector);
