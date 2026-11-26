/**
 * ComfyUI Workflow Timer (Nodes 2.0)
 * Copyright (C) 2026 the ComfyUI Workflow Timer contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

const NODE_TYPE = "AxiomGraph_WorkflowTimer";
const PROPERTY_KEY = "axiomgraph_workflow_timer";
const WIDGET_NAME = "axiomgraph_workflow_timer_display";
const MAX_HISTORY = 5;
const UPDATE_INTERVAL_MS = 100;
const DEFAULT_WIDTH = 210;
const DISPLAY_HEIGHT = 56;

const COLORS = {
  background: "#080d10",
  text: "#36e6d8",
  idle: "#50615f",
  running: "#ffd166",
  failed: "#ff665b",
  border: "#1c3435",
};

const FONT = 'ui-monospace, "SFMono-Regular", Consolas, "Liberation Mono", monospace';

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const tenths = Math.floor((seconds % 1) * 10);
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  if (minutes > 0) {
    return `${minutes}:${String(secs).padStart(2, "0")}.${tenths}`;
  }
  return `${secs}.${tenths}s`;
}

function readSavedHistory(node) {
  const history = node.properties?.[PROPERTY_KEY]?.history;
  if (!Array.isArray(history)) return [];
  return history.filter((value) => Number.isFinite(value) && value >= 0).slice(0, MAX_HISTORY);
}

function saveHistory(state) {
  state.node.properties ??= {};
  state.node.properties[PROPERTY_KEY] = {
    history: state.history.slice(0, MAX_HISTORY),
  };
}

function makeState(node) {
  return {
    node,
    running: false,
    startedAt: 0,
    elapsed: 0,
    status: "idle",
    history: readSavedHistory(node),
    intervalId: null,
    abortController: new AbortController(),
    root: null,
    led: null,
    digits: null,
  };
}

function render(state) {
  if (!state.digits || !state.led || !state.root) return;

  const displayedTime = state.running
    ? (performance.now() - state.startedAt) / 1000
    : state.elapsed;

  state.digits.textContent = formatTime(displayedTime);
  state.led.className = `ag-workflow-timer-led ${state.status}`;
  state.digits.dataset.status = state.status;
  state.root.dataset.status = state.status;
}

function stopInterval(state) {
  if (state.intervalId !== null) {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }
}

function startRun(state) {
  stopInterval(state);
  state.running = true;
  state.startedAt = performance.now();
  state.elapsed = 0;
  state.status = "running";
  render(state);

  state.intervalId = setInterval(() => {
    render(state);
  }, UPDATE_INTERVAL_MS);
}

function finishRun(state, outcome) {
  if (!state.running) return;

  state.elapsed = Math.max(0, (performance.now() - state.startedAt) / 1000);
  state.running = false;
  state.status = outcome;
  stopInterval(state);

  if (outcome === "done") {
    state.history.unshift(state.elapsed);
    state.history = state.history.slice(0, MAX_HISTORY);
    saveHistory(state);
  }

  render(state);
}

function attachExecutionListeners(state) {
  const { signal } = state.abortController;

  api.addEventListener("execution_start", () => startRun(state), { signal });
  api.addEventListener("execution_success", () => finishRun(state, "done"), { signal });
  api.addEventListener("execution_error", () => finishRun(state, "error"), { signal });
  api.addEventListener("execution_interrupted", () => finishRun(state, "interrupted"), { signal });
}

function addStyles() {
  if (document.getElementById("ag-workflow-timer-styles")) return;

  const style = document.createElement("style");
  style.id = "ag-workflow-timer-styles";

  style.textContent = `
    .ag-workflow-timer {
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      min-height: ${DISPLAY_HEIGHT}px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px 14px;
      overflow: hidden;
      border: 1px solid ${COLORS.border};
      border-radius: 12px;
      background: ${COLORS.background};
      pointer-events: none;
      user-select: none;
    }

    .ag-workflow-timer-inner {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      min-width: 0;
    }

    .ag-workflow-timer-led {
      display: inline-block;
      flex: 0 0 11px;
      width: 11px;
      height: 11px;
      box-sizing: border-box;
      border: 2px solid ${COLORS.idle};
      border-radius: 2px;
      background: transparent;
      transform-origin: center center;
      transform: rotate(0deg);
    }

    .ag-workflow-timer-led.running {
      border-color: ${COLORS.running};
      animation: ag-workflow-timer-rotate 1.2s linear infinite;
      will-change: transform;
    }

    .ag-workflow-timer-led.done {
      border-color: ${COLORS.text};
      animation: none;
      transform: rotate(0deg);
    }

    .ag-workflow-timer-led.error,
    .ag-workflow-timer-led.interrupted {
      border-color: ${COLORS.failed};
      animation: none;
      transform: rotate(0deg);
    }

    @keyframes ag-workflow-timer-rotate {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    .ag-workflow-timer-digits {
      overflow: hidden;
      color: ${COLORS.idle};
      font: 700 24px/1 ${FONT};
      font-variant-numeric: tabular-nums;
      letter-spacing: .015em;
      white-space: nowrap;
    }

    .ag-workflow-timer-digits[data-status="running"] {
      color: ${COLORS.running};
    }

    .ag-workflow-timer-digits[data-status="done"] {
      color: ${COLORS.text};
      text-shadow: 0 0 10px #36e6d855;
    }

    .ag-workflow-timer-digits[data-status="error"],
    .ag-workflow-timer-digits[data-status="interrupted"] {
      color: ${COLORS.failed};
    }
  `;

  document.head.appendChild(style);
}

function createDisplay(state) {
  if (state.root) return;
  addStyles();

  const root = document.createElement("div");
  root.className = "ag-workflow-timer";
  root.dataset.status = "idle";

  const inner = document.createElement("div");
  inner.className = "ag-workflow-timer-inner";

  const led = document.createElement("span");
  led.className = "ag-workflow-timer-led";

  const digits = document.createElement("span");
  digits.className = "ag-workflow-timer-digits";
  digits.dataset.status = "idle";

  inner.append(led, digits);
  root.append(inner);

  state.root = root;
  state.led = led;
  state.digits = digits;

  const widget = state.node.addDOMWidget(WIDGET_NAME, "workflow_timer", root, {
    serialize: false,
    hideOnZoom: false,
  });

  widget.serialize = false;
  widget.computeSize = (width) => [
    Math.max(120, Number(width || state.node.size?.[0] || DEFAULT_WIDTH)),
    DISPLAY_HEIGHT + 16,
  ];

  render(state);
}

function chainCallback(target, name, callback) {
  const previous = target[name];
  target[name] = function (...args) {
    const result = previous?.apply(this, args);
    callback.apply(this, args);
    return result;
  };
}

function installNode(node) {
  if (node.__agWorkflowTimer) return node.__agWorkflowTimer;

  node.properties ??= {};

  const state = makeState(node);
  node.__agWorkflowTimer = state;
  createDisplay(state);
  attachExecutionListeners(state);
  return state;
}

app.registerExtension({
  name: "AxiomGraph.WorkflowTimer",

  beforeRegisterNodeDef(nodeType, nodeData) {
    if (nodeData?.name !== NODE_TYPE) return;

    chainCallback(nodeType.prototype, "onNodeCreated", function () {
      installNode(this);
    });

    chainCallback(nodeType.prototype, "onConfigure", function () {
      const state = installNode(this);
      if (!state.running) {
        state.history = readSavedHistory(this);
        state.elapsed = state.history[0] ?? 0;
        state.status = state.history.length ? "done" : "idle";
        render(state);
      }
    });

    chainCallback(nodeType.prototype, "getExtraMenuOptions", function (_canvas, options) {
      const state = this.__agWorkflowTimer;
      if (!state || !Array.isArray(options)) return;

      const recentRuns = state.history.map(formatTime);
      options.unshift(
        {
          content: recentRuns.length
            ? `Recent runs: ${recentRuns.join("  |  ")}`
            : "No completed runs yet",
          disabled: true,
        },
        {
          content: "Reset timer history",
          callback: () => {
            state.history = [];
            state.elapsed = 0;
            state.status = "idle";
            saveHistory(state);
            render(state);
          },
        },
        null,
      );
    });

    chainCallback(nodeType.prototype, "onRemoved", function () {
      const state = this.__agWorkflowTimer;
      if (!state) return;
      stopInterval(state);
      state.abortController.abort();
      this.__agWorkflowTimer = null;
    });
  },
});