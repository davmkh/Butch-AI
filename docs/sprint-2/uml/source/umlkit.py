"""A tiny UML drawing kit: boxes, panels, arrows, ellipses, notes -> SVG -> PNG.

No third-party packages. PNGs are rendered with the Chrome that is already installed
(headless screenshot), so a diagram is just a Python file that anyone can edit and re-run.

Layers are drawn in this order: panels, edges, nodes, labels, so lines run behind boxes and
labels stay readable.
"""
import html
import math
import os
import pathlib
import subprocess
import tempfile

FONT = "Arial, Helvetica, sans-serif"
CRIMSON = "#A60F2D"
DARK = "#4D4D4D"
NAVY = "#0B2A5B"
INK = "#222222"
LINE = "#3A3A3A"
PANEL_BG = "#F6F6F6"
PANEL_LINE = "#BDBDBD"
GRAY_FILL = "#ECECEC"
CHROME = os.environ.get("CHROME_PATH", r"C:\Program Files\Google\Chrome\Application\chrome.exe")


# --------------------------------------------------------------------------- text
def text_width(s, size, bold=False):
    """Approximate Arial text width in pixels (good enough to size boxes)."""
    total = 0.0
    for ch in s:
        if ch in "ijlft.,:;|!'()[]{}/\\-I\"`":
            total += 0.30
        elif ch == " ":
            total += 0.28
        elif ch in "mM":
            total += 0.84
        elif ch in "wW":
            total += 0.80
        elif ch in "@%":
            total += 0.90
        elif ch.isupper():
            total += 0.68
        elif ch.isdigit():
            total += 0.56
        else:
            total += 0.53
    return total * size * (1.07 if bold else 1.0)


def esc(s):
    return html.escape(str(s), quote=True)


def _text(x, y, s, size=11, fill=INK, anchor="start", bold=False, italic=False, underline=False,
          halo=False, extra=""):
    attrs = [f'x="{x:.1f}"', f'y="{y:.1f}"', f'font-size="{size}"', f'fill="{fill}"',
             f'text-anchor="{anchor}"', f'font-family="{FONT}"']
    if bold:
        attrs.append('font-weight="bold"')
    if italic:
        attrs.append('font-style="italic"')
    if underline:
        attrs.append('text-decoration="underline"')
    if halo:
        attrs.append('stroke="white" stroke-width="4" stroke-linejoin="round" paint-order="stroke"')
    return f'<text {" ".join(attrs)} {extra}>{esc(s)}</text>'


# --------------------------------------------------------------------------- nodes
class Node:
    def __init__(self, x, y, w, h):
        self.x, self.y, self.w, self.h = x, y, w, h

    @property
    def cx(self):
        return self.x + self.w / 2

    @property
    def cy(self):
        return self.y + self.h / 2

    def t(self, f=0.5):
        return (self.x + self.w * f if f <= 1 else self.x + f, self.y)

    def b(self, f=0.5):
        return (self.x + self.w * f if f <= 1 else self.x + f, self.y + self.h)

    def l(self, f=0.5):
        return (self.x, self.y + self.h * f if f <= 1 else self.y + f)

    def r(self, f=0.5):
        return (self.x + self.w, self.y + self.h * f if f <= 1 else self.y + f)


STYLES = {
    # name: (header fill, header text, stereotype text, body fill, border)
    "plain": ("#FFFFFF", INK, CRIMSON, "#FFFFFF", LINE),
    "crimson": (CRIMSON, "#FFFFFF", "#FFFFFF", "#FFFFFF", LINE),
    "dark": (DARK, "#FFFFFF", "#FFFFFF", "#FFFFFF", LINE),
    "navy": (NAVY, "#FFFFFF", "#FFFFFF", "#FFFFFF", LINE),
    "iface": (GRAY_FILL, INK, INK, "#FFFFFF", LINE),
    "external": (GRAY_FILL, INK, INK, GRAY_FILL, LINE),
    "plain-ink": ("#FFFFFF", INK, INK, "#FFFFFF", LINE),
}


