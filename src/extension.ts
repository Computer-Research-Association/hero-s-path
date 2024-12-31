import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { getSnapshotWebviewContent } from "./snapshotWebview";

let snapshots: any[] = [];

function activate(context: vscode.ExtensionContext) {
  // Command to start tracking changes
  let startCommand = vscode.commands.registerCommand(
    "hero-s-path.startHerosPath",
    () => {
      vscode.window.showInformationMessage("Started tracking code changes!");
      startTracking();
    }
  );

  let viewCommand = vscode.commands.registerCommand(
    "hero-s-path.viewSnapshots",
    () => {
      openSnapshotVisualizer(context);
    }
  );

  context.subscriptions.push(startCommand, viewCommand);
}

function startTracking() {
  // Event listener for active editor changes
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No active editor found!");
    return;
  }

  const document = editor.document;

  // Track changes on save or document edits
  const saveListener = vscode.workspace.onDidSaveTextDocument((doc) => {
    if (doc === document) {
      takeSnapshot(editor);
    }
  });

  // Clean up listeners when done
  vscode.window.onDidChangeActiveTextEditor(() => {
    saveListener.dispose();
  });
}

function takeSnapshot(editor: vscode.TextEditor) {
  const document = editor.document;

  // Capture a snapshot of the document
  const snapshot = {
    timestamp: new Date(),
    text: document.getText(),
    language: document.languageId,
  };

  snapshots.push(snapshot);

  // Optionally log or save snapshots
  console.log("Snapshot taken:", snapshot);

  saveSnapshotsToFile(snapshots);
}

function openSnapshotVisualizer(context: vscode.ExtensionContext) {
  const panel = vscode.window.createWebviewPanel(
    "snapshotVisualizer",
    "Snapshots Visualizer",
    vscode.ViewColumn.One,
    {
      enableScripts: true,
    }
  );

  const activeTheme = vscode.window.activeColorTheme;
  panel.webview.html = getSnapshotWebviewContent(snapshots, activeTheme);
}

function saveSnapshotsToFile(snapshots: any[]) {
  if (!vscode.workspace.workspaceFolders) {
    vscode.window.showErrorMessage(
      "No workspace folder is open. Snapshots cannot be saved."
    );
    return;
  }

  // Get the first workspace folder
  const workspaceFolder = vscode.workspace.workspaceFolders[0];
  const filePath = path.join(workspaceFolder.uri.fsPath, "snapshots.json");

  console.log("Snapshot saved: ", filePath);

  // Write to the file
  fs.writeFile(filePath, JSON.stringify(snapshots, null, 2), (err) => {
    if (err) {
      vscode.window.showErrorMessage(
        `Failed to save snapshots: ${err.message}`
      );
    } else {
      vscode.window.showInformationMessage(`Snapshots saved to ${filePath}`);
    }
  });
}

// Deactivate extension
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
