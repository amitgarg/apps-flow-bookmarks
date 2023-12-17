const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");
const { handleFileCode } = require("./utils/FileUtils");
const AppLoader = require("./AppLoader");
const { generateDiagram } = require("./utils/DiagramUtils");
const { FlowType } = require("./utils/Constants");
const { moveBookmark, rearrangeBookmarks } = require("./utils/RearrangeUtils");

class AppsManager {
  constructor(
    context,
    projectDir,
    bookmarkFileName,
    joinedBookmarksFileName,
    appsFolder,
    metaDir,
    activeBookmarksPath,
    diagramOutputDir,
    diagramsType,
    showLineNumbers,
    enableCustomAppNames
  ) {
    this.context = context;
    this.projectDir = projectDir;
    this.bookmarkFileName = bookmarkFileName;
    this.joinedBookmarksFileName = joinedBookmarksFileName;
    this.appsFolder = appsFolder;
    this.metaDir = metaDir;
    this.activeBookmarksPath = activeBookmarksPath;
    this.diagramOutputDir = diagramOutputDir;
    this.diagramsType = diagramsType;
    this.showLineNumbers = showLineNumbers;
    this.enableCustomAppNames = enableCustomAppNames;
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
          this.metaDir,
          appName,
          this.bookmarkFileName
        ),
        path.join(
          this.projectDir,
          this.metaDir,
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
    } else if (this.enableCustomAppNames) {
      this.apps.push({ label: appName, hasBookmarks });
    }
  };

  _refreshListOfApps() {
    const appsFolderPath = path.join(this.projectDir, this.appsFolder);
    const metaDirPath = path.join(this.projectDir, this.metaDir);

    const metaDirs = fs
      .readdirSync(metaDirPath, { withFileTypes: true })
      .filter((file) => {
        if (file.isDirectory()) {
          try {
            fs.accessSync(
              path.join(metaDirPath, file.name, this.bookmarkFileName),
              fs.constants.F_OK
            );
            return true;
          } catch (e) {
            return false;
          }
        } else {
          return false;
        }
      });
    if (this.appsFolder == "") {
      if (this.enableCustomAppNames) {
        this.apps = metaDirs.map(({ name: appDir }) => {
          return { label: appDir, hasBookmarks: true, custom: true };
        });
      } else {
        this.apps = [];
      }
    } else {
      this.apps = fs
        .readdirSync(appsFolderPath, { withFileTypes: true })
        .filter((file) => file.isDirectory())
        .map(({ name: appDir }) => {
          return { label: appDir, hasBookmarks: false, custom: false };
        });
      metaDirs.forEach(({ name: appDir }) => {
        let app = this.apps.find((app) => app.label === appDir);
        if (app) {
          app.hasBookmarks = true;
        } else if (this.enableCustomAppNames) {
          this.apps.push({ label: appDir, hasBookmarks: true, custom: true });
        }
      });
    }
  }
  _resolveJoinedFlow = (appName, flowName) => {
    return this.getAppLoader(appName)
      .getJoinedFlow(flowName)
      .then((subflows) => {
        return Promise.all(
          subflows.map((subflow) => {
            return this._resolveBasicFlow(subflow.app, subflow.flow);// this.getAppLoader(subflow.app).getBasicFlow(subflow.flow);
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
        return generateDiagram(
          this.diagramsType,
          this.fileCodeUtils.getCodeToFileMap(),
          flowName,
          flow,
          this.showLineNumbers
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
  moveBookmark = (appName, flowName, fromIndex, toIndex) => {
    return this.resolveFlow(appName, flowName, FlowType.BASIC).then(
      (bookmarks) => {
        const filePath = path.join(
          this.projectDir,
          this.activeBookmarksPath,
          this.bookmarkFileName
        );
        return moveBookmark(flowName, fromIndex, toIndex, filePath, bookmarks);
      }
    );
  };
  reArrangeBookmarks = (flowName) => {
    const filePath = path.join(
      this.projectDir,
      this.activeBookmarksPath,
      this.bookmarkFileName
    );
    return rearrangeBookmarks(flowName, filePath);
  };
  dispose() {
    Object.keys(this.appLoaders).forEach((appName) => {
      this.appLoaders[appName].dispose();
    });
    this.apps = [];
    this.appLoaders = {};
  }
}
module.exports = AppsManager;
