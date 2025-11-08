
import { User as SupabaseUser } from '@supabase/supabase-js';

export type User = SupabaseUser;

export interface MessageSource {
  uri: string;
  title: string;
}

export interface Attachment {
  type: 'image' | 'text';
  fileName: string;
  data: string; // base64 for image, raw text for text file
  mimeType?: string; // only for images
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  sources?: MessageSource[];
  status?: 'thinking';
  id: string;
  attachment?: Attachment;
  created_at: string; 
}

export interface HistoryItem {
  id: string;
  text: string;
  role: 'user' | 'model';
  mode: ChatMode;
  created_at: string;
}

export type View = 'chat' | 'history' | 'coder';
export type Theme = 'light' | 'dark' | 'system';
export type AuthMode = 'login' | 'signup' | 'anonymous';
export type ChatMode = 'normal' | 'pro' | 'deep';
