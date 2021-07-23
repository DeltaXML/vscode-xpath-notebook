import * as vscode from 'vscode';
import * as path from 'path';
import * as jsc from 'jsonc-parser'


export class ExtensionData {
	static extensionPath: string = '';
	static lastEditorUri: string | undefined;
	static getSefPath() {
		return path.join(ExtensionData.extensionPath, 'resources', 'xslt-sef', 'xpath-eval-to-json.sef.json' );
	}
	private static baseUri: string|undefined;
	private static staticBaseUri: string|undefined;


	static calcBaseUri(uri: vscode.Uri) {
		const path = uri.toString();
		const pathEnd = path.lastIndexOf('/');
		const result = path.substring(0, pathEnd);
		return result;
	}
	static setBaseUri(uri: vscode.Uri) {
		const result = this.calcBaseUri(uri);
		ExtensionData.baseUri = result;
	}

	static async getLastEditorText() {
		if (this.lastEditorUri) {
			return await vscode.workspace.fs.readFile(vscode.Uri.parse(this.lastEditorUri));
		}
	}

	static isLastEditorTextValidJSON() {
		if (this.lastEditorUri) {
			const t = vscode.workspace.fs.readFile(vscode.Uri.parse(this.lastEditorUri));
		}
	}


	static registerEditor(editor: vscode.TextEditor | undefined) {
		const nbScheme = 'vscode-notebook-cell';
		if (editor) {
			if (editor.document.uri.scheme !== nbScheme) {
				ExtensionData.lastEditorUri = editor.document.uri.toString();
				ExtensionData.setBaseUri(editor.document.uri);
			} else {
				const fixedUri = `file:///${editor.document.uri.path}`;
				ExtensionData.staticBaseUri = fixedUri;
			}
		}
	}

	static getStaticBaseUri() {
		if (this.staticBaseUri) {
			return this.staticBaseUri;
		}
		const f = vscode.workspace.workspaceFolders;
		if (f && f.length > 0) {
			return this.calcBaseUri(f[0].uri);
		} else {
			return undefined;
		}
	}
} 