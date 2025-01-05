import * as vscode from "vscode";

export function getSnapshotWebviewContent(
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
          font-family: var(--vscode-editor-font-family, "Courier New", monospace);
          font-size: var(--vscode-editor-font-size, 14px);
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
        .header {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          padding: 10px 20px;
          background-color: var(--vscode-editorWidget-background, #f3f3f3);
          border-bottom: 1px solid var(--vscode-editorWidget-border, #ccc);
          z-index: 1000;
          box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);
        }
        .header h1 {
          margin: 0;
          font-size: 16px;
        }
        .snapshot-container {
          flex: 1;
          margin-top: 40px;
          overflow-y: auto;
          padding: 10px;
          justify-content: center;
          align-items: center;
          color: var(--vscode-editor-foreground, #000);
          background-color: var(--vscode-editor-background, #fff);
        }
        .snapshot {
          margin: 10px;
          border: 1px solid var(--vscode-editorWidget-border, #ccc);
          padding: 10px;
          border-radius: 5px;
          background-color: var(--vscode-editorWidget-background, #f3f3f3);
          max-width: 80%;
          white-space: pre-wrap;
          word-wrap: break-word;
          text-align: left;
        }
        pre {
          margin: 0;
          padding: 10px;
          font-family: var(--vscode-editor-font-family, "Courier New", monospace);
          font-size: var(--vscode-editor-font-size, 14px);
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
      <div class="header">
        <h1>Hero's Path</h1>
      </div>
      <div class="snapshot-container" id="snapshotContainer">No snapshots available.</div>

      <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js"></script>
      <script>
      const snapshots = ${JSON.stringify(snapshots)};
      let currentIndex = 0;

      const snapshotContainer = document.getElementById("snapshotContainer");

      function updateSnapshot() {
        if (snapshots.length === 0) {
          snapshotContainer.textContent = "No snapshots available.";
          return;
        }

        let htmlContent = "";

        htmlContent = \`
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

      setInterval(updateSnapshot, 500);
      updateSnapshot();
    </script>

    </body>
    </html>
  `;
}
