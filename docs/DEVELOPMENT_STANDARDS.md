# Development Standards & Guidelines

## Table of Contents
1. [State Management Standards](#state-management-standards)
2. [Type System Conventions](#type-system-conventions)
3. [Database & API Standards](#database--api-standards)
4. [Component Interface Guidelines](#component-interface-guidelines)
5. [Development Workflow](#development-workflow)
6. [Common Pitfalls & Solutions](#common-pitfalls--solutions)

---

## State Management Standards

### 🏗️ **Architecture Overview**

```
Database Layer (snake_case)
    ↓ (Service Layer transforms)
API Service Layer (camelCase)
    ↓ (Hook Layer manages)
React Hooks (TypeScript interfaces)
    ↓ (Components consume)
UI Components (Props validation)
```

### 📝 **Hook Design Principles**

#### ✅ **DO:**
- **Single Responsibility**: Each hook should manage one domain (sessions, climbs, auth)
- **Consistent Return Interface**: Always return the same structure
- **Error Handling**: Include loading states, error states, and fallbacks
- **Type Safety**: Use strict TypeScript interfaces

```typescript
// ✅ Good Hook Structure
export const useClimbs = () => {
  return {
    // Data
    climbs,
    isLoading,
    error,
    
    // Actions
    addClimb,
    updateClimb,
    deleteClimb,
    
    // Status
    isAddingClimb,
    isUpdatingClimb,
    isDeletingClimb,
  };
};
```

#### ❌ **DON'T:**
- Mix different domains in one hook
- Change return interface without updating all consumers
- Skip error handling or loading states
- Use `any` types

### 🔄 **State Synchronization Rules**

1. **Database First**: Database is the source of truth
2. **Optimistic Updates**: Update UI immediately, rollback on error
3. **Cache Invalidation**: Always invalidate React Query cache after mutations
4. **Local Storage**: Only for temporary session data, not permanent storage

---

## Type System Conventions

### 📋 **Naming Conventions**

| Layer | Example | Convention |
|-------|---------|------------|
| Database | `physical_skills` | snake_case |
| TypeScript Interface | `physicalSkills` | camelCase |
| React Props | `onEditClimb` | camelCase with action prefix |
| Component | `ClimbLogForm` | PascalCase |
| Hook | `useSessionManagement` | camelCase with 'use' prefix |

### 🎯 **Type Definition Standards**

#### **Database Types** (Generated)
```typescript
// ✅ Keep these in sync with actual schema
export interface ClimbingSession {
  id: string;
  default_climb_type: string;  // snake_case from DB
  physical_skills: string[];   // snake_case from DB
}
```

#### **Frontend Types** (Manual)
```typescript
// ✅ Business logic types for components
export interface Session {
  id: string;
  climbingType: string;        // camelCase for frontend
  physicalSkills: string[];    // camelCase for frontend
}
```

#### **Transformation Utilities** (Required)
```typescript
// ✅ Always create bidirectional transformers
export const mapDbSessionToLocal = (db: ClimbingSession): Session => ({
  id: db.id,
  climbingType: db.default_climb_type || 'sport',
  physicalSkills: db.physical_skills || [],
  // ... complete mapping with fallbacks
});

export const mapLocalSessionToDb = (local: Session): Partial<ClimbingSession> => ({
  default_climb_type: local.climbingType,
  physical_skills: local.physicalSkills,
  // ... reverse mapping
});
```

### 🚨 **Type Safety Rules**

1. **No `any` Types**: Use proper interfaces or `unknown`
2. **Runtime Validation**: Validate data from external sources
3. **Null Handling**: Always handle `null` and `undefined`
4. **Default Values**: Provide sensible defaults for optional fields

```typescript
// ✅ Good: Proper null handling
const climbingTypeStyleKey = session.climbingType 
  ? session.climbingType.replace(/\s+/g, '_').toLowerCase()
  : 'boulder'; // Default fallback

// ❌ Bad: Assumes field exists
const climbingTypeStyleKey = session.climbingType.replace(/\s+/g, '_');
```

---

## Database & API Standards

### 🗄️ **Database Field Rules**

1. **snake_case**: All database fields use snake_case
2. **Descriptive Names**: `physical_skills` not `p_skills`
3. **Consistent Types**: Use same types for related fields
4. **Non-null Defaults**: Provide defaults for optional fields

### 📡 **Service Layer Standards**

#### **File Structure**
```
src/services/
├── climbingService.ts    # Database operations
├── importService.ts      # CSV import/export
└── aiAnalysis.ts         # External API calls
```

#### **Service Function Template**
```typescript
// ✅ Standard service function
export const addClimb = async (
  climbData: NewClimbData,
  sessionId: string,
  userId: string
): Promise<Climb> => {
  // 1. Validation
  if (!userId) throw new Error('User not authenticated');
  if (!sessionId) throw new Error('Session ID required');
  
  try {
    // 2. Database operation
    const { data, error } = await supabase
      .from('climbs')
      .insert({ 
        ...climbData, 
        session_id: sessionId,  // Map to DB fields
        user_id: userId 
      })
      .select()
      .single();

    // 3. Error handling
    if (error) throw error;
    if (!data) throw new Error("No data returned");
    
    // 4. Transform and return
    return mapDbClimbToLocal(data);
  } catch (error) {
    console.error('Error in addClimb:', error);
    throw error;
  }
};
```

---

## Component Interface Guidelines

### 🎭 **Component Props Standards**

#### **Handler Props Naming**
```typescript
interface ComponentProps {
  // ✅ Consistent action naming
  onEdit: (item: Item) => void;      // not onEditItem
  onDelete: (item: Item) => void;    // not onDeleteItem  
  onSave: (data: Data) => void;      // not onSaveData
  onCancel: () => void;              // no parameters needed
}
```

#### **Data Props Validation**
```typescript
// ✅ Always validate required vs optional
interface SessionDetailsProps {
  session: Session;                  // Required
  climbs: LocalClimb[];             // Required (use empty array default)
  currentUser: User | null;         // Explicitly nullable
  onClose: () => void;              // Required action
  onEdit?: (session: Session) => void; // Optional action
}

// ✅ Use defaults in component
const SessionDetails = ({ 
  session, 
  climbs = [],  // Default to empty array
  currentUser,
  onClose,
  onEdit
}: SessionDetailsProps) => {
  // Always check required data
  if (!session) return null;
  
  // Safe array operations
  const climbCount = climbs?.length || 0;
```

### 🔌 **Hook Integration Standards**

#### **Component-Hook Contract**
```typescript
// ✅ Hook provides everything component needs
const { 
  // Data (noun)
  sessions,
  selectedSession,
  climbs,
  
  // Status (adjective)
  isLoading,
  error,
  
  // Actions (verb)
  handleSelectSession,
  handleEditSession,
  handleDeleteSession,
} = useSessionHistory();

// ✅ Component uses hook data directly
<SessionList 
  sessions={sessions}
  isLoading={isLoading}
  onSelect={handleSelectSession}
  onEdit={handleEditSession}
  onDelete={handleDeleteSession}
/>
```

---

## Development Workflow

### 🔄 **Before Making Changes**

1. **Check Dependencies**: Who consumes this hook/component?
2. **Review Interfaces**: What contracts will change?
3. **Plan Migrations**: How to update all consumers?
4. **Test Critical Paths**: What user flows might break?

### ✅ **Definition of Done Checklist**

- [ ] TypeScript compiles without errors
- [ ] All tests pass
- [ ] Components render without console errors
- [ ] Database operations include error handling
- [ ] Loading states are handled
- [ ] Null/undefined cases are covered
- [ ] Interface changes updated across all consumers
- [ ] Documentation updated if needed

### 🧪 **Testing Strategy**

```typescript
// ✅ Test the transformation layer
describe('mapDbSessionToLocal', () => {
  it('handles missing optional fields', () => {
    const dbSession = { id: '1', default_climb_type: null };
    const localSession = mapDbSessionToLocal(dbSession);
    expect(localSession.climbingType).toBe('sport'); // Default
  });
});

// ✅ Test component error boundaries  
it('handles undefined climbs prop gracefully', () => {
  render(<SessionDetails session={mockSession} climbs={undefined} />);
  expect(screen.getByText('Climbs (0)')).toBeInTheDocument();
});
```

---

## Common Pitfalls & Solutions

### 🚨 **State Management Antipatterns**

| ❌ **Antipattern** | ✅ **Solution** |
|-------------------|----------------|
| Multiple sources of truth | Use React Query as single cache |
| Hooks calling other hooks inside functions | Extract to component level |
| Missing error boundaries | Add error handling to all async operations |
| Stale closure dependencies | Use useCallback with proper dependencies |
| Direct localStorage in components | Abstract to custom hooks |

### 🔧 **Type System Fixes**

| ❌ **Problem** | ✅ **Solution** |
|---------------|----------------|
| `session.climbingType.replace()` crashes | `session.climbingType?.replace() \|\| 'default'` |
| DB field mismatch | Create transformation utilities |
| Missing prop validation | Use TypeScript interfaces strictly |
| Silent undefined errors | Add runtime validation |

### 📚 **Code Review Checklist**

#### **State Management Changes**
- [ ] Are all hook consumers updated?
- [ ] Are loading/error states handled?
- [ ] Is the data transformation layer correct?
- [ ] Are TypeScript types updated?

#### **Component Changes**  
- [ ] Are props properly validated?
- [ ] Are null/undefined cases handled?
- [ ] Are handler functions properly typed?
- [ ] Is the component tested in isolation?

#### **Database Changes**
- [ ] Are migrations created?
- [ ] Are TypeScript types regenerated?
- [ ] Are service layer mappings updated?
- [ ] Are all CRUD operations tested?

---

## Quick Reference

### 🚀 **Adding New Features**

1. **Database**: Create migration, update schema
2. **Types**: Regenerate database types, update interfaces
3. **Service**: Add CRUD operations with error handling
4. **Hook**: Create/update hook with React Query
5. **Component**: Build UI with proper prop validation
6. **Test**: Add tests for critical paths

### 📞 **Emergency Debugging**

```bash
# Check for type errors
npm run build

# Check for missing dependencies
npm audit

# Reset local state
localStorage.clear()

# Check network requests
# Open DevTools > Network tab

# Check React Query cache
# React Query DevTools in browser
```

---

*This document should be updated whenever new patterns emerge or standards change. Keep it as a living document that reflects the current state of the codebase.*