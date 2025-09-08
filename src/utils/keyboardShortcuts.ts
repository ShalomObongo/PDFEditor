export interface KeyboardShortcuts {
  [key: string]: () => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcuts) => {
  const handleKeyDown = (event: KeyboardEvent) => {
    const { ctrlKey, metaKey, shiftKey, key } = event;
    const modifierKey = ctrlKey || metaKey;
    
    let shortcutKey = '';
    
    if (modifierKey && shiftKey) {
      shortcutKey = `ctrl+shift+${key.toLowerCase()}`;
    } else if (modifierKey) {
      shortcutKey = `ctrl+${key.toLowerCase()}`;
    } else {
      shortcutKey = key.toLowerCase();
    }
    
    if (shortcuts[shortcutKey]) {
      event.preventDefault();
      shortcuts[shortcutKey]();
    }
  };

  return { handleKeyDown };
};

export const KEYBOARD_SHORTCUTS = {
  UNDO: 'ctrl+z',
  REDO: 'ctrl+shift+z',
  SAVE: 'ctrl+s',
  OPEN: 'ctrl+o',
  DELETE: 'delete',
  BACKSPACE: 'backspace',
  ARROW_LEFT: 'arrowleft',
  ARROW_RIGHT: 'arrowright',
  ESCAPE: 'escape',
  ENTER: 'enter'
} as const;