class Diagram:
    def __init__(self, width, height, title=None):
        self.w, self.h = width, height
        self.panels, self.edges, self.nodes, self.labels = [], [], [], []
        if title:
            self.labels.append(_text(20, 28, title, size=16, bold=True, fill=CRIMSON))

    # ------------------------------------------------------------------ panels
    def panel(self, x, y, w, h, title=None, dashed=False, fill=PANEL_BG, title_fill=INK, title_right=False):
        dash = ' stroke-dasharray="7 5"' if dashed else ""
        self.panels.append(
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10" fill="{fill}" '
            f'stroke="{PANEL_LINE}" stroke-width="1.2"{dash}/>'
        )
        if title:
            self.panels.append(_text(x + w - 12 if title_right else x + 12, y + 20, title, size=12, bold=True, fill=title_fill, anchor="end" if title_right else "start"))
        return Node(x, y, w, h)

    def boundary(self, x, y, w, h, title=None, stroke=DARK):
        """A white system boundary drawn behind all edges and nodes."""
        self.panels.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#FFFFFF" '
                           f'stroke="{stroke}" stroke-width="1.8"/>')
        if title:
            self.panels.append(_text(x + w / 2, y + 30, title, size=17, bold=True,
                                     anchor="middle", fill=stroke))
        return Node(x, y, w, h)

    # ------------------------------------------------------------------ class boxes
    def box(self, x, y, name, stereo=None, attrs=(), ops=(), w=None, style="plain",
            italic=False, min_w=0, dashed=False, row=15, underline=False, note=None):
        hdr_fill, hdr_txt, st_txt, body_fill, border = STYLES[style]
        lines = [(a, False) for a in attrs]
        op_lines = [(o, False) for o in ops]
        name_size, small = 13, 11
        content = [text_width(name, name_size, True)]
        if stereo:
            content.append(text_width(stereo, small))
        content += [text_width(a, small) for a in attrs]
        content += [text_width(o, small) for o in ops]
        width = w or max(min_w, max(content) + 22)
        header_h = 38 if stereo else 26
        attr_h = (len(lines) * row + 8) if lines else 0
        op_h = (len(op_lines) * row + 8) if op_lines else 0
        height = header_h + attr_h + op_h
        dash = ' stroke-dasharray="6 4"' if dashed else ""
        out = [
            f'<rect x="{x}" y="{y}" width="{width}" height="{height}" fill="{body_fill}" '
            f'stroke="{border}" stroke-width="1.3"{dash}/>',
            f'<rect x="{x}" y="{y}" width="{width}" height="{header_h}" fill="{hdr_fill}" '
            f'stroke="{border}" stroke-width="1.3"{dash}/>',
        ]
        cx = x + width / 2
        if stereo:
            out.append(_text(cx, y + 14, stereo, size=small, fill=st_txt, anchor="middle"))
            out.append(_text(cx, y + 31, name, size=name_size, fill=hdr_txt, anchor="middle",
                             bold=True, italic=italic, underline=underline))
        else:
            out.append(_text(cx, y + 18, name, size=name_size, fill=hdr_txt, anchor="middle",
                             bold=True, italic=italic, underline=underline))
        cy = y + header_h
        for i, (a, _) in enumerate(lines):
            out.append(_text(x + 9, cy + 15 + i * row - 1, a, size=small))
        cy += attr_h
        if op_lines:
            out.append(f'<line x1="{x}" y1="{cy}" x2="{x + width}" y2="{cy}" stroke="{border}" '
                       f'stroke-width="1"/>')
            for i, (o, _) in enumerate(op_lines):
                out.append(_text(x + 9, cy + 15 + i * row - 1, o, size=small))
        elif lines:
            pass
        if attrs and ops:
            out.append(f'<line x1="{x}" y1="{y + header_h + attr_h}" x2="{x + width}" '
                       f'y2="{y + header_h + attr_h}" stroke="{border}" stroke-width="1"/>')
        self.nodes.append("\n".join(out))
        return Node(x, y, width, height)

    # ------------------------------------------------------------------ misc nodes
    def note(self, x, y, w, lines, fill="#FFF8D6"):
        h = 12 + len(lines) * 14
        self.nodes.append(
            f'<path d="M{x} {y} H{x + w - 12} L{x + w} {y + 12} V{y + h} H{x} Z" fill="{fill}" '
            f'stroke="#B8A94A" stroke-width="1"/>'
            f'<path d="M{x + w - 12} {y} V{y + 12} H{x + w}" fill="none" stroke="#B8A94A"/>'
        )
        for i, ln in enumerate(lines):
            self.nodes.append(_text(x + 7, y + 17 + i * 14, ln, size=10, fill="#4A4320"))
        return Node(x, y, w, h)

    def rect(self, x, y, w, h, fill="#FFFFFF", stroke=LINE, dashed=False, rx=0, sw=1.3):
        dash = ' stroke-dasharray="6 4"' if dashed else ""
        self.nodes.append(
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" '
            f'stroke="{stroke}" stroke-width="{sw}"{dash}/>'
        )
        return Node(x, y, w, h)

    def ellipse(self, cx, cy, w, h, lines, fill="#FFFFFF", stroke=CRIMSON, text_fill=INK,
                dashed=False, bold_first=False, size=12):
        dash = ' stroke-dasharray="6 4"' if dashed else ""
        self.nodes.append(
            f'<ellipse cx="{cx}" cy="{cy}" rx="{w / 2}" ry="{h / 2}" fill="{fill}" '
            f'stroke="{stroke}" stroke-width="1.8"{dash}/>'
        )
        n = len(lines)
        for i, ln in enumerate(lines):
            y = cy + (i - (n - 1) / 2) * (size + 3) + size / 3
            self.nodes.append(_text(cx, y, ln, size=size, fill=text_fill, anchor="middle",
                                    bold=(bold_first and i == 0)))
        return Ellipse(cx, cy, w / 2, h / 2)

    def actor(self, x, y, name, scale=1.0, label_above=False):
        """Stick figure with its head at (x, y); the name goes below."""
        s = scale
        self.nodes.append(
            f'<g stroke="{LINE}" stroke-width="1.6" fill="white">'
            f'<circle cx="{x}" cy="{y + 10 * s}" r="{10 * s}"/>'
            f'<line x1="{x}" y1="{y + 20 * s}" x2="{x}" y2="{y + 52 * s}"/>'
            f'<line x1="{x - 18 * s}" y1="{y + 32 * s}" x2="{x + 18 * s}" y2="{y + 32 * s}"/>'
            f'<line x1="{x}" y1="{y + 52 * s}" x2="{x - 15 * s}" y2="{y + 76 * s}"/>'
            f'<line x1="{x}" y1="{y + 52 * s}" x2="{x + 15 * s}" y2="{y + 76 * s}"/></g>'
        )
        lines = name.split("\n")
        for i, ln in enumerate(lines):
            ty = (y - 10 * s - (len(lines) - 1 - i) * 14) if label_above else (y + 92 * s + i * 14)
            self.nodes.append(_text(x, ty, ln, size=12, bold=True, anchor="middle"))
        return Node(x - 20 * s, y, 40 * s, 76 * s)

    # ------------------------------------------------------------------ edges
    def edge(self, pts, kind="assoc", dashed=False, color=LINE, width=1.3, label=None):
        """kind: assoc | dep | real | gen | comp | agg | line | filled | open-start-diamond."""
        pts = [tuple(map(float, p)) for p in pts]
        start_shape = None
        end_shape = None
        if kind in ("assoc", "dep"):
            end_shape = "open"
        elif kind in ("real", "gen"):
            end_shape = "tri"
        elif kind == "comp":
            start_shape = "diamond-filled"
        elif kind == "comp-arrow":
            start_shape, end_shape = "diamond-filled", "open"
        elif kind == "agg":
            start_shape = "diamond-open"
        elif kind == "filled":
            end_shape = "filled"
        if kind in ("dep", "real"):
            dashed = True

        draw = list(pts)
        shapes = []
        if end_shape:
            d = _unit(draw[-2], draw[-1])
            if end_shape in ("tri", "filled"):
                shapes.append(_arrow_head(draw[-1], d, end_shape))
                draw[-1] = (draw[-1][0] - d[0] * 11, draw[-1][1] - d[1] * 11)
            else:
                shapes.append(_arrow_head(draw[-1], d, end_shape))
        if start_shape:
            d = _unit(draw[1], draw[0])
            shapes.append(_diamond(draw[0], d, start_shape == "diamond-filled"))
            draw[0] = (draw[0][0] - d[0] * 14, draw[0][1] - d[1] * 14)
        dash = ' stroke-dasharray="6 4"' if dashed else ""
        path = "M " + " L ".join(f"{px:.1f} {py:.1f}" for px, py in draw)
        self.edges.append(
            f'<path d="{path}" fill="none" stroke="{color}" stroke-width="{width}"{dash}/>'
            + "".join(shapes)
        )
        if label:
            text, seg, dx, dy = label
            ax, ay = pts[seg]
            bx, by = pts[seg + 1]
            self.label((ax + bx) / 2 + dx, (ay + by) / 2 + dy, text)

    def label(self, x, y, s, size=10, anchor="middle", fill="#333", bold=False, italic=False):
        self.labels.append(_text(x, y, s, size=size, fill=fill, anchor=anchor, bold=bold,
                                 italic=italic, halo=True))

    def text(self, x, y, s, **kw):
        self.labels.append(_text(x, y, s, **kw))

    # ------------------------------------------------------------------ output
    def svg(self):
        body = "\n".join(self.panels + self.edges + self.nodes + self.labels)
        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.w}" height="{self.h}" '
            f'viewBox="0 0 {self.w} {self.h}">\n'
            f'<rect width="100%" height="100%" fill="white"/>\n{body}\n</svg>\n'
        )

    def save(self, out_dir, name, scale=2):
        out_dir = pathlib.Path(out_dir)
        out_dir.mkdir(parents=True, exist_ok=True)
        svg_path = out_dir / f"{name}.svg"
        png_path = out_dir / f"{name}.png"
        svg_path.write_text(self.svg(), encoding="utf-8")
        render_png(svg_path, png_path, self.w, self.h, scale)
        return png_path


