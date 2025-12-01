# Pulse AI

An intelligent context management application that helps you track conversations, extract action items, and stay on top of your work across multiple communication platforms.

## Features

### 🤖 AI-Powered Processing
- **Action Item Extraction**: Automatically identifies tasks and action items from emails, meetings, and messages
- **Thread Summarization**: AI-generated summaries of conversation threads
- **Smart Suggestions**: Contextual recommendations for follow-ups, meetings, and next steps
- **Content Classification**: Auto-categorization and tagging of incoming content

### 🔗 Integrations
- **Gmail**: Import emails and email threads
- **Google Calendar**: Sync meetings and extract action items from meeting notes
- **Slack**: Import messages and threads from your workspace

### 📊 Thread Management
- Visual timeline of all communications
- Status tracking (active, stale, blocked, completed)
- Priority management
- Participant tracking
- Tag-based organization

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- OpenAI API key
- Google Cloud credentials (for Gmail/Calendar)
- Slack App credentials (for Slack integration)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/pulse-ai.git
cd pulse-ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your `.env.local` file with your API credentials:
```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Google OAuth (Gmail & Calendar)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Slack
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Setting Up Integrations

#### Google (Gmail & Calendar)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Gmail API and Google Calendar API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/integrations/gmail/callback`
   - `http://localhost:3000/api/integrations/calendar/callback`

#### Slack
1. Go to [Slack API](https://api.slack.com/apps)
2. Create a new app
3. Add required OAuth scopes:
   - `channels:history`, `channels:read`
   - `groups:history`, `groups:read`
   - `im:history`, `im:read`
   - `search:read`, `users:read`, `users:read.email`
4. Add redirect URL: `http://localhost:3000/api/integrations/slack/callback`

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── ai/           # AI processing endpoints
│   │   ├── integrations/ # OAuth & data fetching
│   │   └── sync/         # Data synchronization
│   ├── settings/         # Settings page
│   └── threads/          # Thread detail pages
├── components/            # React components
│   └── ui/               # Reusable UI components
├── hooks/                 # Custom React hooks
│   ├── useAI.ts          # AI processing hook
│   ├── useIntegrations.ts # Integration status hook
│   ├── useDataFetching.ts # Data fetching hook
│   └── useSync.ts        # Sync operations hook
├── lib/                   # Core libraries
│   ├── ai/               # OpenAI integration
│   ├── integrations/     # Third-party integrations
│   └── services/         # Business logic
└── types/                 # TypeScript types
```

## API Reference

### AI Endpoints (`/api/ai`)
- `extract-action-items`: Extract tasks from text
- `summarize`: Generate thread summaries
- `suggestions`: Get smart suggestions
- `classify`: Classify and tag content
- `find-related`: Find related threads

### Integration Endpoints
- `/api/integrations/gmail`: Gmail operations
- `/api/integrations/calendar`: Calendar operations
- `/api/integrations/slack`: Slack operations
- `/api/sync`: Sync all connected sources

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: OpenAI GPT-4
- **APIs**: Gmail API, Google Calendar API, Slack Web API

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

## License

MIT License - see LICENSE file for details
