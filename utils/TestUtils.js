const vscode = require("vscode");
const nodePath = require("path");

const getTestPath = (path, fileName) => {
  let file = nodePath.parse(fileName);
  return {
    path: path,
    name: file.name,
    ext: file.ext,
  };
};
const VariableHandler = {
  "path:name:ext": ({ path, name, ext }) => {
    return `${path}/${name}${ext}`;
  },
  "path:name": ({ path, name }) => {
    return `${path}/${name}`;
  },
  path: ({ path }) => {
    return `${path}`;
  },
  "name:ext": ({ name, ext }) => {
    return `${name}${ext}`;
  },
  name: ({ name }) => {
    return `${name}`;
  },
};
const handlePaths = (command, testPaths) => {
  let transformations = Object.keys(VariableHandler).filter((variable) => {
    return command.includes("${" + variable + "}");
  });
  let replacements = transformations.map((transformKey) => {
    return {
      key: transformKey,
      value: testPaths.map(VariableHandler[transformKey]),
    };
  });
  replacements.forEach(({ key, value }) => {
    command = command.replaceAll("${" + key + "}", value.join(" "));
  });
  return command;
};

const runTest = (
  { type, flowName, bookmarks },
  coverage,
  testRunCommand,
  testRunCoverageCommand
) => {
  let testCommand;
  let terminalTitle;
  let testPaths;
  if (type == "bookmark") {
    const { dirPath, fileName, description } = bookmarks[0];
    terminalTitle = "Bookmark: " + description;
    testPaths = [getTestPath(dirPath, fileName)];
  } else {
    terminalTitle = "Flow: " + flowName;
    let pathMap = {};
    testPaths = bookmarks.reduce((acc, bookmark) => {
      const { dirPath, fileName } = bookmark;
      if (!pathMap[dirPath]) {
        pathMap[dirPath] = true;
        acc.push(getTestPath(dirPath, fileName));
      }
      return acc;
    }, []);
  }
  testCommand = !!coverage ? testRunCoverageCommand : testRunCommand;
  terminalTitle = (coverage ? "Cover:" : "Test:") + terminalTitle;
  testCommand = handlePaths(testCommand, testPaths);

  let myTerminal = vscode.window.createTerminal(terminalTitle);
  myTerminal.sendText(testCommand);
  myTerminal.show();
};

exports.runTest = runTest;
