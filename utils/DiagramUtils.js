function GitManager(codeToFileMap, flowName) {
  this.codeToFileMap = codeToFileMap;
  this.flowName = flowName;
  this.branches = { main: true };
  this.order = 1;
  this.gitFlow = [];
}
GitManager.prototype.commit = function (step, tag) {
  let sanitizedDescription = step.description
    .replace(/^_+/g, "")
    .replace(/</g, "[")
    .replace(/>/g, "]")
    .replace(/"/g, "'")
    .trim();
  this.gitFlow.push(
    `commit id: "${sanitizedDescription}"${tag ? ` tag:"${tag}"` : ""}`
  );
};
GitManager.prototype.checkoutBranch = function (step) {
  const fileName = this.codeToFileMap[step.code].shortenedPath;
  if (this.branches[fileName]) {
    this.gitFlow.push(`checkout ${fileName}`);
  } else {
    this.branches[fileName] = true;
    this.gitFlow.push(`branch ${fileName} order:${this.order++}`);
  }
};
GitManager.prototype.generateDiagram = function () {
  const outputFlow = [
    "```mermaid",
    `---
config:
  themeVariables: 
    commitLabelFontSize: 14px
    tagLabelFontSize: 16px
---`,
    "\tgitGraph",
    ...this.gitFlow.map((line) => `\t\t${line}`),
    "```",
  ];
  return outputFlow.join("\n");
};
function generateGitGraphMarkdown(codeToFileMap, flowName, flow, flowType) {
  const gitManager = new GitManager(codeToFileMap, flowName);
  gitManager.checkoutBranch({ code: "main" });
  gitManager.commit({ description: "START" }, flowName);
  gitManager.checkoutBranch(flow[0]);
  gitManager.commit(flow[0]);
  for (let index = 1; index < flow.length; index++) {
    const element = flow[index];
    if (element.code !== flow[index - 1].code) {
      if (element.description.startsWith("(")) {
        // to have separate cases within 1 type of user flow
        gitManager.checkoutBranch({ code: "main" });
        gitManager.commit({ description: `START: ${element.description}` });
      }
      gitManager.checkoutBranch(element);
    }
    gitManager.commit(element);
  }
  return gitManager.generateDiagram();
}

function SequenceDiagramManager(codeToFileMap, flowName) {
  this.codeToFileMap = codeToFileMap;
  this.flowName = flowName;
  this.branches = {};
  this.order = 1;
  this.gitFlow = [];
}
SequenceDiagramManager.prototype.commit = function (step) {
  let sanitizedDescription = step.description
    .replace(/^_+/g, "")
    .replace(/</g, "[")
    .replace(/>/g, "]")
    .replace(/"/g, "'")
    .replace(/;/g, ",")
    .trim();
  this.gitFlow.push(`Note over ${step.code}: ${sanitizedDescription}`);
};
SequenceDiagramManager.prototype.checkoutBranch = function (step, prevStep) {
  const fileName = this.codeToFileMap[step.code].fileName;
  const shortenedPath = this.codeToFileMap[step.code].shortenedPath;
  if (!this.branches[shortenedPath]) {
    this.branches[shortenedPath] = true;
    this.gitFlow.push(`participant ${step.code} as ${fileName}`);
  }
  if (prevStep) {
    let sanitizedDescription = prevStep.description
      .replace(/^_+/g, "")
      .replace(/</g, "[")
      .replace(/>/g, "]")
      .replace(/"/g, "'")
      .replace(/;/g, ",")
      .trim();
    this.gitFlow.push(
      `${prevStep.code} -->> ${step.code} : ${sanitizedDescription}`
    );
  }
};
SequenceDiagramManager.prototype.generateDiagram = function () {
  const outputFlow = [
    "```mermaid",
    `---
title: "${this.flowName}"
config:
  themeVariables: 
    actorLineColor: "#000000"
    noteBkgColor: "#FFFFFF"
    noteBorderColor: "#FFFFFF"
  sequence:
    actorMargin: 15
---`,
    "\tsequenceDiagram",
    ...this.gitFlow.map((line) => `\t\t${line}`),
    "```",
  ];
  return outputFlow.join("\n");
};
function generateSequenceDiagramMarkdown(
  codeToFileMap,
  flowName,
  flow,
  flowType
) {
  const gitManager = new SequenceDiagramManager(codeToFileMap, flowName);
  gitManager.checkoutBranch({ code: "main" });
  gitManager.checkoutBranch(flow[0], { code: "main", description: "START" });
  for (let index = 1; index < flow.length; index++) {
    const element = flow[index];
    if (element.code !== flow[index - 1].code) {
      if (element.description.startsWith("(")) {
        // to have separate cases within 1 type of user flow
        gitManager.commit(flow[index - 1]);
        gitManager.checkoutBranch(
          { code: "main" },
          { code: flow[index - 1].code, description: "END" }
        );
        gitManager.checkoutBranch(element, {
          code: "main",
          description: "START",
        });
      } else {
        gitManager.checkoutBranch(element, flow[index - 1]);
      }
    } else {
      gitManager.commit(flow[index - 1]);
    }
  }
  return gitManager.generateDiagram();
}
const generateDiagram = (
  diagramType,
  codeToFileMap,
  flowName,
  flow,
  flowType
) => {
  return diagramType === "gitgraph"
    ? generateGitGraphMarkdown(codeToFileMap, flowName, flow, flowType)
    : generateSequenceDiagramMarkdown(codeToFileMap, flowName, flow, flowType);
};
exports.generateDiagram = generateDiagram;
