CREATE POLICY "kids photos are viewable by authenticated users"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'kids-photos');

CREATE POLICY "kids admins can upload kids photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'kids-photos' AND public.is_kids_admin(auth.uid()));

CREATE POLICY "kids admins can update kids photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'kids-photos' AND public.is_kids_admin(auth.uid()))
WITH CHECK (bucket_id = 'kids-photos' AND public.is_kids_admin(auth.uid()));

CREATE POLICY "kids admins can delete kids photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'kids-photos' AND public.is_kids_admin(auth.uid()));