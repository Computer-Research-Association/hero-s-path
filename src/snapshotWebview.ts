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
      <style>
        body {
          font-family: var(--vscode-editor-font-family, "Courier New", monospace);
          font-size: var(--vscode-editor-font-size, 14px);
          color: var(--vscode-editor-foreground, #000);
          background-color: var(--vscode-editor-background, #fff);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
        }
        canvas {
          margin: 20px;
          border: 1px solid var(--vscode-editorWidget-border, #ccc);
          background-color: var(--vscode-editorWidget-background, #f3f3f3);
        }
        .controls {
          margin-bottom: 20px;
        }
        button {
          margin: 0 5px;
          padding: 5px 10px;
          font-size: 16px;
          cursor: pointer;
          border-radius: 3px;
          border: none;
          background-color: var(--vscode-button-background, #007acc);
          color: var(--vscode-button-foreground, #fff);
        }
        button:hover {
          background-color: var(--vscode-button-hoverBackground, #005f99);
        }
      </style>
    </head>
    <body>
      <h1>Snapshots Minimap</h1>
      <div class="controls">
        <button id="playButton">Play</button>
        <button id="pauseButton">Pause</button>
      </div>
      <canvas id="minimapCanvas" width="400" height="600"></canvas>

      <script>
        const snapshots = ${JSON.stringify(snapshots)};
        let currentIndex = 0;
        let timelapseInterval;

        const canvas = document.getElementById("minimapCanvas");
        const ctx = canvas.getContext("2d");
        const playButton = document.getElementById("playButton");
        const pauseButton = document.getElementById("pauseButton");

        function renderSnapshot(index) {
          if (index < 0 || index >= snapshots.length) return;

          const snapshot = snapshots[index];
          const lines = snapshot.text.split("\\n");
          const lineHeight = canvas.height / lines.length;

          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          lines.forEach((line, i) => {
            const color = calculateColor(line);
            ctx.fillStyle = color;
            ctx.fillRect(0, i * lineHeight, canvas.width, lineHeight);
          });
        }

        function calculateColor(line) {
          // Simple hash-based color calculation
          const hash = line
            .split("")
            .reduce((accum, currVal) => accum + currVal.charCodeAt(0), 0);
          const hue = hash % 360;
          return \`hsl(\${hue}, 50%, 50%)\`;
        }

        function playTimelapse() {
          if (!timelapseInterval) {
            timelapseInterval = setInterval(() => {
              renderSnapshot(currentIndex);
              currentIndex = (currentIndex + 1) % snapshots.length;
            }, 1000); // Update every second
          }
        }

        function pauseTimelapse() {
          clearInterval(timelapseInterval);
          timelapseInterval = null;
        }

        playButton.addEventListener("click", playTimelapse);
        pauseButton.addEventListener("click", pauseTimelapse);

        // Show the first snapshot initially
        renderSnapshot(0);
      </script>
    </body>
    </html>
  `;
}

/*
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
        pre {
          margin: 20px;
          padding: 15px;
          border-radius: 5px;
          overflow-x: auto;
          font-family: var(--vscode-editor-font-family, "Courier New", monospace);
          font-size: var(--vscode-editor-font-size, 14px);
          color: var(--vscode-editor-foreground);
          background-color: var(--vscode-editor-background);
        }
        code {
          font-family: var(--vscode-editor-font-family, "Courier New", monospace);
          font-size: var(--vscode-editor-font-size, 14px);
          color: var(--vscode-editor-foreground);
          background-color: var(--vscode-editor-background);
        }
        body {
          font-family: var(--vscode-editor-font-family, "Courier New", monospace);
          font-size: var(--vscode-editor-font-size, 14px);
          line-height: var(--vscode-editor-line-height, 1.5);
          color: var(--vscode-editor-foreground, #000);
          background-color: var(--vscode-editor-background, #fff);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
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
        .controls {
          margin-bottom: 20px;
        }
        button {
          margin: 0 5px;
          padding: 5px 10px;
          font-size: 16px;
          cursor: pointer;
          border-radius: 3px;
          border: none;
          background-color: var(--vscode-button-background, #007acc);
          color: var(--vscode-button-foreground, #fff);
        }
        button:hover {
          background-color: var(--vscode-button-hoverBackground, #005f99);
        }
      </style>
    </head>
    <body>
      <h1>Project History</h1>
      <div class="controls">
        <button id="playButton">Play</button>
        <button id="pauseButton">Pause</button>
      </div>
      <div class="snapshot-container" id="snapshotContainer">No snapshots available.</div>

      <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js"></script>
      <script>
        const snapshots = ${JSON.stringify(snapshots)};
        let currentIndex = 0;
        let slideshowInterval;

        const snapshotContainer = document.getElementById("snapshotContainer");
        const playButton = document.getElementById("playButton");
        const pauseButton = document.getElementById("pauseButton");

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

        playButton.addEventListener("click", () => {
          if (!slideshowInterval) {
            slideshowInterval = setInterval(updateSnapshot, 2000); // Change every 2 seconds
          }
        });

        pauseButton.addEventListener("click", () => {
          clearInterval(slideshowInterval);
          slideshowInterval = null;
        });

        // Show the first snapshot initially
        updateSnapshot();
      </script>
    </body>
    </html>
  `;
}
*/
