const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");
const { handleFileCode } = require("./utils/FileUtils");
const { AppLoader } = require("./AppLoader");
const { generateGitGraphMarkdown } = require("./utils/DiagramUtils");
const appsFolder = "packages/apps";
const bookmarkFileName = "multiColorBookmarks.json";
const DIAGRAM_OUTPUT_DIR = "docs/flows";
class AppsManager {
  constructor(context, projectDir) {
    this.context = context;
    this.projectDir = projectDir;
    this.appLoaders = {};
    this.fileCodeUtils = handleFileCode();
    this.apps = [];
    this._refreshListOfApps();
  }
  getAppLoader = (appName) => {
    if (!this.appLoaders[appName]) {
      this.appLoaders[appName] = new AppLoader(
        this.context,
        this.projectDir,
        appName,
        this.fileCodeUtils.getCodeToFileMap,
        this.fileCodeUtils.getFileCode,
        this._changeBookmarksStatus
      );
    }
    return this.appLoaders[appName];
  };
  _changeBookmarksStatus = (appName, hasBookmarks) => {
    const app = this.apps.find((app) => app.label === appName);
    if (app) {
      app.hasBookmarks = hasBookmarks;
    }
  };
  _refreshListOfApps() {
    const folderPath = path.join(this.projectDir, appsFolder);
    const appDirs = fs.readdirSync(folderPath);
    this.apps = appDirs.map((appDir) => {
      try {
        fs.accessSync(
          path.join(folderPath, appDir, bookmarkFileName),
          fs.constants.F_OK
        );
        return { label: appDir, hasBookmarks: true };
      } catch (e) {
        return { label: appDir, hasBookmarks: false };
        // no bookmarks.json file
      }
    });
  }
  _resolveJoinedFlow = (appName, flowName) => {
    return this.getAppLoader(appName)
      .getJoinedFlow(flowName)
      .then((subflows) => {
        return Promise.all(
          subflows.map((subflow) => {
            return this.getAppLoader(subflow.app).getBasicFlow(subflow.flow);
          })
        ).then((subFlows) => {
          return [].concat(...subFlows);
        });
      });
  };
  _resolveBasicFlow = (appName, flowName) => {
    return this.getAppLoader(appName).getBasicFlow(flowName);
  };
  resolveFlow = (appName, flowName, flowType) => {
    return flowType === "basic"
      ? this._resolveBasicFlow(appName, flowName)
      : this._resolveJoinedFlow(appName, flowName);
  };
  getAppsWithoutBookmarks() {
    return this.apps.filter((app) => !app.hasBookmarks).map((app) => app.label);
  }
  getAppsWithBookmarks() {
    return this.apps.filter((app) => app.hasBookmarks).map((app) => app.label);
  }
  generateDiagram = (appName, flowName, flowType) => {
    return this.resolveFlow(appName, flowName, flowType)
      .then((flow) => {
        return generateGitGraphMarkdown(
          this.fileCodeUtils.getCodeToFileMap(),
          flowName,
          flow,
          flowType
        );
      })
      .then((markdown) => {
        const outputFile = path.join(
          this.projectDir,
          DIAGRAM_OUTPUT_DIR,
          appName,
          `${flowType}-${flowName}.md`
        );
        const outputDir = path.dirname(outputFile);
        fs.mkdirSync(outputDir, { recursive: true });
        return fsPromises
          .writeFile(outputFile, markdown, { flag: "w" })
          .then(() => {
            return outputFile;
          })
          .catch((err) => {
            return false;
          });
      });
  };
  dispose() {
    Object.keys(this.appLoaders).forEach((appName) => {
      this.appLoaders[appName].dispose();
    });
    this.appLoaders = null;
  }
}
exports.AppsManager = AppsManager;
