-- Add coordinates column to routes table
-- We use JSONB to store the array of points [[lat, lng], [lat, lng], ...]
alter table routes 
add column coordinates jsonb;
