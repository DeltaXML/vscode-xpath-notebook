import * as vscode from 'vscode';
import { ExtensionData } from './extensionData';

export class JsonDefinitionProvider implements vscode.DefinitionProvider {

	public async provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Location | undefined> {
        

		return new Promise( async (resolve) => {
            
			let location: vscode.Location|undefined = undefined;
            const isCancelRequested = token.isCancellationRequested;
            const textLine = document.lineAt(position);
            const indicatorPos = textLine.text.indexOf('\u1680');
            
            if (indicatorPos > 0 && 
                textLine.text.charAt(indicatorPos - 1) === '"' &&
                textLine.text.length - indicatorPos > 3 &&
                textLine.text.charAt(indicatorPos + 1) === '/'
                ) {
                const xpathEndPos = textLine.text.indexOf(' ', indicatorPos);
                const xpath = textLine.text.substring(indicatorPos + 1, xpathEndPos);
                const xpathObj = {xpath: xpath, uri: ExtensionData.lastEditorUri};
                const symbol = await vscode.commands.executeCommand<vscode.DocumentSymbol|undefined>(
                    'xslt-xpath.symbolFromXPath',
                    xpathObj
                );
                if (symbol) {
                    const startPos = new vscode.Position(symbol.range.start.line, symbol.range.start.character);
                    const endPos = new vscode.Position(symbol.range.end.line, symbol.range.end.character);
                    const range = new vscode.Range(startPos, endPos);
                    if (ExtensionData.lastEditorUri) {
                        location = JsonDefinitionProvider.loocationFromRange(range,  ExtensionData.lastEditorUri);
                    }
                }

            }
            resolve(location);
		});
    }

    private static loocationFromRange(range: vscode.Range, uriString: string) {
        return new vscode.Location(vscode.Uri.parse(uriString), range);
	}

}
