const vscode = require("vscode");
const path = require("path");
const iconPath = {
  light: path.join(__filename, "../..", "images", "bookmark.svg"),
  dark: path.join(__filename, "../..", "images", "bookmark.svg"),
};
const missingBookmarkIconPath = {
  light: path.join(__filename, "../..", "images", "bookmark-missing.svg"),
  dark: path.join(__filename, "../..", "images", "bookmark-missing.svg"),
};
class FlowBookmarksProvider {
  constructor(flow, projectDir) {
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this.filterValue = "";
    this.data = [];
    this.filteredData = [];
    this.setData(flow);
    this.projectDir = projectDir;
  }
  _prepareData(flow) {
    let { flowName, bookmarks } = flow;
    if (flowName && bookmarks && bookmarks.length > 0) {
      let data = {
        label: flowName,
        type: "flow",
      };
      data.children = bookmarks.map((bookmark, index) => {
        let lineNumber = parseInt(bookmark.lineNumber) + 1;
        let bookmarkElement =  {
          label: `${index}.${bookmark.description}`,
          description: `${bookmark.fileName} - ${lineNumber}`,
          text: bookmark.text,
          bookmark: bookmark,
          code: bookmark.code,
          lineNumber: lineNumber,
          path: bookmark.path,
          tooltip: bookmark.description,
          contextValue: "file",
          type: "bookmark",
          command: {
            command: "acn.bookmarks.openFileToLine",
            title: "Open File",
            arguments: [
              bookmark.path && path.join(this.projectDir, bookmark.path),
              lineNumber,
            ],
          },
        };
        return bookmarkElement;
      });
      return [data];
    }
    return [];
  }
  _filterData() {
    if(!this.filterValue){
      return this.data;
    }
    return this.data.map((flow) => {
      let newFlow = {label: `${flow.label} (FILTER: ${this.filterValue})`, type: flow.type };
      newFlow.children = flow.children.filter(({ tooltip, description }) => {
        return (
          description.toUpperCase().includes(this.filterValue) ||
          tooltip.toUpperCase().includes(this.filterValue)
        );
      });
      return newFlow;
    });
  }

  setData(flow) {
    this.data = this._prepareData(flow);
    this.filteredData = this._filterData();
  }
  setFilter(filterValue) {
    const filter = filterValue ? filterValue.toUpperCase() : "";
    if (this.filterValue != filter) {
      this.filterValue = filter;
      this.filteredData = this._filterData();
    }
  }

  getTreeItem(element) {
    let item = new vscode.TreeItem(
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
      if(!element.path){
        item.color = "#FF0000";
        item.iconPath = missingBookmarkIconPath;
      }
    }
    item.contextValue = element.type;
    return item;
  }

  getChildren(element) {
    if (!element) {
      return Promise.resolve(this.filteredData);
    } else {
      // Return the children of the element
      return Promise.resolve(element.children);
    }
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

  refresh() {
    this._onDidChangeTreeData.fire();
  }
}
module.exports = FlowBookmarksProvider;
