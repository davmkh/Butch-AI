"""Sequence diagram builder on top of umlkit.

Describe the interaction top to bottom: participants, messages, self messages, notes, and
combined fragments (alt / opt / loop / break). Positions are computed as you go.
"""
from umlkit import (CRIMSON, DARK, GRAY_FILL, INK, LINE, Diagram, _arrow_head, _text, _unit,
                    text_width)

HEADER_Y = 20
HEADER_H = 52


class Seq:
    def __init__(self, parts, spacing=138, left=95, title=None):
        """parts: list of (name, stereotype or None, style) with style crimson|dark|plain|ext|actor."""
        self.parts = parts
        self.x = [left + i * spacing for i in range(len(parts))]
        self.y = HEADER_Y + HEADER_H + 34
        self.spacing = spacing
        self.left = left
        self.title = title
        self.msgs, self.frames, self.notes, self.acts = [], [], [], {}
        self.act_list = []
        self._depth = 0

    # ---- building blocks ------------------------------------------------------------
    def idx(self, p):
        return p if isinstance(p, int) else [n for n, *_ in self.parts].index(p)

    def msg(self, a, b, text, kind="sync", step=28):
        self.msgs.append(("msg", self.idx(a), self.idx(b), text, kind, self.y))
        self.y += step

    def self_msg(self, a, text, step=40):
        self.msgs.append(("self", self.idx(a), text, self.y))
        self.y += step

    def note(self, a, b, lines, step=None):
        h = 10 + 13 * len(lines)
        self.notes.append((self.idx(a), self.idx(b), lines, self.y))
        self.y += step or (h + 22)

    def gap(self, h=10):
        self.y += h

    def begin(self, kind, guard, lo, hi):
        fid = len(self.frames)
        self.frames.append({"kind": kind, "lo": self.idx(lo), "hi": self.idx(hi), "y0": self.y,
                            "elses": [], "guard": guard, "depth": self._depth})
        self._depth += 1
        self.y += 36
        return fid

    def otherwise(self, fid, guard):
        self.frames[fid]["elses"].append((self.y, guard))
        self.y += 36

    def end(self, fid):
        self.frames[fid]["y1"] = self.y
        self._depth -= 1
        self.y += 16

    def act(self, p):
        a = len(self.act_list)
        self.act_list.append([self.idx(p), self.y - 10, None])
        return a

    def deact(self, a):
        self.act_list[a][2] = self.y - 14

    # ---- drawing ---------------------------------------------------------------------
    def build(self):
        height = int(self.y + 50)
        width = int(self.left + (len(self.parts) - 1) * self.spacing + 110)
        d = Diagram(width, height)

        # frames
        for f in self.frames:
            inset = f["depth"] * 8
            x0 = self.x[f["lo"]] - 62 + inset
            x1 = self.x[f["hi"]] + 62 - inset
            y0, y1 = f["y0"], f["y1"]
            d.edges.append(f'<rect x="{x0}" y="{y0}" width="{x1 - x0}" height="{y1 - y0}" '
                           f'fill="none" stroke="#6B6B6B" stroke-width="1.2"/>')
            tag_w = text_width(f["kind"], 11, True) + 16
            d.edges.append(f'<path d="M{x0} {y0} H{x0 + tag_w} V{y0 + 12} L{x0 + tag_w - 8} {y0 + 20} '
                           f'H{x0} Z" fill="#F0F0F0" stroke="#6B6B6B" stroke-width="1.1"/>')
            d.labels.append(_text(x0 + 6, y0 + 14, f["kind"], size=11, bold=True))
            d.labels.append(_text(x0 + tag_w + 10, y0 + 15, f"[{f['guard']}]", size=10,
                                  italic=True, halo=True))
            for ey, eg in f["elses"]:
                d.edges.append(f'<line x1="{x0}" y1="{ey}" x2="{x1}" y2="{ey}" stroke="#6B6B6B" '
                               f'stroke-width="1.1" stroke-dasharray="7 4"/>')
                d.labels.append(_text(x0 + 10, ey + 15, f"[{eg}]", size=10, italic=True,
                                      halo=True))

        # lifelines
        bottom = height - 36
        for i, (name, stereo, style) in enumerate(self.parts):
            d.edges.append(f'<line x1="{self.x[i]}" y1="{HEADER_Y + HEADER_H}" x2="{self.x[i]}" '
                           f'y2="{bottom}" stroke="#8A8A8A" stroke-width="1" stroke-dasharray="5 4"/>')

        # activations
        for p, y0, y1 in self.act_list:
            y1 = y1 if y1 is not None else bottom
            d.edges.append(f'<rect x="{self.x[p] - 6}" y="{y0}" width="12" height="{y1 - y0}" '
                           f'fill="#F3D5DB" stroke="{LINE}" stroke-width="1"/>')

        # messages
        for m in self.msgs:
            if m[0] == "msg":
                _, a, b, text, kind, y = m
                xa, xb = self.x[a], self.x[b]
                dirn = 1 if xb > xa else -1
                sx, ex = xa + dirn * 6, xb - dirn * 6
                dash = ' stroke-dasharray="6 4"' if kind == "return" else ""
                d.edges.append(f'<line x1="{sx}" y1="{y}" x2="{ex}" y2="{y}" stroke="{LINE}" '
                               f'stroke-width="1.3"{dash}/>')
                head = "open" if kind == "return" else "filled"
                d.edges.append(_arrow_head((ex, y), (dirn, 0), head, length=10, half=4.5))
                d.labels.append(_text((sx + ex) / 2, y - 5, text, size=10, anchor="middle",
                                      halo=True))
            else:
                _, a, text, y = m
                x = self.x[a] + 6
                d.edges.append(f'<path d="M{x} {y} H{x + 34} V{y + 18} H{x + 2}" fill="none" '
                               f'stroke="{LINE}" stroke-width="1.3"/>')
                d.edges.append(_arrow_head((x + 2, y + 18), (-1, 0), "filled", length=10, half=4.5))
                d.labels.append(_text(x + 42, y + 8, text, size=10, anchor="start", halo=True))

        # notes
        for a, b, lines, y in self.notes:
            x0 = min(self.x[a], self.x[b]) - 10
            w = abs(self.x[b] - self.x[a]) + 20
            d.note(x0, y - 6, max(w, 160), lines)

        # headers
        for i, (name, stereo, style) in enumerate(self.parts):
            cx = self.x[i]
            if style == "actor":
                d.nodes.append(
                    f'<g stroke="{LINE}" stroke-width="1.5" fill="white"><circle cx="{cx}" cy="{HEADER_Y + 8}" r="8"/>'
                    f'<line x1="{cx}" y1="{HEADER_Y + 16}" x2="{cx}" y2="{HEADER_Y + 36}"/>'
                    f'<line x1="{cx - 13}" y1="{HEADER_Y + 24}" x2="{cx + 13}" y2="{HEADER_Y + 24}"/>'
                    f'<line x1="{cx}" y1="{HEADER_Y + 36}" x2="{cx - 10}" y2="{HEADER_Y + 52}"/>'
                    f'<line x1="{cx}" y1="{HEADER_Y + 36}" x2="{cx + 10}" y2="{HEADER_Y + 52}"/></g>')
                d.nodes.append(_text(cx, HEADER_Y + 66, name, size=11, bold=True, anchor="middle"))
                continue
            fill, txt = {"crimson": (CRIMSON, "#FFFFFF"), "dark": (DARK, "#FFFFFF"),
                         "ext": (GRAY_FILL, INK), "plain": ("#FFFFFF", INK)}[style]
            w = self.spacing - 14
            d.nodes.append(f'<rect x="{cx - w / 2}" y="{HEADER_Y}" width="{w}" height="{HEADER_H}" '
                           f'fill="{fill}" stroke="{LINE}" stroke-width="1.3"/>')
            lines = ([stereo] if stereo else []) + name.split("|")
            base = HEADER_Y + (HEADER_H - 14 * len(lines)) / 2 + 11
            for k, ln in enumerate(lines):
                is_stereo = stereo and k == 0
                d.nodes.append(_text(cx, base + k * 14, ln, size=10 if is_stereo else 11,
                                     bold=not is_stereo, fill=txt, anchor="middle"))
        return d
