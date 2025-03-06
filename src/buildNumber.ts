import * as core from '@actions/core';
import * as github from '@actions/github';

export async function updateBuildNumber(stepSize: number): Promise<number> {
    try {
        const token: string = core.getInput('repoToken', { required: true });
        const variableName: string = core.getInput('variableName', { required: true });

        console.log(`Fetching repository variable: ${variableName}`);

        const octokit = github.getOctokit(token);
        const context = github.context;

        const response = await octokit.rest.actions.getRepoVariable({
            owner: context.repo.owner,
            repo: context.repo.repo,
            name: variableName
        });

        let variableValue: number = parseInt(response.data.value, 10);
        if (isNaN(variableValue)) {
            throw new Error(`Variable ${variableName} does not contain a valid number`);
        }

        variableValue += stepSize;
        console.log(`Incremented variable: ${variableName} to ${variableValue}`);

        await octokit.rest.actions.updateRepoVariable({
            owner: context.repo.owner,
            repo: context.repo.repo,
            name: variableName,
            value: variableValue.toString()
        });

        return variableValue;

    } catch (error: unknown) {
        if (error instanceof Error) {
            core.setFailed(`Action failed with error: ${error.message}`);
        } else {
            core.setFailed(`An unknown error occurred.`);
        }

        return 0;
    }
}
