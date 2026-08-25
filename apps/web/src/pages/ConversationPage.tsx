import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams, Link } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Send, ArrowLeft, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { useConversation, useMessages, useSendMessage } from "@/hooks/useMessages";
import { useActivePreschoolContext } from "@/hooks/usePreschool";

export function ConversationPage() {
  const { t } = useTranslation();
  const { preschoolCode, conversationId } = useParams();
  const { userProfile } = useAuthStore();
  const { preschoolId, isResolvingPreschool } = useActivePreschoolContext();
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");

  const { data: conversation, isLoading: isConvLoading } = useConversation(conversationId || "");
  const { data: messages = [], isLoading: isMsgLoading } = useMessages(conversationId || "");
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();

  useEffect(() => {
    // Scroll to bottom on initial load and when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || !conversationId || !preschoolId || !userProfile || !conversation) return;

    sendMessage({
      conversationId,
      preschoolId,
      senderId: userProfile.id,
      senderName: userProfile.displayName || "Nieznany użytkownik",
      participantIds: conversation.participantIds,
      text: trimmed,
    }, {
      onSuccess: () => {
        setText("");
        setTimeout(() => {
          bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    });
  };

  const isLoading = isConvLoading || isMsgLoading || isResolvingPreschool;

  if (isLoading) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)] items-center justify-center">
         <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)] items-center justify-center">
         <p className="text-slate-500">Konwersacja nie istnieje.</p>
         <Link to={`/${preschoolCode}/messages`} className="btn-primary mt-4">Wróć do wiadomości</Link>
      </div>
    );
  }

  // Display details
  // If we had more user details mapped we could show full names, but for MVP we use kidName 
  // and the notion that the conversation is about this kid.
  const displayTitle =
    conversation.type === "group"
      ? conversation.groupName || t("messages.groupConversation")
      : conversation.kidName || t("messages.childConversation");
  const displayInitials = displayTitle.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  const subtitle =
    conversation.type === "group"
      ? t("messages.groupConversationLabel")
      : t("messages.regarding", { kidName: displayTitle });

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="card mb-4 flex items-center gap-3 py-4">
        <Link to={`/${preschoolCode}/messages`} className="btn-ghost p-2">
          <ArrowLeft size={18} />
        </Link>
        <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center font-bold text-brand-700 shrink-0">
          {displayInitials}
        </div>
        <div>
          <p className="font-semibold text-slate-900">{displayTitle}</p>
          <p className="text-xs text-slate-400">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 italic text-sm">
            Napisz pierwszą wiadomość!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === userProfile?.id;
            const timeRaw = msg.createdAt?.seconds 
              ? new Date(msg.createdAt.seconds * 1000) 
              : new Date();
            const timeStr = `${timeRaw.getHours().toString().padStart(2, "0")}:${timeRaw.getMinutes().toString().padStart(2, "0")}`;

            return (
              <div
                key={msg.id}
                className={clsx("flex gap-2", isMe && "flex-row-reverse")}
              >
                {!isMe && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0 mt-1 uppercase" title={msg.senderName}>
                    {msg.senderName[0] || "?"}
                  </div>
                )}
                <div
                  className={clsx(
                    "max-w-[75%] rounded-2xl px-4 py-2.5",
                    isMe
                      ? "bg-brand-600 text-white rounded-br-sm"
                      : "bg-white text-slate-800 border border-slate-100 rounded-bl-sm shadow-sm",
                  )}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <div className="flex items-center justify-between mt-1 gap-4">
                    {!isMe && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        {msg.senderName}
                      </span>
                    )}
                    <span
                      className={clsx(
                        "text-[10px] ml-auto",
                        isMe ? "text-brand-200" : "text-slate-400",
                      )}
                    >
                      {timeStr}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-2">
        <input
          className="input flex-1"
          placeholder={t("messages.typeMessage")}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={isSending}
        />
        <button
          className="btn-primary px-4"
          onClick={handleSend}
          disabled={!text.trim() || isSending}
        >
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}
