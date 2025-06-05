# Development Standards Compliance TODO

## I. Type System Conventions

### A. Type Safety Rules

#### 1. No `any` Types (DEVELOPMENT_STANDARDS.md Rule: TS-4.1)

The following files and lines use `any` type and should be updated to use specific types or `unknown` with proper type checking:

-   **File:** `src/pages/History.tsx`
    -   ~~Line 187: `handleEditClimb(climb as any)`~~ (Resolved: Used `mapDbClimbToLocalClimb` utility in the "All Climbs" tab action)
    -   ~~Line 190: `handleDeleteClimb(climb as any)`~~ (Resolved: Used `mapDbClimbToLocalClimb` utility in the "All Climbs" tab action)
-   **File:** `src/services/climbingService.ts`
    -   ~~Line 14: `const handleSupabaseError = (error: any, context: string) => {`~~ (Resolved: Changed `error: any` to `error: PostgrestError | null`)
-   **File:** `src/lib/importValidation.ts`
    -   ~~Line 32: `function isNonNegativeInteger(value: any): boolean {`~~ (Resolved: Changed `value: any` to `value: unknown`)
    -   ~~Line 41: `function isPositiveNumber(value: any): boolean {`~~ (Resolved: Changed `value: any` to `value: unknown`)
-   **File:** `src/lib/importTemplates.ts`
    -   ~~Line 9: `export type GenericJsonClimbObject = Record<string, any>;`~~ (Resolved: Changed to `Record<string, unknown>`)
    -   ~~Line 19: `rawRow: Record<string, any>,`~~ (Resolved: Changed to `Record<string, unknown>` in `ImportMappingTemplate`)
    -   Line 33: `(p as any)[f]=n` (and similar occurrences on lines 40, 47, 54, 60) - Note: These `any` casts within minified `transform` functions remain. Addressing them fully requires refactoring these functions for readability (see SM-6.4 TODO for this file).
-   **File:** `src/lib/utils.ts`
    -   ~~Line 45: `climbs?: any[] }>(session: T): T => {`~~ (Resolved: Changed `any[]` to `Partial<Pick<LocalClimb, 'timestamp'>>[]` in `parseSessionDates`)
-   **File:** `src/components/PendingVoiceLogsList.tsx`
    -   ~~Line 22: `session_details: any;`~~ (Resolved: Changed to `Partial<Session>` within `Preview.extracted_data_json`)
    -   ~~Line 23: `climbs: any[];`~~ (Resolved: Changed to `Partial<LocalClimb>[]` within `Preview.extracted_data_json`)
-   **File:** `src/components/ImportCsvForm.tsx`
    -   ~~Line 29: `data: Record<string, any>[];`~~ (Resolved: Changed to `Record<string, unknown>[]` in `ParsedDataState`)
    -   ~~Line 212: `} catch (err: any) {`~~ (Resolved: Changed to `err: unknown` with type narrowing)
    -   Line 306 (approx): `TARGET_CLIMB_FIELDS.includes(targetField as any)` (Partially resolved: Cast changed to `targetField as string` within `(TARGET_CLIMB_FIELDS as string[]).includes(...)`. The core logic of comparing potentially disparate key sets remains complex.)
    -   Lines 311-323 (approx): `(baseCsvClimb as any)[targetField] = ...` (Note: These `any` casts on `baseCsvClimb` for dynamic assignments remain. Similar to `importTemplates.ts`, requires refactoring of the transformation logic - see SM-6.4.)
    -   ~~Line 341 (approx): `} catch (error: any) {`~~ (Resolved: Changed to `error: unknown` with type narrowing in `handleSubmit`)
    -   Line 336 (approx): `setImportResult(result as any)` (Note: An `as any` cast was temporarily added here to suppress a type mismatch error between `importClimbsFromCsv` return type and `importResult` state. This points to a deeper issue requiring functional review/refactor of `handleSubmit` or `importClimbsFromCsv` service - see SM-6.4.)
-   **File:** `src/hooks/useDebounce.ts`
    -   ~~Line 1: `export function useDebounce<T>(value: T, delay: number): T {`~~ (Resolved: File not found, presumed deleted/moved)
    -   ~~Line 7: `handler: any;`~~ (Resolved: File not found, presumed deleted/moved)
-   **File:** `src/components/HistoryDialogs.tsx`
    -   ~~Line 33: `editForm: any;`~~ (Resolved: Changed to `EditFormShape (Partial<LocalClimb & Session>)`. Related prop `setEditForm` also updated.)
-   **File:** `src/components/BulkManualEntryForm.tsx`
    -   Line 43: `(climbToUpdate as any)[field] = value;` (Note: This `any` cast for dynamic assignment remains. Requires refactoring of component logic for full type safety - see SM-6.4.)
    -   ~~Line 161: `} catch (error: any) {`~~ (Resolved: Changed to `error: unknown` with type narrowing)
-   **File:** `src/services/VoiceLogExtractionService.ts`
    -   ~~Line 110: `let parsed: any;`~~ (Resolved: Changed to `unknown` with subsequent assertions)
    -   ~~Line 137: `parsed.climbs.forEach((climb: any, index: number) => {`~~ (Resolved: `climb` changed to `unknown` with subsequent assertions)
    -   ~~Line 158: `parsed.climbs = parsed.climbs.map((climb: any) => ({`~~ (Resolved: `climb` changed to `unknown` with subsequent assertions)
-   **File:** `src/services/aiAnalysis.ts`
    -   ~~Line 46: `const data = await response.json();`~~ (Resolved: Explicitly typed `data` with an interface for the API response)
-   **File:** `src/contexts/AuthContext.tsx`
    -   ~~Line 9: `signIn: (email: string, password: string) => Promise<{ error: any }>;`~~ (Resolved: Changed to `Promise<{ error: AuthError | Error | null }>`. Catch block error type also updated.)
    -   ~~Line 10: `signUp: (email: string, password: string) => Promise<{ error: any }>;`~~ (Resolved: Changed to `Promise<{ error: AuthError | Error | null }>`. Catch block error type also updated.)
    -   ~~Line 12 (original COMPLIANCE_TODO item): `signOut: () => Promise<{ error: any }>`~~ (Resolved: signOut definition is `Promise<void>`, `catch` block updated to use `unknown`. No `any` in signature.)
    -   ~~Line 38 (approx): `} catch (error: any) {`~~ (Resolved: Changed to `error: unknown` in `signIn`)
    -   ~~Line 48 (approx): `} catch (error: any) {`~~ (Resolved: Changed to `error: unknown` in `signUp`)
    -   ~~Line 57 (approx): `} catch (error: any) {`~~ (Resolved: Changed to `error: unknown` in `signOut`)

**Note:** Instances of `expect.any()` in test files (`*.test.ts`) are generally acceptable for mocking and are not listed here as violations. Lines from `supabase/functions` are also omitted as the request was for `/src`. Comments mentioning "any" are also ignored.

## II. State Management Standards

### A. Hook Design Principles (SM-2)

#### 1. Hook Naming Convention (TS-1 `use` prefix)

-   All hooks in `src/hooks` appear to follow the `use` prefix and `camelCase` convention. This seems generally compliant.

#### 2. Consistent Return Interface & Error Handling

-   **File:** `src/hooks/useAuthForm.ts`
    -   **Return Structure (SM-2.1):** The hook returns `email`, `password`, `error`, and action handlers.
        -   ~~Lacks distinct `isSubmitting` or action-specific status flags~~ (Resolved: Added `isSigningIn` and `isSigningUp` flags; removed general `isLoading` flag).
        -   The `email` and `password` could be considered `data` for a form hook, but it's not explicitly structured under a `data` key. (Note: This remains a consideration for future refactoring but not a direct violation of the primary issue of status flags).
-   **File:** `src/hooks/useClimbingSessions.ts`
    -   **Return Structure (SM-2.1):** Compliant. Returns `sessions` (data), `isLoading`, `error`, actions (`addSession`, `updateSession`, `deleteSession`), and statuses (`isAddingSession`, `isUpdatingSession`, `isDeletingSession`).
    -   **Error Handling (SM-2.1):** Compliant. Uses `isLoading`, `error` from `useQuery` and `onError` in mutations.
    -   **Transformation Utilities (TS-2.3 related):** (Resolved: Extracted mapping to `mapDbSessionToLocalSession` utility in `src/lib/utils.ts`)
        -   **TODO (TS-2.3):** Consider extracting this mapping to a dedicated `mapDbSessionToLocal` utility function as per `DEVELOPMENT_STANDARDS.md (TS-2.3)`.
        -   Also, ensure a corresponding `mapLocalSessionToDb` exists if sessions are sent back in that format. (Note: This remains a consideration. `useClimbingSessions` mutations currently expect `NewSessionData`/`UpdateSessionData`, not a local `Session` object for conversion.)
    -   **Cache Invalidation (SM-3.3):** Compliant. Uses `queryClient.invalidateQueries` after mutations.
