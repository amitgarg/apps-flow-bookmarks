
const vscode = require('vscode');
const path = require('path');
const iconPath = {
  light: path.join(__filename, '../..','images', 'bookmark.svg'),
  dark: path.join(__filename, '../..', 'images', 'bookmark.svg')
}
class FlowBookmarksProvider {
    constructor(flows, projectDir) {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.data = this._prepareData(flows);
        this.projectDir = projectDir;
        
      }
      _prepareData(flows) {
        return flows.map(({flowName, bookmarks}) => {
          let data = {
            label: flowName,
            type: 'flow',
          };
          data.children = bookmarks.map((bookmark, index) => {
            let lineNumber = parseInt(bookmark.lineNumber) + 1;
            return {
              label: `${index}.${bookmark.description}`,
              description: `${bookmark.fileName} - ${lineNumber}`,
              text: bookmark.text,
              bookmark: bookmark,
              code: bookmark.code,
              lineNumber: lineNumber,
              path: bookmark.path,
              tooltip: bookmark.description,
              contextValue: 'file',
              type: 'bookmark',
              command: {
                command: 'tmp.bookmarks.openFileToLine',
                title: 'Open File',
                arguments: [path.join(this.projectDir, bookmark.path), lineNumber],
              },
            };
          });
          return data;
        });
      }

      setData(flows){
        this.data = this._prepareData(flows);
      }
    
      getTreeItem(element) {
        let item = new vscode.TreeItem(element.label, element.type !== 'bookmark' ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None);
        if(element.type === 'bookmark'){
          item.command = element.command;
          item.description = element.description;
          item.contextValue = "bookmark";
          item.iconPath = iconPath;
          item.resourceUri = vscode.Uri.file(element.path);
        }else{
          item.contextValue = "flow";
        }
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
      getParent(element) {
        // implementation here
        if(!element || element.type === 'flow'){
          return null;
        }else{
          const parent = this.data.find(item => item.children.includes(element));
          return Promise.resolve(parent);
        }
       
      }
    
      refresh() {
        this._onDidChangeTreeData.fire();
      }
}
module.exports = FlowBookmarksProvider;