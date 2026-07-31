
create policy "event_arts_read_authenticated" on storage.objects
for select to authenticated using (bucket_id = 'event-arts');

create policy "event_arts_insert_authenticated" on storage.objects
for insert to authenticated with check (bucket_id = 'event-arts');

create policy "event_arts_update_authenticated" on storage.objects
for update to authenticated using (bucket_id = 'event-arts') with check (bucket_id = 'event-arts');

create policy "event_arts_delete_authenticated" on storage.objects
for delete to authenticated using (bucket_id = 'event-arts');
