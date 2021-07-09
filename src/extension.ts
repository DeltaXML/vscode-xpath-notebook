import * as vscode from 'vscode';
import { ExtensionData } from './extensionData';
import { XBookController } from './xbookController';
import { XBookSerializer } from './xbookSerializer';

export function activate(context: vscode.ExtensionContext) {
	ExtensionData.extensionPath = context.extensionPath;

  context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(editor => {
			ExtensionData.registerEditor(editor);
		}),
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