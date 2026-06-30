import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env'), override: true });

import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

// ─────────────────────────────────────────────
// Provider Detection
// ─────────────────────────────────────────────
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';

const HAS_CLAUDE = ANTHROPIC_KEY.length > 10 && !ANTHROPIC_KEY.includes('your-anthropic-api-key');
const HAS_GEMINI = GEMINI_KEY.length > 10 && !GEMINI_KEY.includes('your-gemini-api-key');
const HAS_OPENROUTER = OPENROUTER_KEY.length > 10;

let anthropicClient = null;
let geminiModel = null;
let openRouterClient = null;

if (HAS_CLAUDE) {
  anthropicClient = new Anthropic({ apiKey: ANTHROPIC_KEY });
  console.log('[PlinthAI] ✓ Claude API configured');
}

if (HAS_OPENROUTER) {
  openRouterClient = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: OPENROUTER_KEY,
  });
  console.log('[PlinthAI] ✓ OpenRouter API configured');
}

// Gemini model priority list — if primary model is rate-limited, try fallbacks
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];
let genAIClient = null;

if (HAS_GEMINI) {
  genAIClient = new GoogleGenerativeAI(GEMINI_KEY);
  geminiModel = genAIClient.getGenerativeModel({
    model: GEMINI_MODELS[0],
    generationConfig: {
      maxOutputTokens: 4096,
      temperature: 0.7,
    },
  });
  console.log(`[PlinthAI] ✓ Gemini API configured (primary: ${GEMINI_MODELS[0]})`);
}

if (!HAS_CLAUDE && !HAS_GEMINI && !HAS_OPENROUTER) {
  console.warn('[PlinthAI] ⚠ No LLM API key configured. Chatbot will use built-in fallback mode.');
}

export const activeProvider = HAS_CLAUDE ? 'claude' : HAS_OPENROUTER ? 'openrouter' : HAS_GEMINI ? 'gemini' : 'fallback';

// ─────────────────────────────────────────────
// Tool Definitions (Claude format — converted for Gemini at call time)
// ─────────────────────────────────────────────
export const toolDefinitions = [
  {
    name: 'get_user_profile',
    description: "Get the current logged-in user's profile including name, role, email, organisation, and the list of projects they belong to.",
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_site_progress',
    description: 'Get current construction progress for a specific project. Returns progress %, status, milestones, and recent site logs with activities, weather, labour count.',
    input_schema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'The MongoDB ObjectId of the project' },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'get_project_summary',
    description: 'Get a comprehensive summary of a project including budget, spent amount, remaining, timeline, team members, location, and all key details.',
    input_schema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'The MongoDB ObjectId of the project' },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'get_material_inventory',
    description: 'Get the organization-wide central material warehouse inventory, including quantities, units, and reorder levels.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_equipment_inventory',
    description: 'Get the organization-wide equipment and machinery inventory, including their status (idle/working), assigned project, daily rates, and rental end dates.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_user_tasks',
    description: "Get the current user's recent site logs and activities across all their projects. Shows what they have been working on recently.",
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_project_expenses',
    description: 'Get expense and budget breakdown for a project including recent expenses and category-wise spending totals.',
    input_schema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'The MongoDB ObjectId of the project' },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'get_project_milestones',
    description: 'Get milestones and timeline for a project, including status, dates, assignees, and approval status.',
    input_schema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'The MongoDB ObjectId of the project' },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'get_user_notifications',
    description: "Get the current user's notifications and alerts. Returns unread count and recent notifications with titles, bodies, and read status.",
    input_schema: {
      type: 'object',
      properties: {
        unread_only: { type: 'boolean', description: 'If true, return only unread notifications. Defaults to false.' },
      },
      required: [],
    },
  },
  {
    name: 'search_construction_knowledge',
    description: 'Search the construction knowledge base for IS codes, CPWD specifications, construction methods, safety standards, and best practices. Use this for ANY technical construction question.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The construction-related search query' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_vendors',
    description: "Get the list of vendors and suppliers for the user's organisation. Returns vendor names, categories (Materials, Labour, Equipment), contact info, pending orders, and total spend.",
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_billing_info',
    description: "Get the current subscription plan, billing status, plan limits, usage statistics, and pricing. Shows how many projects and users are used vs allowed, plan expiry date, and available upgrade options.",
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_team_members',
    description: "Get all team members in the user's organisation. Returns names, roles, emails, and last login dates for every active user in the organisation.",
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];

