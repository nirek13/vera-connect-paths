/*
  # Chat System Implementation

  1. New Tables
    - `conversations`
      - `id` (uuid, primary key)
      - `participant_1_id` (uuid, references profiles)
      - `participant_2_id` (uuid, references profiles)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `last_message_at` (timestamp)
    
    - `messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, references conversations)
      - `sender_id` (uuid, references profiles)
      - `content` (text)
      - `message_type` (enum: text, image, file)
      - `read_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for participants to access their conversations
    - Add policies for message access within conversations

  3. Functions
    - Function to get or create conversation between two users
    - Function to mark messages as read
*/

-- Create enum for message types
CREATE TYPE message_type AS ENUM ('text', 'image', 'file');

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(participant_1_id, participant_2_id),
  CHECK (participant_1_id != participant_2_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type message_type DEFAULT 'text',
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view their conversations" ON public.conversations
  FOR SELECT USING (
    auth.uid() = participant_1_id OR auth.uid() = participant_2_id
  );

CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (
    auth.uid() = participant_1_id OR auth.uid() = participant_2_id
  );

CREATE POLICY "Participants can update conversations" ON public.conversations
  FOR UPDATE USING (
    auth.uid() = participant_1_id OR auth.uid() = participant_2_id
  );

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- Function to get or create conversation between two users
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
  ordered_user1_id UUID;
  ordered_user2_id UUID;
BEGIN
  -- Order user IDs to ensure consistent conversation creation
  IF user1_id < user2_id THEN
    ordered_user1_id := user1_id;
    ordered_user2_id := user2_id;
  ELSE
    ordered_user1_id := user2_id;
    ordered_user2_id := user1_id;
  END IF;

  -- Try to find existing conversation
  SELECT id INTO conversation_id
  FROM public.conversations
  WHERE (participant_1_id = ordered_user1_id AND participant_2_id = ordered_user2_id)
     OR (participant_1_id = ordered_user2_id AND participant_2_id = ordered_user1_id);

  -- If no conversation exists, create one
  IF conversation_id IS NULL THEN
    INSERT INTO public.conversations (participant_1_id, participant_2_id)
    VALUES (ordered_user1_id, ordered_user2_id)
    RETURNING id INTO conversation_id;
  END IF;

  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION public.mark_messages_as_read(conv_id UUID, user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.messages
  SET read_at = NOW()
  WHERE conversation_id = conv_id
    AND sender_id != user_id
    AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update conversation last_message_at
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at,
      updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation timestamp when new message is sent
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_timestamp();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations(participant_1_id, participant_2_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON public.conversations(last_message_at DESC);