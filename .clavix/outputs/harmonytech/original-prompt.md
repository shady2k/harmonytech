# Original Prompt (Extracted from Conversation)

Build a GTD (Getting Things Done) app that solves the main pain point with existing apps - they force you to choose categories, dates, and other properties upfront which kills the capture moment. This app should let users simply write or speak their thoughts and tasks without any required fields, then use AI to help organize everything.

The app should have both text and voice input. For voice, keep the original recording and transcript, then let AI extract any tasks from what was said. AI should figure out if something is an actionable task or just a thought - tasks get organized with suggested properties, thoughts get stored for later reference.

For tasks, AI should suggest properties based on GTD best practices: next action (the concrete step), context (where/tools needed), energy level required, time estimate, hard deadline (only real ones), project it belongs to, and someday/maybe status. User can accept suggestions, pick alternatives, or type their own values. The key is making suggestions helpful, not forcing decisions.

The app needs to be decentralized and privacy-focused. Data should live on the user's device (local-first), with optional P2P sync between devices. No server required for MVP, but could add self-hosted server later for notifications. It should be a PWA that works well on both mobile and desktop.

For viewing tasks, provide two modes: AI-powered recommendations ("what should I do now?" based on context/energy/time) or static filtered views (manual browsing by category). User chooses which approach they prefer.

Additional features: recurring tasks, archive for completed tasks (keep history), and a thoughts/ideas system where non-actionable items are searchable, AI can resurface relevant ones periodically, and they can be converted to tasks when ready.

For AI, use OpenRouter with BYOK (bring your own key) - user provides their API key, we don't handle their data. The app is for personal use only, no collaboration features needed.

Out of scope for MVP: notifications/reminders, server infrastructure, data backup/export.

---
*Extracted by Clavix on 2025-12-12. See optimized-prompt.md for enhanced version.*
