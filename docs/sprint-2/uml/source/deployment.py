"""Sprint 2 deployment diagram (new in sprint 2): where Butch AI runs.

Solid borders work today (the Railway site is live). Dashed borders are details still to confirm
(T-40) or planned.
"""
from umlkit import Diagram

d = Diagram(1900, 1090)
WHITE = "#FFFFFF"


def art(x, y, name, stereo, attrs, w, style="plain-ink", dashed=False):
    return d.box(x, y, name, stereo, attrs=attrs, w=w, style=style, dashed=dashed)


# ---- the student's browser --------------------------------------------------------------
d.panel(20, 140, 340, 190, "«device» Student's browser", fill=WHITE)
art(40, 185, "React app (client/dist)", "«artifact»",
    ["built by Vite (npm run build)", "calls /api on the page origin,", "or on VITE_API_URL"], 300)

# ---- Railway (in progress) -----------------------------------------------------------------
d.panel(430, 40, 790, 540, "«cloud» Railway project (live: butch-ai-production.up.railway.app)",
        fill="#FBF6F7")
d.panel(450, 80, 750, 270, "«execution environment» Web service (Node 24, npm start)", fill=WHITE)
express = art(470, 120, "Express API (server/src)", "«artifact»",
              ["serves /api/chat, /api/feedback,", "/api/quick-prompts, /api/health",
               "and the built client (express.static)", "trust proxy 2 (two Railway proxy hops)"], 320)
build = art(810, 120, "React build (client/dist)", "«artifact»",
            ["built by npm run build", "served by the Express API: one URL for site and API"], 370)
art(810, 220, "Railway variables", "«configuration»",
    ["NODE_ENV=production, CLIENT_ORIGIN, DATABASE_URL", "DEEPSEEK_API_KEY, DEEPSEEK_MODEL",
     "DATABASE_URL is required in production"], 370, style="iface")

d.panel(450, 390, 750, 170, "«database» Railway PostgreSQL", fill=WHITE)
schema = art(470, 430, "Tables (prisma/schema.prisma)", "«schema»",
             ["conversations, messages, feedback", "created by: npm run db:deploy -w server"], 330,
             style="navy")
art(830, 430, "DATABASE_URL", "«connection»",
    ["set as a Railway variable", "private versus public URL: to confirm", "(hygiene: T-40)"], 350,
    style="iface", dashed=True)

# ---- DeepSeek ---------------------------------------------------------------------------
d.panel(1330, 120, 540, 200, "«cloud» DeepSeek API (api.deepseek.com)", fill=WHITE)
art(1350, 165, "Chat completions", "«service»",
    ["model: deepseek-flash", "key kept in a Railway variable (T-07)",
     "paid per request: keep the balance small"], 500, style="external")

# ---- developer laptop ---------------------------------------------------------------------
d.panel(20, 720, 860, 340, "«device» Developer laptop", fill=WHITE)
browser = art(40, 770, "Browser", "«device»", ["http://localhost:5173"], 190)
vite = art(260, 770, "Vite dev server :5173", "«process»", ["proxies /api to :3001"], 250)
local_api = art(540, 770, "Express API :3001", "«process»",
                ["npm run dev (node --watch)", "responder: DeepSeek or offline",
                 "storage: PostgreSQL or memory"], 320)
docker = art(540, 930, "Docker Desktop: PostgreSQL 17", "«container»",
             ["butch_ai on localhost:5432", "npm run db:up, then db:deploy"], 320)
d.note(40, 930, 470, ["US-20 (T-39): set DATABASE_URL to the hosted PostgreSQL",
                      "and Docker Desktop is not needed.",
                      "A developer's own DeepSeek key lives in server/.env (gitignored)."])

# ---- GitHub ----------------------------------------------------------------------------
d.panel(1010, 720, 880, 340, "«cloud» GitHub: davmkh/Butch-AI", fill=WHITE)
repo = art(1030, 770, "Repository", "«repository»",
           ["main and feature branches", "pull requests need 1 review (T-28)",
            "Sprint 2 milestone and issues"], 290)
ci = art(1390, 770, "GitHub Actions CI (ci.yml)", "«workflow»",
         ["Check: format, lint, typecheck, unit tests, build",
          "Database: tests on a PostgreSQL service container",
          "E2E: Playwright (Chromium), 22 scenarios"], 480)

# ---- connections ------------------------------------------------------------------------
d.edge([(360, 260), (450, 260)], "assoc")
d.label(405, 238, "HTTPS", size=10)
d.label(405, 251, "page + /api", size=9)

d.edge([(express.x + 160, express.y + express.h), (express.x + 160, schema.y)], "assoc")
d.label(express.x + 170, 374, "Prisma + pg over DATABASE_URL", size=10, anchor="start")

d.edge([(1200, 215), (1330, 215)], "assoc")
d.label(1265, 205, "HTTPS", size=10)
d.label(1265, 232, "DEEPSEEK_API_KEY", size=9)

d.edge([browser.r(0.5), vite.l(0.5)], "assoc")
d.edge([vite.r(0.5), local_api.l(0.5)], "assoc")
d.label(525, 762, "/api", size=10)
d.edge([(local_api.cx, local_api.y + local_api.h), (docker.cx, docker.y)], "assoc")
d.label(local_api.cx + 8, 905, "localhost:5432 (Prisma + pg)", size=10, anchor="start")

d.edge([(880, 860), (1010, 860)], "assoc")
d.label(945, 840, "git push,", size=10)
d.label(945, 853, "pull request", size=10)
d.edge([repo.r(0.5), ci.l(0.5)], "assoc")
d.label(1355, 806, "on every PR", size=10)

d.edge([(1110, 720), (1110, 580)], "assoc", dashed=True)
d.label(1120, 650, "deploys from GitHub", size=10, anchor="start")
d.label(1120, 663, "(trigger: to confirm)", size=10, anchor="start")

# legend
d.panel(1330, 350, 540, 62, fill=WHITE)
d.text(1344, 370, "Legend", size=11, bold=True)
d.edge([(1344, 392), (1384, 392)], "line")
d.text(1394, 396, "works today", size=10)
d.edge([(1500, 392), (1540, 392)], "line", dashed=True)
d.text(1550, 396, "to confirm or planned", size=10)

if __name__ == "__main__":
    import sys
    print(d.save(sys.argv[1] if len(sys.argv) > 1 else "out", "deployment"))
