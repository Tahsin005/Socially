import * as React from "react";
import { cn } from "@/lib/utils";

type MessageAlign = "start" | "end";

interface MessageContextValue {
  align: MessageAlign;
}

const MessageContext = React.createContext<MessageContextValue>({
  align: "start",
});

export function useMessageContext() {
  return React.useContext(MessageContext);
}

export interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: MessageAlign;
}

const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  ({ align = "start", className, children, ...props }, ref) => {
    return (
      <MessageContext.Provider value={{ align }}>
        <div
          ref={ref}
          className={cn(
            "flex w-full items-end gap-2 group/message",
            align === "end" ? "flex-row-reverse justify-start" : "flex-row justify-start",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </MessageContext.Provider>
    );
  }
);
Message.displayName = "Message";

export interface MessageGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

const MessageGroup = React.forwardRef<HTMLDivElement, MessageGroupProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-1 w-full", className)}
        {...props}
      />
    );
  }
);
MessageGroup.displayName = "MessageGroup";

export interface MessageAvatarProps extends React.HTMLAttributes<HTMLDivElement> {}

const MessageAvatar = React.forwardRef<HTMLDivElement, MessageAvatarProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "shrink-0 mb-1 flex items-center justify-center empty:w-8 empty:h-8",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
MessageAvatar.displayName = "MessageAvatar";

export interface MessageContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const MessageContent = React.forwardRef<HTMLDivElement, MessageContentProps>(
  ({ className, children, ...props }, ref) => {
    const { align } = useMessageContext();
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col max-w-[85%] sm:max-w-[75%]",
          align === "end" ? "items-end text-right" : "items-start text-left",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
MessageContent.displayName = "MessageContent";

export interface MessageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const MessageHeader = React.forwardRef<HTMLDivElement, MessageHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "text-xs text-muted-foreground mb-1 px-1 flex items-center gap-1 font-medium select-none",
          className
        )}
        {...props}
      />
    );
  }
);
MessageHeader.displayName = "MessageHeader";

export interface MessageFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const MessageFooter = React.forwardRef<HTMLDivElement, MessageFooterProps>(
  ({ className, ...props }, ref) => {
    const { align } = useMessageContext();
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-1 mt-1 px-1 text-[10px] text-muted-foreground select-none",
          align === "end" ? "justify-end" : "justify-start",
          className
        )}
        {...props}
      />
    );
  }
);
MessageFooter.displayName = "MessageFooter";

export {
  Message,
  MessageGroup,
  MessageAvatar,
  MessageContent,
  MessageHeader,
  MessageFooter,
};
