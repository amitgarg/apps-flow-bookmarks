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
  { type, label, files },
  coverage,
  testRunCommand,
  testRunCoverageCommand
) => {
  let testCommand;
  let terminalTitle;
  let testPaths;
  if (type == "file") {
    const { dirPath, fileName } = files[0];
    terminalTitle = "File: " + fileName;
    testPaths = [getTestPath(dirPath, fileName)];
  } else {
    terminalTitle = "Flow: " + label;
    testPaths = files.map(({ dirPath, fileName }) => {
      return getTestPath(dirPath, fileName);
    });
  }
  testCommand = !!coverage ? testRunCoverageCommand : testRunCommand;
  terminalTitle = (coverage ? "Cover:" : "Test:") + terminalTitle;
  testCommand = handlePaths(testCommand, testPaths);

  let myTerminal = vscode.window.createTerminal(terminalTitle);
  myTerminal.sendText(testCommand);
  myTerminal.show();
};

exports.runTest = runTest;
