// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const { spawnSync } = require("child_process");

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider("wolfram", {
      provideDocumentFormattingEdits(document) {
        const cellContent = [];
        for (let i = 0; i < document.lineCount; i++) {
          cellContent.push(document.lineAt(i).text);
        }
        const cellContentString = cellContent.join("\n");

        return [
          vscode.TextEdit.replace(
            new vscode.Range(
              new vscode.Position(0, 0),
              new vscode.Position(
                document.lineCount - 1,
                document.lineAt(document.lineCount - 1).text.length
              )
            ),

            spawnSync(`wolframscript`, ["-f", "./fmt.wls", cellContentString], {
              timeout: 30000,
              stdio: "pipe",
            }).stdout.toString()
          ),
        ];
      },
    })
  );
}
// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
