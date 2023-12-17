const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
// const { loadState, saveState } = require("./manage");
const AllFlowsProvider = require("./providers/AllFlowsProvider");
const FlowBookmarksProvider = require("./providers/FlowBookmarksProvider");
const FlowFilesProvider = require("./providers/FlowFilesProvider");

const AppsManager = require("./AppsManager");
const TagManager = require("./TagManager");
const { getJoinFlowConfig } = require("./utils/FileUtils");
const { runTest } = require("./utils/TestUtils");
const { FlowType } = require("./utils/Constants");

const bookmarkFileName = "multiColorBookmarks.json";
const joinedBookmarksFileName = "joinedBookmarks.json";
const activeBookmarksPath = ".vscode";
const tagFileName = "bookmarkTags.json";

let myStatusBarItem;
/**
 * @param {vscode.ExtensionContext} context
 */

function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  const outputChannel = vscode.window.createOutputChannel(
    "Appwise Code Navigator"
  );
  function log(message, error) {
    if (!error) {
      outputChannel.appendLine(`Success: ${message}`);
    } else {
      outputChannel.appendLine(`Failed: ${message}`);
    }
  }
  // outputChannel.show();

  log(
    'Congratulations, your extension "appwise-code-navigator" is now active!'
  );

  const mcbExtension = vscode.extensions.getExtension(
    "DeepakPahawa.flowbookmark"
  );

  // Activate the extension if it's not already activated
  if (!mcbExtension.isActive) {
    mcbExtension.activate().then(() => {
      log("MCB Extension activated");
    });
  }

  // create a new status bar item that we can now manage
  myStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    10
  );
  context.subscriptions.push(myStatusBarItem);
  let state = new ExtensionState();
  let appsManager;
  let metaDir;
  let tagManager;
  let testRunCommand;
  let testRunCoverageCommand;
  let enableCustomAppNames;

  const defaultAllFlowsProviderData = {
    joinedFlows: {},
    appName: "None",
    basicFlows: {},
  };
  const allFlowsTreeDataProvider = new AllFlowsProvider(
    defaultAllFlowsProviderData,
    { contextKey: "allFlows" }
  );
  const allFlowsTreeView = vscode.window.createTreeView("allFlows", {
    treeDataProvider: allFlowsTreeDataProvider,
  });
  context.subscriptions.push(allFlowsTreeView);

  initializeWithConfiguration();

  const flowBookmarksProvider = new FlowBookmarksProvider(
    {},
    { projectDir, contextKey: "flowBookmarks" }
  );
  const flowBookmarksTreeView = vscode.window.createTreeView("flowBookmarks", {
    treeDataProvider: flowBookmarksProvider,
  });
  context.subscriptions.push(flowBookmarksTreeView);

  const flowFilesProvider = new FlowFilesProvider(
    {},
    { projectDir, contextKey: "flowFiles" }
  );
  const flowFilesTreeView = vscode.window.createTreeView("flowFiles", {
    treeDataProvider: flowFilesProvider,
  });
  context.subscriptions.push(flowFilesTreeView);

  // Whenever switch to a different branch, which might have different bookmarks, it is better to run this command.
  let actionReset = vscode.commands.registerCommand(
    "acn.bookmarks.reset",
    () => {
      initializeWithConfiguration();
      log("Resetting plugin");
    }
  );
  context.subscriptions.push(actionReset);

  let actionCreateBookmarksForApp = vscode.commands.registerCommand(
    "acn.bookmarks.initializeForApp",
    () => {
      if (!state.isError) {
        let apps = [];
        if (enableCustomAppNames) {
          apps = ["+ Add New App"];
        }
        apps = [...apps, ...appsManager.getAppsWithoutBookmarks()];
        vscode.window
          .showQuickPick(apps, {
            placeHolder: "Select an App",
            title: "Create bookmarks related to App",
          })
          .then((appName) => {
            if (appName === "+ Add New App") {
              vscode.window
                .showInputBox({
                  placeHolder: "Enter App Name",
                  prompt: "Create Custom App Name",
                  value: "",
                  ignoreFocusOut: true,
                  validateInput: (appName) => {
                    appName = appName.trim();
                    if (appName.length < 3) {
                      return "minimum 3 characters long";
                    }
                    if (appName.includes(" ")) {
                      return "cannot contain spaces";
                    }
                    if (appsManager.getAppsWithBookmarks().includes(appName)) {
                      return "already initialized";
                    }
                  },
                })
                .then((appName) => {
                  loadBookmarksFromApp(appName, true).then(() => {
                    log(`Initialize bookmarks for App: ${appName}`);
                  });
                });
            } else {
              loadBookmarksFromApp(appName, true).then(() => {
                log(`Initialize bookmarks for App: ${appName}`);
              });
            }
          });
      }
    }
  );
  context.subscriptions.push(actionCreateBookmarksForApp);

  let actionLoadBookmarksForApp = vscode.commands.registerCommand(
    "acn.bookmarks.loadFromApp",
    () => {
      if (!state.isError) {
        vscode.window
          .showQuickPick(appsManager.getAppsWithBookmarks(), {
            placeHolder: "Select an App",
            title: "Load bookmarks from App",
          })
          .then((appName) => {
            loadBookmarksFromApp(appName).then(() => {
              log(`Load bookmarks for App: ${appName}`);
            });
          });
      }
    }
  );
  context.subscriptions.push(actionLoadBookmarksForApp);

  let actionReloadBookmarksForApp = vscode.commands.registerCommand(
    "acn.bookmarks.reloadFlows",
    () => {
      if (state.activeApp) {
        loadBookmarksFromApp(state.activeApp).then(() => {
          log(`Reload bookmarks for App: ${state.activeApp}`);
        });
      }
    }
  );
  context.subscriptions.push(actionReloadBookmarksForApp);

  const loadBookmarksFromApp = (appName, intialize) => {
    if (appName) {
      const appLoader = appsManager.getAppLoader(appName);
      return appLoader
        .loadBookmarks(intialize)
        .then(() => {
          state.setActiveApp(appName);
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
              flowBookmarksProvider.setData({});
              flowFilesProvider.setData({});
            }
          );
        })
        .then(() => {
          return vscode.commands.executeCommand("flowbookmark.importFromFile");
        })
        .then(() => {
          vscode.commands.executeCommand("setContext", "appLoaded", true);
        });
    }
  };

  const manageJoinedBookmarksCommand = vscode.commands.registerCommand(
    "acn.bookmarks.manageJoinedBookmarks",
    (flowInfo) => {
      if (!state.isError) {
        if (flowInfo && flowInfo.flowType === FlowType.JOINED) {
          if (state.activeApp) {
            const appLoader = appsManager.getAppLoader(state.activeApp);
            appLoader.manageJoinedBookmarks().then((filePath) => {
              return vscode.workspace.openTextDocument(filePath).then((doc) => {
                vscode.window.showTextDocument(doc);
              });
            });
          }
        } else {
          vscode.window
            .showQuickPick(appsManager.getAppsWithBookmarks(), {
              placeHolder: "Select an App",
              title: "Manage Joined Flows for App",
            })
            .then((appName) => {
              const appLoader = appsManager.getAppLoader(appName);
              appLoader.manageJoinedBookmarks().then((filePath) => {
                return vscode.workspace
                  .openTextDocument(filePath)
                  .then((doc) => {
                    vscode.window.showTextDocument(doc);
                  });
              });
              log(`Manage Joined Flows for App: ${appName}`);
            });
        }
      }
    }
  );
  context.subscriptions.push(manageJoinedBookmarksCommand);

  const searchFlowsCommand = vscode.commands.registerCommand(
    "acn.bookmarks.filterFlows",
    () => {
      if (!state.isError) {
        vscode.window
          .showInputBox({
            placeHolder: "Enter keywords",
            prompt: "Search Flows with keywords",
            value: "",
            ignoreFocusOut: true,
          })
          .then((keywords) => {
            allFlowsTreeDataProvider.setFilter(keywords);
            log(`Searching Flows with ${keywords}`);
          });
      }
    }
  );
  context.subscriptions.push(searchFlowsCommand);

  const removeFlowsFilterCommand = vscode.commands.registerCommand(
    "acn.bookmarks.removeFlowsFilter",
    () => {
      if (!state.isError) {
        allFlowsTreeDataProvider.setFilter("");
        log(`Remove Flows Filter`);
      }
    }
  );
  context.subscriptions.push(removeFlowsFilterCommand);

  const filterBookmarksCommand = vscode.commands.registerCommand(
    "acn.bookmarks.filterBookmarks",
    () => {
      if (!state.isError) {
        vscode.window
          .showInputBox({
            placeHolder: "Enter keywords",
            prompt: "Search Bookmarks with keywords",
            value: "",
            ignoreFocusOut: true,
          })
          .then((keywords) => {
            flowBookmarksProvider.setFilter(keywords);
            log(`Searching Bookmarks with ${keywords}`);
          });
      }
    }
  );
  context.subscriptions.push(filterBookmarksCommand);

  const removeBookmarksFilterCommand = vscode.commands.registerCommand(
    "acn.bookmarks.removeBookmarksFilter",
    () => {
      if (!state.isError) {
        flowBookmarksProvider.setFilter("");
        log(`Remove Bookmarks Filter`);
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
          const editor = vscode.window.visibleTextEditors.find(
            (editor) => editor.document.uri.fsPath === filePath
          );
          let options = {};
          if (editor) {
            options.viewColumn = editor.viewColumn;
          } else {
            options.viewColumn = vscode.ViewColumn.Active;
          }
          if (line > 0) {
            options.selection = new vscode.Range(line - 1, 0, line - 1, 0);
          }
          vscode.window.showTextDocument(doc, options);
        });
      }
    }
  );
  context.subscriptions.push(openFileToLineCommand);

  const runTestCallback =
    (coverage) =>
    ({ file, label, type }) => {
      if (type == "flow") {
        let files = flowFilesProvider.treeData[0].children.map(
          (child) => child.file
        );
        runTest(
          { type, label, files },
          coverage,
          testRunCommand,
          testRunCoverageCommand
        );
        log(`Running test for Flow: "${label}"`);
      } else {
        runTest(
          { type, files: [file] },
          coverage,
          testRunCommand,
          testRunCoverageCommand
        );
        log(`Running test for File: "${file.fileName}"`);
      }
    };

  const runTestCommand = vscode.commands.registerCommand(
    "acn.bookmarks.runTest",
    runTestCallback(false)
  );
  context.subscriptions.push(runTestCommand);

  const runTestCoverageCommand = vscode.commands.registerCommand(
    "acn.bookmarks.runTestCoverage",
    runTestCallback(true)
  );
  context.subscriptions.push(runTestCoverageCommand);

  let actionSaveActiveBookmarksToAnApp = vscode.commands.registerCommand(
    "acn.bookmarks.saveForApp",
    () => {
      if (state.activeApp) {
        const appLoader = appsManager.getAppLoader(state.activeApp);
        vscode.commands
          .executeCommand("flowbookmark.exportMyBookmarks")
          .then(appLoader.saveBookmarks)
          .then(() => {
            log(`Save bookmarks for App: ${state.activeApp}`);
            //removed the need to reload the bookmarks manually
            loadBookmarksFromApp(state.activeApp).then(() => {
              log(`Load bookmarks for App: ${state.activeApp}`);
            });
          });
      }
    }
  );
  context.subscriptions.push(actionSaveActiveBookmarksToAnApp);

  const searchFlowsAcrossAppsCommand = vscode.commands.registerCommand(
    "acn.bookmarks.searchFlowsAcross",
    () => {
      if (!state.isError) {
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
            const filesToInclude = `${metaDir}/**/{${bookmarkFileName},${joinedBookmarksFileName}}`;
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
    ({ flowName, app, flowType }) => {
      appsManager
        .resolveFlow(app, flowName, flowType)
        .then((bookmarks) => {
          return { flowName: flowName, bookmarks, app, flowType };
        })
        .then((data) => {
          flowBookmarksProvider.setData(data);
          flowFilesProvider.setData(data);
          log(`Open Flow: "${flowName}"`);
        });
    }
  );
  context.subscriptions.push(openFlowCommand);

  const moveBookmarkCommand = vscode.commands.registerCommand(
    "acn.bookmarks.moveBookmark",
    ({ flowName, index }) => {
      let fromIndex = index;
      let toIndex;
      vscode.window
        .showInputBox({
          placeHolder: "ToIndex*",
          prompt: "Move Bookmark to other index",
          value: "",
          ignoreFocusOut: true,
        })
        .then((input) => {
          toIndex = parseInt(input.trim());
          if (isNaN(toIndex)) {
            throw new Error("Invalid number input");
          }
        })
        .then(() => {
          return vscode.commands
            .executeCommand("flowbookmark.exportMyBookmarks")
            .then(() => {
              return appsManager.moveBookmark(
                state.activeApp,
                flowName,
                fromIndex,
                toIndex
              );
            })
            .then(() => {
              vscode.commands.executeCommand("flowbookmark.importFromFile");
            });
        });
    }
  );
  context.subscriptions.push(moveBookmarkCommand);

  const rearrangeBookmarksCommand = vscode.commands.registerCommand(
    "acn.bookmarks.rearrangeBookmarks",
    ({ label }) => {
      vscode.commands
        .executeCommand("flowbookmark.exportMyBookmarks")
        .then(() => {
          return appsManager.reArrangeBookmarks(label);
        })
        .then(() => {
          vscode.commands.executeCommand("flowbookmark.importFromFile");
        });
    }
  );
  context.subscriptions.push(rearrangeBookmarksCommand);

  const createDiagramCommand = vscode.commands.registerCommand(
    "acn.bookmarks.diagram",
    ({ flowName, flowType, app }) => {
      appsManager.generateDiagram(app, flowName, flowType).then((path) => {
        if (path) {
          vscode.workspace.openTextDocument(path).then((document) => {
            vscode.window.showTextDocument(document, {
              selection: new vscode.Range(1, 0, 2, 0),
            });
          });
        }
      });
      log(`Create Diagram for Flow: "${flowName}"`);
    }
  );
  context.subscriptions.push(createDiagramCommand);

  const copyAppFlowCommand = vscode.commands.registerCommand(
    "acn.bookmarks.copyAppFlow",
    ({ flowName, flowType, app }) => {
      let textToCopyPromise;
      if (flowType === FlowType.JOINED) {
        textToCopyPromise = appsManager
          .getAppLoader(app)
          .joinedFlows.then((config) => {
            return config[flowName];
          })
          .then((subflows) => {
            return subflows.map(getJoinFlowConfig).join(",");
          });
      } else {
        textToCopyPromise = Promise.resolve(
          getJoinFlowConfig({ app, flow: flowName })
        );
      }
      textToCopyPromise.then((textToCopy) => {
        vscode.env.clipboard
          .writeText(textToCopy)
          .then(() => {
            log(
              `Json Snippet copied to clipboard for Flow: "${flowName}"\n${textToCopy}`
            );
            vscode.window.showInformationMessage(
              `Json Snippet copied to clipboard\n\n${textToCopy}`
            );
          })
          .catch((err) => {
            log(
              `Json Snippet copy to clipboard for Flow: "${flowName}"`,
              false
            );
            vscode.window.showErrorMessage("Failed to copy text to clipboard");
          });
      });
    }
  );
  context.subscriptions.push(copyAppFlowCommand);

  const manageTagsCommand = vscode.commands.registerCommand(
    "acn.bookmarks.manageTags",
    () => {
      const items = [
        {
          label: "Create",
          description: "Create a new tag",
        },
        {
          label: "Edit",
          description: "Edit name and description of an existing tag",
        },
        {
          label: "Delete",
          description: "Delete an existing tag",
        },
      ];

      const options = {
        title: "Manage Tags",
        placeHolder: "Select an option",
        matchOnDetail: true,
        ignoreFocusOut: true,
      };

      vscode.window.showQuickPick(items, options).then((item) => {
        let tagList = tagManager.listTags();
        if (item.label === "Create") {
          manageCreate(tagList)
            .then(({ tag, description }) => {
              tagManager.addTag(tag, description);
              log(`Create Tag: ${tag}`);
            })
            .then(tagManager.save);
        } else if (item.label === "Edit") {
          vscode.window
            .showQuickPick(tagList, {
              placeHolder: "Select a tag to edit",
              title: "Edit Tag",
            })
            .then((oldTag) => {
              if (oldTag) {
                manageCreate(tagList, oldTag.label, oldTag.description)
                  .then(({ tag, description }) => {
                    tagManager.editTag(oldTag.label, tag, description);
                    log(`Edit Tag: ${oldTag} to ${tag}`);
                  })
                  .then(tagManager.save);
              }
            });
        } else if (item.label === "Delete") {
          vscode.window
            .showQuickPick(tagList, {
              placeHolder: "Select a tag to delete",
              title: "Delete Tag",
            })
            .then((tag) => {
              if (tag) {
                tagManager.removeTag(tag.label);
                log(`Delete Tag: ${tag.label}`);
              }
            })
            .then(tagManager.save);
        }

        function manageCreate(tagList, tagName = "", description = "") {
          return vscode.window
            .showInputBox({
              placeHolder: "Enter tag without spaces (@tag or #tag)",
              prompt: "Tag Name",
              value: tagName,
              ignoreFocusOut: true,
              validateInput: (tag) => {
                if (!tag.startsWith("@") && !tag.startsWith("#")) {
                  return "must start with '@' or '#'";
                }
                if (tag.length < 3) {
                  return "minimum 3 characters long";
                }
                if (tag.includes(" ")) {
                  return "cannot contain spaces";
                }
                if (tagList.find((t) => t.label === tag)) {
                  return "already exists";
                }
              },
            })
            .then((tag) => {
              // provide all transformations
              return tag.trim().replace(/[\s<>]/g, "_");
            })
            .then((tag) => {
              return vscode.window
                .showInputBox({
                  placeHolder: `Enter description of tag: ${tag}`,
                  prompt: "Tag Description",
                  value: description,
                  ignoreFocusOut: true,
                })
                .then((description) => {
                  return { tag, description };
                });
            });
        }
      });
    }
  );
  context.subscriptions.push(manageTagsCommand);

  const manageFlowTagsCommand = vscode.commands.registerCommand(
    "acn.bookmarks.manageFlowTags",
    ({ flowName, flowType, app }) => {
      let allTags = tagManager.listTags();
      let existingTags = tagManager.getTagsForFlow(app, flowName);
      allTags.forEach((tag) => {
        tag.picked = existingTags.includes(tag.label);
      });
      vscode.window
        .showQuickPick(allTags, {
          placeHolder: "Search for a tag",
          title: "Tag the flow",
          canPickMany: true,
          matchOnDescription: true,
        })
        .then((tags) => {
          let tagLabels = tags.map((tag) => tag.label);
          tagManager.setTagsForflow(app, flowName, tagLabels);
          log(`Tag Flow: "${flowName}" with Tags: [${tagLabels}]`);
        })
        .then(tagManager.save);
    }
  );
  context.subscriptions.push(manageFlowTagsCommand);

  function initializeWithConfiguration() {
    const config = vscode.workspace.getConfiguration("codeNavigator");
    let diagramOutputDir = config.get("diagramsDir");
    let projectName = config.get("projectName");
    let tagsDir = config.get("tagsDir");
    let diagramsType = config.get("diagramsType");
    let showLineNumbers = config.get("showLineNumbers");
    testRunCommand = config.get("testRunCommand");
    testRunCoverageCommand = config.get("testRunCoverageCommand");
    let appsFolder = config.get("appsDir");
    metaDir = config.get("metaDir");
    enableCustomAppNames = config.get("enableCustomAppNames");

    projectDir = getProjectDir(projectName);
    if (projectDir) {
      if (fs.existsSync(path.join(projectDir, metaDir))) {
        if (!appsFolder || fs.existsSync(path.join(projectDir, appsFolder))) {
          if (appsManager) {
            appsManager.dispose();
          }
          appsManager = new AppsManager(
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
          );
          tagManager = new TagManager(
            path.join(projectDir, tagsDir, tagFileName)
          );
          allFlowsTreeDataProvider.setTagManager(tagManager);
          state.initialize();
          context.subscriptions.push(appsManager);
        } else {
          state.setPathError(true, appsFolder);
        }
      } else {
        state.setPathError(true, metaDir);
      }
    } else {
      state.setPathError(false, projectName);
    }
  }
  function ExtensionState() {
    this.isInitialized = false;
    this.activeApp;
    this.isError;
    this.initialize = () => {
      resetUI("Ready", this.isInitialized);
      this.isInitialized = true;
      this.activeApp = undefined;
      this.isError = false;
      log("Extension Initialization with configuration");
      vscode.commands.executeCommand("setContext", "appWithoutError", true);
    };
    this.setPathError = (isAppPathError, path) => {
      this.activeApp = undefined;
      this.isError = true;
      vscode.window.showErrorMessage(
        isAppPathError
          ? `${path} does not exist in project`
          : `${path} not found in workspace`
      );
      resetUI("PATH_ERROR", this.isInitialized);
      this.isInitialized = true;
      log("Extension Initialization with configuration", false);
      vscode.commands.executeCommand("setContext", "appWithoutError", false);
    };
    this.setActiveApp = (appName) => {
      this.activeApp = appName;
      this.isError = false;
      resetUI(appName, false);
      this.isInitialized = true;
    };

    var resetUI = (status, refreshTrees) => {
      if (refreshTrees) {
        allFlowsTreeDataProvider.setData(defaultAllFlowsProviderData);
        flowBookmarksProvider.setData({});
      }
      myStatusBarItem.text = `$(bookmark) ${status}`;
      myStatusBarItem.command = "acn.bookmarks.reset";
      myStatusBarItem.backgroundColor =
        status == "PATH_ERROR"
          ? new vscode.ThemeColor("statusBarItem.errorBackground")
          : status == "Ready"
          ? new vscode.ThemeColor("statusBarItem.warningBackground")
          : undefined;
      myStatusBarItem.show();
      return vscode.commands.executeCommand("flowbookmark.clearAll");
    };
  }
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
