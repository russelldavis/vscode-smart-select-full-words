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

// Returns a range clipped on both ends at the position of the first space found, starting at startPos.
// We do this because certain language providers return ranges from getWordRangeAtPosition that contain
// multiple words with spaces inbetween (e.g., when getting words inside keys in a JSON file).
function clipRangeAtSpaces(document: vs.TextDocument, range: vs.Range, startPos: vs.Position) {
	if (range.start.line !== range.end.line) {
		// We could handle this below but it adds complexity and should never happen
		return range;
	}

	// Only check a small window of the text, for perf in case the range is huge
	const windowRange = range.intersection(
		new vs.Range(
			startPos.translate(0, -100),
			startPos.translate(0, 100)
		)
	)!;

	let wordStart = range.start;
	let wordEnd = range.end;
	const startPosInWindow = startPos.character - windowRange.start.character;
	const windowText = document.getText(windowRange);

	const leftSpacePos = windowText.lastIndexOf(" ", startPosInWindow);
	if (leftSpacePos !== -1) {
		wordStart = wordEnd.with(undefined, windowRange.start.character + leftSpacePos);
	}

	const rightSpacePos = windowText.indexOf(" ", startPosInWindow);
	if (rightSpacePos !== -1) {
		wordEnd = wordEnd.with(undefined, windowRange.start.character + rightSpacePos);
	}

	return range.with(wordStart, wordEnd);
}

function getFullWordRange(document: vs.TextDocument, wordPos: vs.Position): vs.Range | undefined {
	const range = document.getWordRangeAtPosition(wordPos);
	if (!range) {
		return undefined;
	}
	return clipRangeAtSpaces(document, range, wordPos);
}

function getFullWordSelections(editor: vs.TextEditor) {
	return editor.selections.map((selection) => {
		const range = getFullWordRange(editor.document, selection.active);
		return range ?
			new vs.Selection(range.start, range.end) :
			selection;
	});
}

function selectFullWord() {
	const editor = vs.window.activeTextEditor;
	if (!editor) {
		return;
	}
	editor.selections = getFullWordSelections(editor);
}

async function smartSelectFullWord() {
	const editor = vs.window.activeTextEditor;
	if (!editor) {
		return;
	}
	if (editor.selections.every((selection) => selection.isEmpty)) {
		return selectFullWord();
	}

	const newSelections = getFullWordSelections(editor);

	// left off here
	// todo: double check that lastIndexOf and indexOf don't have any off by one issues

	// keep track in the loop above if all the selections are empty. if so,
	// bail out early now
	await executeCommand('editor.action.smartSelect.expand');

	// left off here: need to do union of selections, and deal with the array
	// lengths being different
	for (const selection of editor.selections) {
		
	}
	editor.selections = newSelections;
}


const COMMANDS = [
	selectFullWord,
	smartSelectFullWord,
] as const;


export function activate(context: vs.ExtensionContext) {
	vs.languages.registerSelectionRangeProvider({pattern: "**"}, {
		provideSelectionRanges(document: vs.TextDocument, positions: vs.Position[], token: vs.CancellationToken): vs.ProviderResult<vs.SelectionRange[]> {
			console.log("bbbb");
			return positions.flatMap((position) => {
				const range = document.getWordRangeAtPosition(position);
				console.log("ddddd", range);
				console.log("eeee", range!.start, range!.end)
				const range2 = new vs.Range(new vs.Position(0, 1), new vs.Position(0, 3));
				if (!range) {
					return [];
				}
				return new vs.SelectionRange(range2);
			});
		}
	});

	for (const cmd of COMMANDS) {
		let disposable = vs.commands.registerCommand(cmd.name, cmd);
		context.subscriptions.push(disposable);
	}
}

// this method is called when your extension is deactivated
export function deactivate() {}
