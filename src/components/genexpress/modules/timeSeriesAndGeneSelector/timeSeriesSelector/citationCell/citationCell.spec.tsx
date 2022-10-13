import { customRender } from 'tests/test-utils';
import { fireEvent, screen } from '@testing-library/react';
import { generateSingleTimeSeries } from 'tests/mock';
import CitationCell from './citationCell';
import { Relation } from '@genialis/resolwe/dist/api/types/rest';
import { DescriptorSchemaSlug } from 'components/genexpress/common/constants';
import { Descriptor } from 'types/application';

const relation = generateSingleTimeSeries(1) as Relation & {
    descriptor: Required<Descriptor[DescriptorSchemaSlug.DictyTimeSeries]>;
};

describe('citationCell', () => {
    let asFragment: () => DocumentFragment;

    beforeEach(() => {
        ({ asFragment } = customRender(<CitationCell data={relation} />));
    });

    it('should render as default snapshot', () => {
        expect(asFragment()).toMatchSnapshot();
    });

    it('should open citation dialog on click', () => {
        fireEvent.click(screen.getByRole('button', { name: relation.descriptor.citation.name }));

        screen.getByText(
            'dictyExpress: a web-based platform for sequence data management and analytics in Dictyostelium and beyond',
            { exact: false },
        );
        screen.getByText('2017', { exact: false });
        screen.getByText('BMC Bioinformatics', { exact: false });
        expect(
            screen.getByRole('link', { name: relation.descriptor.citation.name }),
        ).toHaveAttribute('href', relation.descriptor.citation.url);
        screen.getByRole('heading', {
            name: `${relation.descriptor.project} ${relation.descriptor.details}`,
        });
    });
});
