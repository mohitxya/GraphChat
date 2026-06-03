# AnchorAI / DoubtGraph

The chat-based linear interface used by tools like ChatGPT, Gemini, etc., doesn’t work well when you’re learning or trying to understand something new.

Learning doesn’t happen in a straight line. You might have a doubt about one specific section of an LLM’s explanation, but copying that section, pasting it into the chat box, and then scrolling all the way down felt tedious to me.

So I built this.

It lets you take quick detours from any part of an explanation and turns your learning process into an organized mind map.

## Core Idea

1. Ask a root question.
2. Receive a markdown explanation in a graph node.
3. Highlight a phrase, sentence, paragraph, code line, or claim.
4. Ask a doubt about that exact selection.
5. Create a child node connected to the selected span.
6. Repeat recursively.


## Screenshots

Add screenshots here after running the first demo:

#### Root explanation node
![Root node](images/root_exp.png)
#### Highlight popover
![Highlight](images/highlight.png)
#### Branch answer graph
![Branch](images/span_node.png)

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- React Flow
- React Markdown
- Prisma ORM
- PostgreSQL
- OpenAI-compatible chat completions API

## Architecture

![Architecture diagram](images/architecture.png)

## Data Model

```mermaid
erDiagram
  Conversation ||--o{ GraphNode : has
  GraphNode ||--o{ GraphNode : replies_to

  Conversation {
    string id
    string title
  }

  GraphNode {
    string id
    string conversationId
    string content
    string selectedText
    string parentNodeId
  }
```

## API Flow

### Root Generation

```txt
POST /api/generate-root
body: { question }

1. Validate question.
2. Call LLM with root explanation prompt.
3. Create Conversation.
4. Create root GraphNode.
5. Return conversation id.
```

### Span Question

```txt
POST /api/ask-span
body:
{
  conversationId,
  sourceNodeId,
  selectedText,
  startOffset,
  endOffset,
  prefixText,
  suffixText,
  surroundingContext,
  userQuestion
}

1. Load source node and conversation.
2. Build branch path from ancestors.
3. Build prompt from original topic, parent content, selected text, surrounding context, and user question.
4. Call LLM.
5. Create child GraphNode.
6. Create GraphEdge.
7. Create Anchor.
8. Return new graph records.
```

## Context-Building Strategy

The MVP context builder lives in `lib/llm/buildContext.ts`.

It gathers:

- Conversation title / root question
- Parent node content
- Highlighted span
- Surrounding context
- Ancestor branch path
- User's current question

Later versions should add token budgeting, branch summaries, sibling relevance, and pgvector retrieval.

## Span Anchoring Strategy

The selection code lives in `lib/selection/getSelectionOffsets.ts`.

For v1, offsets are measured against the rendered visible text inside a node. This is practical because users select rendered markdown, not raw markdown. The limitation is that offsets may break if the parent node content changes. To make future re-anchoring possible, each anchor also stores:

- `selectedText`
- `prefixText`
- `suffixText`
- `surroundingContext`

Those fields allow quote-based approximate matching later.

## Local Setup

Create the app from scratch with:

```bash
npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir false --import-alias "@/*"
npm install @prisma/client prisma reactflow react-markdown remark-gfm rehype-highlight zustand lucide-react clsx tailwind-merge
npm install -D @types/node
```

This repository already contains the generated files, so from here run:

```bash
npm install
cp .env.example .env
```

Set:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/anchor_ai?schema=public"
OPENAI_API_KEY="sk-..."
OPENAI_BASE_URL="https://api.openai.com/v1"
OPENAI_MODEL="gpt-4o-mini"
```

Then:

```bash
npx prisma migrate dev --name init
npx prisma generate
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Demo Script

1. Enter: `Explain KV cache in transformers.`
2. Wait for the root explanation node.
3. Highlight: `key/value tensors`
4. Ask: `Why K and V but not Q?`
5. A child node appears to the right, connected to the root.
6. Highlight text in the child node and ask another follow-up.


