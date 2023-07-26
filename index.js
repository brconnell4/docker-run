const core = require('@actions/core');
const exec = require('@actions/exec');

async function runDockerCommand(imageName, envVars) {
    let dockerArgs = ['run'];

    // Iterate through the dynamic input variables and add them as environment variables to the Docker run command
    for (const [key, value] of Object.entries(envVars)) {
        const replacedValue = replacePlaceholders(value);
        dockerArgs.push('-e', `${key}=${replacedValue}`);
    }

    // Export the default environment variables for the Docker run command
    for (const [key, value] of Object.entries(process.env)) {
        if (key.startsWith('GITHUB_')) {
            dockerArgs.push('-e', `${key}=${value}`);
        }
    }

    dockerArgs.push(imageName);

    // Run the Docker command without the '-d' flag to keep the container running in the foreground
    await exec.exec('docker', dockerArgs);
}

function replacePlaceholders(value) {
    // Use a regular expression to find placeholders in the format '${{ env.VARIABLE_NAME }}' or '${{ inputs.INPUT_NAME }}'
    const regex = /\${{\s*(env|secrets|inputs)\.([A-Za-z_]+)\s*}}/g;
    let result = value;

    // Replace each placeholder found in the value with its corresponding environment variable value
    result = result.replace(regex, (match, group1, group2) => {
        const prefix = group1 === 'env' ? '' : group1 + '.';
        return process.env[prefix + group2] || '';
    });

    return result;
}

try {
    const imageName = core.getInput('image');
    let envVarsJSON = core.getInput('env_variables');

    // Remove any trailing commas from the input
    envVarsJSON = envVarsJSON.replace(/,\s*$/, '');

    const envVars = JSON.parse(envVarsJSON);

    // Your action logic here, if needed...

    // Perform the Docker run command
    runDockerCommand(imageName, envVars)
        .then(() => {
            console.log('Docker run command successfully executed.');
        })
        .catch((error) => {
            core.setFailed(`Error executing Docker run command: ${error.message}`);
        });

} catch (error) {
    core.setFailed(error.message);
}
