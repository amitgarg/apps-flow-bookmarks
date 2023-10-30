function GitManager(codeToFileMap, flowName, showLineNumbers) {
  this.codeToFileMap = codeToFileMap;
  this.flowName = flowName;
  this.showLineNumbers = showLineNumbers;
  this.branches = {main: true};
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
    `commit id: "${getStepName(
      sanitizedDescription,
      this.showLineNumbers,
      step.lineNumber
    )}"${tag ? ` tag:"${tag}"` : ""}`
  );
};
GitManager.prototype.checkoutBranch = function (step) {
  const { shortenedPath } = this.codeToFileMap[step.code];
  if (this.branches[shortenedPath]) {
    this.gitFlow.push(`checkout ${shortenedPath}`);
  } else {
    this.branches[shortenedPath] = true;
    this.gitFlow.push(`branch ${shortenedPath} order:${this.order++}`);
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
function generateGitGraphMarkdown(
  codeToFileMap,
  flowName,
  flow,
  showLineNumbers
) {
  const gitManager = new GitManager(codeToFileMap, flowName, showLineNumbers);
  // gitManager.checkoutMainBranch();
  gitManager.commit({ code: "main", description: "START" });
  gitManager.commit({ description: "START" }, flowName);
  gitManager.checkoutBranch(flow[0]);
  gitManager.commit(flow[0]);
  for (let index = 1; index < flow.length; index++) {
    const element = flow[index];
    if (element.code !== flow[index - 1].code) {
      if (element.description.startsWith("(")) {
        // to have separate cases within 1 type of user flow
        gitManager.checkoutBranch({ code: "main", description: "START"  });
        // gitManager.checkoutMainBranch();
        gitManager.commit({ description: `START: ${element.description}` });
      }
      gitManager.checkoutBranch(element);
    }
    gitManager.commit(element);
  }
  return gitManager.generateDiagram();
}
function getStepName(stepName, showLineNumbers, lineNumber = 0) {
  return `${stepName}${showLineNumbers ? ` (${lineNumber})` : ""}`;
}
function SequenceDiagramManager(codeToFileMap, flowName, showLineNumbers) {
  this.codeToFileMap = codeToFileMap;
  this.flowName = flowName;
  this.showLineNumbers = showLineNumbers;
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
  this.gitFlow.push(
    `Note over ${step.code}: ${getStepName(
      sanitizedDescription,
      this.showLineNumbers,
      step.lineNumber
    )}`
  );
};
SequenceDiagramManager.prototype.checkoutBranch = function () {
  let prevStep;
  return (step) => {
    const { fileName, rootLevel, shortenedPath } = this.codeToFileMap[step.code];
    if (!this.branches[shortenedPath]) {
      this.branches[shortenedPath] = true;
      if (prevStep) {
        // for adding spacing for rendering of file name box of current step
        this.gitFlow.push(`Note over ${prevStep.code}: .`);
      }
      this.gitFlow.push(
        `create participant ${step.code} as ${rootLevel}<br/>${fileName}`
      );
    }
    if (prevStep && prevStep.code !== step.code) {
      this.gitFlow.push(`${prevStep.code} -->> ${step.code}: `);
    }
    prevStep = step;
  };
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
    actorMargin: -75
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
  showLineNumbers
) {
  const gitManager = new SequenceDiagramManager(
    codeToFileMap,
    flowName,
    showLineNumbers
  );
  let checkoutBranch = gitManager.checkoutBranch();
  checkoutBranch({ code: "main" });
  gitManager.commit({ code: "main", description: "START" });
  checkoutBranch(flow[0]);
  gitManager.commit(flow[0]);
  for (let index = 1; index < flow.length; index++) {
    const element = flow[index];
    if (element.code !== flow[index - 1].code) {
      if (element.description.startsWith("(")) {
        // to have separate cases within 1 type of user flow
        checkoutBranch({ code: "main" });
        gitManager.commit({
          code: "main",
          description: `START: ${element.description}`,
        });
      }
      checkoutBranch(element);
    }
    gitManager.commit(element);
  }
  return gitManager.generateDiagram();
}
const generateDiagram = (
  diagramType,
  codeToFileMap,
  flowName,
  flow,
  showLineNumbers
) => {
  return diagramType === "gitgraph"
    ? generateGitGraphMarkdown(codeToFileMap, flowName, flow, showLineNumbers)
    : generateSequenceDiagramMarkdown(
        codeToFileMap,
        flowName,
        flow,
        showLineNumbers
      );
};
exports.generateDiagram = generateDiagram;