-   **File:** `src/hooks/useClimbs.ts`
    -   **Return Structure (SM-2.1):** Compliant. Returns `climbs` (data), `isLoading`, `error`, actions (`addClimb`, `updateClimb`, `deleteClimb`), and statuses (`isAddingClimb`, `isUpdatingClimb`, `isDeletingClimb`).
    -   **Error Handling (SM-2.1):** Compliant.
    -   **Cache Invalidation (SM-3.3):** Compliant. Uses `queryClient.invalidateQueries` after mutations.
    -   **Data Transformation (TS-2.3 related):** Assumes `climbingService` handles transformations to the local `Climb` type, which is aligned with standards. No issues noted here directly in the hook.
-   **File:** `src/hooks/useGradeSettings.ts`
    -   **Return Structure (SM-2.1):**
        -   Provides data (`preferredRouteGradeSystem`, `preferredBoulderGradeSystem`) and setters.
        -   (Resolved: Added `isLoading` [set to `false` after mount] and `error` [set if `localStorage` operations fail in handlers] states.)
        -   (Resolved: Added `isUpdatingRouteSystem` and `isUpdatingBoulderSystem` flags.)
    -   **Local Storage Usage (SM-3.4 & SM-5):** This hook uses `useLocalStorage` for user preferences. Standard SM-3.4 says "Only for temporary session data, not permanent storage".
        -   **TODO (SM-3.4/SM-5):** Clarify if user preferences stored in `localStorage` via a hook align with standards, or if they should be moved to a database if considered "permanent storage". The current abstraction into a hook is good practice.
-   **File:** `src/hooks/useLocalStorage.ts`
    -   **Naming Convention (TS-1):** Compliant (`useLocalStorage`).
    -   **Return Structure (SM-2.1):** Returns `[storedValue, setValue]` (useState-like tuple). This is a common pattern for utility hooks and likely not intended to be covered by the specific object structure outlined in SM-2.1 for domain/data hooks. Compliant for its type.
    -   **Error Handling:** Handles `localStorage` access errors with `try-catch` and warnings. Appropriate for a utility hook.
    -   **Local Storage Abstraction (SM-5):** This hook itself is the recommended abstraction for `localStorage` usage. Compliant.
-   **File:** `src/hooks/useLocationSettings.ts`
    -   **Naming Convention (TS-1):** Compliant (`useLocationSettings`).
    -   **Return Structure (SM-2.1):**
        -   Provides data (`savedLocations`) and actions (`addLocation`, `deleteLocation`, `editLocation`).
        -   (Resolved: Added `isLoading` [set to `false` after mount] and `error` [set if `localStorage` operations fail in handlers] states.)
        -   (Resolved: Added `isAddingLocation`, `isDeletingLocation`, and `isEditingLocation` flags.)
    -   **Local Storage Usage (SM-3.4 & SM-5):** Manages user-defined locations in `localStorage`.
        -   **TODO (SM-3.4/SM-5):** Similar to `useGradeSettings.ts`, clarify if this usage aligns with "temporary session data" vs. "permanent storage". The abstraction is good.
-   **File:** `src/hooks/useSessionForm.ts`
    -   **Naming Convention (TS-1):** Compliant (`useSessionForm`).
    -   **Return Structure (SM-2.1, and SM-2.1 example `useForm`):**
        -   Provides form field states and handlers.
        -   (Resolved: Added `isSubmitting` and `error` states for submission management.)
        -   (Resolved: Added `isSubmitting` flag.)
    -   **Error Handling (SM-2.1):** (Resolved: Added `error` state for validation and submission errors. Validation now sets this state.)
        -   (Resolved: Validation now sets the `error` state, which is returned by the hook.)
    -   **Props:** Takes an `onSubmit` prop. (Resolved: `onSubmit` prop type changed to `Promise<void>`, and `handleSubmit` now manages `isSubmitting` and `error` states around its execution.)
-   **File:** `src/hooks/useClimbForm.ts`
    -   **Naming Convention (TS-1):** Compliant (`useClimbForm`).
    -   **Return Structure (SM-2.1, and SM-2.1 example `useForm`):**
        -   Provides form field states and handlers.
        -   **TODO (SM-2.1):** Lacks `isLoading` and `error` states for submission. (Resolved: Added `isSubmitting` and `error` states for submission management.)
        -   **TODO (SM-2.1):** Lacks a specific `isSubmitting` status flag. (Resolved: Added `isSubmitting` flag.)
    -   **Error Handling (SM-2.1):** Lacks `error` state for submission. Basic validation logs to console. (Resolved: Added `error` state for validation and submission errors. Validation now sets this state.)
        -   **TODO:** Improve validation feedback. (Resolved: Validation now sets the `error` state, which is returned by the hook.)
    -   **Props:** Takes an `onSubmit` prop. The hook should manage `isLoading`/`error`/`isSubmitting` around this callback. (Resolved: `onSubmit` prop type changed to `Promise<void>`, and `handleSubmit` now manages `isSubmitting` and `error` states around its execution.)
-   **File:** `src/hooks/useSessionHistory.ts`
    -   **Naming Convention (TS-1):** Compliant (`useSessionHistory`).
    -   **Return Structure (SM-2.1):** Returns a mix of data, loading states from underlying hooks, UI state, and many handlers. It doesn't strictly adhere to the single `data: {}`, `isLoading`, `error`, `actions: {}`, `status: {}` structure.
        -   **TODO (SM-2.1):** Review if the return signature should be refactored for better adherence to the standard hook structure, or if its role as a UI orchestrator justifies the current structure.
    -   **Transformation Utilities (TS-2.3):**
        -   Performs inline mapping from `Climb` to `LocalClimb` within `climbsForSelectedSession`.
            -   **DONE (TS-2.3):** Utility `mapDbClimbToLocalClimb` created in `src/lib/utils.ts`. `useSessionHistory` can now be updated to use this utility to replace its inline mapping for `climbsForSelectedSession`.
        -   Inline mapping in `handleSaveSession` from `Partial<Session>` to `UpdateSessionData`.
            -   **TODO (TS-2.3):** Consider if this simple mapping also warrants a utility.
    -   **Anti-Patterns (SM-5):**
        -   **Complex Hook Logic:** The hook manages selection, multiple dialog states, analysis drawer, and related actions for the session history view.
            -   **TODO (SM-5):** Evaluate splitting `useSessionHistory` into smaller, focused hooks (e.g., `useSessionSelection`, `useHistoryDialogManager`) to improve maintainability.
-   **File:** `src/hooks/useSessionManagement.ts`
    -   **Naming Convention (TS-1):** Compliant (`useSessionManagement`).
    -   **Return Structure (SM-2.1):**
        -   Returns `currentSession`, `sessions`, local `climbs`, `sessionTime`, and action handlers.
        -   **TODO (SM-2.1):** Lacks direct, exposed `isLoading` or `error` states for its own async operations (e.g., `startSession`). Consider adding specific loading/status flags (e.g., `isStartingSession`) and an error state. (Resolved: Added `isStartingSession`, `isEndingSession`, `isAddingClimb`, (placeholders for `isUpdatingClimb`, `isDeletingClimb`) and `error` states. Async operations now manage these.)
    -   **State Synchronization Rules (SM-3):**
        -   **Local Storage Usage (SM-3.4):** Compliant. Uses `localStorage` for active session data.
        -   **Optimistic Updates (SM-3.2):**
            -   `addClimb` correctly implements optimistic updates. Compliant.
            -   **TODO (SM-3.2):** `updateClimb` and `deleteClimb` in this hook modify only local state. Clarify if they should also implement optimistic updates with the backend. (Note: These functions are currently stubbed as TODOs in the hook; full implementation pending.)
    -   **Type System Conventions (TS-2):**
        -   **Transformation Utilities (TS-2.3):**
            -   `resumeEndedSession` maps `Climb` to `LocalClimb` inline. **TODO (TS-2.3):** Extract to `mapDbClimbToLocalClimb`. (Resolved: `resumeEndedSession` now uses `mapDbClimbToLocalClimb`.)
            -   `addClimb` maps local climb data to `NewClimbData` inline. **TODO (TS-2.3):** Extract to `mapLocalClimbToNewClimbData`. (Resolved: `addClimb` now uses updated `mapLocalClimbToNewClimbData` with session context.)
    -   **Anti-Patterns (SM-5):**
        -   **Complex Hook Logic (SM-5):** Hook is large, manages active session lifecycle, local climbs, `localStorage`, and DB orchestration.
            -   **TODO (SM-5):** Evaluate for potential simplification or splitting.
