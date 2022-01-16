import * as vscode from 'vscode';
import * as path from 'path';
import * as jsc from 'jsonc-parser'


export class ExtensionData {
	static extensionPath: string = '';
	static extensionURI: vscode.Uri | undefined;
	static lastEditorUri: string | undefined;

	static getSefPath() {
		const sefURI = vscode.Uri.joinPath(ExtensionData.extensionURI!, 'resources', 'xslt-sef', 'xpath-eval-to-json.sef.json');
		return sefURI;
	}
	private static baseUri: string | undefined;
	private static staticBaseUri: string | undefined;
	private static nbScheme = 'vscode-notebook-cell';



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

	static currentFormattedDate() {
    const dateObj = new Date();

    const YYYY = dateObj.getFullYear();
    // when calling getMonth, January is 0
    const MM = ExtensionData.padNumber(dateObj.getMonth() + 1);
    const DD = ExtensionData.padNumber(dateObj.getDate());

    const hh = ExtensionData.padNumber(dateObj.getHours());
    const mm = ExtensionData.padNumber(dateObj.getMinutes());
    const ss = ExtensionData.padNumber(dateObj.getSeconds());


    return `Date: ${YYYY}-${MM}-${DD}\xa0\xa0\xa0\xa0\xa0Time: ${hh}:${mm}:${ss}`;
}

  static padNumber(number: number) {
	return number < 10 ? `0${number}` : number;
}

	static initEditor(editor: vscode.TextEditor | undefined) {
		if (editor && editor.document.uri.scheme !== ExtensionData.nbScheme) {
			ExtensionData.registerEditor(editor);
		} else {
			const editors = vscode.window.visibleTextEditors;
			for (let index = 0; index < editors.length; index++) {
				const currentEditor = editors[index];
				if (currentEditor.document.uri.scheme !== ExtensionData.nbScheme) {
					ExtensionData.registerEditor(editor);
					break;
				}
			}
		}
	}

	static registerEditor(editor: vscode.TextEditor | undefined) {
		if (editor) {
			if (editor.document.uri.scheme !== ExtensionData.nbScheme) {
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