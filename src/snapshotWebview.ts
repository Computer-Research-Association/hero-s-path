import * as vscode from "vscode";

export function getSnapshotWebviewContent(
  snapshots: any[],
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
        }
        .snapshot-container {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .snapshot {
          margin: 20px;
          border: 1px solid var(--vscode-editorWidget-border, #ccc);
          padding: 20px;
          border-radius: 5px;
          background-color: var(--vscode-editorWidget-background, #f3f3f3);
          max-width: 80%;
          white-space: pre-wrap;
          word-wrap: break-word;
          text-align: left;
        }
      </style>
    </head>
    <body>
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

          const snapshot = snapshots[currentIndex];

          // Create a container for the snapshot
          const snapshotContent = document.createElement("div");
          snapshotContent.className = "snapshot-content";

          // Add title
          const title = document.createElement("h3");
          title.textContent = \`Snapshot \${currentIndex + 1} - \${new Date(
            snapshot.timestamp
          ).toLocaleTimeString()}\`;
          snapshotContent.appendChild(title);

          // Add code block
          const codeBlock = document.createElement("pre");
          const code = document.createElement("code");
          codeBlock.className = "code";

          code.className = snapshot.language || "plaintext"
          code.textContent = snapshot.text; // Use textContent to ensure raw text
          codeBlock.appendChild(code);

          snapshotContent.appendChild(codeBlock);

          // Replace existing content
          snapshotContainer.innerHTML = ""; // Clear previous content
          snapshotContainer.appendChild(snapshotContent);

          hljs.highlightElement(code);

          currentIndex = (currentIndex + 1) % snapshots.length;
        }

        // Start autoplaying snapshots
        setInterval(updateSnapshot, 500); // Change every 2 seconds

        // Show the first snapshot initially
        updateSnapshot();
      </script>
    </body>
    </html>
  `;
}
