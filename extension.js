// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const { loadState, saveState } = require("./manage");
const AllFlowsProvider = require("./providers/AllFlowsProvider");
const FlowBookmarksProvider = require("./providers/FlowBookmarksProvider");
const { AppsManager } = require("./AppsManager");
const { getJoinFlowConfig } = require("./utils/FileUtils");
const BOOKMARKS_STATE_KEY = "tmpBookmarksState";
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
const BASIC_FLOWS_KEY = "Basic Flows";
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
  console.log(myExtension.packageJSON.contributes);
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

  const appsManager = new AppsManager(context, projectDir);

  const allFlowsTreeDataProvider = new AllFlowsProvider({
    joinedFlows: {},
    appName: "None",
    basicFlows: {},
  });
  vscode.window.createTreeView("allFlows", {
    treeDataProvider: allFlowsTreeDataProvider,
  });

  let actionActivateBookmarksForApp = vscode.commands.registerCommand(
    "tmp.bookmarks.loadFromApp",
    () => {
      let state = context.globalState.get(BOOKMARKS_STATE_KEY) || {};
      vscode.window
        .showQuickPick(appsManager.getAppsWithBookmarks(), {
          placeHolder: "Select an App",
          title: "Load bookmarks from App",
        })
        .then((appName) => {
          const appLoader = appsManager.getAppLoader(appName);
          vscode.commands
            .executeCommand("flowbookmark.clearAll")
            .then(appLoader.loadBookmarks)
            .then(({ success }) => {
              return vscode.commands
                .executeCommand("flowbookmark.importFromFile")
                .then(() => {
                  state.activeApp = appName;
                  context.globalState.update(BOOKMARKS_STATE_KEY, state);
                  updateStatusBarItem(appName);
                  showTimeoutInfoMessage(success);
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
        });
    }
  );
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
          const appLoader = appsManager.getAppLoader(appName);
          vscode.commands
            .executeCommand("flowbookmark.clearAll")
            .then(appLoader.initializeBookmarks)
            .then(({ success }) => {
              vscode.commands
                .executeCommand("flowbookmark.importFromFile")
                .then(() => {
                  state.activeApp = appName;
                  context.globalState.update(BOOKMARKS_STATE_KEY, state);
                  updateStatusBarItem(appName);
                  showTimeoutInfoMessage(success);
                });
            });
        });
    }
  );
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
            showTimeoutInfoMessage(success);
          });
      }
    }
  );

  // create a new status bar item that we can now manage
  myStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    10
  );

  const disposableCommand = vscode.commands.registerCommand(
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
  const searchFlowsCommand = vscode.commands.registerCommand(
    "tmp.bookmarks.searchFlows",
    () => {
    //   vscode.commands
    //     .executeCommand("workbench.action.quickOpen")
    //     .then((result) => {
    //       if (result && result.toString().startsWith("file ")) {
    //         const filePath = result.toString().substring(5);
    //         const fileName = filePath.split("/").pop();
    //         console.log(fileName);
    //         vscode.window.showInformationMessage(`Selected file: ${fileName}`);
    //       }
    //     });
	// vscode.commands
    //             .executeCommand("search.action.openNewEditor")
	
    //     vscode.window
    //       .showInputBox({
    //         placeHolder: "Enter keywords",
    //         prompt: "Search Flows with keywords",
    //         value: "",
    //         ignoreFocusOut: true,
    //       })
    //       .then((keywords) => {
    //         const query = keywords
    //           .split(" ")
    //           .map((keyword) => `(${keyword})`)
    //           .join("|");
    //         // const filesToInclude = `**/packages/apps/**/${bookmarkFileName}, **/packages/apps/**/${joinedBookmarksFileName}`;
	// 		const filesToInclude = `**/packages/apps/**/{${bookmarkFileName},${joinedBookmarksFileName}}`;
	// 		const queryOptions = {
	// 			maxResults: 10,
	// 			include: "/packages/apps/**",
	// 			exclude: '/node_modules/**',
	// 			previewOptions: {
	// 				matchLines: 1,
	// 				charsPerLine: 100,
	// 			  }
	// 		  };
	// 		const files = vscode.workspace.findFiles(filesToInclude);
	// 		files.then((files) => {
	// 			console.log(files);
	// 		});
    //         // vscode.commands.executeCommand("workbench.action.findInFiles", {
    //         //   query,
    //         //   filesToInclude,
    //         //   matchCase: false,
    //         //   isRegex: true,
    //         // });
    //       });
    }
  );

  const treeDataProvider1 = new FlowBookmarksProvider([], projectDir);
  const joinedFlowBookmarksTreeView = vscode.window.createTreeView(
    "flowBookmarks",
    {
      treeDataProvider: treeDataProvider1,
    }
  );

  const openJoinedFlowCommand = vscode.commands.registerCommand(
    "tmp.bookmarks.openJoinedFlow",
    ({ label, app, flowType }) => {
      appsManager
        .resolveFlow(app, label, flowType)
        .then((bookmarks) => {
          return [{ flowName: label, bookmarks }];
        })
        .then((data) => {
          treeDataProvider1.setData(data);
          treeDataProvider1.refresh();
        });
    }
  );

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
            showTimeoutInfoMessage(
              `Json Snippet copied to clipboard\n\n${textToCopy}`
            );
          })
          .catch((err) => {
            vscode.window.showErrorMessage("Failed to copy text to clipboard:");
          });
      });
    }
  );

  //   context.subscriptions.push(disposableCommand);

  context.subscriptions.push(myStatusBarItem);
  context.subscriptions.push(actionCreateBookmarksForApp);
  context.subscriptions.push(actionActivateBookmarksForApp);
  context.subscriptions.push(actionSaveActiveBookmarksToAnApp);

  let state = context.globalState.get(BOOKMARKS_STATE_KEY) || {};
  updateStatusBarItem(state.activeApp || "None");
}

function showTimeoutInfoMessage(message, timeout = 1000) {
  let messageInfo = vscode.window.showInformationMessage(message);
  setTimeout(() => {
    messageInfo.dispose();
  }, timeout);
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
