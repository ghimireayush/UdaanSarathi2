# Fix: "Rendered more hooks than during the previous render" Error

## Problem
When opening CandidateSummaryS2 from the Applications page, the error occurred:
```
Error: Rendered more hooks than during the previous render.
```

## Root Cause
React hooks MUST be called in the same order on every render. The component had:

1. Multiple `useState` hooks
2. `useConfirm()` hook
3. Two `useEffect` hooks
4. **THEN** an early return: `if (!isOpen || !candidate) return null`

When the component rendered with `isOpen=false` or `candidate=null`, it would:
- Call all the hooks
- Return early
- Skip the second `useEffect` that was AFTER the early return

On the next render with `isOpen=true`, it would:
- Call all the hooks
- NOT return early
- Call the second `useEffect`

This changed the number of hooks between renders, causing React to throw an error.

## The Fix

**Rule: ALL hooks must be called BEFORE any conditional returns.**

### Before (Broken):
```javascript
const CandidateSummaryS2 = ({ candidate, isOpen, ... }) => {
  const [state1, setState1] = useState(false)
  const [state2, setState2] = useState(false)
  const { confirm } = useConfirm()
  
  useEffect(() => {
    // First effect
  }, [])

  if (!isOpen || !candidate) return null  // ❌ EARLY RETURN

  // ... component logic ...
  
  useEffect(() => {
    // Second effect - AFTER early return!  ❌
  }, [])
  
  return <div>...</div>
}
```

### After (Fixed):
```javascript
const CandidateSummaryS2 = ({ candidate, isOpen, ... }) => {
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const [state1, setState1] = useState(false)
  const [state2, setState2] = useState(false)
  const { confirm } = useConfirm()
  
  useEffect(() => {
    // First effect
  }, [])
  
  useEffect(() => {
    // Second effect - BEFORE early return!  ✅
  }, [])

  // EARLY RETURN MUST BE AFTER ALL HOOKS
  if (!isOpen || !candidate) return null  // ✅
  
  // ... component logic ...
  
  return <div>...</div>
}
```

## Changes Made

1. **Moved debug useEffect** from line 177 (after early return) to line 95 (before early return)
2. **Updated debug useEffect** to check if candidate exists before logging
3. **Added clear comments** to mark where hooks end and early return begins

## React Hooks Rules

From React documentation:

1. **Only call hooks at the top level** - Don't call hooks inside loops, conditions, or nested functions
2. **Only call hooks from React functions** - Call them from React function components or custom hooks
3. **Call hooks in the same order** - React relies on the order hooks are called to preserve state between renders

## Why This Matters

React uses the order of hook calls to match up state between renders:

```javascript
// First render
useState()  // Hook 1
useState()  // Hook 2
useEffect() // Hook 3
useEffect() // Hook 4
return null // Early return

// Second render (if early return doesn't happen)
useState()  // Hook 1
useState()  // Hook 2
useEffect() // Hook 3
useEffect() // Hook 4
useEffect() // Hook 5 - NEW HOOK! ❌ React gets confused
```

By ensuring all hooks are called before any conditional logic, we guarantee the same number of hooks on every render.

## Testing

1. Open Applications page
2. Click "View Summary" on any candidate
3. CandidateSummaryS2 should open without errors
4. Close and reopen - no errors
5. Switch between candidates - no errors

## Files Modified

- `src/components/CandidateSummaryS2.jsx` - Moved useEffect hooks before early return

## Lesson Learned

**Always call all hooks at the top of the component, before any conditional returns or logic.**

This is a fundamental React rule that prevents hard-to-debug errors.