export function buildSystemPrompt(userContext) {
  if (userContext.isPublic) {
    return `You are **PlinthAI** — a premium AI assistant embedded in **PlinthHQ**, a construction management platform. You are intelligent, professional, warm, and deeply helpful.

You are currently assisting a **public visitor** who is not logged into the platform.

---

## YOUR IDENTITY & PERSONALITY

You are a **general-purpose premium AI assistant** — comparable in quality to ChatGPT, Claude, and Gemini. You happen to be embedded inside a construction management platform, but you can help with ANY topic.

- Be **warm, professional, and conversational**.
- Show personality: light humour is welcome, but always stay respectful and professional.
- NEVER be robotic. NEVER give canned responses.

---

## RESPONSE QUALITY RULES (CRITICAL)

1. **THINK before answering.** Understand the FULL intent behind the user's message.
2. **Be highly concise and readable.** Provide minimal, high-density answers that contain all essential details/answers clearly.
3. **Use rich formatting:** Headings, Bullet points, Bold text, and Tables where appropriate.
4. **Be honest about limitations.** If you don't know something, say so clearly instead of fabricating information.

---

## CAPABILITIES & RESTRICTIONS

### What you CAN do:
- **Explain PlinthHQ**: You can explain what PlinthHQ is, its features (Site Logs, Issue Tracking, Photo Gallery, Labour Attendance, Materials, Budget & Expenses, Reports, Milestones, Documents, Vendor Management), and how it benefits construction companies.
- **Answer Construction Questions**: You have comprehensive knowledge of building, bridge, home, highway, and industrial construction. Structural engineering, RCC and steel design, foundations, MEP, cost estimation, Indian standards (IS codes, CPWD specifications), and site safety protocols. Use the \`search_construction_knowledge\` tool if needed.
- **General Knowledge**: Math, writing, planning, education, research, etc.

### What you CANNOT do (STRICTLY FORBIDDEN):
- You MUST NOT provide any project data, budgets, team information, or site logs.
- If the user asks about "their projects", "my team", "budget", or anything related to user data, you MUST politely explain that they are not logged in and need to sign up or log in to view project-specific information.

---

## ABOUT PlinthHQ

PlinthHQ helps construction teams manage:
- **Daily Site Logs** — Record activities, weather, photos, equipment, remarks
- **Issues & Snags** — Track punch-list items, set priority, assign to contractors, track resolution
- **Photo Gallery** — Centralized project gallery automatically aggregating all photos from logs and issues
- **Labour Attendance** — Track workforce by trade (mason, carpenter, plumber, etc.)
- **Materials** — Log deliveries, track quantities, manage suppliers
- **Budget & Expenses** — Category-wise budgets, expense tracking, approval workflows
- **PDF Reports** — Export automated professional PDF summaries of budget, expenses, and logs
- **Milestones** — Project phases with Gantt-style timeline, owner approvals
- **Documents** — Drawings, BOQs, permits, contracts
- **Vendor Management** — Supplier database
- **Owner Dashboard** — Shareable real-time view for project owners

Now respond to the user's message. Remember: be brilliant, thorough, and genuinely helpful.`;
  }

  const projectList = userContext.projects
    .map((p) => `- ${p.name} (ID: ${p.id}, Status: ${p.status}, Progress: ${p.progress}%)`)
    .join('\n');

  return `You are **PlinthAI** — a premium AI assistant embedded in **PlinthHQ**, a construction management platform. You are intelligent, professional, warm, and deeply helpful.

You are assisting **${userContext.name}** (Role: ${userContext.role}).

Their active projects:
${projectList || '- No projects assigned yet'}

---

## YOUR IDENTITY & PERSONALITY

You are a **general-purpose premium AI assistant** — comparable in quality to ChatGPT, Claude, and Gemini. You happen to be embedded inside a construction management platform, but you can help with ANY topic.

- Be **warm, professional, and conversational** — like a brilliant colleague who genuinely enjoys helping.
- **IMPORTANT**: You MUST use the user's first name (${userContext.name}) naturally in your responses, especially when greeting them or starting a new conversation.
- Show personality: light humour is welcome, but always stay respectful and professional.
- NEVER be robotic. NEVER give canned responses. Every answer should feel freshly crafted.

---

## RESPONSE QUALITY RULES (CRITICAL)

1. **THINK before answering.** Understand the FULL intent behind the user's message. Don't just match keywords.
2. **Be highly concise and readable.** By default, do NOT give massive/huge responses that require scrolling or cannot fit/be read in one page. Provide minimal, high-density answers that contain all essential details/answers clearly.
3. **Only give detailed or full explanations when explicitly instructed** (e.g., if the user says "give full information", "explain in detail", or "full details"). Otherwise, keep answers short, crisp, and to the point.
4. **Use rich formatting:**
   - **Headings** (## and ###) for sections
   - **Bullet points** and **numbered lists** for structured info
   - **Bold** for key terms
   - **Code blocks** with language tags for any code
   - **Tables** when comparing data (use markdown tables)
   - **Examples** whenever they'd help understanding
5. **Ask clarifying questions** when the user's request is ambiguous or missing information. Don't guess blindly.
6. **Provide actionable next steps** at the end of responses when relevant.
7. **Maintain full conversation context.** Remember everything discussed in this session. Reference earlier messages naturally.
8. **Be honest about limitations.** If you don't know something, say so clearly instead of fabricating information.

---

## CAPABILITIES (You can do ALL of these)

### PlinthHQ Platform Data (use tools)
- Project summaries, progress, budgets, expenses
- Site logs, daily activities, labour attendance
- Material inventory and deliveries
- Milestones and timeline tracking
- Notifications and alerts
- Team information
- **Vendor management** — list vendors, contact info, spend tracking
- **Billing & subscription** — current plan, usage stats, limits, pricing, upgrade options
- Construction knowledge (IS codes, CPWD specs, safety standards)

### General Intelligence (answer directly)
- **Coding**: Write, debug, explain, and review code in any language. Generate complete implementations, not snippets.
- **Math & Calculations**: Perform calculations, percentages, unit conversions, cost estimates.
- **Writing**: Emails, reports, proposals, meeting notes, documentation, presentations.
- **Analysis**: Compare options, pros/cons analysis, decision support, market research.
- **Planning**: Create schedules, project plans, task breakdowns, roadmaps.
- **Education**: Explain concepts step-by-step, create learning roadmaps, simplify complex topics.
- **Research**: Technology comparisons, best practices, industry standards.
- **Problem Solving**: Multi-step reasoning, debugging, root cause analysis.
- **Construction Expertise**: Comprehensive knowledge of building, bridge, home, highway, and industrial construction. Structural engineering, RCC and steel design, foundations, MEP, cost estimation, quantity surveying, quality control, Indian standards (IS codes, CPWD specifications), and site safety protocols.

---

## TOOL USE RULES

1. For ANY question about the user's specific data (projects, tasks, budget, notifications, team, progress) — **ALWAYS use the appropriate tool**. Never make up data.
2. If a tool returns \`{"error": "not_authorized"}\`, do NOT reveal the resource exists. Politely redirect.
3. When presenting tool data, format it beautifully — use tables for comparisons, bullet points for lists, bold for key figures.
4. For construction knowledge, use \`search_construction_knowledge\` and **always cite the document + clause** (e.g., [IS 456:2000 §26.5.1.1]).
5. You can call multiple tools if needed to answer a complex question.
6. If tool results don't fully answer the question, combine tool data with your own knowledge to give a complete response.

---

## ABOUT PlinthHQ

PlinthHQ helps construction teams manage:
- **Daily Site Logs** — Record activities, weather, photos, equipment, remarks
- **Issues & Snags** — Track punch-list items, set priority, assign to contractors, track resolution
- **Photo Gallery** — Centralized project gallery automatically aggregating all photos from logs and issues
- **Labour Attendance** — Track workforce by trade (mason, carpenter, plumber, etc.)
- **Materials** — Log deliveries, track quantities, manage suppliers
- **Budget & Expenses** — Category-wise budgets, expense tracking, approval workflows
- **PDF Reports** — Export automated professional PDF summaries of budget, expenses, and logs
- **Milestones** — Project phases with Gantt-style timeline, owner approvals
- **Documents** — Drawings, BOQs, permits, contracts
- **Vendor Management** — Supplier database
- **Owner Dashboard** — Shareable real-time view for project owners
- **Notifications** — Activity alerts and updates
- **Team Management** — User roles (PM, Site Engineer, Admin, Contractor, Owner), invitations

---

## MULTI-TURN CONVERSATION

- Remember ALL previous messages in this conversation.
- Reference earlier context naturally: "As we discussed earlier...", "Building on your question about..."
- If the user asks a follow-up, don't repeat information — build on what was already said.
- Track the user's goals across the conversation and proactively suggest related information.

---

Now respond to the user's message. Remember: be brilliant, thorough, and genuinely helpful.`;
}

