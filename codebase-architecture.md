# Route Log Ascend Track - Codebase Architecture

This diagram explains the architecture and relationships within the climbing route logging and tracking application.

```mermaid
graph TB
    %% User Interface Layer
    subgraph "Frontend - React + TypeScript"
        subgraph "Pages"
            IndexPage["Index Page<br/>(Session Management)"]
            HistoryPage["History Page<br/>(Past Sessions)"]
            SettingsPage["Settings Page<br/>(User Config)"]
            LoginPage["Login/Auth Pages"]
        end
        
        subgraph "Core Components"
            SessionControl["Session Control<br/>(Start/Pause/End)"]
            ClimbLog["Climb Log Section<br/>(Add Climbs)"]
            RecentSessions["Recent Sessions<br/>(History View)"]
            Navigation["Navigation<br/>(App Navigation)"]
        end
        
        subgraph "UI Components"
            ShadcnUI["shadcn/ui Components<br/>(Button, Dialog, Form, etc.)"]
            CustomComponents["Custom Components<br/>(ClimbLogForm, SessionForm)"]
        end
    end

    %% State Management Layer
    subgraph "State Management"
        AuthContext["Auth Context<br/>(User Authentication)"]
        SessionHook["useSessionManagement<br/>(Session State)"]
        ReactQuery["React Query<br/>(Data Fetching)"]
    end

    %% Data Layer
    subgraph "Data Models"
        ClimbType["Climb Interface<br/>(Route Data)"]
        SessionType["Session Interface<br/>(Climbing Sessions)"]
        GoalType["Goal Interface<br/>(User Goals)"]
        LocalTypes["Local Types<br/>(Frontend State)"]
    end

    %% Backend Integration
    subgraph "Backend - Supabase"
        SupabaseClient["Supabase Client<br/>(Database Connection)"]
        SupabaseAuth["Supabase Auth<br/>(User Management)"]
        SupabaseDB["Supabase Database<br/>(PostgreSQL)"]
        
        subgraph "Database Tables"
            ClimbsTable["climbs table"]
            SessionsTable["climbing_sessions table"]
            GoalsTable["goals table"]
            UsersTable["users table"]
        end
    end

    %% External Services
    subgraph "AI Services"
        AIAnalysis["AI Analysis Service<br/>(Session Analysis)"]
        OpenAI["OpenAI API<br/>(Performance Insights)"]
    end

    %% Build Tools
    subgraph "Development Tools"
        Vite["Vite<br/>(Build Tool)"]
        TypeScript["TypeScript<br/>(Type Safety)"]
        TailwindCSS["Tailwind CSS<br/>(Styling)"]
        ESLint["ESLint<br/>(Code Quality)"]
    end

    %% Connections
    IndexPage --> SessionControl
    IndexPage --> ClimbLog
    IndexPage --> RecentSessions
    
    SessionControl --> SessionHook
    ClimbLog --> SessionHook
    RecentSessions --> ReactQuery
    
    AuthContext --> SupabaseAuth
    SessionHook --> SupabaseClient
    ReactQuery --> SupabaseClient
    
    SupabaseClient --> SupabaseDB
    SupabaseDB --> ClimbsTable
    SupabaseDB --> SessionsTable
    SupabaseDB --> GoalsTable
    SupabaseDB --> UsersTable
    
    AIAnalysis --> OpenAI
    SessionHook --> AIAnalysis
    
    CustomComponents --> ShadcnUI
    Navigation --> AuthContext
    
    ClimbType -.-> ClimbsTable
    SessionType -.-> SessionsTable
    GoalType -.-> GoalsTable
    
    %% Styling
    classDef frontend fill:#e1f5fe
    classDef state fill:#f3e5f5
    classDef data fill:#e8f5e8
    classDef backend fill:#fff3e0
    classDef tools fill:#fce4ec
    classDef ai fill:#f1f8e9
    
    class IndexPage,HistoryPage,SettingsPage,LoginPage,SessionControl,ClimbLog,RecentSessions,Navigation,ShadcnUI,CustomComponents frontend
    class AuthContext,SessionHook,ReactQuery state
    class ClimbType,SessionType,GoalType,LocalTypes data
    class SupabaseClient,SupabaseAuth,SupabaseDB,ClimbsTable,SessionsTable,GoalsTable,UsersTable backend
    class Vite,TypeScript,TailwindCSS,ESLint tools
    class AIAnalysis,OpenAI ai
```

## Application Overview

This is a **climbing route logging and tracking application** built with modern React/TypeScript stack that helps climbers:
- Track climbing sessions in real-time
- Log individual climbs with detailed metrics (grade, type, attempts, etc.)
- Analyze performance with AI-powered insights
- Set and track climbing goals
- Review climbing history and progress

## Key Architecture Components

### Frontend Layer (Light Blue)
- **Pages**: Main application views (Session Management, History, Settings, Authentication)
- **Core Components**: Essential UI components for session control and climb logging
- **UI Components**: shadcn/ui component library + custom climbing-specific components

### State Management (Purple)
- **Auth Context**: Handles user authentication state
- **Session Hook**: Manages active climbing session state and logic
- **React Query**: Handles server state and data fetching/caching

### Data Models (Green)
- **Type Definitions**: TypeScript interfaces for Climb, Session, Goal, and local state types
- Ensures type safety throughout the application

### Backend - Supabase (Orange)
- **PostgreSQL Database**: Stores climbs, sessions, goals, and user data
- **Authentication**: User management and security
- **Client Integration**: Real-time database connection

### AI Services (Light Green)
- **Performance Analysis**: AI-powered insights on climbing sessions
- **OpenAI Integration**: Generates recommendations and progress analysis

### Development Tools (Pink)
- **Vite**: Fast build tool and dev server
- **TypeScript**: Type safety and developer experience
- **Tailwind CSS**: Utility-first styling
- **ESLint**: Code quality and consistency

The application follows modern React patterns with clean separation of concerns, making it maintainable and scalable for tracking climbing progress and performance analytics. 