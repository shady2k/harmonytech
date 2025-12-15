/**
 * AI Prompt Generator
 *
 * Generates task extraction prompt from schema metadata.
 * The prompt is built dynamically from AI hints registered in task.schema.ts.
 *
 * IMPORTANT: AI extracts SEMANTIC date meaning, not calculated dates.
 * The app calculates actual dates from semantic anchors because
 * AI models don't have reliable calendar knowledge.
 */
import { getExtractionFields, type AIFieldMeta } from '@/types/schemas/task.schema'

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

IMPORTANT: You extract SEMANTIC DATE MEANING, not calculated dates.
You do NOT have a calendar. The app will calculate actual dates from your semantic anchors.

For each item, determine:
1. Is it actionable? (Can someone do something about it right now?)
2. If actionable: Convert to a clear "next action" starting with a verb
3. If not actionable: Classify as a thought/reference material
4. Extract semantic date anchor (the MEANING of when)
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
      "dateAnchor": {
        "type": "relative|offset|weekday|absolute|none",
        // ... type-specific fields
      },
      "dateAnchorEnd": null,
      "recurrence": {
        "pattern": "daily|weekly|monthly|custom",
        "interval": 1,
        "dayOfMonth": 20,
        "daysOfWeek": [1, 3, 5],
        "anchorDay": 10,
        "constraint": "next-weekend"
      },
      "properties": {
        "context": "computer|phone|errands|home|anywhere",
        "energy": "high|medium|low",
        "timeEstimate": 15
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

DATE ANCHOR TYPES (semantic meaning, NOT calculated dates):

1. type: "none" - No date mentioned
   Example: {"type": "none"}

2. type: "relative" - Relative to today
   Values: "today", "tomorrow", "day-after-tomorrow", "this-weekend", "next-weekend", "this-week", "next-week"
   Example: {"type": "relative", "value": "tomorrow", "time": "09:00"}

3. type: "offset" - Offset from today
   Units: "days", "weeks", "months"
   Example: {"type": "offset", "unit": "days", "amount": 3} (in 3 days)
   Example: {"type": "offset", "unit": "weeks", "amount": 2} (in 2 weeks)

4. type: "weekday" - Specific day of week
   Weekday: 1=Monday, 2=Tuesday, ..., 7=Sunday (ISO format)
   Modifier: "this" or "next" (optional)
   Example: {"type": "weekday", "weekday": 1} (on Monday)
   Example: {"type": "weekday", "weekday": 5, "modifier": "next"} (next Friday)

5. type: "absolute" - Specific date
   Year is optional (will be inferred if omitted)
   Example: {"type": "absolute", "month": 1, "day": 15} (January 15)
   Example: {"type": "absolute", "year": 2025, "month": 3, "day": 20, "time": "14:00"}

Time format: "HH:mm" (24-hour), optional for any anchor type.

DATE EXTRACTION RULES:
- Extract the SEMANTIC meaning, do NOT calculate actual dates
- "завтра"/"tomorrow" → {"type": "relative", "value": "tomorrow"}
- "послезавтра" → {"type": "relative", "value": "day-after-tomorrow"}
- "в эти выходные"/"this weekend" → {"type": "relative", "value": "this-weekend"}
- "в следующие выходные"/"next weekend" → {"type": "relative", "value": "next-weekend"}
- "через 3 дня"/"in 3 days" → {"type": "offset", "unit": "days", "amount": 3}
- "через неделю"/"in a week" → {"type": "offset", "unit": "weeks", "amount": 1}
- "в понедельник"/"on Monday" → {"type": "weekday", "weekday": 1}
- "в следующую пятницу"/"next Friday" → {"type": "weekday", "weekday": 5, "modifier": "next"}
- "15 января"/"January 15" → {"type": "absolute", "month": 1, "day": 15}
- No date mentioned → {"type": "none"}
- Remove the date/time part from nextAction (keep only the action verb + object)

DATE RANGES:
- For ranges like "с 10 по 15 января" (from Jan 10 to Jan 15):
  - dateAnchor: {"type": "absolute", "month": 1, "day": 10}
  - dateAnchorEnd: {"type": "absolute", "month": 1, "day": 15}
- Weekend anchors ("this-weekend", "next-weekend") already imply Sat-Sun range, no dateAnchorEnd needed

RECURRENCE PATTERNS:
For RECURRING tasks, set the recurrence object. The app will calculate dates from the pattern.
- "ежедневно/каждый день/daily" → {"pattern": "daily", "interval": 1}
- "еженедельно/каждую неделю/weekly" → {"pattern": "weekly", "interval": 1}
- "ежемесячно/каждый месяц/monthly" → {"pattern": "monthly", "interval": 1}
- "каждые 2 недели" → {"pattern": "weekly", "interval": 2}
- "по понедельникам и средам" → {"pattern": "weekly", "daysOfWeek": [1, 3]}
- "каждое 20 число" → {"pattern": "monthly", "dayOfMonth": 20}
- "с 20 по 25 ежемесячно" → {"pattern": "monthly", "dayOfMonth": 20}, dateAnchorEnd: {"type": "offset", "unit": "days", "amount": 5}
- "в выходные после 10 числа ежемесячно" → {"pattern": "monthly", "anchorDay": 10, "constraint": "next-weekend"}
- "в ближайшие выходные после 10 числа ежемесячно" → {"pattern": "monthly", "anchorDay": 10, "constraint": "next-weekend"}
- "в рабочий день после 15 числа каждого месяца" → {"pattern": "monthly", "anchorDay": 15, "constraint": "next-weekday"}
- "с 25 до конца месяца"/"до конца месяца с 25 числа" → {"pattern": "monthly", "anchorDay": 25, "constraint": "end-of-month"}
- If no recurrence mentioned, set recurrence to null
- daysOfWeek uses ISO weekday: 1=Monday, 7=Sunday
- constraint values: "next-weekend" (Sat-Sun), "next-weekday" (Mon-Fri), "next-saturday", "next-sunday", "end-of-month" (from anchorDay to last day of month)

ONE-TIME vs RECURRING:
- "в эти выходные"/"this weekend" → ONE-TIME (dateAnchor: {"type": "relative", "value": "this-weekend"}, recurrence: null)
- "каждые выходные"/"every weekend" → RECURRING (recurrence: {"pattern": "weekly", "daysOfWeek": [6, 7]})
- "в выходные после 10 числа ежемесячно" → RECURRING (recurrence: {"pattern": "monthly", "anchorDay": 10, "constraint": "next-weekend"})

FIELD EXAMPLES:
${formatExamples(fields)}

FULL EXAMPLES:

1. "завтра в 9 утра пожарить яичницу"
   → nextAction: "Пожарить яичницу"
   → dateAnchor: {"type": "relative", "value": "tomorrow", "time": "09:00"}
   → dateAnchorEnd: null
   → recurrence: null

2. "оплатить счета с 10 по 15 января"
   → nextAction: "Оплатить счета"
   → dateAnchor: {"type": "absolute", "month": 1, "day": 10}
   → dateAnchorEnd: {"type": "absolute", "month": 1, "day": 15}
   → recurrence: null

3. "передать показания воды ежемесячно с 20 по 25"
   → nextAction: "Передать показания воды"
   → dateAnchor: null
   → dateAnchorEnd: null
   → recurrence: {"pattern": "monthly", "interval": 1, "dayOfMonth": 20}
   Note: dateAnchorEnd for recurring ranges can use offset from dayOfMonth

4. "тренировка по понедельникам и средам в 18:00"
   → nextAction: "Тренировка"
   → dateAnchor: null
   → dateAnchorEnd: null
   → recurrence: {"pattern": "weekly", "interval": 1, "daysOfWeek": [1, 3]}
   Note: time "18:00" should be stored in task properties, not dateAnchor

5. "купить молоко"
   → nextAction: "Купить молоко"
   → dateAnchor: {"type": "none"}
   → dateAnchorEnd: null
   → recurrence: null

6. "в эти выходные помыть машину"
   → nextAction: "Помыть машину"
   → dateAnchor: {"type": "relative", "value": "this-weekend"}
   → dateAnchorEnd: null (weekend already implies Sat-Sun)
   → recurrence: null

7. "в выходные после 10 числа каждого месяца - уборка"
   → nextAction: "Уборка"
   → dateAnchor: null
   → dateAnchorEnd: null
   → recurrence: {"pattern": "monthly", "anchorDay": 10, "constraint": "next-weekend"}

8. "оплатить ЖКХ в ближайшие выходные после 10 числа ежемесячно"
   → nextAction: "Оплатить ЖКХ"
   → dateAnchor: null
   → dateAnchorEnd: null
   → recurrence: {"pattern": "monthly", "anchorDay": 10, "constraint": "next-weekend"}

9. "через 3 дня позвонить врачу"
   → nextAction: "Позвонить врачу"
   → dateAnchor: {"type": "offset", "unit": "days", "amount": 3}
   → dateAnchorEnd: null
   → recurrence: null

10. "в следующий понедельник встреча с клиентом в 14:00"
    → nextAction: "Встреча с клиентом"
    → dateAnchor: {"type": "weekday", "weekday": 1, "modifier": "next", "time": "14:00"}
    → dateAnchorEnd: null
    → recurrence: null

11. "заплатить за интернет до конца каждого месяца с 25 числа"
    → nextAction: "Заплатить за интернет"
    → dateAnchor: null
    → dateAnchorEnd: null
    → recurrence: {"pattern": "monthly", "anchorDay": 25, "constraint": "end-of-month"}

TASK PROPERTIES (for each actionable task, suggest GTD properties):

Context - where/how the task can be done:
- "computer": Requires a computer/laptop
- "phone": Can be done on mobile phone
- "errands": Requires going somewhere (shopping, appointments)
- "home": Can only be done at home
- "anywhere": No specific location/tool required

Energy - mental effort required:
- "high": Requires focus and mental effort
- "medium": Moderate effort required
- "low": Can be done when tired/distracted

Time estimate (in minutes): 5, 15, 30, 60, 120, 240

Guidelines:
- IMPORTANT: Preserve the original language of the input. If input is in Russian, nextAction must be in Russian. If input is in English, nextAction must be in English.
- Next actions should be specific and start with a verb (Call, Email, Write, Buy, Review, etc.)
- Break complex items into multiple tasks if needed
- Thoughts are things to remember but not act on immediately
- Tags for thoughts should be relevant categories
- Return empty arrays if no tasks or thoughts are found
- Return ONLY the raw JSON object, without any markdown formatting or code blocks
- Always include "properties" object for actionable tasks

User input:
`
}

/**
 * Pre-generated prompt (called once at module load for efficiency)
 */
export const TASK_EXTRACTION_PROMPT_GENERATED = generateTaskExtractionPrompt()
