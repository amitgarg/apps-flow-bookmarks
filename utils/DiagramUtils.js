function GitManager(codeToFileMap) {
	this.codeToFileMap = codeToFileMap;
	this.branches = { main: true };
	this.order = 1;
	this.gitFlow = [];
}
GitManager.prototype.commit = function (step, tag) {
	let sanitizedDescription = step.description
		.replace(/^_+/g, '')
		.replace(/</g, '[')
		.replace(/>/g, ']')
		.replace(/"/g, "'")
		.trim();
	this.gitFlow.push(`commit id: "${sanitizedDescription}"${tag ? ` tag:"${tag}"` : ''}`);
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
GitManager.prototype.generateDiagram = function (step) {
	const outputFlow = [
		'```mermaid',
		`%%{ 
            init: { 
                'themeVariables': {
                    'commitLabelFontSize': '14px',
                    'tagLabelFontSize': '16px'
                } 
             } 
        }%%`,
		'\tgitGraph',
		...this.gitFlow.map((line) => `\t\t${line}`),
		'```',
	];
	return outputFlow.join('\n');
};
function generateGitGraphMarkdown(codeToFileMap, flowName, flow, flowType) {
	const gitManager = new GitManager(codeToFileMap);
	gitManager.checkoutBranch({ code: 'main' });
	gitManager.commit({ description: 'START' }, flowName);
	gitManager.checkoutBranch(flow[0]);
	gitManager.commit(flow[0]);
	for (let index = 1; index < flow.length; index++) {
		const element = flow[index];
		if (element.code !== flow[index - 1].code) {
			if (element.description.startsWith('(')) {
				// to have separate cases within 1 type of user flow
				gitManager.checkoutBranch({ code: 'main' });
				gitManager.commit({ description: `START: ${element.description}` });
			}
			gitManager.checkoutBranch(element);
		}
		gitManager.commit(element);
	}
	return gitManager.generateDiagram();
}

// }
exports.generateGitGraphMarkdown = generateGitGraphMarkdown;
