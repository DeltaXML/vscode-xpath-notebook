import * as vscode from 'vscode';

interface RawNotebookCell {
  language: string;
  value: string;
  kind: vscode.NotebookCellKind;
}

export class XBookSerializer implements vscode.NotebookSerializer {
  async deserializeNotebook(
    content: Uint8Array,
    _token: vscode.CancellationToken
  ): Promise<vscode.NotebookData> {
    var contents = new TextDecoder().decode(content);
    if (contents.length === 0) {
      return new vscode.NotebookData([]);
    }

    let raw: RawNotebookCell[];
    try {
      raw = <RawNotebookCell[]>JSON.parse(contents);
    } catch {
      vscode.window.showErrorMessage("Unable to parse 'xbook' JSON");
      return new vscode.NotebookData([]);
    }

    if (!Array.isArray(raw)) {
      vscode.window.showErrorMessage("Error parsing 'xbook' JSON: expected array");
      return new vscode.NotebookData([]);
    } else {
      const cells: vscode.NotebookCellData[] = []
      for (let index = 0; index < raw.length; index++) {
        const cellData = raw[index];
        if (cellData.kind !== undefined && cellData.value !== undefined && cellData.language !== undefined) {
          cells.push(new vscode.NotebookCellData(cellData.kind, cellData.value, cellData.language));
        }  else {
          vscode.window.showErrorMessage("Error parsing 'xbook' JSON: missing 'kind', 'value' or 'language' property");
          return new vscode.NotebookData([]);
        }      
      }
      return new vscode.NotebookData(cells);
    }
  }

  async serializeNotebook(
    data: vscode.NotebookData,
    _token: vscode.CancellationToken
  ): Promise<Uint8Array> {
    let contents: RawNotebookCell[] = [];

    for (const cell of data.cells) {
      contents.push({
        kind: cell.kind,
        language: cell.languageId,
        value: cell.value
      });
    }

    return new TextEncoder().encode(JSON.stringify(contents));
  }
}