throttle(["dictyexpress_js"]) {

    node {
        // SHA of git's HEAD commit
        def git_commit_sha = null

        try {
            stage("Checkout") {
                // check out the same revision as this script is loaded from
                checkout scm
                // get SHA of git's HEAD commit
                git_commit_sha = sh (
                    script: "git rev-parse HEAD",
                    returnStdout: true
                ).trim()
            }

            stage("Install") {
                sh "echo 'Environment:' && scl enable rh-nodejs8 -- node --version && scl enable rh-nodejs8 -- npm --version"

                // force a clean install when not testing a pull request against the "master" branch
                if (!(env.CHANGE_TARGET && env.CHANGE_TARGET == "master")) {
                    sh "rm -rf jspm_packages/"
                    sh "rm -rf node_modules/"
                }
                // do not re-check against the registry if package is in the registry cache for
                // less than a day
                sh "scl enable rh-nodejs8 -- npm --cache-min 86400 install"
            }

            parallel (
                "Linters": {
                    stage("Linters") {
                        // Launches ESLint check with up-to-date version of NodeJS
                        nodejs(nodeJSInstallationName: 'NodeJS 12'){
                            sh "npm run eslint:check"
                        }
                    }
                },
                "Tests": {
                    stage("Tests") {
                        // Launches the test runner in the interactive watch mode.
                        sh "scl enable rh-nodejs8 -- npm test -- --watchAll=false"
                    }
                 }
            )

        } catch (e) {
            currentBuild.result = "FAILED"
            // report failures only when testing the "master" branch
            if (env.BRANCH_NAME == "master") {
                notifyFailed()
            }
            throw e
        }
    }
}

def notifyFailed() {
    slackSend(
        color: "#FF0000",
        message: "FAILED: Job ${env.JOB_NAME} (build #${env.BUILD_NUMBER}) ${env.BUILD_URL}"
    )
}

