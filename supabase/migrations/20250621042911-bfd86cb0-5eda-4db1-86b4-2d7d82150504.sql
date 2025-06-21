
-- Create enum for user types
CREATE TYPE user_type AS ENUM ('recruiter', 'company', 'professional');

-- Create enum for connection status
CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'declined');

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type user_type NOT NULL DEFAULT 'professional',
  first_name TEXT,
  last_name TEXT,
  title TEXT,
  bio TEXT,
  skills TEXT[],
  education TEXT,
  work_history JSONB,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create credentials table (ProofCards)
CREATE TABLE public.credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  issuer_id UUID REFERENCES public.profiles(id),
  company_id UUID REFERENCES public.companies(id),
  title TEXT NOT NULL,
  description TEXT,
  issued_date DATE DEFAULT CURRENT_DATE,
  expiration_date DATE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create connections table
CREATE TABLE public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status connection_status DEFAULT 'pending',
  connection_type TEXT DEFAULT 'professional',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for companies
CREATE POLICY "Companies are viewable by everyone" ON public.companies
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create companies" ON public.companies
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Company creators can update their companies" ON public.companies
  FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for credentials
CREATE POLICY "Credentials are viewable by everyone" ON public.credentials
  FOR SELECT USING (true);

CREATE POLICY "Issuers can create credentials" ON public.credentials
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = issuer_id);

CREATE POLICY "Credential owners can view their credentials" ON public.credentials
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = issuer_id);

-- RLS Policies for connections
CREATE POLICY "Users can view their connections" ON public.connections
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can create connection requests" ON public.connections
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update connection status" ON public.connections
  FOR UPDATE USING (auth.uid() = addressee_id OR auth.uid() = requester_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fixed function to find connection path between users
CREATE OR REPLACE FUNCTION public.find_connection_path(start_user_id UUID, target_user_id UUID)
RETURNS TABLE(path_length INTEGER, path_users UUID[]) AS $$
WITH RECURSIVE connection_paths AS (
  -- Base case: direct connections from start user
  SELECT 
    CASE 
      WHEN c.requester_id = start_user_id THEN c.addressee_id
      ELSE c.requester_id
    END as user_id,
    1 as depth,
    ARRAY[start_user_id, 
      CASE 
        WHEN c.requester_id = start_user_id THEN c.addressee_id
        ELSE c.requester_id
      END
    ] as path
  FROM public.connections c
  WHERE (c.requester_id = start_user_id OR c.addressee_id = start_user_id)
    AND c.status = 'accepted'
  
  UNION
  
  -- Recursive case: extend paths
  SELECT 
    CASE 
      WHEN c.requester_id = cp.user_id THEN c.addressee_id
      ELSE c.requester_id
    END as user_id,
    cp.depth + 1,
    cp.path || ARRAY[CASE 
      WHEN c.requester_id = cp.user_id THEN c.addressee_id
      ELSE c.requester_id
    END]
  FROM connection_paths cp
  JOIN public.connections c ON (c.requester_id = cp.user_id OR c.addressee_id = cp.user_id)
  WHERE c.status = 'accepted'
    AND cp.depth < 6 -- Limit to 6 degrees of separation
    AND NOT (CASE 
      WHEN c.requester_id = cp.user_id THEN c.addressee_id
      ELSE c.requester_id
    END = ANY(cp.path)) -- Avoid cycles
)
SELECT 
  depth as path_length,
  path as path_users
FROM connection_paths
WHERE user_id = target_user_id
ORDER BY depth
LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
