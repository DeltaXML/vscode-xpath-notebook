# XPath Notebook for Visual Studio Code

A Visual Studio Code notebook extension for XPath 3.1. XPath notebooks can be used for data analysis (particularly suitable for XML or JSON) or for XPath experimentation or learning. 

![Notebook Screenshot](notebook-vscode-small.png)

*A screenshot of an XPath 3.1 Notebook with the context XML document shown alongside.*


# DeltaXML's XPath Notebook Features

| Feature  | Details |
| ------- | ------- |
| **XPath 3.1 Compatible**    | See W3C specifications for [XPath 3.1](https://www.w3.org/TR/xpath-31/#id-introduction)
| **Syntax Highlighting**   | Fast and precise - using [Semantic Highlighting](https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide) exclusively
| **Code Formatting**       | For multi-line XPath expressions - as you type or on save
| **Code Diagnostics**      | For XPath Syntax, variable/param references, functions etc.
| **XPath Processing** | Using Saxonica's [Saxon-JS](https://www.saxonica.com/saxon-js/index.xml) running in a [NodeJS](https://nodejs.org/en/) REPL
| **Auto-Completion**       | For XPath functions, variables, function parameters etc. 
| **Color Theme Support**   | Tested with most popular color themes ([Semantic Highlighting]() must be enabled in settings) 
| **Automated Evaluation Context**   | Sets context item, namespace context, context variables, last result variable
| **Code Folding**          | Using indentation
| **Notebook Context Variables**              | An **XPath Prologue** (e.g. ` variable = countries %` ) assigns the cell result to a notebook variable
| **Last Result Variable**        | Use `$_` to reference the last evaluated notebook cell result
| **Bracket Matching**      | For `()`, `{}`, and `[]`
| **Hover assistance**      | Shows tooltips. Providing signatures and descriptions for all built-in XSLT and XPath
| **JSON result format** | (mime-type: `text/x-javascript`) for maps, arrays etc. syntax-highlighter extended for node types
| **Table result format** | (mime-type: `text/html`) shows maps, sequences, arrays or arrays of maps in a table 
|||


## Introduction

DeltaXML's *XPath Notebook* extension adds comprehensive **XPath 3.1** support to Visual Studio Code's built-in notebooks. Visual Studio Code notebooks provide similar features to other popular notebook interfaces like the  [Juypter Notebook](https://jupyterlab.readthedocs.io/en/latest/user/notebook.html#notebook).

A notebook comprises a set of notebooks cells. These cells can either be **Markdown cells** for narrative content or **Code cells** for a specific programming language.

When a Code cell is executed, the result is rendered in an **Output cell** immediately below the current Code cell. The currently active **NotebookController** determines the output types that can be shown in the Output cell. Each output type will have a corresponding **NotebookRenderer** that is responsible for formatting the output type. For example, the result may be shown as JSON text or as an interactive HTML table.

## Create and save a new XPath Notebook

In Visual Studio Code, create a new file ( `New File` from the command pallette) and save the new file with a `.xbook` filename extension, e.g. `my-notebook.xbook`. The file will then be shown as an empty notebook.
Notebook files are saved in Visual Studio Code in the usual way. For XPath Notebooks, output cells are not included in the notebook file.

![empty notebook](empty-notebook.png)


## The XPath Evaluation Context

To set the evaluation context item for a notebook just open an XML file in Visual Studio Code. The document node of the most recently opened XML file is used for XPath expressions that expect a context node.

Here is a summary of the evaluation context:

| Definition  | Details |
| ------- | ------- |
| **Statically known namespaces** | for prefixes: `array`, `map`, `math`, `xs`, `xsl`|
| **Dynamically known namespaces** | from root element of last opened XML file |
| **Default element namespace** | any default namespace on root element of last opened XML file |
| **In-scope variables** | `$_` for last cell output <br> variables declared in prolog of executed cells 
| **Static Base URI** | the URI of the current XPath Notebook file
| **Base URI** | the URI of the last opened XML file

---
## Add and execute Notebook cells

Press the '`+ Code`' or '`+ Markdown`' buttons to add Code or Markdown cells. To execute a cell, press `Ctrl-ENTER` on the keyboard or click on the 'execute' button alongside the cell. When a Code cell is executed the result is shown in the Output cell immediately below the current cell.

For XPath Notebooks the Output cell type is JSON text. This allows XPath maps, arrays and sequences to be represented in an intuitive way. If a result item is an XML node then the XPath for the node is shown with special syntax highlighting to differentiate it from a string value.

> If you want to see the string values of XML nodes in the output cell
> you should convert them to a string, for example, using the `string()` XPath string contructor function, e.g. `/books/book/@author! string()`

![empty notebook](json-output.png)

*Sample JSON output cell showing special syntax highlighting for XML nodes*

## Add NoteBook Context Variables

XPath expressions in code cells can reference the results of other code cells. The `$_` variable is always set to the result of the previously executed cell. If you want to assign the result of a cell to a specific XPath variable, use a special *XPath Prolog** as the first line.

An XPath Prolog is separated from the XPath expression with the `%` character as this is not a valid XPath operator. The syntax for the prolog is: 
```xml
variable = <name> %
```
In the above, `<name>` is the name of the variable to which we assign the evaluation result of the following XPath expression.

> *Note: The intension is to use the XPath Prolog for other features later.*

In the example below, the result of the `$cities` variable declared in cell `[4]` is used when cell `[5]` is executed:

![cell variables](cell-variables.png)

## Problem Reporting

XPath expressions in Code cells are checked against basic syntax rules. Also, variable names and namespace prefixes are checked using the evaluation context (described above). References to Notebook context variables are marked as invalid until the Code cell with the corresponding variable assignment is executed.

## Auto-completion

Auto-completion is available when editing inside Code cells. Auto-completion is triggered for XPath functions and variable names. The variable names list will include Notebook context variables only once the corresponding cells have been evaluated.

## Choosing Cell Output Type

Currently XPath Notebooks supports three output types:

| Mime-type  | Details |
| ------- | ------- |
| **text/x‑javascript** | The default. Actual content is JSON but uses this mime-type for special syntax highlighting of XML nodes
| **text/html** | suitable for small data-sets (< 1MB) shows results in tabular form
| **application/json** | for advanced rendering from 3rd party VS Code extensions like [VSCode Data Table](https://github.com/RandomFractals/vscode-data-table) 


 To select an alternative output type, press the ![consolidated-button](consolidated-button.png) (consolidated) output button or the ![button](button.png) (normal) output button shown to the left of the output cell. Then select the `text/html` mime-type. *(See the note below to see how to control what button is shown)*.

![html table](html-output-cell.png)

> *Note: A Notebook Layout setting (`@tag:notebookLayout consolidated output button`) control whether you see a 'consolidated' or 'normal' button alongside the Notbook output cell. For this extension, it's more convenient to disable the 'consolidated' button.*

# Implementation Detail

## Evaluation

The XPath Notebook uses the [NodeJS REPL](https://nodejs.org/api/repl.html#repl_the_node_js_repl) to execute XPath cells. The [Saxon-JS](https://www.npmjs.com/package/saxon-js) NPM module from [Saxonica](https://www.saxonica.com/saxon-js/documentation/index.html) is pre-installed with the extension.

To evaluate an XPath expression the `SaxonJS.transform` function invoked via the NodeJS REPL. The XSLT used in the transorm is a compiled *SEF* file, the XPath expression and evaluation context are passed as XSLT parameters. 

Additional namespace bindings are added by the XSLT to the context node for '`array`', '`map`'... prefixes. The XSLT converts the result of an `xsl:evaluate` intruction to the XML representation for JSON by applying templates to the result. The `JSON XML` is then converted to JSON using the `xml-to-json` XPath function.

Prior to evaluation, the XSLT separates any XPath Prolog from the expression. If a variable assignment is found in the prolog, the `ixsl:call` extension function is used to invoke a `setVariable` function on a JavaScript object passed as an XSLT parameter via the API.

`ixsl:get` and `ixsl:call` extension functions are used on the JavaScript object passed as an XSLT parameter to fetch the set of variables added to the Notexbook context by evaluation of previous Code cells.

# XPath Code Editing Features

All XPath code editing features are provided by DeltaXML's companion [XSLT/XPath for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=deltaxml.xslt-xpath) extension - installed automatically with the XPath Notebook extension.




