import * as vscode from 'vscode';
import { HtmlTables } from './htmlTables';
import { NodeKernel } from './nodeKernel';
import { ExtensionData } from './extensionData';
import * as path from 'path';

export enum NotebookType {
  xbook = "xbook",
  ipynb = "jupyter-notebook"
}


export class XBookController {
    readonly controllerId: string = 'xbook-id';
    readonly notebookType: NotebookType = NotebookType.xbook;
    readonly label = 'XPath Notebook';
    readonly supportedLanguages = ['xpath', 'javascript'];
    private readonly nodeKernel: NodeKernel;
  
    private readonly _controller: vscode.NotebookController;
    private _executionOrder = 0;
  
    constructor(type: NotebookType) {
      this._controller = vscode.notebooks.createNotebookController(
        this.controllerId = 'xpath:' + type,
        this.notebookType = type,
        this.label
      );
  
      this._controller.supportedLanguages = this.supportedLanguages;
      this._controller.supportsExecutionOrder = true;
      this._controller.executeHandler = this._execute.bind(this);
      this._controller.interruptHandler = this._interrupt.bind(this);

      this.nodeKernel = new NodeKernel();
    }
  
    private async _execute(
      cells: vscode.NotebookCell[],
      _notebook: vscode.NotebookDocument,
      _controller: vscode.NotebookController
    ): Promise<void> {
      for (let cell of cells) {
        await this._doExecution(cell);
      }
      vscode.commands.executeCommand<void>('xslt-xpath.setVariableNames', this.nodeKernel.getVariableNames());
    }

    private _interrupt() {
      this.nodeKernel.stop();
    }
  
    public async _doExecution(cell: vscode.NotebookCell): Promise<void> {
      const execution = this._controller.createNotebookCellExecution(cell);
      execution.executionOrder = ++this._executionOrder;
      execution.start(Date.now()); // Keep track of elapsed time to execute cell.

      await this.nodeKernel.start();
      let isSuccess = true;
      let result = '';
      try {
        result = await this.nodeKernel.eval(cell);
      } catch (error) {
        result = error;
        isSuccess = false;
      }

      let contextString: string | undefined;
      if (ExtensionData.lastEditorUri) {
        const fsPath = vscode.Uri.parse(ExtensionData.lastEditorUri).fsPath;
        contextString = path.basename(fsPath);
      }

      const metadata = {
        'xpathContext': contextString,
        'resultCount': 0,
        'xpathContextUri': ExtensionData.lastEditorUri        
      };

      if (isSuccess) {
        const resultObj = JSON.parse(result);
        //const jsonTextResult = JSON.stringify(resultObj, null, 4);
        const htmlString = HtmlTables.constructTableForObject(resultObj);
        const itemCount = Array.isArray(resultObj)? resultObj.length : 1;
        metadata.resultCount = itemCount;

        execution.replaceOutput([
        new vscode.NotebookCellOutput([
          // vscode.NotebookCellOutputItem.text(jsonTextResult, 'text/x-javascript'),
          vscode.NotebookCellOutputItem.json(resultObj, 'application/json'),
          vscode.NotebookCellOutputItem.text(htmlString, 'text/html')
        ], metadata)
      ]);
      } else {
        execution.replaceOutput([
          new vscode.NotebookCellOutput([
            vscode.NotebookCellOutputItem.text(result)
          ], metadata)
        ]);
      }
      execution.end(isSuccess, Date.now());
    }

    public dispose() {
      this.nodeKernel.stop();
    }
  }