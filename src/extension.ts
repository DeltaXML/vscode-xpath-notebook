import * as vscode from 'vscode';
import { window } from 'vscode';
import { CellStatusProvider } from './cellStatusProvider';
import { ExtensionData } from './extensionData';
import { JsonDefinitionProvider } from './jsonDefinitionProvider';
import { JSONHoverProvider } from './jsonHoverProvider';
import { LinkProvider } from './linkProvider';
import { XBookController } from './xbookController';
import { XBookSerializer } from './xbookSerializer';
import { XpathResultTokenProvider } from './xpathResultTokenProvider';
import * as cp from 'child_process';



export function activate(context: vscode.ExtensionContext) {
	ExtensionData.extensionPath = context.extensionPath;
	// prompt user to install Node.js - if not already installed.
	cp.exec('node -v', (error) => {
		if (error) {
			vscode.window.showWarningMessage("XPath Notebook requires a Node.js install from: https://nodejs.org/", "OK");
		}
	});

	const xbookController = new XBookController();

	async function setNotebookSource(cell: vscode.NotebookCell) {
		const options: vscode.OpenDialogOptions = {
			canSelectMany: false,
			openLabel: "Set as source"
		}
		const result = await window.showOpenDialog(options);
		if (result) {
			ExtensionData.lastEditorUri = result.toString();
			xbookController._doExecution(cell);
		}
	}

	ExtensionData.initEditor(vscode.window.activeTextEditor);

	context.subscriptions.push(
		vscode.languages.registerDocumentSemanticTokensProvider({ language: 'json' }, new XpathResultTokenProvider(), XpathResultTokenProvider.getLegend()),
		//vscode.languages.registerDefinitionProvider({ language: 'javascript' }, new JsonDefinitionProvider()),
		//vscode.languages.registerHoverProvider({ language: 'javascript' }, new JSONHoverProvider()),
		vscode.window.onDidChangeActiveTextEditor(editor => {
			ExtensionData.registerEditor(editor);
		}),
		vscode.languages.registerDocumentLinkProvider({ language: 'json' }, new LinkProvider()),
		vscode.notebooks.registerNotebookCellStatusBarItemProvider('xbook', new CellStatusProvider()),
		vscode.workspace.registerNotebookSerializer('xbook', new XBookSerializer()),
		vscode.commands.registerCommand('xp-notebook.setSource', (...args) => setNotebookSource(args[0])),
		xbookController
	);
}

async function closeXBooks() {
	// attempt to close XBook as there's a renderer problem if it's still open 
	// when restarting vscode
	const editors = vscode.window.visibleTextEditors;
	for (let index = 0; index < editors.length; index++) {
		const editor = editors[index];
		if (editor.document.uri.fsPath.endsWith('.xbook')) {
			await vscode.window.showTextDocument(editor.document.uri, { preview: true, preserveFocus: false });
			await vscode.commands.executeCommand('workbench.action.closeActiveEditor');				
		}
	}}

export async function deactivate() {
	// await closeXBooks();
}
