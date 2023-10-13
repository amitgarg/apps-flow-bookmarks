const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");
const { handleFileCode } = require("./utils/FileUtils");
const { AppLoader } = require("./AppLoader");
const { generateGitGraphMarkdown } = require("./utils/DiagramUtils");
const { FlowType } = require("./utils/Constants");

class AppsManager {
  constructor(
    context,
    projectDir,
    bookmarkFileName,
    joinedBookmarksFileName,
    appsFolder,
    activeBookmarksPath,
    diagramOutputDir
  ) {
    this.context = context;
    this.projectDir = projectDir;
    this.bookmarkFileName = bookmarkFileName;
    this.joinedBookmarksFileName = joinedBookmarksFileName;
    this.appsFolder = appsFolder;
    this.activeBookmarksPath = activeBookmarksPath;
    this.diagramOutputDir = diagramOutputDir;
    this.appLoaders = {};
    this.fileCodeUtils = handleFileCode();
    this.apps = [];
    this._refreshListOfApps();
  }

  reset = () => {
    this.appLoaders = {};
    this._refreshListOfApps();
  };
  getAppLoader = (appName) => {
    if (!this.appLoaders[appName]) {
      this.appLoaders[appName] = new AppLoader(
        this.context,
        appName,
        path.join(
          this.projectDir,
          this.appsFolder,
          appName,
          this.bookmarkFileName
        ),
        path.join(
          this.projectDir,
          this.appsFolder,
          appName,
          this.joinedBookmarksFileName
        ),
        path.join(
          this.projectDir,
          this.activeBookmarksPath,
          this.bookmarkFileName
        ),
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
    const folderPath = path.join(this.projectDir, this.appsFolder);
    const appDirs = fs
      .readdirSync(folderPath, { withFileTypes: true })
      .filter((file) => file.isDirectory());
    this.apps = appDirs.map(({name: appDir}) => {
      try {
        fs.accessSync(
          path.join(folderPath, appDir, this.bookmarkFileName),
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
    return flowType === FlowType.BASIC
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
          this.diagramOutputDir,
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
    this.apps = [];
    this.appLoaders = {};
  }
}
exports.AppsManager = AppsManager;
