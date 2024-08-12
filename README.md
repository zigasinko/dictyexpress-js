# DictyExpress frontend

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

Minimum requirements:

-   Node.js of version 18 LTS
-   yarn 1.22

## GIT

To enable custom pre-push hook, update git configuration to let it know where our hook files lie:

```
`git config core.hooksPath .githooks`
```

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode with proxy for https://qa2.genialis.com (used as an API endpoint).<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `yarn lint`

Runs ESLint with Prettier check.

### `yarn lint:fix`

Runs ESLint with Prettier combined to apply automatic fixes.

### `yarn check`

Typescript compiler, Prettier and ESLint checks combined.

### `yarn test`

Launches the test runner in the interactive watch mode.<br />

### `yarn e2e:debug`

Assuming locally running web site (using `yarn start` or `yarn serve`). On Windows git-bash is assumed.

```
# Headed with inspector
LOGIN_EMAIL=myuser@my.com LOGIN_PASSWORD=mysecret PWDEBUG=1 yarn e2e

# Headless
LOGIN_EMAIL=myuser@my.com LOGIN_PASSWORD=mysecret yarn e2e
```

### `yarn build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Update `/build/config.js` with appropriate endpoint URLs and your app is ready to be deployed.

Recommended CSP header.<br />
`${WEBSOCKET_URL}` - WebSocket URL, written in config.js.<br />
`${SENTRY_REPORT_URI}` - security report URL in Sentry project settings.<br />

```
default-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: https://*.google-analytics.com https://*.googletagmanager.com; script-src 'self' 'unsafe-eval' https://*.googletagmanager.com; connect-src 'self' *.sentry.io wss://${local.websocket_domain_name} https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com; report-uri https://${local.sentry_ingest_url}/api/${local.sentry_project_id}/security/?sentry_key=${local.sentry_client_key}
```

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