-   **File:** `src/hooks/useSkillsSettings.ts`
    -   **Naming Convention (TS-1):** Compliant (`useSkillsSettings`).
    -   **Return Structure (SM-2.1):**
        -   Provides data (`physicalSkills`, `technicalSkills`) and action handlers.
        -   **TODO (SM-2.1):** Lacks `isLoading` and `error` states, similar to other settings hooks using `localStorage`. (Resolved: Added `isLoading` and `error` states.)
        -   **TODO (SM-2.1):** Lacks status flags (e.g., `isAddingSkill`). (Resolved: Added `isAddingPhysicalSkill`, `isDeletingPhysicalSkill`, `isEditingPhysicalSkill`, and similar for technical skills.)
    -   **Local Storage Usage (SM-3.4 & SM-5):** Manages user-customized skill lists in `localStorage`.
        -   **TODO (SM-3.4/SM-5):** Clarify if this usage for persistent settings aligns with "temporary session data". The abstraction is good.
    -   **Code Structure:** Uses an internal `manageSkill` helper function. Compliant and good practice.
-   **File:** `src/hooks/use-toast.ts`
    -   **Naming Convention (TS-1):** Compliant (`useToast`).
    -   **Return Structure (SM-2.1):** Returns toast state, a `toast` function, and `dismiss` function. Appropriate for its purpose as a UI notification system. Compliant for its type.
    -   **State Management Principles (SM-4, SM-4.1):**
        -   Implements a global-like state for toasts using a reducer and listener pattern.
        -   **Side Effects in Reducer (SM-4.1):** The `DISMISS_TOAST` case in the reducer has a side effect (`addToRemoveQueue`).
            -   **TODO (SM-4.1):** Refactor the side effect out of the reducer to maintain purity. (Resolved: Side effect moved from reducer to `dispatch` function.)
-   **File:** `src/hooks/use-mobile.tsx`
    -   **Naming Convention (TS-1):** Compliant (`useIsMobile`).
    -   **Return Structure (SM-2.1):** Returns a boolean. Appropriate for a utility hook. Compliant for its type.
    -   **Client-Side Specifics & Initial Render:**
        -   Relies on browser-specific APIs (`window.matchMedia`, `window.innerWidth`).
        -   Initial state is effectively `false` before client-side `useEffect` runs.
        -   **TODO (UI-UX / SSR Consideration):** Consider implications for SSR or initial layout flash if strict consistency is required. For many client-side apps, this is acceptable.

## III. Database & API Standards

### A. Service Layer Standards (DB-2)

-   **File:** `src/services/climbingService.ts`
    -   **File Structure (DB-2.1):** Compliant. Contains DB operations for climbs and sessions.
    -   **Service Function Template (DB-2.2) & Transformation (TS-2.3):**
        -   **Validation:** Most `add*` functions have good initial validation. `fetch*`, `update*`, and some `delete*` functions could benefit from stricter upfront parameter validation (e.g., throwing an Error for missing IDs instead of returning empty or letting DB handle it).
            -   **TODO (DB-2.2):** Add/strengthen upfront parameter validation for `fetchSessions`, `fetchClimbsBySessionId`, `fetchAllUserClimbs`, `updateSession`, `updateClimb`, `deleteSession`, `deleteClimb` to throw errors if required parameters are missing.
        -   **Database Operations & Error Handling:** Generally compliant. Uses `supabase` client correctly and has robust error handling with `handleSupabaseError` and `try/catch` blocks.
        -   **Transformation & Return Types:** Functions currently perform inline mapping, type assertions (e.g., `session.location_type as 'indoor' | 'outdoor'`), and default assignments when returning data. The return types are often the DB-aligned types (`ClimbingSession`, `Climb`) rather than distinct local/frontend types (e.g., `Session`, `LocalClimb`).
            -   **TODO (DB-2.2 & TS-2.3):** Consistently use dedicated transformation utilities (e.g., `mapDbSessionToLocalSession`, `mapDbClimbToLocalClimb`) as defined in `DEVELOPMENT_STANDARDS.md (TS-2.3)`. Service functions should return the local/frontend types, not DB-aligned types if they differ. Update function signatures accordingly.
    -   **Database Field Rules (DB-1):** Compliant. DB interactions use `snake_case` fields.
    -   **Error Helper `handleSupabaseError` (TS-4.1):**
        -   The `error` parameter is typed as `any`.
            -   **TODO (TS-4.1):** Change `error: any` to a stricter type (e.g., `PostgrestError | Error | null` or `unknown` with type checking) in `handleSupabaseError` (Line 14).

-   **File:** `src/services/importService.ts`
    -   **File Structure (DB-2.1):** Compliant. Contains CSV import/export logic.
    -   **Service Function Analysis (DB-2.2 Style):**
        -   **`importClimbsFromCsv`:**
            -   **Validation:** Good. Checks for parsing errors and missing required fields per row, throwing errors.
            -   **Transformation:** Transforms CSV rows to `LocalClimb` objects, including type conversions and default values. Directly produces frontend types.
            -   **TODO (Data Validation/TS-4.1):** For `row.ticktype as LocalClimb['tickType']`, consider adding explicit validation that `row.ticktype` is a valid value before assertion, or ensure the default fallback is robustly handled if the assertion isn't safe.
            -   **(Minor Consideration):** The standard service template often includes `userId`. If any import logic could become user-dependent, this might be a future consideration.
        -   **`exportClimbsToCsv`:**
            -   **Validation:** Assumes valid `LocalClimb[]` input. 
                -   **TODO (Minor):** Consider adding basic validation for the input `climbs` array if it could come from less trusted sources.
            -   **Transformation:** Correctly maps `LocalClimb[]` to CSV string using `Papa.unparse`.
    -   **Database Interaction:** N/A for this service. It prepares data for, or processes data from, other services/sources.

-   **File:** `src/services/VoiceLogExtractionService.ts`
    -   **File Structure (DB-2.1 Style):** Compliant. Handles interaction with an external AI API (OpenRouter), fitting the pattern of specialized service files.
    -   **Service Function Analysis (External API Interaction):**
        -   **Constructor & `extractDataFromTranscript`:**
            -   **Validation:** Good. Constructor validates API key. `extractDataFromTranscript` handles API response errors (status codes, missing data) and includes `try/catch`.
            -   **API Operation:** Correctly constructs prompts and makes `fetch` call to OpenRouter.
            -   **Transformation & Return:** Parses and validates AI JSON output string against defined interfaces (`VoiceLogExtractionResult`). Includes logic to strip markdown from AI response. Applies defaults for optional fields. This is robust.
        -   **`parseAndValidateExtraction` (Helper):**
            -   **Validation:** Excellent. Performs thorough structural validation of the parsed JSON against expected types and constraints (e.g., enum values for `tick_type`).
    -   **Type System Conventions (TS-1, TS-2):** Compliant. Clear interfaces defined for AI output (`ExtractedSessionDetails`, `ExtractedClimb`, `VoiceLogExtractionResult`).
    -   **"No `any` Types" (TS-4.1):**
        -   The `parseAndValidateExtraction` method uses `any` for the `parsed` variable after `JSON.parse()` and for the `climb` parameter in `forEach` and `map` callbacks.
            -   **TODO (TS-4.1):** Change `parsed: any` to `parsed: unknown` and use type guards/assertions after initial parse. Change `climb: any` in callbacks to `climb: unknown` (or `Partial<ExtractedClimb>`) and perform type checking before accessing properties or use safer access methods.
    -   **Prompt Design:** Good. Detailed system prompt with JSON structure, and user prompt includes transcript and reiterates format. Low temperature setting for deterministic output is appropriate.
    -   **Configuration:** Good. Uses `OPENROUTER_CONFIG`.
    -   **(Minor Consideration):** Consider explicit validation for an empty `transcript` string in `extractDataFromTranscript` to prevent potentially unnecessary API calls, though this is minor.

-   **File:** `src/services/aiAnalysis.ts`
    -   **File Structure (DB-2.1 Style):** Compliant. Handles AI-powered session analysis via OpenRouter.
    -   **Service Function Analysis (External API Interaction):**
        -   **Constructor & `analyzeSession`:**
            -   **Validation (Constructor):** Takes `apiKey` but no explicit check if it's empty.
                -   **TODO (DB-2.2):** Add an explicit check for `this.apiKey` in the constructor and throw an error if missing.
            -   **Validation (`analyzeSession`):** Assumes input `session: Session` object is valid.
            -   **API Operation:** Correctly generates prompt and makes `fetch` call.
            -   **Error Handling:** Good. Checks API response status and for empty analysis text.
            -   **Transformation & Return:** Passes raw AI text to `parseAnalysis`.
        -   **`generateAnalysisPrompt` (Helper):** Excellent. Well-structured, detailed prompt with data and explicit formatting instructions.
        -   **`parseAnalysis` (Helper):** Parses free-text AI response using regex.
            -   **Robustness Concern:** Free-text parsing is inherently brittle.
            -   **Strong Recommendation (Reliability):** Modify the AI prompt to request structured JSON output. This would allow for `JSON.parse()` and more reliable validation, significantly improving service stability.
    -   **Type System Conventions (TS-1, TS-2):** Compliant. Clear `AnalysisResult` interface defined.
    -   **"No `any` Types" (TS-4.1):**
        -   The `data` variable from `await response.json()` (line 46) is implicitly `any`.
            -   **TODO (TS-4.1):** Type `data` more strictly (e.g., as `OpenRouterChatCompletionResponse` or `unknown` with type checking like `data: { choices?: { message?: { content?: string } }[] }`).
    -   **Prompt Design:** Excellent. Clear system and user prompts.
    -   **Configuration:** Good. Uses `OPENROUTER_CONFIG`.

