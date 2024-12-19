import * as core from '@actions/core'
import fs from 'fs';
import * as httpm from '@actions/http-client';

const Android = "Android";
const iOS = "iOS";
const Windows = "Windows";
const WindowsServer = "Windows Server";
const Linux = "Linux";
const LinuxServer = "Linux Server";
const PlayStore="Play Store";
const DefaultSlackObject = '{"Public":"SLACK_WEBHOOK","Private":"SLACK_WEBHOOK_2"}';
const DefaultEvironmentDataObject = '{"Development":{"GCPKey":"SERVICE_ACCOUNT_KEY_DEV","GCPURL":"GCP_BUILD_URL_PREFIX_DEV","GCPURLPrefix":"indus-builds"},"Staging":{"GCPKey":"GCP_BUILD_URL_PREFIX_STAGING","GCPURL":"SERVICE_ACCOUNT_KEY_STAGING","GCPURLPrefix":"indus-builds-stage"},"Release":{"GCPKey":"GCP_BUILD_URL_PREFIX_STAGING","GCPURL":"SERVICE_ACCOUNT_KEY_STAGING","GCPURLPrefix":"indus-builds-stage"},"Production":{"GCPKey":"GCP_BUILD_URL_PREFIX_PROD","GCPURL":"SERVICE_ACCOUNT_KEY_PROD","GCPURLPrefix":"indus-builds-prod"}}';
const DefaultBuildConfigDataObject = '{"Default":"Assets/Indus/Platform/Build/Configurations/Config.Build.Default.asset"}';

async function getBuildVersion(branchName: string): Promise<string> {
  try {
    const http = new httpm.HttpClient('build-version-action');
    const body = JSON.stringify({ branchName });

    const response = await http.post(
      'https://auto-build-versioning-603574841682.asia-south1.run.app/version',
      body,
      {
        'Content-Type': 'application/json'
      }
    );

    const responseBody = await response.readBody();
    const result = JSON.parse(responseBody);

    if ((result.status === 200 || result.status === 201) && result.data?.buildVersion) {
      return result.data.buildVersion;
    }
    throw new Error(`Failed to get build version: ${responseBody}`);
  } catch (error) {
    throw new Error(`Error fetching build version: ${error}`);
  }
}

async function run(): Promise<void> {
  try {
    let buildEnvironment = core.getInput('buildEnvironment');
    let buildTargetOne = core.getInput('buildTargetOne');
    let buildTargetTwo = core.getInput('buildTargetTwo');
    let buildTargetThree = core.getInput('buildTargetThree');
    let buildTargetFour = core.getInput('buildTargetFour');
    let buildTargetFive = core.getInput('buildTargetFive');
    let slackChannel = core.getInput('slackChannel');
    let slackData = core.getInput('slackData');
    let settingsFilePath = core.getInput('settingsFilePath');
    let buildNumberStepSize = core.getInput('buildNumberStepSize');
    let evironmentData = core.getInput('evironmentData');
    let buildConfig = core.getInput('buildConfig');
    let buildConfigData = core.getInput('buildConfigData');
    let branchName = core.getInput('branchName');

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

    if (buildTargetFive == '') {
      buildTargetFive = 'None'
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

    if (evironmentData == '') {
      evironmentData = DefaultEvironmentDataObject;
    }

    if (buildConfig == '') {
      buildConfig = 'Default';
    }

    if (buildConfigData == '') {
      buildConfigData = DefaultBuildConfigDataObject;
    }

    let jsonObject = [];

    let item = getMatrixItem(buildTargetOne, buildEnvironment, slackData, slackChannel, evironmentData, buildConfig, buildConfigData);
    if (item != null)
      jsonObject.push(item);

    item = getMatrixItem(buildTargetTwo, buildEnvironment, slackData, slackChannel, evironmentData, buildConfig, buildConfigData);
    if (item != null)
      jsonObject.push(item);

    item = getMatrixItem(buildTargetThree, buildEnvironment, slackData, slackChannel, evironmentData, buildConfig, buildConfigData);
    if (item != null)
      jsonObject.push(item);

    item = getMatrixItem(buildTargetFour, buildEnvironment, slackData, slackChannel, evironmentData, buildConfig, buildConfigData);
    if (item != null)
      jsonObject.push(item);

    item = getMatrixItem(buildTargetFive, buildEnvironment, slackData, slackChannel, evironmentData, buildConfig, buildConfigData);
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

    let buildVersion = await getBuildVersion(branchName);
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

function getMatrixItem(platformName: string, buildEnvironment: string, slackData: string, slackChannel: string, evironmentDataJSON: string, buildConfig: string, buildConfigDataJSON: string): any {
  if (platformName != 'None') {
    let platform = getPlatform(platformName);
    let customPlatformName = getCustomPlatformName(platformName);
    let modules = getModules(platformName);
    let subPlatformServer = getSubPlatformServer(platformName);

    let slackDataObj = JSON.parse(slackData);
    let slackWebHook = slackDataObj[slackChannel]
    let environmentDataObj = JSON.parse(evironmentDataJSON);
    let environmentData = environmentDataObj[buildEnvironment];
    let buildConfigDataObj = JSON.parse(buildConfigDataJSON);
    let buildConfigData = buildConfigDataObj[buildConfig];
    return { platform, customPlatformName, modules, subPlatformServer, buildEnvironment, slackWebHook, environmentData, buildConfigData };
  }

  return null;
}

function getPlatform(platformName: string): string {
  switch (platformName) {
    case Android:
    case PlayStore:
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

    case PlayStore:
      {
        return "PlayStore";
      }
  }
  return "Android";
}

function getModules(platformName: string): string {
  switch (platformName) {
    case Android:
    case PlayStore:
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
    case PlayStore:
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

run().catch(error => {
  if (error instanceof Error) core.setFailed(error.message)
});