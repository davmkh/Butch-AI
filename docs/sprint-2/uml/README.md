# UML exports (Sprint 2)

The six sprint 2 diagrams, each as a PNG (documents, slides) and an SVG (vector):

| Diagram               | Files                                    |
| --------------------- | ---------------------------------------- |
| Use case              | `use-case.png`, `use-case.svg`           |
| Class diagram: client | `class-client.png`, `class-client.svg`   |
| Class diagram: server | `class-server.png`, `class-server.svg`   |
| Sequence              | `sequence.png`, `sequence.svg`           |
| Collaboration         | `collaboration.png`, `collaboration.svg` |
| Deployment (new)      | `deployment.png`, `deployment.svg`       |

They are described in [../UML.md](../UML.md). Do not edit the PNGs or SVGs by hand: they are
generated from the scripts in [source/](source/). To change a diagram, edit its script and run

```bash
python docs/sprint-2/uml/source/build.py
```
