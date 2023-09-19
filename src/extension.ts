import * as vs from 'vscode';

// References:
// https://stackoverflow.com/questions/59048606/configure-expand-selection-in-visual-studio-code-to-select-the-whole-identifier
// https://github.com/microsoft/vscode/issues/97257
// https://stackoverflow.com/questions/56652088/in-vscode-how-do-i-select-a-word-programmatically
// https://stackoverflow.com/questions/52760138/how-to-select-whole-word-under-the-cursor-in-visual-studio-code

async function executeCommand(name: string): Promise<void> {
	const success = await vs.commands.executeCommand(name);
	// if (!success) {throw new Error(`Command "${name}" failed`);}
}

async function smartSelectFullWord() {
	const editor = vs.window.activeTextEditor;
	if (!editor) {
		return;
	}
	await executeCommand('editor.action.smartSelect.expand');
}

const COMMANDS = [
	smartSelectFullWord,
] as const;

export function activate(context: vs.ExtensionContext) {
	const config = vs.workspace.getConfiguration("smartSelectFullWords");
	vs.languages.registerSelectionRangeProvider({pattern: "**"}, {
		provideSelectionRanges(document: vs.TextDocument, positions: vs.Position[], token: vs.CancellationToken): vs.ProviderResult<vs.SelectionRange[]> {
			console.log("bbbb");
			return positions.flatMap((position) => {
				const wordRangeRegex = new RegExp(config.get("wordRangeRegex", ""));
				const resultRegex = new RegExp(config.get("resultRegex", ""));
				const wordRange = document.getWordRangeAtPosition(position, wordRangeRegex);
				if (!wordRange) return [];
				// console.log("ddddd", wordRange);
				// console.log("eeee", wordRange!.start, wordRange!.end)

				const wordText = document.getText(wordRange);
				const match = wordText.match(resultRegex);
				if (!match) return [];

				const {start} = wordRange;
				const resultCol = start.character + match.index!;
				return new vs.SelectionRange(
					new vs.Range(start.line, resultCol, start.line, resultCol + match[0].length)
				);
			});
		}
	});

	for (const cmd of COMMANDS) {
		context.subscriptions.push(
			vs.commands.registerCommand(cmd.name, cmd)
		);
	}
}

export function deactivate() {}
