"""Rebuild every sprint 2 UML diagram (SVG and PNG).

    python build.py              writes next to this folder (docs/sprint-2/uml/)
    python build.py some/folder  writes somewhere else

Needs Python 3 and Google Chrome (the PNGs are Chrome screenshots of the SVGs). If Chrome is
not in its usual Windows folder, set CHROME_PATH to the chrome executable first.
"""
import importlib
import pathlib
import sys

here = pathlib.Path(__file__).resolve().parent
out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else here.parent
sys.path.insert(0, str(here))

DIAGRAMS = [
    ("usecase", "use-case"),
    ("class_client", "class-client"),
    ("class_server", "class-server"),
    ("collaboration", "collaboration"),
    ("sequence", "sequence"),
    ("deployment", "deployment"),
]

for module_name, file_name in DIAGRAMS:
    module = importlib.import_module(module_name)
    print(module.d.save(out, file_name))
