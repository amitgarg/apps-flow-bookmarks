const vscode = require("vscode");
const path = require("path");
const BASIC_FLOWS_KEY = "Basic Flows";
const iconPath = {
  light: path.join(__filename, "../..", "images", "flow1.svg"),
  dark: path.join(__filename, "../..", "images", "flow1.svg"),
};
class AllFlowsProvider {
  constructor(joinedFlowsData) {
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this.filterValue = "";
    this.joinedFlowsData = joinedFlowsData;
    this.data = this._prepareData(joinedFlowsData);
  }

  _prepareData() {
    let { joinedFlows, basicFlows, appName } = this.joinedFlowsData;
    const categories = [];
    basicFlows = Object.keys(basicFlows)
      .filter((flow) => flow.toUpperCase().includes(this.filterValue))
      .sort();
    if (basicFlows.length > 0) {
      let basicData = {
        label: "Basic Flows",
        type: "category",
        flowType: "basic",
      };
      basicData.children = basicFlows.map((flowName, index) => {
        return {
          label: flowName,
          tooltip: flowName,
          type: "flow",
          app: appName,
          flowType: "basic",
          contextValue: "show,diagram,copyJson",
          iconPath,
        };
      });
      categories.push(basicData);
    }
    joinedFlows = Object.keys(joinedFlows)
      .sort()
      .map((joinedFlow) => {
        return {
          flow: joinedFlow,
          subflows: joinedFlows[joinedFlow].filter(({ flow, app }) =>
            flow.toUpperCase().includes(this.filterValue) || app.toUpperCase().includes(this.filterValue)
          ),
        };
      })
      .filter(
        ({ flow, subflows }) =>
          flow.toUpperCase().includes(this.filterValue) || subflows.length > 0
      );
    if (joinedFlows.length > 0) {
      let joinedData = {
        label: "Joined Flows",
        type: "category",
        flowType: "joined",
      };
      joinedData.children = joinedFlows.map(({ flow, subflows }) => {
        let data = {
          label: flow,
          tooltip: flow,
          type: "flow",
          app: appName,
          flowType: "joined",
          contextValue: "show,diagram,copyJson",
          iconPath,
        };
        data.children = subflows.map(({ flow, app }) => {
          return {
            label: flow,
            description: app,
            app: app,
            flowType: "basic",
            tooltip: `${app} : ${flow}`,
            type: "subflow",
            contextValue: "show,copyJson",
            iconPath,
          };
        });
        return data;
      });
      categories.push(joinedData);
    }
    return categories;
  }
  setData(joinedFlowsData) {
    this.joinedFlowsData = joinedFlowsData;
    this.data = this._prepareData();
  }
  setFilter(filterValue) {
    const filter = filterValue ? filterValue.toUpperCase() : "";
    if (this.filterValue != filter) {
      this.filterValue = filter;
      this.data = this._prepareData();
    }
  }

  getTreeItem(element) {
    let treeItemType;
    if (element.type === "category") {
      treeItemType =
        !this.filterValue && element.flowType == "basic"
          ? vscode.TreeItemCollapsibleState.Collapsed
          : vscode.TreeItemCollapsibleState.Expanded;
    } else if (element.type === "flow") {
      treeItemType =
        element.flowType == "basic" || element.children.length == 0
          ? vscode.TreeItemCollapsibleState.None
          : this.filterValue
          ? vscode.TreeItemCollapsibleState.Collapsed
          : vscode.TreeItemCollapsibleState.Collapsed;
    } else if (element.type === "subflow") {
      treeItemType = vscode.TreeItemCollapsibleState.None;
    }
    let item = new vscode.TreeItem(element.label, treeItemType);
    if (element.type === "subflow") {
      item.description = element.description;
    }
    item.contextValue = element.contextValue || element.type;
    item.tooltip = element.tooltip || element.label;
    item.iconPath = element.iconPath;
    return item;
  }

  getChildren(element) {
    if (!element) {
      return Promise.resolve(this.data);
    } else {
      // Return the children of the element
      return Promise.resolve(element.children);
    }
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }
}
module.exports = AllFlowsProvider;
