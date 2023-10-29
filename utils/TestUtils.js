const vscode = require("vscode");
const nodePath = require("path");

const getTestPath = (path, fileName) => {
  let testFileName = nodePath.parse(fileName).name+".test";
  return nodePath.join(nodePath.dirname(path), testFileName);
};
const runTest = ({ type, flowName, bookmarks }, coverage) => {
  let testCommand;
  let terminalTitle;
  let testPath;
  if (type == "bookmark") {
    const { path, fileName, description } = bookmarks[0];
    terminalTitle = "Bookmark: " + description;
    testPath = getTestPath(path, fileName);
  } else {
    terminalTitle = "Flow: " + flowName;
    let pathMap = {};
    testPath = bookmarks
      .reduce((acc, bookmark) => {
        const { path, fileName } = bookmark;
        if (!pathMap[path]) {
          pathMap[path] = true;
          acc.push(getTestPath(path, fileName));
        }
        return acc;
      }, [])
      .join(" ");
  }
  testCommand = !!coverage
    ? `yarn test:unit:coverage ${testPath}`
    : `yarn test:unit ${testPath}`;
  let myTerminal = vscode.window.createTerminal(terminalTitle);
  myTerminal.sendText(testCommand);
  myTerminal.show();
};

exports.runTest = runTest;
