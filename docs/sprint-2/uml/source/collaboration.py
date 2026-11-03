"""Sprint 2 collaboration (communication) diagram: asking a question.

Message numbers match the sequence diagram, so the two can be read side by side.
"""
from umlkit import Diagram

d = Diagram(1990, 1230)

d.panel(10, 10, 1540, 400, "Browser: React client (client/src)")
d.panel(10, 440, 1540, 770, "API server: Express (server/src)")
d.panel(1570, 440, 400, 770, "External")


def obj(x, y, name, stereo=None, style="plain-ink", w=190):
    return d.box(x, y, name, stereo, w=w, style=style, underline=True)


def lines_at(x, y, texts, size=10, anchor="middle"):
    for i, text in enumerate(texts):
        d.label(x, y + i * 13, text, size=size, anchor=anchor)


# ---- browser --------------------------------------------------------------------------
d.actor(60, 70, ":Student")
composer = obj(210, 100, ":Composer", w=170)
app = obj(500, 100, ":App", "«view controller»", style="crimson", w=200)
chat = obj(830, 100, ":useChat", "«client controller»", style="crimson", w=210)
api = obj(1260, 100, ":butchApi", "«gateway»", w=200)
qp = obj(500, 270, ":useQuickPrompts", w=200)
views = obj(830, 270, ":ChatWindow, :ButchStage", w=250)

d.edge([(78, 113), composer.l(0.5)], "line")
lines_at(144, 90, ["1: type a question,", "press Enter →"], anchor="middle")
d.edge([composer.r(0.5), app.l(0.5)], "line")
lines_at(440, 106, ["2: onSend(text) →"])
d.edge([app.b(0.5), qp.t(0.5)], "line")
lines_at(600, 236, ["3: remember(text) ↓"])
d.edge([app.r(0.5), chat.l(0.5)], "line")
lines_at(765, 106, ["4: send(text) →"])
d.edge([chat.r(0.5), api.l(0.5)], "line")
lines_at(1150, 106, ["5: chat({ message, conversationId }) →"])
lines_at(1150, 136, ["22: resolve ChatResponse ←"])
d.edge([chat.b(0.5), views.t(0.5)], "line")
lines_at(935, 232, ["23: setMessages(...), setStatus(idle):", "re-render ↓"])

# ---- API server -----------------------------------------------------------------------
express = obj(1255, 520, ":ExpressApp", "«front controller»", style="crimson", w=210)
ctl = obj(700, 520, ":ChatController", "«controller»", style="crimson", w=220)
store = obj(70, 520, ":PrismaStore", "«Store»", w=190)
butch = obj(700, 790, ":Butch", "«service»", style="dark", w=220)
small = obj(250, 800, ":SmallTalk", w=170)
resp = obj(1130, 790, ":Responder", "(DeepSeek or Offline)", w=240)
retr = obj(170, 1060, ":Retrieval", w=170)
live = obj(430, 1060, ":LiveStatus", w=170)
fb = obj(690, 1060, ":Fallback", w=170)
voice = obj(950, 1060, ":Voice", w=170)
llm = d.box(1620, 790, ":AI API", "(LLM provider: DeepSeek)", style="external", w=300,
            underline=True)

d.edge([api.b(0.5), express.t(0.5)], "line")
lines_at(1360, 450, ["6: POST /api/chat ↓", "21: 200 OK ChatResponse ↑"])
d.edge([express.l(0.5), ctl.r(0.5)], "line")
lines_at(1085, 531, ["7: route /api/chat ←"])
d.edge([ctl.t(0.25), (ctl.x + 0.25 * ctl.w, 492), (ctl.x + 0.75 * ctl.w, 492), ctl.t(0.75)],
       "assoc")
d.label(ctl.cx, 484, "8: validate body (zod)", size=10)
d.edge([ctl.l(0.5), store.r(0.5)], "line")
lines_at(480, 465, ["9: conversationExists(id) or", "createConversation() ←",
                    "10: recentMessages(id, 6) ←", "11: addMessage(question) ←",
                    "20: addMessage(reply) ←"])
d.edge([ctl.b(0.5), butch.t(0.5)], "line")
lines_at(850, 700, ["12: reply(question,", "history, now) ↓"], anchor="start")
d.edge([butch.l(0.5), small.r(0.5)], "line")
lines_at(560, 800, ["13: smallTalk(question) ←"])
d.edge([store.b(0.5), butch.l(0.2)], "line")
lines_at(330, 690, ["14: listKnowledge() ↘"])
d.edge([butch.b(0.2), retr.t(0.5)], "line")
lines_at(340, 955, ["15: search(entries, question,", "{ limit: 3, today }) ↙"])
d.edge([butch.b(0.35), live.t(0.5)], "line")
lines_at(585, 985, ["16: liveStatus(entry, now)", "(once per fact) ↓"])
d.edge([butch.b(0.65), fb.t(0.5)], "line")
lines_at(800, 985, ["fallback(question) ↓", "(no match and the AI", "can't answer, or offline)"])
d.edge([butch.b(0.9), voice.t(0.5)], "line")
lines_at(1010, 985, ["18: poseFor(category) ↘"])

d.edge([(butch.x + 0.7 * butch.w, butch.y), (butch.x + 0.7 * butch.w, butch.y - 22),
        (butch.x + 0.95 * butch.w, butch.y - 22), (butch.x + 0.95 * butch.w, butch.y)], "assoc")
d.label(butch.x + 0.82 * butch.w, butch.y - 30, "19: answerWithoutFacts()  NEW", size=10)
d.edge([butch.r(0.5), resp.l(0.5)], "line")
lines_at(1075, 764, ["17: respond({ question, history,", "facts, now }) →"])
lines_at(1020, 838, ["19.1: respond({ ..., facts: [] }) →  NEW", "{ text, answered } ←"])
d.edge([resp.r(0.5), llm.l(0.5)], "line")
lines_at(1495, 780, ["17.1: send prompt (4096 max) →"])
lines_at(1495, 834, ["19.2: send prompt (no facts) →  NEW"])

d.note(1180, 1040, 340, ["New in sprint 2",
                         "19: answerWithoutFacts() when no fact scores 0.6 or more.",
                         "19.1 and 19.2: the AI answers from general WSU knowledge,",
                         "or says NO_ANSWER and Butch falls back.",
                         "Messages 24 to 29 (rating) are in the sequence diagram."])

if __name__ == "__main__":
    import sys
    print(d.save(sys.argv[1] if len(sys.argv) > 1 else "out", "collaboration"))
