import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Loader2, CircleStop } from "lucide-react";

interface ChatInputProps {
    stopGeneration: () => void;
    askQuestion: () => void;
    loading: boolean;
    documentId: string | null;
    question: string;
    setQuestion: (value: string) => void;
    theme: {
        darkMode?: boolean;
        card: string;
        border: string;
        accent: string;
    };
}

export default function ChatInput({ stopGeneration, askQuestion, loading, documentId, question, setQuestion, theme }: ChatInputProps) {
    const [activeSubmit, setActiveSubmit] = useState(false);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            setActiveSubmit(true);        // Highlight the button
            askQuestion();
            setTimeout(() => setActiveSubmit(false), 200); // Remove highlight quickly
        }
    };

    return (
        <div className={`p-8 pt-0 bg-linear-to-t from-${theme.darkMode ? '[#1A1C1E]' : '[#FBFBFA]'} via-${theme.darkMode ? '[#1A1C1E]' : '[#FBFBFA]'} to-transparent`}>
            <div className="max-w-3xl mx-auto">
                <div className={`flex items-end gap-3 ${theme.card} border ${theme.border} rounded-[2rem] p-3 pl-6 shadow-xl`}>
                    <Textarea
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Share a thought or question..."
                        className="flex-1 bg-transparent border-none focus-visible:ring-0 resize-none min-h-[44px] max-h-32 py-3"
                        onKeyDown={handleKeyDown}
                    />
                    <Button
                        onClick={askQuestion}
                        disabled={loading || !documentId}
                        size="icon"
                        className={`h-11 w-11 rounded-full text-white cursor-pointer ${theme.accent} 
                          ${activeSubmit ? "ring-2 ring-white animate-pulse" : ""} 
                          ${loading ? "animate-pulse" : ""}`}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                    {loading && (
                        <Button
                            onClick={stopGeneration}
                            variant="outline"
                            size="icon"
                            className={`h-11 w-11 rounded-full text-white cursor-pointer ${theme.accent} hover:bg-${theme.accent}/20`}
                        >
                            <CircleStop className="w-4 h-4 text-white" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
