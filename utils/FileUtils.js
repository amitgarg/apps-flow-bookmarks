const path = require("path");
function handleFileCode() {
  const codeToFileMap = {
    main: { fileName: "main", filePath: "main", rootLevel: "main" },
    FLOW_NOT_FOUND: { fileName: "FLOW_NOT_FOUND", filePath: "", rootLevel: "" },
  };
  let counter = 0;
  const SKIP_FIRST_LEVEL_FOLDERS = [
    "apps",
    "bridge-migration",
    "components",
    "commands",
  ];
  return {
    getFileCode: (filePath) => {
      const dirPath = path.dirname(filePath).substring(1);
      const fileName = path.basename(filePath);
      let code = fileName
        .split(/[-_]/)
        .map((word) => word.charAt(0).toUpperCase())
        .join("");
      if (codeToFileMap[code]) {
        code += counter++;
      }
      let rootLevel;
      const filePathArray = dirPath.split(path.sep);
      if (dirPath == "") {
        // files on root level in the project .eslintrc etc
        rootLevel = "ROOT";
      } else {
        if (filePathArray[0] === "packages") {
          const firstIndex =
            SKIP_FIRST_LEVEL_FOLDERS.indexOf(filePathArray[1]) > -1 ? 2 : 1;
          rootLevel = filePathArray[firstIndex];
        } else {
          // other folders like tools,docs etc etc
          rootLevel = filePathArray[0];
        }
      }
      codeToFileMap[code] = { fileName, dirPath, rootLevel };
      return code;
    },
    getCodeToFileMap: () => codeToFileMap,
  };
}
function getJoinFlowConfig({ app, flow }) {
  return `
	{
		"app": "${app}",
		"flow": "${flow}"
	}`;
}
exports.handleFileCode = handleFileCode;
exports.getJoinFlowConfig = getJoinFlowConfig;
