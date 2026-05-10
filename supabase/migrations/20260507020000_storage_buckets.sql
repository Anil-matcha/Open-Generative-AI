insert into storage.buckets (id, name, public) values
('campaign-videos','campaign-videos',false),
('thumbnails','thumbnails',true),
('generated-media','generated-media',false),
('brand-assets','brand-assets',false)
on conflict (id) do nothing;
