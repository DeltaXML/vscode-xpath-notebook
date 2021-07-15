import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
const rmdir = require('rimraf');


import * as PATH from 'path';
import { ExtensionData } from './extensionData';

export class NodeKernel {

	private nodeRuntime: cp.ChildProcess | undefined;
	private outputBuffer = '';	// collect output here
	private hasRuntimeError = false;
	private outputKeys = '';
	private tmpDirectory?: string;

	public async start() {
		if (!this.nodeRuntime) {

			this.nodeRuntime = cp.spawn('node', [
				`-e`, `require('repl').start({ prompt: '', ignoreUndefined: true })`
			]);

			this.runSaxonLoader();
			if (this.nodeRuntime.stdout) {
				this.nodeRuntime.stdout.on('data', (data: Buffer) => {
					const dataStr = data.toString();
					if (dataStr.startsWith('Uncaught')) {
						this.hasRuntimeError = true;
						this.outputBuffer += dataStr.substring(15);
					} else if (dataStr.includes('\nUncaught')) {
						this.hasRuntimeError = true;
						this.outputBuffer += dataStr;
					} else if (dataStr.includes('#keys#')) {
						// remove prefix and surrounding ' chars
						this.outputKeys = dataStr.substring(7, dataStr.length - 2);
					} else {
						this.outputBuffer += dataStr;
					}
				});
			}

			if (this.nodeRuntime.stderr) {
				this.nodeRuntime.stderr.on('error', (data: Buffer) => {
					this.hasRuntimeError = true;
					this.outputBuffer += data.toString();
					console.log(`stderr: ${data}`);
				});
			}
		}
	}

	public async eval(cell: vscode.NotebookCell): Promise<string> {

		const cellPath = cell.document.languageId === 'xpath' ? this.dumpCell(cell) : this.dumpCell(cell); // TODO: dumpJSCell
		if (cellPath && this.nodeRuntime && this.nodeRuntime.stdin) {
			this.outputBuffer = '';
			this.outputKeys = '';
			this.hasRuntimeError = false;

			this.nodeRuntime.stdin.write(`.load ${cellPath}\n`);
			while (this.outputBuffer === '') {
				await this.sleep(100);
			}
			if (!this.hasRuntimeError) {
				this.nodeRuntime.stdin.write(`globalVariables.getKeysJSON()\n`);
				while (this.outputKeys === '') {
					await this.sleep(100);
				}
			}
		
			if (this.hasRuntimeError) {
				return Promise.reject(this.outputBuffer);
			} else {
				return Promise.resolve(this.outputBuffer);
			}
		}
		throw new Error('Evaluation failed');
	}

	private sleep(time: number) {
		return new Promise(res => setTimeout(res, time));
	}

	private dumpCell(cell: vscode.NotebookCell): string | undefined {
		try {

			const cellUri = cell.document.uri;
			let cellText = cell.document.getText();
			cellText = cellText.replaceAll('\\', '\\\\');
			cellText = cellText.replaceAll('\`', '\\`');
			if (cellUri.scheme === 'vscode-notebook-cell') {
				// set context
				let contextScript = '';
				if (ExtensionData.lastEditorUri) {
					contextScript = `
					try {
						var context = SaxonJS.XPath.evaluate("doc('${ExtensionData.lastEditorUri}')");
					} catch(error) {
						throw new Error('Notebook Error: Most recent editor should host a valid XML file:\\n${ExtensionData.lastEditorUri}');
					}
					`;
				}

				let data = contextScript;
				data += "try {\n"
				//data += "prevResult = SaxonJS.XPath.evaluate(\`" + cellText + "\`, context, options);\n";
				data += `
								let resultTransform = SaxonJS.transform({
									stylesheetLocation: "${ExtensionData.getSefPath()}",
									initialTemplate: "main",
									stylesheetParams: {
										"sourceURI": "${ExtensionData.lastEditorUri}",
										"expression": \`${cellText}\`,
										"this": globalVariables
									}
							 });
							 prevResult = '' + resultTransform.principalResult;
							 prevResult = JSON.parse(prevResult);
							 prevResult = JSON.stringify(prevResult, null, 4);
`
				data += `
console.log(prevResult);
				`
				data += `} catch(error) {
					throw new Error(error.toString());
}					`;
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
			return Promise.resolve(this.outputBuffer);
		}
		throw new Error('Evaluation failed');
	}

	public getVariableNames() {
		return this.outputKeys === ''? [] : JSON.parse(this.outputKeys);
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
			const escapedSpacePath = ExtensionData.extensionPath;
			const joinedPath = PATH.join(escapedSpacePath, "node_modules", "saxon-js");
			const escapedSlashPath = '"' + joinedPath.replace(/(\\)/g, '\\$1') + '"';
			const arr = [1,2,3];
			const tst = arr.indexOf(1);

			let script = `
				const SaxonJS = require(${escapedSlashPath});
				let prevResult = [];
				class GlobalVariables {
					variables = {};
					keys = [];
					setVariable = (name, value) => {
						if (this.keys.indexOf(name) === -1) {
							this.keys.push(name);
						}
						this.variables[name] = value;
					}
					getKeys = () => {
						return this.keys;
					}
					getKeysJSON = () => {
						return '#keys#' + JSON.stringify(this.keys);
					}
					getVariables = () => {
						return this.variables;
					}
					getVariable = (name) => {
						return this.variables[name];
					}
				}
				const globalVariables = new GlobalVariables();
				`;
			fs.writeFileSync(saxonLoaderPath, script);
			return saxonLoaderPath;
		} catch (e) {
		}
		return undefined;
	}

	public async restart() {
		this.stop();
		await this.start();
	}

	public stop() {

		if (this.nodeRuntime) {
			this.nodeRuntime.kill();
			this.nodeRuntime = undefined;
		}

		if (this.tmpDirectory) {
			const t = this.tmpDirectory;
			this.tmpDirectory = undefined;
			rmdir(t, { glob: false }, (err: Error | undefined) => {
				if (err) {
					console.log(err);
				}
			});
		}
	}



}