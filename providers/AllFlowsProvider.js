const vscode = require("vscode");
const path = require("path");
const TreeProvider = require("./TreeProvider");
const { FlowType } = require("../utils/Constants");
const { getHighlights } = require("../utils/StyleUtils");
const BASIC_FLOWS_KEY = "Basic Flows";
const TaggedTreeItem = require("./TaggedTreeItem");
const TreeDataProviderObserver = require("./TreeDataProviderObserver");
const iconPath = {
  light: path.join(__filename, "../..", "images", "flow1.svg"),
  dark: path.join(__filename, "../..", "images", "flow1.svg"),
};
class AllFlowsProvider extends TreeProvider {
  constructor(allFlows, config) {
    super(allFlows, config);
  }
  _getTaggedLabel = (appName, flowName) => {
    let label = flowName;
    let tags = this.tagManager.getTagsForFlow(appName, flowName);
    if (tags && tags.length > 0) {
      label = `${label} ${tags.join(" ")}`;
    }
    return label;
  };

  _prepareData() {
    let { joinedFlows, basicFlows, appName } = this.model;
    const categories = [];
    // Basic Flows
    let basicData = {
      label: "Basic Flows",
      type: "category",
      flowType: FlowType.BASIC,
    };
    basicData.children = Object.keys(basicFlows)
      .sort()
      .map((flowName) => {
        let label = this._getTaggedLabel(appName, flowName);
        return {
          label,
          tooltip: label,
          type: "flow",
          app: appName,
          flowType: FlowType.BASIC,
          flowName,
          contextValue: "show,diagram,copyJson,tag",
          iconPath,
        };
      });
    categories.push(basicData);

    // Joined Flows
    let joinedData = {
      label: "Joined Flows",
      type: "category",
      flowType: FlowType.JOINED,
      contextValue: "manageFlows",
    };
    joinedData.children = Object.keys(joinedFlows)
      .sort()
      .map((flowName) => {
        let label = this._getTaggedLabel(appName, flowName);
        let data = {
          label,
          tooltip: label,
          type: "flow",
          app: appName,
          flowName,
          flowType: FlowType.JOINED,
          contextValue: "show,diagram,copyJson,tag",
          iconPath,
        };
        data.children = joinedFlows[flowName].map(({ flow, app }) => {
          let label = this._getTaggedLabel(app, flow);
          return {
            label,
            tooltip: `${app} : ${label}`,
            tooltip: label,
            description: app,
            type: "subflow",
            app,
            flowName,
            flowType: FlowType.BASIC,
            contextValue: "show,diagram,copyJson,tag",
            iconPath,
          };
        });
        return data;
      });
    categories.push(joinedData);
    this.treeData = categories;
  }
  _filterData() {
    if (!this.filterValue) {
      this.filteredData = this.treeData;
    } else {
      this.filteredData = this.treeData.map((category) => {
        let newCategory = { ...category };
        newCategory.label = `${category.label} ${
          this.filterValue && `(FILTER: ${this.filterValue})`
        }`;
        if (category.flowType == FlowType.BASIC) {
          newCategory.children = category.children.filter(({ label }) =>
            label.toUpperCase().includes(this.filterValue)
          );
        } else {
          newCategory.children = category.children
            .map((joinedFlow) => {
              let newFlow = { ...joinedFlow };
              newFlow.children = joinedFlow.children.filter(
                ({ app, label }) => {
                  return (
                    app.toUpperCase().includes(this.filterValue) ||
                    label.toUpperCase().includes(this.filterValue)
                  );
                }
              );
              return newFlow;
            })
            .filter(
              ({ label, children }) =>
                label.toUpperCase().includes(this.filterValue) ||
                children.length > 0
            );
        }
        return newCategory;
      });
    }
  }

  setTagManager = (tagManager) => {
    this.tagManager = tagManager;
    this.tagManager.subscribe(new TreeDataProviderObserver(this));
  };

  getTreeItem(element) {
    let treeItemType;
    let label = element.label;
    if (element.type === "category") {
      treeItemType =
        element.children.length == 0
          ? vscode.TreeItemCollapsibleState.None
          : element.flowType == FlowType.JOINED || !!this.filterValue
          ? vscode.TreeItemCollapsibleState.Expanded
          : vscode.TreeItemCollapsibleState.Collapsed;
    } else if (element.type === "flow") {
      treeItemType =
        element.flowType == FlowType.BASIC || element.children.length == 0
          ? vscode.TreeItemCollapsibleState.None
          : !!this.filterValue
          ? vscode.TreeItemCollapsibleState.Expanded
          : vscode.TreeItemCollapsibleState.Collapsed;
    } else if (element.type === "subflow") {
      treeItemType = vscode.TreeItemCollapsibleState.None;
    }
    let item = new TaggedTreeItem({ label, highlights: getHighlights(label)}, treeItemType, element.flowName);
    if (element.type === "subflow") {
      item.description = element.description;
    }
    item.contextValue = element.contextValue || element.type;
    item.tooltip = element.tooltip || element.label;
    item.iconPath = element.iconPath;
    return item;
  }
}
module.exports = AllFlowsProvider;
