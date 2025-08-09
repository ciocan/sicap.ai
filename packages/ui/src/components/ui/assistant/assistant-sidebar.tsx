import type { FC, PropsWithChildren } from "react";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@sicap/ui/components/ui/resizable";
import { Thread } from "@sicap/ui/components/ui/assistant/thread";

export const AssistantSidebar: FC<PropsWithChildren> = ({ children }) => {
  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel>{children}</ResizablePanel>
      <ResizableHandle />
      <ResizablePanel>
        <Thread />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