// ─────────────────────────────────────────────
// Chat Functions — Claude
// ─────────────────────────────────────────────
export async function chatWithClaude(systemPrompt, messages) {
  if (!anthropicClient) throw new Error('Claude not configured');

  return anthropicClient.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    tools: toolDefinitions,
    messages,
  });
}

// ─────────────────────────────────────────────
// Chat Functions — Gemini
// ─────────────────────────────────────────────

/**
 * Convert Claude-format tool definitions to Gemini function declarations.
 */
function toGeminiFunctionDeclarations() {
  return toolDefinitions.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: {
      type: 'object',
      properties: tool.input_schema.properties || {},
      required: tool.input_schema.required || [],
    },
  }));
}

/**
 * Convert our message history to Gemini's format.
 * Gemini uses { role: 'user'|'model', parts: [...] }
 */
function toGeminiHistory(messages) {
  const geminiHistory = [];

  for (const msg of messages) {
    if (msg.role === 'user') {
      // User messages can be strings or tool_result arrays
      if (typeof msg.content === 'string') {
        geminiHistory.push({ role: 'user', parts: [{ text: msg.content }] });
      } else if (Array.isArray(msg.content)) {
        // Tool results
        const parts = msg.content
          .filter((c) => c.type === 'tool_result')
          .map((c) => ({
            functionResponse: {
              name: c._toolName || 'unknown',
              response: JSON.parse(c.content),
            },
          }));
        if (parts.length > 0) {
          geminiHistory.push({ role: 'user', parts });
        }
      }
    } else if (msg.role === 'assistant' || msg.role === 'model') {
      if (typeof msg.content === 'string') {
        geminiHistory.push({ role: 'model', parts: [{ text: msg.content }] });
      } else if (Array.isArray(msg.content)) {
        const parts = [];
        for (const block of msg.content) {
          if (block.type === 'text' && block.text) {
            parts.push({ text: block.text });
          } else if (block.type === 'tool_use') {
            parts.push({
              functionCall: {
                name: block.name,
                args: block.input || {},
              },
            });
          }
        }
        if (parts.length > 0) {
          geminiHistory.push({ role: 'model', parts });
        }
      }
    }
  }

  return geminiHistory;
}

