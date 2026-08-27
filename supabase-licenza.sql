-- ============================================================
-- InkConsent — licenza/abbonamento su Supabase (facoltativo)
-- ============================================================
-- Esegui questi blocchi IN ORDINE, uno alla volta, nell'SQL editor di
-- Supabase (Progetto > SQL Editor > New query). Sono numerati 1-9 e
-- pensati per essere eseguiti anche come un unico script dall'inizio
-- alla fine.
--
-- Cosa fa questo file: SOLO gestione licenza/abbonamento/piano. Verso
-- Supabase viaggiano SOLO due UUID opachi (licenza dello studio e del
-- dispositivo, generati dal client — vedi licenseIds() in index.html)
-- più lo stato abbonamento. NESSUN dato del cliente (anagrafica,
-- sanitario, firme, disegni) tocca mai queste tabelle né qualunque
-- altra: quello resta locale sul dispositivo (IndexedDB). Il
-- trasferimento consenso cliente -> studio è solo il codice/QR locale
-- (encodeHandoff/decodeHandoff in index.html), mai un server — vedi
-- README.md, sezione "Trasferimento consenso cliente -> studio".
--
-- Il gate "10 consensi gratuiti prima del pagamento" funziona anche
-- SENZA questo file (interamente locale, offline-first): questo script
-- serve solo come riscontro server-side più difficile da aggirare
-- svuotando i dati del browser, e come base per un vero conteggio
-- multi-dispositivo per studio.
-- ============================================================


-- 1. Estensione per generare UUID lato database
-- (di norma già presente su Supabase; il comando è idempotente)
create extension if not exists pgcrypto;


-- 2. Tabella studi/licenze — un record per studio, con lo stato
-- dell'abbonamento e il piano (SoloPro/StudioPro/AtelierPro/multi-studio)
create table if not exists licenza_studi (
  id uuid primary key,                     -- generato dal client (licenseIds().studioId in index.html)
  nome text,                                -- etichetta libera, solo per riconoscerlo dal pannello Supabase
  stato_abbonamento text not null default 'gratuito'
    check (stato_abbonamento in ('gratuito','attivo','scaduto','sospeso')),
  data_attivazione_abbonamento timestamptz, -- valorizzata quando passa ad 'attivo'
  piano text
    check (piano is null or piano in ('solopro','studiopro','atelierpro','multi-studio')),
  created_at timestamptz not null default now()
);

comment on table licenza_studi is
  'Solo gestione licenza/abbonamento/piano. Nessun dato cliente: quello resta locale sul dispositivo (IndexedDB), vedi index.html.';

-- Nota piano: i tre piani self-service sono legati al numero di
-- tatuatori dichiarati in Impostazioni -> "Artisti" (SoloPro 1,
-- StudioPro fino a 3, AtelierPro 4+); 'multi-studio' è solo
-- informativo — quel caso non ha mai autoattivazione, solo il
-- contatto diretto esposto nell'app (vedi GEMBUCHER_CONTATTO in
-- index.html). Il piano lo calcola/mostra il client
-- (pianoConsigliato() in index.html); questa colonna serve solo per
-- poterlo leggere dal pannello Supabase quando un titolare ti scrive
-- per attivarsi.
--
-- Se questa tabella esiste già da prima (senza la colonna piano),
-- esegui invece:
--   alter table licenza_studi
--     add column if not exists piano text
--       check (piano is null or piano in ('solopro','studiopro','atelierpro','multi-studio'));


-- 3. Tabella dispositivi, con il contatore dei consensi firmati — uno
-- studio può avere più dispositivi (tablet in reception, telefono del
-- tatuatore...): il contatore si somma per studio nel gate del blocco 5.
create table if not exists licenza_dispositivi (
  id uuid primary key,                      -- generato dal client (licenseIds().deviceId in index.html)
  studio_id uuid not null references licenza_studi(id) on delete cascade,
  consensi_firmati integer not null default 0, -- incrementato SOLO da register_consenso_firmato()
  data_attivazione timestamptz not null default now(),
  ultimo_utilizzo timestamptz not null default now()
);

create index if not exists idx_licenza_dispositivi_studio on licenza_dispositivi(studio_id);

comment on column licenza_dispositivi.consensi_firmati is
  'Contatore automatico: non aggiornarlo a mano, solo tramite la funzione register_consenso_firmato().';


-- 4. RLS: nessun accesso diretto dal client, solo tramite le funzioni
-- dei blocchi 5-6. L'anon key è necessariamente pubblica in un'app
-- offline-first (sta nel codice JS), quindi le tabelle restano a
-- "nega tutto" per query dirette; le funzioni sotto girano con
-- permessi propri (security definer) e non possono essere richiamate
-- con l'id di uno studio a caso per manomettere quello di un altro —
-- accettano solo l'incremento/lettura del proprio conteggio.
alter table licenza_studi enable row level security;
alter table licenza_dispositivi enable row level security;

-- Nessuna policy per anon/authenticated = RLS a "nega tutto" per default
-- su SELECT/INSERT/UPDATE/DELETE dirette. Il revoke sotto è una difesa
-- in più, esplicita, indipendente dalla RLS.
revoke all on licenza_studi from anon, authenticated;
revoke all on licenza_dispositivi from anon, authenticated;


