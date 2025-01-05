import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { getSnapshotWebviewContent } from "./snapshotWebview";

let snapshots: any[] = [];
const MAX_SNAPSHOTS = 1000;

let snapshotIndicatorStatusBar: vscode.StatusBarItem;

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

  snapshotIndicatorStatusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );

  context.subscriptions.push(startCommand, viewCommand);
  context.subscriptions.push(snapshotIndicatorStatusBar);
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(updateStatusBar)
  );
}

function updateStatusBar(): void {
  const n = snapshots.length;

  if (n > 0) {
    snapshotIndicatorStatusBar.text = `$(map-filled) ${n} snapshots`;
    snapshotIndicatorStatusBar.show();
  } else {
    snapshotIndicatorStatusBar.hide();
  }
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

async function takeSnapshot(editor: vscode.TextEditor) {
  if (snapshots.length >= MAX_SNAPSHOTS) {
    snapshots.shift();
  }

  const document = editor.document;
  const snapshotText = document.getText();
  const timestamp = new Date();

  // Capture a snapshot of the document
  const snapshot = {
    timestamp: timestamp,
    text: snapshotText,
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
  panel.webview.html = getSnapshotWebviewContent(
    snapshots,
    activeTheme,
    context.extensionUri
  );
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
    }
  });
}

// Deactivate extension
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
