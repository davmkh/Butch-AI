"""Sprint 2 use case diagram for Butch AI."""
from umlkit import CRIMSON, DARK, Diagram

d = Diagram(2000, 1130)

# System boundary
d.boundary(300, 10, 1460, 1100, "Butch AI Web App")

# ---- the central use case and its extensions ----------------------------------------
ASK = (900, 335)
ask = d.ellipse(*ASK, 390, 104, ["Ask Butch a question", "(US-01, FR-01, FR-02)"], fill=CRIMSON,
                stroke=CRIMSON, text_fill="#FFFFFF", bold_first=True, size=13)

TOP = 112
extensions = [
    ((500, TOP), ["Chat with Butch", "(hi, thanks, Go Cougs!)"], ["[message is small talk]"], False),
    ((840, TOP), ["Get crisis support", "(911, 988, CAPS line)"], ["[sounds like a crisis]"], False),
    ((1180, TOP), ["Get a link to the right", "WSU office (US-02, FR-05)"],
     ["[no fact scores 0.6 or more,", "and the AI can't answer]"], False),
    ((1520, TOP), ["Get a general WSU answer", "from the AI (T-47)", "new in sprint 2"],
     ["[no fact scores 0.6 or more,", "and the AI is on]"], False),
]
ext_ellipses = []
for (cx, cy), lines, guard, dashed in extensions:
    e = d.ellipse(cx, cy, 300, 84 if len(lines) == 2 else 96, lines, dashed=dashed)
    ext_ellipses.append(e)
    start = e.toward(ASK)
    end = ask.toward((cx, cy))
    d.edge([start, end], "dep")
    mx, my = (start[0] + end[0]) / 2, (start[1] + end[1]) / 2
    dx = {500: -68, 840: -68, 1180: -84, 1520: 76}[cx]
    d.label(mx + dx, my - 6, "«extend»", size=10)
    for i, g in enumerate(guard):
        d.label(mx + dx, my + 8 + i * 12, g, size=10, italic=True)

# specializations of Ask
check = d.ellipse(1400, 285, 300, 74, ["Check if a place is open", "(US-03)"])
deadline = d.ellipse(1400, 392, 300, 74, ["Find an academic deadline", "(US-04)"])
for e in (check, deadline):
    d.edge([e.toward(ASK), ask.toward((e.cx, e.cy))], "gen")

# FAQ prompt includes Ask
faq = d.ellipse(470, 335, 300, 76, ["Use an FAQ quick prompt", "(US-05)"])
d.edge([faq.toward(ASK), ask.toward((470, 335))], "dep")
d.label(665, 322, "«include»", size=10)

# ---- what every question includes ------------------------------------------------------
INC_Y = 590
includes = [
    (500, ["Find matching WSU facts", "(FR-03)"]),
    (830, ["See Butch act out the reply", "(US-06, FR-04)"]),
    (1160, ["Save the exchange", "anonymously (FR-09, US-08)"]),
    (1490, ["Write the reply in", "Butch's voice (T-03)"]),
]
inc_ellipses = []
for cx, lines in includes:
    e = d.ellipse(cx, INC_Y, 300, 78, lines)
    inc_ellipses.append(e)
    start = ask.toward((cx, INC_Y))
    end = e.toward(ASK)
    d.edge([start, end], "dep")
    mx, my = (start[0] + end[0]) / 2, (start[1] + end[1]) / 2
    d.label(mx + (-46 if cx < 900 else 46), my + 4, "«include»", size=10)
write = inc_ellipses[3]

# ---- the rest of the Student's use cases ------------------------------------------------
rate = d.ellipse(520, 790, 290, 76, ["Rate a response", "(US-07, FR-08)"])
newc = d.ellipse(520, 910, 290, 76, ["Start a new conversation", "(US-10, FR-06)"])
scroll = d.ellipse(520, 1030, 290, 76, ["Scroll back through", "the chat (FR-07)"])

# ---- developer use cases (sprint 2) ---------------------------------------------------
deploy = d.ellipse(1260, 810, 400, 118,
                   ["Deploy to Railway and run on a", "hosted PostgreSQL",
                    "(T-35, T-39, US-20)"], size=12)
logs = d.ellipse(1260, 985, 390, 84, ["Read saved chats in the", "database viewer (US-08)"])

# ---- actors ---------------------------------------------------------------------------
d.actor(150, 455, "Student", label_above=True)
d.actor(60, 720, "Prospective\nstudent", scale=0.9)
d.actor(165, 720, "Current\nstudent", scale=0.9)
d.edge([(60, 716), (140, 540)], "gen")
d.edge([(165, 716), (158, 540)], "gen")

hand = (168, 487)
for e in (faq, ask):
    d.edge([hand, e.toward(hand)], "line")
for e in (rate, newc, scroll):
    d.edge([hand, (e.cx - e.rx, e.cy)], "line")

d.nodes.append("")  # keep ordering explicit
ai = d.box(1805, 455, "AI API (DeepSeek)", stereo="«system»", style="external", w=170,
           min_w=170)
d.edge([ai.l(0.5), write.toward((ai.x, ai.cy))], "line")
d.label(1635, 478, "only if an AI API key is set", size=10, italic=True)
d.label(1635, 491, "(otherwise the offline responder)", size=10, italic=True)
# the AI also answers questions the knowledge base doesn't cover
gen_e = ext_ellipses[3]
d.edge([ai.t(0.3), gen_e.toward((ai.x + 50, ai.y))], "line")

d.actor(1880, 790, "Developer", scale=1.0)
dev_hand = (1862, 822)
d.edge([dev_hand, deploy.toward(dev_hand)], "line")
d.edge([dev_hand, logs.toward(dev_hand)], "line")

# legend
d.rect(20, 1010, 250, 66, fill="#FFFFFF", stroke="#BDBDBD", sw=1)
d.text(32, 1030, "Legend", size=11, bold=True)
d.nodes.append(f'<ellipse cx="52" cy="1052" rx="20" ry="10" fill="white" stroke="{CRIMSON}" '
               f'stroke-width="1.8"/>')
d.text(80, 1056, "built", size=11)

if __name__ == "__main__":
    import sys
    out = sys.argv[1] if len(sys.argv) > 1 else "out"
    print(d.save(out, "use-case"))
