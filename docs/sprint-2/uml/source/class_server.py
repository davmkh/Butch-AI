"""Sprint 2 class diagram: the Express server (server/src) and the shared API types."""
from umlkit import Diagram

d = Diagram(2260, 1560)

# ---- panels -------------------------------------------------------------------------
d.panel(10, 10, 360, 590, "Startup (index.ts, config.ts)")
d.panel(10, 640, 360, 900, "Shared API types (shared/), used by client and server")
d.panel(390, 10, 510, 610, "Controllers: HTTP layer (app.ts, routes/)")
d.panel(390, 650, 510, 640, "Storage (store/)")
d.panel(930, 10, 630, 630, "Answer pipeline (services/)")
d.panel(930, 670, 630, 560, "Knowledge (knowledge/, lib/)")
d.panel(1590, 10, 660, 860, "Responders (responders/)")
d.panel(930, 1260, 630, 280, "PostgreSQL tables (prisma/schema.prisma)")

# ---- startup --------------------------------------------------------------------------
server = d.box(25, 40, "Server (index.ts)", "«entry point»", style="dark", w=330,
               attrs=["- config: Config", "- store: Store", "- butch: Butch, clientDir?: string"],
               ops=["- createStore(databaseUrl?, entries): Promise<Store>",
                    "- createResponder(config): Responder",
                    "- shutdown (SIGINT, SIGTERM): closes the store"])
loader = d.box(25, 214, "KnowledgeLoader", "«module»", w=330,
               attrs=["- DATA_DIR = server/data"],
               ops=["+ loadKnowledgeBase(): Promise<KnowledgeEntry[]>",
                    "+ loadOffices(): Promise<OfficesFile>",
                    "+ loadQuickPrompts(): Promise<QuickPrompt[]>"])
config = d.box(25, 358, "Config", "«value object»", w=330,
               attrs=["+ env: development | test | production", "+ port: number = 3001",
                      "+ clientOrigin: string", "+ rateLimitPerMinute: number = 20",
                      "+ databaseUrl?: string (required in production)",
                      "+ responder: deepseek | offline", "+ deepseek: { apiKey?, model }",
                      "+ confidenceThreshold: number = 0.6", "+ fakeNow?: Date",
                      "+ testHooks: boolean = false"],
               ops=["+ loadConfig(env): Config"])

# ---- controllers ----------------------------------------------------------------------
express = d.box(405, 40, "ExpressApp (app.ts)", "«front controller»", style="crimson", w=475,
                attrs=["- config: Config (env, clientOrigin, rate limit, testHooks)",
                       "- store: Store", "- butch: Butch", "- quickPrompts: QuickPrompt[]",
                       "- clock: () => Date, clientDir?: string (production)",
                       "- middleware: helmet, cors, rate limit, json (10 KB), trust proxy 2 (production)"],
                ops=["+ createApp(deps): Express (also serves clientDir)",
                     "+ GET /api/health(): { status, responder, storage }",
                     "+ GET /api/quick-prompts(): QuickPromptsResponse",
                     "- now(req): Date (the test header only if testHooks)",
                     "- errorHandler(err, req, res, next): void"])
chat = d.box(405, 295, "ChatController (routes/chat.ts)", "«controller»", style="crimson", w=475,
             attrs=["- store: Store", "- butch: Butch", "- now: (req) => Date",
                    "- limiter: 20 chat requests per minute per IP", "- HISTORY_MESSAGES = 6"],
             ops=["+ chatRouter(deps): Router", "+ POST /api/chat(body: ChatRequest): ChatResponse"])
feedback = d.box(405, 505, "FeedbackController (routes/feedback.ts)", "«controller»",
                 style="crimson", w=375,
                 attrs=["- store: Store"],
                 ops=["+ feedbackRouter(deps): Router",
                      "+ POST /api/feedback(body: FeedbackRequest): FeedbackResponse"])

# ---- answer pipeline -------------------------------------------------------------------
smalltalk = d.box(945, 40, "SmallTalk", "«module»", w=365,
                  attrs=["- CRISIS: RegExp (911, 988, CAPS)",
                         "- INTENTS: Intent[9] (two more than sprint 1)"],
                  ops=["+ smallTalk(message): SmallTalkReply | undefined",
                       "- clean(message): string"])
