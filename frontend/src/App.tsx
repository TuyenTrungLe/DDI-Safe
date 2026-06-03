import { useEffect, useState } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { InteractionCheckPage } from "@/components/InteractionCheckPage";
import { PatientProfile } from "@/components/PatientProfile";
import { LoginDialog } from "@/components/LoginDialog";
import { Button } from "@/components/ui/button";
import useAuthStore from "@/stores/use-auth-store";
import { LogIn } from "lucide-react";
import ChatbotFab from "@/components/chatbot-fab";
import ChatbotModal from "@/components/chatbot-modal";
import ChatWidget from "@/components/chat-widget";
import useChatStore from "@/stores/use-chat-store";
import { drugInteractionAPI } from "@/lib/api";

function App() {
  const [currentPage, setCurrentPage] = useState<"interaction" | "profile">("interaction");
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const clearChat = useChatStore((state) => state.clear);

  useEffect(() => {
    clearChat();
    sessionStorage.removeItem("chat-session");
    drugInteractionAPI.clearChatSession().catch(() => {
      // Backend may not be running yet; local chat state is still reset.
    });
  }, [clearChat]);

  return (
    <SidebarProvider>
      <AppSidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center justify-between">
            <div></div>
            {!isAuthenticated && (
              <Button variant="outline" size="sm" onClick={() => setIsLoginOpen(true)}>
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-6 ml-44">
          <div className={currentPage === "interaction" ? "block" : "hidden"}>
            <InteractionCheckPage />
          </div>
          <div className={currentPage === "profile" ? "block" : "hidden"}>
            <PatientProfile />
          </div>
        </div>
      </SidebarInset>
      <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />
      <ChatbotFab />
      <ChatbotModal />
      <ChatWidget />
    </SidebarProvider>
  );
}

export default App;
