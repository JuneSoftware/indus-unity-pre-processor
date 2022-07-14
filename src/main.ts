import * as core from '@actions/core'

async function run(): Promise<void> 
{
  try 
  {
    const myInput = core.getInput('buildTarget');
    const platformsList = myInput.split(",", 10);
    
    let jsonObject = [];

    for (let i=0; i < platformsList.length; i++)
    {
      let platform = platformsList[i];
      let subPlatform = "Android";
      let modules = "android"
      let item = { platform, subPlatform, modules };
      jsonObject.push(item);
    }

    core.setOutput('selectedTarget', JSON.stringify(jsonObject));
  } 
  catch (error) 
  {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()

/* targetPlatform: [ 
  #{ platform: "iOS", subPlatform: iOS, modules: "ios" }, 
  #{ platform: "Win64", subPlatform: WindowsServer64, modules: "windows-il2cpp, windows-server" },
  { platform: "Linux64", subPlatform: LinuxServer64, modules: "linux-il2cpp, linux-server" },
  #{ platform: "Win64", subPlatform: Windows64, modules: "windows-il2cpp" },
  #{ platform: "Android", subPlatform: Android, modules: "android" }
] */