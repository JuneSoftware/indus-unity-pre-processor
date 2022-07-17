import * as core from '@actions/core'

function run(): void
{
  try 
  {
    const myInput = core.getInput('buildTarget');
    const platformsList = myInput.split(",", 10);
    
    let jsonObject = [];

    for (let i=0; i < platformsList.length; i++)
    {
      let platformName = platformsList[i].replace(' ', '');
      core.debug(`Waiting ${platformName} milliseconds ...`);
      let platform = getPlatform(platformName);
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
    case "Android": 
    { 
       return "Android";
    } 
    case "iOS": 
    { 
       return "iOS";
    } 
    case "Windows": 
    { 
      return "Win64";
    }
    case "Linux": 
    { 
      return "Linux64";
    }
    case "Windows Server": 
    { 
      return "Win64";
    }
    case "Linux Server": 
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
    case "Android": 
    { 
       return "Android";
    } 
    case "iOS": 
    { 
       return "iOS";
    } 
    case "Windows": 
    { 
      return "Windows64";
    }
    case "Linux": 
    { 
      return "Linux64";
    }
    case "Windows Server": 
    { 
      return "WindowsServer64";
    }
    case "Linux Server": 
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
    case "Android": 
    { 
       return "android";
    } 
    case "iOS": 
    { 
       return "ios";
    } 
    case "Windows": 
    { 
      return "windows-il2cpp";
    }
    case "Linux": 
    { 
      return "linux-il2cpp";
    }
    case "Windows Server": 
    { 
      return "windows-il2cpp, windows-server";
    }
    case "Linux Server": 
    { 
      return "linux-il2cpp, linux-server";
    }
  }
  return "android";
}

run()