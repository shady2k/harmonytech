# Original Prompt (Extracted from Conversation)

I want to redesign my GTD app's home experience. Right now the "Inbox" shows AI recommendations, but that's confusing - in real GTD, inbox means unprocessed items that need my decision. I want to open the app and fast look what to do or see important thoughts in the first case.

The current flow is: capture voice/text creates a Thought, then background AI extracts Tasks automatically. But the user never sees the inbox of unprocessed items - they just disappear into the task list. I want a true inbox showing unprocessed thoughts, and AI should classify items and remove them from inbox when done.

We discussed with designer, product, and business analysts. They recommended: Home dashboard as landing page with inbox alert + top AI recommendation, separate Inbox view for unprocessed items, rename current Inbox to Home. The AI processing should auto-remove high-confidence extractions from inbox, but keep low-confidence ones for user review.

Technical context: React + TypeScript app with RxDB database, existing useBackgroundAI hook for processing, Thought has aiProcessed boolean field. Need to possibly add processingStatus enum and classificationStatus to tasks. Success means user can see inbox count immediately, process items quickly, and time to first action under 10 seconds.

---
*Extracted by Clavix on 2025-12-13. See optimized-prompt.md for enhanced version.*
