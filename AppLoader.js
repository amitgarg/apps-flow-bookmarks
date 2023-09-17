const fs = require('fs').promises;
const path = require('path');
const appsFolder = 'packages/apps';
const activeBookmarksPath = '.vscode';
const bookmarkFileName = 'multiColorBookmarks.json';
const joinedBookmarksFileName = 'joinedBookmarks.json';

class AppLoader {
	constructor(
		context,
		projectDir,
		appName,
		getCodeToFileMap,
		getFileCode,
		onChangeBookmarksStatus
	) {
		this.context = context;
		this.projectDir = projectDir;
		this.appName = appName;
		this.getCodeToFileMap = getCodeToFileMap;
		this.getFileCode = getFileCode;
		this.onChangeBookmarksStatus = onChangeBookmarksStatus;
		this.basicFlows;
		this.joinedFlows;


		this.populateBasicFlows = this.populateBasicFlows.bind(this);
		this.populateJoinedFlows = this.populateJoinedFlows.bind(this);
		this.loadBookmarks = this.loadBookmarks.bind(this);
		this.initializeBookmarks = this.initializeBookmarks.bind(this);
		this.saveBookmarks = this.saveBookmarks.bind(this);
	}

	initializeBookmarks() {
		const fileContent = '{}';
		return fs
			.writeFile(
				path.join(this.projectDir, activeBookmarksPath, bookmarkFileName),
				fileContent
			)
			.then(() => {
				this.onChangeBookmarksStatus(this.appName, true);
				return { success: `Bookmarks initialized for app ${this.appName}` };
			})
			.catch((err) => {
				return { error: `Unable to initialize bookmarks for app ${this.appName}` };
			});
	}
	loadBookmarks() {
		return fs
			.copyFile(
				path.join(this.projectDir, appsFolder, this.appName, bookmarkFileName),
				path.join(this.projectDir, activeBookmarksPath, bookmarkFileName)
			)
			.then(() => {
                this.populateBasicFlows();
                this.populateJoinedFlows();
				return { success: `Bookmarks loaded for app ${this.appName}` };
			})
			.catch((err) => {
				return { error: `Unable to Load Bookmarks for app ${this.appName}` };
			});
	}
	saveBookmarks() {
		return fs
			.copyFile(
				path.join(this.projectDir, activeBookmarksPath, bookmarkFileName),
				path.join(this.projectDir, appsFolder, this.appName, bookmarkFileName)
			)
			.then(() => {
				return { success: `Bookmarks saved for app ${this.appName}` };
			})
			.catch((err) => {
				return { error: `Unable to save Bookmarks for app ${this.appName}` };
			});
	}
	populateBasicFlows() {
		this.basicFlows = fs
			.readFile(
				path.join(this.projectDir, appsFolder, this.appName, bookmarkFileName),
				'utf8'
			)
			.then((data) => {
				// Parse the JSON data
				const jsonData = JSON.parse(data);

				const flows = {};
				const codeToFileMap = this.getCodeToFileMap();
				Object.keys(jsonData).forEach((key) => {
					const code = this.getFileCode(key);
					Object.keys(jsonData[key]).forEach((lineNumber) => {
						const [description, flowName, index, text] =
							jsonData[key][lineNumber];
						if (!flows[flowName]) {
							flows[flowName] = [];
						}
						flows[flowName][index] = {
							code,
							description: description,
							text,
							lineNumber,
							path: key,
							fileName: codeToFileMap[code].fileName,
						};
					});
				});
				return flows;
			});
	}
	getBasicFlow(flowName) {
		if (!this.basicFlows) {
			this.populateBasicFlows();
		}
		return this.basicFlows.then((flows) => {
			return flows[flowName] || ['No bookmarks found for this flow'];
		});
	}
	getJoinedFlow(flowName) {
		if (!this.joinedFlows) {
			this.populateJoinedFlows();
		}
		return this.joinedFlows.then((joinedFlows) => {
			return (
				joinedFlows[flowName] || {
					app: appName,
					flow: 'No subflows found for this flow',
				}
			);
		});
	}

	populateJoinedFlows() {
		this.joinedFlows = fs
			.readFile(
				path.join(
					this.projectDir,
					appsFolder,
					this.appName,
					joinedBookmarksFileName
				),
				'utf8'
			)
			.then((data) => {
				return JSON.parse(data);
			})
			.catch((err) => {
				return {};
			});
	}
	dispose() {
		this.basicFlows = null;
		this.joinedFlows = null;
	}
}
exports.AppLoader = AppLoader;
