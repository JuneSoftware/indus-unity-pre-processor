import * as core from '@actions/core'
import fs from 'fs';

const Android = "Android";
const iOS = "iOS";
const Windows = "Windows";
const WindowsServer = "Windows Server";
const Linux = "Linux";
const LinuxServer = "Linux Server";
const DefaultSlackObject = '{"Public":"SLACK_WEBHOOK","Private":"SLACK_WEBHOOK_2"}';
const DefaultGCPKeyObject = '{"Development":"SERVICE_ACCOUNT_KEY_DEV","Staging":"SERVICE_ACCOUNT_KEY_STAGING","Release":"SERVICE_ACCOUNT_KEY_STAGING","Production":"SERVICE_ACCOUNT_KEY_STAGING"}';

function run(): void {
  try {
    let buildEnvironment = core.getInput('buildEnvironment');
    let buildTargetOne = core.getInput('buildTargetOne');
    let buildTargetTwo = core.getInput('buildTargetTwo');
    let buildTargetThree = core.getInput('buildTargetThree');
    let buildTargetFour = core.getInput('buildTargetFour');
    let slackChannel = core.getInput('slackChannel');
    let slackData = core.getInput('slackData');
    let settingsFilePath = core.getInput('settingsFilePath');
    let buildNumberStepSize = core.getInput('buildNumberStepSize');
    let gcpKeyData = core.getInput('gcpKeyData');

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

    if (slackData == '') {
      slackData = DefaultSlackObject;
    }

    if (settingsFilePath == '') {
      settingsFilePath = 'ProjectSettings/ProjectSettings.asset'
    }

    if (buildNumberStepSize == '') {
      buildNumberStepSize = '1';
    }

    if(gcpKeyData == ''){
      gcpKeyData = DefaultGCPKeyObject;
    }

    let jsonObject = [];

    let item = getMatrixItem(buildTargetOne, buildEnvironment, slackData, slackChannel, gcpKeyData);
    if (item != null)
      jsonObject.push(item);

    item = getMatrixItem(buildTargetTwo, buildEnvironment, slackData, slackChannel, gcpKeyData);
    if (item != null)
      jsonObject.push(item);

    item = getMatrixItem(buildTargetThree, buildEnvironment, slackData, slackChannel, gcpKeyData);
    if (item != null)
      jsonObject.push(item);

    item = getMatrixItem(buildTargetFour, buildEnvironment, slackData, slackChannel, gcpKeyData);
    if (item != null)
      jsonObject.push(item);

    core.setOutput('selectedTarget', JSON.stringify(jsonObject));

    const settingsFile = fs.readFileSync(settingsFilePath, 'utf8');

    const regexOne = new RegExp(/AndroidBundleVersionCode: (.*)/g);
    const regexTwo = new RegExp(/buildNumber:(\r?\n|\r)(( {4}.*(\r?\n|\r))*)(?=  \w+)/g);
    const regexThree = new RegExp(/bundleVersion: (.*)/g);

    let buildNumberMatch = regexOne.exec(settingsFile);
    let regexTwoMatch = regexTwo.exec(settingsFile);
    let regexThreeMatch = regexThree.exec(settingsFile);

    if (!buildNumberMatch)
      return;

    if (!regexTwoMatch)
      return;

    let modifiedFile = settingsFile;
    let buildNumber = parseInt(buildNumberMatch[1]);
    let stepSize = parseInt(buildNumberStepSize);
    buildNumber += stepSize;

    let updatedSection = regexTwoMatch[0].replace(/(?<=: )\d+/g, buildNumber.toString());
    modifiedFile = modifiedFile.replace(buildNumberMatch[0], `AndroidBundleVersionCode: ${buildNumber}`);
    modifiedFile = modifiedFile.replace(regexTwo, updatedSection);

    let buildVersion = ''
    if (regexThreeMatch)
      buildVersion = `${regexThreeMatch[1]}_${buildNumber}`;

    core.setOutput('buildNumber', buildNumber);
    core.setOutput('buildVersion', buildVersion);

    fs.writeFileSync(settingsFilePath, modifiedFile);
  }
  catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

function getMatrixItem(platformName: string, buildEnvironment: string, slackData: string, slackChannel: string, gcpKeyData: string): any {
  if (platformName != 'None') {
    let platform = getPlatform(platformName);
    let customPlatformName = getCustomPlatformName(platformName);
    let modules = getModules(platformName);
    let subPlatformServer = getSubPlatformServer(platformName);
    let environment = buildEnvironment;

    let slackDataObj = JSON.parse(slackData);
    let slackWebHook = slackDataObj[slackChannel]
    let gcpKeyDataObj = JSON.parse(gcpKeyData);
    let gcpKey = gcpKeyDataObj[buildEnvironment];
    let item = { platform, customPlatformName, modules, subPlatformServer, environment, slackWebHook, gcpKey };
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

run()