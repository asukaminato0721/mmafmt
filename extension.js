// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const path = require("path");
const http = require("http");
const { spawn } = require("child_process");

const port = 5858;

const child = spawn("wolframscript", [
  "-f",
  path.join(__dirname, "server.wls"),
  port.toString(),
]);
console.debug(`server pid = ${child.pid}`);

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(
      { language: "wolfram" },
      {
        async provideDocumentFormattingEdits(document) {
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
              await new Promise((resolve) => {
                const chunks = [];
                const req = http.request(
                  {
                    hostname: "127.0.0.1",
                    port,
                    path: "/",
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "Content-Length": cellContentString.length,
                    },
                  },
                  (res) => {
                    res.on("data", (chunk) => chunks.push(chunk));
                    res.on("end", () => {
                      const data = Buffer.concat(chunks).toString();
                      console.debug(data);
                      resolve(data);
                    });
                  }
                );
                req.write(cellContentString);
                req.end();
              })
            ),
          ];
        },
      }
    )
  );
}

// This method is called when your extension is deactivated
function deactivate() {
  child.stdin.end();
  child.stdout.destroy();
  child.stderr.destroy();
  child.kill("SIGKILL");
}

module.exports = {
  activate,
  deactivate,
};
