import * as core from '@actions/core'

async function run(): Promise<void> 
{
  try 
  {
    const myInput = core.getInput('buildTarget');
    const platformsList = myInput.split(",", 10);
    
    let targetPlatform = [];
    let platform = "Andy";
    let subPlatform = "Android";
    let modules = "android"
    let item = { platform, subPlatform, modules };
    targetPlatform.push(item);

    for (let i=0; i < platformsList.length; i++)
    {

    }

    core.setOutput('selectedTarget', JSON.stringify(targetPlatform));
  } 
  catch (error) 
  {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
