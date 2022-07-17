import * as core from '@actions/core'

const Android = "Android";
const iOS = "iOS";
const Windows = "Windows";
const WindowsServer = "WindowsServer";
const Linux = "Linux";
const LinuxServer = "LinuxServer";

function run(): void
{
  try 
  {
    const myInput = core.getInput('buildTarget');
    const platformsList = myInput.split(",", 10);
    
    let jsonObject = [];

    for (let i=0; i < platformsList.length; i++)
    {
      let platformName = platformsList[i].replace(/: :/g, '');
      core.debug(`Platform Name ${platformName} : Index${i}`);
      let platform = getPlatform(platformName);
      core.debug(`Selected Platform ${platform} : Index${i}`);
      let subPlatform = getSubPlatform(platformName);
      let modules = getModules(platformName)
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

function getPlatform(platformName: string) : string
{
  switch(platformName) 
  { 
    case Android: 
    { 
       return "Android";
    } 
    case iOS: 
    { 
       return "iOS";
    } 
    case Windows: 
    { 
      return "Win64";
    }
    case Linux: 
    { 
      return "Linux64";
    }
    case WindowsServer: 
    { 
      return "Win64";
    }
    case LinuxServer: 
    { 
      return "Linux64";
    }
  }
  return "Android";
}

function getSubPlatform(platformName: string) : string
{
  switch(platformName) 
  { 
    case Android: 
    { 
       return "Android";
    } 
    case iOS: 
    { 
       return "iOS";
    } 
    case Windows: 
    { 
      return "Windows64";
    }
    case Linux: 
    { 
      return "Linux64";
    }
    case WindowsServer: 
    { 
      return "WindowsServer64";
    }
    case LinuxServer: 
    { 
      return "LinuxServer64";
    }
  }
  return "Android";
}

function getModules(platformName: string) : string
{
  switch(platformName) 
  { 
    case Android: 
    { 
       return "android";
    } 
    case iOS: 
    { 
       return "ios";
    } 
    case Windows: 
    { 
      return "windows-il2cpp";
    }
    case Linux: 
    { 
      return "linux-il2cpp";
    }
    case WindowsServer: 
    { 
      return "windows-il2cpp, windows-server";
    }
    case LinuxServer: 
    { 
      return "linux-il2cpp, linux-server";
    }
  }
  return "android";
}

run()