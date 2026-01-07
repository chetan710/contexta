import { useEffect, useState } from "react";

interface MessageProps {
    text: string;
    streaming?: boolean;
}

export default function TypingMessage({ text, streaming }: MessageProps) {
    const [displayedText, setDisplayedText] = useState("");

    // Handle streaming animation only
    useEffect(() => {
        if (!streaming) {
            return;
        }

        if (displayedText.length < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText(text.slice(0, displayedText.length + 1));
            }, 20);

            return () => clearTimeout(timeout);
        }
    }, [text, streaming, displayedText]);

    // When not streaming, use text directly; when streaming, use animated displayedText
    const finalText = streaming ? displayedText : (text ?? "");

    return (
        <div className="whitespace-pre-wrap">
            {finalText}
            {streaming === true && <span className="inline-block ml-1 animate-pulse">▍</span>}
        </div>
    );
}
