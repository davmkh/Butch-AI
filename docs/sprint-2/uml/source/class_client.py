"""Sprint 2 class diagram: the React client (client/src)."""
from umlkit import Diagram

d = Diagram(1910, 1110)

d.panel(720, 10, 620, 450, "State hooks (hooks/)")
d.panel(1360, 10, 530, 450, "API gateway (api/butchApi.ts)")
d.panel(10, 530, 1180, 570, "Views: React components (components/)", title_right=True)

# ---- App and the hooks -------------------------------------------------------------
app = d.box(300, 60, "App", "«view controller»", style="crimson", w=290,
            attrs=["- busy: boolean (status is thinking)",
                   "- pose: ButchPose (latest Butch reply's pose)"],
            ops=["+ ask(text): void (remember + send)", "+ render(): page layout"])

use_chat = d.box(735, 60, "useChat", "«client controller»", style="crimson", w=270,
                 attrs=["- messages: ChatMessage[] (state)", "- status: idle | thinking (state)",
                        "- conversationId?: string (ref)", "- generation: number (ref)",
                        "- inFlight: boolean (ref)"],
                 ops=["+ send(text): Promise<boolean>", "+ reset(): void",
                      "+ rate(messageId, rating): Promise<void>"])
chat_msg = d.box(1030, 60, "ChatMessage", "«view model»", w=300,
                 attrs=["+ id: string", "+ role: user | butch", "+ text: string",
                        "+ kind?: answer | fallback | greeting | error",
                        "+ sources?: SourceLink[]",
                        "+ serverId?: string (needed to rate)", "+ rating?: Rating",
                        "+ pose?: ButchPose"])
use_qp = d.box(735, 300, "useQuickPrompts", "«hook»", style="iface", w=270,
               attrs=["- sitePrompts: QuickPrompt[] (state)",
                      "- recentQuestions: string[] (localStorage, max 5)"],
               ops=["+ prompts: QuickPromptItem[] (derived)", "+ remember(question): void",
                    "- readRecent() / writeRecent(questions)"])
qp_item = d.box(1030, 300, "QuickPromptItem", "«view model»", w=300,
                attrs=["+ id: string", "+ prompt: string",
                       "+ recent: boolean (the user's own question)"])

# ---- API gateway --------------------------------------------------------------------
api_if = d.box(1375, 215, "ButchApi", "«interface»", style="iface", w=390,
               ops=["+ chat(request: ChatRequest): Promise<ChatResponse>",
                    "+ sendFeedback(request: FeedbackRequest): Promise<FeedbackResponse>",
                    "+ quickPrompts(): Promise<QuickPrompt[]>"])
gateway = d.box(1375, 355, "butchApi", "«gateway»", style="plain-ink", w=275,
                attrs=["- API_BASE = VITE_API_URL or page origin"],
                ops=["- request<T>(path, init): Promise<T>"])
api_err = d.box(1670, 355, "ApiRequestError", "«exception»", style="plain-ink", w=205,
                attrs=["+ status: number (0 = network failure)", "+ message: string"])
express = d.box(1370, 500, "Express API", "«component»", style="external", w=290,
                attrs=["(see the server class diagram)", "POST /api/chat", "POST /api/feedback",
                       "GET /api/quick-prompts"])

# ---- views --------------------------------------------------------------------------
Y1 = 570
x = 30
row1 = []
specs = [
    ("Header", ["+ mascotState: idle | thinking", "+ mascotPose: ButchPose",
                "+ onNewConversation()"], [], 190),
    ("ButchStage", ["+ pose: ButchPose", "+ busy: boolean", "+ replyKey: string"],
     ["- CAPTIONS: pose to shout"], 190),
    ("QuickReplyBar", ["+ prompts: QuickPromptItem[]", "+ onPick(prompt)", "+ busy: boolean"],
     [], 190),
    ("Composer", ["+ onSend(text)", "+ busy: boolean", "- text: string (state)"],
     ["- submit(): void", "- handleKeyDown(event): void (Enter sends)"], 235),
    ("ChatWindow", ["+ messages: ChatMessage[]", "+ status: idle | thinking",
                    "+ onRate(id, rating)"],
     ["- scrollToNewest(): void (useEffect)"], 235),
]
for name, attrs, ops, w in specs:
    n = d.box(x, Y1, name, "«component»", attrs=attrs, ops=ops, w=w)
    row1.append(n)
    x += w + 22
header, stage, quick, composer, window = row1

