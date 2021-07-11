import * as vscode from 'vscode';

export interface BaseToken {
    line: number;
    startCharacter: number;
    length: number;
    value: string;
    tokenType: number;
}

enum LineType {
    Array,
    Object,
    None
}

enum TokenType {
    comment,
    nodeNameTest,
    xmlPunctuation,
    attributeNameTest
}


export class XpathResultTokenProvider implements vscode.DocumentSemanticTokensProvider {

    private static textmateTypes: string[] = [];
    private static tokenModifiers = new Map<string, number>();


    public static getTextmateTypeLegend(): string[] {

        // concat xsl legend to xpath legend
        if (XpathResultTokenProvider.textmateTypes.length === 0) {
            let keyCount: number = Object.keys(TokenType).length / 2;
            for (let i = 0; i < keyCount; i++) {
                XpathResultTokenProvider.textmateTypes.push(TokenType[i]);
            }
        }       

        return XpathResultTokenProvider.textmateTypes;
    }

    public static getLegend() {
        const tokenTypesLegend = XpathResultTokenProvider.getTextmateTypeLegend();
    
        const tokenModifiersLegend = [
            'declaration', 'documentation', 'member', 'static', 'abstract', 'deprecated',
            'modification', 'async'
        ];
        tokenModifiersLegend.forEach((tokenModifier, index) => XpathResultTokenProvider.tokenModifiers.set(tokenModifier, index));
    
        return new vscode.SemanticTokensLegend(tokenTypesLegend, tokenModifiersLegend);
    };

    async provideDocumentSemanticTokens(document: vscode.TextDocument): Promise<vscode.SemanticTokens> {
        // console.log('provideDocumentSemanticTokens');
        const builder = new vscode.SemanticTokensBuilder();
        const stack: LineType[] = [];
        const lines = document.getText().split(/\r?\n/);
        const outLines: string[] = [];
        lines.forEach((line, lineNum) => {
            const lineType = stack.length > 0 ? stack[stack.length - 1] : LineType.None;
            const tLine = line.trimLeft();
            const padding = line.length - tLine.length;
            let char = tLine.charAt(0);
            const isLineStartString = char === '"';
            if (isLineStartString) {
                const cp = tLine.codePointAt(1);
                char = cp? String.fromCodePoint(cp) : '';
            }
            switch (char) {
                case '\u1680':
                    if (tLine.charAt(2) === '/') {
                        const propNameOffset = 0;
                        this.pushTokens(tLine, propNameOffset, padding, builder, lineNum, line);
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
                            this.pushTokens(tLine, propNameOffset - 1, padding, builder, lineNum, line);
                        }
                    }
            }
        });

        return builder.build();
    }

    private pushTokens(tLine: string, propNameOffset: number, padding: number, builder: vscode.SemanticTokensBuilder, lineNum: number, line: string) {
        const spacePos = tLine.indexOf(' ', 3 + propNameOffset);
        const pathStart = padding + 2;
        builder.push(lineNum, padding + propNameOffset, 1, TokenType.xmlPunctuation, 0);
        builder.push(lineNum, padding + propNameOffset + 1, 1, TokenType.xmlPunctuation, 0);
        const endPos = tLine.endsWith(',') ? line.length - 2 : line.length - 1;
        builder.push(lineNum, endPos, 1, TokenType.xmlPunctuation, 0);
        const path = tLine.substring(propNameOffset, spacePos);
        const pathParts = path.split('@');
        let prevPartLen = 0;
        pathParts.forEach((part, index) => {
            if (index === 0) {
                builder.push(lineNum, pathStart + propNameOffset, part.length - 2, TokenType.nodeNameTest, 0);
                prevPartLen = part.length;
            } else {
                builder.push(lineNum, pathStart + propNameOffset + prevPartLen - 2, part.length + 1, TokenType.attributeNameTest, 0);
            }
        });
    }
}