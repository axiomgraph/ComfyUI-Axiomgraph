# ComfyUI Workflow Timer

A small ComfyUI custom node that displays the elapsed time of a whole queue execution. The node has no inputs or outputs; its frontend extension listens to ComfyUI execution events.

## Features

- Starts when a queued workflow begins.
- Updates the display while the workflow runs.
- Stops on success, error, or interruption.
- Keeps the five most recent successful run times.
- Saves run history in the workflow's node properties.
- Provides a right-click menu to view recent runs and reset history.
- Uses a DOM display and does not require third-party JavaScript packages.

## Installation

1. Copy this folder into `ComfyUI/custom_nodes/`.
2. Restart ComfyUI.
3. Refresh the browser tab (a hard refresh may be needed after the first install).
4. Search for **Workflow Timer** under **Utilities/Monitoring**.

The node is a display-only node. It does not need to be connected to another node.

## Project structure

```text
ComfyUI-WorkflowTimer/
├── __init__.py
├── timer_node.py
├── LICENSE
├── README.md
└── js/
    └── timer.js
```

## Compatibility notes

The frontend uses ComfyUI's `app.registerExtension`, `api` execution events, and the node DOM-widget API. These are frontend APIs and may evolve. This initial version should be tested against the ComfyUI frontend version you use, especially if you use the newer Nodes 2.0 renderer.

## License

This project is licensed under the GNU General Public License, version 3 or (at your option) any later version. See [LICENSE](LICENSE).

Copyright (C) 2026 the ComfyUI Workflow Timer contributors.
