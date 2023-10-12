const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
// const { loadState, saveState } = require("./manage");
const AllFlowsProvider = require("./providers/AllFlowsProvider");
const FlowBookmarksProvider = require("./providers/FlowBookmarksProvider");
const { AppsManager } = require("./AppsManager");
const { getJoinFlowConfig } = require("./utils/FileUtils");
const { FlowType } = require("./utils/Constants");

const bookmarkFileName = "multiColorBookmarks.json";
const joinedBookmarksFileName = "joinedBookmarks.json";

const activeBookmarksPath = ".vscode";

let myStatusBarItem;
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "appwise-code-navigator" is now active!'
  );

  const myExtension = vscode.extensions.getExtension(
    "DeepakPahawa.flowbookmark"
  );

  // Activate the extension if it's not already activated
  if (!myExtension.isActive) {
    myExtension.activate().then(() => {
      console.log("MCB Extension activated");
    });
  }

  // create a new status bar item that we can now manage
  myStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    10
  );
  context.subscriptions.push(myStatusBarItem);
  let activeApp;
  let isWithoutError = true;
  let appsManager;
  let diagramOutputDir;
  let projectName;
  let appsFolder;

  initializeWithConfiguration(true);

  const defaultAllFlowsProviderData = {
    joinedFlows: {},
    appName: "None",
    basicFlows: {},
  };
  const allFlowsTreeDataProvider = new AllFlowsProvider(
    defaultAllFlowsProviderData
  );
  const allFlowsTreeView = vscode.window.createTreeView("allFlows", {
    treeDataProvider: allFlowsTreeDataProvider,
  });
  context.subscriptions.push(allFlowsTreeView);

  const flowBookmarksProvider = new FlowBookmarksProvider(
    {},
    projectDir,
    context
  );
  const flowBookmarksTreeView = vscode.window.createTreeView("flowBookmarks", {
    treeDataProvider: flowBookmarksProvider,
  });
  context.subscriptions.push(flowBookmarksTreeView);

  // Whenever switch to a different branch, which might have different bookmarks, it is better to run this command.
  let actionReset = vscode.commands.registerCommand(
    "acn.bookmarks.reset",
    () => {
      initializeWithConfiguration(false);
    }
  );
  context.subscriptions.push(actionReset);

  let actionCreateBookmarksForApp = vscode.commands.registerCommand(
    "acn.bookmarks.initializeForApp",
    () => {
      vscode.window
        .showQuickPick(appsManager.getAppsWithoutBookmarks(), {
          placeHolder: "Select an App",
          title: "Create bookmarks related to App",
        })
        .then((appName) => {
          loadBookmarksFromApp(appName, true);
        });
    }
  );
  context.subscriptions.push(actionCreateBookmarksForApp);

  let actionLoadBookmarksForApp = vscode.commands.registerCommand(
    "acn.bookmarks.loadFromApp",
    () => {
      vscode.window
        .showQuickPick(appsManager.getAppsWithBookmarks(), {
          placeHolder: "Select an App",
          title: "Load bookmarks from App",
        })
        .then(loadBookmarksFromApp);
    }
  );
  context.subscriptions.push(actionLoadBookmarksForApp);

  let actionReloadBookmarksForApp = vscode.commands.registerCommand(
    "acn.bookmarks.reloadFlows",
    () => {
      if (isWithoutError && activeApp) {
        loadBookmarksFromApp(activeApp);
      }
    }
  );
  context.subscriptions.push(actionReloadBookmarksForApp);

  const loadBookmarksFromApp = (appName, intialize) => {
    if (appName) {
      const appLoader = appsManager.getAppLoader(appName);
      return appLoader
        .loadBookmarks(intialize)
        .then(({ success }) => {
          vscode.window.showInformationMessage(success);
          activeApp = appName;
          updateStatusBarItem(appName);
          return vscode.commands.executeCommand("flowbookmark.clearAll");
        })
        .then(() => {
          Promise.all([appLoader.basicFlows, appLoader.joinedFlows]).then(
            ([basicFlows, joinedFlows]) => {
              let data = {
                appName: appName,
                basicFlows,
                joinedFlows,
              };
              allFlowsTreeDataProvider.setData(data);
              allFlowsTreeDataProvider.refresh();
              flowBookmarksProvider.setData({});
              flowBookmarksProvider.refresh();
            }
          );
        })
        .then(() => {
          return vscode.commands.executeCommand("flowbookmark.importFromFile");
        })
        .then(() => {
          vscode.commands.executeCommand("setContext", "appLoaded", !intialize);
        });
    }
  };

  const manageJoinedBookmarksCommand = vscode.commands.registerCommand(
    "acn.bookmarks.manageJoinedBookmarks",
    (flowInfo) => {
      if (isWithoutError) {
        if (flowInfo && flowInfo.flowType === FlowType.JOINED) {
          if (activeApp) {
            const appLoader = appsManager.getAppLoader(activeApp);
            appLoader.manageJoinedBookmarks();
          }
        } else {
          vscode.window
            .showQuickPick(appsManager.getAppsWithBookmarks(), {
              placeHolder: "Select an App",
              title: "Manage Joined Flows for App",
            })
            .then((appName) => {
              const appLoader = appsManager.getAppLoader(appName);
              appLoader.manageJoinedBookmarks();
            });
        }
      }
    }
  );
  context.subscriptions.push(manageJoinedBookmarksCommand);

  const searchFlowsCommand = vscode.commands.registerCommand(
    "acn.bookmarks.filterFlows",
    () => {
      if (isWithoutError) {
        vscode.window
          .showInputBox({
            placeHolder: "Enter keywords",
            prompt: "Search Flows with keywords",
            value: "",
            ignoreFocusOut: true,
          })
          .then((keywords) => {
            allFlowsTreeDataProvider.setFilter(keywords);
            allFlowsTreeDataProvider.refresh();
            vscode.commands.executeCommand(
              "setContext",
              "allFlows.filter",
              !!keywords
            );
          });
      }
    }
  );
  context.subscriptions.push(searchFlowsCommand);

  const removeFlowsFilterCommand = vscode.commands.registerCommand(
    "acn.bookmarks.removeFlowsFilter",
    () => {
      if (isWithoutError) {
        allFlowsTreeDataProvider.setFilter("");
        allFlowsTreeDataProvider.refresh();
        vscode.commands.executeCommand("setContext", "allFlows.filter", false);
      }
    }
  );
  context.subscriptions.push(removeFlowsFilterCommand);

  const filterBookmarksCommand = vscode.commands.registerCommand(
    "acn.bookmarks.filterBookmarks",
    () => {
      if (isWithoutError) {
        vscode.window
          .showInputBox({
            placeHolder: "Enter keywords",
            prompt: "Search Bookmarks with keywords",
            value: "",
            ignoreFocusOut: true,
          })
          .then((keywords) => {
            flowBookmarksProvider.setFilter(keywords);
            flowBookmarksProvider.refresh();
            vscode.commands.executeCommand(
              "setContext",
              "flowBookmarks.filter",
              !!keywords
            );
          });
      }
    }
  );
  context.subscriptions.push(filterBookmarksCommand);

  const removeBookmarksFilterCommand = vscode.commands.registerCommand(
    "acn.bookmarks.removeBookmarksFilter",
    () => {
      if (isWithoutError) {
        flowBookmarksProvider.setFilter("");
        flowBookmarksProvider.refresh();
        vscode.commands.executeCommand(
          "setContext",
          "flowBookmarks.filter",
          false
        );
      }
    }
  );
  context.subscriptions.push(removeBookmarksFilterCommand);

  const openFileToLineCommand = vscode.commands.registerCommand(
    "acn.bookmarks.openFileToLine",
    (filePath, lineNumber) => {
      if (filePath) {
        let line = parseInt(lineNumber);
        vscode.workspace.openTextDocument(filePath).then((doc) => {
          vscode.window.showTextDocument(doc, {
            selection: new vscode.Range(line - 1, 0, line - 1, 0),
          });
        });
      }
    }
  );
  context.subscriptions.push(openFileToLineCommand);

  let actionSaveActiveBookmarksToAnApp = vscode.commands.registerCommand(
    "acn.bookmarks.saveForApp",
    () => {
      if (isWithoutError && activeApp) {
        const appLoader = appsManager.getAppLoader(activeApp);
        vscode.commands
          .executeCommand("flowbookmark.exportMyBookmarks")
          .then(appLoader.saveBookmarks)
          .then(({ success }) => {
            vscode.window.showInformationMessage(success);
            //removed the need to reload the bookmarks manually
            loadBookmarksFromApp(activeApp);
          });
      }
    }
  );
  context.subscriptions.push(actionSaveActiveBookmarksToAnApp);

  const searchFlowsAcrossAppsCommand = vscode.commands.registerCommand(
    "acn.bookmarks.searchFlowsAcross",
    () => {
      if (isWithoutError) {
        vscode.window
          .showInputBox({
            placeHolder: "Enter keywords",
            prompt: "Search Flows Across Appswith keywords",
            value: "",
            ignoreFocusOut: true,
          })
          .then((keywords) => {
            const query = keywords
              .split(" ")
              .map((keyword) => `(${keyword})`)
              .join("|");
            const filesToInclude = `${appsFolder}/**/{${bookmarkFileName},${joinedBookmarksFileName}}`;
            vscode.commands.executeCommand("workbench.action.findInFiles", {
              query,
              filesToInclude,
              matchCase: false,
              isRegex: true,
            });
          });
      }
    }
  );
  context.subscriptions.push(searchFlowsAcrossAppsCommand);

  const openFlowCommand = vscode.commands.registerCommand(
    "acn.bookmarks.openFlow",
    ({ label, app, flowType }) => {
      appsManager
        .resolveFlow(app, label, flowType)
        .then((bookmarks) => {
          return { flowName: label, bookmarks };
        })
        .then((data) => {
          flowBookmarksProvider.setData(data);
          flowBookmarksProvider.refresh();
        });
    }
  );
  context.subscriptions.push(openFlowCommand);

  const createDiagramCommand = vscode.commands.registerCommand(
    "acn.bookmarks.diagram",
    ({ label, flowType, app }) => {
      appsManager.generateDiagram(app, label, flowType).then((path) => {
        if (path) {
          vscode.workspace.openTextDocument(path).then((document) => {
            vscode.window.showTextDocument(document, {
              selection: new vscode.Range(1, 0, 2, 0),
            });
          });
        }
      });
    }
  );
  context.subscriptions.push(createDiagramCommand);

  const copyAppFlowCommand = vscode.commands.registerCommand(
    "acn.bookmarks.copyAppFlow",
    ({ label, flowType, app }) => {
      let textToCopyPromise;
      if (flowType === FlowType.JOINED) {
        textToCopyPromise = appsManager
          .getAppLoader(app)
          .joinedFlows.then((config) => {
            return config[label];
          })
          .then((subflows) => {
            return subflows.map(getJoinFlowConfig).join(",");
          });
      } else {
        textToCopyPromise = Promise.resolve(
          getJoinFlowConfig({ app, flow: label })
        );
      }
      textToCopyPromise.then((textToCopy) => {
        vscode.env.clipboard
          .writeText(textToCopy)
          .then(() => {
            vscode.window.showInformationMessage(
              `Json Snippet copied to clipboard\n\n${textToCopy}`
            );
          })
          .catch((err) => {
            vscode.window.showErrorMessage("Failed to copy text to clipboard:");
          });
      });
    }
  );
  context.subscriptions.push(copyAppFlowCommand);

  function initializeWithConfiguration(isFirstInitialization) {
    const config = vscode.workspace.getConfiguration("codeNavigator");
    diagramOutputDir = config.get("diagramsDir");
    projectName = config.get("projectName");
    appsFolder = config.get("appsDir");

    projectDir = getProjectDir(projectName);
    if (projectDir) {
      if (fs.existsSync(path.join(projectDir, appsFolder))) {
        if (appsManager) {
          appsManager.dispose();
        }
        appsManager = new AppsManager(
          context,
          projectDir,
          bookmarkFileName,
          joinedBookmarksFileName,
          appsFolder,
          activeBookmarksPath,
          diagramOutputDir
        );
        resetUI("None", !isFirstInitialization);
        isWithoutError = true;
        context.subscriptions.push(appsManager);
      } else {
        vscode.window.showErrorMessage(
          `Apps folder ${appsFolder} does not exist`
        );
        resetUI("PATH_ERROR", !isFirstInitialization);
        isWithoutError = false;
      }
    } else {
      vscode.window.showErrorMessage(`${projectName} not found in workspace`);
      resetUI("PATH_ERROR", !isFirstInitialization);
    }
  }
  function ExtensionState() {
    this.isInitialized = false;
    this.activeApp;
    this.isError;
    this.initialize = () => {
      resetUI("None", this.isInitialized);
      this.isInitialized = true;
    }
    this.setPathError = (isAppPathError, path) => {
      this.activeApp = undefined;
      this.isError = true;
      vscode.window.showErrorMessage(
        isAppPathError? `Apps folder ${path} does not exist`: `${path} not found in workspace`
      );
      resetUI("PATH_ERROR", this.isInitialized);
      this.isInitialized = true;
    };
    this.setActiveApp = (appName) => {
      this.activeApp = appName;
      this.isError = false;
      resetUI(appName, false);
      this.isInitialized = true;
    };
  }

  function resetUI(status, refreshTrees) {
    if (refreshTrees) {
      allFlowsTreeDataProvider.setData(defaultAllFlowsProviderData);
      allFlowsTreeDataProvider.refresh();
      flowBookmarksProvider.setData({});
      flowBookmarksProvider.refresh();
    }
    vscode.commands.executeCommand("flowbookmark.clearAll");
    updateStatusBarItem(status || "None");
  }
}

function updateStatusBarItem(appName) {
  myStatusBarItem.text = `Bookmarks: ${appName}`;
  myStatusBarItem.color = appName == "PATH_ERROR" ? "#F00" : undefined;
  myStatusBarItem.show();
}
function getProjectDir(projectName) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders) {
    let project = workspaceFolders.find((folder) =>
      folder.uri.fsPath.endsWith(projectName)
    );
    return project && project.uri.fsPath;
  }
}

// this method is called when your extension is deactivated
function deactivate() {
  console.log("deactivated");
}

// eslint-disable-next-line no-undef
module.exports = {
  activate,
  deactivate,
};