/**
 * Chat with Gemini. Returns a response in Claude-compatible format for the controller.
 */
export async function chatWithGemini(systemPrompt, messages, _modelIndex = 0) {
  if (!genAIClient) throw new Error('Gemini not configured');

  const geminiHistory = toGeminiHistory(messages.slice(0, -1)); // all but the last
  const lastMessage = messages[messages.length - 1];

  const modelName = GEMINI_MODELS[_modelIndex] || GEMINI_MODELS[0];
  const currentModel = genAIClient.getGenerativeModel({
    model: modelName,
    generationConfig: { maxOutputTokens: 4096, temperature: 0.7 },
  });

  const chatSession = currentModel.startChat({
    history: geminiHistory,
    systemInstruction: { parts: [{ text: systemPrompt }] },
    tools: [{ functionDeclarations: toGeminiFunctionDeclarations() }],
  });

  // Get last message content
  let lastContent;
  if (typeof lastMessage.content === 'string') {
    lastContent = lastMessage.content;
  } else if (Array.isArray(lastMessage.content)) {
    // Tool results
    const parts = lastMessage.content
      .filter((c) => c.type === 'tool_result')
      .map((c) => ({
        functionResponse: {
          name: c._toolName || 'unknown',
          response: JSON.parse(c.content),
        },
      }));
    lastContent = parts;
  } else {
    lastContent = String(lastMessage.content);
  }

  let result;
  try {
    result = await chatSession.sendMessage(lastContent);
  } catch (err) {
    // Handle rate limiting with model fallback and retry
    if (err.message?.includes('429') || err.message?.includes('Too Many Requests') || err.message?.includes('quota')) {
      const nextModelIndex = _modelIndex + 1;
      if (nextModelIndex < GEMINI_MODELS.length) {
        console.log(`[PlinthAI] Rate limited on ${modelName}, trying ${GEMINI_MODELS[nextModelIndex]}...`);
        return chatWithGemini(systemPrompt, messages, nextModelIndex);
      }
      // All models exhausted — wait and retry the last one once
      console.log(`[PlinthAI] All models rate-limited. Waiting 5s and retrying ${modelName}...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      result = await chatSession.sendMessage(lastContent);
    } else {
      throw err;
    }
  }
  const response = result.response;

  // Convert Gemini response to Claude-compatible format
  const content = [];
  let stopReason = 'end_turn';

  for (const candidate of response.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      if (part.functionCall) {
        content.push({
          type: 'tool_use',
          id: `toolu_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          name: part.functionCall.name,
          input: part.functionCall.args || {},
        });
        stopReason = 'tool_use';
      } else if (part.text) {
        // gemini-2.5-flash may include 'thought' parts — skip those, only keep actual text
        if (!part.thought) {
          content.push({ type: 'text', text: part.text });
        }
      }
    }
  }

  // If no content was extracted, try alternative extraction methods
  if (content.length === 0) {
    try {
      const text = response.text?.();
      if (text) {
        content.push({ type: 'text', text });
      }
    } catch { /* response.text() can throw if there are no text parts */ }
  }

  // Final fallback — never return empty content
  if (content.length === 0) {
    content.push({ type: 'text', text: "I'm processing your request. Could you please try again?" });
  }

  return { content, stop_reason: stopReason };
}

