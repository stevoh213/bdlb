import * as React from "react"

import type {
    ToastActionElement,
    ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000 //ms

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

// addToRemoveQueue will now be called from dispatch, not the reducer.
// It still dispatches REMOVE_TOAST itself, which is fine as it's a new action cycle.
const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    // Dispatch REMOVE_TOAST action. This is fine as it starts a new action cycle.
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      // Removed side effect (addToRemoveQueue) from here.
      // The reducer now only updates the state.
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toastId || action.toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
    default: // Added default case to handle all action types explicitly
        return state; 
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  const prevState = memoryState;
  memoryState = reducer(memoryState, action);

  // Handle side effect for DISMISS_TOAST after state has been updated
  if (action.type === "DISMISS_TOAST") {
    const { toastId } = action;
    if (toastId) {
      const dismissedToast = memoryState.toasts.find(t => t.id === toastId);
      const prevToast = prevState.toasts.find(t => t.id === toastId);
      // Check if it was just closed (went from open: true/undefined to open: false)
      if (dismissedToast && !dismissedToast.open && (prevToast?.open !== false)) {
        addToRemoveQueue(toastId);
      }
    } else {
      // If no toastId, all toasts were targeted for dismissal.
      // Iterate through the new state toasts. If a toast is now closed 
      // and was previously open in prevState, queue it.
      memoryState.toasts.forEach((toast) => {
        if (!toast.open) {
          const prevToast = prevState.toasts.find(pt => pt.id === toast.id);
          if (prevToast?.open !== false) { // Was open or didn't exist (newly added & dismissed quickly)
            addToRemoveQueue(toast.id);
          }
        }
      });
    }
  }

  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  // Auto-dismiss toasts functionality: 
  // The original toast() function also had a setTimeout to dismiss.
  // This should ideally be managed via TOAST_REMOVE_DELAY and open state if possible,
  // or be part of the toast component itself if it has a duration prop.
  // For now, keeping the explicit dismiss call for ADD_TOAST if that was intended for auto-close.
  // If TOAST_REMOVE_DELAY is for visibility after explicit dismiss, then that's handled.
  // This example assumes the existing auto-dismiss for newly added toasts is desired.
  const autoDismissTimeout = props.duration || 2500; // Use duration from props or default
  if (autoDismissTimeout > 0) { // Allow duration: 0 or negative to disable auto-dismiss
    setTimeout(() => {
        // Check if the toast still exists and is open before dismissing
        // This avoids trying to dismiss a toast that was already manually dismissed
        const currentToast = memoryState.toasts.find(t => t.id === id);
        if (currentToast && currentToast.open) {
            dismiss();
        }
    }, autoDismissTimeout);
  }

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state]) // state dependency for React.useEffect is fine.

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { toast, useToast }

