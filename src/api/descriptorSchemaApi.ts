import { DescriptorSchema } from '@genialis/resolwe/dist/api/types/rest';
import { DescriptorSchemaSlug } from 'components/genexpress/common/constants';
import { deserializeResponse } from 'utils/apiUtils';
import { apiUrl } from './base';
import { get } from './fetch';

const baseUrl = `${apiUrl}/descriptorschema`;

export const getDictyDescriptorSchema = async (): Promise<DescriptorSchema | undefined> => {
    const getDictyDescriptorSchemaResponse = await get(baseUrl, {
        slug: DescriptorSchemaSlug.DictyTimeSeries,
    });

    return (await deserializeResponse<DescriptorSchema[]>(getDictyDescriptorSchemaResponse))[0];
};
