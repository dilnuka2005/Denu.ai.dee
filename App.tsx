
import React, { useState, useEffect, useRef, useCallback, ChangeEvent, FormEvent } from 'react';
import { supabase, generateChatResponse, generateCode, generateTTSAudio, playAudio, signInWithOAuth, signInAnonymously } from './services/api';
import type { User, Message, View, Theme, AuthMode, HistoryItem, ChatMode, Attachment } from './types';

// @ts-ignore
const marked = window.marked;
marked.use({
    renderer: {
        html(html: string) {
            return html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "");
        }
    }
});


// --- ICON COMPONENTS ---

const LoadingSpinnerIcon: React.FC = () => ( <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>);
const SendIcon: React.FC = () => ( <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>);
const MicIcon: React.FC = () => ( <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z"></path></svg>);
const TtsIcon: React.FC = () => ( <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 3v14a1 1 0 01-1.383.924L4.031 15H2a1 1 0 01-1-1V6a1 1 0 011-1h2.031l5.968-3.924zM16 8a2 2 0 100 4 2 2 0 000-4z" clipRule="evenodd"></path></svg>);
const TtsErrorIcon: React.FC = () => ( <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>);
const TtsLoadingIcon: React.FC = () => ( <svg className="w-4 h-4 animate-spin" fill="currentColor" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>);
const HamburgerIcon: React.FC = () => ( <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>);
const CloseIcon: React.FC = () => ( <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>);
const NewChatIcon: React.FC = () => ( <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>);
const ChatIcon: React.FC = () => ( <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.693C3.021 15.174 2.5 13.538 2.5 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>);
const CoderIcon: React.FC = () => ( <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>);
const HistoryIcon: React.FC = () => ( <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>);
const SettingsIcon: React.FC = () => ( <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.56.34 1.235.54 1.945.54z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>);
const LoginIcon: React.FC = () => ( <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>);
const LogoutIcon: React.FC = () => ( <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>);
const GoogleIcon: React.FC = () => (<svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.612-3.28-11.28-7.94l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,35.337,44,30.023,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>);
const FacebookIcon: React.FC = () => (<svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#039be5" d="M24 5A19 19 0 1 0 24 43A19 19 0 1 0 24 5Z"></path><path fill="#fff" d="M26.572 29.036h4.917l-.772-4.995h-4.145v-3.282c0-1.438.396-2.417 2.458-2.417h2.616v-4.459c-.452-.06-2.007-.194-3.82-.194-3.784 0-6.364 2.308-6.364 6.54v3.69h-4.269v4.995h4.269v11.971h5.107V29.036z"></path></svg>);
const AttachmentIcon: React.FC = () => (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>);
const CameraIcon: React.FC = () => (<svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>);
const FileIcon: React.FC = () => (<svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>);
const CopyIcon: React.FC = () => ( <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>);
const CheckIcon: React.FC = () => ( <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>);
const PaperclipIcon: React.FC = () => ( <svg className="w-8 h-8 p-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>);
const XCircleIcon: React.FC = () => ( <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>);


// --- SUB-COMPONENTS ---

interface MessageBubbleProps { message: Message; }
const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
    const [ttsState, setTtsState] = useState<'idle' | 'loading' | 'error'>('idle');
    const bubbleClass = message.role === 'user' ? 'user-bubble' : 'model-bubble';
    
    const htmlContent = message.text ? marked.parse(message.text) : 
        (message.status === 'thinking' ? '<span class="text-gray-400 italic">DeeNU.Ai is thinking...</span>' : '');

    const handlePlayTTS = async () => {
        if (!message.text) return;
        setTtsState('loading');
        try {
            const cleanText = message.text.replace(/<[^>]*>?/gm, '');
            const audioData = await generateTTSAudio(cleanText);
            if (audioData) {
                await playAudio(audioData);
                setTtsState('idle');
            } else { throw new Error("No audio data received."); }
        } catch (error) {
            console.error("TTS Error:", error);
            setTtsState('error');
            setTimeout(() => setTtsState('idle'), 3000);
        }
    };
    
    return (
        <div className={`message flex items-start space-x-3 message-bubble-animate ${message.role === 'user' ? 'user-message justify-end' : 'model-message justify-start'}`}>
            {message.role === 'model' && (<img src="https://dilnuka13.github.io/AL/favicon.ico" alt="DeeNU Avatar" className="w-8 h-8 rounded-full flex-shrink-0 mt-1" />)}
            <div className={`${bubbleClass} ${message.status === 'thinking' ? 'animate-pulse-opacity' : ''}`}>
                 {message.attachment?.type === 'image' && (
                    <img src={message.attachment.data} alt="attachment" className="max-w-xs rounded-lg mb-2" />
                )}
                 {message.attachment?.type === 'text' && (
                    <div className="mb-2 p-2 bg-gray-700/50 rounded-lg text-xs italic">
                        <p>Attachment: {message.attachment.fileName}</p>
                    </div>
                )}
                <div className="flex items-start">
                    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                    {message.role === 'model' && message.text && (
                        <div className="ml-3 mt-1 flex-shrink-0">
                            <button onClick={handlePlayTTS} disabled={ttsState === 'loading'} className="tts-button hover:bg-primary transition duration-150" title="Read Aloud">
                                {ttsState === 'idle' && <TtsIcon />}
                                {ttsState === 'loading' && <TtsLoadingIcon />}
                                {ttsState === 'error' && <TtsErrorIcon />}
                            </button>
                        </div>
                    )}
                </div>
                {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-600 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-400">
                        Grounded in: {message.sources.map((s, i) => (<a key={s.uri} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 dark:text-blue-300 hover:underline ml-2">Source {i + 1}</a>))}
                    </div>
                )}
            </div>
        </div>
    );
};


// --- MAIN APP COMPONENT ---

function App() {
    const [user, setUser] = useState<User | null>(null);
    const [view, setView] = useState<View>('chat');
    const [messages, setMessages] = useState<Message[]>([]);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Modals
    const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(true);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
    const [confirmation, setConfirmation] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({isOpen: false, title: '', message: '', onConfirm: () => {}});

    // Anonymous Session
    const [anonymousTimeLeft, setAnonymousTimeLeft] = useState<number | null>(null);

    // Theme & Sidebar
    const [theme, setTheme] = useState<Theme>('system');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const chatHistoryRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // --- EFFECTS ---

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                setIsWelcomeModalOpen(false);
                setIsAuthModalOpen(false);
                fetchHistory();
                startNewChat();

                if (currentUser.is_anonymous) {
                    const expiry = new Date(currentUser.created_at).getTime() + 10 * 60 * 1000;
                    const now = Date.now();
                    if (now < expiry) {
                        setAnonymousTimeLeft(Math.round((expiry - now) / 1000));
                    } else {
                        supabase.auth.signOut();
                    }
                } else {
                    setAnonymousTimeLeft(null);
                }

            } else {
                setAnonymousTimeLeft(null);
                setIsWelcomeModalOpen(true);
            }
        });
        return () => subscription.unsubscribe();
    }, []);
    
    useEffect(() => {
        const applyTheme = (t: Theme) => {
            document.body.classList.remove('light-mode', 'dark-mode');
            if (t === 'system') {
                document.body.classList.add(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark-mode' : 'light-mode');
            } else { document.body.classList.add(`${t}-mode`); }
        };
        const storedTheme = localStorage.getItem('theme') as Theme | null;
        const initialTheme = storedTheme || 'system';
        setTheme(initialTheme);
        applyTheme(initialTheme);
        
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => applyTheme(theme);
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    useEffect(() => {
        document.getElementById('chat-container')?.classList.add('animate-load-in');
    }, []);

    useEffect(() => {
        if (chatHistoryRef.current) {
            chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (anonymousTimeLeft === null || anonymousTimeLeft <= 0) return;
        const timer = setInterval(() => {
            setAnonymousTimeLeft(prev => {
                if (prev !== null && prev > 1) { return prev - 1; }
                clearInterval(timer);
                alert("Your anonymous session has expired. Please sign up to continue.");
                supabase.auth.signOut();
                return null;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [anonymousTimeLeft]);
    
    // --- HANDLERS ---
    
    const handleSetTheme = (newTheme: Theme) => { localStorage.setItem('theme', newTheme); setTheme(newTheme); };
    const startNewChat = () => { setMessages([]); if (window.innerWidth < 768) setIsSidebarOpen(false); };
    const handleSwitchView = (newView: View) => { setView(newView); if (newView === 'history') fetchHistory(); if (window.innerWidth < 768) setIsSidebarOpen(false); };

    const handleLogout = () => {
        setConfirmation({
            isOpen: true, title: "Confirm Logout", message: "Are you sure you want to log out?",
            onConfirm: async () => {
                await supabase.auth.signOut();
                setUser(null); setMessages([]); setHistory([]);
                setConfirmation({ ...confirmation, isOpen: false });
            }
        });
    };
    
    const fetchHistory = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase.from('messages').select('id, text, role, mode, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100);
        if (error) console.error("Error fetching history:", error);
        else if (data) setHistory(data as HistoryItem[]);
    }, [user]);

    const loadChatFromHistory = async (historyItemId: string) => {
        if (!user) return;
        const { data, error } = await supabase.from('messages').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
        
        if (error || !data) return console.error("Failed to load history");

        const messageIndex = data.findIndex(m => m.id === historyItemId);
        if (messageIndex === -1) return;

        // Find the next model response to complete the turn
        let endSliceIndex = messageIndex + 1;
        while(endSliceIndex < data.length && data[endSliceIndex].role !== 'model') {
            endSliceIndex++;
        }
        
        const conversationSlice = data.slice(0, endSliceIndex + 1).map(m => ({
            ...m,
            sources: typeof m.sources === 'string' ? JSON.parse(m.sources) : m.sources,
        })) as Message[];

        setMessages(conversationSlice);
        setView('chat');
        if (window.innerWidth < 768) setIsSidebarOpen(false);
    };

    const handleSendMessage = async (prompt: string, mode: ChatMode, attachment?: Attachment) => {
        if (!prompt.trim() && !attachment || !user) return;
        setIsLoading(true);

        const now = new Date().toISOString();
        const userMessage: Message = { role: 'user', text: prompt, id: self.crypto.randomUUID(), attachment, created_at: now };
        setMessages(prev => [...prev, userMessage]);
        
        const thinkingMessageId = self.crypto.randomUUID();
        const thinkingMessage: Message = { role: 'model', text: '', status: 'thinking', id: thinkingMessageId, created_at: now };
        setMessages(prev => [...prev, thinkingMessage]);

        await supabase.from('messages').insert([{ user_id: user.id, role: 'user', text: prompt, mode, created_at: now, id: userMessage.id }]);

        const { text: modelResponseText, sources } = await generateChatResponse(messages, prompt, mode, attachment);
        const modelMessage: Message = { role: 'model', text: modelResponseText, sources, id: thinkingMessageId, created_at: new Date().toISOString() };
        
        setMessages(prev => prev.map(msg => msg.id === thinkingMessageId ? modelMessage : msg));
        await supabase.from('messages').insert([{ user_id: user.id, role: 'model', text: modelResponseText, sources: JSON.stringify(sources), mode, id: modelMessage.id }]);
        
        setIsLoading(false);
    };

    const handleGenerateCode = async (prompt: string, language: string) => {
        if (!prompt.trim() || !user) return { output: '', error: 'Prompt is empty or user not logged in.' };
        setIsLoading(true);
        const result = await generateCode(prompt, language);
        await supabase.from('messages').insert([ { user_id: user.id, role: 'user', text: `CODE REQUEST: ${language} - ${prompt}`, mode: 'pro' }, { user_id: user.id, role: 'model', text: `CODE OUTPUT GENERATED.`, mode: 'pro' } ]);
        setIsLoading(false);
        return { output: result, error: null };
    };

    const initialMessage = (
        <div className="message flex model-message items-start space-x-3">
            <img src="https://dilnuka13.github.io/AL/favicon.ico" alt="DeeNU Avatar" className="w-8 h-8 rounded-full flex-shrink-0 mt-1" />
            <div className="model-bubble">
                <p>ආයුබෝවන්! මම <strong>DeeNU.Ai</strong>.</p>
                <p>Please log in, sign up, or continue as a guest to begin.</p>
            </div>
        </div>
    );
    
    // --- RENDER ---
    return (
        <>
            <div id="sidebar-overlay" className={`fixed inset-0 bg-black/50 z-30 md:hidden ${isSidebarOpen ? '' : 'hidden'}`} onClick={() => setIsSidebarOpen(false)}></div>
            <div id="chat-container" className="flex">
                <div id="sidebar" className={`p-4 flex flex-col glass-effect ${isSidebarOpen ? 'sidebar-open' : ''}`}>
                    <div className="flex justify-between items-center mb-4 md:hidden">
                        <h2 className="text-xl font-bold">DeeNU.Ai Menu</h2>
                        <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-md text-gray-400 hover:text-white"><CloseIcon/></button>
                    </div>
                    <div className="mb-6 pb-4 border-b border-gray-700">
                        <div className="flex items-center space-x-2"><img src="https://dilnuka13.github.io/AL/favicon.ico" alt="DeeNU.Ai Logo" className="w-10 h-10 rounded-lg"/><h2 className="text-xl font-bold">DeeNU.Ai</h2></div>
                        <p className="text-sm mt-2 text-gray-400">{user ? `Signed in as: ${user.is_anonymous ? 'Guest' : (user.user_metadata?.display_name || user.email)}` : "Not Signed In"}</p>
                        {anonymousTimeLeft && (<p className="text-sm mt-1 text-yellow-400">Session ends in: {Math.floor(anonymousTimeLeft / 60)}:{String(anonymousTimeLeft % 60).padStart(2, '0')}</p>)}
                    </div>
                    <nav className="flex flex-col space-y-2 flex-grow">
                        <button onClick={startNewChat} className="flex items-center p-3 rounded-xl bg-[--color-primary] text-white font-medium hover:bg-[--color-primary-darker] transition text-left"><NewChatIcon/> New Chat</button>
                        <button onClick={() => handleSwitchView('chat')} className={`sidebar-nav-btn flex items-center p-3 rounded-xl hover:bg-gray-700 transition text-left font-medium ${view === 'chat' ? 'text-[--color-primary]' : ''}`}><ChatIcon/> Chat Assistant</button>
                        <button onClick={() => handleSwitchView('coder')} className={`sidebar-nav-btn flex items-center p-3 rounded-xl hover:bg-gray-700 transition text-left ${view === 'coder' ? 'text-[--color-primary]' : ''}`}><CoderIcon/> Code Generation</button>
                        <button onClick={() => handleSwitchView('history')} className={`sidebar-nav-btn flex items-center p-3 rounded-xl hover:bg-gray-700 transition text-left ${view === 'history' ? 'text-[--color-primary]' : ''}`}><HistoryIcon/> Search History</button>
                    </nav>
                    <div className="pt-4 border-t border-gray-700">
                        <button onClick={() => setIsSettingsModalOpen(true)} className="flex items-center p-3 rounded-xl hover:bg-gray-700 transition text-left w-full"><SettingsIcon/> Settings</button>
                        <button onClick={user ? handleLogout : () => { setIsWelcomeModalOpen(false); setIsAuthModalOpen(true); }} className={`flex items-center p-3 rounded-xl hover:bg-gray-700 transition text-left w-full ${!user ? 'text-red-400' : ''}`}>{user ? <LogoutIcon/> : <LoginIcon/>} {user ? 'Logout' : 'Login / Sign Up'}</button>
                    </div>
                </div>
                <div id="main-chat-area" className="flex flex-col flex-grow bg-[--color-bg-dark]">
                    <header className="p-4 flex justify-between items-center border-b border-gray-700 glass-effect">
                        <button id="menu-toggle" onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-md text-gray-400 hover:text-white md:hidden"><HamburgerIcon/></button>
                        <h2 className="text-xl font-semibold ml-2 md:ml-0 capitalize">{view}</h2>
                    </header>
                    <div className={`flex-grow flex-col ${view === 'chat' ? 'flex' : 'hidden'}`}><ChatView messages={messages} onSendMessage={handleSendMessage} isLoading={isLoading} user={user} chatHistoryRef={chatHistoryRef} initialMessage={initialMessage} fileInputRef={fileInputRef} onCameraOpen={() => setIsCameraModalOpen(true)}/></div>
                    <div className={`flex-grow flex-col overflow-y-auto ${view === 'coder' ? 'flex' : 'hidden'}`}><CoderView onGenerateCode={handleGenerateCode} isLoading={isLoading} user={user} /></div>
                    <div className={`flex-grow overflow-y-auto p-6 ${view === 'history' ? 'block' : 'hidden'}`}><HistoryView history={history} onLoadConversation={loadChatFromHistory} /></div>
                </div>
            </div>
            {isWelcomeModalOpen && <WelcomeModal onGetStarted={() => {setIsWelcomeModalOpen(false); if (!user) setIsAuthModalOpen(true);}} />}
            {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} />}
            {isSettingsModalOpen && <SettingsModal onClose={() => setIsSettingsModalOpen(false)} onSetTheme={handleSetTheme} />}
            {confirmation.isOpen && <ConfirmationModal {...confirmation} onClose={() => setConfirmation({ ...confirmation, isOpen: false })} />}
            {/* Fix: Passed the required `isOpen` prop to the CameraModal component. */}
            {isCameraModalOpen && <CameraModal isOpen={isCameraModalOpen} onClose={() => setIsCameraModalOpen(false)} videoRef={videoRef} onCapture={(data) => { handleSendMessage('', 'pro', { type: 'image', fileName: 'capture.jpg', data: data.split(',')[1], mimeType: 'image/jpeg' }); }}/>}
        </>
    );
}

// --- VIEW COMPONENTS ---

const ChatView = ({ messages, onSendMessage, isLoading, user, chatHistoryRef, initialMessage, fileInputRef, onCameraOpen }: { messages: Message[], onSendMessage: (prompt: string, mode: ChatMode, attachment?: Attachment) => void, isLoading: boolean, user: User | null, chatHistoryRef: React.RefObject<HTMLDivElement>, initialMessage: React.ReactElement, fileInputRef: React.RefObject<HTMLInputElement>, onCameraOpen: () => void }) => {
    const [input, setInput] = useState('');
    const [mode, setMode] = useState<ChatMode>('normal');
    const [attachment, setAttachment] = useState<Attachment | null>(null);
    const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSendMessage(input, mode, attachment as Attachment);
        setInput(''); setAttachment(null);
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            if (file.type.startsWith('image/')) {
                setAttachment({ type: 'image', fileName: file.name, data: result.split(',')[1], mimeType: file.type });
            } else if (file.type === 'text/plain') {
                setAttachment({ type: 'text', fileName: file.name, data: result });
            }
        };
        if (file.type.startsWith('image/')) reader.readAsDataURL(file);
        else if (file.type === 'text/plain') reader.readAsText(file);
    };
    
    return (
        <>
            <div id="chat-history" ref={chatHistoryRef} className="flex-grow overflow-y-auto p-6">
                {messages.length === 0 ? initialMessage : messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
            </div>
            <div className="p-4 border-t border-gray-700 glass-effect">
                {attachment && (
                    <div className="relative flex items-center bg-gray-700 p-2 rounded-md mb-2 text-sm">
                         {attachment.type === 'image' && <img src={`data:${attachment.mimeType};base64,${attachment.data}`} className="w-10 h-10 rounded mr-2 object-cover"/>}
                         {attachment.type === 'text' && <FileIcon/>}
                         <span className="truncate">{attachment.fileName}</span>
                         <button onClick={() => setAttachment(null)} className="absolute top-1 right-1 p-1 bg-gray-800 rounded-full hover:bg-red-500"><XCircleIcon/></button>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="flex items-center space-x-3">
                    <div className="relative">
                        <button type="button" onClick={() => setIsAttachmentMenuOpen(o => !o)} className="p-3 text-gray-400 hover:text-white transition disabled:opacity-50" disabled={!user || isLoading}><AttachmentIcon/></button>
                        {isAttachmentMenuOpen && (
                            <div className="absolute bottom-full mb-2 w-48 bg-gray-800 rounded-lg shadow-xl py-1">
                                <button onClick={() => fileInputRef.current?.click()} className="w-full text-left flex items-center px-4 py-2 hover:bg-gray-700"><FileIcon/>Upload File</button>
                                <button onClick={() => { onCameraOpen(); setIsAttachmentMenuOpen(false); }} className="w-full text-left flex items-center px-4 py-2 hover:bg-gray-700"><CameraIcon/>Use Camera</button>
                            </div>
                        )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*,.txt" onChange={handleFileChange} className="hidden" />
                    <div className="flex-grow flex items-center border border-gray-600 rounded-xl bg-gray-800 focus-within:ring-2 focus-within:ring-[--color-primary]">
                        <button type="button" className="p-3 text-gray-400 hover:text-white transition disabled:opacity-50" disabled={!user}><MicIcon/></button>
                        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={user ? "Type your message here..." : "Please log in to start chatting."} className="flex-grow p-3 bg-transparent border-none focus:ring-0 placeholder-gray-400" disabled={isLoading || !user} />
                        <select value={mode} onChange={(e) => setMode(e.target.value as ChatMode)} className="bg-transparent border-none border-l border-gray-700 p-3 focus:ring-0 cursor-pointer text-sm" disabled={isLoading || !user}>
                            <option value="normal">Google</option><option value="pro">DeeNU Flash</option><option value="deep">DeeNU Pro</option>
                        </select>
                    </div>
                    <button type="submit" className="bg-[--color-primary] hover:bg-[--color-primary-darker] text-white font-bold py-3 px-6 rounded-xl transition shadow-lg shadow-[--color-primary]/30 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading || !user || (!input.trim() && !attachment)}>
                        {isLoading ? <LoadingSpinnerIcon/> : <SendIcon/>}
                    </button>
                </form>
            </div>
        </>
    );
};

const CoderView = ({ onGenerateCode, isLoading, user }: { onGenerateCode: (prompt: string, language: string) => Promise<{output: string, error: string | null}>, isLoading: boolean, user: User | null }) => {
    const [prompt, setPrompt] = useState('');
    const [language, setLanguage] = useState('react');
    const [output, setOutput] = useState('');
    const [copyState, setCopyState] = useState(false);

    const handleGenerate = async () => { setOutput("Generating code, please wait..."); const result = await onGenerateCode(prompt, language); if (result.output) setOutput(result.output); else if (result.error) setOutput(`Error: ${result.error}`); };
    const handleCopy = () => { navigator.clipboard.writeText(output); setCopyState(true); setTimeout(() => setCopyState(false), 2000); };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Code Generation Panel</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow h-[calc(95vh-200px)]">
                <div className="flex flex-col">
                    <label htmlFor="code-prompt" className="font-medium mb-2">Code Request:</label>
                    <textarea id="code-prompt" value={prompt} onChange={e => setPrompt(e.target.value)} className="w-full h-32 p-3 rounded-lg bg-gray-800 border focus:ring-[--color-primary] focus:border-[--color-primary] placeholder-gray-400" placeholder="e.g., Write a responsive React component for a calculator." required></textarea>
                    <label htmlFor="code-language" className="font-medium mt-4 mb-2">Language/Framework:</label>
                    <select id="code-language" value={language} onChange={e => setLanguage(e.target.value)} className="p-3 rounded-lg bg-gray-800 border focus:ring-[--color-primary] focus:border-[--color-primary]">
                        <option value="react">React (JSX)</option><option value="html">HTML/CSS/JS</option><option value="python">Python</option><option value="angular">Angular</option><option value="markdown">Markdown</option>
                    </select>
                    <button onClick={handleGenerate} className="mt-4 bg-[--color-primary] hover:bg-[--color-primary-darker] font-bold py-3 rounded-xl transition disabled:opacity-50" disabled={isLoading || !user || !prompt.trim()}>Generate Code</button>
                </div>
                <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center mb-2">
                         <label className="font-medium">Generated Code:</label>
                         <button onClick={handleCopy} className="flex items-center text-xs px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50" disabled={!output}>{copyState ? <><CheckIcon/> Copied</> : <><CopyIcon/> Copy</>}</button>
                    </div>
                    <textarea value={output} className="flex-grow w-full p-3 rounded-lg bg-gray-900 text-green-300 font-mono text-sm resize-none" readOnly placeholder="Your generated code will appear here..."></textarea>
                </div>
            </div>
        </div>
    );
};

const HistoryView = ({ history, onLoadConversation }: { history: HistoryItem[], onLoadConversation: (id: string) => void }) => (
    <>
        <h2 className="text-2xl font-bold mb-4">Search History</h2>
        <ul className="space-y-3">
            {history.length === 0 ? (<li className="text-gray-400 italic">History will load here...</li>) : (
                history.filter(h => h.role === 'user').map((item) => (
                    <li key={item.id}>
                        <button onClick={() => onLoadConversation(item.id)} className="w-full text-left p-3 rounded-lg bg-gray-800 hover:ring-2 hover:ring-[--color-primary] cursor-pointer transition">
                            <span className="text-xs text-gray-400">[{new Date(item.created_at).toLocaleString()}] ({item.mode || 'chat'})</span>
                            <p className="truncate mt-1">{item.text}</p>
                        </button>
                    </li>
                ))
            )}
        </ul>
    </>
);


// --- MODAL COMPONENTS ---

const WelcomeModal = ({ onGetStarted }: { onGetStarted: () => void }) => ( <div className="modal fixed inset-0 flex items-center justify-center z-50"><div className="modal-content p-8 rounded-2xl max-w-md text-center animate-fade-in-scale glass-effect"><img src="https://dilnuka13.github.io/AL/favicon.ico" alt="DeeNU.Ai Logo" className="w-20 h-20 rounded-lg mx-auto mb-4" /><h2 className="text-3xl font-bold mb-4 text-[--color-primary]">Welcome to DeeNU.Ai</h2><p className="text-lg text-gray-300 mb-6">Your AI assistant is ready.</p><p className="text-sm text-gray-400 mb-8">Please log in or sign up to continue.</p><button onClick={onGetStarted} className="w-full bg-[--color-primary] hover:bg-[--color-primary-darker] text-white font-bold py-3 rounded-xl transition">Get Started</button></div></div>);

const AuthModal = ({ onClose }: { onClose: () => void }) => {
    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [displayName, setDisplayName] = useState(''); const [message, setMessage] = useState('');

    const handleSubmit = async (e: FormEvent) => { e.preventDefault(); setMessage(''); try { if (mode === 'login') { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error; onClose(); } else { const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName } } }); if (error) throw error; if (data.user && !data.user.email_confirmed_at) setMessage('Please check your email to confirm your account!'); else onClose(); } } catch (error: any) { setMessage(error.message); } };
    const handleAnonymous = async () => { await signInAnonymously(); onClose(); };

    return (
        <div className="modal fixed inset-0 flex items-center justify-center z-50" onClick={onClose}>
            <div className="modal-content p-8 rounded-2xl max-w-md w-full animate-fade-in-scale glass-effect" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-6 text-center text-[--color-primary]">{mode === 'login' ? 'Welcome Back' : 'Create an Account'}</h2>
                <div className="space-y-3 mb-4">
                    <button onClick={() => signInWithOAuth('google')} className="w-full flex justify-center items-center gap-3 p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition"><GoogleIcon/> Sign in with Google</button>
                    <button onClick={() => signInWithOAuth('facebook')} className="w-full flex justify-center items-center gap-3 p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition"><FacebookIcon/> Sign in with Facebook</button>
                </div>
                <div className="flex items-center my-6"><div className="flex-grow border-t border-gray-600"></div><span className="flex-shrink mx-4 text-gray-400">OR</span><div className="flex-grow border-t border-gray-600"></div></div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'signup' && (<input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Display Name" required className="w-full p-3 rounded-lg bg-gray-800 border focus:ring-[--color-primary] focus:border-[--color-primary]"/>)}
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" required className="w-full p-3 rounded-lg bg-gray-800 border focus:ring-[--color-primary] focus:border-[--color-primary]"/>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="w-full p-3 rounded-lg bg-gray-800 border focus:ring-[--color-primary] focus:border-[--color-primary]"/>
                    <button type="submit" className="w-full bg-[--color-primary] hover:bg-[--color-primary-darker] text-white font-bold py-3 rounded-xl transition">{mode === 'login' ? 'Login' : 'Sign Up'}</button>
                </form>
                <p className="mt-4 text-center text-sm"><span className="cursor-pointer hover:underline text-gray-400" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>{mode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Login"}</span></p>
                <p className="mt-2 text-center text-sm"><span className="cursor-pointer hover:underline text-gray-400" onClick={handleAnonymous}>Continue as Guest (10 min session)</span></p>
                {message && <p className="mt-4 text-center text-sm text-red-500">{message}</p>}
            </div>
        </div>
    );
};

const SettingsModal = ({ onClose, onSetTheme }: { onClose: () => void, onSetTheme: (theme: Theme) => void }) => ( <div className="modal fixed inset-0 flex items-center justify-center z-50" onClick={onClose}><div className="modal-content p-8 rounded-2xl max-w-md animate-fade-in-scale glass-effect" onClick={e => e.stopPropagation()}><h2 className="text-2xl font-bold mb-6 text-[--color-primary]">Settings</h2><div className="mb-6"><label className="block text-lg font-medium mb-2">Theme</label><div className="flex space-x-4"><button onClick={() => onSetTheme('light')} className="px-4 py-2 rounded-xl border border-gray-400 hover:border-[--color-primary] transition">Light</button><button onClick={() => onSetTheme('dark')} className="px-4 py-2 rounded-xl border border-gray-400 hover:border-[--color-primary] transition">Dark</button><button onClick={() => onSetTheme('system')} className="px-4 py-2 rounded-xl border border-gray-400 hover:border-[--color-primary] transition">System</button></div></div><div><label className="block text-lg font-medium mb-2">Creator Info</label><div className="text-sm space-y-1"><p><strong>Name:</strong> Isara Dilnuka</p><p><strong>Email:</strong> <a href="mailto:in.fo.dilnuka@outlook.com" className="text-[--color-primary] hover:underline">in.fo.dilnuka@outlook.com</a></p><p><strong>Website:</strong> <a href="https://dilnuka13.github.io/my/" target="_blank" rel="noopener noreferrer" className="text-[--color-primary] hover:underline">dilnuka13.github.io/my/</a></p><p><strong>YouTube:</strong> <a href="https://www.youtube.com/@dilnuka.13x" target="_blank" rel="noopener noreferrer" className="text-[--color-primary] hover:underline">Isara Dilnuka (YouTube)</a></p></div></div><button onClick={onClose} className="mt-8 w-full bg-red-500 hover:bg-red-600 font-bold py-3 rounded-xl transition">Close</button></div></div>);
const ConfirmationModal = ({ isOpen, title, message, onConfirm, onClose }: { isOpen: boolean, title: string, message: string, onConfirm: () => void, onClose: () => void }) => { if (!isOpen) return null; return ( <div className="modal fixed inset-0 flex items-center justify-center z-50"><div className="modal-content p-8 rounded-2xl max-w-sm animate-fade-in-scale glass-effect"><h2 className="text-xl font-bold mb-4">{title}</h2><p className="text-gray-300 mb-6">{message}</p><div className="flex justify-end space-x-4"><button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 transition">Cancel</button><button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 transition">Confirm</button></div></div></div> ); };
const CameraModal = ({ isOpen, onClose, onCapture, videoRef }: { isOpen: boolean; onClose: () => void; onCapture: (dataUrl: string) => void; videoRef: React.RefObject<HTMLVideoElement>; }) => {
    useEffect(() => {
        if (isOpen) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
                .catch(err => console.error("Camera access error:", err));
        } else {
            if (videoRef.current?.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            }
        }
    }, [isOpen, videoRef]);

    const handleCapture = () => {
        const canvas = document.createElement('canvas');
        if (!videoRef.current) return;
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        onCapture(canvas.toDataURL('image/jpeg'));
        onClose();
    };
    if (!isOpen) return null;
    return (
        <div className="modal fixed inset-0 flex items-center justify-center z-50" onClick={onClose}>
            <div className="modal-content p-4 rounded-2xl max-w-lg animate-fade-in-scale glass-effect" onClick={e => e.stopPropagation()}>
                <video ref={videoRef} autoPlay playsInline className="rounded-lg w-full"></video>
                <button onClick={handleCapture} className="mt-4 w-full bg-[--color-primary] hover:bg-[--color-primary-darker] font-bold py-3 rounded-xl transition">Capture Photo</button>
            </div>
        </div>
    );
};


export default App;
