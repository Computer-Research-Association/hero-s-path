import * as vscode from "vscode";
import DiffMatchPatch from "diff-match-patch";

export function getSnapshotWebviewContent(
  snapshots: { text: string }[],
  activeTheme: vscode.ColorTheme
): string {
  const darkMode = activeTheme.kind === vscode.ColorThemeKind.Dark;

  // Precompute diffs between consecutive snapshots
  const dmp = new DiffMatchPatch();
  const diffs: string[] = [];

  for (let i = 1; i < snapshots.length; i++) {
    const prevText = snapshots[i - 1].text;
    const currText = snapshots[i].text;
    const diff = dmp.diff_main(prevText, currText);
    dmp.diff_cleanupSemantic(diff);

    const diffHtml = diff
      .map(([op, text]) => {
        if (op === -1) {
          return `<del style="background-color: #ffc6c6 !important; text-decoration: none; color: inherit;">${text}</del>`;
        }
        if (op === 1) {
          return `<ins style="background-color: #c6ffc6 !important; text-decoration: none; color: inherit;">${text}</ins>`;
        }
        return `<span>${text}</span>`;
      })
      .join("");

    diffs.push(diffHtml);
  }

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
          margin-top: 50px; /* Adjust for the fixed header height */
          overflow-y: auto;
          padding: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
          color: var(--vscode-editor-foreground, #000);
          background-color: var(--vscode-editor-background, #fff);
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
        body ins {
          background-color: #c6ffc6 !important;
          text-decoration: none;
          border-radius: 3px;
          padding: 2px;
          color: inherit;
        }
        body del {
          background-color: #ffc6c6 !important;
          text-decoration: none;
          border-radius: 3px;
          padding: 2px;
          color: inherit;
        }
        span {
          color: inherit
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Snapshot Viewer</h1>
      </div>
      <div class="snapshot-container" id="snapshotContainer">No snapshots available.</div>

      <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js"></script>
      <script>
      const snapshots = ${JSON.stringify(snapshots)};
      const diffs = ${JSON.stringify(diffs)};
      let currentIndex = 0;

      const snapshotContainer = document.getElementById("snapshotContainer");

      function updateSnapshot() {
        if (snapshots.length === 0) {
          snapshotContainer.textContent = "No snapshots available.";
          return;
        }

        let htmlContent = "";

        // Determine what to display based on the current index
        if (currentIndex % 2 === 0) {
          // Even index: Show the full snapshot
          const snapshotIndex = currentIndex / 2; // Convert to the corresponding snapshot index
          htmlContent = \`
            <div class="snapshot">
              <h3>Snapshot \${snapshotIndex + 1}</h3>
              <pre><code class="hljs">\${snapshots[snapshotIndex].text}</code></pre>
            </div>
          \`;
        } else {
          // Odd index: Show the diff between the current and next snapshot
          const diffIndex = Math.floor(currentIndex / 2); // Convert to the corresponding diff index
          if (diffIndex < diffs.length) {
            htmlContent = \`
              <div class="snapshot">
                <h3>Diff: Snapshot \${diffIndex + 1} → Snapshot \${diffIndex + 2}</h3>
                <pre><code class="hljs">\${diffs[diffIndex]}</code></pre>
              </div>
            \`;
          }
        }

        // Replace existing content
        snapshotContainer.innerHTML = htmlContent;

        // Highlight the syntax for all code (preserve VS Code theme)
        document.querySelectorAll("code").forEach((block) => {
          hljs.highlightBlock(block);
        });

        // Apply runtime styles to ins and del tags after syntax highlighting
        document.querySelectorAll("code ins").forEach((el) => {
          el.style.backgroundColor = "#c6ffc6"; // Green for insertions
          el.style.textDecoration = "none";
          el.style.borderRadius = "3px";
          el.style.padding = "2px";
          el.style.color = "inherit"; // Inherit text color from parent
        });

        document.querySelectorAll("code del").forEach((el) => {
          el.style.backgroundColor = "#ffc6c6"; // Red for deletions
          el.style.textDecoration = "none";
          el.style.borderRadius = "3px";
          el.style.padding = "2px";
          el.style.color = "inherit"; // Inherit text color from parent
        });

        // Update the index
        currentIndex = (currentIndex + 1) % (snapshots.length * 2 - 1);
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
