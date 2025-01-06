import * as vscode from "vscode";

export class SnapshotViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "snapshotVisualizer";

  private _view?: vscode.WebviewView;
  private _snapshots: any[];
  private _activeTheme: vscode.ColorTheme;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    snapshots: any[],
    activeTheme: vscode.ColorTheme
  ) {
    this._snapshots = snapshots;
    this._activeTheme = activeTheme;
  }

  public setSnapshots(snapshots: any[]) {
    this._snapshots = snapshots;

    if (this._view) {
      this._view.webview.html = this.getSnapshotWebviewContent(
        this._snapshots,
        this._activeTheme
      );
    }
  }

  public setActiveTheme(activeTheme: vscode.ColorTheme) {
    this._activeTheme = activeTheme;
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken
  ): Thenable<void> | void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this.getSnapshotWebviewContent(
      this._snapshots,
      this._activeTheme
    );
  }

  public getSnapshotWebviewContent(
    snapshots: { text: string }[],
    activeTheme: vscode.ColorTheme
  ): string {
    const darkMode = activeTheme.kind === vscode.ColorThemeKind.Dark;

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/${
          darkMode ? "github-dark" : "github"
        }.min.css"
      >
      <style>
        body {
          line-height: var(--vscode-editor-line-height, 1.5);
          color: var(--vscode-editor-foreground, #000);
          background-color: var(--vscode-editor-background, #fff);
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          height: 100vh;
          justify-content: center;
          align-items: center;
        }
        .snapshot-container {
          flex: 1;
          margin-top: 0px;
          overflow-y: auto;
          padding: 10px;
          justify-content: center;
          align-items: center;
          color: var(--vscode-editor-foreground, #000);
          background-color: var(--vscode-editor-background, #fff);
        }
        .snapshot {
          border: 1px solid var(--vscode-editorWidget-border, #ccc);
          padding: 0px 10px;
          border-radius: 5px;
          background-color: var(--vscode-editorWidget-background, #f3f3f3);
          white-space: pre-wrap;
          word-wrap: break-word;
          text-align: left;
        }
        pre {
          margin: 0;
          font-family: var(--vscode-editor-font-family, "Courier New", monospace);
          font-size: 4px;
          line-height: var(--vscode-editor-line-height, 1.5);
          color: var(--vscode-editor-foreground, #000);
          background-color: var(--vscode-editor-background, #fff);
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        code {
          display: block;
          color: inherit;
        }
      </style>
    </head>
    <body>
      <div class="snapshot-container" id="snapshotContainer">No snapshots available.</div>

      <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js"></script>
      <script>
      const snapshots = ${JSON.stringify(snapshots).replace(/</g, "\\u003c")};
      let currentIndex = 0;

      const snapshotContainer = document.getElementById("snapshotContainer");

      function updateSnapshot() {
        if (snapshots.length === 0) {
          snapshotContainer.textContent = "No snapshots available.";
          return;
        }

        let htmlContent = \`
          <div class="snapshot">
            <pre><code class="hljs">\${snapshots[currentIndex].text}</code></pre>
          </div>
        \`;

        snapshotContainer.innerHTML = htmlContent;

        document.querySelectorAll("code").forEach((block) => {
          hljs.highlightBlock(block);
        });

        currentIndex = (currentIndex + 1) % snapshots.length;
      }

      setInterval(updateSnapshot, 100);
      updateSnapshot();
    </script>

    </body>
    </html>`;
  }
}
