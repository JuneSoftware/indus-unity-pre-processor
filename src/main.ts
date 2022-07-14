import * as core from '@actions/core'

async function run(): Promise<void> {
  try {
    const myInput = core.getInput('buildTarget');
    core.setOutput('buildTarget', myInput);
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
