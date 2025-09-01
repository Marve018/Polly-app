-- Polly App Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Polls table
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  allow_multiple_votes BOOLEAN DEFAULT FALSE,
  hide_results BOOLEAN DEFAULT FALSE
);

-- Poll options table
CREATE TABLE IF NOT EXISTS poll_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  voter_ip TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_polls_user_id ON polls(user_id);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_poll_option_id ON votes(poll_option_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);

-- Row Level Security (RLS) policies
-- Enable RLS on all tables
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Polls policies
-- Anyone can view polls
CREATE POLICY "Polls are viewable by everyone" 
  ON polls FOR SELECT 
  USING (true);

-- Only authenticated users can insert polls
CREATE POLICY "Users can create polls" 
  ON polls FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Only poll owners can update their polls
CREATE POLICY "Users can update their own polls" 
  ON polls FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Only poll owners can delete their polls
CREATE POLICY "Users can delete their own polls" 
  ON polls FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Poll options policies
-- Anyone can view poll options
CREATE POLICY "Poll options are viewable by everyone" 
  ON poll_options FOR SELECT 
  USING (true);

-- Only poll owners can insert poll options
CREATE POLICY "Poll owners can create poll options" 
  ON poll_options FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_options.poll_id 
      AND polls.user_id = auth.uid()
    )
  );

-- Only poll owners can update poll options
CREATE POLICY "Poll owners can update poll options" 
  ON poll_options FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_options.poll_id 
      AND polls.user_id = auth.uid()
    )
  );

-- Only poll owners can delete poll options
CREATE POLICY "Poll owners can delete poll options" 
  ON poll_options FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_options.poll_id 
      AND polls.user_id = auth.uid()
    )
  );

-- Votes policies
-- Anyone can view votes
CREATE POLICY "Votes are viewable by everyone" 
  ON votes FOR SELECT 
  USING (true);

-- Anyone can insert votes (we'll handle validation in the application)
CREATE POLICY "Anyone can vote" 
  ON votes FOR INSERT 
  WITH CHECK (true);

-- No one can update votes
CREATE POLICY "No one can update votes" 
  ON votes FOR UPDATE 
  USING (false);

-- Only poll owners can delete votes
CREATE POLICY "Poll owners can delete votes" 
  ON votes FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM poll_options
      JOIN polls ON poll_options.poll_id = polls.id
      WHERE poll_options.id = votes.poll_option_id
      AND polls.user_id = auth.uid()
    )
  );

-- Helper function to get total votes for a poll
CREATE OR REPLACE FUNCTION get_poll_vote_count(poll_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM votes
    JOIN poll_options ON votes.poll_option_id = poll_options.id
    WHERE poll_options.poll_id = $1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if a user has already voted on a poll
CREATE OR REPLACE FUNCTION has_user_voted(poll_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM votes
    JOIN poll_options ON votes.poll_option_id = poll_options.id
    WHERE poll_options.poll_id = $1
    AND votes.user_id = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