butch = d.box(945, 200, "Butch (services/butch.ts)", "«service»", style="dark", w=600,
              attrs=["- store: Store", "- offices: OfficesFile", "- responder: Responder",
                     "- backupResponder: Responder (offline)",
                     "- confidenceThreshold: number = 0.6", "- maxFacts: number = 3",
                     "- logger: Console"],
              ops=["+ responderName: deepseek | offline (get)",
                   "+ reply(question, history, now): Promise<ButchReply>",
                   "- respond(input): Promise<ResponderResult> (offline backup if the AI throws)",
                   "- answerWithoutFacts(question, history, now): Promise<ButchReply>   NEW",
                   "- fallback(question): ButchReply"])
reply = d.box(1040, 480, "ButchReply", "«value object»", w=190,
              attrs=["+ text: string", "+ kind: answer | fallback", "+ sources: SourceLink[0..3]",
                     "+ pose: ButchPose", "+ entryIds: string[]"])
fallback = d.box(1245, 480, "Fallback", "«module»", w=305,
                 ops=["+ buildFallback(question, offices): { text, sources }",
                      "+ pickOffice(question, offices): Office | undefined"])

# ---- responders -----------------------------------------------------------------------
resp_if = d.box(1610, 40, "Responder", "«interface»", style="iface", w=340,
                attrs=["+ name: deepseek | offline"],
                ops=["+ respond(input: ResponderInput): Promise<ResponderResult>"])
deepseek = d.box(1610, 190, "DeepSeekResponder", w=340,
                 attrs=["+ name = 'deepseek'", "- apiKey: string", "- model: string",
                        "- timeoutMs = 30000, maxRetries = 1", "- MAX_TOKENS = 4096",
                        "- system prompt = BUTCH_SYSTEM_PROMPT"],
                 ops=["+ respond(input): Promise<ResponderResult>",
                      "- post(body): Promise<ChatCompletion> (retry on 429 / 5xx)",
                      "+ buildPrompt(input): string (facts may be empty)"])
persona = d.box(1610, 405, "persona (persona.ts)", "«module»", w=340,
                attrs=["+ BUTCH_SYSTEM_PROMPT: string", "+ NO_ANSWER = 'NO_ANSWER'   NEW"])
offline = d.box(1610, 540, "OfflineResponder", w=340,
                attrs=["+ name = 'offline'"],
                ops=["+ respond(input): Promise<ResponderResult>",
                     "   no facts: answered = false   NEW", "- describe(fact): string"])
voice = d.box(1610, 690, "Voice (voice.ts)", "«module»", w=340,
              attrs=["- OPENERS, CLOSERS, GENTLE_CLOSERS", "- POSE_BY_CATEGORY"],
              ops=["+ poseFor(category): ButchPose", "+ inButchVoice(body, category, seed): string",
                   "+ pick(options, seed): T"])
r_result = d.box(1985, 40, "ResponderResult", "«value object»", w=250,
                 attrs=["+ text: string", "+ answered: boolean"])
r_input = d.box(1985, 150, "ResponderInput", "«value object»", w=250,
                attrs=["+ question: string", "+ history: HistoryTurn[]",
                       "+ facts: GroundedFact[0..3]", "   (empty when nothing matched)",
                       "+ now: Date"])
grounded = d.box(1985, 310, "GroundedFact", "«value object»", w=250,
                 attrs=["+ entry: KnowledgeEntry", "+ score: number (0 to 1)",
                        "+ liveStatus?: string"])
api_err = d.box(1985, 450, "DeepSeekApiError", "«exception»", w=250, attrs=["+ status: number"])

