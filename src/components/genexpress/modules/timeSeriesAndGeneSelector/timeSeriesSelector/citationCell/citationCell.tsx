import React, { ReactElement, useCallback, useState } from 'react';
import { Box, Button, List, ListItem } from '@mui/material';
import {
    CenteredModal,
    ModalContainer,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from 'components/genexpress/common/dictyModal/dictyModal.styles';
import { Relation } from '@genialis/resolwe/dist/api/types/rest';
import { Descriptor } from 'types/application';
import { DescriptorSchemaSlug } from 'components/genexpress/common/constants';

const CitationCell = ({
    data,
}: {
    data: Relation & { descriptor: Descriptor[DescriptorSchemaSlug.DictyTimeSeries] };
}): ReactElement => {
    const [isCitationDialogOpened, setIsCitationDialogOpened] = useState(false);

    const onClose = useCallback(() => {
        setIsCitationDialogOpened(false);
    }, []);

    if (data.descriptor.citation == null) {
        return <></>;
    }

    return (
        <>
            <Button
                sx={{
                    width: 1,
                    height: 1,
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                }}
                // To stop real event from bubbling to the row onSelect handler, we must stop propagation on the native event not the react synthetic one.
                ref={(ref) => {
                    if (!ref) {
                        return;
                    }
                    ref.onclick = (e) => {
                        setIsCitationDialogOpened(true);
                        e.stopPropagation();
                    };
                }}
            >
                <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {data.descriptor.citation.name}
                </Box>
            </Button>
            {isCitationDialogOpened && (
                <CenteredModal open aria-labelledby="modalTitle" onClose={onClose}>
                    <ModalContainer>
                        <ModalHeader id="modalTitle">
                            {data.descriptor.project ?? data.collection.name}{' '}
                            {data.descriptor.details}
                        </ModalHeader>
                        <ModalBody>
                            If you want to use this data in your research, cite:
                            <List>
                                <ListItem>
                                    <a
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        href={data.descriptor.citation.url}
                                    >
                                        {data.descriptor.citation.name}
                                    </a>
                                </ListItem>
                            </List>
                            Please cite the {process.env.REACT_APP_NAME} app as well:
                            <Box sx={{ marginTop: 1 }}>
                                M. Stajdohar, R. D. Rosengarten, J. Kokosar, L. Jeran, D. Blenkus,
                                G. Shaulsky & B. Zupan,{' '}
                                <b>
                                    dictyExpress: a web-based platform for sequence data management
                                    and analytics in Dictyostelium and beyond
                                </b>
                                , BMC Bioinformatics, 2017.
                            </Box>
                        </ModalBody>
                        <ModalFooter>
                            <Button onClick={onClose}>Close</Button>
                        </ModalFooter>
                    </ModalContainer>
                </CenteredModal>
            )}
        </>
    );
};

export default CitationCell;
