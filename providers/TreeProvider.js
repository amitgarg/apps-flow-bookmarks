const vscode = require("vscode");
class TreeProvider {
  constructor(model, projectDir) {
    this.filterValue = "";
    this.model = {};
    this.treeData = [];
    this.filteredData = [];
    this.projectDir = projectDir;

    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;

    this.setData(model);
  }
  _prepareData(){
    this.treeData = this.model;
  };
  _filterData(){
    this.filteredData = this.treeData;
  };
  setData = (model) => {
    this.model = model;
    this._prepareData();
    this._filterData();
    this.refresh();
  };
  setFilter = (filterValue) => {
    const filter = filterValue ? filterValue.toUpperCase() : "";
    if (this.filterValue != filter) {
      this.filterValue = filter;
      this._filterData();
      this.refresh();
    }
  };
  getChildren = (element) => {
    if (!element) {
      return Promise.resolve(this.filteredData);
    } else {
      // Return the children of the element
      return Promise.resolve(element.children);
    }
  };
  refresh(){
    this._onDidChangeTreeData.fire();
  };
}
module.exports = TreeProvider;
