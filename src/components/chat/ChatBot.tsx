import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { Link } from "@tanstack/react-router";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Welcome to **Wings Design Studio**. I'm your AI concierge. How can I elevate your brand today?",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isLoading]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customText) setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: { 
          message: textToSend,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data?.reply || "I'm having trouble connecting to my brain. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Oops! I encountered a turbulence. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickReplies = [
    { label: "Our Services", text: "What services do you offer?" },
    { label: "Get a Quote", text: "How can I get a quote for a project?" },
    { label: "View Portfolio", text: "Can I see some of your previous work?" },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4 pointer-events-none">
      <style dangerouslySetInnerHTML={{ __html: `
        .chat-scrollbar::-webkit-scrollbar { width: 4px; }
        .chat-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .chat-scrollbar::-webkit-scrollbar-thumb { 
          background: rgba(var(--primary), 0.1); 
          border-radius: 10px; 
        }
        .chat-scrollbar::-webkit-scrollbar-thumb:hover { 
          background: rgba(var(--primary), 0.2); 
        }
        .glass-panel {
          background: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(40px) saturate(200%);
          -webkit-backdrop-filter: blur(40px) saturate(200%);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }
        .dark .glass-panel {
          background: rgba(10, 10, 10, 0.5);
          backdrop-filter: blur(40px) saturate(200%);
          -webkit-backdrop-filter: blur(40px) saturate(200%);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .message-glass {
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
      `}} />

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Full Screen Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
              animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
              exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[-1] bg-black/20 pointer-events-auto"
            />
            <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 40, scale: 0.95, filter: "blur(10px)" }}
            className="w-[400px] max-w-[calc(100vw-48px)] h-[600px] max-h-[calc(100vh-120px)] pointer-events-auto relative"
          >
            {/* Main Window */}
            <Card className="h-full flex flex-col overflow-hidden glass-panel shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border-none rounded-3xl">
              {/* Header */}
              <div className="relative overflow-hidden pt-6 pb-4 px-6 bg-gradient-to-br from-primary/10 via-transparent to-primary/5">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-pulse" />
                      <Avatar className="h-12 w-12 border-2 border-white/50 dark:border-white/10 shadow-xl relative">
                        <AvatarImage src="/favicon.ico" />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <Bot size={24} />
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-zinc-900 bg-green-500 shadow-sm" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold tracking-tight flex items-center gap-2">
                        Wings Concierge
                        <Sparkles size={14} className="text-amber-500" />
                      </CardTitle>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Ready to assist</p>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsOpen(false)}
                    className="rounded-full h-9 w-9 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  >
                    <X size={20} className="text-muted-foreground" />
                  </Button>
                </div>
              </div>

              {/* Chat Area */}
              <div 
                className="flex-1 px-6 py-6 overflow-y-auto chat-scrollbar" 
                ref={scrollRef}
              >
                <div className="space-y-8">
                  {messages.map((message, idx) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: idx === messages.length - 1 ? 0.1 : 0 }}
                      className={cn(
                        "flex gap-3",
                        message.role === "user" ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      {message.role === "assistant" && (
                        <Avatar className="h-8 w-8 shrink-0 border border-black/5 dark:border-white/5 shadow-sm mt-1">
                          <AvatarFallback className="bg-primary/5 text-primary">
                            <Bot size={16} />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex flex-col gap-1.5 max-w-[85%]">
                        <div className={cn(
                          "rounded-2xl px-4 py-3 text-sm shadow-sm prose prose-sm dark:prose-invert prose-p:my-0 prose-headings:my-1 prose-a:font-bold prose-a:underline transition-all",
                          message.role === "user" 
                            ? "bg-primary text-primary-foreground rounded-tr-none prose-p:text-primary-foreground prose-strong:text-primary-foreground prose-headings:text-primary-foreground prose-a:text-white shadow-primary/20" 
                            : "bg-white/60 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5 rounded-tl-none message-glass"
                        )}>
                          <ReactMarkdown
                            components={{
                              a: ({ node, ...props }) => {
                                const isExternal = props.href?.startsWith("http");
                                const href = props.href === "/contact" ? "/contact" : props.href;
                                if (isExternal) return <a {...props} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1" />;
                                return (
                                  <Link to={href as any} className="inline-flex items-center gap-1 group font-bold">
                                    {props.children}
                                    <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                  </Link>
                                );
                              }
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                        <span className={cn(
                          "text-[9px] font-medium uppercase tracking-wider text-muted-foreground/50",
                          message.role === "user" ? "text-right mr-1" : "ml-1"
                        )}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 flex-row">
                      <Avatar className="h-8 w-8 shrink-0 bg-primary/5 border border-primary/10 shadow-sm animate-pulse">
                        <AvatarFallback className="text-primary"><Bot size={16} /></AvatarFallback>
                      </Avatar>
                      <div className="bg-white/40 dark:bg-zinc-800/20 border border-black/5 dark:border-white/5 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-3 shadow-sm message-glass">
                        <div className="flex gap-1">
                          <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} className="h-1.5 w-1.5 rounded-full bg-primary" />
                          <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="h-1.5 w-1.5 rounded-full bg-primary" />
                          <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="h-1.5 w-1.5 rounded-full bg-primary" />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Wings Thinking</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Input Area */}
              <CardFooter className="p-6 pt-2 border-t border-black/5 dark:border-white/5 flex flex-col gap-4">
                {messages.length < 4 && !isLoading && (
                  <div className="flex flex-wrap gap-2 overflow-x-auto no-scrollbar pb-1">
                    {quickReplies.map((reply) => (
                      <button
                        key={reply.label}
                        onClick={() => handleSend(reply.text)}
                        className="text-[11px] whitespace-nowrap font-bold uppercase tracking-wider px-4 py-2 rounded-xl bg-primary/5 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/10 transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        {reply.label}
                        <ArrowRight size={12} />
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex w-full gap-2 items-center relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
                  <Input
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    className="flex-1 bg-white/50 dark:bg-black/40 border-black/10 dark:border-white/10 focus-visible:ring-primary/50 h-12 pr-14 rounded-2xl relative z-10 backdrop-blur-md transition-all placeholder:text-muted-foreground/50"
                  />
                  <Button 
                    size="icon" 
                    onClick={() => handleSend()} 
                    disabled={!input.trim() || isLoading}
                    className="absolute right-1.5 h-9 w-9 rounded-xl shadow-xl hover:shadow-primary/30 transition-all active:scale-95 z-20"
                  >
                    <Send size={18} />
                  </Button>
                </div>
                <div className="flex items-center justify-center gap-2 opacity-30 grayscale hover:grayscale-0 transition-all">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Powered by Wings AI</p>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-16 w-16 rounded-full flex items-center justify-center shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] border-none pointer-events-auto transition-all duration-700 relative overflow-hidden group",
          isOpen 
            ? "bg-white dark:bg-zinc-900 text-foreground" 
            : "bg-primary text-primary-foreground"
        )}
      >
        {!isOpen && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            >
              <X size={28} />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="relative"
            >
              <MessageCircle size={30} />
              <motion.div 
                animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -top-1 -right-1 h-5 w-5 bg-primary/30 rounded-full"
              />
              <div className="absolute top-0 right-0 h-3 w-3 bg-red-500 border-2 border-primary rounded-full shadow-sm" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};
