import * as vscode from 'vscode';
import { window } from 'vscode';
import { CellStatusProvider } from './cellStatusProvider';
import { ExtensionData } from './extensionData';
import { JsonDefinitionProvider } from './jsonDefinitionProvider';
import { JSONHoverProvider } from './jsonHoverProvider';
import { LinkProvider } from './linkProvider';
import { NotebookType, XBookController } from './xbookController';
import { XBookSerializer } from './xbookSerializer';
import { XpathResultTokenProvider } from './xpathResultTokenProvider';
import * as cp from 'child_process';



export function activate(context: vscode.ExtensionContext) {
	ExtensionData.extensionPath = context.extensionPath;
	ExtensionData.extensionURI = context.extensionUri;
	// prompt user to install Node.js - if not already installed.
	cp.exec('node -v', (error) => {
		if (error) {
			vscode.window.showWarningMessage("XPath Notebook requires a Node.js install from: https://nodejs.org/", "OK");
		}
	});

	const xbookController = new XBookController(NotebookType.xbook);
	// TODO: support ipynb when it supports saving language-info for XPath etc.
	const ipynbController = new XBookController(NotebookType.ipynb);
	// change package.json as follows:
	/*
    "activationEvents": [
        "onNotebook:xbook",
        "workspaceContains:**\/*.xbook",
        "onNotebook:jupyter-notebook",
        "workspaceContains:**\/*.ipynb"
    ],
	*/

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


	const newNotebook = async () => {
		const newNotebookContent = [
			{
				"kind": 1,
				"languageId": "markdown",
				"value": `# XPath Notebook\n${ExtensionData.currentFormattedDate()}`
			},
			{
				"kind": 2,
				"languageId": "xpath",
				"value": ""
			},
		];
	
		const jsonNotebook = new vscode.NotebookData(newNotebookContent);
		const notebook = await vscode.workspace.openNotebookDocument('xbook', jsonNotebook);
		// TODO: uncomment once following is available
		// await vscode.window.showNotebookDocument(notebook);
		const nbURI = notebook.uri;
		vscode.commands.executeCommand('vscode.open', nbURI);
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
		vscode.commands.registerCommand('xpath-notebook.setSource', (...args) => setNotebookSource(args[0])),
		vscode.commands.registerCommand('xpath-notebook.newNotebook', newNotebook),
		xbookController,
		// TODO: see above
		ipynbController
	);
}

export async function deactivate() {
	// await closeXBooks();
}
