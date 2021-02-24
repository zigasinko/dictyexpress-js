// eslint-disable-next-line spaced-comment
/// <reference types="react-scripts" />

declare namespace NodeJS {
    interface ProcessEnv {
        readonly REACT_APP_VERSION: string;
        readonly REACT_APP_NAME: string;
        readonly REACT_APP_COMMIT_SHA?: string;
        readonly REACT_APP_DEPLOY_ENV?: string;
    }
}
