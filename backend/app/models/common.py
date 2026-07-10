"""Shared enums and small value objects used across multiple schemas."""

from enum import Enum


class DiagramType(str, Enum):
    """Diagram families the UI already advertises (templates.tsx, workspace examples)."""

    FLOWCHART = "flowchart"
    UML_CLASS = "uml_class"
    ER_DIAGRAM = "er_diagram"
    CIRCUIT = "circuit_tikz"
    PGFPLOTS = "pgfplots"
    MIND_MAP = "mind_map"
    NETWORK = "network"
    GENERIC = "generic"


class ExportFormat(str, Enum):
    PDF = "pdf"
    PNG = "png"
    SVG = "svg"
    TEX = "tex"


class CompileStatus(str, Enum):
    SUCCESS = "success"
    FAILED = "failed"
    TIMEOUT = "timeout"