# ---- storage --------------------------------------------------------------------------
store_if = d.box(410, 680, "Store (store/types.ts)", "«interface»", style="iface", w=470,
                 attrs=["+ name: memory | postgres"],
                 ops=["+ listKnowledge(): Promise<KnowledgeEntry[]>",
                      "+ createConversation(): Promise<string>",
                      "+ conversationExists(id): Promise<boolean>",
                      "+ addMessage(message: NewMessage): Promise<StoredMessage>",
                      "+ getMessage(id): Promise<StoredMessage | undefined>",
                      "+ recentMessages(conversationId, limit): Promise<StoredMessage[]>",
                      "+ setRating(messageId, rating): Promise<void>",
                      "+ getRating(messageId): Promise<Rating | undefined>",
                      "+ close(): Promise<void>"])
memory = d.box(410, 930, "MemoryStore", w=235,
               attrs=["+ name = 'memory'", "- knowledge: KnowledgeEntry[]",
                      "- conversations: Set<string>", "- messages: Map<string, StoredMessage>",
                      "- ratings: Map<string, Rating>"],
               ops=["(implements every Store operation)"])
prisma = d.box(660, 930, "PrismaStore", w=225,
               attrs=["+ name = 'postgres'", "- prisma: PrismaClient (pg adapter)",
                      "- knowledge: KnowledgeEntry[]"],
               ops=["+ checkConnection(): Promise<void>", "(implements every Store operation)"])
stored = d.box(410, 1110, "StoredMessage", "«value object»", w=300,
               attrs=["+ id: uuid", "+ conversationId: uuid", "+ role: user | butch",
                      "+ text: string", "+ kind?: answer | fallback", "+ entryIds?: string[]",
                      "+ createdAt: Date"])

# ---- knowledge ------------------------------------------------------------------------
retrieval = d.box(945, 700, "Retrieval (retrieval.ts)", "«module»", w=325,
                  attrs=["- indexCache: WeakMap<entries, Index>", "- STOPWORDS, TIME_WORDS",
                         "- SYNONYM_GROUPS, WORD_FIXES (synonyms.ts)",
                         "- WEAK_MATCH_WEIGHT = 0.4", "- TYPO_MATCH_WEIGHT = 0.9"],
                  ops=["+ search(entries, question, opts): ScoredEntry[]",
                       "+ understand(question, vocabulary): QuestionWord[]",
                       "+ tokenize(text): string[]", "+ typoDistance(a, b, max): number"])
office = d.box(1290, 700, "Office", "«entity»", w=265,
               attrs=["+ id: string", "+ name: string", "+ helpsWith: string",
                      "+ keywords: string[]", "+ link: SourceLink"])
entry = d.box(945, 950, "KnowledgeEntry", "«entity»", w=325,
              attrs=["+ id: string", "+ category: Category (13 values)", "+ title: string",
                     "+ content: string", "+ keywords: string[]", "+ links: SourceLink[1..*]",
                     "+ lastVerified: date", "+ hours?: WeeklyHours", "+ date?: date",
                     "+ endDate?: date"])
live = d.box(1290, 910, "LiveStatus (liveStatus.ts)", "«module»", w=265,
             ops=["+ liveStatus(entry, now): string?", "+ describeHours(place, hours, now): string",
                  "+ describeDate(date, endDate?, now): string", "+ summarizeWeek(hours): string"])
pullman = d.box(1290, 1050, "PullmanTime (lib/)", "«utility»", w=265,
                attrs=["+ PULLMAN_TIME_ZONE = America/Los_Angeles"],
                ops=["+ pullmanClock(now): PullmanClock", "+ formatPullmanDateTime(now): string",
                     "+ daysBetween(fromIso, toIso): number", "+ formatMinutes(minutes): string"])

# ---- tables ---------------------------------------------------------------------------
t_conv = d.box(950, 1295, "conversations", "«table»", style="navy", w=150,
               attrs=["+ id: UUID [PK]", "+ created_at: timestamp"])
t_msg = d.box(1122, 1295, "messages", "«table»", style="navy", w=235,
              attrs=["+ id: UUID [PK]", "+ seq: serial", "+ conversation_id: UUID [FK]",
                     "+ role: user | butch", "+ text: text", "+ kind: answer | fallback",
                     "+ entry_ids: text[]", "+ created_at: timestamp"])
t_fb = d.box(1379, 1295, "feedback", "«table»", style="navy", w=172,
             attrs=["+ message_id: UUID [PK, FK]", "+ rating: up | down",
                    "+ created_at: timestamp", "+ updated_at: timestamp"])

