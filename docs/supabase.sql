-- ZakaTani — skema Supabase (PostgreSQL + autentikasi)
-- Satu baris JSON berisi seluruh dataset (simpul, parameter, alur, statistik, dampak).
-- Semua orang boleh membaca (juri tanpa login); hanya pengguna terautentikasi (tim) yang boleh menulis.

create table if not exists public.dataset (
  id text primary key,
  isi jsonb not null,
  diperbarui timestamptz not null default now()
);

alter table public.dataset enable row level security;

create policy "baca publik" on public.dataset
  for select using (true);

create policy "tim menulis" on public.dataset
  for insert to authenticated with check (true);

create policy "tim memperbarui" on public.dataset
  for update to authenticated using (true) with check (true);

-- Riwayat perubahan (opsional, untuk audit selama riset)
create table if not exists public.dataset_riwayat (
  nomor bigserial primary key,
  id text not null,
  isi jsonb not null,
  diubah_oleh uuid default auth.uid(),
  waktu timestamptz not null default now()
);
alter table public.dataset_riwayat enable row level security;
create policy "tim membaca riwayat" on public.dataset_riwayat for select to authenticated using (true);

create or replace function public.catat_riwayat() returns trigger language plpgsql security definer as $$
begin
  insert into public.dataset_riwayat (id, isi) values (new.id, new.isi);
  return new;
end $$;

drop trigger if exists trg_riwayat on public.dataset;
create trigger trg_riwayat after insert or update on public.dataset
  for each row execute function public.catat_riwayat();

-- Isi awal: salin isi data/simpul.json ke kolom isi, misalnya lewat Kelola Data
-- (masuk sebagai tim → Kelola Data → Ekspor & cadangan → atau unggah CSV lalu Simpan).
