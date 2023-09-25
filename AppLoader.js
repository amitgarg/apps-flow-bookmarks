const fs = require("fs").promises;
const path = require("path");
const vscode = require("vscode");
const appsFolder = "packages/apps";
const activeBookmarksPath = ".vscode";
const bookmarkFileName = "multiColorBookmarks.json";
const joinedBookmarksFileName = "joinedBookmarks.json";

class AppLoader {
  constructor(
    context,
    projectDir,
    appName,
    getCodeToFileMap,
    getFileCode,
    onChangeBookmarksStatus
  ) {
    this.context = context;
    this.projectDir = projectDir;
    this.appName = appName;
    this.getCodeToFileMap = getCodeToFileMap;
    this.getFileCode = getFileCode;
    this.onChangeBookmarksStatus = onChangeBookmarksStatus;
    this.basicFlows;
    this.joinedFlows;
  }

  initializeBookmarks = () => {
    const fileContent = "{}";
    return fs
      .writeFile(
        path.join(this.projectDir, activeBookmarksPath, bookmarkFileName),
        fileContent
      )
      .then(() => {
        this.onChangeBookmarksStatus(this.appName, true);
        return { success: `Bookmarks initialized for app ${this.appName}` };
      })
      .catch((err) => {
        return {
          error: `Unable to initialize bookmarks for app ${this.appName}`,
        };
      });
  };
  
  loadBookmarks = () => {
    return fs
      .copyFile(
        path.join(this.projectDir, appsFolder, this.appName, bookmarkFileName),
        path.join(this.projectDir, activeBookmarksPath, bookmarkFileName)
      )
      .then(() => {
        this._populateBasicFlows();
        this._populateJoinedFlows();
        return { success: `Bookmarks loaded for app ${this.appName}` };
      })
      .catch((err) => {
        return { error: `Unable to Load Bookmarks for app ${this.appName}` };
      });
  };

  saveBookmarks = () => {
    return fs
      .copyFile(
        path.join(this.projectDir, activeBookmarksPath, bookmarkFileName),
        path.join(this.projectDir, appsFolder, this.appName, bookmarkFileName)
      )
      .then(() => {
        return { success: `Bookmarks saved for app ${this.appName}` };
      })
      .catch((err) => {
        return { error: `Unable to save Bookmarks for app ${this.appName}` };
      });
  };

  manageJoinedBookmarks = () => {
    const filePath = path.join(
      this.projectDir,
      appsFolder,
      this.appName,
      joinedBookmarksFileName
    );
    return fs
      .access(filePath, fs.constants.F_OK)
      .catch((error) => {
        // File does not exist, create it
        return fs.writeFile(filePath, "{}");
      })
      .then(() => {
        return vscode.workspace.openTextDocument(filePath).then((doc) => {
          vscode.window.showTextDocument(doc);
        });
      });
  };

  _populateBasicFlows = () => {
    this.basicFlows = fs
      .readFile(
        path.join(this.projectDir, appsFolder, this.appName, bookmarkFileName),
        "utf8"
      )
      .then((data) => {
        // Parse the JSON data
        const jsonData = JSON.parse(data);

        const flows = {};
        const codeToFileMap = this.getCodeToFileMap();
        Object.keys(jsonData).forEach((key) => {
          const code = this.getFileCode(key);
          Object.keys(jsonData[key]).forEach((lineNumber) => {
            const [description, flowName, index, text] =
              jsonData[key][lineNumber];
            if (!flows[flowName]) {
              flows[flowName] = [];
            }
            flows[flowName][index] = {
              code,
              description: description,
              text,
              lineNumber,
              path: key,
              fileName: codeToFileMap[code].fileName,
            };
          });
        });
        return flows;
      });
  };

  getBasicFlow = (flowName) => {
    if (!this.basicFlows) {
      this._populateBasicFlows();
    }
    return this.basicFlows.then((flows) => {
      return (
        flows[flowName] || [
          {
            description: "--- BOOKMARK_NOT_FOUND ---",
            path: "",
            fileName: "file-not-found",
            lineNumber: 0,
          },
        ]
      );
    });
  };

  getJoinedFlow = (flowName) => {
    if (!this.joinedFlows) {
      this._populateJoinedFlows();
    }
    return this.joinedFlows.then((joinedFlows) => {
      return (
        joinedFlows[flowName] || {
          app: appName,
          flow: "No subflows found for this flow",
        }
      );
    });
  };

  _populateJoinedFlows = () => {
    this.joinedFlows = fs
      .readFile(
        path.join(
          this.projectDir,
          appsFolder,
          this.appName,
          joinedBookmarksFileName
        ),
        "utf8"
      )
      .then((data) => {
        return JSON.parse(data);
      })
      .catch((err) => {
        return {};
      });
  };

  dispose() {
    this.basicFlows = null;
    this.joinedFlows = null;
  }
}
exports.AppLoader = AppLoader;
