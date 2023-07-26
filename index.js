const core = require('@actions/core');
const exec = require('@actions/exec');

async function runDockerCommand(imageName, envVars) {
    let dockerArgs = ['run', '-d'];

    // Iterate through the dynamic input variables and add them as environment variables to the Docker run command
    for (const [key, value] of Object.entries(envVars)) {
        dockerArgs.push('-e', `${key}=${value}`);
    }

    // Export the default environment variables for the Docker run command
    for (const [key, value] of Object.entries(process.env)) {
        if (key.startsWith('GITHUB_')) {
            dockerArgs.push('-e', `${key}=${value}`);
        }
    }

    dockerArgs.push(imageName);

    // Run the Docker command
    await exec.exec('docker', dockerArgs);
}

try {
    const imageName = core.getInput('image_name');

    // Prepare an object to hold the dynamic input variables
    const inputVars = {};

    // Retrieve all the input variables from the GitHub workflow
    for (const envVar of process.env) {
        if (envVar.startsWith('INPUT_')) {
            const inputVarName = envVar.slice(6);
            const inputVarValue = process.env[envVar];
            inputVars[inputVarName] = inputVarValue;
        }
    }

    // Your action logic here, if needed...

    // Perform the Docker run command
    runDockerCommand(imageName, inputVars)
        .then(() => {
            console.log('Docker run command successfully executed.');
        })
        .catch((error) => {
            core.setFailed(`Error executing Docker run command: ${error.message}`);
        });

} catch (error) {
    core.setFailed(error.message);
}
