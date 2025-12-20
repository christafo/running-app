-- Create Runs Table
create table runs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  date date not null,
  route_id text, -- Can be uuid or 'custom'
  distance numeric not null,
  duration text not null, -- Storing as string "HH:MM:SS" for simplicity, or numeric seconds
  pace text,
  total_seconds numeric,
  effort integer,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Routes Table
create table routes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  distance numeric not null,
  map_link text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table runs enable row level security;
alter table routes enable row level security;

-- Create Policies (Users can only see/edit their own data)
create policy "Users can view their own runs" on runs
  for select using (auth.uid() = user_id);

create policy "Users can insert their own runs" on runs
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own runs" on runs
  for delete using (auth.uid() = user_id);

create policy "Users can view their own routes" on routes
  for select using (auth.uid() = user_id);

create policy "Users can insert their own routes" on routes
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own routes" on routes
  for delete using (auth.uid() = user_id);
