const vscode = require("vscode");
const path = require("path");
const TreeProvider = require("./TreeProvider");

class FlowFilesProvider extends TreeProvider {
  constructor(flowBookmarks, config) {
    super(flowBookmarks, config);
  }
  _prepareData() {
    let { flowName, bookmarks, app, flowType } = this.model;
    if (flowName && bookmarks && bookmarks.length > 0) {
      let data = {
        label: flowName,
        type: "flow",
        app,
        flowType,
      };
      let pathMap = {};
      bookmarks.forEach((bookmark) => {
        const { dirPath, fileName, lineNumber, shortenedPath } = bookmark;
        if (!pathMap[dirPath + fileName]) {
          pathMap[dirPath + fileName] = { dirPath, fileName, shortenedPath, lineNumbers: [] };
        }
        pathMap[dirPath + fileName].lineNumbers.push(lineNumber);
      });
      data.children = Object.values(pathMap).map(
        ({ dirPath, fileName, lineNumbers, shortenedPath }) => {
          let lineNumbersDisplay = `(${lineNumbers.join(
            ","
          )})`;
          return {
            label: fileName,
            description: shortenedPath,
            tooltip: `${path.join(dirPath, fileName)} ${lineNumbersDisplay}`,
            lineNumbers,
            type: "file",
            contextValue: "file",
            path: dirPath,
            file: {fileName, dirPath},
            resourceUri: vscode.Uri.file(path.join(this.config.projectDir, dirPath, fileName)),
            command: {
              command: "acn.bookmarks.openFileToLine",
              title: "Open File",
              arguments: [
                path.join(this.config.projectDir, dirPath, fileName),
                -1,
              ],
            },
          };
        }
      );

      this.treeData = [data];
    } else {
      this.treeData = [];
    }
  }

  _filterData() {
    this.filteredData = this.treeData;
  }

  getTreeItem(element) {
    let item = new vscode.TreeItem(
      // { label: element.label, highlights: this.getHighlights(element.label) },
      element.label,
      element.type !== "file"
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.None
    );
    if (element.type === "file") {
      item.command = element.command;
      item.description = element.description;
      item.iconPath = vscode.ThemeIcon.File
      item.resourceUri = vscode.Uri.file(element.resourceUri);
      item.tooltip = element.tooltip;

    }
    item.contextValue = element.type;
    return item;
  }

  getParent(element) {
    // implementation here
    if (!element || element.type === "flow") {
      return null;
    } else {
      const parent = this.filteredData.find((item) =>
        item.children.includes(element)
      );
      return Promise.resolve(parent);
    }
  }
}
module.exports = FlowFilesProvider;
