import * as vscode from 'vscode';
import * as path from 'path';

export class ExtensionData {
	static extensionPath: string = '';
	static lastEditorUri: string | undefined;
	private static baseUri: string|undefined;

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

	static getBaseUri() {
		if (this.baseUri) {
			return this.baseUri;
		}
		const f = vscode.workspace.workspaceFolders;
		if (f && f.length > 0) {
			return this.calcBaseUri(f[0].uri);
		} else {
			return undefined;
		}
	}
} 