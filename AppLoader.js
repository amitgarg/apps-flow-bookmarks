const fs = require("fs").promises;
const path = require("path");

class AppLoader {
  constructor(
    context,
    appName,
    appBookmarksFile,
    joinedBookmarksFile,
    activeBookmarksFile,
    getCodeToFileMap,
    getFileCode,
    onChangeBookmarksStatus
  ) {
    this.context = context;
    this.appName = appName;
    this.appBookmarksFile = appBookmarksFile;
    this.joinedBookmarksFile = joinedBookmarksFile;
    this.activeBookmarksFile = activeBookmarksFile;
    this.getCodeToFileMap = getCodeToFileMap;
    this.getFileCode = getFileCode;
    this.onChangeBookmarksStatus = onChangeBookmarksStatus;
    this.basicFlows;
    this.joinedFlows;
    this.enabledBreakpoints = {};
  }

  initializeBookmarks = () => {
    const fileContent = "{}";
    return fs.writeFile(this.activeBookmarksFile, fileContent).then(() => {
      this.basicFlows = {};
      this.joinedFlows = {};
      this.onChangeBookmarksStatus(this.appName, true);
    });
  };

  loadBookmarks = (intialize) => {
    if (intialize) {
      return this.initializeBookmarks();
    }
    return fs
      .copyFile(this.appBookmarksFile, this.activeBookmarksFile)
      .then(() => {
        this._populateBasicFlows();
        this._populateJoinedFlows();
      });
  };

  saveBookmarks = () => {
    return fs.mkdir(path.dirname(this.appBookmarksFile), { recursive: true }).then(
      () => {
        return fs.copyFile(this.activeBookmarksFile, this.appBookmarksFile);
      }
    );
  };

  manageJoinedBookmarks = () => {
    const filePath = this.joinedBookmarksFile;
    return fs
      .access(filePath, fs.constants.F_OK)
      .catch((error) => {
        // File does not exist, create it
        return fs.writeFile(filePath, "{}");
      })
      .then(() => {
        return filePath;
      });
  };

  _populateBasicFlows = () => {
    this.basicFlows = fs
      .readFile(this.appBookmarksFile, "utf8")
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
              index,
              ...codeToFileMap[code],
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
            code: "FLOW_NOT_FOUND",
            description: "--- FLOW_NOT_FOUND ---",
            dirPath: "",
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
      .readFile(this.joinedBookmarksFile, "utf8")
      .then((data) => {
        return JSON.parse(data);
      })
      .catch((err) => {
        return {};
      });
  };

  toggleBreakpoints = (flowName) => {
    this.enabledBreakpoints[flowName] = !this.enabledBreakpoints[flowName];
  }

  getBreakpointsStatus = (flowName) => {
    return this.enabledBreakpoints[flowName] || false;
  }

  dispose() {
    this.basicFlows = null;
    this.joinedFlows = null;
  }
}
module.exports = AppLoader;