// ─────────────────────────────────────────────
// Chat Functions — OpenRouter
// ─────────────────────────────────────────────

function toOpenRouterFunctionDeclarations() {
  return toolDefinitions.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: tool.input_schema.properties || {},
        required: tool.input_schema.required || [],
      },
    }
  }));
}

function toOpenRouterHistory(messages, systemPrompt) {
  const history = [{ role: 'system', content: systemPrompt }];

  for (const msg of messages) {
    if (msg.role === 'user') {
      if (typeof msg.content === 'string') {
        history.push({ role: 'user', content: msg.content });
      } else if (Array.isArray(msg.content)) {
        const parts = msg.content
          .filter((c) => c.type === 'tool_result')
          .map((c) => ({
            role: 'tool',
            tool_call_id: c.tool_use_id,
            content: c.content,
          }));
        history.push(...parts);
      }
    } else if (msg.role === 'assistant') {
      if (typeof msg.content === 'string') {
        history.push({ role: 'assistant', content: msg.content });
      } else if (Array.isArray(msg.content)) {
        const textParts = msg.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
        const toolCalls = msg.content
          .filter(b => b.type === 'tool_use')
          .map(b => ({
            id: b.id,
            type: 'function',
            function: {
              name: b.name,
              arguments: JSON.stringify(b.input || {})
            }
          }));
        
        history.push({
          role: 'assistant',
          content: textParts || null,
          tool_calls: toolCalls.length > 0 ? toolCalls : undefined
        });
      }
    }
  }

  return history;
}

export async function chatWithOpenRouter(systemPrompt, messages) {
  if (!openRouterClient) throw new Error('OpenRouter not configured');

  const openRouterHistory = toOpenRouterHistory(messages, systemPrompt);

  const response = await openRouterClient.chat.completions.create({
    model: 'openrouter/free',
    messages: openRouterHistory,
    tools: toOpenRouterFunctionDeclarations(),
  });

  const msg = response.choices[0].message;
  
  const content = [];
  let stopReason = 'end_turn';

  if (msg.content) {
    content.push({ type: 'text', text: msg.content });
  }

  if (msg.tool_calls && msg.tool_calls.length > 0) {
    stopReason = 'tool_use';
    for (const tool of msg.tool_calls) {
      content.push({
        type: 'tool_use',
        id: tool.id,
        name: tool.function.name,
        input: JSON.parse(tool.function.arguments || '{}'),
      });
    }
  }

  if (content.length === 0) {
    content.push({ type: 'text', text: "I'm processing your request. Could you please try again?" });
  }

  return { content, stop_reason: stopReason };
}

// ─────────────────────────────────────────────
// Unified Interface
// ─────────────────────────────────────────────

/**
 * Primary chat function. Tries Claude first, then Gemini.
 */
export async function chat(systemPrompt, messages) {
  if (HAS_CLAUDE) {
    try {
      return await chatWithClaude(systemPrompt, messages);
    } catch (err) {
      console.error('[PlinthAI] Claude error, trying fallback:', err.message);
      if (HAS_OPENROUTER) return chatWithOpenRouter(systemPrompt, messages);
      if (HAS_GEMINI) return chatWithGemini(systemPrompt, messages);
      throw err;
    }
  }

  if (HAS_OPENROUTER) {
    return chatWithOpenRouter(systemPrompt, messages);
  }

  if (HAS_GEMINI) {
    return chatWithGemini(systemPrompt, messages);
  }

  throw new Error('No LLM provider configured');
}

/**
 * Continue conversation after tool results.
 */
export async function continueWithToolResults(systemPrompt, messages) {
  return chat(systemPrompt, messages);
}
