# DictyExpress frontend

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode and proxy for https://qa2.genialis.com (used as an API endpoint).<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

If timeSeries don't load (csrf error in Network tab), navigate to "https://localhost:8001/api/base/csrf" to get the csrf cookie.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

https://qa2.genialis.com proxy is bound to https://localhost:8001.

### `npm run prettier:check`

Runs prettier check.

### `npm run prettier:fix`

Runs prettier check with automatic formatting.

### `npm run eslint:check`

Runs ESLint check.

### `npm run eslint:fix`

Runs ESLint check with automatic fix enabled.

### 'npm run check'

Prettier and ESLint checks combined.

### 'npm run fix'

Prettier and ESLint checks with enabled automatic fix combined.

### `npm test`

Launches the test runner in the interactive watch mode.<br />
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

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
