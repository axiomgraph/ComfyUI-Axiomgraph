# SPDX-License-Identifier: GPL-3.0-or-later
"""ComfyUI Workflow Timer - GPL-3.0-or-later."""

from .timer_node import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS

WEB_DIRECTORY = "./js"

__all__ = [
    "NODE_CLASS_MAPPINGS",
    "NODE_DISPLAY_NAME_MAPPINGS",
    "WEB_DIRECTORY",
]
