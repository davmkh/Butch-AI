"""Sprint 2 sequence diagram: asking a question and rating the reply."""
from seqkit import Seq

parts = [
    ("Student", None, "actor"),
    (":Composer", None, "plain"),
    (":App", "«view controller»", "crimson"),
    (":useChat", "«client controller»", "crimson"),
    (":butchApi", "«gateway»", "plain"),
    (":ExpressApp", "«front controller»", "crimson"),
    (":ChatController", "«controller»", "crimson"),
    (":FeedbackController", "«controller»", "crimson"),
    (":Store|(PrismaStore)", None, "plain"),
    (":Butch", "«service»", "dark"),
    (":SmallTalk", None, "plain"),
    (":Retrieval", None, "plain"),
    (":LiveStatus", None, "plain"),
    (":Responder|(DeepSeek or Offline)", None, "plain"),
    ("DeepSeek API|(LLM provider)", None, "ext"),
]
STU, COMP, APP, CHAT, API, EXP, CTL, FBK, STORE, BUTCH, SMALL, RETR, LIVE, RESP, LLM = range(15)

s = Seq(parts)

# ---- browser: the student asks --------------------------------------------------------
a_comp = s.act(COMP)
s.msg(STU, COMP, "1: type a question, press Enter")
a_app = s.act(APP)
s.msg(COMP, APP, "2: onSend(text)")
s.self_msg(APP, "3: remember(text) (useQuickPrompts)")
a_chat = s.act(CHAT)
s.msg(APP, CHAT, "4: send(text)")
s.self_msg(CHAT, "add the user bubble, status = thinking", step=34)
s.note(CHAT, API, ["Typing indicator shows; Butch switches", "to his thinking pose (FR-04, US-06)"])
a_api = s.act(API)
s.msg(CHAT, API, "5: chat({ message, conversationId })")

# ---- server: validate and log ---------------------------------------------------------
a_exp = s.act(EXP)
s.msg(API, EXP, "6: POST /api/chat")
s.self_msg(EXP, "helmet, CORS, rate limit, JSON (max 10 KB)", step=34)
a_ctl = s.act(CTL)
s.msg(EXP, CTL, "7: route /api/chat")
s.self_msg(CTL, "8: validate the body (zod) after the chat rate limit (20 per min)")
f = s.begin("break", "invalid body or too many requests", API, CTL)
s.msg(CTL, API, "400 or 429 { error }", "return")
s.end(f)
s.msg(CTL, STORE, "9: conversationExists(id) or createConversation()")
s.msg(STORE, CTL, "conversationId", "return")
s.msg(CTL, STORE, "10: recentMessages(id, 6)")
s.msg(STORE, CTL, "history (last 6 messages)", "return")
s.msg(CTL, STORE, "11: addMessage(question)  (FR-09 log)")
s.msg(STORE, CTL, "saved", "return")

# ---- the answer pipeline --------------------------------------------------------------
a_butch = s.act(BUTCH)
s.msg(CTL, BUTCH, "12: reply(question, history, now)")
s.msg(BUTCH, SMALL, "13: smallTalk(question)")
s.msg(SMALL, BUTCH, "canned reply or undefined", "return")

f1 = s.begin("alt", "greeting, thanks, Go Cougs!, or crisis words", STORE, LLM)
s.self_msg(BUTCH, "use the canned reply (pose wave or hype; crisis: 911, 988, CAPS)")
s.otherwise(f1, "a real WSU question")
s.msg(BUTCH, STORE, "14: listKnowledge()")
s.msg(STORE, BUTCH, "knowledge entries", "return")
s.msg(BUTCH, RETR, "15: search(entries, question, { limit: 3, today })")
s.msg(RETR, BUTCH, "top matches; keep score 0.6 or more", "return")

