import { commands as flagsCommands } from "@hypr/plugin-flags";
import { useQuery } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

export type RightPanelView = "chat" | "widget";

interface RightPanelContextType {
  isExpanded: boolean;
  currentView: RightPanelView;
  setIsExpanded: (v: boolean) => void;
  togglePanel: (view?: RightPanelView) => void;
  hidePanel: () => void;
  switchView: (view: RightPanelView) => void;
  chatInputRef: React.RefObject<HTMLTextAreaElement>;
}

const RightPanelContext = createContext<RightPanelContextType | null>(null);

export function RightPanelProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [currentView, setCurrentView] = useState<RightPanelView>("widget");
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  const hidePanel = useCallback(() => {
    setIsExpanded(false);

    setTimeout(() => {
      if (previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
    }, 0);
  }, []);

  const switchView = useCallback((view: RightPanelView) => {
    setCurrentView(view);
  }, []);

  const togglePanel = useCallback(
    (view?: RightPanelView) => {
      if (view && isExpanded && currentView !== view) {
        setCurrentView(view);

        if (view === "chat") {
          setTimeout(() => {
            if (chatInputRef.current) {
              chatInputRef.current.focus();
            }
          }, 350);
        }
      } else {
        if (!isExpanded) {
          previouslyFocusedElement.current = document.activeElement as HTMLElement;

          setIsExpanded(true);

          const targetView = view || currentView;
          if (targetView === "chat") {
            setTimeout(() => {
              const focusInput = () => {
                if (chatInputRef.current) {
                  chatInputRef.current.focus();
                } else {
                  setTimeout(focusInput, 50);
                }
              };
              focusInput();
            }, 350);
          }
        } else {
          setIsExpanded(false);

          setTimeout(() => {
            if (previouslyFocusedElement.current) {
              previouslyFocusedElement.current.focus();
            }
          }, 350);
        }

        if (view) {
          setCurrentView(view);
        }
      }
    },
    [isExpanded, currentView],
  );

  const { data: chatPanelEnabled = false } = useQuery({
    queryKey: ["flags", "ChatRightPanel"],
    queryFn: () => flagsCommands.isEnabled("ChatRightPanel"),
  });

  useHotkeys(
    "mod+r",
    (event) => {
      event.preventDefault();
      if (isExpanded && currentView === "widget") {
        setIsExpanded(false);

        setTimeout(() => {
          if (previouslyFocusedElement.current) {
            previouslyFocusedElement.current.focus();
          }
        }, 0);
      } else if (isExpanded && currentView !== "widget") {
        setCurrentView("widget");
      } else {
        previouslyFocusedElement.current = document.activeElement as HTMLElement;

        setIsExpanded(true);
        setCurrentView("widget");
      }
    },
    {
      enableOnFormTags: true,
      enableOnContentEditable: true,
    },
  );

  useHotkeys(
    "mod+j",
    (event) => {
      event.preventDefault();

      if (isExpanded && currentView === "chat") {
        setIsExpanded(false);

        setTimeout(() => {
          if (previouslyFocusedElement.current) {
            previouslyFocusedElement.current.focus();
          }
        }, 0);
      } else if (isExpanded && currentView !== "chat") {
        setCurrentView("chat");
      } else {
        previouslyFocusedElement.current = document.activeElement as HTMLElement;

        setIsExpanded(true);
        setCurrentView("chat");
      }
    },
    {
      enableOnFormTags: true,
      enableOnContentEditable: true,
      ignoreEventWhen: () => !chatPanelEnabled,
    },
  );

  return (
    <RightPanelContext.Provider
      value={{
        isExpanded,
        currentView,
        togglePanel,
        hidePanel,
        switchView,
        setIsExpanded,
        chatInputRef,
      }}
    >
      {children}
    </RightPanelContext.Provider>
  );
}

export function useRightPanel() {
  const context = useContext(RightPanelContext);
  if (!context) {
    throw new Error("useRightPanel must be used within RightPanelProvider");
  }
  return context;
}