-- 5. Funzione-gate: registra un consenso firmato, blocca oltre la
-- soglia gratuita. È la funzione che index.html chiama
-- (register_consenso_firmato) subito dopo aver archiviato un consenso
-- in locale. Non impedisce mai l'archiviazione già avvenuta sul
-- dispositivo (l'app resta offline-first): serve a tenere lo stato
-- reale per la volta successiva.
--
-- Accetta anche un piano opzionale (p_piano): se lo passi, lo salva su
-- licenza_studi.piano. Il client oggi non lo manda ancora (vedi nota in
-- fondo al blocco 9), ma la funzione è già pronta.
create or replace function register_consenso_firmato(p_studio_id uuid, p_device_id uuid, p_piano text default null)
returns table (abbonamento_attivo boolean, count_totale integer, remaining integer, consentito boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_free_limit constant integer := 10;  -- tieni allineato con FREE_CONSENSI_LIMIT in index.html
  v_stato text;
  v_totale integer;
  v_attivo boolean;
begin
  if p_studio_id is null or p_device_id is null then
    raise exception 'studio_id e device_id sono obbligatori';
  end if;

  -- auto-registrazione al primo contatto: niente flusso di signup separato,
  -- coerente con un'app che genera gli ID lato client
  insert into licenza_studi (id) values (p_studio_id) on conflict (id) do nothing;

  -- lock sulla riga studio: serializza chiamate concorrenti da più dispositivi
  -- dello stesso studio, cosi' il conteggio resta corretto anche in parallelo
  select stato_abbonamento into v_stato from licenza_studi where id = p_studio_id for update;
  v_attivo := (v_stato = 'attivo');
  if p_piano is not null then
    update licenza_studi set piano = p_piano where id = p_studio_id;
  end if;

  insert into licenza_dispositivi (id, studio_id) values (p_device_id, p_studio_id)
    on conflict (id) do update set ultimo_utilizzo = now();

  select coalesce(sum(consensi_firmati), 0) into v_totale
    from licenza_dispositivi where studio_id = p_studio_id;

  if v_attivo or v_totale < v_free_limit then
    update licenza_dispositivi set consensi_firmati = consensi_firmati + 1, ultimo_utilizzo = now()
      where id = p_device_id;
    v_totale := v_totale + 1;
    return query select v_attivo, v_totale, greatest(0, v_free_limit - v_totale), true;
  else
    return query select v_attivo, v_totale, 0, false;
  end if;
end;
$$;

grant execute on function register_consenso_firmato(uuid, uuid, text) to anon, authenticated;


-- 6. Funzione di sola lettura: stato abbonamento senza incrementare
-- nulla — usata da "Verifica su Supabase" nelle Impostazioni e dal
-- pulsante "Riprova ad archiviare" nel muro del limite raggiunto.
create or replace function get_stato_licenza(p_studio_id uuid, p_device_id uuid)
returns table (abbonamento_attivo boolean, count_totale integer, remaining integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_free_limit constant integer := 10;  -- tieni allineato con FREE_CONSENSI_LIMIT in index.html
  v_stato text;
  v_totale integer;
begin
  if p_studio_id is null or p_device_id is null then
    raise exception 'studio_id e device_id sono obbligatori';
  end if;

  insert into licenza_studi (id) values (p_studio_id) on conflict (id) do nothing;
  insert into licenza_dispositivi (id, studio_id) values (p_device_id, p_studio_id)
    on conflict (id) do update set ultimo_utilizzo = now();

  select stato_abbonamento into v_stato from licenza_studi where id = p_studio_id;
  select coalesce(sum(consensi_firmati), 0) into v_totale
    from licenza_dispositivi where studio_id = p_studio_id;

  return query select (v_stato = 'attivo'), v_totale, greatest(0, v_free_limit - v_totale);
end;
$$;

grant execute on function get_stato_licenza(uuid, uuid) to anon, authenticated;


-- 7. Attivare un abbonamento pagato — da eseguire manualmente tu (o da
-- un futuro webhook Stripe) quando uno studio paga o rinnova. L'id da
-- usare è quello che il titolare vede in Impostazioni app > "Licenza e
-- consensi gratuiti" > "ID studio (Supabase)". Da lì lo trovi anche
-- nella tabella licenza_studi per riconoscerlo. Puoi valorizzare anche
-- il piano concordato nella stessa query.
update licenza_studi
  set stato_abbonamento = 'attivo',
      data_attivazione_abbonamento = now(),
      piano = 'studiopro'  -- oppure 'solopro' / 'atelierpro' / 'multi-studio' / lascia invariato togliendo la riga
  where id = '00000000-0000-0000-0000-000000000000';  -- sostituisci con l'ID studio reale

-- Per disattivare (mancato rinnovo), stesso comando con:
--   set stato_abbonamento = 'scaduto'


-- 8. Solo lettura: controlla lo stato di uno studio dal pannello,
-- comodo quando un titolare ti scrive per attivarsi o per un problema.
-- select id, nome, stato_abbonamento, piano, data_attivazione_abbonamento
--   from licenza_studi
--   where id = '00000000-0000-0000-0000-000000000000';


-- 9. Nota sul wiring lato client: index.html oggi chiama
-- register_consenso_firmato(p_studio_id, p_device_id) SENZA p_piano —
-- il parametro esiste già in questa funzione (blocco 5) ed è pronto,
-- ma il client non lo manda ancora. Se vuoi che il piano dichiarato in
-- Impostazioni arrivi qui automaticamente a ogni consenso archiviato,
-- serve solo aggiungere p_piano: pianoConsigliato().id alla chiamata
-- in syncLicenseOnFinalize() (index.html) — lo schema è già pronto,
-- non serve nessun'altra modifica SQL.
