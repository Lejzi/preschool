import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Plus, Loader2, MessageSquare, X } from "lucide-react";
import { clsx } from "clsx";
import { useConversations, useCreateConversation } from "@/hooks/useMessages";
import { useKids } from "@/hooks/useKids";
import { useStaff } from "@/hooks/useStaff";
import { useGroups } from "@/hooks/useGroups";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { useActivePreschoolContext } from "@/hooks/usePreschool";
import { Select } from "@/components/ui/Select";

export function MessagesPage() {
  const { t } = useTranslation();
  const { preschoolCode } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuthStore();
  const { preschoolId, role, isResolvingPreschool } = useActivePreschoolContext();
  const isStaff = role === "admin" || role === "teacher" || role === "superadmin";

  const { data: conversations = [], isLoading } = useConversations(
    preschoolId || "",
    userProfile?.id || ""
  );

  const { data: allKids = [] } = useKids(preschoolId || "");
  const { data: groups = [] } = useGroups(preschoolId || "");
  // Fetch staff just in case parents need to chat with them (MVP: parents chat with assigned teacher, or staff chats with parent)
  const { data: staff = [] } = useStaff(preschoolId || ""); 
  const kids = isStaff
    ? allKids
    : allKids.filter(
        (kid) =>
          kid.parentIds?.includes(userProfile?.id || "") ||
          userProfile?.linkedKidIds?.includes(kid.id),
      );

  const { mutate: createConv, isPending: isCreating } = useCreateConversation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetType, setTargetType] = useState<"kid" | "group">("kid");
  const [selectedKidId, setSelectedKidId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!preschoolId || !userProfile) return;

    let participantIds: string[] = [];
    if (targetType === "group" && isStaff) {
      const group = groups.find((item) => item.id === selectedGroupId);
      if (!group) return;

      const groupKids = allKids.filter((kid) => kid.groupId === group.id);
      participantIds = Array.from(
        new Set([
          userProfile.id,
          ...group.teacherIds,
          ...groupKids.flatMap((kid) => kid.parentIds || []),
        ].filter(Boolean)),
      );

      createConv(
        {
          preschoolId,
          participantIds,
          type: "group",
          groupId: group.id,
          groupName: group.name,
        },
        {
          onSuccess: (newConv) => {
            setIsModalOpen(false);
            setSelectedGroupId("");
            navigate(`/${preschoolCode}/messages/${newConv.id}`);
          },
        },
      );
      return;
    }

    const kid = kids.find(k => k.id === selectedKidId);
    if (!kid) return;

    if (isStaff) {
      participantIds = [userProfile.id, ...(kid.parentIds || [])];
    } else {
      participantIds = [userProfile.id, ...staff.map(s => s.id)];
    }

    participantIds = Array.from(new Set(participantIds.filter(Boolean)));

    createConv({
      preschoolId,
      participantIds,
      type: "kid",
      kidId: kid.id,
      kidName: `${kid.firstName} ${kid.lastName}`,
    }, {
      onSuccess: (newConv) => {
        setIsModalOpen(false);
        setSelectedKidId("");
        navigate(`/${preschoolCode}/messages/${newConv.id}`);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t("messages.title")}</h1>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
          {t("messages.newConversation")}
        </button>
      </div>

      {isLoading || isResolvingPreschool ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="card text-center py-12 text-slate-500 border-dashed">
          <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p>{t("messages.noConversations", "Brak wiadomości")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => {
            const timeAgo = conv.lastMessage?.createdAt?.seconds 
              ? formatDistanceToNow(new Date(conv.lastMessage.createdAt.seconds * 1000), { addSuffix: true, locale: pl })
              : "";
              
            // A simple unread check: if last message wasn't from me and isn't read
            const isUnread = conv.lastMessage && !conv.lastMessage.read && conv.lastMessage.senderId !== userProfile?.id;

            const displayTitle =
              conv.type === "group" ? conv.groupName || t("messages.groupConversation") : conv.kidName;
            const displaySubtitle =
              conv.type === "group"
                ? t("messages.groupConversationLabel")
                : t("messages.regarding", { kidName: conv.kidName });

            return (
              <Link
                key={conv.id}
                to={`/${preschoolCode}/messages/${conv.id}`}
                className={clsx(
                  "card flex items-center gap-4 transition-all duration-150 hover:-translate-y-0.5",
                  isUnread ? "bg-white border-brand-200 shadow-md ring-1 ring-brand-500/10" : "hover:shadow-md"
                )}
              >
                <div className="w-11 h-11 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm shrink-0 uppercase">
                  {(displayTitle || "")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between">
                    <p className={clsx("text-sm truncate", isUnread ? "font-bold text-slate-900" : "font-semibold text-slate-800")}>
                      {displayTitle}
                    </p>
                    <span className={clsx("text-xs shrink-0 ml-2", isUnread ? "text-brand-600 font-medium" : "text-slate-400")}>
                      {timeAgo}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{displaySubtitle}</p>
                  <p className="text-xs text-slate-500 truncate font-medium">
                    {conv.lastMessage?.senderId === userProfile?.id ? "Ty: " : ""}
                    {conv.lastMessage?.text || "Brak wiadomości. Napisz jako pierwszy!"}
                  </p>
                </div>
                {isUnread && (
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-600 shrink-0 shadow-sm" />
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* New Conversation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="card w-full max-w-md animate-fade-in relative">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-lg font-bold text-slate-900">{t("messages.newConversation")}</h2>
              <button disabled={isCreating} className="btn-ghost p-2" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-4">
              {isStaff && (
                <div>
                  <label className="label">{t("messages.conversationType")}</label>
                  <Select
                    value={targetType}
                    onChange={(value) => {
                      setTargetType(value as "kid" | "group");
                      setSelectedKidId("");
                      setSelectedGroupId("");
                    }}
                    options={[
                      { value: "kid", label: t("messages.childConversation") },
                      { value: "group", label: t("messages.groupConversation") },
                    ]}
                  />
                </div>
              )}

              {targetType === "group" && isStaff ? (
                <div>
                  <label className="label">{t("messages.selectGroup")}</label>
                  <Select
                    value={selectedGroupId}
                    onChange={setSelectedGroupId}
                    placeholder={t("messages.selectGroupPlaceholder")}
                    options={groups.map((group) => ({
                      value: group.id,
                      label: group.name,
                    }))}
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    {t("messages.groupConversationHint")}
                  </p>
                </div>
              ) : (
              <div>
                <label className="label">{t("messages.selectChild")}</label>
                <Select
                  value={selectedKidId} 
                  onChange={setSelectedKidId}
                  placeholder={t("messages.selectChildPlaceholder")}
                  options={kids.map((k) => ({
                    value: k.id,
                    label: `${k.firstName} ${k.lastName}`,
                  }))}
                />
                <p className="text-xs text-slate-400 mt-2">
                  {isStaff
                    ? t("messages.childConversationHintStaff")
                    : t("messages.childConversationHintParent")}
                </p>
              </div>
              )}

              <div className="pt-2 flex gap-3">
                <button type="button" disabled={isCreating} className="btn-ghost flex-1" onClick={() => setIsModalOpen(false)}>
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isCreating || (targetType === "group" && isStaff ? !selectedGroupId : !selectedKidId)}
                  className="btn-primary flex-1"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : t("messages.startConversation")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
