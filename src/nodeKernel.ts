import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as fs from 'fs';
import * as os from 'os';

import * as PATH from 'path';
import { ExtensionData } from './extensionData';

export class NodeKernel {

    private nodeRuntime: cp.ChildProcess | undefined;
	private outputBuffer = '';	// collect output here
    private tmpDirectory?: string;

    public async start() {
		if (!this.nodeRuntime) {

			this.nodeRuntime = cp.spawn('node', [
				`-e`, `require('repl').start({ prompt: '', ignoreUndefined: true })`
			]);
			this.runSaxonLoader();
			if (this.nodeRuntime.stdout) {
				this.nodeRuntime.stdout.on('data', (data: Buffer) => {
					this.outputBuffer += data.toString();
				});
			}
			if (this.nodeRuntime.stderr) {
				this.nodeRuntime.stderr.on('data', data => {
					console.log(`stderr: ${data}`);
				});
			}
		}
	}

    public async eval(cell: vscode.NotebookCell): Promise<string> {

		const cellPath = cell.document.languageId === 'xpath' ? this.dumpCell(cell) : this.dumpCell(cell); // TODO: dumpJSCell
		if (cellPath && this.nodeRuntime && this.nodeRuntime.stdin) {
			this.outputBuffer = '';
			this.nodeRuntime.stdin.write(`.load ${cellPath}\n`);
			while (this.outputBuffer === '') {
				await this.sleep(100);
			}
			return Promise.resolve(this.outputBuffer);
		}
		throw new Error('Evaluation failed');
	}

    private sleep(time: number) {
		return new Promise(res => setTimeout(res, time));
	}

    private dumpCell(cell: vscode.NotebookCell): string | undefined {
		try {

			const cellUri = cell.document.uri;
            const cellText = cell.document.getText();
			if (cellUri.scheme === 'vscode-notebook-cell') {
				// set context
				let contextScript = '';
				if (ExtensionData.lastEditorUri) {
					let xmlnsXPath = `let $source := /* 
					return 
							map:merge(
									for $pfx in in-scope-prefixes($source),
											$ns in namespace-uri-for-prefix($pfx, $source)
									return 
											if ($pfx => string-length() ne 0) then
													map:entry($pfx, $ns)
											else
													(: use prefix _d for default :)
													map:entry(codepoints-to-string([95,100]), $ns)
							)`
					xmlnsXPath = xmlnsXPath.replace(/\s+/g, ' ');

					contextScript = `
					var context = SaxonJS.XPath.evaluate("doc('${ExtensionData.lastEditorUri}')");
					var docXmlns = SaxonJS.XPath.evaluate("${xmlnsXPath}", context);
					var invDocXmlns = {};
							Object.entries(docXmlns).forEach((kvp) => {
								const [name, value] = kvp;
								invDocXmlns[value] = name;
							});
					var convertPath = (path) => {
						return path.replace(/Q{[^{]*}/g, (match) => {
							const uri = match.substring(2, match.length - 1);
							const pfx = invDocXmlns[uri];
							if (pfx) {
								return pfx === '_d'? '' : pfx + ':';
							} else {
								return match;
							}
							});
					};
					`;
					contextScript += `
					var baseXmlns = {
						'xsi': 'http://www.w3.org/2001/XMLSchema-instance',
						'array': 'http://www.w3.org/2005/xpath-functions/array',
						'map': 'http://www.w3.org/2005/xpath-functions/map',
						'math': 'http://www.w3.org/2005/xpath-functions/math'
					}
					
					var options = {
						namespaceContext: Object.assign(baseXmlns, docXmlns),
						staticBaseURI: '${ExtensionData.getBaseUri()}', 
						params: {
							'_': prevResult
						}
					};
					if (docXmlns['_d']) {
						options['xpathDefaultNamespace'] = docXmlns['_d'];
					}
					`;
				} else {
					contextScript = `
					var context = SaxonJS.XPath.evaluate('()');
					var options = {
						staticBaseURI: '${ExtensionData.calcBaseUri(cellUri)}' 
					};
					`;
				}

                let data = contextScript;
				data += "try {\n"
                data += "prevResult = SaxonJS.XPath.evaluate(\`" + cellText + "\`, context, options);\n";
                data += `
console.log(prevResult);
				`
				data += `} catch(error) {
console.log(error);
}					`;
                //data += "SaxonJS.serialize(result);";
				console.log(data);
                const cellPath = `${this.tmpDirectory}/nodebook_cell_${cellUri.fragment}.js`;
                fs.writeFileSync(cellPath, data);
                return cellPath;
			}
		} catch (e) {
		}
		return undefined;
	}

