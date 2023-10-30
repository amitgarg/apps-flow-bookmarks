const vscode = require("vscode");
const path = require("path");
const TreeProvider = require("./TreeProvider");
const { getHighlights } = require("../utils/StyleUtils");
const iconPath = {
  light: path.join(__filename, "../..", "images", "bookmark.svg"),
  dark: path.join(__filename, "../..", "images", "bookmark.svg"),
};
const missingBookmarkIconPath = {
  light: path.join(__filename, "../..", "images", "bookmark-missing.svg"),
  dark: path.join(__filename, "../..", "images", "bookmark-missing.svg"),
};
class FlowBookmarksProvider extends TreeProvider {
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
        flowType
      };
      data.children = bookmarks.map((bookmark, index) => {
        let lineNumber = parseInt(bookmark.lineNumber) + 1;
        let label = `${index}. ${bookmark.description}`;
        let bookmarkElement = {
          label: { label, highlights: getHighlights(label) },
          description: `${bookmark.fileName} - ${lineNumber}`,
          text: bookmark.text,
          bookmark: bookmark,
          code: bookmark.code,
          lineNumber: lineNumber,
          path: bookmark.dirPath,
          tooltip: bookmark.description,
          contextValue: "file",
          type: "bookmark",
          command: {
            command: "acn.bookmarks.openFileToLine",
            title: "Open File",
            arguments: [
              bookmark.dirPath && path.join(this.config.projectDir, bookmark.dirPath, bookmark.fileName),
              lineNumber,
            ],
          },
        };
        return bookmarkElement;
      });
      this.treeData = [data];
    } else {
      this.treeData = [];
    }
  }

  _filterData() {
    if (!this.filterValue) {
      this.filteredData = this.treeData;
    } else {
      this.filteredData = this.treeData.map((flow) => {
        let newFlow = {
          label: `${flow.label} (FILTER: ${this.filterValue})`,
          type: flow.type,
        };
        newFlow.children = flow.children.filter(({ tooltip, description }) => {
          return (
            description.toUpperCase().includes(this.filterValue) ||
            tooltip.toUpperCase().includes(this.filterValue)
          );
        });
        return newFlow;
      });
    }
  }

  getTreeItem(element) {
    let item = new vscode.TreeItem(
      // { label: element.label, highlights: this.getHighlights(element.label) },
      element.label,
      element.type !== "bookmark"
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.None
    );
    if (element.type === "bookmark") {
      item.command = element.command;
      item.description = element.description;
      item.iconPath = iconPath;
      item.resourceUri = vscode.Uri.file(element.path);
      if (!element.path) {
        item.color = "#FF0000";
        item.iconPath = missingBookmarkIconPath;
      }
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
module.exports = FlowBookmarksProvider;
