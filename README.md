# DictyExpress frontend

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

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

### `npm run test:e2e`

`npm run test:e2e` script is meant for CI integration as it runs both headless test runner and site server.

For development use UI variant (assuming locally running web site and macOS):

```
LOGIN_USERNAME=myuser LOGIN_PASSWORD=mysecret npm run e2e:debug
```

or for headless run:

```
LOGIN_USERNAME=myuser LOGIN_PASSWORD=mysecret CI=true npm run e2e:debug
```

on Windows (assuming locally running web site):

```
npx cross-env LOGIN_USERNAME=myuser LOGIN_PASSWORD=mysecret npm run e2e:debug
```

Opens UI for e2e tests overview with custom user account.



### `npm run build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