    public async runSaxonLoader(): Promise<string> {

		const saxonLoaderPath = this.dumpSaxonLoader();
		if (saxonLoaderPath && this.nodeRuntime && this.nodeRuntime.stdin) {

			this.outputBuffer = '';
			this.nodeRuntime.stdin.write(`.load ${saxonLoaderPath}\n`);

			//await new Promise(res => setTimeout(res, 500));	// wait a bit to collect all output that is associated with this eval
			// silent:
			this.outputBuffer = '';
			return Promise.resolve(this.outputBuffer); }
		throw new Error('Evaluation failed');
	}

/**
 * Store cell in temporary file and return its path or undefined if uri does not denote a cell.
 */
	private dumpSaxonLoader(): string | undefined {
		try {
			if (!this.tmpDirectory) {
				this.tmpDirectory = fs.mkdtempSync(PATH.join(os.tmpdir(), 'xpath-notebook-'));
			}
			const saxonLoaderPath = `${this.tmpDirectory}/saxonLoader.js`;
			const nl = "'\\n'";
			const escapedSpacePath = ExtensionData.extensionPath;
			const joinedPath = PATH.join(escapedSpacePath, "node_modules", "saxon-js");
			const escapedSlashPath = '"' + joinedPath.replace(/(\\)/g, '\\$1') + '"';


			let script = `
				let deQuote = function(text) {
					return text.substring(1, text.length - 1);
				}
				const SaxonJS = require(${escapedSlashPath});
				let prevResult = [];
				`;
			script += `
				let process = function(result, parts, level) {
					const pad = ${nl} + (' '.repeat(level * 2));
					const pad2 = ' '.repeat((level + 1) * 2);
					const pad3 = ${nl} + (' '.repeat((level + 1) * 2));
					const pad4 =  ' '.repeat(level * 2);
					// const pad = '';
					// const pad2 = '';
					// const pad3 = '';
					// const pad4 = '';
				
					if (typeof result === 'object')
					{
						if (Array.isArray(result)) {
							const len = result.length;
							if (level === 0) {
								// parts.push('-- ' + len + ' results --' + ${nl})
							}
							const onNewLines = true; // len > 3;
							parts.push('[');
							result.forEach((item, index) => {
								if (onNewLines) {
									parts.push(pad3);
								}
								process(item, parts, level + 1);
								if (index + 1 < len) {
									parts.push(', ');
								}      
							});
							if (onNewLines) {
								parts.push(pad + ']');
							} else {
								parts.push(pad4, ']');
							}
						} else if (result === null) {
							parts.push('[]');
						} else if (result.constructor.name.includes('xmldom')) {
							let path = pad + convertPath(SaxonJS.XPath.evaluate('path(.)', result));
							path = path.trim();
							const sValue = SaxonJS.XPath.evaluate('string(.)', result);
							parts.push('"\u1680' + deQuote(JSON.stringify(path)) + ' ' + deQuote(JSON.stringify(sValue)) + '"');
						} else if (result.qname && result.value) {
							let path = pad + convertPath(SaxonJS.XPath.evaluate('path(.)', result));
							path = path.trim();
							const sValue = result.value;
							parts.push('"\u1680' + deQuote(JSON.stringify(path)) + ' ' + deQuote(JSON.stringify(sValue)) + '"');
						} else {
							parts.push('\{');
							const entries = Object.entries(result);
							const len = entries.length;
							const onNewLines = true; // len > 3;
							entries.forEach((entry, index) => {
								const [key, value] = entry;
								if (onNewLines) {
									parts.push(pad3);
								}
								const sKey = key.value? key.value : key;
								parts.push(JSON.stringify(sKey) + ': ');
								process(value, parts, level + 1);
								if (index + 1 < len) {
									parts.push(',');
								}
							})
							if (onNewLines) {
								parts.push(pad + '\}');
							} else {
								parts.push(pad4, '\}');
							}
						}
					} 
					else {
						return parts.push(JSON.stringify(result));
						;
					}
				};
				
				let writeResult = function(result) {
					const parts = [];
					const level = 0;
					process(result, parts, level);
					console.log(parts.join(''));
				}
`

			// console.log('script:');
			// console.log(script);
			fs.writeFileSync(saxonLoaderPath, script);
			return saxonLoaderPath;
		} catch (e) {
		}
		return undefined;
	}



}