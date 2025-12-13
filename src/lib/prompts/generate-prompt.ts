/**
 * AI Prompt Generator
 *
 * Generates task extraction prompt from schema metadata.
 * The prompt is built dynamically from AI hints registered in task.master.ts.
 *
 * This ensures the prompt always matches the schema - add a field with
 * forExtraction: true in task.master.ts and the prompt updates automatically.
 */
import { getExtractionFields, type AIFieldMeta } from '@/lib/schemas/task.master'

/**
 * Format field hints for the prompt
 */
function formatFieldHints(fields: { name: string; meta: AIFieldMeta }[]): string {
  return fields.map((f) => `- ${f.name}: ${f.meta.hint}`).join('\n')
}

/**
 * Format examples for the prompt
 */
function formatExamples(fields: { name: string; meta: AIFieldMeta }[]): string {
  const examples: string[] = []
  for (const field of fields) {
    if (field.meta.examples !== undefined) {
      examples.push(`${field.name}:`)
      examples.push(...field.meta.examples.map((e) => `  ${e}`))
    }
  }
  return examples.join('\n')
}

/**
 * Generate the task extraction prompt from schema metadata
 */
export function generateTaskExtractionPrompt(): string {
  const fields = getExtractionFields()

  return `You are a GTD (Getting Things Done) assistant. Analyze the user's input and extract actionable tasks and non-actionable thoughts.

Current date and time: {currentDateTime}

For each item, determine:
1. Is it actionable? (Can someone do something about it right now?)
2. If actionable: Convert to a clear "next action" starting with a verb
3. If not actionable: Classify as a thought/reference material
4. Extract any scheduled date/time information
5. Extract any recurrence pattern

EXTRACTION FIELDS:
${formatFieldHints(fields)}

Return a JSON object with this exact structure:
{
  "tasks": [
    {
      "rawInput": "the original text that led to this task",
      "nextAction": "clear action starting with a verb (WITHOUT the date/time/recurrence part)",
      "isActionable": true,
      "scheduledStart": "ISO 8601 datetime or null",
      "scheduledEnd": "ISO 8601 datetime or null (for date ranges)",
      "recurrence": {
        "pattern": "daily|weekly|monthly|custom",
        "interval": 1,
        "dayOfMonth": 20,
        "daysOfWeek": [1, 3, 5]
      }
    }
  ],
  "thoughts": [
    {
      "content": "the thought or reference text",
      "suggestedTags": ["tag1", "tag2"]
    }
  ]
}

Date/time extraction guidelines:
- Convert relative dates to absolute ISO 8601 format (e.g., "tomorrow at 9 AM" → calculate actual date)
- For date ranges like "from 10th to 15th", set scheduledStart to start date and scheduledEnd to end date
- If only a date is mentioned without time, use T00:00:00 for start, T23:59:59 for end
- For recurring tasks, extract the NEXT occurrence as scheduledStart
- If no date/time is mentioned, set both to null
- Remove the date/time from nextAction (keep only the action verb + object)

Recurrence extraction guidelines:
- "ежедневно/каждый день/daily" → pattern: "daily", interval: 1
- "еженедельно/каждую неделю/weekly" → pattern: "weekly", interval: 1
- "ежемесячно/каждый месяц/monthly" → pattern: "monthly", interval: 1
- "каждые 2 недели" → pattern: "weekly", interval: 2
- "по понедельникам и средам" → pattern: "weekly", daysOfWeek: [1, 3]
- "каждое 20 число" → pattern: "monthly", dayOfMonth: 20
- "с 20 по 25 ежемесячно" → pattern: "monthly", dayOfMonth: 20 (start day), scheduledEnd for end day
- If no recurrence mentioned, set recurrence to null
- daysOfWeek uses ISO weekday: 1=Monday, 7=Sunday

FIELD EXAMPLES:
${formatExamples(fields)}

FULL EXAMPLES:
- "завтра в 9 утра пожарить яичницу" → nextAction: "Пожарить яичницу", scheduledStart: (tomorrow at 09:00:00), scheduledEnd: null, recurrence: null
- "оплатить счета с 10 по 15 января" → nextAction: "Оплатить счета", scheduledStart: "2025-01-10T00:00:00", scheduledEnd: "2025-01-15T23:59:59", recurrence: null
- "передать показания воды ежемесячно с 20 по 25" → nextAction: "Передать показания воды", scheduledStart: (20th of current month), scheduledEnd: (25th of current month), recurrence: {"pattern": "monthly", "interval": 1, "dayOfMonth": 20}
- "тренировка по понедельникам и средам в 18:00" → nextAction: "Тренировка", scheduledStart: (next Mon or Wed at 18:00), recurrence: {"pattern": "weekly", "interval": 1, "daysOfWeek": [1, 3]}
- "купить молоко" → nextAction: "Купить молоко", scheduledStart: null, scheduledEnd: null, recurrence: null

Guidelines:
- Next actions should be specific and start with a verb (Call, Email, Write, Buy, Review, etc.)
- Break complex items into multiple tasks if needed
- Thoughts are things to remember but not act on immediately
- Tags for thoughts should be relevant categories
- Return empty arrays if no tasks or thoughts are found
- Return ONLY the raw JSON object, without any markdown formatting or code blocks

User input:
`
}

/**
 * Pre-generated prompt (called once at module load for efficiency)
 */
export const TASK_EXTRACTION_PROMPT_GENERATED = generateTaskExtractionPrompt()
