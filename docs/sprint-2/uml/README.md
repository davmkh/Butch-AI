# UML exports (Sprint 2)

The six sprint 2 diagrams, each as a PNG (documents, slides):

| Diagram               | Files               |
| --------------------- | ------------------- |
| Use case              | `use-case.png`      |
| Class diagram: client | `class-client.png`  |
| Class diagram: server | `class-server.png`  |
| Sequence              | `sequence.png`      |
| Collaboration         | `collaboration.png` |
| Deployment (new)      | `deployment.png`    |

They are described in [../UML.md](../UML.md). Do not edit the PNGs by hand: they are
generated from the scripts in [source/](source/). To change a diagram, edit its script and run

```bash
python docs/sprint-2/uml/source/build.py
```
