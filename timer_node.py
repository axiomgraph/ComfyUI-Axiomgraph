# SPDX-License-Identifier: GPL-3.0-or-later
"""A workflow-wide stopwatch node for ComfyUI.

The node has no inputs or outputs. Its frontend extension listens for
ComfyUI queue execution events and updates the readout independently of
the execution graph.
"""


class WorkflowTimer:
    CATEGORY = "axiomgraph/utilities/Monitoring"
    DESCRIPTION = (
        "Displays the elapsed time of the whole ComfyUI queue run. "
        "The timer listens to frontend execution events, so it does not "
        "need to be connected to the workflow. Completed run history is "
        "saved in the workflow. Right-click the node to view or reset it."
    )
    SEARCH_ALIASES = ["timer", "stopwatch", "elapsed", "run time", "benchmark"]

    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {}}

    RETURN_TYPES = ()
    FUNCTION = "noop"

    def noop(self):
        return ()


NODE_CLASS_MAPPINGS = {
    "AxiomGraph_WorkflowTimer": WorkflowTimer,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "AxiomGraph_WorkflowTimer": "Workflow Timer",
}