class Ellipse:
    def __init__(self, cx, cy, rx, ry):
        self.cx, self.cy, self.rx, self.ry = cx, cy, rx, ry

    def toward(self, target):
        """Point on the ellipse outline in the direction of `target`."""
        dx, dy = target[0] - self.cx, target[1] - self.cy
        if dx == 0 and dy == 0:
            return (self.cx, self.cy)
        k = 1 / math.sqrt((dx / self.rx) ** 2 + (dy / self.ry) ** 2)
        return (self.cx + dx * k, self.cy + dy * k)


# --------------------------------------------------------------------------- geometry
def _unit(a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    n = math.hypot(dx, dy) or 1
    return (dx / n, dy / n)


def _arrow_head(p, d, shape, length=11, half=5.5):
    nx, ny = -d[1], d[0]
    bx, by = p[0] - d[0] * length, p[1] - d[1] * length
    a = (bx + nx * half, by + ny * half)
    b = (bx - nx * half, by - ny * half)
    if shape == "open":
        return (f'<polyline points="{a[0]:.1f},{a[1]:.1f} {p[0]:.1f},{p[1]:.1f} {b[0]:.1f},{b[1]:.1f}" '
                f'fill="none" stroke="{LINE}" stroke-width="1.3"/>')
    fill = "white" if shape == "tri" else LINE
    return (f'<polygon points="{p[0]:.1f},{p[1]:.1f} {a[0]:.1f},{a[1]:.1f} {b[0]:.1f},{b[1]:.1f}" '
            f'fill="{fill}" stroke="{LINE}" stroke-width="1.3"/>')


def _diamond(p, d, filled, length=14, half=5.5):
    nx, ny = -d[1], d[0]
    mid = (p[0] - d[0] * length / 2, p[1] - d[1] * length / 2)
    tip = (p[0] - d[0] * length, p[1] - d[1] * length)
    a = (mid[0] + nx * half, mid[1] + ny * half)
    b = (mid[0] - nx * half, mid[1] - ny * half)
    pts = f"{p[0]:.1f},{p[1]:.1f} {a[0]:.1f},{a[1]:.1f} {tip[0]:.1f},{tip[1]:.1f} {b[0]:.1f},{b[1]:.1f}"
    return (f'<polygon points="{pts}" fill="{LINE if filled else "white"}" stroke="{LINE}" '
            f'stroke-width="1.3"/>')


def hv(a, b, first="h"):
    """Two-segment elbow from a to b."""
    return [a, (b[0], a[1]), b] if first == "h" else [a, (a[0], b[1]), b]


def hvh(a, b, mid_x):
    return [a, (mid_x, a[1]), (mid_x, b[1]), b]


def vhv(a, b, mid_y):
    return [a, (a[0], mid_y), (b[0], mid_y), b]


# --------------------------------------------------------------------------- rendering
def render_png(svg_path, png_path, width, height, scale=2):
    """Screenshot the SVG with headless Chrome at `scale`x resolution."""
    png_path = pathlib.Path(png_path).resolve()
    with tempfile.TemporaryDirectory() as profile:
        cmd = [
            CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-sandbox",
            f"--user-data-dir={profile}", f"--force-device-scale-factor={scale}",
            f"--window-size={width},{height}", f"--screenshot={png_path}",
            pathlib.Path(svg_path).resolve().as_uri(),
        ]
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if not pathlib.Path(png_path).exists():
        raise SystemExit(f"Chrome did not write {png_path}:\n{out.stderr[-600:]}")
