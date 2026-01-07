"use client";

import { useState, useRef, useEffect } from "react";
import { FileText, Bot, User, Sparkles, Plus, Loader2, Moon, Sun, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatInput from "@/components/ui/chatInput";
import TypingMessage from "@/components/ui/typingMessage";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  text: string;
  streaming?: boolean;
  sources?: {
    id: number;
    preview: string;
    active?: boolean;
  }[];
};

export default function RagApp() {
  const [darkMode, setDarkMode] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function uploadPdf() {
    if (!file) return;
    setLoading(true);


    const formData = new FormData();
    formData.append("file", file);


    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });


    const data = await res.json();
    setDocumentId(data.documentId);
    setMessages([{ role: "system", text: "PDF uploaded successfully." }]);
    setLoading(false);
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function extractSources(text: string): number[] {
    const regex = /\[Source (\d+)\]/g;
    const found = new Set<number>();
    let match;

    while ((match = regex.exec(text))) {
      found.add(Number(match[1]));
    }
    return [...found];
  }

  async function askQuestion() {
    if (!question || !documentId) return;

    const userMessage: ChatMessage = { role: "user", text: question };
    const nextMessages = [...messages, userMessage];
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setMessages(nextMessages);
    setQuestion("");
    setLoading(true);

    const assistantIndex = nextMessages.length;
    setMessages((prev) => [
      ...prev,
      { role: "assistant", text: "", streaming: true },
    ]);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          question,
          messages: nextMessages,
        }),
        signal: abortRef.current?.signal,
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      console.log('reader started');
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop()!;
        console.log('lines', lines);
        for (const line of lines) {
          if (!line.trim()) continue;

          const msg = JSON.parse(line);
          console.log('msg', msg);

          setMessages((prev) => {
            const copy = [...prev];
            const assistant = copy[assistantIndex];

            if (!assistant) return prev;

            if (msg.type === "token") {
              const newText = assistant.text + msg.value;

              // 🔹 Extract referenced sources so far
              const usedSourceIds = extractSources(newText);

              copy[assistantIndex] = {
                ...assistant,
                text: newText,
                sources: assistant.sources?.length
                  ? assistant.sources.map((s) => ({
                      ...s,
                      active: usedSourceIds.includes(s.id),
                    }))
                  : assistant.sources,
              };
            } else if (msg.type === "sources") {
              copy[assistantIndex] = {
                ...assistant,
                sources: msg.value,
              };
            } else if (msg.type === "done") {
              copy[assistantIndex] = {
                ...assistant,
                streaming: false,
              };
            }

            return copy;
          });
        }
      }
    } catch (err) {
      // Handle AbortError gracefully - this is expected when stopping generation
      if (err instanceof Error && err.name === "AbortError") {
        // Generation was stopped intentionally
        return;
      }
      // Re-throw other errors
      throw err;
    } finally {
      setLoading(false);
    }
  }

  function stopGeneration() {
    if (!abortRef.current || abortRef.current.signal.aborted) return;

    abortRef.current.abort();

    setMessages((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];

      if (last?.role === "assistant" && last.streaming) {
        last.streaming = false;
        last.text += "\n\n⏹️ *Generation stopped*";
      }

      return copy;
    });

    setLoading(false);
  }

  const theme = darkMode
    ? {
      bg: "bg-[#1A1C1E]",
      sidebar: "bg-[#121416]",
      card: "bg-[#232629]",
      text: "text-slate-200",
      muted: "text-slate-400",
      border: "border-slate-800",
      accent: "bg-emerald-600 hover:bg-emerald-500",
      bubbleAi: "bg-[#232629] border-slate-700 text-slate-200",
      bubbleUser: "bg-emerald-700 text-emerald-50"
    }
    : {
      bg: "bg-[#FBFBFA]", // Warm Off-white
      sidebar: "bg-[#F2F2EE]", // Soft Sage-Grey
      card: "bg-white",
      text: "text-[#3C403D]", // Soft Charcoal
      muted: "text-[#7E857F]",
      border: "border-[#E2E4E0]",
      accent: "bg-[#5E7A67] hover:bg-[#4D6454]", // Muted Sage Green
      bubbleAi: "bg-white border-[#E2E4E0] text-[#3C403D]",
      bubbleUser: "bg-[#5E7A67] text-white"
    };

  return (
    <div className={`flex h-screen ${theme.bg} ${theme.text} antialiased transition-colors duration-500`}>
      {/* Sidebar */}
      <aside className={`w-72 border-r ${theme.border} ${theme.sidebar} p-6 flex flex-col gap-8`}>
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Leaf className={`w-5 h-5 ${darkMode ? 'text-emerald-400' : 'text-[#5E7A67]'}`} />
            <h1 className="text-lg font-semibold tracking-tight">Contexta</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDarkMode(!darkMode)}
            className="rounded-full hover:bg-black/5 dark:hover:bg-white/5"
          >
            {darkMode ? <Sun className="w-4 h-4 text-orange-300" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </Button>
        </div>

        <div className="space-y-4">
          <p className={`text-[10px] font-bold uppercase tracking-widest px-2 ${theme.muted}`}>Library</p>
          <div className="relative group">
            <input type="file" id="file-upload" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <label
              htmlFor="file-upload"
              className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed ${theme.border} rounded-3xl hover:border-emerald-500/50 transition-all cursor-pointer ${theme.card} group/label`}
            >
              {file ? (
                <div className="text-center p-4">
                  <FileText className="w-8 h-8 text-emerald-600/60 mx-auto mb-2" />
                  <p className="text-xs font-medium truncate w-40">{file.name}</p>
                </div>
              ) : (
                <>
                  <Plus className={`w-5 h-5 mb-2 ${theme.muted} group-hover/label:text-emerald-600`} />
                  <span className={`text-xs font-medium ${theme.muted}`}>Add Document</span>
                </>
              )}
            </label>
          </div>

          <Button onClick={uploadPdf} disabled={!file || loading} className={`w-full ${theme.accent} text-white rounded-2xl py-6 shadow-sm cursor-pointer`}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Begin Reading"}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden relative" >
          <ScrollArea className="h-full">
            <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
              {messages.length === 0 && (
                <div className="h-[40vh] flex flex-col items-center justify-center text-center opacity-60">
                  <div className={`p-4 rounded-full border ${theme.border} mb-4`}>
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-medium">Quiet your mind, ask your text.</h2>
                  <p className={`text-sm mt-2 max-w-xs ${theme.muted}`}>Your document has been indexed. I&apos;m here to help you understand it deeply.</p>
                </div>
              )}

              {messages.map((m, i) => (
                <div
                  key={i}
                  // Use flex row, and only reverse the row for the user
                  className={`flex w-full gap-4 mb-6 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar - Fixed size */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border shadow-sm ${theme.border
                    } ${m.role === "user" ? theme.accent + " text-white" : theme.card}`}>
                    {m.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>

                  {/* Message Content - Grows to fill space */}
                  <div className={`flex flex-col flex-1 ${m.role === "user" ? "items-end" : "items-start"}`}>
                    <div
                      className={`
                        relative max-w-[85%] p-5 rounded-3xl text-[15px] leading-relaxed border shadow-sm transition-all 
                        wrap-break-word whitespace-pre-wrap
                        ${m.role === "user"
                          ? `${theme.bubbleUser} rounded-tr-none`
                          : `${theme.bubbleAi} rounded-tl-none`
                        }
                      `}
                    >
                      <TypingMessage text={m.text} streaming={m.streaming} />
                    </div>

                    {/* Sources - Now properly aligned under the bubble */}
                    {m.sources && m.sources.length > 0 && (
                      <div className={`w-full max-w-[85%] mt-3 flex flex-wrap gap-2 text-xs ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                        <span className={`${theme.muted} uppercase tracking-widest text-[10px] font-bold mr-1 self-center`}>
                          Sources:
                        </span>
                        {m.sources.map((s) => (
                          <div
                            key={s.id}
                            className={`
                              group relative inline-flex items-center gap-1
                              cursor-pointer rounded-full border px-3 py-1 text-xs font-medium
                              transition-all duration-200
                              ${s.active
                                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-white/60 text-slate-600 hover:bg-white hover:text-slate-800"
                              }
                            `}
                          >
                            <span className="select-none">Source</span>
                            <span className="font-semibold">#{s.id}</span>

                            {/* Tooltip */}
                            <div
                              className="
                                absolute left-0 top-full z-50 mt-2 hidden w-80
                                rounded-xl border border-slate-200 bg-white
                                p-4 text-xs leading-relaxed text-slate-600
                                shadow-xl
                                group-hover:block
                                animate-in fade-in slide-in-from-top-1
                              "
                            >
                              <div className="mb-2 flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <p className="font-semibold text-slate-900">Source excerpt</p>
                              </div>

                              <p className="whitespace-pre-wrap">{s.preview}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Input - Fixed at bottom */}
        <ChatInput stopGeneration={stopGeneration} askQuestion={askQuestion} loading={loading} documentId={documentId} question={question} setQuestion={setQuestion} theme={theme} />
      </main>
    </div>
  );
}