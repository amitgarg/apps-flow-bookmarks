const vscode = require('vscode');
const path = require('path');
const BASIC_FLOWS_KEY = 'Basic Flows';
const iconPath = {
	light: path.join(__filename, '../..', 'images', 'flow1.svg'),
	dark: path.join(__filename, '../..', 'images', 'flow1.svg'),
};
class AllFlowsProvider {
	constructor(joinedFlowsData) {
		this._onDidChangeTreeData = new vscode.EventEmitter();
		this.onDidChangeTreeData = this._onDidChangeTreeData.event;
		this.data = this._prepareData(joinedFlowsData);
	}
	_prepareData({ joinedFlows, basicFlows, appName }) {
		const categories = [];
		if (Object.keys(basicFlows).length > 0) {
			let basicData = {
				label: 'Basic Flows',
				type: 'category',
				flowType: 'basic',
			};
			basicData.children = Object.keys(basicFlows)
				.sort()
				.map((flowName, index) => {
					return {
						label: flowName,
						tooltip: flowName,
						type: 'flow',
						app: appName,
						flowType: 'basic',
						contextValue: 'show,diagram,copyJson',
						iconPath,
					};
				});
			categories.push(basicData);
		}
		if (Object.keys(joinedFlows).length > 0) {
			let joinedData = {
				label: 'Joined Flows',
				type: 'category',
				flowType: 'joined',
			};
			joinedData.children = Object.keys(joinedFlows)
				.sort()
				.map((flowName) => {
					let data = {
						label: flowName,
						tooltip: flowName,
						type: 'flow',
						app: appName,
						flowType: 'joined',
						contextValue: 'show,diagram',
						iconPath,
					};
					data.children = joinedFlows[flowName].map(({ flow, app }) => {
						return {
							label: flow,
							description: app,
							app: app,
							flowType: 'basic',
							tooltip: `${app} : ${flow}`,
							type: 'subflow',
							contextValue: 'show,copyJson',
							iconPath,
						};
					});
					return data;
				});
				categories.push(joinedData);
		}
		return categories;
	}
	setData(flows) {
		this.data = this._prepareData(flows);
	}

	getTreeItem(element) {
		let treeItemType;
		if (element.type === 'category') {
			treeItemType =
				element.flowType == 'basic'
					? vscode.TreeItemCollapsibleState.Collapsed
					: vscode.TreeItemCollapsibleState.Expanded;
		} else if (element.type === 'flow') {
			treeItemType =
				element.flowType == 'basic'
					? vscode.TreeItemCollapsibleState.None
					: vscode.TreeItemCollapsibleState.Collapsed;
		} else if (element.type === 'subflow') {
			treeItemType = vscode.TreeItemCollapsibleState.None;
		}
		let item = new vscode.TreeItem(element.label, treeItemType);
		if (element.type === 'subflow') {
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
