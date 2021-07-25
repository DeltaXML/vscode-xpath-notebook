import * as vscode from 'vscode';
import { ExtensionData } from './extensionData';

export class CellStatusProvider implements vscode.NotebookCellStatusBarItemProvider {
  onDidChangeCellStatusBarItems?: vscode.Event<void> | undefined;

  provideCellStatusBarItems(_cell: vscode.NotebookCell, _token: vscode.CancellationToken): vscode.ProviderResult<vscode.NotebookCellStatusBarItem | vscode.NotebookCellStatusBarItem[]> {
    const items: vscode.NotebookCellStatusBarItem[] = [];
    const opLen = _cell.outputs.length;
    const op = opLen > 0? _cell.outputs[opLen - 1] : undefined;
    let fName: string | undefined;
    if (op && op.metadata) {
      fName = op.metadata['xpathContext'];
      const statusFname = fName? `File context: '${fName}'` : '(No evaluation context)' 
      const item = new vscode.NotebookCellStatusBarItem(statusFname, vscode.NotebookCellStatusBarAlignment.Right);
      items.push(item);

      const resultCount: number | undefined = op.metadata['resultCount'];
      const resultText = resultCount? `Items: ${resultCount}` : '';
      const resultCountitem = new vscode.NotebookCellStatusBarItem(resultText, vscode.NotebookCellStatusBarAlignment.Right);
      items.push(resultCountitem);
    }

    return items;
  }
  
}