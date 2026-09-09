import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, MessageSquareIcon } from 'lucide-react';
import { formatDateTime, getClassChatId } from '../../lib/utils';
import { databases, APPWRITE_CONFIG, isAppwriteDbConfigured, ID, Query } from '../../lib/appwrite';

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
    let isMounted = true;

    const loadMessages = async () => {
      // 1. Local storage fallback
      let localList: any[] = [];
      try {
        const stored = JSON.parse(localStorage.getItem('idla_local_class_messages') || '[]');
        localList = stored.filter((m: any) => m.channelId === channelId);
      } catch (e) {}

      // 2. Fetch from Appwrite messages collection if configured
      if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.messages) {
        try {
          const res = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.messages,
            [Query.equal('applicationId', channelId), Query.orderAsc('$createdAt'), Query.limit(100)]
          );

          if (isMounted && res.documents.length > 0) {
            const cloudMsgs = res.documents.map((d: any) => {
              let parsedText = d.text;
              let sName = d.sender === 'advisor' ? 'Enseignant Référent' : (studentName || 'Étudiant');
              let senderType = d.sender === 'advisor' ? 'teacher' : 'student';

              try {
                const data = JSON.parse(d.text);
                if (data.t || data.text) {
                  parsedText = data.t || data.text;
                  sName = data.n || data.name || sName;
                  if (data.email) {
                    senderType = data.email.toLowerCase().trim() === studentEmail.toLowerCase().trim() ? 'student' : (d.sender === 'advisor' ? 'teacher' : 'student');
                  }
                }
              } catch (e) {}

              return {
                id: d.$id,
                channelId,
                senderName: sName,
                sender: senderType,
                text: parsedText,
                time: formatDateTime(d.$createdAt || d.createdAt || new Date().toISOString()),
                createdAt: d.$createdAt || d.createdAt,
              };
            });

            setMessages(cloudMsgs);
            return;
          }
        } catch (err) {
          console.warn('Erreur chargement messages de classe Appwrite:', err);
        }
      }

      if (isMounted) {
        if (localList.length > 0) {
          setMessages(localList);
        } else {
          setMessages([
            {
              id: 'welcome-1',
              senderName: 'Enseignant Référent',
              sender: 'teacher',
              text: `Bienvenue dans le salon virtuel de ${courseTitle} (${level}). Posez vos questions ici.`,
              time: 'Aujourd\'hui',
            },
          ]);
        }
      }
    };

    loadMessages();
    const interval = setInterval(loadMessages, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [channelId, courseTitle, level, studentEmail, studentName]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    const nowIso = new Date().toISOString();
    const localId = `msg-${Date.now()}`;

    const newMsg = {
      id: localId,
      channelId,
      senderName: studentName || 'Étudiant',
      senderEmail: studentEmail,
      sender: 'student',
      text: textToSend,
      time: formatDateTime(nowIso),
      createdAt: nowIso,
    };

    setMessages((curr) => [...curr, newMsg]);
    setInputText('');

    // Persist to local storage
    try {
      const allMsgs = JSON.parse(localStorage.getItem('idla_local_class_messages') || '[]');
      allMsgs.push(newMsg);
      localStorage.setItem('idla_local_class_messages', JSON.stringify(allMsgs));
    } catch (e) {}

    // Persist to Appwrite Cloud
    if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.messages) {
      try {
        const payloadStr = JSON.stringify({
          n: studentName || 'Étudiant',
          t: textToSend,
          email: studentEmail,
          type: 'text'
        });

        await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.messages,
          ID.unique(),
          {
            applicationId: channelId,
            sender: 'student',
            text: payloadStr,
            createdAt: nowIso
          }
        );
      } catch (err) {
        console.error("Erreur envoi message classe Appwrite:", err);
      }
    }
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
