const vscode = require("vscode");
class TaggedTreeItem extends vscode.TreeItem {
    constructor(label, collapsibleState, flowName) {
      super(label, collapsibleState);
      this.flowName = flowName;
    }
  }
 module.exports = TaggedTreeItem;