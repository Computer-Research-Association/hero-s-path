import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { SnapshotViewProvider } from "./snapshotWebview";

let snapshots: any[] = [];
const MAX_SNAPSHOTS = 1000;
let provider: SnapshotViewProvider;

let snapshotIndicatorStatusBar: vscode.StatusBarItem;

function activate(context: vscode.ExtensionContext) {
  loadSnapshotsFromFile();

  const activeTheme = vscode.window.activeColorTheme;
  provider = new SnapshotViewProvider(
    context.extensionUri,
    snapshots,
    activeTheme
  );

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

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SnapshotViewProvider.viewType,
      provider
    )
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
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No active editor found!");
    return;
  }

  const document = editor.document;

  const saveListener = vscode.workspace.onDidSaveTextDocument((doc) => {
    if (doc === document) {
      takeSnapshot(editor);
    }
  });

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

  const snapshot = {
    timestamp: timestamp,
    text: snapshotText,
    language: document.languageId,
  };

  snapshots.push(snapshot);

  saveSnapshotsToFile(snapshots);
}

function openSnapshotVisualizer(context: vscode.ExtensionContext) {
  loadSnapshotsFromFile();

  provider.setSnapshots(snapshots);
}

function saveSnapshotsToFile(snapshots: any[]) {
  if (!vscode.workspace.workspaceFolders) {
    vscode.window.showErrorMessage(
      "No workspace folder is open. Snapshots cannot be saved."
    );
    return;
  }

  const workspaceFolder = vscode.workspace.workspaceFolders[0];
  const filePath = path.join(workspaceFolder.uri.fsPath, "snapshots.json");

  console.log("Snapshot saved: ", filePath);

  fs.writeFile(filePath, JSON.stringify(snapshots, null, 2), (err) => {
    if (err) {
      vscode.window.showErrorMessage(
        `Failed to save snapshots: ${err.message}`
      );
    }
  });
}

function loadSnapshotsFromFile() {
  if (!vscode.workspace.workspaceFolders) {
    vscode.window.showErrorMessage(
      "No workspace folder is open. Snapshots cannot be loaded."
    );
    return;
  }

  const workspaceFolder = vscode.workspace.workspaceFolders[0];
  const filePath = path.join(workspaceFolder.uri.fsPath, "snapshots.json");

  if (fs.existsSync(filePath)) {
    try {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      snapshots = JSON.parse(fileContent);
      console.log("Snapshots loaded from file:", snapshots);
    } catch (err) {
      vscode.window.showErrorMessage(`Failed to load snapshots`);
    }
  } else {
    console.log(
      "Snapshots file not found. Starting with an empty snapshot list."
    );
    snapshots = [];
  }
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
