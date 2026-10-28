-- Chạy một lần trên Supabase SQL Editor nếu đã có bảng media_library.
ALTER TABLE public.media_library DROP CONSTRAINT IF EXISTS media_library_category_check;
ALTER TABLE public.media_library ADD CONSTRAINT media_library_category_check
CHECK (category IN ('document','image','audio','video','presentation','post'));