mascot = d.box(60, 800, "MascotAvatar", "«component»", w=250,
               attrs=["+ pose?: ButchPose", "+ state?: idle | thinking", "+ variant?: head | full",
                      "+ size?: sm | md | lg", "+ animated?: boolean", "+ talking?: boolean"],
               ops=["- LOOKS, ARMS, BODY_MOTION per pose"])
bubble = d.box(600, 800, "MessageBubble", "«component»", w=270,
               attrs=["+ message: ChatMessage", "+ onRate(id, rating)"],
               ops=["- SourceList(heading, sources)"])
typing = d.box(940, 800, "TypingIndicator", "«component»", w=230)
d.note(930, 880, 250, ["Shows MascotAvatar", "(state: thinking, size sm)"])
rating = d.box(600, 960, "RatingButtons", "«component»", w=270,
               attrs=["+ rating?: Rating", "+ onRate(rating)"])

# ---- edges: App -> hooks ------------------------------------------------------------
d.edge([app.r(40), use_chat.l(40)], "assoc")
d.label(660, 82, "messages, status,", size=10)
d.label(660, 94, "send(), reset(),", size=10)
d.label(660, 106, "rate()", size=10)
d.edge([app.r(100), (690, app.y + 100), (690, use_qp.y + 40), use_qp.l(40)], "assoc")
d.label(640, 330, "prompts,", size=10)
d.label(640, 342, "remember()", size=10)

# hooks -> models
d.edge([use_chat.r(40), chat_msg.l(40)], "comp")
d.label(1017, 92, "0..*", size=10)
d.edge([use_qp.r(35), qp_item.l(35)], "dep")
d.label(1017, 328, "«creates»", size=9)

# hooks -> ButchApi (through the gap between the two rows of boxes)
cx1 = use_chat.x + use_chat.w * 0.82
cx2 = use_qp.x + use_qp.w * 0.82
d.edge([(cx1, use_chat.y + use_chat.h), (cx1, 252), (api_if.x, 252)], "assoc")
d.label(1180, 246, "chat(), sendFeedback()", size=10)
d.edge([(cx2, use_qp.y), (cx2, 272), (api_if.x, 272)], "assoc")
d.label(1180, 288, "quickPrompts()", size=10)

# gateway
d.edge([gateway.t(0.35), api_if.b(0.35)], "real")
d.edge([gateway.r(40), api_err.l(40)], "dep")
d.label(1660, 372, "throws", size=10)
d.edge([gateway.b(0.5), express.t(0.5)], "dep")
d.label(1540, 475, "HTTP + JSON", size=10)

# ---- edges: App composes the five views (orthogonal bus lines) ------------------------
# Header goes left; the other four go right, so the smaller index gets the lower bus line.
starts = [330, 385, 430, 480, 535]
buses = [470, 502, 493, 484, 475]
for comp, sx, by in zip(row1, starts, buses):
    d.edge([(sx, app.y + app.h), (sx, by), (comp.cx, by), (comp.cx, comp.y)], "comp")

# ---- edges inside the views panel ---------------------------------------------------
d.edge([(header.x + 40, header.y + header.h), (header.x + 40, 760),
        (mascot.x + 60, 760), (mascot.x + 60, mascot.y)], "comp")
d.label(header.x + 5, 748, "head", size=10, anchor="start")
d.edge([(stage.x + 140, stage.y + stage.h), (stage.x + 140, 780),
        (mascot.x + 190, 780), (mascot.x + 190, mascot.y)], "comp")
d.label(stage.x + 148, 773, "full body", size=10, anchor="start")
d.edge([bubble.l(40), mascot.r(40)], "comp")
d.label((bubble.x + mascot.x + mascot.w) / 2, 827, "head, 1", size=10)
d.edge([(window.x + 60, window.y + window.h), (window.x + 60, 740),
        (bubble.x + 210, 740), (bubble.x + 210, bubble.y)], "comp")
d.label(bubble.x + 330, 733, "0..*", size=10)
d.edge([(window.x + 160, window.y + window.h), (window.x + 160, typing.y)], "comp")
d.label(window.x + 168, 780, "0..1 (while thinking)", size=10, anchor="start")
d.edge([(bubble.x + 135, bubble.y + bubble.h), (bubble.x + 135, rating.y)], "comp")
d.label(bubble.x + 143, 945, "0..1 (real replies)", size=10, anchor="start")

d.note(30, 1010, 340, ["Sprint 2: no client code changed since sprint 1.",
                       "Redrawn after reading client/src: TypingIndicator",
                       "and the empty chat state also render MascotAvatar."])

if __name__ == "__main__":
    import sys
    print(d.save(sys.argv[1] if len(sys.argv) > 1 else "out", "class-client"))