# ---- shared types ---------------------------------------------------------------------
y = 670
shared = [
    ("ChatRequest", "«DTO»", ["+ message: string (1 to 500 chars)", "+ conversationId?: uuid"]),
    ("ChatResponse", "«DTO»", ["+ conversationId: uuid", "+ messageId: uuid", "+ reply: string",
                               "+ kind: ReplyKind", "+ sources: SourceLink[]", "+ pose: ButchPose"]),
    ("FeedbackRequest / FeedbackResponse", "«DTO»", ["+ messageId: uuid", "+ rating: Rating"]),
    ("QuickPrompt", "«DTO»", ["+ id: string", "+ prompt: string"]),
    ("QuickPromptsResponse / ApiError", "«DTO»", ["+ prompts: QuickPrompt[]", "+ error: string"]),
    ("SourceLink", "«DTO»", ["+ label: string", "+ url: string (https)"]),
    ("ReplyKind", "«enumeration»", ["answer", "fallback"]),
    ("Rating", "«enumeration»", ["up", "down"]),
    ("ButchPose", "«enumeration»", ["idle, wave, thinking,", "hype, point, flex,",
                                    "study, shrug, thumbsup"]),
]
for name, stereo, attrs in shared:
    n = d.box(25, y, name, stereo, attrs=attrs, w=330)
    y += n.h + 12

# ======================================================================================
# edges
# ======================================================================================
# startup
d.edge([server.r(60), express.l(60)], "dep")
d.label(388, 93, "«creates»", size=9)
d.edge([server.b(0.5), loader.t(0.5)], "dep")
d.label(215, 205, "loads data", size=10, anchor="start")
d.edge([loader.b(0.5), config.t(0.5)], "dep")
d.label(215, 349, "loadConfig()", size=10, anchor="start")

# controllers
d.edge([express.b(0.5), chat.t(0.5)], "comp")
d.label(650, 283, "mounts /api/chat", size=10, anchor="start")
d.edge([express.l(120), (397, express.y + 120), (397, feedback.y + 45), feedback.l(45)], "comp")
d.label(530, 497, "mounts /api/feedback", size=10, anchor="start")
d.edge([chat.r(82), butch.l(177)], "assoc")
d.label(910, 371, "reply()", size=10)
d.edge([(806, chat.y + chat.h), (806, store_if.y)], "assoc")
d.label(812, 575, "logs messages", size=10, anchor="start")
d.edge([(feedback.x + 190, feedback.y + feedback.h), (feedback.x + 190, store_if.y)], "assoc")
d.label(feedback.x + 196, 645, "setRating()", size=10, anchor="start")

# answer pipeline
d.edge([butch.t(0.15), (butch.x + 0.15 * butch.w, smalltalk.y + smalltalk.h)], "dep")
d.label(butch.x + 0.15 * butch.w + 8, 179, "step 0", size=10, anchor="start")
d.edge([(1140, butch.y + butch.h), (1140, reply.y)], "dep")
d.label(1148, 462, "«creates»", size=9, anchor="start")
d.edge([(1420, butch.y + butch.h), (1420, fallback.y)], "dep")
d.label(1412, 448, "step 2: no match and the AI", size=10, anchor="end")
d.label(1412, 460, "can't answer (or offline)", size=10, anchor="end")
d.edge([(983, butch.y + butch.h), (983, retrieval.y)], "dep")
d.label(990, 626, "step 1: search()", size=10, anchor="start")
d.edge([butch.l(210), (915, butch.y + 210), (915, store_if.y + 80), store_if.r(80)], "assoc")
d.label(915, 590, "listKnowledge()", size=10)

# butch -> responders / voice / live status through the gap between the panels
d.edge([butch.r(40), (1582, butch.y + 40), (1582, resp_if.y + 40), resp_if.l(40)], "assoc")
d.label(1566, 80, "respond()", size=10, anchor="end")
d.edge([butch.r(150), (1572, butch.y + 150), (1572, voice.y + 60), voice.l(60)], "dep")
d.label(1566, 592, "to Voice: poseFor()", size=10, anchor="end")
d.edge([butch.r(190), (1562, butch.y + 190), (1562, live.y + 50), live.r(50)], "dep")
d.label(1556, 626, "to LiveStatus: step 3", size=10, anchor="end")

