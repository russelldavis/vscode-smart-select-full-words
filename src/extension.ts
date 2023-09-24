import * as vs from 'vscode';

// References:
// https://stackoverflow.com/questions/59048606/configure-expand-selection-in-visual-studio-code-to-select-the-whole-identifier
// https://github.com/microsoft/vscode/issues/97257
// https://stackoverflow.com/questions/56652088/in-vscode-how-do-i-select-a-word-programmatically
// https://stackoverflow.com/questions/52760138/how-to-select-whole-word-under-the-cursor-in-visual-studio-code


const immediateSelectionNameRegex = /^![\d!]*:/;
let immediateSelectionRange: vs.Range | null = null;

async function executeCommand(name: string): Promise<void> {
	const success = await vs.commands.executeCommand(name);
	// if (!success) {throw new Error(`Command "${name}" failed`);}
}

async function expand(editor: vs.TextEditor) {
	for(let i = 0; i < 30; i++) {
		await executeCommand('editor.action.smartSelect.expand');
		if (!immediateSelectionRange) return;
		if (editor.selections.length > 1) {
			throw new Error("immediateSelectionRange should be null where there are multiple selections");
		}
		const sel = editor.selection;
		const cmp = compareRanges(immediateSelectionRange, sel);
		if (cmp === 0) {
			immediateSelectionRange = null;
			return;
		}
		if (cmp > 0) {
			// editor.selection = new vs.Selection(immediateSelectionRange.start, immediateSelectionRange.end);
			const msg = "smartSelectFullWords !regex match was preempted by another smartSelect range (possibly from another provider)";
			vs.window.showWarningMessage(msg);
			console.log("text:", editor.document.getText(immediateSelectionRange));
			immediateSelectionRange = null;
			throw new Error(msg);
		}
	}
	throw new Error("smartSelectFullWords.expand didn't converge");
}

function compareRanges(a: vs.Range, b: vs.Range) {
	if (a.start.isBefore(b.start)) {
		return -1;
	} else if (b.start.isBefore(a.start)) {
		return 1;
	} else if (a.end.isBefore(b.end)) {
		return 1;
	} else if (b.end.isBefore(a.end)) {
		return -1;
	} else {
		return 0;
	}
}

export function activate(context: vs.ExtensionContext) {
	const config = vs.workspace.getConfiguration("smartSelectFullWords");
	vs.languages.registerSelectionRangeProvider({pattern: "**"}, {
		provideSelectionRanges(document, positions) {
			console.log("provideSelectionRanges");

			const isSingleCursor = positions.length === 1;
			let immediateSelectionName: string | null = null;
			immediateSelectionRange = null;
			
			return positions.map((position) => {
				const regexes = config.get<Record<string,string>>("regexes", {});
				const ranges = Object.entries(regexes).flatMap(([name, regexStr]) => {
					if (!regexStr) return [];

					const regex = new RegExp(regexStr);
					const wordRange = document.getWordRangeAtPosition(position, regex);
					if (!wordRange) return [];

					const wordText = document.getText(wordRange);
					const match = wordText.match(regex);
					if (!match) return [];

					const {start} = wordRange;
					const resultCol = start.character + match.index!;
					const range = new vs.Range(start.line, resultCol, start.line, resultCol + match[0].length);
					if (
						isSingleCursor &&
						immediateSelectionNameRegex.test(name) &&
						(!immediateSelectionName || name < immediateSelectionName)
					) {
						immediateSelectionName = name;
						immediateSelectionRange = range;
					}
					console.log("matched:", wordText, "regex:", regexStr);
					return range;
				});
				if (ranges.length === 0) {
					return new vs.SelectionRange(new vs.Range(0, 0, 0, 0));
				}
				ranges.sort(compareRanges);
				let last: vs.SelectionRange | undefined = undefined;
				for (const range of ranges) {
					if (last) {
						if (last.range.isEqual(range)) continue;
						if (!last.range.contains(range)) {
							console.log(
								"skipping:",
								document.getText(range),
								"not contained by:",
								document.getText(last.range)
							);
							continue;
						}
					}
					last = new vs.SelectionRange(range, last);
					// console.log("providing:", document.getText(range));
				}
				return last!;
			});
		}
	});

	context.subscriptions.push(
		vs.commands.registerTextEditorCommand("smartSelectFullWords.expand", expand)
	);
}

export function deactivate() {}
