/**
 * Английские переводы кейсов (overlay поверх data/projects.ts, по slug).
 * Заполняется постепенно. Чего здесь нет — на /en показывается по-русски
 * (безопасный фоллбэк). Структура повторяет поля Project, все опциональны;
 * массивы (sections/results/...) мёржатся по индексу в localizeProject().
 */
import type { ProjectEn } from "@/lib/localizeProject";

export const projectsEn: Record<string, ProjectEn> = {
  "mts-2024": {
    title: "Give MTS a voice and turn My MTS into a platform",
    company: "MTS",
    role: "Head of Design (B2C ecosystem)",
    roleShort: "Head of Design",
    period: "May 2024 — Jul 2025",
    description:
      "14 months at MTS leading design for the Digital Storefronts unit. The main focus was the voice ecosystem: over 2025 the team shipped four public launches. The last one, AI noise cancellation, MTS announced as a market first for mobile voice calls. In parallel we moved My MTS from a carrier app toward a platform that five separate businesses publish into, and embedded AI into the design team's daily work.",
    longDescription:
      "14 months at MTS as Head of Design for the Digital Storefronts unit (DSU). Six products under the unit and around 40 designers through leads and art directors. The main focus was the voice ecosystem at the intersection of AI and telecom, plus moving My MTS into a platform state where five separate businesses publish content on equal terms. Alongside that I set the team's operating rhythm — regular syncs with PMs, concept reviews, post-release metric reviews — and embedded AI into designers' routines. Details by section below.",
    results: [
      { value: "4", label: "public voice launches in 2025" },
      { value: "first", label: "AI noise cancellation in mobile voice" },
      { value: ">30", label: "products inside My MTS" },
    ],
    sections: [
      {
        title: "Entry point: My MTS mid-transformation",
        context:
          "In May 2024 I was brought into My MTS to build a transparent process for embedding products into the company's flagship B2C storefront. Five separate businesses — Fintech, LIVE, Telecom, KION, Shop — compete for entry points in a single app, and the teams need to know ahead of time who slots in where over the coming quarters, why, and how it won't break the logic of the next integrations. On top of that, raising the cross-functionality of the unit's own products.\n\nBy that point My MTS held tens of millions of MAU and millions of DAU, a product org of around 200 people, and more than 30 ecosystem products inside. By Markswebb's benchmark it ranked among the top ecosystem apps in Russia, alongside Sberbank Online.",
        approach:
          "The framing task: bring My MTS to the state of a flagship B2C ecosystem platform. The storefront stays central — it's the surface where the company assembles cross-product interaction across its whole ecosystem reach. Inside it, five separate businesses (Fintech, LIVE, Telecom, KION, Shop) embed by the same rules, with no historical priority for telecom as the \"landlord.\" In parallel I had to stand up a design function where there wasn't really one: voice, the family group with geo-search, savings, the unified complaints center. I came in thinking I'd have it figured out in six months; in reality the first months went to mapping the territory and the politics between businesses, not to design.\n\nI was hired for the \"team as a product\" angle: unit structure, team assessment, internal community, a public voice to the outside. On top of that I handled targeted hiring through my own network — people who had worked with me before or whom I knew from the industry. AI layered onto that foundation over the last two years.",
        callouts: [
          { value: "~200", label: "people in the My MTS org" },
          { value: ">30", label: "ecosystem products in the app" },
          { value: "5", label: "businesses on one storefront" },
        ],
      },
      {
        title: "The voice ecosystem — the main focus",
        context:
          "This was my main focus for all 14 months. The intersection of AI and telecom, and it hooked me from day one. Coming in, the team already had Raf (mid-level designer) and Zhenya Mukhurov (senior), but no art director and no clear design function. I hired Mark as art director for voice; later we added Alina from his previous team.",
        approach:
          "What mattered most in this period was rhythm. We met often as a whole team: design, PMs, engineering. We pitched new ideas, reviewed concepts and approaches, and after releases we looked at the metrics and talked through what worked and why. We built product interest across the whole team, not just the people drawing screens. Discovery for new products ran on open-data analysis and neural nets, without a classic UX panel — faster and cheaper, and we had an annual plan to hit.\n\nThen came the launches. Across 2024–2025 the team shipped eight public steps in the voice and anti-fraud ecosystem. From \"Zashchitnik\" (anti-spam with a voice bot) and a smart caller ID to AI noise cancellation, which MTS announced as a market first for mobile voice calls. Plus a separate track around \"I don't want to — or can't — take a voice call\": Call Recording, MTS Secretary, and \"Call to Chat,\" where the Secretary reads typed text aloud to the caller.",
        result:
          "By 2024–2025 the MTS voice ecosystem is no longer a single feature but a connected set: an anti-spam perimeter (Zashchitnik + smart caller ID + blocking for subscribers of other carriers), in-call anti-fraud (Safe Call), a pilot with Alice via the Yandex Station, call recording and transcription, a voice answering machine, and infrastructure-level AI noise cancellation. I personally kept a hand on every release, from concept to public launch.",
        timeline: [
          { date: "23.01.2024", title: "Zashchitnik", note: "Anti-spam app: forwarding to a voice bot and transcription" },
          { date: "20.08.2024", title: "Smart caller ID", note: "Big Data marks calls with three colors" },
          { date: "05.09.2024", title: "Voice via Yandex Station", note: "Pilot with the Yandex ecosystem" },
          { date: "16.10.2024", title: "Zashchitnik for other carriers", note: "Blocking + AI bot for non-MTS subscribers" },
          { date: "24.10.2024", title: "Safe Call", note: "AI warns about fraud during the call" },
          { date: "16.07.2025", title: "Call Recording", note: "Auto-recording and transcription of calls (beta)" },
          { date: "20.08.2025", title: "Call to Chat", note: "Secretary reads typed text to the caller" },
          { date: "08.10.2025", title: "MTS AI Secretary", note: "Voice answering machine with transcription and actions" },
          { date: "24.10.2025", title: "AI noise cancellation", note: "A market first for mobile voice" },
        ],
        heroes: [
          { alt: "MTS voice ecosystem — trio of products" },
          { alt: "Call Recording — poster" },
          { alt: "Voice via Yandex Station — poster" },
          { alt: "Call Recording — trio of screens" },
        ],
        screenshots: [
          { label: "CALL RECORDING — LANDING" },
          { label: "RECORDING — CONNECTED" },
          { label: "RECORDING — STATE 3" },
          { label: "CALL SUMMARY" },
          { label: "SUMMARY — VARIANT 2" },
        ],
        links: [
          { label: "AI noise cancellation — a market first for mobile voice (24.10.2025)" },
          { label: "MTS AI Secretary launch (08.10.2025)" },
          { label: "\"Call to Chat\" — Secretary reads out text (20.08.2025)" },
          { label: "\"Call Recording\" service (16.07.2025)" },
          { label: "\"Safe Call\" — AI fraud warning (24.10.2024)" },
          { label: "Zashchitnik for other carriers' subscribers (16.10.2024)" },
          { label: "Voice calls via Yandex Station (RBC)" },
          { label: "Smart caller ID (20.08.2024)" },
          { label: "\"Zashchitnik\" app launch (23.01.2024)" },
        ],
      },
      {
        title: "DSU: team and process",
        context:
          "Eight teams, six design leads, three art directors, 40+ designers. Plus researchers and communication designers in My MTS. On My MTS the art director is Katya Kurch — she holds her ground with confidence and doesn't need help there. With her I mostly worked on the seams between My MTS and the embedded products. On the other tracks it varied: some had a team but no art director, some not even a lead — so interviews and product work ran in parallel.",
        approach:
          "I introduced a 1-on-1 template with every designer: getting to know them, walking the competency map, syncs, growth goals. I used the same map for the quarterly team assessment — a growth plan for each person, not a one-off onboarding checkbox.\n\nThe internal community rested on design reviews inside teams — weekly, sometimes biweekly when there were no topics or people were swamped. Attendance was optional, but designers showed up on their own: they brought work before prod, picked up advice, borrowed ready solutions from neighbors, and told the design system what was missing. The lead ran the review; for me it was a litmus test of motivation, engagement, and way of thinking — the kind of thing no report shows.\n\nI launched a discovery process: the PM describes a feature with its corner cases, the designer builds a solution on top. We cleaned up the handoff to engineering. Before me, developers pulled mockups straight from drafts; now only from a prepared space. I didn't get budget for additional art directors, so some products — voice before Mark arrived, savings, the family group — I had to art-direct myself, right alongside the leads.",
        result:
          "It was a hard year: some tracks were winding down, hiring was limited. When products were shut down, I reassigned designers within the function to keep people inside the ecosystem.",
        callouts: [
          { value: "8", label: "teams in the unit" },
          { value: "40+", label: "designers" },
          { value: "6 + 3", label: "design leads and art directors" },
        ],
      },
      {
        title: "Cross-product integration in My MTS",
        context:
          "More than 30 ecosystem products are embedded in My MTS: some with full functionality, some partial. Every new service that wanted to embed dragged in its own UX and its own entry point, and the single flow fell apart. The transformation's main KPI, \"ecosystem engagement,\" was met above plan by the end of Q3 2024.",
        approach:
          "In practice I didn't build a parallel process of my own — I embedded design into the existing product framework. At the QBR we reconciled the five businesses' priorities against the actual plan; cross-cutting reviews surfaced decisions that broke neighbors; cross-team working groups sorted out specific integrations. My job was to seat design leads at each of these tables as equal participants, not as service staff, and to hold the single My MTS flow together on top of other teams' product decisions: unified navigation, aligned entry points, shared payment and notification flows. For cross-product launches we ran joint hackathons — that format came from me.\n\nWe moved the My MTS structure to a platform model: Product Teams, Business Teams (contributor businesses), Inner Source, QBR, Platform Team. A release every two weeks. Roughly a third of the backlog went to core-scenario improvements, the rest to new features and integrations. The agreements didn't always hold: some businesses renegotiated along the way, and we reworked part of the integrations a second time.",
        result:
          "A few specific stories that show the character of the effect. After the tariff catalog redesign, conversion to activation rose noticeably and support load dropped. Switching to a converged tariff went from hours to a minute. Quick Complaint rolled out to dozens of regions and cut response time by more than half. On the home screen, conversion of non-subscribers into telecom and MNP grew several times over. The shop.mts integration multiplied conversion into store search. Some of the exact conversions and metrics I can't publish under NDA — happy to walk through them in a conversation.",
        callouts: [
          { value: "hrs → min", label: "switch to a converged tariff" },
          { value: "×2+", label: "home conversion for non-subscribers" },
          { value: "×3+", label: "conversion into shop.mts from the app" },
          { value: ">30", label: "ecosystem products in My MTS" },
        ],
      },
      {
        title: "Family group and MTS.GeoSearch",
        context:
          "The family group service in My MTS: a shared profile, roles (adult, child, senior), location of loved ones, shared balance and packages. Earlier the unit had a version called \"Who's Where.\" During my period the team took the product to a socially significant partnership.",
        approach:
          "Together with the team we launched MTS.GeoSearch — a service for finding missing people by MTS geolocation, in a public partnership with LizaAlert. We split the family-group loop for everyday scenarios (parents see their kids, shared balance) from the GeoSearch loop for critical situations (data handover on a LizaAlert request). Privacy took work: at first the team wanted everything in one interface, but legal and ethical boundaries didn't allow it.",
        result:
          "MTS.GeoSearch launched on June 2, 2025. The family group keeps evolving: organizer profile, role model, geo-zones, shared payment.",
        heroes: [
          { alt: "Family group — poster" },
          { alt: "Family group — role selection" },
          { alt: "Family group — shared loop" },
          { alt: "MTS.GeoSearch — locations of loved ones" },
        ],
        screenshots: [
          { label: "FAMILY — ENTRY IN MY MTS" },
          { label: "FAMILY GROUP INTERFACE" },
          { label: "ORGANIZER PROFILE" },
          { label: "GEO-ZONES — EMPTY STATE" },
        ],
        links: [
          { label: "MTS.GeoSearch × LizaAlert — launch 02.06.2025 (Habr)" },
          { label: "Family group — MTS support" },
        ],
      },
      {
        title: "MTS Savings",
        context:
          "MTS's savings product, embedded in My MTS. Essentially an account earning yield off a line of digital bonds. We launched it during my period. The goal was simple: let the user save right inside the telecom app, with no banking interface and no five-minute forms.",
        approach:
          "**Onboarding in 30 seconds.** The application pulls through Gosuslugi — no forms, no passport scan, no waiting for approval. Open it, agree, start saving.\n\n**100 ₽ minimum.** One of the lowest thresholds on the savings-account market. Psychologically it's \"worth a try,\" not \"you need to accumulate capital.\"\n\n**Bank-grade yield, without a bank.** 16.5% annual at launch — on par with top bank savings accounts of that period. The product runs on MTS digital bonds: for the user it's the familiar savings-account mechanic, for the carrier it bypasses classic banking infrastructure.\n\n**UI without noise.** The home screen shows the large earnings figure, two actions (Withdraw and Top up), and a \"how much will I earn\" calculator. The calculator became the product's most visited screen: people opened it before even opening an account, playing with numbers and terms. That \"proxy page\" strongly lifted conversion from view to real top-up.",
        result:
          "The product stuck: after I left, Savings keeps growing and evolving and is among the top financial services in the My MTS ecosystem. The yield stays in the bank savings-account range, the account minimum is still 100 ₽ — meaning the base mechanic we set at launch held and wasn't rebuilt.",
        callouts: [
          { value: "16.5%", label: "yield at launch" },
          { value: "100 ₽", label: "account minimum" },
          { value: "Gosuslugi", label: "seamless onboarding" },
        ],
        heroes: [
          { alt: "MTS Savings — poster" },
        ],
        screenshots: [
          { label: "HOME — BALANCE AND YIELD" },
          { label: "YIELD CALCULATOR" },
          { label: "RATE 16.5%" },
          { label: "TOP-UP METHODS" },
        ],
      },
      {
        title: "AI in the DSU design process",
        context:
          "In 2024–2025 I steadily embedded AI tools into designers' routines. The stack came together like this: KREA.AI and Cinema 4D for illustration, Claude and Cursor for text and code, custom Figma plugins for pipeline tasks like naming, export, and asset conversion. Some of it landed easily, some grudgingly: senior designers first looked at it as a toy.",
        approach:
          "To keep it from staying a slogan, I led by example: I built the \"Convert\" plugin for the routine of preparing assets for content managers — designers used to spend 20–80 minutes per iteration, 4–6 times a month (renaming, converting to JPG/AVIF/WEBP, checking file weight, packing into a zip; plus naming errors and passing the buck), and after the plugin, 1–2 minutes. I showed the team how I did it and why — that's what got them going. We set up an internal sharing group: findings, tips, solution walkthroughs.\n\nFrom there vibe coding spread in a wave. Building on that, one of the designers — in 8 hours, with no coding background — used Cursor with Claude to build a prototype Cinema 4D plugin that generates system 3D icons in MTS brand style in a few clicks. The author framed the goal like this: simplify and speed up icon creation and make it accessible even to people who had never opened Cinema 4D, so that every icon comes out in one consistent style — the same lighting and materials, with no hand-tuning per scene.\n\nThe plugin is triggered with M + T: it loads a base scene with SVG icons already in place; the designer picks an icon, a material, a lighting type, and a rotation angle, sets the save path and file name, hits \"Render\" — and out comes a finished 3D icon in brand style. After that, assets for the home screen and banners were made in-house by the designers themselves, with nothing handed off to an outside agency. From there the team started spotting its own routines to automate.\n\nIn parallel I got into the A/B tests on the mts.ru home page: clean graphics versus graphics with captions. Captions gave a multiple lift in engagement, and the team had to be retrained on the new creative rules.",
        helped:
          "It was specifically a prototype, to validate the technology: can the pipeline \"SVG icon → 3D render in brand style\" be automated by a single designer at all. Confirmed: yes, and it's efficient. Next on the plan were expanding the library of materials and rotation angles, batch rendering whole sets, and hooking the plugin up locally — via a chatbot or straight from Figma — which we didn't get to.",
        result:
          "Iterating a single image dropped from 20 minutes to one. A noticeable share of communication-asset spend came back in-house. Over the quarter, dozens of routine tasks sped up several times over. An internal survey at the end of 2024 showed that half of DSU designers had already embedded AI into at least a few task types — that's tool adoption, not a one-off experiment.",
        callouts: [
          { value: "20 → 1", label: "minutes per image iteration" },
          { value: "8 h", label: "plugin prototype from scratch" },
          { value: "~50%", label: "of the team use AI across several tasks" },
          { value: "M + T", label: "plugin trigger hotkey" },
        ],
        heroes: [
          { alt: "AI in the DSU design process — poster" },
        ],
        screenshots: [
          { label: "CONVERT · DEMO", caption: "Convert — my first vibe-coded Figma plugin. It automates renaming to snake_case, JPG/AVIF/WEBP conversion, weight control, and packing. Before — 20–80 minutes by hand, after the plugin — 1–2 minutes. The vibe-coding wave in the team started with it." },
          { label: "C4D PLUGIN · INTERFACE", caption: "A designer's Cinema 4D plugin built with vibe coding (Cursor + Claude): pick an SVG icon, material, lighting type, and rotation angle, set a file name. Hit \"Render\" and out comes a 3D icon in brand style." },
        ],
      },
      {
        title: "Outside the team",
        context:
          "Beyond the work inside the DSU, I published and spoke — about how we set up the team, how we keep 150 people in sync, how we embed AI into the design process. That's the part of my job as a manager that does hiring without recruiters: after GPN and MTS, former colleagues regularly write to ask where I've landed, wanting to follow.",
      },
    ],
    links: [
      { category: "MTS Voice Ecosystem", label: "AI noise cancellation launch — a market first for mobile voice (24.10.2025)" },
      { category: "MTS Voice Ecosystem", label: "MTS AI Secretary launch (08.10.2025)" },
      { category: "MTS Voice Ecosystem", label: "\"Call Recording\" service launch (16.07.2025)" },
      { category: "MTS Voice Ecosystem", label: "Voice calls via Yandex Station (RBC)" },
      { category: "MTS Voice Ecosystem", label: "ComNews — how AI is transforming the MTS voice ecosystem" },
      { category: "Cross-product integration", label: "MTS.GeoSearch × LizaAlert — launch 02.06.2025 (Habr)" },
      { category: "Cross-product integration", label: "Family group — MTS support" },
      { category: "Design system", label: "MTS Design — design portal (Granat 2.0)" },
      { category: "Design system", label: "Public GRANAT UI Kit (since September 2024)" },
      { category: "Talks & interviews", label: "Interview with me — MTS Art Director" },
      { category: "Talks & interviews", label: "Earlier talk — \"Chapters, or how to sync 150 designers\"" },
    ],
  },
  "gazprom-neft": {
    title: "Build a design center and unfreeze the flagship",
    company: "Gazprom Neft",
    role: "Head of Design",
    period: "2022 — 2024",
    description:
      "Head of Design at Gazprom Neft, 2022–2024. Pulled 110 scattered designers into one function through 5 directors, unfroze the flagship ESO — a portal for 50K employees that had sat in mockups for two years (CX Awards 2024). Open-source DS Consta — 180+ of the company's products.",
    longDescription:
      "I joined Gazprom Neft in 2022 as Head of Design. Over two years I pulled ~110 scattered designers into a single maturity-level-3 function: shared processes, an open knowledge base, and design-as-a-service for the whole company.\n\nThe hardest task was the internal ESO portal for 50 thousand people, which had sat in mockups for two years. Two teams had tried to move it before me and both failed to reach agreement with the departments. I didn't break through right away either — the first 2 months hit a wall. Things moved once we changed how we framed the conversation and came in with numbers from UX research instead of an idea. The portal won CX Awards 2024 after I'd already left.",
    results: [
      { value: "CX 2024", label: "award for ESO" },
      { value: "180+", label: "products on Consta" },
      { value: "57", label: "projects a year" },
    ],
    sections: [
      {
        title: "Product design center — a system, not a team",
        context:
          "There were designers at GPN before me. What was missing was a shared process, a shared language, and places to exchange. They sat inside their departments, never crossed paths, and helping each other was awkward. In the first weeks I mapped the territory through the leads: who sits where, who reports to whom, who's working on what. The output was a table that turned out more accurate than most of the company's official documents.",
        approach:
          "**Map of people.** An assessment of every designer: which block they're in, what competencies, who needs support.\n\n**Matrix reporting.** 10 designers reporting to me directly. 5 department design directors functionally, each with about 30 people under them. Syncs with directors once a month and more often, plus shared syncs with departments on the roadmaps of major integrations.\n\n**Shared rituals.** A daily every 2 days, the lead's design review, team syncs, the competency map as the standard for the company's whole design function.\n\n**Design as a service.** Open consultations and 19–20 project reviews a year. We came away with a list of things to fix, not a release veto — otherwise they'd simply stop inviting us.\n\n**Systemic entry points.** An open Confluence with all the processes and Jira Sourcing as the official channel for requesting product design.\n\nNot everything took root equally: in some teams the dailies died off after six months because the leads found their own formats. That was fine — I stopped trying to hold everyone to the same measuring stick.\n\nOver two years it all came together into a working model — the one I get hired for on the next roles. I don't build a team in the moment, I build an environment: structure, assessment, an open community, a public voice. GPN is the most mature example of this setup: 110 people at maturity level 3, a legacy that doesn't depend on my presence.",
        result:
          "Over two years we moved the design center from level 2 to level 3 maturity. We pulled ~110 scattered designers into a single function through 5 design directors. Strategic products (ESO, Insight, Corporate Search, Era-Drilling, N1 Hub) we ran ourselves, without contractors.",
        callouts: [
          { value: "~110", label: "designers in the function" },
          { value: "5", label: "design directors (~30 people each)" },
          { value: "57", label: "projects a year" },
          { value: "level 3", label: "design center maturity" },
        ],
        screenshots: [
          { label: "Team at a demo", caption: "The product design team at a department demo. Zifergauz, St. Petersburg" },
          { label: "Team building", caption: "Team building with red clown noses. An internal tradition that became a team meme" },
          { label: "\"Design process\" talk", caption: "An internal talk on the design process — 7 stages from requirements analysis to delivery" },
          { label: "\"New concept\" talk", caption: "A co-authored talk with Svetlana Lyubavskaya on creating a new product concept" },
        ],
      },
      {
        title: "ESO — the flagship that hadn't moved for years",
        context:
          "The internal portal through which an employee files for vacation, a business trip, any request. Before us the company had 800+ scattered services; you couldn't file a simple request without a colleague's help. The two previous design teams stalled at the mockup stage, unable to reach agreement with the departments. I spent another six months walking into the same dead end and hitting the same wall.",
        approach:
          "We only moved once we changed the language of the conversation. We stopped coming with an idea and started coming with numbers. Before-and-after measurements from the UX research gave us those numbers; on top of that we secured the CEO's sign-off in a letter, lined up allies across departments, and held about a hundred respectful meetings with service owners.",
        helped:
          "We switched the framing from \"let's unify everything\" to \"here are the numbers, here's the payoff for your scenario.\" Before that, every attempt led with the idea and ran into defensiveness.",
        result:
          "Rolled out to 60+ GPN organizations: 50,000+ users, 550+ services in the catalog. By a conservative estimate — hundreds of millions of ₽ in time savings a year. Winner of CX Awards 2024 in the \"Treating staff as an internal client\" category. Both the rollout and the award came after I left. The negotiations and the design were on me; the release and support were carried over the line by the team.",
        callouts: [
          { value: "7 → 2", label: "minutes per request" },
          { value: "50K", label: "users" },
          { value: "75%", label: "satisfaction · CSI" },
          { value: "~500", label: "million ₽ saved a year" },
        ],
        links: [
          { label: "ESO card at CX Awards 2024 (RBC)" },
        ],
        heroes: [
          { alt: "ESO — poster with a 3D interface mock (generated)" },
        ],
        screenshots: [
          { label: "ESO — home", caption: "ESO — home: the employee's list of requests with status filters, \"Vacation soon\" and \"Start\" widgets on the right" },
          { label: "New request", caption: "ESO — creating a new request. A contextual hint with the rules for filing a 2-NDFL certificate" },
          { label: "Request card", caption: "ESO — request card SD-4252730: status, contact person, processing progress" },
        ],
      },
      {
        title: "Consta — the first industrial company's open-source DS",
        context:
          "I didn't create Consta — I came in as CPO to a DS that already existed. But it was the industry's first open design system from an industrial company, and my job was to bring it to production standard across GPN's products.",
        approach:
          "A team of 4. As the design system's CPO I held the priority backlog, the budget, and advocacy inside and outside the company. Aleksey Tityaev (art director reporting directly to me) ran the component side and the link with product teams. A staff developer owned releases, infrastructure, and support. A designer owned documentation and the Figma library. There was tension inside the team: I wanted to burn down the product teams' backlog faster, the developer wanted to stabilize the infrastructure. The balance didn't always hold, and some releases slipped.",
        result:
          "We cut designers' effort by about 40% and frontend developers' by 20%. Over the year: +12,000 npm downloads, +10,000 Figma Community downloads (we hit the trending top a few times), +1,000 uses by developers, 6,000+ organic site visitors, 70 releases, dark and light themes, 35 projects documented. In parallel we built Consta Analytics for small samples of 3–4 users, where classic A/B doesn't work.",
        callouts: [
          { value: "−40%", label: "designers' effort" },
          { value: "−20%", label: "frontend effort" },
          { value: "+10K", label: "Figma Community downloads" },
          { value: "180+", label: "products on the DS" },
        ],
        links: [
          { label: "consta.design — official site" },
          { label: "Consta on GitHub" },
          { label: "vc.ru article by GPN" },
        ],
        heroes: [
          { alt: "Consta — design system poster" },
        ],
        screenshots: [
          { label: "Quick Start", caption: "Consta — GPN's open-source design system. Free under MIT, shipped across any products: web, mobile, video walls" },
          { label: "Button variability", caption: "Buttons as an example of variability: 4 sizes, 3 shapes, 3 color accents, states — with no hard limits on combinations" },
          { label: "UserSelect", caption: "UserSelect — a dropdown of users with search and avatars. Docs and Storybook auto-update after a release on GitHub" },
          { label: "Dashboard · light theme", caption: "A driller's dashboard on Consta — light theme: production data, analytics, team" },
          { label: "Dashboard · dark theme", caption: "The same screen — dark theme. Switching out of the box, with no edits to mockups or code" },
          { label: "Charts", caption: "Consta Charts — a separate chart library (line, bar, bubble, relationship graphs). Compatible with Consta themes" },
        ],
      },
      {
        title: "Products on Consta — Jupiter and ERA Drilling",
        context:
          "Consta is a production DS; dozens of GPN's internal products run on it. Two telling ones here. ERA Drilling ran under Aleksey Tityaev's art direction. Jupiter was built by a team from another department that chose Consta as its standard. Different domains, different teams, one interface language.",
        result:
          "**ERA Drilling.** The Economic Calculation and Analytics model of a well bore. A single product lived at once across several very different contexts: the field in outdoor conditions, the R&D center, the control center, plus a separate scenario for geologists. Aleksey Tityaev ran the adaptivity across every screen. The field conditions took particular effort: sun, gloves, vibration — half of our web habits just didn't survive out there.\n\n**Jupiter — an example of Consta spreading into neighboring departments.** Corporate search and monitoring of GPN's IT infrastructure: search across the company's internal systems (BLPS, BRD, DRP, RCL, Linux), an event feed, infrastructure maps of SAP blocks. The team chose Consta as its standard on its own, with no involvement from me in the product decisions.",
        callouts: [
          { value: "82%", label: "CSI" },
          { value: "150", label: "Figma WAU" },
          { value: "450", label: "npm WAU" },
        ],
        screenshots: [
          { label: "Jupiter · home", caption: "Jupiter — home: search across GPN's internal systems and a change feed" },
          { label: "Jupiter · incidents", caption: "Jupiter — incident feed: priority, status, owner" },
          { label: "Jupiter · SAP map", caption: "Jupiter — infrastructure map of SAP blocks and related services" },
          { label: "Jupiter · search", caption: "Jupiter — advanced search with filters by system type and metrics" },
          { label: "ERA · empty state", caption: "ERA Drilling — the initial \"assembly not created\" state" },
          { label: "ERA · BHA assembly", caption: "ERA Drilling — BHA assembly with bit, motor, stabilizer" },
          { label: "ERA · bore projection", caption: "ERA Drilling — well bore projection with casing string" },
          { label: "ERA · well sections", caption: "ERA Drilling — well model: conductor pipe, surface casing, liner" },
        ],
      },
      {
        title: "HR brand through community",
        context:
          "A design function rests on people. Without an HR brand, neither hiring nor retention would have scaled for us.",
        approach:
          "I pushed on several channels at once: external talks, partnerships with universities and schools, an internal community, plus a couple of experimental plays like the access badges. Not all of them took off equally, but together they became the brand.",
        result:
          "**External talks.** 27+ over the year at 15+ events: Stachka (~20K), Design Weekend (~40K), PromTechDesign (240K online). Topics: Consta, the design process, neural nets, digital twins.\n\n**Partnerships with universities and schools.** Bang Bang Education, Young Design (a joint \"Interface\" category with a geomodeling module on Consta), the Stieglitz Academy. We supplied real tasks, and designers mentored students.\n\n**Internal community.** 6 meetups a year for the whole company, plus open online talks together with studios (Avito, Cian, and independents). Free access for all employees, not just designers: sharing experience outward, an inflow of interesting talent inward.\n\n**Standup hackathons for interns.** Over the year the team ran 36 product projects, and part of them went in a standup format: interns + designers + colleagues from other regions build a clickable prototype in 2–3 weeks. The standout was D-Outcrop, a prototype for an unmanned geological-survey service: we brought people in from Ufa and LPS and had a working prototype in 2–3 weeks. Two wins at once: a product, plus a venue where interns grew into designers on our team.\n\n**The badge story that spread on its own.** The idea struck me and Vika Kudryavtseva from the team at the same moment. We teamed up and saw it through. Over 1.5 years we printed 300+ personal access badges, and each one became an entry point into the design department. After I left, Vika vibe-coded a badge generator with ChatGPT and open-sourced it — the service lives on without me.",
        helped:
          "In the end I was building an environment, not a team. A designer with initiative could take it all the way to GitHub, and that infrastructure runs without my constant involvement.",
        callouts: [
          { value: "27+", label: "talks/year" },
          { value: "240K", label: "PromTechDesign online" },
          { value: "300+", label: "personal access badges" },
          { value: "3", label: "partner universities" },
        ],
        links: [
          { label: "Talk at World Usability Day" },
          { label: "Full talk with the Pinkman studio" },
          { label: "Young Design × GPN — the \"Interface\" category" },
          { label: "Vika's badge generator (open-source)" },
        ],
        screenshots: [
          { label: "Access badges · close-up", caption: "Finished personal access badges: Lepyokha, Kudryavtseva, Voronin, Shugaev, Kravchenko" },
          { label: "Vika and her badge", caption: "Vika Kudryavtseva — co-author of the badge story — with her own badge" },
          { label: "Template presentation", caption: "An internal presentation on the badge-sticker template. The room listens, the team's badge grid on screen" },
          { label: "UMBRELLA badge", caption: "My badge on an UMBRELLA CORPORATION lanyard — an internal team meme" },
          { label: "BARCAMP · speaker", caption: "Speaker at BARCAMP 20.35 — National Technology Revolution, St. Petersburg, November 7–8" },
          { label: "BARCAMP · panel", caption: "Panel discussion at BARCAMP 20.35 — product design in large industrial companies" },
          { label: "Meetup · COVID talk", caption: "An internal meetup at Zifergauz. Topic: the timeline of COVID-19 restrictions and the product team's response" },
          { label: "On-stage interview", caption: "A podcast interview on stage in front of a designer audience" },
          { label: "D-Outcrop · standup hackathon", caption: "D-Outcrop — a prototype for an unmanned geological-survey service. Built by interns with designers from Ufa and LPS in 2–3 weeks in a standup-hackathon format." },
        ],
      },
      {
        title: "Neural nets ahead of the market",
        context:
          "We launched a regular AI pipeline for illustration in Q1 2022 — six months to a year before generative models became a standard in design teams. Mostly concepts and communication design inside the company, plus the news feed in ESO. Most companies at that point were still just discussing ChatGPT.",
        approach:
          "We put neural nets on the level of the design process itself, not as a \"wow, look, a neural net.\" Stable Diffusion and MidJourney slotted into that pipeline as they went public and by the end of 2022 became the main stack. Llama and ChatGPT — for text and macros. Whisper — for the UX researchers' transcriptions. Part of the team was skeptical, and some said outright that I was overrating the tools — a normal reaction for 2022.",
        result:
          "By 2024 it had become mainstream, and we already had a worked-out process — not a zero point. After every conference, B2B companies started coming to us for consultations on AI in design.",
        callouts: [
          { value: "Q1 2022", label: "AI pipeline in prod" },
          { value: "5+", label: "AI tools in use" },
          { value: "ESO · comms design", label: "points of application" },
        ],
        links: [
          { label: "TSEKH News #13 — AI in design (Webflow Conf 2023)" },
          { label: "\"AI is useless\" — a podcast on AI" },
          { label: "AI in design — Skillbox chair" },
          { label: "Early interview on TSEKH — neural nets" },
        ],
      },
    ],
    links: [
      { category: "Award", label: "ESO — CX Awards 2024 winner card (RBC)" },
      { category: "Consta design system", label: "consta.design — official site" },
      { category: "Consta design system", label: "Consta on GitHub" },
      { category: "Consta design system", label: "vc.ru article — GPN corporate blog on Consta" },
      { category: "Talks & interviews", label: "Full talk with the Pinkman studio" },
      { category: "Talks & interviews", label: "Talk at World Usability Day" },
      { category: "Talks & interviews", label: "TSEKH News #13 — AI in design (Webflow Conf 2023)" },
      { category: "Talks & interviews", label: "\"AI is useless\" — a podcast on AI" },
      { category: "Talks & interviews", label: "AI in design — Skillbox chair" },
      { category: "Talks & interviews", label: "Early interview on TSEKH — neural nets" },
      { category: "Press", label: "Gazprom Neft press release on the Consta launch" },
      { category: "Partnerships & artifacts", label: "Young Design SPb × GPN — joint \"Interface\" category" },
      { category: "Partnerships & artifacts", label: "Vika Kudryavtseva's badge generator (open-source legacy)" },
    ],
  },
  "ozon": {
    title: "Design processes and HR brand",
    company: "Ozon",
    role: "Community Lead",
    period: "2021 — 2022",
    description:
      "Hiring +40%, turnover −60%, the @ozondesign Telegram channel from zero to 17K subscribers (now already 18.1K — the channel lives without me). Built design review, UX research, and design critiques where there were essentially none.",
    longDescription:
      "A year at Ozon — fast pace, data-driven design, constant switching between a dozen fronts. I owned not product design as such, but the team's design processes and HR brand. I came in at a moment when the team was growing fast but the processes weren't keeping up. I laid the community foundations: introduced design review, UX research, regular design critiques, and built the collective @ozondesign Telegram channel — it still lives without me, now with 18.1K subscribers. Not everything took root on the first pass; some formats I redid two or three times.",
    results: [
      { value: "+40%", label: "designer hiring" },
      { value: "−60%", label: "turnover" },
      { value: "0 → 17K", label: "channel subscribers in a year" },
    ],
    screenshots: [
      { label: "Portfolio roast · part 2", caption: "A design roast — an open portfolio review by viewers with invited Ozon leads. One of the channel's most popular formats." },
      { label: "3D character with neural nets", caption: "A guest post: a \"Strofi\" designer (an Ozon Design ambassador) shows the process of creating a character from sketch to 3D model with neural nets. The channel gathers such material from all teams." },
    ],
    sections: [
      {
        title: "Design processes",
        content:
          "I introduced a systematic approach to design: design review for every critical feature, regular UX research, design critiques. This became the foundation the team could keep growing on. Some formats met resistance at first and had to be relaunched more gently, without a mandatory invite for everyone.",
      },
      {
        title: "Design HR brand",
        content:
          "Created and grew the Ozon design team's Telegram channel from zero to 17,000 subscribers (now 18.1K — the channel lives and grows without me). The business result: designer hiring rose 40%, turnover dropped 60%. The channel became one of the main tools for attracting talent to the company and a point of visibility for the team: guest posts, open portfolio roasts, webinars with external partners.",
        callouts: [
          { value: "0 → 17K", label: "subscribers in a year" },
          { value: "18.1K", label: "now, without me" },
          { value: "+40%", label: "designer hiring" },
          { value: "−60%", label: "turnover" },
        ],
        links: [
          { label: "@ozondesign — the Telegram channel" },
        ],
        screenshots: [
          { label: "Portfolio roast", caption: "A roast — an open portfolio review live. One of the channel's formats that pulls the team's internal expertise outward." },
          { label: "3D character", caption: "Guest posts from designers — Ozon ambassadors: process, tools, cases. The content is gathered collectively — not \"the lead's channel\" but \"the team's channel.\"" },
          { label: "Pathway × Ozon webinar", caption: "Webinars with external partners: for example, with Pathway on UX research. The channel works as a venue for two-way visibility." },
          { label: "\"Emotions vs Panic\"", caption: "Thematic posts on process: design critique, product decisions, recipes for large interfaces." },
        ],
      },
      {
        title: "Result",
        content:
          "I laid the foundations of a design community that keeps working after I left: the @ozondesign channel is alive, run by all of Ozon's designers (bylined \"Authors: all Ozon designers\"), and over the past years it's grown from 17K to 18.1K subscribers. This is where I saw for myself that investment in a design team's HR brand feeds directly into hiring and retention metrics. Before that, I'd mostly been guessing.",
        links: [
          { label: "@ozondesign — Telegram channel" },
        ],
      },
    ],
  },
  "mts-b2c": {
    title: "MTS B2C products",
    company: "MTS",
    role: "Art Director B2C",
    period: "2017 — 2021",
    description:
      "8.8M Cashback users, a 10x growth in transactions. Led the design track: 16 teams, 60+ people.",
    longDescription:
      "Four years at MTS, from product designer to Art Director of the B2C ecosystem. By the end the track held 16 teams, 12 design leads, and 60+ designers. I was there for — and helped shape — part of the design strategy in the years when MTS was turning from a telecom operator into a digital ecosystem. Key products: Cashback, Premium, Stroki, Smart University, Smart Med, Second Memory.",
    results: [
      { value: "8.8M", label: "Cashback users" },
      { value: "×10", label: "transaction growth" },
      { value: "60+", label: "designers" },
      { value: "16", label: "product teams" },
    ],
    sections: [
      {
        title: "MTS Cashback",
        content:
          "8.8 million users. Transactions grew 10x. This was the key ecosystem-monetization product: a cashback program wired into every service. Without it, the rest of the ecosystem's products would have felt a lot more alone.",
        callouts: [
          { value: "8.8M", label: "users" },
          { value: "×10", label: "transaction growth" },
          { value: "1", label: "ecosystem monetization hub" },
        ],
      },
      {
        title: "MTS Premium & Stroki",
        content:
          "MTS Premium: 2.9 million users, subscriptions up 2x. MTS Stroki (a streaming service): 1.5 million users, 2.5x growth. Together these two products shaped the ecosystem's subscription model — before them it was more of a slide than a reality.",
        callouts: [
          { value: "2.9M", label: "Premium users" },
          { value: "×2", label: "Premium subscription growth" },
          { value: "1.5M", label: "Stroki users" },
          { value: "×2.5", label: "Stroki growth" },
        ],
      },
      {
        title: "Smart products and Second Memory",
        content:
          "Smart University: 0.5 million users, 70% engagement. Smart Med: 4 million users, 300% growth. MTS Second Memory: 1M+ users, a 4.7/5 rating, 70K+ MAU. The smart-product line spanned very different verticals: education, health, cloud storage. And that was deliberate: a telecom subscriber needs reasons to stay.",
        callouts: [
          { value: "0.5M", label: "Smart University · 70% engage" },
          { value: "4M", label: "Smart Med · ×4 growth" },
          { value: "1M+", label: "Second Memory · 70K MAU" },
          { value: "4.7", label: "Second Memory rating" },
        ],
      },
      {
        title: "Scale and growth",
        content:
          "This was my own path from product designer to Art Director of the B2C ecosystem. By the end I ran 16 teams through 12 design leads, with 60+ designers in the track. I wasn't the sole architect of the strategy, but I had a hand in shaping it for every B2C product in the ecosystem. Some of the bets I saw very differently by the end, and I left knowing I'd do a lot of it differently.",
        callouts: [
          { value: "16", label: "product teams" },
          { value: "12", label: "design leads" },
          { value: "60+", label: "designers" },
          { value: "Junior → AD", label: "career path in 4 years" },
        ],
      },
    ],
  },
  "mentorship-agent": {
    title: "How I mentor and use AI agents",
    company: "Independent · Practice",
    role: "Mentor · Process Designer",
    roleShort: "Mentor",
    period: "2024 — present",
    description:
      "Mentoring is a regular practice for me. Over my career, 30+ people have gone through my sessions: designers, leads, strong mid-levels, specialists in transition between roles. In parallel I built two AI agents: one automates the post-session routine, the other reviews me as a mentor. I published the template as open-source on GitHub.",
    longDescription:
      "Mentoring is a regular practice for me — and not only in the 1-on-1 format with external mentees. Over my career 30+ people have gone through mentorship: some in my art-director role at MTS, Ozon, and Gazprom Neft, where I systematically grew subordinate leads and strong mid-levels, and some in independent sessions afterward. Most grew: new roles, promotions, moves to dream companies. The biggest time sink was the post-session routine — notes, tasks, tracking agreements. I built an AI agent that automates it. Then a second one, which looks at me as a mentor and suggests techniques for the next session. I published the template for the whole system on GitHub.",
    metricLabel: "mentees",
    results: [
      { value: "30+", label: "mentees over my career" },
      { value: "2 agents", label: "session + self-review" },
    ],
    sections: [
      {
        title: "Mentoring as a practice",
        context:
          "I don't treat mentoring as a \"call with advice.\" For me it's a regular process: a person comes with a request, we work through the situation, capture the takeaways, and return to them in the following meetings.",
        approach:
          "The format is simple: a one-hour session every two weeks, a shared mentee page with the session history, agreements, and tasks. The pages are password-protected — I don't put mentees' materials out in public, not even in the portfolio. Each mentee sees only their own page.",
        result:
          "The main bottleneck is the post-session routine: sorting through notes, laying out the page, writing out tasks, not losing context. An hour to an hour and a half per meeting.",
        callouts: [
          { value: "30+", label: "mentees over my career" },
          { value: "1 h / 2 wk", label: "session format" },
        ],
      },
      {
        title: "Agent 1 — the post-session routine",
        context:
          "The mentee gets a full trace of the session: summary, key topics, decisions, tasks with dates, progress, next steps. All of it is automatically built into the shared mentee page with accumulated agreements and growth history.",
        heroes: [
          { alt: "From audio to a structured session: the agent pipeline" },
        ],
        approach:
          "Claude Code + Gemini API. Tuned to my mentoring format: which blocks are needed after each meeting, how to capture agreements, how to update the shared mentee page. Ordinary note-taking bots give a five-line summary — here the whole conversation is scanned.",
        result:
          "Before, I wrote such a detailed page by hand only for select mentees; there wasn't time for the rest. Now every one of them gets it — on the day of the session, with all the decisions, tasks, and an updated growth history.",
        callouts: [
          { value: "6 blocks", label: "session page" },
          { value: "Claude Code", label: "agent core" },
          { value: "Gemini API", label: "transcription" },
        ],
      },
      {
        title: "Agent 2 — reviewing my sessions",
        context:
          "Once the first agent took the routine off my plate, something became visible: reflection can be automated too. I'm a decent mentor, but not a perfect one — the only way to grow is for someone to tell you where you came up short.",
        approach:
          "The second agent looks at my latest mentoring session and answers two questions: what I did well and what to try in the next meeting. It highlights patterns: gave advice too quickly, held the pause too little, asked a closed question, pulled the conversation onto my own experience where the mentee was still thinking.\n\nAt its base is the GROW technique as the framing scaffold. On top of that the agent picks techniques from other sources and links to materials: what to read, where to dig deeper into a specific pattern. There's no hardcoded checklist — the recommendations are live, tailored to each session.",
        result:
          "It's a mirror that shows me from the outside. I don't take every recommendation at face value. But the simple habit of regular self-review changed the quality of the sessions that followed.",
        helped:
          "AI here is for reflection. When a model gives you the read, it doesn't weigh on you the way a colleague's opinion does. It's a second you.",
        callouts: [
          { value: "GROW", label: "framing scaffold" },
          { value: "2 agents", label: "session + self-review" },
          { value: "retro", label: "on the previous session" },
        ],
      },
      {
        title: "How it looks",
        videoBlock: {
          alt: "Demo: a mentee page with the session structure, agreements, tasks, and recommendations",
        },
      },
      {
        title: "Open-source template",
        context:
          "Once the system started working for me, I released it as open-source. Names and data are swapped for neutral examples; access privacy is preserved in the template's logic.",
        approach:
          "Who it's for: a mentor, coach, or team lead who runs regular sessions and doesn't want the follow-up eating their evening.\n\nWhat's inside: a template for the mentee and session page, a Claude Code config with prompts tuned to the conversation format, a transcription script via the Gemini API, and password-protected access to the pages.\n\nHow to get it: clone the repo, plug in your Gemini key, edit the template to your own blocks, and start dropping audio into a folder.",
        result:
          "Not a SaaS and not a product. A working template to adapt.",
        links: [
          { label: "Template demo (GitHub Pages)" },
          { label: "Repository on GitHub" },
        ],
      },
      {
        title: "What's next",
        content:
          "I want to turn this system into a tool for coaching studios and schools: a single session standard, shared memory per mentee, the reviewer agent as a trainer for junior coaches. That interests me as a product step. I'm looking for partners and people for a pilot — if this resonates, get in touch.\n\nThere's no admin panel yet, and I want to finish the mobile version: so it's more convenient to review agreements and tasks. This is the first version of the system.",
      },
    ],
    links: [
      { category: "Demo and code", label: "Template demo (GitHub Pages)" },
      { category: "Demo and code", label: "Template repository" },
    ],
  },
  "led-font-engine": {
    title: "Diode font",
    company: "Pet Project",
    role: "Design Engineer",
    period: "2026",
    description:
      "Every bit of text on this site — headings, menu, counters, icons — is drawn with a single homemade pixel font. Not a font file, but an engine: 89 bitmap glyphs and a dot renderer whose size, step, and color you can dial. Built in an hour together with an AI agent, because no such ready-made font exists.",
    longDescription:
      "It started with the logo: I was trying out ways to set my own name, and the pixel version hooked me hardest. I adapted a single block of text, looked at it — and realized the whole site had to move over to it. One problem: a pixel font with Cyrillic that bends to every task — from a logo down to a 9-pixel caption — doesn't exist. I combed the entire Google Fonts catalog: pixel fonts with Cyrillic are rare, and every one of them is rigid. So instead of hunting for a font, it turned into an evening puzzle: draw my own. An hour was enough.",
    heroSlogan: "MANUSCRIPTS DON'T BURN.\nBUT THIS FONT — BURNS",
    metricLabel: "glyphs · custom engine",
    coverLed: ["114 glyphs", "5×7 dots", "whole site"],
    tryLabel: "Type your own word",
    tryNote: "The board renders your text with the same dots as the rest of this site.",
    results: [
      { value: "114", label: "glyphs: Cyrillic, Latin, digits, symbols" },
      { value: "1 hour", label: "from the first letter to a system" },
      { value: "0", label: "font files — just dots" },
    ],
    sections: [
      {
        title: "The idea",
        context:
          "The portfolio was built around a thought: I don't just grow teams and systems — I tune them. And what gets tuned is instruments: screens, boards, panels. On an instrument, text isn't typed — it's lit. Of all the visual moves I tried, dots turned out to be the only one that rhymed with everything at once: the logo, the screen-like cards, the interactive parts.",
        approach:
          "First I honestly looked for something off the shelf. The Google Fonts catalog: 19 monospaced fonts with Cyrillic, 78 display ones, maybe three pixel fonts among them — and each does exactly one thing: sit at a single size and refuse to move. But I needed one system to carry the logo, the headings, the navigation, the counters, and nine-pixel captions. Nobody makes that.",
        result: "So we draw our own. Spoiler: it took an hour.",
      },
      {
        title: "How it works",
        approach:
          "**Not a font, but an engine.** Each letter is a 5×7 bitmap: rows like \"01110,\" where a one is a lit diode. The renderer lays the text out on a dot grid and draws it with SVG circles.\n\n**Parameters instead of point sizes.** The renderer has three knobs: grid step, dot radius, and bitmap upscale. At a small size the dots merge into a letter; at a large one they break apart into an honest board. That's a designer's decision, not a property of a file.\n\n**currentColor.** The text is colored and animated with ordinary CSS classes — hovers, transitions, glow all work out of the box.\n\n**One language — different inputs.** The same dot grid renders more than letters: pixel icons, the logo with animations (wave, equalizer, rain, scan), and 3D cubes with physics on the case cards. Right now the engine lives in 33 of the site's files.",
        approachSimple:
          "**Letters aren't printed, they're lit.** Each letter is a map of 35 bulbs: which are on, which are off. Like a board at an airport.\n\n**Size is a mood.** Up close you see the separate dots; from afar they merge into a letter. I choose myself where each effect is needed.\n\n**Colored like ordinary text.** For the browser it's just dot-pictures, so everything the site can do — highlights, animations — works with the font too.",
        callouts: [
          { value: "5×7", label: "glyph matrix" },
          { value: "SVG", label: "dots instead of letters" },
          { value: "33", label: "files on the site" },
        ],
      },
      {
        title: "The full set — live",
        context:
          "So you don't have to take it on faith that this is a system and not a couple of pretty letters — here's the whole font. Cyrillic, Latin, digits, symbols. Spin the sizing: at \"Caption\" the dots merge into a letter, at \"Board\" they break apart into an honest diode screen.",
      },
      {
        title: "What comes out of it",
        context:
          "The font is an engine, not a picture. The same bitmaps work as a neon sign, an airport board with a repaint wave, a counter with rolling digits, and a mask for pixel fire. Everything below is live components, not video.",
      },
      {
        title: "An hour with the agent",
        context:
          "The most interesting thing in this story isn't the glyphs — it's how it was made. The whole way from the first letter to a system we went through together with an AI agent in an hour: the first twenty minutes were experiments, then fittings, readability tuning, and assembling the components.",
        approach:
          "My part is the language and the calls: which matrix, where the dots should read as texture and where they should merge, what makes it into the system and what goes in the bin. The agent's part is the grind: lay Cyrillic out into bitmaps, assemble the renderer, don't break the line wraps. The hardest part turned out to be Cyrillic in 5×7 — fitting Ж, Щ, and Ю into five columns is an exercise in minimalism that we iterated on together.",
        result:
          "It's a working model of my \"design × code × AI\" approach: not a presentation about the process, but an artifact of it. The best proof is right in front of you: this whole case is written in that very font.",
      },
      {
        title: "What's next",
        content:
          "The engine is spun out into a separate repository under MIT — take it, draw your own glyphs. A mini-builder already works: a grid where you draw your glyph with dots, save it to a browser gallery, or drop in a PNG — the engine converts the picture to dots by contrast, and from there you finish it by hand. From a font it turned into a small tool — it's higher up the page and on a separate demo page.",
      },
      {
        title: "Why I do this",
        content:
          "It matters to me that ideas end in something physical — a thing you can touch. The \"I tune instruments\" idea could have stayed a slide in a deck; instead it became the font the whole site is written in. Puzzles like this keep my hand on the technology and put my taste to the test: an hour of work, and it's dead easy to tell a systemic solution from decoration by the result.",
      },
    ],
    links: [
      { category: "Demo", label: "Live board — type your own word" },
      { category: "Demo", label: "The whole site as a demo — home" },
      { category: "Code", label: "led-font repository on GitHub (MIT)" },
      { category: "Code", label: "Standalone demo — outhead.github.io/led-font" },
    ],
  },
  "particle-portrait": {
    title: "Volume from a plane",
    company: "Pet Project",
    role: "Creative Developer",
    period: "2026 — present",
    description:
      "A photo turns into a volumetric cloud of thousands of dots: I cut out the background, compute a depth map with a neural net (Depth Anything), and assemble a 3D cloud with spring physics. On hover the dots flock into the portrait; on click they flow into another shape or into text. This same engine runs in the site's hero; next to it — a builder where you can drop in your own photo.",
    longDescription:
      "I wanted to \"bring to life\" a static portrait without shooting video. The solution came together from three parts. First — background removal: a model separates the person from the backdrop. Second — depth: Depth Anything V2 builds a depth map from a single photo (where the nose, cheekbones, shoulders sit relative to the camera), which gives real volume rather than a flat relief. Third — the render: thousands of dots live on springs, reach toward a target shape, and flow between shapes (portrait → text → figure) as one and the same cloud. Everything is drawn by writing directly into a pixel buffer, so it holds 60fps even with thousands of dots. In the builder, depth is computed right in the browser (transformers.js) — you can upload your own photo, spin the volume, and save a rotation clip or the assets.",
    metricLabel: "builder",
    results: [
      { value: "1 photo", label: "→ a volumetric dot cloud" },
      { value: "60fps", label: "thousands of particles, direct buffer" },
    ],
    sections: [
      {
        title: "The idea",
        context:
          "A static portrait on the site is boring, and video is heavy and doesn't fit the LED aesthetic. I wanted the face to \"live\" out of the same dots that draw the whole site, and to be volumetric rather than a flat effect.",
        approach:
          "I built a cloud engine: the dots reach toward a target shape on springs, so the transitions come out soft. The same set of particles can be a portrait, text, or any other figure — it flows between them.",
        result:
          "The result isn't a single effect but a shape engine. It also stands in the home hero: hover — the face assembles, click — a phrase or a figure.",
      },
      {
        title: "How it works",
        approach:
          "**Background removal.** A model separates the figure from the backdrop — the dots land only on the subject.\n\n**Depth.** Depth Anything V2 builds a depth map from a single photo: brighter = closer. From it I take a Z for each dot — the nose and cheekbones really stick out, and on rotation you see the volume.\n\n**The cloud.** Thousands of particles with spring physics reach toward a target; a change of shape is a change of target, and the dots fly over on their own.\n\n**Speed.** I draw not with a canvas call per dot but by writing directly into a pixel buffer — one putImageData per frame, hence 60fps with thousands of dots.",
        approachSimple:
          "**We separate the person from the background** — the dots land only on you.\n\n**We compute depth.** From a single photo the neural net figures out what's closer to the camera and what's farther — that's how real volume appears, the nose pokes forward.\n\n**We draw with dots.** Thousands of particles on \"little springs\" assemble into a face; change the shape and they fly over into the new one on their own.\n\n**Fast.** We draw the whole cloud in one go, not dot by dot, so it doesn't lag.",
        callouts: [
          { value: "Depth", label: "depth from a single photo" },
          { value: "Springs", label: "soft shape transitions" },
          { value: "Buffer", label: "60fps on thousands of dots" },
        ],
      },
      {
        title: "The builder",
        context:
          "Showing a finished portrait isn't enough — it's more interesting to let anyone drop in their own photo and see themselves in 3D dots.",
        approach:
          "In the builder, depth is computed right in the browser via transformers.js (the same Depth Anything, no server). Right away — a quick preview; on the \"Process\" button — real depth and background removal. Sliders control dot density, relief, and grain. You can save a rotation clip (webm) or the assets: the silhouette and the depth map.",
        result:
          "Essentially a small editor: a photo in, a volumetric cloud out, with the option to take the result with you. Try it right here ↓",
      },
      {
        title: "Why I do this",
        content:
          "It matters to me to regularly build something by hand — it keeps a connection to the technical side of design. Here three things I love came together: applied AI, not AI in name only (depth from a single photo), attention to performance (thousands of dots without lag), and product thinking — making it pretty isn't enough, another person has to be able to pick it up and try it on themselves.",
      },
    ],
    links: [
      { category: "Demo", label: "The engine in the hero — home" },
    ],
  },
  "webgl-experiments": {
    title: "Hypercube",
    company: "Pet Project",
    role: "Creative Developer",
    period: "2025 — present",
    description:
      "An interactive builder for glass 3D shapes: pick a form, dial in the material, iridescence, aurora, and particles — and export the scene as a single HTML file. Everything is computed by an SDF raytrace in a shader, without a single mesh. It lives in one index.html, is open under MIT, and on a phone it's controlled by tilt through the gyroscope.",
    longDescription:
      "It started as an attempt to build a glass cube with a glowing internal grid, and grew into a small sandbox engine. Six Platonic solids — icosahedron, cube, octahedron, dodecahedron, stellated, and compound — are rendered as a single raymarch fragment: no vertex geometry, only signed distance fields and their gradients. On top of that — aurora ribbons on simplex noise and GPGPU particles. It all sits in one index.html with no build step, Three.js pulled from a CDN. Inside there's a builder panel, a Learn mode that explains the render, and export of the scene to standalone HTML or config JSON. Released under MIT — take it, fork it, build your own scene.",
    metricLabel: "demo · MIT",
    tryLabel: "Try it live",
    tryNote: "Opens in the browser. From a phone — tilt it: the scene responds to the gyroscope.",
    results: [
      { value: "6", label: "SDF shapes without a single mesh" },
      { value: "1 file", label: "index.html, no build" },
    ],
    sections: [
      {
        title: "The idea",
        context:
          "Most beautiful WebGL demos look like magic until you start taking them apart layer by layer. I wanted to build such an object myself and understand what makes up the feeling of depth, volume, and light — and then hand it over for anyone to play with.",
        approach:
          "I took glass polyhedra with a glowing internal grid as the base. Started with a cube, got to six Platonic solids and morphing between them. Along the way it grew a parameter panel to change form, material, and effects live, rather than in code.",
        result:
          "The result isn't a single art piece but a sandbox: change the shape, IOR, iridescence, aurora, and particles — and see the result instantly.",
      },
      {
        title: "How it works",
        approach:
          "**No mesh.** The shapes aren't geometry, they're signed distance fields. Each pixel is a ray that marches through the SDF; the shader computes the hit point, normal, Fresnel, and refraction inward on the spot.\n\n**Glass.** Snell's-law refraction at the hit point, a rounded bevel from the SDF itself, IBL lighting.\n\n**Aurora.** Six TubeGeometry ribbons, vertices displaced by 3-frequency simplex noise — classic fBm.\n\n**Particles.** GPGPU via GPUComputationRenderer — positions and velocities computed on the GPU every frame.",
        approachSimple:
          "**The shape isn't real.** Usually a 3D object is a mesh of thousands of triangles. Here there isn't one: for each point on the screen the computer works out from a formula whether the ray hit the shape and where its edge is. It comes out cheaper and sharper.\n\n**It's glass.** Light passes through the shape and refracts, like in real glass or water — so it looks transparent and heavy, even though it's hollow inside.\n\n**A glow behind it.** That's the \"northern lights\": several ribbons slowly stirred by random noise, so the background lives and breathes.\n\n**Glowing dots.** Thousands of particles fly around, and the graphics card computes their motion — so there are many of them and nothing slows down.",
        videoBlock: {
          alt: "Screencast: shape morphing and the builder's parameter panel",
        },
        callouts: [
          { value: "SDF", label: "raytrace instead of a mesh" },
          { value: "GPGPU", label: "particles on the GPU" },
          { value: "Bloom", label: "5-level mip" },
        ],
      },
      {
        title: "The Platonic solids",
        context:
          "Four of the six shapes in the scene are Platonic solids: convex polyhedra where every face is the same regular polygon and the same number of edges meets at every vertex. There are exactly five of them; the Greeks knew them all. In the engine they aren't separate models but one SDF formula with a different set of cutting planes.",
        approach:
          "**Cube.** Six squares, eight vertices. The only solid with square faces; Plato tied it to earth, for its stability.\n\n**Octahedron.** Eight triangles, six vertices. Dual to the cube: the face centres of one give the vertices of the other. The element of air.\n\n**Icosahedron.** Twenty triangles, twelve vertices. The closest of the five to a sphere, which is why graphics use it to approximate one. The element of water.\n\n**Dodecahedron.** Twelve pentagons, twenty vertices. Dual to the icosahedron. Plato gave it not to an element but to the arrangement of the cosmos.",
      },
      {
        title: "Builder, Learn, and export",
        context:
          "Just showing a finished picture wasn't enough for me — I wanted anyone to be able to take it apart and build their own.",
        approach:
          "The scene has a builder panel: shape, size, bevel, IOR, light color, iridescence, interior, bloom, aurora, particles — everything adjusts live. The Learn mode explains what each thing does. Export packs the current scene into a standalone single-file HTML (all assets inlined as data URLs) or into a config JSON with comments on every parameter; the config can be loaded back in.",
        result:
          "Essentially it's not a demo but a small editor. That's why I released it under MIT: take it, fork it, rip out pieces, build your own scene. I broke the aurora and the shapes out into separate CodePen pens, so they can be poked at part by part.",
        links: [
          { label: "Live demo — outhead.github.io/hypercube" },
          { label: "GitHub repository (MIT)" },
          { label: "CodePen — aurora ribbons" },
          { label: "CodePen — SDF shapes" },
        ],
      },
      {
        title: "Why I do this",
        content:
          "Over the past years I've managed teams and products a lot, but it's still important to me to regularly build something with my own hands. Projects like this keep me connected to the technological side of design and force me to think like a product: making it beautiful isn't enough — someone else has to be able to take it and reuse it. It also makes it clearer which ideas can actually be taken to production and which only look good on reference boards.",
      },
    ],
    links: [
      { category: "Demo and code", label: "Live demo — outhead.github.io/hypercube" },
      { category: "Demo and code", label: "GitHub repository (MIT)" },
      { category: "Taken apart", label: "CodePen — aurora ribbons" },
      { category: "Taken apart", label: "CodePen — SDF shapes" },
    ],
  },
  "telegram-dashboard": {
    title: "An AI pipeline for a personal channel",
    company: "Pet Project",
    role: "Developer",
    period: "2025",
    description:
      "A Telegram bot for my AI channel. It takes links, voice messages, and screenshots, assembles context, and turns it into a draft post in about 30 seconds. Still rough, but the basic loop already runs every day.",
    longDescription:
      "The AI channel started eating more time than I wanted: gathering materials, transcribing voice notes, reading articles, assembling posts — several hours of routine a day. I decided to automate the drafting, but keep the final call for myself. That's how the bot came about: it collects materials from different sources, runs them through a chain of services, and returns a post draft. The hardest part turned out to be not the integrations, but the attempt to preserve my own voice.",
    metricLabel: "from link to draft",
    metric: "30s",
    sections: [
      {
        title: "The problem",
        context:
          "Running a channel turned out to be less about writing texts and more about preparing materials. Over a day, links, voice notes, screenshots, and ideas pile up that then need to be assembled into a coherent whole.",
        approach:
          "I tried storing notes in different places and processing them once a week. In practice that just moved the same hours to another day.",
        result:
          "So the task became automating exactly the prep stage, not the authoring itself.",
      },
      {
        title: "The solution and the pipeline",
        approach:
          "The bot takes a link, a voice message, or a screenshot. Links are cleaned and extracted via trafilatura, voice messages go through the Whisper API. Then all the context is assembled into a single structure and sent to the Claude API for draft generation. The /go command starts the build and returns the finished text back into Telegram.",
        callouts: [
          { value: "aiogram 3", label: "bot interface" },
          { value: "FastAPI", label: "service layer" },
          { value: "SQLAlchemy", label: "data handling" },
          { value: "Claude API", label: "draft generation" },
        ],
      },
      {
        title: "Status",
        context:
          "The project is at the working-skeleton stage.",
        approach:
          "The basic scenario already works: I send material, run processing, get a draft. For daily use that's enough.",
        result:
          "The most unstable part is the authorial voice. I keep rewriting the prompts: good posts come not from the model but from the context and the editing.",
      },
      {
        title: "What's next",
        content:
          "I want to bring the system to a state where it doesn't write posts for me but assembles a solid first version. The next step is to store the channel's context better, take past publications into account, and cut down on manual edits before publishing.",
      },
    ],
  },
};
