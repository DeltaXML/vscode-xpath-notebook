# vscode-xpath-notebook
Visual Studio Code notebook extension for XPath 3.1

# DeltaXML's XPath Notebook Features

| Feature  | Details |
| ------- | ------- |
| **XPath 3.1 Compatible**    | See W3C specifications for [XPath 3.1](https://www.w3.org/TR/xpath-31/#id-introduction)
| **Syntax Highlighting**   | Fast and precise - using [Semantic Highlighting](https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide) exclusively
| **Code Formatting**       | For multi-line XPath expressions - as you type or on save
| **Code Diagnostics**      | For XPath Syntax, variable/param references, functions etc.
| **XPath Processing** | Using Saxon-JS
| **Auto-Completion**       | functions, variables, function parameters etc. 
| **Color Theme Support**   | Tested with most popular color themes ([Semantic Highlighting]() must be enabled in settings) 
| **Automated Evaluation Context**   | Sets context item, namespace context, notebook variables, previous result
| **Code Folding**          | Using indentation
| **Notebook Variables**              | 'XPath Prologue' (`variable = countries %`) assigns cell result to a set of context variables
| **Last Result Variable**        | Use `$_` to reference the last evaluated notebook cell result
| **Bracket Matching**      | For `()`, `{}`, and `[]`
| **Hover assistance**      | Shows tooltips. Providing signatures and descriptions for all built-in XSLT and XPath
| **JSON result format** | for maps, arrays etc. syntax-highlighter extended for node types
| **Table result format** | shows maps, sequences, arrays or arrays of maps in a table 
|||

## Getting Started

Create a new file in Visual Studio Code with the `.xbook` file extension.

A notebook comprises a set of **Markdown** or **Code** cells. Click the '`+ Markdown`' or '`+ Code`' buttons to add a new cell.

To execute the current code cell press `CTRL-Enter` or click on the 'execute cell' button adjacent to the cell.

The result is initially shown using the JSON notation. You can switch to another view by clicking on the '...' button adjacent to the output cell.

Save a notebook file in the same way as other files. 

Output cells are not saved, so the next time you open the notebook file you will see the **Markdown** and **Code** cells but not the output cells.

## Other Documentation / Resources ##

Notebook featues have only been introduced recently to Visual Studio Code. Documentation is therefore limited.  You should however find the [Jupyter Notebooks](https://code.visualstudio.com/learn/educators/notebooks) documentation provides some useful context and a good introduction to the features. Details of the user interface may differ though.