# responders
d.edge([deepseek.t(0.3), resp_if.b(0.3)], "real")
d.edge([offline.l(20), (1598, offline.y + 20), (1598, resp_if.y + 65), resp_if.l(65)], "real")
d.edge([resp_if.r(50), r_result.l(50)], "dep")
d.label(1967, 84, "returns", size=9)
d.edge([resp_if.r(70), (1967, resp_if.y + 70), (1967, r_input.y + 40), r_input.l(40)], "dep")
d.label(1967, 66, "takes", size=9)
d.edge([r_input.b(0.5), grounded.t(0.5)], "agg")
d.label(r_input.cx + 6, 295, "facts 0..3", size=10, anchor="start")
d.edge([deepseek.r(165), (1967, deepseek.y + 165), (1967, api_err.y + 30), api_err.l(30)], "dep")
d.label(1962, 392, "throws", size=10, anchor="end")
d.edge([deepseek.b(0.5), persona.t(0.5)], "dep")
d.label(deepseek.cx + 8, 392, "uses", size=10, anchor="start")
d.edge([offline.b(0.5), voice.t(0.5)], "dep")
d.label(offline.cx + 8, 677, "inButchVoice()", size=10, anchor="start")

# storage
d.edge([memory.t(0.5), store_if.b(0.25)], "real")
d.edge([prisma.t(0.5), store_if.b(0.77)], "real")
d.edge([store_if.l(160), (398, store_if.y + 160), (398, stored.y + 70), stored.l(70)], "dep")
d.label(440, 1103, "returns", size=10, anchor="start")
d.edge([prisma.r(80), (915, prisma.y + 80), (915, 1400), (930, 1400)], "dep")
d.label(922, 1215, "Prisma ORM", size=10, anchor="start")

# knowledge
d.edge([retrieval.b(0.5), entry.t(0.5)], "dep")
d.label(retrieval.cx + 8, 935, "scores (ScoredEntry)", size=10, anchor="start")
d.edge([(1420, fallback.y + fallback.h), (1420, office.y)], "dep")
d.label(1428, 600, "picks", size=10, anchor="start")
d.edge([live.b(0.5), pullman.t(0.5)], "dep")
d.label(live.cx + 8, 1040, "uses", size=10, anchor="start")

# tables
d.edge([(t_conv.x + t_conv.w, t_conv.y + 60), (t_msg.x, t_msg.y + 60)], "line")
d.label(1111, 1349, "1", size=10)
d.label(1111, 1371, "0..*", size=10)
d.edge([(t_msg.x + t_msg.w, t_msg.y + 60), (t_fb.x, t_fb.y + 60)], "line")
d.label(1368, 1349, "1", size=10)
d.label(1368, 1371, "0..1", size=10)

# ---- sprint 2 note ----------------------------------------------------------------------
d.note(1590, 900, 600, [
    "What changed in sprint 2 (marked NEW in the boxes)",
    "- Butch.answerWithoutFacts(): when no fact scores 0.6 or more, DeepSeek answers",
    "  WSU questions from general knowledge (facts is empty), with no made-up dates.",
    "- NO_ANSWER: an off-topic question gets the office fallback instead.",
    "- OfflineResponder returns answered = false when facts is empty.",
    "- SmallTalk has 9 intents (it had 7).",
    "",
    "Corrected from the sprint 1 diagram after reading the code",
    "- DeepSeekResponder (sprint 1 said AIResponder); Config.deepseek (it said ai).",
    "- Added DeepSeekApiError, persona, createResponder, and the table note.",
    "",
    "Railway deploy (live; on feature/railway-deploy until it is merged):",
    "the API also serves client/dist, DATABASE_URL is required in production,",
    "and trust proxy is 2 because Railway adds two proxy hops.",
])

if __name__ == "__main__":
    import sys
    print(d.save(sys.argv[1] if len(sys.argv) > 1 else "out", "class-server"))
