# Contributing to Route Log Ascend Track

## 🎯 Quick Start

1. **Read the standards**: Review [`docs/DEVELOPMENT_STANDARDS.md`](./docs/DEVELOPMENT_STANDARDS.md)
2. **Check your changes**: Run `npm run build` before committing
3. **Follow the patterns**: Match existing code style and architecture
4. **Test your work**: Verify critical user flows still work

## 🏗️ Development Workflow

### Before You Start
- [ ] Review the [Development Standards](./docs/DEVELOPMENT_STANDARDS.md)
- [ ] Check if your feature affects existing hooks or components
- [ ] Plan how to maintain backward compatibility

### Making Changes

#### **State Management Changes**
```bash
# 1. Update database schema if needed
supabase migration new your_migration_name

# 2. Regenerate types if schema changed
# (This is typically auto-generated)

# 3. Update service layer mappings
# Edit src/services/climbingService.ts

# 4. Update or create hooks
# Follow hook design principles in standards

# 5. Update component interfaces
# Ensure prop types match hook exports

# 6. Test the full flow
npm run build
```

#### **Component Changes**
```bash
# 1. Check existing prop interfaces
# Review what components consume your changes

# 2. Add proper TypeScript types
# No 'any' types allowed

# 3. Handle null/undefined cases
# Always provide fallbacks

# 4. Test with realistic data
# Including edge cases and empty states
```

## 🛡️ Quality Gates

### Required Checks
- [ ] `npm run build` passes without errors
- [ ] No console errors in development
- [ ] Loading states are handled
- [ ] Error states are handled
- [ ] Null/undefined props are handled
- [ ] TypeScript types are properly defined

### Recommended Checks
- [ ] Test with empty data sets
- [ ] Test authentication flows (login/logout)
- [ ] Test on mobile viewport
- [ ] Verify database operations work
- [ ] Check React Query cache invalidation

## 🚨 Common Issues to Avoid

### **State Management**
```typescript
// ❌ Don't: Call hooks inside functions
const handleClick = () => {
  const { data } = useHook(); // This will crash
}

// ✅ Do: Call hooks at component level
const { data } = useHook();
const handleClick = () => {
  // Use data here
}
```

### **Type Safety**
```typescript
// ❌ Don't: Assume fields exist
const name = session.climbingType.replace();

// ✅ Do: Check for null/undefined
const name = session.climbingType?.replace() || 'default';
```

### **Database Operations**
```typescript
// ❌ Don't: Skip error handling
const result = await supabase.from('table').insert(data);

// ✅ Do: Always handle errors
const { data, error } = await supabase.from('table').insert(data);
if (error) throw error;
```

## 📚 Key Files to Understand

### **State Management**
- `src/hooks/useSessionManagement.ts` - Active session state
- `src/hooks/useClimbingSessions.ts` - Database sessions
- `src/hooks/useClimbs.ts` - Database climbs
- `src/hooks/useSessionHistory.ts` - History page state

### **Type Definitions**
- `src/types/climbing.ts` - Frontend types
- `src/integrations/supabase/types.ts` - Database types

### **Service Layer**
- `src/services/climbingService.ts` - Database operations
- `src/contexts/AuthContext.tsx` - Authentication state

## 🔧 Debugging Guide

### **State Issues**
1. Check React Query DevTools (if available)
2. Clear localStorage: `localStorage.clear()`
3. Check Network tab for failed requests
4. Verify user authentication state

### **Type Errors**
1. Run `npm run build` to see all TypeScript errors
2. Check database type mappings in service layer
3. Verify component prop interfaces match hook exports

### **Component Crashes**
1. Check browser console for error details
2. Look for null/undefined property access
3. Verify all required props are provided
4. Check if hook dependencies are properly loaded

## 🎨 Code Style

### **Naming Conventions**
- **Components**: `PascalCase` (e.g., `SessionDetails`)
- **Hooks**: `camelCase` with `use` prefix (e.g., `useSessionManagement`)
- **Props**: `camelCase` (e.g., `onEditClimb`)
- **Database fields**: `snake_case` (e.g., `physical_skills`)
- **TypeScript interfaces**: `PascalCase` (e.g., `LocalClimb`)

### **File Organization**
```
src/
├── components/           # React components
├── hooks/               # Custom hooks
├── services/            # Database/API operations
├── types/               # TypeScript interfaces
├── contexts/            # React contexts
└── utils/               # Helper functions
```

## 📝 Commit Guidelines

### **Commit Message Format**
```
type: Brief description

Longer explanation if needed

- List specific changes
- Include impact on users
- Note any breaking changes
```

### **Types**
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code refactoring
- `docs:` Documentation update
- `style:` Code style changes
- `test:` Test additions/updates

### **Examples**
```bash
# Good commit messages
feat: Add skills tracking to climb logging form
fix: Resolve session duration calculation bug
refactor: Standardize type mappings across hooks

# Bad commit messages  
fix: bug
update: stuff
refactor: code
```

## 🤝 Review Process

### **Self-Review Checklist**
- [ ] Code follows established patterns
- [ ] No TypeScript errors
- [ ] Error handling is present
- [ ] Loading states are handled
- [ ] Backward compatibility is maintained
- [ ] Documentation is updated if needed

### **What Reviewers Look For**
1. **Consistency** with existing codebase
2. **Type safety** and error handling
3. **Performance** implications
4. **User experience** impact
5. **Maintainability** of the code

## 🚀 Deployment

### **Pre-deployment**
- [ ] All tests pass
- [ ] Build completes without errors
- [ ] Database migrations applied (if any)
- [ ] Environment variables updated (if needed)

### **Post-deployment**
- [ ] Verify critical user flows work
- [ ] Check for console errors
- [ ] Monitor for increased error rates
- [ ] Test authentication flows

---

## 💡 Tips for Success

1. **Start Small**: Make incremental changes when possible
2. **Test Early**: Run builds frequently during development
3. **Follow Patterns**: Look at existing code for guidance
4. **Ask Questions**: Better to clarify requirements upfront
5. **Document Changes**: Update docs when adding new patterns

---

*For detailed technical standards, see [`docs/DEVELOPMENT_STANDARDS.md`](./docs/DEVELOPMENT_STANDARDS.md)*