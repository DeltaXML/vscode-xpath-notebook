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
    const outLines: string[] = [];
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
            this.pushLinks(tLine, propNameOffset, padding, links, lineNum, line);
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
              this.pushLinks(tLine, propNameOffset - 1, padding, links, lineNum, line);
            }
          }
      }
    });
    return links;
  }

  private pushLinks(tLine: string, propNameOffset: number, padding: number, links: vscode.DocumentLink[], lineNum: number, line: string) {
    let spacePos = tLine.indexOf(' ', 3 + propNameOffset);
    const pathStart = padding + 2;
    const endPos = tLine.endsWith(',') ? line.length - 2 : line.length - 1;
    if (spacePos === -1) {
      spacePos = endPos;
    }
    const nodePath = tLine.substring(propNameOffset, spacePos);
    const uri = ExtensionData.lastEditorUriObj;
    if (uri) {
      const startPathPos = new vscode.Position(lineNum, pathStart + propNameOffset);
      const endPathPos = new vscode.Position(lineNum, pathStart + (nodePath.length - 1));
      const link = new vscode.DocumentLink(new vscode.Range(startPathPos, endPathPos), uri);
      links.push(link);
    }
  }

}