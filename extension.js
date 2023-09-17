// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const { loadState, saveState } = require("./manage");
const AllFlowsProvider = require("./providers/AllFlowsProvider");
const FlowBookmarksProvider = require("./providers/FlowBookmarksProvider");
const { AppsManager } = require("./AppsManager");
const { getJoinFlowConfig } = require("./utils/FileUtils");
const BOOKMARKS_STATE_KEY = "tmpBookmarksState";
const bookmarkFileName = "multiColorBookmarks.json";
const joinedBookmarksFileName = "joinedBookmarks.json";
let myStatusBarItem;
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "helloworld-minimal-sample" is now active!'
  );
  const myExtension = vscode.extensions.getExtension(
    "DeepakPahawa.flowbookmark"
  );

  // Log some properties of the extension object
  //   console.log(myExtension.packageJSON.contributes);
  // Activate the extension if it's not already activated
  if (!myExtension.isActive) {
    myExtension.activate().then(() => {
      console.log("MCB Extension activated");
    });
  }

  let projectDir = getProjectDir();
  if (!projectDir) {
    vscode.window.showErrorMessage(
      "teams-modular-packages not found in workspace"
    );
    return;
  }
  // create a new status bar item that we can now manage
  myStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    10
  );
  context.subscriptions.push(myStatusBarItem);

  const appsManager = new AppsManager(context, projectDir);
  context.subscriptions.push(appsManager);

  let actionCreateBookmarksForApp = vscode.commands.registerCommand(
    "tmp.bookmarks.initializeForApp",
    () => {
      let state = context.globalState.get(BOOKMARKS_STATE_KEY) || {};

      vscode.window
        .showQuickPick(appsManager.getAppsWithoutBookmarks(), {
          placeHolder: "Select an App",
          title: "Create bookmarks related to App",
        })
        .then((appName) => {
          if (appName) {
            const appLoader = appsManager.getAppLoader(appName);
            return vscode.commands
              .executeCommand("flowbookmark.clearAll")
              .then(appLoader.initializeBookmarks)
              .then(({ success }) => {
                return vscode.commands
                  .executeCommand("flowbookmark.importFromFile")
                  .then(() => {
                    state.activeApp = appName;
                    context.globalState.update(BOOKMARKS_STATE_KEY, state);
                    updateStatusBarItem(appName);
                    vscode.window.showInformationMessage(success);
                    let data = {
                      appName: appName,
                      basicFlows: {},
                      joinedFlows: {},
                    };
                    allFlowsTreeDataProvider.setData(data);
                    allFlowsTreeDataProvider.refresh();
                  });
              });
          }
        });
    }
  );
  context.subscriptions.push(actionCreateBookmarksForApp);

  const allFlowsTreeDataProvider = new AllFlowsProvider({
    joinedFlows: {},
    appName: "None",
    basicFlows: {},
  });
  const allFlowsTreeView = vscode.window.createTreeView("allFlows", {
    treeDataProvider: allFlowsTreeDataProvider,
  });
  context.subscriptions.push(allFlowsTreeView);

  let actionLoadBookmarksForApp = vscode.commands.registerCommand(
    "tmp.bookmarks.loadFromApp",
    () => {
      vscode.window
        .showQuickPick(appsManager.getAppsWithBookmarks(), {
          placeHolder: "Select an App",
          title: "Load bookmarks from App",
        })
        .then(loadBookmarksFromApp)
        .then(() => {
          vscode.commands.executeCommand("setContext", "appLoaded", true);
        });
    }
  );
  context.subscriptions.push(actionLoadBookmarksForApp);

  let actionReloadBookmarksForApp = vscode.commands.registerCommand(
    "tmp.bookmarks.reloadFromApp",
    () => {
      let state = context.globalState.get(BOOKMARKS_STATE_KEY) || {};
      loadBookmarksFromApp(state.activeApp);
    }
  );
  context.subscriptions.push(actionReloadBookmarksForApp);

  const loadBookmarksFromApp = (appName) => {
    if (appName) {
      let state = context.globalState.get(BOOKMARKS_STATE_KEY) || {};
      const appLoader = appsManager.getAppLoader(appName);
      return vscode.commands
        .executeCommand("flowbookmark.clearAll")
        .then(appLoader.loadBookmarks)
        .then(({ success }) => {
          return vscode.commands
            .executeCommand("flowbookmark.importFromFile")
            .then(() => {
              state.activeApp = appName;
              context.globalState.update(BOOKMARKS_STATE_KEY, state);
              updateStatusBarItem(appName);
              vscode.window.showInformationMessage(success);
              appLoader.basicFlows.then((basicFlows) => {
                appLoader.joinedFlows.then((joinedFlows) => {
                  let data = {
                    appName: appName,
                    basicFlows,
                    joinedFlows,
                  };
                  allFlowsTreeDataProvider.setData(data);
                  allFlowsTreeDataProvider.refresh();
                });
              });
            });
        });
    }
  };

  const searchFlowsCommand = vscode.commands.registerCommand(
    "tmp.bookmarks.searchFlows",
    () => {
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
            "filterAllBookmarks",
            !!keywords
          );
        });
    }
  );
  context.subscriptions.push(searchFlowsCommand);
  const removeBookmarksFilterCommand = vscode.commands.registerCommand(
    "tmp.bookmarks.removeFilter",
    () => {
      allFlowsTreeDataProvider.setFilter("");
      allFlowsTreeDataProvider.refresh();
      vscode.commands.executeCommand("setContext", "filterAllBookmarks", false);
    }
  );
  context.subscriptions.push(removeBookmarksFilterCommand);

  const openFileToLineCommand = vscode.commands.registerCommand(
    "tmp.bookmarks.openFileToLine",
    (filePath, lineNumber) => {
      let line = parseInt(lineNumber);
      vscode.workspace.openTextDocument(filePath).then((doc) => {
        vscode.window.showTextDocument(doc, {
          selection: new vscode.Range(line - 1, 0, line - 1, 0),
        });
      });
    }
  );
  context.subscriptions.push(openFileToLineCommand);

  let actionSaveActiveBookmarksToAnApp = vscode.commands.registerCommand(
    "tmp.bookmarks.saveForApp",
    () => {
      let state = context.globalState.get(BOOKMARKS_STATE_KEY) || {};
      if (state.activeApp) {
        const appLoader = appsManager.getAppLoader(state.activeApp);
        vscode.commands
          .executeCommand("flowbookmark.exportMyBookmarks")
          .then(appLoader.saveBookmarks)
          .then(({ success }) => {
            vscode.window.showInformationMessage(success);
          });
      }
    }
  );
  context.subscriptions.push(actionSaveActiveBookmarksToAnApp);

  const searchFlowsAcrossAppsCommand = vscode.commands.registerCommand(
    "tmp.bookmarks.searchFlowsAcross",
    () => {
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
          const filesToInclude = `**/packages/apps/**/{${bookmarkFileName},${joinedBookmarksFileName}}`;
          vscode.commands.executeCommand("workbench.action.findInFiles", {
            query,
            filesToInclude,
            matchCase: false,
            isRegex: true,
          });
        });
    }
  );
  context.subscriptions.push(searchFlowsAcrossAppsCommand);

  const flowBookmarksProvider = new FlowBookmarksProvider(
    [],
    projectDir,
    context
  );
  const flowBookmarksTreeView = vscode.window.createTreeView("flowBookmarks", {
    treeDataProvider: flowBookmarksProvider,
  });
  context.subscriptions.push(flowBookmarksTreeView);

  const openFlowCommand = vscode.commands.registerCommand(
    "tmp.bookmarks.openFlow",
    ({ label, app, flowType }) => {
      appsManager
        .resolveFlow(app, label, flowType)
        .then((bookmarks) => {
          return [{ flowName: label, bookmarks }];
        })
        .then((data) => {
          flowBookmarksProvider.setData(data);
          flowBookmarksProvider.refresh();
        });
    }
  );
  context.subscriptions.push(openFlowCommand);

  const createDiagramCommand = vscode.commands.registerCommand(
    "tmp.bookmarks.diagram",
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
    "tmp.bookmarks.copyAppFlow",
    ({ label, flowType, app }) => {
      let textToCopyPromise;
      if (flowType === "joined") {
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
  let state = context.globalState.get(BOOKMARKS_STATE_KEY) || {};
  updateStatusBarItem(state.activeApp || "None");
}

function updateStatusBarItem(appName) {
  myStatusBarItem.text = `Bookmarks: ${appName}`;
  myStatusBarItem.show();
}
function getProjectDir() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders) {
    let project = workspaceFolders.find((folder) =>
      folder.uri.fsPath.endsWith("teams-modular-packages")
    );
    return project.uri.fsPath;
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
