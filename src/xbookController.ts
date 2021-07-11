import * as vscode from 'vscode';
import { NotebookController } from 'vscode';
import { NodeKernel } from './nodeKernel';

export class XBookController {
    readonly controllerId = 'xbook-id';
    readonly notebookType = 'xbook';
    readonly label = 'XPath Notebook';
    readonly supportedLanguages = ['xpath', 'javascript'];
    private readonly nodeKernel: NodeKernel;

  
    private readonly _controller: vscode.NotebookController;
    private _executionOrder = 0;
  
    constructor() {
      this._controller = vscode.notebooks.createNotebookController(
        this.controllerId,
        this.notebookType,
        this.label
      );
  
      this._controller.supportedLanguages = this.supportedLanguages;
      this._controller.supportsExecutionOrder = true;
      this._controller.executeHandler = this._execute.bind(this);

      this.nodeKernel = new NodeKernel();
    }
  
    private _execute(
      cells: vscode.NotebookCell[],
      _notebook: vscode.NotebookDocument,
      _controller: vscode.NotebookController
    ): void {
      for (let cell of cells) {
        this._doExecution(cell);
      }
    }
  
    private async _doExecution(cell: vscode.NotebookCell): Promise<void> {
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

      if (isSuccess) {
        execution.replaceOutput([
        new vscode.NotebookCellOutput([
          vscode.NotebookCellOutputItem.text(result, 'text/x-javascript')
        ])
      ]);
      } else {
        execution.replaceOutput([
          new vscode.NotebookCellOutput([
            vscode.NotebookCellOutputItem.text(result)
          ])
        ]);
      }
      execution.end(isSuccess, Date.now());
    }

    public dispose() {

    }
  }