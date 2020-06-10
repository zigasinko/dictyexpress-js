import _ from 'lodash';
import { Contributor, User } from '@genialis/resolwe/dist/api/types/rest';

// eslint-disable-next-line import/prefer-default-export
export const getUsername = (user: Contributor | User): string => {
    if (user == null) {
        return '';
    }

    return _.compact([user.first_name, user.last_name]).join(' ') || user.username;
};
