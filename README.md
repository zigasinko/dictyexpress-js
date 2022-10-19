# DictyExpress frontend

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

Minimum requirements:

-   Node.js of version 16 LTS
-   yarn 1.22

## GIT

To enable custom pre-push hook, update git configuration to let it know where our hook files lie:

```
`git config core.hooksPath .githooks`
```

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode with proxy for https://qa2.genialis.com (used as an API endpoint).<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `npm run lint`

Runs ESLint with Prettier check.

### `npm run lint:fix`

Runs ESLint with Prettier combined to apply automatic fixes.

### `npm run check`

Typescript compiler, Prettier and ESLint checks combined.

### `npm test`

Launches the test runner in the interactive watch mode.<br />
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run e2e:debug`

Assuming locally running web site (using `yarn start` or `yarn serve`). On Windows git-bash is assumed.

```
# Headed with inspector
LOGIN_EMAIL=myuser@my.com LOGIN_PASSWORD=mysecret PWDEBUG=1 yarn e2e

# Headless
LOGIN_EMAIL=myuser@my.com LOGIN_PASSWORD=mysecret yarn e2e
```

### `npm run build`

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

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
