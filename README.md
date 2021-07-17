# XPath Notebook for Visual Studio Code

A Visual Studio Code notebook extension for XPath 3.1. XPath notebooks can be used in a variety of different ways, for XML analysis and XPath learning and testing. 

![Notebook Screenshot](notebook-vscode-small.png)

*A screenshot of an XPath 3.1 Notebook with the context XML document shown alongside.*


# DeltaXML's XPath Notebook Features

| Feature  | Details |
| ------- | ------- |
| **XPath 3.1 Compatible**    | See W3C specifications for [XPath 3.1](https://www.w3.org/TR/xpath-31/#id-introduction)
| **Syntax Highlighting**   | Fast and precise - using [Semantic Highlighting](https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide) exclusively
| **Code Formatting**       | For multi-line XPath expressions - as you type or on save
| **Code Diagnostics**      | For XPath Syntax, variable/param references, functions etc.
| **XPath Processing** | Using Saxon-JS running in a NodeJS REPL
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


## Set the XML Context

To set the evaluation context item for a notebook just open an XML file in Visual Studio Code. The document node of the most recently opened XML file is used for XPath expressions that expect a context node.

## Add and execute Notebook cells

Press the '`+ Code`' or '`+ Markdown`' buttons to add Code or Markdown cells. To execute a cell, press `Ctrl-ENTER` on the keyboard or click on the 'execute' button alongside the cell. When a Code cell is executed the result is shown in the Output cell immediately below the current cell.

For XPath Notebooks the Output cell type is JSON text. This allows XPath maps, arrays and sequences to be represented in an intuitive way. If a result item is an XML node then the XPath for the node is shown with special syntax highlighting to differentiate it from a string value.

> If you want to see the string values of XML nodes in the output cell
> you should convert them to a string, for example, using the `string()` XPath string contructor function, e.g. `/books/book/@author! string()`

![empty notebook](json-output.png)

*Sample JSON output cell showing special syntax highlighting for XML nodes*


