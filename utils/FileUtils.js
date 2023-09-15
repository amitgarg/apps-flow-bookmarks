function handleFileCode() {
	const codeToFileMap = { main: { fileName: 'main', filePath: 'main', shortenedPath: 'main' } };
	let counter = 0;
	const SKIP_FIRST_LEVEL_FOLDERS = ['apps', 'bridge-migration', 'components', 'commands'];
	return {
		getFileCode: (filePath) => {
			const filePathArray = filePath.split('/');
			const fileName = filePathArray[filePathArray.length - 1];
			let code = fileName
				.split('-')
				.map((word) => word.charAt(0).toUpperCase())
				.join('');
			if (codeToFileMap[code]) {
				code += counter++;
			}
			let rootLevel;
			if (filePathArray.length < 3) {
				// files on root level in the project .eslintrc etc
				rootLevel = 'ROOT';
			} else {
				if (filePathArray[1] === 'packages') {
					const firstIndex =
						SKIP_FIRST_LEVEL_FOLDERS.indexOf(filePathArray[2]) > -1 ? 3 : 2;
					rootLevel = filePathArray[firstIndex];
				} else {
					// other folders like tools,docs etc etc
					rootLevel = filePathArray[1];
				}
			}
			const shortenedPath = [rootLevel, '...', fileName].join('/');
			codeToFileMap[code] = { fileName, filePath, shortenedPath };
			return code;
		},
		getCodeToFileMap: () => codeToFileMap,
	};
}
exports.handleFileCode = handleFileCode;
