# Singapore Travel & Navigation Assistant

An agentic Singapore navigation and travel companion integrating **OneMap** (Singapore Land Authority) for search, maps, and routing, with **data.gov.sg** for real-time 2-hour weather forecasts.

## Features

- **Map-First Interface**: Interactive Leaflet map with official OneMap tile layers (`Default`, `Night`, `Grey`), SLA attribution, and dynamic route rendering.
- **OneMap Search & Geocoding**: Real-time address and landmark search across Singapore.
- **Multi-Modal Routing**: Directions for Walking, Driving, Cycling, and Public Transit with accurate distance and travel duration calculations.
- **Live 2-Hour Weather**: Official `data.gov.sg` real-time weather forecasts with area centroid matching across all 47 Singapore weather zones.
- **Agentic AI Assistant**: Powered by `@google/genai` with tool calling (`searchLocation`, `getDirections`, `getWeatherForecast`, `updateTravelMode`, `swapStartAndDestination`, `showLocation`).
- **Interactive Controls**: One-click start/destination swapping, mode selector, turn-by-turn instruction view, and instant map centering.

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or bun

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file from `.env.example`:

```env
GEMINI_API_KEY="your_gemini_api_key"
ONEMAP_TOKEN="" # Optional OneMap API bearer token
```

### Running Locally

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Leaflet, Lucide Icons, Motion
- **Backend**: Express, Vite middleware mode, `@google/genai`
- **APIs**: OneMap API (Singapore Land Authority), data.gov.sg (2-hour weather forecast)
