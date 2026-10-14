-- 005_storage_buckets.sql
-- Buckets de Storage con límites de tipo y tamaño, y políticas RLS

-- ============================================================
-- Bucket: public-images (público, solo jpg/png/webp, máx 5MB)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'public-images',
    'public-images',
    true,
    5242880, -- 5 MB en bytes
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Políticas para public-images
-- Lectura pública
CREATE POLICY "public_read_public_images" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'public-images');

-- Escritura solo autenticada (dueña)
CREATE POLICY "owner_write_public_images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'public-images'
    AND is_owner()
);

CREATE POLICY "owner_update_public_images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'public-images' AND is_owner())
WITH CHECK (bucket_id = 'public-images' AND is_owner());

CREATE POLICY "owner_delete_public_images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'public-images' AND is_owner());

-- Service role acceso total
CREATE POLICY "service_role_all_public_images" ON storage.objects
FOR ALL TO service_role
USING (bucket_id = 'public-images')
WITH CHECK (bucket_id = 'public-images');

-- ============================================================
-- Bucket: clinical-files (privado, imágenes y PDF, máx 15MB)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'clinical-files',
    'clinical-files',
    false,
    15728640, -- 15 MB en bytes
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Políticas para clinical-files
-- Lectura solo dueña (se sirven con URLs firmadas desde el servidor)
CREATE POLICY "owner_read_clinical_files" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'clinical-files' AND is_owner());

-- Escritura solo dueña
CREATE POLICY "owner_write_clinical_files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'clinical-files'
    AND is_owner()
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "owner_update_clinical_files" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'clinical-files' AND is_owner())
WITH CHECK (bucket_id = 'clinical-files' AND is_owner());

CREATE POLICY "owner_delete_clinical_files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'clinical-files' AND is_owner());

-- Service role acceso total
CREATE POLICY "service_role_all_clinical_files" ON storage.objects
FOR ALL TO service_role
USING (bucket_id = 'clinical-files')
WITH CHECK (bucket_id = 'clinical-files');

-- ============================================================
-- Bucket: avatars (público, solo imágenes, máx 2MB)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    2097152, -- 2 MB en bytes
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Políticas para avatars
-- Lectura pública
CREATE POLICY "public_read_avatars" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'avatars');

-- Escritura solo dueña (avatar de la profesional)
CREATE POLICY "owner_write_avatars" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'avatars'
    AND is_owner()
);

CREATE POLICY "owner_update_avatars" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND is_owner())
WITH CHECK (bucket_id = 'avatars' AND is_owner());

CREATE POLICY "owner_delete_avatars" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND is_owner());

-- Service role acceso total
CREATE POLICY "service_role_all_avatars" ON storage.objects
FOR ALL TO service_role
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');