import { DictyUrlQueryParameter } from 'components/genexpress/common/constants';

// eslint-disable-next-line import/prefer-default-export
export const getUrlQueryParameter = (
    url: string,
    parameterName: DictyUrlQueryParameter,
): string | null => {
    return new URLSearchParams(url).get(parameterName);
};
