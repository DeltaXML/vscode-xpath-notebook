import * as vscode from 'vscode'
import { ExtensionData } from './extensionData';
import { LineType } from './xpathResultTokenProvider';

export class LinkProvider implements vscode.DocumentLinkProvider {

  provideDocumentLinks(document: vscode.TextDocument, _token: vscode.CancellationToken): vscode.ProviderResult<vscode.DocumentLink[]> {
    return this.extractLinksFromDocument(document);
  }

  /*
{
    "allNoes": [
        " /books[1]/book[1]/@author",
        " /books[1]/new:book[1]/@author"
    ],
    "node1": " /books[1]/book[1]/@author",
    "node2": " /books[1]/book[1]/@author"
}

  */
  extractLinksFromDocument(document: vscode.TextDocument): vscode.DocumentLink[] {
    const links: vscode.DocumentLink[] = [];

    const stack: LineType[] = [];
    const lines = document.getText().split(/\r?\n/);
    // need to get uri from the output for the current active cell
    // at the moment there's no way to do this
    // following line is only in the proposed API:
    // const activeNotebook = vscode.window.activeTextEditor;
    // let activeCell: vscode.NotebookCell | undefined;
    // if (activeNotebook) {
    //   const activeCellSelections = activeNotebook.selections;
    //   if (activeCellSelections.length > 0) {
    //     const cellSelection = activeCellSelections[0];
    //     const cells = activeNotebook.document.getCells(cellSelection);
    //     if (cells.length > 0) {
    //       activeCell = cells[0];
    //     }
    //   }
    // }

    // if (!activeCell) return links;
    // const opLen = activeCell.outputs.length;
    // const op = opLen > 0? activeCell.outputs[opLen - 1] : undefined;
    // let contextUriString: string | undefined;

    // if (op && op.metadata) {
    //   contextUriString = op.metadata['xpathContextUri'];
    // }

    // if (!contextUriString) return links;

    // compromise!
    const targetURI = ExtensionData.lastEditorUriObj;

    if (!targetURI) return links;

    lines.forEach((line, lineNum) => {
      const lineType = stack.length > 0 ? stack[stack.length - 1] : LineType.None;
      const tLine = line.trim();
      const padding = line.length - tLine.length;
      let char = tLine.charAt(0);
      const isLineStartString = char === '"';
      if (isLineStartString) {
        char = tLine.charAt(tLine.length - 1);
        if (char !== '[' && char !== '{') {
          char = tLine.charAt(1);
        }
      }
      switch (char) {
        case '\u1680':
          if (tLine.charAt(2) === '/') {
            const propNameOffset = 0;
            this.pushLinks(tLine, propNameOffset, padding, links, lineNum, line, targetURI);
          }
          break;
        case '{':
          stack.push(LineType.Object);
          break;
        case '[':
          stack.push(LineType.Array);
          break;
        case '}':
        case ']':
          stack.pop();
          break;
        default:
          if (lineType === LineType.Object) {
            let propNameOffset = tLine.indexOf('\u1680');
            if (propNameOffset > -1) {
              this.pushLinks(tLine, propNameOffset - 1, padding, links, lineNum, line, targetURI);
            }
          }
      }
    });
    return links;
  }

  private pushLinks(tLine: string, propNameOffset: number, padding: number, links: vscode.DocumentLink[], lineNum: number, line: string, targetURI: vscode.Uri) {
    let spacePos = tLine.indexOf(' ', 3 + propNameOffset);
    const pathStart = padding + 2;
    const endPos = tLine.endsWith(',') ? tLine.length - 2 : tLine.length - 1;
    if (spacePos === -1) {
      spacePos = endPos;
    }
    if (targetURI) {
      const nodePath = tLine.substring(propNameOffset + 2, spacePos);
      console.log('nodePath', nodePath);
      const args = { xpath: nodePath, uri: targetURI.toString() }
      const argsString = encodeURIComponent(JSON.stringify(args));
      const commandURI = vscode.Uri.parse(`command:xslt-xpath.selectXPathInDocument?${argsString}`);
      const startPathPos = new vscode.Position(lineNum, pathStart + propNameOffset + 1);
      const endPathPos = new vscode.Position(lineNum, pathStart + propNameOffset + 1 + (nodePath.length - 1));
      const link = new vscode.DocumentLink(new vscode.Range(startPathPos, endPathPos), commandURI);
      links.push(link);
    }
  }

}