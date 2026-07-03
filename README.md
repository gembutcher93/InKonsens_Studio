# InkConsent

Consenso informato digitale per studi di tatuaggio. File singolo, offline-first,
zero dipendenze runtime pesanti — stessa filosofia di InkAnimus.

Testato end-to-end con browser headless (flusso completo: nuova sessione →
6 step → doppia firma → archiviazione → ricerca in archivio) prima della consegna.

## Cosa fa

L'app fa **una sola cosa e la fa bene: il consenso informato**, in due fasi che
rispecchiano come funziona davvero in studio.

**Fase cliente (passi 1-6, anche da remoto):** anagrafica → questionario
sanitario → zona e disegno → rischi e consenso → privacy e conferma disegno →
firma. Il cliente può compilarla da casa via link/QR, o insieme a te in studio.

**Fase studio (passi 7-8, in studio il giorno dell'appuntamento):**
- *Dati seduta*: data effettiva, zona trattata, materiali, ago, lotto pigmento,
  scheda tecnica, reazioni. Sono dati che **esistono solo a tatuaggio fatto**,
  quindi il cliente non li vede: li compili tu, davanti al cliente.
- *Controfirma* del tatuatore e archiviazione con PDF.

Questo separa nettamente ciò che il cliente sa/firma prima da ciò che si sa
solo dopo — niente più campi che il cliente non può compilare (come la data
reale) mescolati al modulo di consenso.

### Zona: due modalità, scegli tu

Nel passo "Zona" c'è un interruttore:
- **Indica la zona** — chip rapidi (braccio dx, schiena…) + dettaglio libero.
- **Sagoma corpo** — silhouette fronte/retro, maschile o femminile, dove tocchi
  i punti esatti. La stessa sagoma del preventivo, così se converti una
  richiesta preventivo in consenso i punti già segnati si portano dietro.

In più un campo **grandezza indicativa** in entrambe le modalità.

## Le altre funzioni

- **Archivio** consensi ricercabile per nome, con stato (bozza / in attesa
  firma / archiviato).
- **Richieste preventivo**: link pubblico dove il cliente racconta cosa vuole,
  segna le zone sulla sagoma e lascia i contatti. Ti arriva (con notifica push
  opzionale via ntfy.sh), lo contatti su WhatsApp con un click, e con un altro
  click lo converti in un consenso già intestato.
- **PDF** client-side con jsPDF, firme incluse, sezioni separate cliente/seduta.
- **Dati** in `localStorage` offline-first; sync Supabase opzionale.

## I moduli sono i tuoi, trascritti dai PDF cartacei

I testi del consenso (le 15 condizioni sanitarie, effetti collaterali
frequenti/rari, dichiarazioni, privacy D.Lgs 196/2003, autorizzazione minori
con dati dei due tutori e documento) sono trascritti 1:1 dai moduli cartacei
`Consenso_Informato_F_R.pdf` e `...Minori.pdf` dello studio, non da un modello
generico. Tutti in `STUDIO_CONFIG` e `HEALTH_QUESTIONS`: se aggiorni un testo,
incrementa `informativaVersion` così lo storico firmato resta coerente.

## Il flusso preventivo → studio → caparra

Il pannello preventivo NON dà un prezzo automatico: raccoglie una richiesta di
consulenza. Il preventivo vero lo dai tu di persona, in studio. Il giro è:
cliente compila il link pubblico → ti arriva la richiesta (+ notifica push) →
apri, tocca "Scrivi su WhatsApp" (numero già formattato con prefisso 39) →
fissi la consulenza → in studio dai il preventivo, chiudi con caparra, e con un
click trasformi la richiesta in un consenso già intestato a quel cliente.

### Notifiche push gratis (ntfy.sh)

Per ricevere ogni richiesta come notifica sul telefono, senza account:
1. Installa l'app **ntfy** (Android/iOS/desktop) — gratis.
2. Iscriviti a un topic con nome lungo e non indovinabile, es.
   `podere173-xk92q` (il topic è pubblico su ntfy.sh, quindi non usare
   "podere173" liscio).
3. Incolla quel nome in `NOTIFY_CONFIG.ntfyTopic` in `index.html`.

Senza questa configurazione l'app funziona lo stesso: controlli la sezione
"Richieste preventivo" quando vuoi (il badge conta le nuove).

## Personalizzare per uno studio (whitelabel)

Ora ci sono **due modi**, e per la vendita conta il primo:

1. **Dall'app (nessun codice).** In "Impostazioni studio → Setup studio" ogni
   studio modifica nome, città, sigla/logo testuale, artisti, URL pubblico e i
   tre colori principali. Si salva sul dispositivo e si applica subito. È il
   percorso pensato per studi non tecnici.
2. **Dal codice** (per il rivenditore): i testi legali del consenso, la
   versione informativa e i default di fabbrica stanno in `STUDIO_DEFAULTS` e
   `STUDIO_CONFIG` in `index.html`.

### Icona / logo

`icon-192.png` e `icon-512.png` sono l'icona dell'app (macchinetta-penna).
Vanno nella root insieme a `index.html`. Il `manifest.json` e i tag
`apple-touch-icon` le usano per l'installazione su iOS/Android. Per uno studio
diverso, basta sostituire questi due PNG mantenendo gli stessi nomi.

## ⚠️ Nota legale — leggere prima di usarla con clienti veri

Il ddl melanoma (approvato al Senato il 27/01/2026) rende il consenso
informato per tatuaggi obbligatorio per legge, ma il **decreto attuativo**
del Ministero della Salute — che fissa contenuti esatti, formato e tempi di
conservazione — non è ancora stato pubblicato. Il testo in `informativaText`
è un punto di partenza ragionevole, non una consulenza legale:

- fallo rivedere a un professionista (commercialista/legale dello studio)
  prima dell'uso reale;
- quando il decreto uscirà, aggiorna il testo e incrementa
  `informativaVersion` — ogni consenso salva la versione firmata al momento,
  quindi lo storico resta coerente anche dopo un aggiornamento.

## Deploy (Vercel, come gli altri progetti)

1. Metti `index.html`, `manifest.json`, `sw.js` nella root del repo.
2. Collega il repo a Vercel, deploy.
3. Aggiorna `STUDIO_CONFIG.publicUrl` con il dominio reale — serve per il QR.
4. Per un'icona PWA a norma su tutti i dispositivi, sostituisci l'icona SVG
   segnaposto in `manifest.json` con dei PNG reali (192×192 e 512×512):
   l'SVG inline funziona ma alcuni Android/iOS sono più permissivi di altri.

## Sincronizzazione multi-dispositivo (opzionale, Supabase)

Senza Supabase l'app funziona al 100%, ma un consenso compilato dal cliente
sul *suo* telefono resta sul *suo* dispositivo — non arriva automaticamente
allo studio. Per il flusso "cliente compila da casa, studio vede in negozio"
serve un backend condiviso. Pattern coerente col data-sync-bridge già usato
su InkAnimus_OS:

1. Crea un progetto su [supabase.com](https://supabase.com) (piano free
   sufficiente per iniziare).
2. Crea la tabella:

```sql
create table consents (
  id text primary key,
  tenant_id text not null,
  status text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

-- Row Level Security: ogni studio vede solo i propri record.
-- Con la sola anon key, la policy sotto basta per un MVP a singolo studio;
-- per un vero multi-tenant rivenduto a più studi, valuta un progetto
-- Supabase separato per studio (più semplice da gestire) oppure
-- autenticazione per-studio con policy su auth.uid().
alter table consents enable row level security;
create policy "consenti tutto sul proprio tenant"
  on consents for all
  using (true) with check (true);
```

3. In `index.html`, compila `SUPABASE_CONFIG.url`, `SUPABASE_CONFIG.anonKey`
   e `SUPABASE_CONFIG.tenantId` (uno slug univoco per studio, es. `"podere173"`).
4. Da quel momento ogni salvataggio prova anche a sincronizzarsi su Supabase
   (fallisce in silenzio se offline — resta comunque salvato in locale).

Nota: le **richieste preventivo** restano al momento solo locali/notifica push
(non sincronizzate su Supabase), perché arrivano dal telefono del cliente e la
notifica ntfy è sufficiente a farti sapere subito che c'è una richiesta nuova.
Se in futuro vuoi vederle centralizzate su più dispositivi dello studio, si
aggiunge una tabella `richieste` speculare a `consents` e si estende
`upsertRichiesta` come già fatto per i consensi.

### Due modelli di business, entrambi supportati dal codice così com'è

- **Bring-your-own-Supabase**: ogni studio che compra l'app crea il proprio
  progetto Supabase gratuito e incolla le proprie chiavi. Zero infrastruttura
  da mantenere per te. Coerente con come vendi già i temi InkAnimus.
- **SaaS centralizzato**: un solo progetto Supabase tuo, un `tenant_id`
  diverso per ogni studio cliente, RLS per isolare i dati. Più lavoro di
  manutenzione per te, ma consente un modello ad abbonamento.

## Roadmap ragionevole per le prossime iterazioni

- Multilingua (come il menu QR della pizzeria) per clienti turisti.
- Mappa corpo interattiva al posto dei chip di zona, se serve più precisione.
- Esportazione massiva dell'archivio (per backup o cambio dispositivo).
- Autenticazione staff se più persone dello studio useranno l'app.

## Per venderla agli studi: cosa manca davvero

Il cuore funziona. Per farne un prodotto che uno studio compra e usa senza
pensarci, i pezzi che contano di più (in ordine di impatto):

1. **Sync multi-dispositivo attiva di default.** Oggi i dati sono per-device.
   Uno studio con tablet in reception + telefono del tatuatore si aspetta di
   vedere gli stessi consensi ovunque. Il gancio Supabase c'è già; va reso il
   percorso normale, non opzionale (vedi sezione Supabase).

2. **Backup/export dell'archivio.** Un tatuatore che tiene 5 anni di consensi
   deve poter esportare tutto (ZIP di PDF + un file dati) con un click, per
   cambio telefono o richiesta del commercialista. È la differenza tra "app
   simpatica" e "archivio di cui mi fido".

3. **Onboarding self-service del branding.** Ora nome/colori/artisti si toccano
   nel codice. Per vendere a studi non tecnici serve una schermata "Setup
   studio" che scrive quei valori senza aprire l'HTML — logo compreso.

4. **Numerazione progressiva dei consensi** (es. 2026-0001), utile in caso di
   controllo ASL e più professionale di un ID interno.

5. **Ricerca e filtri archivio** per data, artista, stato — banale ora con
   pochi record, essenziale dopo un anno di lavoro.

6. **Conferma legale del testo.** Prima di vendere, il testo dell'informativa
   va validato da un professionista e allineato al decreto attuativo del ddl
   melanoma quando esce. Questo è l'unico punto non tecnico ma è bloccante per
   la vendita: stai vendendo tranquillità legale, deve esserlo davvero.

Punti 3-5 sono lavoro incrementale sul codice attuale; l'1 e il 2 sono i due
che alzano di più il valore percepito. Il 6 non dipende dal codice ma è quello
che trasforma "comodo" in "necessario".