## IV. Component Design Standards

### A. Component Structure & Props (SM-1)

-   **File:** `src/components/SessionList.tsx`
    -   **Naming (SM-1.1):** Compliant.
    -   **Props Naming (SM-1.2):** Compliant.
    -   **Props Handling (SM-1.3):** Compliant.
    -   **Handler Functions (SM-1.4):** Compliant.
    -   **Dumb vs. Smart (SM-1.5):** Compliant (presentational with view-specific state).
    -   **Reusability (SM-1.6):** Compliant.
    -   **Overall:** No violations of SM-1 noted. Good use of CSS Modules and utility functions.

-   **File:** `src/components/HistorySessionListView.tsx`
    -   **Naming (SM-1.1):** Compliant.
    -   **Props Naming (SM-1.2):** Compliant.
    -   **Props Handling (SM-1.3):** Compliant (typed, destructured). Number of props is high, reflecting its role as a view controller.
    -   **Handler Functions (SM-1.4):** Compliant (descriptive names, passed as props).
    -   **Dumb vs. Smart (SM-1.5):** Acts as a "smart" view controller, which is acceptable for this page-level component. It coordinates `SessionList` and `HistoryDialogs`.
    -   **Reusability (SM-1.6):** Specific to the Session History view, which is fine.
    -   **Consideration (SM-1.3 / SM-5 related):** The component manages significant state and many handlers for dialogs. While not a direct violation, monitor for increasing complexity. If it becomes difficult to manage, consider further encapsulation or using a dedicated hook to manage dialog states and handlers passed to `HistoryDialogs`.

-   **File:** `src/components/RecentSessions.tsx`
    -   **Naming (SM-1.1):** Compliant.
    -   **Props Naming (SM-1.2):** Compliant.
    -   **Props Handling (SM-1.3):** Compliant.
    -   **Handler Functions (SM-1.4):** Compliant (internal handler `handleSessionClick` uses `navigate` and is passed to child).
    -   **Dumb vs. Smart (SM-1.5):** Compliant (presentational, composes `SessionList`).
    -   **Reusability (SM-1.6):** Compliant (specific UI section, reuses `SessionList` effectively).
    -   **Overall:** No violations of SM-1 noted. Good example of component composition.

-   **File:** `src/components/SkillsSelector.tsx`
    -   **Naming (SM-1.1):** Compliant.
    -   **Props Naming (SM-1.2):** Compliant.
    -   **Props Handling (SM-1.3):** Compliant (props are straightforward, controlled component pattern).
    -   **Handler Functions (SM-1.4):** Compliant.
    -   **Dumb vs. Smart (SM-1.5):** This is a very "smart" component managing significant internal state (skill lists, search, new skill input, `localStorage` loading/saving) and complex logic. 
        -   **Violation (SM-3.4, SM-5):** Directly interacts with `localStorage` for loading and saving custom physical and technical skills. This logic should be abstracted into a custom hook (e.g., `useManageCustomSkills` or integrated into `useSkillsSettings`). The component should then consume this hook rather than managing `localStorage` itself.
    -   **Reusability (SM-1.6):** Compliant (designed as a reusable selector).
    -   **Internal Complexity:** High due to managing two types of skills, search, adding new skills, and direct `localStorage` interaction. The `renderSkillSection` helper is large.
    -   **TODO (Major SM-3.4, SM-5):** Abstract all `localStorage` interactions for custom skills (loading, adding, persisting) into a dedicated custom hook. The `SkillsSelector` component should then use this hook.
    -   **(Minor Consideration):** After abstracting `localStorage` logic, re-evaluate if the `renderSkillSection` helper or duplicated logic patterns for physical/technical skills can be simplified.

