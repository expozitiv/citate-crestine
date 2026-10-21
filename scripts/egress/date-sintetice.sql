-- Date sintetice pentru scripts/egress/masurare.ts, dimensionate ca baza reală (~47 MB).
-- Ipotezele (număr de autori/cărți/teme, lungimi de text) sunt în docs/studiu-egress-db.md.
--   psql "$DATABASE_URI" -f scripts/egress/date-sintetice.sql   (DOAR pe o bază locală de test!)
-- Siguranță: scriptul golește tabelele; refuză orice server care nu e local.
select (inet_server_addr() is null or host(inet_server_addr()) in ('127.0.0.1', '::1')) as e_local \gset
\if :e_local
\else
  \echo 'Refuz: serverul nu e local. Scriptul golește tabelele de conținut.'
  \quit
\endif
\set N_CITATE 22000
\set N_AUTORI 450
\set N_CARTI 1800
\set N_TEME 250
create or replace function txt(n int) returns text language sql volatile as $$
  select left(string_agg(w, ' '), n) from (
    select (array['harul','lui','Dumnezeu','este','suficient','pentru','orice','încercare','și','sfințenia','credința','răbdarea','Hristos','îndreptățirea','păcătosul','mântuirea','rugăciunea','în','inimă','adevărul'])[1+floor(random()*20)::int] w
    from generate_series(1, n/6+2)) s $$;
truncate citate, citate_rels, autori, carti, teme, media restart identity cascade;
insert into media (alt,url,filename,mime_type,filesize,width,height,sizes_medalion_url,sizes_medalion_width,sizes_medalion_height,sizes_medalion_mime_type,sizes_medalion_filesize,sizes_medalion_filename,updated_at,created_at)
select 'Portret '||i, '/api/media/file/portret-autor-'||i||'.jpg','portret-autor-'||i||'.jpg','image/jpeg',30000,480,480,
 '/api/media/file/portret-autor-'||i||'-480x480.jpg',480,480,'image/jpeg',25000,'portret-autor-'||i||'-480x480.jpg',now(),now()
from generate_series(1,150) i;
insert into autori (nume,slug,ani,descriere_scurta,descriere,biografie,imagine_id,website,nume_norm,updated_at,created_at)
select 'Autor Numeprenume '||i,'autor-numeprenume-'||i,'1834–1892', txt(60), txt(350),
  case when random()<0.3 then txt(1200) end, case when i<=150 then i end,
  case when random()<0.1 then 'https://exemplu.ro/autor-'||i end, 'autor numeprenume '||i, now(), now()
from generate_series(1,:N_AUTORI) i;
insert into carti (nume,slug,autor_id,url,an,editura,nume_complet,descriere,nume_norm,updated_at,created_at)
select 'Titlul cărții numărul '||i,'titlul-cartii-numarul-'||i, 1+floor(:N_AUTORI*power(random(),3))::int,
  'https://www.magnagratia.org/carti/titlul-cartii-numarul-'||i, 1990+(i%35), case when random()<0.5 then 'MAGNA GRATIA' end,
  'Titlul cărții numărul '||i||': subtitlul complet al ediției', case when random()<0.2 then txt(120) end,
  'titlul cartii numarul '||i, now(), now()
from generate_series(1,:N_CARTI) i;
insert into teme (nume,slug,descriere,nume_norm,updated_at,created_at)
select 'Tema '||i,'tema-'||i, txt(150), 'tema '||i, now(), now() from generate_series(1,:N_TEME) i;
insert into citate (text,slug,autor_id,carte_id,referinta,text_norm,updated_at,created_at)
select t, 'citat-'||i, a,
  case when random()<0.8 then (select id from carti where autor_id=a order by random() limit 1) end,
  case when random()<0.15 then 'pag. '||(i%300) end, t, now(), now()-interval '2 days'
from (select i, txt(80+floor(random()*400)::int) t, 1+floor(:N_AUTORI*power(random(),3))::int a from generate_series(1,:N_CITATE) i) s;
insert into citate_rels ("order",parent_id,path,teme_id)
select k, c.id, 'teme', 1+floor(:N_TEME*power(random(),2))::int
from citate c cross join lateral generate_series(1, 1+floor(random()*3+0*c.id)::int) k;
analyze;
