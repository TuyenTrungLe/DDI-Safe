import { Conversation, ConversationContent } from "@/components/ui/shadcn-io/ai/conversation";
import { Message, MessageAvatar, MessageContent } from "@/components/ui/shadcn-io/ai/message";
import { PromptInputSubmit, PromptInputTextarea } from "@/components/ui/shadcn-io/ai/prompt-input";

import { nanoid } from "nanoid";
import { type FormEventHandler, useCallback, useState, useEffect } from "react";
import { Maximize2, Minimize2, X } from "lucide-react";
import useChatStore, { type ChatMessageItem } from "@/stores/use-chat-store";
import useGlobalStore from "@/stores/use-global-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ChatWidget = () => {
    const { messages, addMessage, updateMessage } = useChatStore();
    const { isChatbotOpen, closeChatbot, interactionContext } = useGlobalStore();

    const [inputValue, setInputValue] = useState("");
    const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
    const [isTyping, setIsTyping] = useState(false);
    const [streamingTextMap, setStreamingTextMap] = useState<Record<string, string>>({});
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    const simulateTyping = useCallback((messageId: string, content: string) => {
        let currentIndex = 0;
        setStreamingTextMap((messages) => ({ ...messages, [messageId]: "" }));
        const typeInterval = setInterval(() => {
            currentIndex += Math.random() > 0.2 ? 4 : 3;
            const nextIndex = Math.min(currentIndex, content.length);
            setStreamingTextMap((messages) => ({
                ...messages,
                [messageId]: content.slice(0, nextIndex),
            }));

            if (nextIndex >= content.length) {
                clearInterval(typeInterval);
                setStreamingTextMap((messages) => {
                    const { [messageId]: _removed, ...rest } = messages;
                    return rest;
                });
                setIsTyping(false);
            }
        }, 20);
        return () => clearInterval(typeInterval);
    }, []);

    const sendMessage = useCallback(
        async (text: string) => {
            if (!text.trim() || isTyping || !isOnline) return;

            const userMessage: ChatMessageItem = {
                id: nanoid(),
                content: text.trim(),
                role: "user",
            };
            addMessage(userMessage);

            const assistantMessageId = nanoid();
            const assistantMessage: ChatMessageItem = {
                id: assistantMessageId,
                content: "",
                role: "assistant",
            };
            addMessage(assistantMessage);
            setIsTyping(true);

            try {
                const result = await import("@/lib/api").then(({ drugInteractionAPI }) => drugInteractionAPI.chat(text.trim()));

                updateMessage(assistantMessageId, { content: result.answer });
                simulateTyping(assistantMessageId, result.answer);
            } catch {
                const assistantMessageError: ChatMessageItem = {
                    id: assistantMessageId,
                    content: !isOnline ? "You are offline. Please check your network and try again." : "Sorry, there was an error calling the chatbot.",
                    role: "assistant",
                };
                addMessage(assistantMessageError);
                setIsTyping(false);
            }
        },
        [addMessage, isTyping, simulateTyping, updateMessage, isOnline]
    );

    const handleSubmit: FormEventHandler<HTMLFormElement> = useCallback(
        async (event) => {
            event.preventDefault();
            if (!inputValue.trim()) return;
            const text = inputValue;
            setInputValue("");
            await sendMessage(text);
        },
        [inputValue, sendMessage]
    );

    // Only show as a small widget on medium+ screens; on small screens the Drawer modal handles it
    if (!isChatbotOpen) return null;

    return (
        <div className="hidden md:flex fixed bottom-6 right-6 z-50">
            <div
                className={cn(
                    "origin-bottom-right rounded-lg shadow-lg overflow-hidden bg-white border flex flex-col transition-[width,height,box-shadow] duration-200 ease-out",
                    isExpanded ? "shadow-2xl" : "shadow-lg"
                )}
                style={{
                    width: isExpanded ? "min(96vw, 960px)" : "480px",
                    height: isExpanded ? "min(90vh, 760px)" : "600px",
                }}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-14 w-10">
                            <AvatarImage loading="eager" src="/bot.svg" alt="DDI Bot" />
                            <AvatarFallback>MB</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold">DDI Bot</span>
                            <span className={`text-xs ${isOnline ? "text-green-600" : "text-red-600"}`}>{isOnline ? "Online" : "Offline"}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsExpanded((value) => !value)}
                            aria-label={isExpanded ? "Thu nhỏ chat" : "Mở rộng chat"}
                        >
                            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => closeChatbot()} aria-label="Close chat">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                {interactionContext.length > 0 && (
                    <div className="border-b bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Current ingredients:</span>{" "}
                        {interactionContext.join(", ")}
                    </div>
                )}
                <div className="flex-1 overflow-hidden">
                    <Conversation className="h-full overflow-auto p-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <ConversationContent>
                            {messages.map((message, index) => (
                                <div key={message.id} className={cn(index === messages.length - 1 && (!isTyping ? "mb-34" : "mb-22"))}>
                                    <Message from={message.role}>
                                        <MessageContent>
                                            {streamingTextMap[message.id] ?? message.content}
                                        </MessageContent>
                                        {message.role === "assistant" && <MessageAvatar src="/bot.svg" name="DDI Bot" />}
                                    </Message>
                                </div>
                            ))}
                        </ConversationContent>
                    </Conversation>
                </div>
                <div className="p-3 border-t">
                    <form onSubmit={handleSubmit} className="flex gap-2 items-end">
                        <PromptInputTextarea
                            value={inputValue}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputValue(e.target.value)}
                            placeholder="Write your message"
                            disabled={isTyping}
                            className="flex-1 h-10 resize-none"
                        />
                        <PromptInputSubmit disabled={!inputValue.trim() || isTyping || !isOnline} status={isTyping ? "streaming" : "ready"} variant="secondary" />
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChatWidget;
