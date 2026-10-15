# UML diagrams

Use case, class, sequence, and collaboration diagrams for Butch AI as built in sprint 1. The
diagrams are Mermaid, so GitHub renders them in place. For slides, paste a block into
[mermaid.live](https://mermaid.live) and export PNG or SVG.

Rendered PNGs for the slide deck are in `docs/sprint-1/uml/` (made with mermaid-cli; regenerate them
after editing a diagram).

The prose version of the main flow is in [ARCHITECTURE.md §2](../ARCHITECTURE.md), "Follow one
question end to end". Class names below match the code in `server/src/` and `client/src/`.

## 1. Use case diagram

Actors: a **student** (current or prospective) using the chat, an **administrator** (sprint 3),
and two external systems the server depends on. Dotted arrows are `<<include>>` and `<<extend>>`
relationships; thick arrows show which use cases touch an external system.

```mermaid
flowchart LR
  student["🧑‍🎓 Student"]
  admin["🧑‍💼 Administrator<br/>(sprint 3)"]

  subgraph External systems
    deepseek[("DeepSeek API")]
    db[("PostgreSQL")]
  end

  subgraph Butch AI
    uc1([Ask a question])
    uc2([Use a quick prompt])
    uc3([Check live hours or a deadline])
    uc4([Receive a fallback with an office link])
    uc5([Rate a reply])
    uc6([Start a new conversation])
    uc7([Review conversation logs])
    uc8([Manage knowledge-base entries])
    uc9([Sign in with 2FA])
  end

  student --> uc1
  student --> uc2
  student --> uc5
  student --> uc6
  admin --> uc7
  admin --> uc8

  uc2 -.->|include| uc1
  uc1 -.->|include| uc3
  uc1 -.->|extend: low confidence| uc4
  uc7 -.->|include| uc9
  uc8 -.->|include| uc9

  uc1 ==>|phrase the answer| deepseek
  uc1 ==>|log the exchange| db
  uc5 ==>|save the rating| db
  uc7 ==> db
  uc8 ==> db
```

| Use case                               | Story        | Status                           |
| -------------------------------------- | ------------ | -------------------------------- |
| Ask a question                         | US-01, US-11 | Done                             |
| Use a quick prompt                     | US-05        | Done                             |
| Check live hours or a deadline         | US-03, US-04 | Done                             |
| Receive a fallback with an office link | US-02        | Done                             |
| Rate a reply                           | US-07        | Done                             |
| Start a new conversation               | US-10        | Done                             |
| Review conversation logs               | US-08        | Logging done; screen in sprint 3 |
| Manage knowledge-base entries          | US-09        | Sprint 3                         |
| Sign in with 2FA                       | US-17        | Sprint 3                         |

## 2. Class diagram

The server is organized around one service, `Butch`, that depends on two interfaces: a
`Responder` (who writes the words) and a `Store` (where chats are saved). Each interface has two
implementations, which is how the same code runs with or without an API key and with or without
Docker. Types in `@butch/shared` are the API contract both client and server import.

```mermaid
classDiagram
  direction TB

  class Butch {
    -options: ButchOptions
    +responderName: string
    +reply(question, history, now) Promise~ButchReply~
    -respond(input) Promise~ResponderResult~
    -fallback(question) ButchReply
  }

  class ButchReply {
    +text: string
    +kind: ReplyKind
    +sources: SourceLink[]
    +pose: ButchPose
    +entryIds: string[]
  }

  class Responder {
    <<interface>>
    +name: "deepseek" | "offline"
    +respond(input: ResponderInput) Promise~ResponderResult~
  }
  class DeepSeekResponder {
    -apiKey: string
    -model: string
    -timeoutMs: number
    -maxRetries: number
    +respond(input) Promise~ResponderResult~
    -post(body) Promise~ChatCompletion~
  }
  class OfflineResponder {
    +respond(input) Promise~ResponderResult~
  }
  class DeepSeekApiError {
    +status: number
  }

  class ResponderInput {
    +question: string
    +history: HistoryTurn[]
    +facts: GroundedFact[]
    +now: Date
  }
  class GroundedFact {
    +entry: KnowledgeEntry
    +score: number
    +liveStatus?: string
  }
  class KnowledgeEntry {
    +id: string
    +category: Category
    +title: string
    +content: string
    +keywords: string[]
    +links: SourceLink[]
    +lastVerified: string
    +hours?: WeeklyHours
    +date?: string
    +endDate?: string
  }

  class Store {
    <<interface>>
    +name: "memory" | "postgres"
    +listKnowledge() Promise~KnowledgeEntry[]~
    +createConversation() Promise~string~
    +conversationExists(id) Promise~boolean~
    +addMessage(message: NewMessage) Promise~StoredMessage~
    +getMessage(id) Promise~StoredMessage~
    +recentMessages(conversationId, limit) Promise~StoredMessage[]~
    +setRating(messageId, rating) Promise~void~
    +getRating(messageId) Promise~Rating~
    +close() Promise~void~
  }
  class MemoryStore
  class PrismaStore {
    +checkConnection() Promise~void~
  }
  class StoredMessage {
    +id: string
    +conversationId: string
    +role: "user" | "butch"
    +text: string
    +kind?: ReplyKind
    +entryIds?: string[]
    +createdAt: Date
  }

  class OfficesFile {
    +general: Office
    +offices: Office[]
  }
  class Office {
    +id: string
    +name: string
    +helpsWith: string
    +keywords: string[]
    +link: SourceLink
  }

  Responder <|.. DeepSeekResponder
  Responder <|.. OfflineResponder
  DeepSeekResponder ..> DeepSeekApiError : throws
  Store <|.. MemoryStore
  Store <|.. PrismaStore

  Butch o-- Responder : responder
  Butch o-- Responder : backupResponder
  Butch o-- Store
  Butch o-- OfficesFile
  Butch ..> ButchReply : returns
  Butch ..> ResponderInput : builds
  ResponderInput *-- GroundedFact
  GroundedFact --> KnowledgeEntry
  Store ..> StoredMessage
  Store ..> KnowledgeEntry
  OfficesFile *-- Office
```

Client side, the shape is smaller: the `App` component owns one `useChat` hook, which holds the
message list and talks to the server through the `ButchApi` interface.

```mermaid
classDiagram
  direction LR
  class App
  class useChat {
    +messages: ChatMessage[]
    +status: "idle" | "thinking"
    +send(text) Promise~boolean~
    +rate(messageId, rating) Promise~void~
    +reset() void
  }
  class useQuickPrompts {
    +prompts: QuickPrompt[]
  }
  class ButchApi {
    <<interface>>
    +chat(request: ChatRequest) Promise~ChatResponse~
    +sendFeedback(request: FeedbackRequest) Promise~FeedbackResponse~
    +quickPrompts() Promise~QuickPrompt[]~
  }
  class ChatMessage {
    +id: string
    +role: "user" | "butch"
    +text: string
    +kind?: string
    +sources?: SourceLink[]
    +pose?: ButchPose
    +serverId?: string
    +rating?: Rating
  }
  App --> useChat
  App --> useQuickPrompts
  useChat --> ButchApi
  useQuickPrompts --> ButchApi
  useChat *-- ChatMessage
  App --> Header
  App --> ChatWindow
  App --> QuickReplyBar
  App --> Composer
  App --> ButchStage
  ChatWindow --> MessageBubble
  ChatWindow --> TypingIndicator
  MessageBubble --> RatingButtons
  ButchStage --> MascotAvatar
```

## 3. Sequence diagram: asking a question

The happy path with the three branches the code takes: small talk, no confident match, and a
DeepSeek failure that falls back to the offline responder.

```mermaid
sequenceDiagram
  autonumber
  actor S as Student
  participant UI as React app<br/>(useChat)
  participant R as POST /api/chat<br/>(routes/chat.ts)
  participant ST as Store
  participant B as Butch<br/>(services/butch.ts)
  participant K as Knowledge<br/>(retrieval, liveStatus)
  participant D as DeepSeekResponder
  participant X as DeepSeek API
  participant O as OfflineResponder

  S->>UI: type question, press Enter
  UI->>UI: add user bubble, status = thinking
  UI->>R: { message, conversationId? }
  R->>R: validate (1 to 500 chars), rate limit
  R->>ST: conversationExists / createConversation
  R->>ST: recentMessages(conversationId, 6)
  R->>ST: addMessage(user)
  R->>B: reply(question, history, now)

  alt small talk ("hi", "thanks")
    B-->>R: canned reply, kind = answer
  else knowledge question
    B->>ST: listKnowledge()
    B->>K: search(entries, question) filtered by confidence threshold
    alt no match above threshold
      B->>B: buildFallback(question, offices)
      B-->>R: office link, kind = fallback, pose = shrug
    else matches found
      B->>K: liveStatus(entry, now) for each match
      B->>D: respond({ question, history, facts, now })
      D->>X: chat/completions (system prompt + facts)
      alt 200 OK
        X-->>D: completion
        D-->>B: { text, answered: true }
      else timeout, 429, or 5xx
        X-->>D: error
        D-->>B: throws DeepSeekApiError
        B->>O: respond(same input)
        O-->>B: { text in Butch's voice, answered: true }
      end
      B-->>R: text, sources, pose, entryIds, kind = answer
    end
  end

  R->>ST: addMessage(butch reply)
  R-->>UI: { conversationId, messageId, reply, kind, sources, pose }
  UI->>UI: add Butch bubble, set pose, status = idle
  UI-->>S: answer with source links and thumbs up/down
```

## 4. Collaboration diagram: asking a question

The same interaction as the sequence diagram, drawn as objects and numbered messages (UML calls
this a communication diagram). Numbers show order; `[cond]` marks a branch.

```mermaid
flowchart TB
  S(["🧑‍🎓 :Student"])
  UI[":useChat<br/>(React)"]
  R[":chatRouter"]
  ST[":Store<br/>(MemoryStore or PrismaStore)"]
  B[":Butch"]
  K[":retrieval / liveStatus"]
  D[":DeepSeekResponder"]
  X[["DeepSeek API"]]
  O[":OfflineResponder"]
  F[":fallback"]

  S -- "1: send(text)" --> UI
  UI -- "2: chat({message, conversationId})" --> R
  R -- "3: createConversation / recentMessages / addMessage(user)" --> ST
  R -- "4: reply(question, history, now)" --> B
  B -- "5: listKnowledge()" --> ST
  B -- "6: search(entries, question); liveStatus(entry, now)" --> K
  B -- "7: [matches] respond(input)" --> D
  D -- "8: POST chat/completions" --> X
  B -- "9: [DeepSeek failed] respond(input)" --> O
  B -- "10: [no match] buildFallback(question, offices)" --> F
  R -- "11: addMessage(butch)" --> ST
  R -- "12: ChatResponse" --> UI
  UI -- "13: render bubble, pose, sources" --> S
```

### Rating a reply (US-07)

```mermaid
flowchart LR
  S(["🧑‍🎓 :Student"])
  RB[":RatingButtons"]
  UI[":useChat"]
  R[":feedbackRouter"]
  ST[":Store"]

  S -- "1: click thumbs up" --> RB
  RB -- "2: rate(messageId, 'up')" --> UI
  UI -- "3: sendFeedback({messageId, rating})" --> R
  R -- "4: getMessage(messageId) [must be a Butch reply]" --> ST
  R -- "5: setRating(messageId, rating)" --> ST
  R -- "6: FeedbackResponse" --> UI
  UI -- "7: show the rating (rolled back on error)" --> S
```
