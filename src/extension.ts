import * as vscode from 'vscode';
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
	// prompt user to install Node.js - if not already installed
	cp.exec('node -v', (error) => {
		if (error) {
			vscode.window.showWarningMessage("XPath Notebook requires a Node.js install from: https://nodejs.org/", "OK");
		}
	})

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
    new XBookController()
  );

  const setActiveEditorUri = (editor: vscode.TextEditor | undefined) => {
		const nbScheme = 'vscode-notebook-cell';
		if (editor) {
			if (editor.document.uri.scheme !== nbScheme) {
				ExtensionData.lastEditorUri = editor.document.uri.toString();
				ExtensionData.setBaseUri(editor.document.uri);
			}
		} else if (!ExtensionData.lastEditorUri && vscode.workspace.textDocuments.length > 0) {
			const documents = vscode.workspace.textDocuments;
			for (let i = documents.length; i--; i > -1) {
				const document = documents[i];
				if (document.uri.scheme !== nbScheme) {
					ExtensionData.lastEditorUri = document.uri.toString();
					ExtensionData.setBaseUri(document.uri);
				}
			}
		}
	};

	setActiveEditorUri(vscode.window.activeTextEditor);
}