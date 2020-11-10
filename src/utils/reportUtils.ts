import _ from 'lodash';
import * as vega from 'vega';

export const objectsArrayToTsv = (rows: object[]): string => {
    if (_.isEmpty(rows) || _.isEmpty(rows[0])) {
        return '';
    }
    const array = [Object.keys(rows[0]), ...rows];

    return array
        .map((it) => {
            return Object.values(it).join('\t');
        })
        .join('\n');
};

export const vegaToPng = async (chartView: vega.View): Promise<string> => {
    const pngBase64 = (await chartView.toCanvas()).toDataURL('image/png');

    return pngBase64.substring(pngBase64.indexOf(',') + 1);
};

export const vegaToSvg = async (chartView: vega.View): Promise<Blob> => {
    return new Blob([await chartView.toSVG()], { type: 'image/svg+xml' });
};
