# Campaigns — Client Demo UI

An enterprise-grade, client-ready interactive email marketing platform UI tailored for high-throughput architecture.

---

## 🚀 How to Run the Demo

```bash
cd frontend
npm run dev
```

Then open `http://localhost:5173` in your browser.

---

## 🎨 Design System Features

1. **Enterprise Color Palette & Theme:**
   - **Header Topbar:** Clean white header with global search, action icons, and user profile
   - **Sidebar Navigation:** Charcoal sidebar with stacked icons and active indicators
   - **Background & Cards:** Neutral `#F7F9FC` with crisp bordered cards

2. **Core Platform Modules:**
   - **Executive Dashboard:** KPI scorecards, 7-day volume vs delivery chart, mail client breakdown
   - **Campaigns Directory:** Filter tabs (`All`, `Sent`, `Scheduled`, `Processing`, `Draft`, `A/B Testing`), search, and kebab action menus
   - **5-Step Campaign Wizard (`+ Create Campaign`):**
     - Step 1: Details (Title, Subject with merge tags, Preheader, Verified Sender)
     - Step 2: Audience (List targeting + Suppression exclusion + Real-time recipient counter)
     - Step 3: Template Chooser (Responsive gallery)
     - Step 4: Email Builder (Desktop 600px vs Mobile 375px preview toggle)
     - Step 5: Review & Audit (Pre-flight checklist + Deliverability score)
   - **Campaign Telemetry & Analytics:**
     - Scorecards, 24-hour engagement velocity area chart, link click distribution heatmap, and live recipient activity feed
   - **Live Dispatch Simulator:**
     - Interactive worker simulator showing micro-batches dispatched in parallel with live status indicators
   - **Deliverability & Amazon SES Health Center:**
     - SPF, 2048-bit DKIM, DMARC, and custom MAIL FROM domain status; 30-day IP Warmup progression tracker; Postmaster reputation gauge
   - **Contacts & Audience Management:**
     - Subscribers, Lists, and Suppression Registry; interactive CSV Import Modal with auto-column mapper
   - **Visual Automation Canvas:**
     - Node-based customer journey builder with triggers, actions, delays, and condition branching