-   **File:** `src/components/Navigation.tsx`
    -   **Naming (SM-1.1):** Compliant.
    -   **Props Naming (SM-1.2):** Compliant (takes no props).
    -   **Props Handling (SM-1.3):** Compliant (takes no props).
    -   **Handler Functions (SM-1.4):** Compliant (internal handlers `toggleMobileMenu`, `handleSignOut` are descriptive and well-scoped).
    -   **Dumb vs. Smart (SM-1.5):** Compliant (smart component, uses hooks for auth state, location, and internal UI state; appropriate for main navigation).
    -   **Reusability (SM-1.6):** Compliant (specific to the application's main navigation structure).
    -   **Overall:** No violations of SM-1 noted. Well-structured responsive navigation component.

-   **File:** `src/components/SessionDetails.tsx`
    -   **Naming (SM-1.1):** Compliant.
    -   **Props Naming (SM-1.2):** Compliant.
    -   **Props Handling (SM-1.3):** Compliant (typed, destructured, props are well-defined for a detailed view).
    -   **Handler Functions (SM-1.4):** Compliant (all interactions via callback props, names are descriptive).
    -   **Dumb vs. Smart (SM-1.5):** Compliant (presentational component, receives all data and handlers via props).
    -   **Reusability (SM-1.6):** Compliant (reusable for displaying details of any session).
    -   **Overall:** No violations of SM-1 noted. Good presentational component for session details.

-   **File:** `src/components/SessionControl.tsx`
    -   **Naming (SM-1.1):** Compliant.
    -   **Props Naming (SM-1.2):** Compliant.
    -   **Props Handling (SM-1.3):** Compliant (typed, destructured, props well-defined).
    -   **Handler Functions (SM-1.4):** Compliant (interactions via callback props; internal handlers are well-scoped).
    -   **Dumb vs. Smart (SM-1.5):** Compliant (manages `showSessionForm` UI state and displays derived stats, appropriate for its role as a session control panel).
    -   **Reusability (SM-1.6):** Compliant (specific to session control context).
    -   **Overall:** No violations of SM-1 noted. Good component for managing active session UI and controls.

-   **File:** `src/components/ClimbLogSection.tsx`
    -   **Naming (SM-1.1):** Compliant.
    -   **Props Naming (SM-1.2):** Compliant.
    -   **Props Handling (SM-1.3):** Compliant (typed, destructured, props well-defined).
    -   **Handler Functions (SM-1.4):** Compliant (interactions via callback props; internal handler `handleAddClimb` is well-scoped).
    -   **Dumb vs. Smart (SM-1.5):** Compliant (manages `showClimbForm` UI state, appropriate for this section).
    -   **Reusability (SM-1.6):** Compliant (specific to climb logging within an active session context).
    -   **Overall:** No violations of SM-1 noted. Good component for managing climb logging UI.

-   **File:** `src/components/LoginForm.tsx`
    -   **Naming (SM-1.1):** Compliant.
    -   **Props Naming (SM-1.2):** Compliant (takes no props).
    -   **Props Handling (SM-1.3):** Compliant (takes no props).
    -   **Handler Functions (SM-1.4):** Compliant (internal `handleSubmit` is well-scoped; input changes are inline).
    -   **Dumb vs. Smart (SM-1.5):** This is a "smart" component managing its own form state (`email`, `password`, `isLoading`) and submission logic. The `DEVELOPMENT_STANDARDS.md` (SM-2.1) suggests abstracting such logic into a form hook.
        -   **TODO (SM-2.1, SM-5):** Refactor to use a dedicated form-handling hook (e.g., the existing `src/hooks/useAuthForm.ts` or a similar new hook) to manage form state, submission, and loading/error states. This would make `LoginForm.tsx` more presentational.
    -   **Reusability (SM-1.6):** Compliant (specific login form for the application).
    -   **Overall:** Adheres to basic conventions. Main improvement is to abstract form logic into a hook as per SM-2.1 and SM-5 principles.

-   **File:** `src/components/HistoryDialogs.tsx`
    -   **Naming (SM-1.1):** Compliant.
    -   **Props Naming (SM-1.2):** Compliant.
    -   **Props Handling (SM-1.3):** Props are typed and destructured. However, a critical issue exists:
        -   **Violation (TS-4.1):** Uses `editForm: any` and `setEditForm: (form: any) => void`. This violates the "No `any` Types" rule. `editForm` should be specifically typed (e.g., `Partial<LocalClimb> | Partial<Session> | null`).
    -   **Handler Functions (SM-1.4):** Compliant (all interactions via callback props).
    -   **Dumb vs. Smart (SM-1.5):** Compliant (presentational component, receives all state and handlers).
    -   **Reusability (SM-1.6):** Acceptable (groups dialogs for a specific feature set).
    -   **Functionality Note:** The Session editing form is currently a placeholder.
    -   **TODO (Critical TS-4.1):** Replace `any` for `editForm` and `setEditForm` props with specific types (e.g., `Partial<LocalClimb> | Partial<Session> | null`). This requires changes in the parent component/hook providing this state.
    -   **TODO (Functionality):** Implement the form for editing Session details within the Edit Dialog.

-   **File:** `src/components/ClimbLogForm.tsx`
    -   **Naming (SM-1.1):** Compliant.
    -   **Props Naming (SM-1.2):** Compliant.
    -   **Props Handling (SM-1.3):** Compliant (typed, destructured, default prop value).
    -   **Handler Functions (SM-1.4):** Compliant (callbacks passed, `onSubmit` used by hook).
    -   **Dumb vs. Smart (SM-1.5):** Compliant (excellent example of a presentational form using `useClimbForm` hook for logic).
    -   **Reusability (SM-1.6):** Compliant (reusable climb logging form).
    -   **Overall:** No violations of SM-1 noted. Model presentational form component. Improvement areas (loading/error states) lie with the `useClimbForm` hook.

-   **File:** `src/components/HistorySessionDetailsView.tsx`
    -   **Naming (SM-1.1):** Compliant.
    -   **Props Naming (SM-1.2):** Compliant.
    -   **Props Handling (SM-1.3):** Compliant (typed, destructured). Takes a very large number of props (25), which is a symptom of prop drilling from the parent/hook (`useSessionHistory`).
    -   **Handler Functions (SM-1.4):** Compliant (all interactions via callback props).
    -   **Dumb vs. Smart (SM-1.5):** Compliant (purely presentational, passes props to children).
    -   **Reusability (SM-1.6):** Acceptable (specific to orchestrating `SessionDetails` and `HistoryDialogs`).
    -   **Overall:** No direct violations. The high prop count indicates potential complexity in the parent state management (`useSessionHistory`), not an issue with this component's own logic.

### B. Settings Components (src/components/settings/)

-   **File:** `src/components/settings/GradeSettings.tsx`
    -   **Naming (SM-1.1):** Compliant.
    -   **Props Naming (SM-1.2):** Compliant (takes no props).
    -   **Props Handling (SM-1.3):** Compliant (takes no props).
    -   **Handler Functions (SM-1.4):** Compliant (uses setters directly from `useGradeSettings` hook).
    -   **Dumb vs. Smart (SM-1.5):** Compliant (smart component using `useGradeSettings` hook for state and logic, which is good practice).
    -   **Reusability (SM-1.6):** Compliant (specific to grade system settings).
    -   **Overall:** No violations of SM-1 noted. Effectively uses a hook for settings management. (Note: `useGradeSettings` hook has its own TODOs).

-   **File:** `src/components/settings/LocationSettings.tsx`
    -   **Naming (SM-1.1):** Compliant.
    -   **Props Naming (SM-1.2):** Compliant (takes no props).
    -   **Props Handling (SM-1.3):** Compliant (takes no props).
    -   **Handler Functions (SM-1.4):** Compliant (passes actions from `useLocationSettings` hook to child component).
    -   **Dumb vs. Smart (SM-1.5):** Compliant (smart component using `useLocationSettings` hook and composing the generic `ManageListItems` component).
    -   **Reusability (SM-1.6):** Compliant (specific to location settings, achieved by specializing `ManageListItems`).
    -   **Overall:** No violations of SM-1 noted. Excellent example of composition and hook usage. (Note: `useLocationSettings` hook has its own TODOs).

-   **File:** `src/components/settings/ManageListItems.tsx`
    -   **Naming (SM-1.1):** Compliant.
    -   **Props Naming (SM-1.2):** Compliant.
    -   **Props Handling (SM-1.3):** Compliant (typed, destructured, defaults provided).
    -   **Handler Functions (SM-1.4):** Compliant (external callbacks for actions, internal handlers for UI state).
    -   **Dumb vs. Smart (SM-1.5):** Compliant (presentational component with well-scoped internal UI state for add/edit functionality).
    -   **Reusability (SM-1.6):** Compliant (designed as a generic, reusable list management UI).
    -   **Overall:** No violations of SM-1 noted. Well-designed and reusable component.

-   **File:** `src/components/settings/SkillsSettings.tsx`
    -   **Naming (SM-1.1):** Compliant.
    -   **Props Naming (SM-1.2):** Compliant (takes no props).
    -   **Props Handling (SM-1.3):** Compliant (takes no props).
    -   **Handler Functions (SM-1.4):** Compliant (passes actions from `useSkillsSettings` hook to child `ManageListItems` components).
    -   **Dumb vs. Smart (SM-1.5):** Compliant (smart component using `useSkillsSettings` hook and composing `ManageListItems` for physical and technical skills).
    -   **Reusability (SM-1.6):** Compliant (specific to skills settings, achieved by specializing `ManageListItems`).
    -   **Overall:** No violations of SM-1 noted. Good example of composition and hook usage for managing different skill lists. (Note: `useSkillsSettings` hook has its own TODOs).

### C. UI Library Components (src/components/ui/)

-   **General Assessment (SM-1.7):** Most components in `src/components/ui/` (e.g., `button.tsx`, `card.tsx`, `input.tsx`) appear to be standard library components (e.g., from Shadcn/ui or following its pattern). These are typically lightly wrapped Radix UI primitives styled with Tailwind CSS, using `cva` for variants and `cn` for class merging.
    -   **Compliance:** Such components are generally **Compliant** with SM-1.7, as they represent direct usage of a third-party UI library system and are not heavily customized with new logic beyond the library's intended theming/variant capabilities.
    -   A detailed SM-1.1 to SM-1.6 audit is not typically required for these unless they are found to be significantly altered or are entirely custom creations that don't fit the library pattern.

-   **Spot-Checked Files:**
    -   **File:** `src/components/ui/button.tsx` - Confirmed standard library component. **Compliant (SM-1.7).**
    -   **File:** `src/components/ui/card.tsx` - Confirmed standard library component. **Compliant (SM-1.7).**
    -   **File:** `src/components/ui/input.tsx` - Confirmed standard library component. **Compliant (SM-1.7).**

-   **File:** `src/components/ui/interactive-hover-button.tsx` (Custom UI Component)
    -   **Naming (SM-1.1):** 
        -   Filename: `interactive-hover-button.tsx` (kebab-case) - **Violation.** Should be PascalCase (`InteractiveHoverButton.tsx`).
        -   Component Name: `InteractiveHoverButton` (PascalCase) - Compliant.
    -   **Props Naming (SM-1.2):** Compliant.
    -   **Props Handling (SM-1.3):** Compliant.
    -   **Handler Functions (SM-1.4):** Compliant.
    -   **Dumb vs. Smart (SM-1.5):** Compliant (presentational).
    -   **Reusability (SM-1.6):** Compliant.
    -   **Overall:** A custom presentational component with specific animation. Adheres to SM-1.2 to SM-1.6, but filename violates SM-1.1.
    -   **TODO (SM-1.1):** Rename file to `InteractiveHoverButton.tsx`.

## V. Library & Utility Standards (src/lib, src/utils)

### A. `src/lib` Files

-   **File:** `src/lib/importTemplates.ts`
    -   **Naming Conventions (TS-1):** Generally compliant.
    -   **Explicit Typing (TS-2.1):** Compliant.
    -   **Transformation Utilities (TS-2.3):** Defines `transform` functions for each template. Their minified nature makes detailed audit difficult.
    -   **String Unions (TS-2.5):** `ImportSourceType` is a string literal union. Compliant.
    -   **No `any` Types (TS-4.1):** 
        -   Violations exist: `GenericJsonClimbObject`, `rawRow` in `transform` params, and casts like `(p as any)[f]=n` within transforms. (These are already globally listed in `COMPLIANCE_TODO.md` Part I.A.1).
    -   **Utility Function Guidelines (SM-6):**
        -   **Purity & Single Responsibility:** `transform` functions and `getInitialMappingsFromTemplate` appear to adhere in principle.
        -   **JSDoc & Readability (SM-6.4):** 
            -   **Major TODO (Readability):** The `transform` functions within templates and the `getInitialMappingsFromTemplate` function are extremely minified/dense. They **must** be unminified and refactored for readability and maintainability.
            -   **TODO (SM-6.4):** Once unminified, add JSDoc comments to these complex `transform` functions and to `getInitialMappingsFromTemplate` to explain their logic.
    -   **Overall:** Besides the known `any` type issues, the primary concern is the severe lack of readability in key transformation functions.

-   **File:** `src/lib/importValidation.ts`
    -   **Naming Conventions (TS-1):** Compliant.
    -   **Explicit Typing (TS-2.1):** Compliant.
    -   **No `any` Types (TS-4.1):** 
        -   Violations exist: `value: any` in `isNonNegativeInteger` and `isPositiveNumber`. (These are already globally listed in `COMPLIANCE_TODO.md` Part I.A.1).
        -   **Recommendation:** Change `value: any` to `value: unknown` in these helper functions.
    -   **Type Guards and Assertions (TS-4.3):** Uses `as ClimbTypeSpec` etc. appropriately in validation. Compliant.
    -   **Utility Function Guidelines (SM-6):**
        -   **Purity & Single Responsibility:** All functions are pure and have clear responsibilities. Compliant.
        -   **JSDoc Comments (SM-6.4):** Good JSDoc comments are present. Compliant.
    -   **Overall:** Well-structured validation logic. Key improvement is to address `any` types in helper functions.

-   **File:** `src/lib/gradeConversion.ts`
    -   **Naming Conventions (TS-1):** Compliant (Enum `GradeSystem`, constants, functions).
    -   **Explicit Typing (TS-2.1):** Compliant.
    -   **Enums (TS-2.5):** `GradeSystem` is an enum. Compliant.
    -   **No `any` Types (TS-4.1):** Compliant. No `any` types used.
    -   **Utility Function Guidelines (SM-6):**
        -   **Purity & Single Responsibility (SM-6.1, SM-6.2):** Functions are pure and have clear responsibilities. Compliant.
        -   **Defensive Programming (SM-6.3):** Good. Handles edge cases and includes `try/catch` for conversion logic. Compliant.
        -   **JSDoc Comments (SM-6.4):** Good JSDoc comments explaining functions, params, returns, and limitations. Compliant.
    -   **Overall:** Well-structured, typed, and documented. Adheres to standards. Acknowledged limitations are about the scope of grade conversion logic, not code quality standards.

-   **File:** `src/lib/importSpec.ts`
    -   **Naming Conventions (TS-1):**
        -   Enums (`ClimbTypeSpec`, `SendTypeSpec`) and Interface (`CsvClimb`) names use PascalCase. Enum members use SCREAMING_SNAKE_CASE. Compliant.
        -   **Violation (TS-1.2):** Several fields in the `CsvClimb` interface use `snake_case` (e.g., `send_type`, `elevation_gain`, `physical_skills`, `technical_skills`). Standard TS-1.2 requires `camelCase` for interface fields. These should be refactored (e.g., to `sendType`, `elevationGain`, `physicalSkills`, `technicalSkills`).
    -   **Explicit Typing (TS-2.1):** Compliant.
    -   **Enums (TS-2.5):** Correctly uses enums. Compliant.
    -   **JSDoc Comments (TS-2.6):** Excellent JSDoc comments for file, enums, interface, and all members. Compliant.
    -   **No `any` Types (TS-4.1):** Compliant. No `any` types used.
    -   **Overall:** Very well-documented and typed. The primary violation is the use of `snake_case` for some interface fields instead of the standard `camelCase`.
    -   **TODO (TS-1.2):** Refactor `snake_case` fields in `CsvClimb` interface to `camelCase` (e.g., `send_type` to `sendType`). This will also require updates where this interface is used (parsing, validation, templates).

-   **File:** `src/lib/utils.ts`
    -   **Naming Conventions (TS-1):** Compliant.
    -   **Explicit Typing (TS-2.1):** Compliant.
    -   **No `any` Types (TS-4.1):**
        -   **Recommendation:** Define a more specific type for items in the `climbs` array, especially if they are expected to have a `timestamp` property for parsing (e.g., `climbs?: { timestamp?: string | Date, [key: string]: unknown }[]` or a `ClimbLike` interface).
    -   **Utility Function Guidelines (SM-6):**
        -   **Purity & Single Responsibility (SM-6.1, SM-6.2):** Functions are pure and have clear responsibilities. Compliant.
        -   **Defensive Programming (SM-6.3):** Functions handle edge cases appropriately. Compliant.
        -   **JSDoc Comments (SM-6.4/TS-2.6):** 
            -   **TODO:** Add JSDoc comments to `cn`, `formatDate`, `formatTime`, and `getSessionDuration`.
    -   **Overall:** Provides useful utilities. The primary issue is the `any[]` in `parseSessionDates` (now resolved) and missing JSDoc for some functions.

### B. `src/utils` Files

-   **File:** `src/utils/csvExport.ts`
    -   **Naming Conventions (TS-1):** Compliant.
    -   **Explicit Typing (TS-2.1):** Compliant.
    -   **No `any` Types (TS-4.1):** Compliant. No `any` types used.
    -   **Utility Function Guidelines (SM-6):**
        -   **Purity (SM-6.1):** Not a pure function due to DOM manipulation for file download, which is its intended side effect.
        -   **Single Responsibility (SM-6.2):** Compliant (handles CSV creation and download trigger).
        -   **Defensive Programming (SM-6.3):** Handles empty climbs list and CSV quote escaping. Assumes valid input `Session` and `Climb` types.
        -   **JSDoc Comments (SM-6.4/TS-2.6):** 
            -   **TODO:** Add JSDoc comments to `exportToCSV` to describe its purpose, parameters, and side effects.
    -   **Overall:** Well-structured utility for CSV export. Primary improvement is adding JSDoc.

-   **File:** `src/utils/gradeSystem.ts`
    -   **Naming Conventions (TS-1):** Compliant for interface, constant, and function names. Object keys within `gradeSystems` (e.g., `v_scale`) are sometimes `snake_case`, which is acceptable for dictionary keys representing identifiers.
    -   **Explicit Typing (TS-2.1):** Compliant.
    -   **String Unions (TS-2.5):** `GradeSystem.type` uses a string literal union. Compliant.
    -   **No `any` Types (TS-4.1):** Compliant. No `any` types used.
    -   **Utility Function Guidelines (SM-6):**
        -   **Purity & Single Responsibility (SM-6.1, SM-6.2):** Functions are pure and have clear responsibilities. Compliant.
        -   **Defensive Programming (SM-6.3):** Functions include reasonable fallbacks/defaults. Compliant.
        -   **JSDoc Comments (SM-6.4/TS-2.6):** 
            -   **TODO:** Add JSDoc comments to the `GradeSystem` interface, `gradeSystems` object, and all exported functions (`getGradeSystemsForType`, `getGradeSystemForClimbType`, `getGradesForSystem`).
    -   **Overall:** Well-structured data and utility functions for grade systems. Main improvement is adding JSDoc.

-   **File:** `src/utils/skills.ts`
    -   **Naming Conventions (TS-1):** Compliant.
    -   **Explicit Typing (TS-2.1 & SM-6.5):** Constants are not explicitly typed (inferred as `string[]`).
        -   **TODO (SM-6.5/TS-2.1):** Add explicit types (e.g., `string[]` or `ReadonlyArray<string>`) to `physicalSkills` and `technicalSkills`.
    -   **Immutability (SM-6.5):** Exported arrays are mutable. 
        -   **TODO (SM-6.5):** Consider making `physicalSkills` and `technicalSkills` immutable (e.g., using `ReadonlyArray<string>` or `as const`) if they are intended as fixed default lists.
    -   **No `any` Types (TS-4.1):** Compliant.
    -   **JSDoc Comments (SM-6.4/TS-2.6):** 
        -   **TODO:** Add JSDoc comments to `physicalSkills` and `technicalSkills`.
    -   **Overall:** Simple data definitions. Key improvements are explicit typing, considering immutability, and adding JSDoc.

### C. `src/pages` Components

-   **File:** `src/pages/History.tsx`
    -   **Component Naming (SM-1.1):** Compliant.
    -   **Props (SM-1.2, SM-1.3):** Compliant (takes no props).
    -   **Handler Functions (SM-1.4):** Compliant (internal handlers for export/import, others from hooks).
    -   **Dumb vs. Smart (SM-1.5):** Compliant (smart page component orchestrating views and actions).
    -   **Type Safety (TS-4.1):**
        -   **Recommendation:** Remove `as any`. Ensure consumed hook handlers are correctly typed. (Done)
    -   **Hook Usage (SM-2, SM-5):** Leverages `useSessionHistory` (noted as complex with its own TODOs) and `useClimbs`.
    -   **JSDoc Comments (SM-6.4/TS-2.6):** 
        -   **TODO:** Add JSDoc to the `History` component and internal handlers `handleExport`, `handleImportClick`.
    -   **Separation of Concerns (SM-5 related):** Contains significant logic for CSV import/export DOM interaction and file handling.
        -   **(Minor Consideration SM-5):** Evaluate abstracting CSV import/export triggering logic into dedicated hooks or services to simplify the page component.
    -   **Overall:** Functional page component. Key issues are `any` casts (now resolved) and potential for simplifying by abstracting import/export side effects. Missing JSDoc.

-   **File:** `src/pages/Index.tsx` (Dashboard Page)
    -   **Component Naming (SM-1.1):** Compliant.
    -   **Props (SM-1.2, SM-1.3):** Compliant (takes no props).
    -   **Handler Functions (SM-1.4):** Compliant (manages `editingClimb` state locally, passes hook actions to children).
    -   **Dumb vs. Smart (SM-1.5):** Compliant (smart page component, uses hooks for data/actions, manages local UI state for dialog).
    -   **Reusability (SM-1.6):** Compliant (main dashboard page).
    -   **Type Safety (TS-4.1):** Compliant. No `any` types used.
    -   **Hook Usage (SM-2, SM-5):** Effectively uses `useAuth`, `useClimbs`, and `useSessionManagement`.
    -   **JSDoc Comments (SM-6.4/TS-2.6):** 
        -   **TODO:** Add JSDoc to the `Index` component.
    -   **Overall:** Well-structured dashboard page. Adheres to standards. Main improvement is adding JSDoc.

-   **File:** `src/pages/Metrics.tsx`
    -   **Component Naming (SM-1.1):** Compliant.
    -   **Props (SM-1.2, SM-1.3):** Compliant (takes no props).
    -   **Handler Functions (SM-1.4):** Compliant.
    -   **Dumb vs. Smart (SM-1.5):** Compliant (smart page component, fetches data, manages local state for year, derives data).
    -   **Type Safety (TS-4.1):** Compliant. No `any` types used.
    -   **Hook Usage (SM-2, SM-5):** Effectively uses `useClimbs`.
    -   **JSDoc Comments (SM-6.4/TS-2.6):** 
        -   **TODO:** Add JSDoc to the `Metrics` component.
    -   **Overall:** Well-structured metrics page. Adheres to standards. Main improvement is adding JSDoc.

-   **File:** `src/pages/NotFound.tsx`
    -   **Component Naming (SM-1.1):** Compliant.
    -   **Props (SM-1.2, SM-1.3):** Compliant (takes no props).
    -   **Dumb vs. Smart (SM-1.5):** Compliant (presentational page with a logging side effect via hooks).
    -   **Type Safety (TS-4.1):** Compliant. No `any` types used.
    -   **Hook Usage (SM-2, SM-5):** Correctly uses `useLocation` and `useEffect` for logging.
    -   **JSDoc Comments (SM-6.4/TS-2.6):** 
        -   **TODO:** Add JSDoc to the `NotFound` component.
    -   **Overall:** Simple and effective 404 page. Adheres to standards. Main improvement is adding JSDoc.

-   **File:** `src/pages/ImportPage.tsx`
    -   **Component Naming (SM-1.1):** Compliant.
    -   **Props (SM-1.2, SM-1.3):** Compliant (typed as React.FC, no explicit props).
    -   **Handler Functions (SM-1.4):** Compliant (delegates to child components).
    -   **Dumb vs. Smart (SM-1.5):** Compliant (structural page component).
    -   **Type Safety (TS-4.1):** Compliant for this file. No `any` types used directly.
    -   **Hook Usage:** N/A (no hooks used directly).
    -   **JSDoc Comments (SM-6.4/TS-2.6):** 
        -   **TODO:** Add JSDoc to the `ImportPage` component.
    -   **Overall:** Well-structured page for organizing import options. Adheres to standards. Main improvement is adding JSDoc.

-   **File:** `src/pages/BetaFeaturesPage.tsx`
    -   **Component Naming (SM-1.1):** Compliant.
    -   **Props (SM-1.2, SM-1.3):** Compliant (typed as React.FC, no explicit props).
    -   **Handler Functions (SM-1.4):** Compliant.
    -   **Dumb vs. Smart (SM-1.5):** Compliant (primarily presentational page).
    -   **Type Safety (TS-4.1):** Compliant. No `any` types used.
    -   **Hook Usage (SM-2, SM-5):** Uses `useNavigate` appropriately. Compliant.
    -   **Explicit Typing (TS-2.1):** 
        -   The `betaFeatures` array and its items are inferred.
        -   **Recommendation:** Define an interface for items in the `betaFeatures` array (e.g., `BetaFeatureItem`) and consider a string literal union for the `status` field (e.g., `'active' | 'in-development'`).
    -   **JSDoc Comments (SM-6.4/TS-2.6):** 
        -   **TODO:** Add JSDoc to the `BetaFeaturesPage` component.
    -   **Overall:** Simple and functional page. Key improvements are more explicit typing for feature data and adding JSDoc.

-   **File:** `src/pages/VoiceLogReviewPage.tsx` (Analyzed ~250 of 405 lines + outline)
    -   **Component Naming & Props (SM-1.1, SM-1.2, SM-1.3):** Compliant.
    -   **Type Definitions & Constants:**
        -   **Violation (TS-1.2):** Numerous interface fields use `snake_case` (e.g., `session_notes`, `original_audio_filename`). Recommend refactoring to `camelCase` for internal types and transforming at API boundaries.
        -   **TODO (TS-2.6):** Add JSDoc to all type definitions, their properties, and constants.
        -   **TODO (SM-6.5/TS-2.1):** `GRADES` constant lacks an explicit type. Add explicit type (e.g., `Record<string, string[]>`).
        -   **TODO (SM-6.5):** Consider `ReadonlyArray` or `as const` for constants like `CLIMBING_TYPES`, `GRADES`.
    -   **State Management & Hooks (`useEffect`):**
        -   **Violation (Potential TS-4.3 / Robustness):** Uses type assertion `... as keyof typeof GRADES` for default grade lookup, which can be unsafe. Recommend safer access method.
    -   **Handler Functions (SM-1.4):** Appear well-named and structured for state updates. Client-side ID removal before API submission is good.
    -   **Type Safety (TS-4.1):** No explicit `any` types observed in the reviewed section, but the type assertion issue (TS-4.3) is a type safety concern.
    -   **JSDoc Comments (TS-2.6 / SM-6.4):** 
        -   **TODO:** Add JSDoc to the `VoiceLogReviewPage` component and potentially complex handlers after refactoring.
    -   **Component Complexity (SM-5):** High. The component (405 lines total) manages data fetching, multiple forms (session, climbs list), transcription, audio playback (likely), and API calls.
        -   **Violation (SM-5):** Component has too many responsibilities.
        -   **Strong Recommendation:** Refactor into smaller components and custom hooks (e.g., `useVoiceLogData`, `useSessionForm`, `useClimbsList`, `SessionDetailsForm`, `ClimbsListEditor`, etc.) to improve separation of concerns and maintainability.
    -   **Overall (Partial Analysis):** A complex, feature-rich page. Significant refactoring is needed to address complexity (SM-5). Key specific issues include `snake_case` types, unsafe type assertion, and missing JSDoc/explicit constant types.

-   **File:** `src/pages/VoiceLogsPage.tsx`
    -   **Interface Definition (`VoiceLog`):** Well-defined with explicit types and string literal union for `status`.
        -   **TODO (TS-2.6):** Add JSDoc to `VoiceLog` interface and its properties.
    -   **Component Naming & Props (SM-1.1, SM-1.2, SM-1.3):** Compliant.
    -   **State Management:** Uses `useState` with explicit types. Mock data used for `voiceLogs`; recording logic is placeholder. This is acceptable for current code structure but not production-ready.
    -   **Handler Functions (SM-1.4):** Clearly named. Placeholder logic for `toggleRecording`.
        -   **TODO (TS-2.6):** Add JSDoc to handler functions.
    -   **Type Safety (TS-4.1):** Compliant. No `any` types used.
    -   **Hook Usage (SM-2, SM-5):** Appropriate use of `useState`, `useNavigate`. Current complexity is manageable.
        -   **Consideration (Future SM-5):** Implementing full recording/data persistence directly would likely violate SM-5. Such logic should be in hooks/services.
    -   **JSDoc Comments (TS-2.6 / SM-6.4):** 
        -   **TODO:** Add JSDoc to the `VoiceLogsPage` component.
    -   **Overall:** Well-structured for its current (mock/placeholder) functionality. Adheres to standards. Main improvements are JSDoc. Future feature implementation should focus on SM-5.

-   **File:** `src/pages/Settings.tsx` (Refactored Version)
    -   **Component Naming & Props (SM-1.1, SM-1.2, SM-1.3):** Compliant.
    -   **Structure & Responsibility (SM-1.5):** Compliant. Acts as a simple container, delegating logic to child settings components and hooks. Good separation of concerns.
    -   **Type Safety (TS-4.1):** Compliant. No `any` types used in this version.
    -   **Hook Usage:** N/A (no hooks used directly in this container).
    -   **JSDoc Comments (TS-2.6 / SM-6.4):** 
        -   **TODO:** Add JSDoc to the `Settings` component.
    -   **Overall:** Clean, simple container page. Adheres to standards. Main improvement is adding JSDoc.

### D. `src/types` Type Definitions

-   **File:** `src/types/climbing.ts`
    -   **Interface Naming (TS-1.1):** Compliant (PascalCase for all interfaces).
    -   **Field Naming (TS-1.2):**
        -   Interfaces `Session` and `LocalClimb` (frontend types) correctly use `camelCase`. Compliant.
        -   **Violation:** Interfaces `Climb`, `ClimbingSession`, and `Goal` use `snake_case` for several fields (e.g., `send_type`, `user_id`, `location_type`). Standard TS-1.2 requires `camelCase`.
        -   **Recommendation:** Use `camelCase` consistently for all interface fields. Handle transformations to/from `snake_case` for external systems at API/service boundaries.
    -   **Explicit Typing (TS-2.1):** Compliant. All fields are explicitly typed.
    -   **String Literal Unions (TS-2.5):** Effectively used. Compliant.
    -   **`any` Types (TS-4.1):** Compliant. No `any` types used.
    -   **JSDoc Comments (TS-2.6):**
        -   **TODO:** Add JSDoc comments to all interfaces and their properties to improve clarity and maintainability.
    -   **Overall:** Defines crucial application types. Key issues are `snake_case` field names in some interfaces and the absence of JSDoc.

-   **File:** `src/types/csv.ts`
    -   **Interface Naming (TS-1.1):** Compliant (`CSVRecord`).
    -   **Index Signature:** Includes `[key: string]: string;`, suitable for generic CSV row data where values are initially strings.
    -   **Field Naming (TS-1.2):**
        -   **Violation:** Several explicit fields use `snake_case` (e.g., `climb_name`, `climb_grade`), while others are `camelCase`. This is inconsistent and violates the `camelCase` standard for some fields.
        -   **Recommendation:** Use `camelCase` consistently for all explicit fields. Mapping from CSV headers should occur during parsing.
    -   **Explicit Typing (TS-2.1):** Compliant. Fields are typed as `string` or `string?`.
    -   **`any` Types (TS-4.1):** Compliant. No `any` types used.
    -   **JSDoc Comments (TS-2.6):**
        -   **TODO:** Add JSDoc comments to the interface and its properties.
    -   **Overall:** Defines a type for raw CSV records. Key issues are `snake_case` fields and missing JSDoc.

### E. `src/config` Files

-   **File:** `src/config/openrouter.ts`
    -   **Naming Conventions (TS-1):** Compliant (`OPENROUTER_CONFIG` as SCREAMING_SNAKE_CASE, properties as `camelCase`).
    -   **Explicit Typing & Immutability (TS-2.1 & SM-6.5):**
        -   **Violation (SM-6.5 / TS-2.1):** The exported `OPENROUTER_CONFIG` object and its nested structures (e.g., `availableModels` items) are not explicitly typed. 
        -   **Recommendation:** Define and apply explicit interfaces for the config object and its nested parts (e.g., `OpenRouterConfig`, `OpenRouterModel`).
        -   **Recommendation (SM-6.5):** Consider making the configuration object `readonly` (e.g., using `as const` or explicit `Readonly` types) if it's not intended for runtime mutation.
    -   **`any` Types (TS-4.1):** Compliant. No `any` types used.
    -   **JSDoc Comments (TS-2.6):**
        -   **TODO:** Add JSDoc comments to `OPENROUTER_CONFIG` and its properties/associated interfaces.
    -   **Security Concern:** Contains a hardcoded API key (`defaultApiKey`). This is a significant security risk for client-side code. API keys should be managed securely, typically not directly embedded in the client.
    -   **Overall:** Provides OpenRouter configuration. Key improvements are explicit typing, considering immutability, adding JSDoc, and urgently addressing the hardcoded API key.

### F. `src/contexts` Files

-   **File:** `src/contexts/AuthContext.tsx`
    -   **Naming Conventions (TS-1):** Compliant.
    -   **Explicit Typing (TS-2.1):** Generally compliant.
    -   **Type Safety (TS-4.1 & TS-4.4):**
        -   **Violations (TS-4.1):** 
            -   `AuthContextProps.signIn` and `AuthContextProps.signUp` return `Promise<{ error: any }>`. (This is already globally listed in `COMPLIANCE_TODO.md` Part I.A.1).
            -   `catch (error: any)` is used in `signIn`, `signUp`, and `signOut` implementations.
        -   **Recommendation:** Use `AuthError | null` from `@supabase/supabase-js` for the error type in promise returns. Type errors in `catch` blocks as `unknown` (and perform instance checks) or `AuthError` where appropriate.
    -   **React Context Best Practices (SM-4):** Compliant. Provider, hook, and context scope are well-defined.
    -   **`useEffect` for Auth Listener:** 
        -   Correctly manages listener lifecycle.
        -   Profile upsert logic using `snake_case` for an object literal in a Supabase API call is acceptable as it's at an API boundary and not part of a reusable internal interface violating TS-1.2.
    -   **JSDoc Comments (TS-2.6):**
        -   **TODO:** Add comprehensive JSDoc to `AuthContextProps`, `AuthProvider`, `useAuth`, and their respective members/props.
    -   **Overall:** Core authentication context. Key issues are `any` types in error handling and lack of JSDoc. Functionality is sound.

### G. `src/data` Files

-   **File:** `src/data/climbingLocations.ts`
    -   **Interface `ClimbingLocation`:**
        -   Naming & Fields (TS-1.1, TS-1.2): Compliant.
        -   Explicit Typing (TS-2.1): Compliant.
        -   `any` Types (TS-4.1): Compliant.
        -   **TODO (TS-2.6):** Add JSDoc to the interface and its properties.
    -   **Constant `climbingLocations` (Array Data):**
        -   Naming & Explicit Typing (TS-1.3, TS-2.1, SM-6.5): Compliant (explicitly `ClimbingLocation[]`).
        -   **TODO (SM-6.5):** Consider making `climbingLocations` `ReadonlyArray<ClimbingLocation>` or using `as const` for immutability.
        -   **TODO (TS-2.6):** Add JSDoc.
    -   **Constant `loginBackgroundLocations` (Derived Array Data):**
        -   Naming: Compliant.
        -   **TODO (TS-2.1 & SM-6.5):** Add explicit type (e.g., `ClimbingLocation[]` or `ReadonlyArray<ClimbingLocation>`).
        -   **TODO (SM-6.5):** Consider immutability as with `climbingLocations`.
        -   **TODO (TS-2.6):** Add JSDoc.
    -   **Utility Functions (`getRandomLocation`, etc.):**
        -   Naming (TS-1.1): Compliant.
        -   Explicit Typing (TS-2.1): Compliant.
        -   `any` Types (TS-4.1): Compliant.
        -   Purity & Single Responsibility (SM-6.1, SM-6.2): Compliant.
        -   Defensive Programming (SM-6.3): Generally fine; minor considerations for empty arrays or non-existent IDs if data sources were dynamic.
        -   **TODO (SM-6.4/TS-2.6):** Add JSDoc to all utility functions.
    -   **Overall:** Provides clear data and utilities. Key improvements are JSDoc, considering immutability for data arrays, and explicit typing for derived data.

### H. `src/integrations/supabase` Files

-   **File:** `src/integrations/supabase/client.ts`
    -   **Generation Note:** The file is marked as "automatically generated." This heavily influences the audit, as direct manual edits are discouraged.
    -   **Naming Conventions (TS-1):** Compliant (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` as SCREAMING_SNAKE_CASE; `supabase` as camelCase).
    -   **Explicit Typing (TS-2.1):** The client is strongly typed with `<Database>` generic from `./types`. Constants `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` have inferred string types (acceptable for auto-generated file).
    -   **`any` Types (TS-4.1):** Compliant. No `any` types used.
    -   **JSDoc Comments (TS-2.6):** None (less critical for auto-generated file not meant for manual editing).
    -   **Security:** Hardcoded URL and publishable key. While the publishable key is public, using environment variables is often preferred for configurability across different environments. If auto-generated, this might be the tool's default.
    -   **Overall:** Serves its purpose as an auto-generated Supabase client initializer. Key aspects like strong typing for the client are good. Manual standards apply less stringently here.

-   **File:** `src/integrations/supabase/types.ts` (Analyzed ~250 of 278 lines)
    -   **Generation Note:** The file structure is characteristic of types generated by Supabase CLI (`supabase gen types typescript`). Assumed to be auto-generated.
    -   **Naming Conventions (TS-1):** 
        -   Top-level types (`Json`, `Database`, `Tables`) use PascalCase. Compliant.
        -   Table names and field names within `Row`/`Insert`/`Update` types (e.g., `climbing_sessions`, `created_at`) use `snake_case`. This is expected for auto-generated types mirroring a database schema and is acceptable in this context, though it differs from the `camelCase` standard (TS-1.2) for manually written internal application types.
    -   **Explicit Typing (TS-2.1):** Compliant. All fields are explicitly typed.
    -   **`any` Types (TS-4.1):** Compliant. No `any` types observed.
    -   **JSDoc Comments (TS-2.6):** None (typical for auto-generated type definition files).
    -   **Overall:** Appears to be standard auto-generated Supabase database types. Crucial for type-safe DB interactions. No direct TODOs if purely auto-generated and unmodified. The `snake_case` is a direct reflection of the DB schema.