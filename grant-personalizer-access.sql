-- grant-personalizer-access.sql
-- Grant necessary permissions for the personalization system

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE ON public.personalizer_apps TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.personalization_projects TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profile_scan_results TO authenticated;
GRANT SELECT, INSERT ON public.personalization_outputs TO authenticated;
GRANT SELECT ON public.personalizer_templates TO authenticated;

-- Grant sequence usage
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Enable real-time on personalization tables (optional)
ALTER PUBLICATION supabase_realtime ADD TABLE public.personalization_projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.personalization_outputs;
