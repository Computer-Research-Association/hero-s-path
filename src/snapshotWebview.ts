import * as vscode from "vscode";
import DiffMatchPatch from "diff-match-patch";

export function getSnapshotWebviewContent(
  snapshots: { text: string }[],
  activeColorTheme: vscode.ColorTheme
): string {
  const darkMode = activeColorTheme.kind === vscode.ColorThemeKind.Dark;

  const diffs: string[] = computeDiffs(snapshots);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/default.min.css">
      <style>
        body {
          margin: 0;
          font-family: sans-serif;
          background-color: var(--vscode-editor-background);
          color: var(--vscode-editor-foreground);
        }
        pre, code {
          margin: 0;
          font-family: Consolas, "Courier New", monospace;
          background-color: var(--vscode-editor-background);
          color: var(--vscode-editor-foreground);
        }
        .diff del {
          font-family: inherit;
          background-color: #ffc6c6 !important;
          text-decoration: none;
          color: inherit;
        }
        .diff ins {
          font-family: inherit;
          background-color: #c6ffc6 !important;
          text-decoration: none;
          color: inherit;
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

        if (currentIndex % 2 === 0) {
          const snapshotIndex = currentIndex / 2;
          htmlContent = \`
            <div class="snapshot">
              <h3>Snapshot \${snapshotIndex + 1}</h3>
              <pre><code class="hljs">\${snapshots[snapshotIndex].text}</code></pre>
            </div>
          \`;
        } else {
          const diffIndex = Math.floor(currentIndex / 2);
          if (diffIndex < diffs.length) {
            htmlContent = \`
              <div class="snapshot">
                <h3>Diff: Snapshot \${diffIndex + 1} → Snapshot \${diffIndex + 2}</h3>
                <pre class="diff"><code class="hljs">\${diffs[diffIndex]}</code></pre>
              </div>
            \`;
          }
        }

        snapshotContainer.innerHTML = htmlContent;

        snapshotContainer.querySelectorAll("pre code.hljs").forEach((block) => {
          hljs.highlightElement(block);
        })

        currentIndex = (currentIndex + 1) % (snapshots.length * 2 - 1);
      }

      setInterval(updateSnapshot, 1000);
      updateSnapshot();
    </script>
    </body>
    </html>
  `;
}

function computeDiffs(snapshots: any[]): string[] {
  const dmp = new DiffMatchPatch();
  const diffs: string[] = [];

  for (let i = 1; i < snapshots.length; i++) {
    const prevText = snapshots[i - 1].text;
    const currText = snapshots[i].text;
    const diff = dmp.diff_main(prevText, currText);
    dmp.diff_cleanupSemantic(diff);

    const diffHtml = diff
      .map(([op, text]) => {
        const highlihgtedText = applyCustomSyntaxHighlighting(escapeHtml(text));

        if (op === -1) {
          return `<span style="background-color: #ffc6c6 !important; text-decoration: none; color: inherit;">${highlihgtedText}</span>`;
        }
        if (op === 1) {
          return `<span style="background-color: #c6ffc6 !important; text-decoration: none; color: inherit;">${highlihgtedText}</span>`;
        }
        return highlihgtedText;
      })
      .join("");

    diffs.push(diffHtml);
  }

  return diffs;
}

function applyCustomSyntaxHighlighting(code: string): string {
  const keywordRegex =
    /\b(function|let|const|if|else|for|while|return|class|import|export|new|true|false|null|undefined|try|catch|finally)\b/g;
  const stringRegex = /(["'`])(?:\\\1|.)*?\1/g;
  const numberRegex = /\b\d+\b/g;

  code = code.replace(keywordRegex, `<span class="hljs-keyword">$&</span>`);
  code = code.replace(stringRegex, `<span class="hljs-string">$&</span>`);
  code = code.replace(numberRegex, `<span class="hljs-number">$&</span>`);

  return code;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
