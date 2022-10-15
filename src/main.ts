import * as core from '@actions/core'
import fs from 'fs';
import { EOL } from 'os';

const Android = "Android";
const iOS = "iOS";
const Windows = "Windows";
const WindowsServer = "Windows Server";
const Linux = "Linux";
const LinuxServer = "Linux Server";
const DefaulOSObject = '{"Windows":"self-hosted-windows-test","Mac":"self-hosted-mac-test","Common":"self-hosted-build-runner"}';
const DefaultSlackObject = '{"Public":"SLACK_WEBHOOK","Private":"SLACK_WEBHOOK_2"}';

function run(): void {
  try {
    let buildEnvironment = core.getInput('buildEnvironment');
    let buildTargetOne = core.getInput('buildTargetOne');
    let buildTargetTwo = core.getInput('buildTargetTwo');
    let buildTargetThree = core.getInput('buildTargetThree');
    let buildTargetFour = core.getInput('buildTargetFour');
    let slackChannel = core.getInput('slackChannel');
    let buildOS = core.getInput('os');
    let slackData = core.getInput('slackData');

    if (buildEnvironment == '') {
      buildEnvironment = 'Development'
    }

    if (buildTargetOne == '') {
      buildTargetOne = 'Android'
    }

    if (buildTargetTwo == '') {
      buildTargetTwo = 'iOS'
    }

    if (buildTargetThree == '') {
      buildTargetThree = 'Windows Server'
    }

    if (buildTargetFour == '') {
      buildTargetFour = 'None'
    }

    if (slackChannel == '') {
      slackChannel = "Public"
    }

    if (buildOS == '') {
      buildOS = DefaulOSObject;
    }

    if (slackData == '') {
      slackData = DefaultSlackObject;
    }

    let jsonObject = [];

    let item = getMatrixItem(buildTargetOne, buildEnvironment, slackData, slackChannel);
    if (item != null)
      jsonObject.push(item);

    item = getMatrixItem(buildTargetTwo, buildEnvironment, slackData, slackChannel);
    if (item != null)
      jsonObject.push(item);

    item = getMatrixItem(buildTargetThree, buildEnvironment, slackData, slackChannel);
    if (item != null)
      jsonObject.push(item);

    item = getMatrixItem(buildTargetFour, buildEnvironment, slackData, slackChannel);
    if (item != null)
      jsonObject.push(item);

    let osObject = JSON.parse(buildOS);
    jsonObject = getOS(jsonObject, osObject);

    core.setOutput('selectedTarget', JSON.stringify(jsonObject));

    const settingsFilePath = 'ProjectSettings/ProjectSettings.asset';
    const settingsFile = fs.readFileSync(settingsFilePath, 'utf8');
  
    const regexOne = new RegExp('AndroidBundleVersionCode: (.)', 'g');
    const regexTwo = new RegExp(`buildNumber:${EOL}    Standalone: (.)${EOL}    iPhone: (.)${EOL}    tvOS: (.)`, 'gm');
  
    let buildNumberMatch = regexOne.exec(settingsFile);
    let regexTwoMatch = regexTwo.exec(settingsFile);
  
    if(!buildNumberMatch)
      return;
  
    if(!regexTwoMatch)
      return;
  
    let modifiedFile = settingsFile;
    let buildNumber = parseInt(buildNumberMatch[1]); 
    buildNumber++;
  
    modifiedFile = modifiedFile.replace(buildNumberMatch[0], `AndroidBundleVersionCode: ${buildNumber}`);
    modifiedFile = modifiedFile.replace(regexTwoMatch[0], `buildNumber:${EOL}    Standalone: ${buildNumber}${EOL}    iPhone: ${buildNumber}${EOL}    tvOS: ${buildNumber}`)
    
    fs.writeFileSync(settingsFilePath, modifiedFile);
  
    console.log(`Updated Build number ${buildNumber}`);
  }
  catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

function getMatrixItem(platformName: string, buildEnvironment: string, slackData: string, slackChannel: string): any {
  if (platformName != 'None') {
    let platform = getPlatform(platformName);
    let customPlatformName = getCustomPlatformName(platformName);
    let modules = getModules(platformName);
    let subPlatformServer = getSubPlatformServer(platformName);
    let environment = buildEnvironment;

    let slackDataObj = JSON.parse(slackData);
    let slackWebHook = slackDataObj[slackChannel]
    let item = { platform, customPlatformName, modules, subPlatformServer, environment, slackWebHook };
    return item;
  }

  return null;
}

function getPlatform(platformName: string): string {
  switch (platformName) {
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

function getCustomPlatformName(platformName: string): string {
  switch (platformName) {
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

function getModules(platformName: string): string {
  switch (platformName) {
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

function getSubPlatformServer(platformName: string): string {
  switch (platformName) {
    case Android:
      {
        return "Player";
      }
    case iOS:
      {
        return "Player";
      }
    case Windows:
      {
        return "Player";
      }
    case Linux:
      {
        return "Player";
      }
    case WindowsServer:
      {
        return "Server";
      }
    case LinuxServer:
      {
        return "Server";
      }
  }
  return "Player";
}

function getOS(jsonObject: any[], osObject: any): any {
  console.log(osObject["Windows"]);
  console.log(osObject["Mac"]);
  console.log(osObject["Common"]);

  let containsWindows = false;
  jsonObject.forEach(element => {
    if (element.platform === "Win64") {
      containsWindows = true;
      element.os = osObject["Windows"];
    }
  });

  let excluded = false;
  jsonObject.forEach(element => {
    if (containsWindows) {
      if (element.platform !== "Win64") {
        if (!excluded) {
          element.os = osObject["Mac"];
          excluded = true;
        }
        else {
          element.os = osObject["Common"];
        }
      }
    }
    else {
      element.os = osObject["Common"];
    }
  });

  return jsonObject;
}

run()