f2 = s.begin("alt", "confident match", STORE, LLM)
f3 = s.begin("loop", "each matching fact (1 to 3)", BUTCH, LIVE)
s.msg(BUTCH, LIVE, "16: liveStatus(entry, now)")
s.msg(LIVE, BUTCH, "\"open right now...\" / \"3 days ago\"", "return")
s.end(f3)
a_resp = s.act(RESP)
s.msg(BUTCH, RESP, "17: respond({ question, history, facts, now })")
f4 = s.begin("opt", "DeepSeekResponder (API key set)", RESP, LLM)
s.msg(RESP, LLM, "17.1: send prompt (4096 max)")
s.msg(LLM, RESP, "text, or refusal", "return")
s.end(f4)
s.msg(RESP, BUTCH, "{ text, answered }", "return")
s.deact(a_resp)
f5 = s.begin("alt", "the responder threw (API down)", BUTCH, RESP)
s.self_msg(BUTCH, "retry with the backup responder (offline) (NFR-03)")
s.otherwise(f5, "answered = false (refusal or cut off)")
s.self_msg(BUTCH, "fallback(question): office link, pose shrug (FR-05)")
s.otherwise(f5, "answered")
s.self_msg(BUTCH, "18: poseFor(category); sources = up to 3 unique links")
s.end(f5)

s.otherwise(f2, "no confident match   NEW in sprint 2")
s.self_msg(BUTCH, "19: answerWithoutFacts(question, history, now)")
f6 = s.begin("alt", "the responder is offline", BUTCH, LLM)
s.self_msg(BUTCH, "fallback(question): office link, pose shrug")
s.otherwise(f6, "DeepSeekResponder")
a_resp2 = s.act(RESP)
s.msg(BUTCH, RESP, "19.1: respond({ question, history, facts: [], now })")
s.msg(RESP, LLM, "19.2: send prompt (no facts)")
s.msg(LLM, RESP, "text, or NO_ANSWER", "return")
s.msg(RESP, BUTCH, "{ text, answered }", "return")
s.deact(a_resp2)
f7 = s.begin("alt", "the API threw, or NO_ANSWER (answered = false)", BUTCH, RESP)
s.self_msg(BUTCH, "fallback(question): office link, pose shrug")
s.otherwise(f7, "answered")
s.self_msg(BUTCH, "kind = answer, pose = point, sources = office links")
s.end(f7)
s.end(f6)
s.end(f2)
s.end(f1)
s.msg(BUTCH, CTL, "ButchReply { text, kind, sources, pose, entryIds }", "return")
s.deact(a_butch)

# ---- back to the browser --------------------------------------------------------------
s.msg(CTL, STORE, "20: addMessage(reply)  (FR-09 log)")
s.msg(STORE, CTL, "messageId", "return")
s.msg(CTL, API, "21: 200 OK ChatResponse", "return")
s.deact(a_ctl)
s.deact(a_exp)
s.msg(API, CHAT, "22: resolve ChatResponse", "return")
s.deact(a_api)
s.self_msg(CHAT, "23: setMessages(...), setStatus(idle): re-render")
s.deact(a_chat)
s.deact(a_app)
s.deact(a_comp)
s.note(CHAT, API, ["Butch bubble appears with sources and thumbs;", "Butch acts out the pose"])

# ---- optional: rating ------------------------------------------------------------------
f8 = s.begin("opt", "student rates the reply (US-07, FR-08)", STU, STORE)
a_chat2 = s.act(CHAT)
s.msg(STU, CHAT, "24: click thumbs up or down: rate(id, rating)")
s.self_msg(CHAT, "show the rating right away (optimistic)", step=34)
s.msg(CHAT, API, "25: sendFeedback({ messageId, rating })")
s.msg(API, EXP, "26: POST /api/feedback")
s.msg(EXP, FBK, "27: route /api/feedback")
s.msg(FBK, STORE, "28: getMessage(id)")
s.msg(STORE, FBK, "message", "return")
f9 = s.begin("alt", "not one of Butch's replies", API, STORE)
s.msg(FBK, API, "404 { error }", "return")
s.otherwise(f9, "reply found")
s.msg(FBK, STORE, "29: setRating(id, rating): one rating per reply")
s.msg(STORE, FBK, "saved", "return")
s.msg(FBK, API, "200 { messageId, rating }", "return")
s.end(f9)
s.msg(API, CHAT, "FeedbackResponse (on error: undo the rating)", "return")
s.deact(a_chat2)
s.end(f8)

d = s.build()

if __name__ == "__main__":
    import sys
    print(d.save(sys.argv[1] if len(sys.argv) > 1 else "out", "sequence"))
