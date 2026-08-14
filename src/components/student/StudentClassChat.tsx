import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, MessageSquareIcon, Paperclip } from 'lucide-react';
import { formatDateTime, getClassChatId } from '../../lib/utils';

interface StudentClassChatProps {
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  level: string;
}

export default function StudentClassChat({
  studentName,
  studentEmail,
  courseTitle,
  level,
}: StudentClassChatProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const channelId = getClassChatId('Program', courseTitle, level);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('idla_local_class_messages') || '[]');
      const filtered = stored.filter((m: any) => m.channelId === channelId);
      if (filtered.length > 0) {
        setMessages(filtered);
      } else {
        setMessages([
          {
            id: 'welcome-1',
            senderName: 'Enseignant Referent',
            sender: 'teacher',
            text: `Bienvenue dans le salon virtuel de ${courseTitle} (${level}). Posez vos questions ici.`,
            time: 'Aujourd\'hui',
          },
        ]);
      }
    } catch (e) {
      setMessages([]);
    }
  }, [channelId, courseTitle, level]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      channelId,
      senderName: studentName || 'Étudiant',
      senderEmail: studentEmail,
      sender: 'student',
      text: inputText.trim(),
      time: formatDateTime(new Date().toISOString()),
      createdAt: new Date().toISOString(),
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    setInputText('');

    try {
      const allMsgs = JSON.parse(localStorage.getItem('idla_local_class_messages') || '[]');
      allMsgs.push(newMsg);
      localStorage.setItem('idla_local_class_messages', JSON.stringify(allMsgs));
    } catch (e) {}
  };

  return (
    <div className="bg-bg-secondary border border-border-primary rounded-2xl h-[600px] flex flex-col shadow-sm overflow-hidden animate-fadeIn">
      {/* Chat Header */}
      <div className="p-4 bg-bg-primary border-b border-border-primary flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-light text-brand-primary flex items-center justify-center font-bold">
            <MessageSquareIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-primary line-clamp-1">{courseTitle} ({level})</h2>
            <p className="text-[11px] text-text-secondary">Salon de discussion de classe IDLA</p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
          En ligne
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isMe = msg.sender === 'student';
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold text-text-secondary">{msg.senderName}</span>
                <span className="text-[10px] text-text-secondary/70">{msg.time}</span>
              </div>
              <div
                className={`max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  isMe
                    ? 'bg-brand-primary text-white rounded-tr-none shadow-sm'
                    : 'bg-bg-primary border border-border-primary/60 text-text-primary rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSendMessage} className="p-3 bg-bg-primary border-t border-border-primary flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Écrivez un message à votre classe..."
          className="flex-1 bg-bg-secondary border border-border-primary rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-brand-primary text-text-primary"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="bg-brand-primary hover:bg-brand-hover disabled:opacity-50 text-white p-2.5 rounded-xl transition-all shadow cursor-pointer shrink-0"
        >
          <SendIcon className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
