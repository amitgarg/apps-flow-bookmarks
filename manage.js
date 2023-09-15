const fs = require('fs');
const path = require('path');
const appsFolder = 'packages/apps';
const activeBookmarksPath = '.vscode';
const bookmarkFileName = 'multiColorBookmarks.json';
const configFileName = 'tmpBookmarks.json';

const loadState = (projectDir) => {
	const configPath = path.join(projectDir, activeBookmarksPath, configFileName);
	if (fs.existsSync(configPath)) {
		const configData = fs.readFileSync(configPath, 'utf8');
		state = JSON.parse(configData);
	}
	return state;
};
const saveState = (projectDir, state) => {
	const configPath = path.join(projectDir, activeBookmarksPath, configFileName);
	const configData = JSON.stringify(state, null, 2);
	fs.writeFileSync(configPath, configData, { encoding: 'utf8', flag: 'w' });
};

exports.loadState = loadState;
exports.saveState = saveState;
