# InkConsent

Consenso informato digitale per studi di tatuaggio. File singolo, offline-first,
zero dipendenze runtime pesanti — stessa filosofia di InkAnimus.

Testato end-to-end con browser headless (flusso completo: nuova sessione →
6 step → doppia firma → archiviazione → ricerca in archivio) prima della consegna.

## Correzioni dell'ultimo giro (non nuove funzionalità)

Giro di lavoro dedicato solo a correggere il giro precedente (restyling +
Supabase + piani), non ad aggiungere altro:

- **Restyling vero**, non solo colori: la volta scorsa il dark mode aveva
  cambiato le variabili colore ma non la struttura. Ora: topbar con
  gerarchia editoriale (titolo grande + sottotitolo + riga d'accento),
  card con una costa colorata a sinistra invece del bordo uniforme su
  tutti i lati (e più respiro interno), rail di navigazione raggruppata
  per sezione (Consenso / Preventivo / Studio / Account, non più
  un'unica lista piatta) con un marchio "stamp" squadrato al posto del
  tondo, tre livelli di bottoni con un contrasto reale (il vecchio
  `btn-primary` usava lo stesso colore quasi del fondo pagina — praticamente
  invisibile, corretto). Skill rilette prima di intervenire: vedi la nota
  più sotto in "Novità" del giro precedente, valgono ancora.
- **Muro del piano gratuito, ora propositivo**: mostra i tre piani con
  una breve descrizione ciascuno, e un pulsante per piano che apre
  WhatsApp con "Sono [studio], ID studio [codice], voglio attivare
  [piano]" — l'attivazione resta manuale e verificata da chi gestisce
  l'abbonamento, non automatica dal client.
- **Tolto il pulsante di test** "Segna abbonamento come attivo/Disattiva
  (test)" dalle Impostazioni: restava solo la verifica vera tramite
  Supabase.
- **URL pubblica e config Supabase bloccate**: non più campi Settings
  modificabili dal tatuatore — valori fissi iniettati al deploy (vedi
  "Deploy" sotto). Il campo "URL pubblico dell'app" è sparito
  dall'interfaccia.
- **"Compila da casa" → "in studio"** ovunque nei testi (app e README):
  il consenso resta touch-free via QR/link, ma si compila sul telefono
  del cliente mentre è in studio, non da remoto prima di arrivare.
- **Via ogni riferimento preimpostato a "Podere 173"**: nome, città,
  sigla e artista di default ora sono placeholder neutri
  (`STUDIO_DEFAULTS`, `manifest.json`, `<title>`, esempi nei placeholder
  dei campi) — l'app è pensata per essere venduta ad altri studi.
- **Due livelli di credenziali chiariti e separati** (locale vs
  licenza/Supabase): vedi la sezione dedicata "Due livelli di
  credenziali, mai mescolati" più sotto, che include anche cosa ho
  verificato prima di toccare codice su questo punto.

## Novità del giro precedente (fix + migliorie)

**Tolto**
- La sync del consenso completo su Supabase (`maybeSyncToSupabase`,
  `fetchRemoteSession`, tabella `consents`): non doveva esserci, mandava
  anagrafica/sanitario/firme fuori dal dispositivo. Il passaggio
  cliente→studio resta *solo* il codice/QR locale (`encodeHandoff`/
  `decodeHandoff`), già esistente e mai toccato — vedi "Trasferimento
  consenso cliente → studio" sopra. `SUPABASE_CONFIG` ora serve
  esclusivamente alla licenza (vedi sotto): non ha più un `tenantId`.

**Aggiunto**
- **Piani a pagamento** (`PIANI` in `index.html`): SoloPro (1 tatuatore),
  StudioPro (fino a 3), AtelierPro (4+, uno studio) — dedotti dal campo
  "Artisti" già in Impostazioni. Multi-studio (più sedi, campo nuovo
  "Numero di sedi") non è mai self-service: solo contatto diretto
  (`GEMBUCHER_CONTATTO`, **da compilare** con whatsapp/email veri prima
  di andare in produzione — vuoto di default, il pulsante resta
  nascosto finché non lo riempi). SQL per la colonna `piano` su
  `licenza_studi` in [`supabase-licenza.sql`](./supabase-licenza.sql)
  (blocco 2), spostato lì insieme a tutto il resto dell'SQL della
  licenza — nel README diventava troppo lungo da seguire.
- **Banner prova gratuita**: barra di avanzamento "X di 10" in Archivio
  e Impostazioni, con avviso più marcato sotto i 3 consensi rimasti; il
  muro del limite ora nomina il piano consigliato (o il contatto
  GemBucher per multi-studio) invece del testo generico di prima.
- **Restyling dark-mode nativo** (vedi sezione dedicata sotto per le
  skill usate): tema scuro di default, personalizzabile via Impostazioni
  (con un fallback chiaro fisso e non personalizzabile, per chi lavora
  alla luce diretta); font "Moderno" (Space Grotesk + Inter) come
  default; separazione visiva preventivo (accento caldo)/consenso
  (accento viola) sia nel telefono del cliente che nel rail dello studio.
- **Statistiche** (sola lettura, zero storage nuovo): consensi del mese,
  tasso di conversione preventivo→consenso, zone anatomiche più richieste.
- **Tracciabilità inversa lotti**: nuova scheda in Magazzino, cerchi un
  numero di lotto (inchiostro o ago) e trovi subito i clienti trattati.
- **Mappa anatomica preventivo arricchita**: campo dimensione in cm
  accanto alla fascia indicativa, upload foto di riferimento. Stile
  tatuaggio e numerazione dei punti sulla sagoma c'erano già.
- **Firma personalizzabile**: interruttore "effetto inchiostro" (tratto
  leggermente irregolare, resa non-uniforme) e colore firma indipendente
  dagli accenti dell'app — il *dato* salvato (i punti del tratto) non
  cambia mai, solo come viene ridisegnato.
- **Barra di guarigione aftercare**: il messaggio WhatsApp aftercare
  include ora un link a una pagina "giorno X di N" (giorni configurabili
  in Impostazioni), calcolata solo da una data nell'URL — nessun dato
  cliente nel link, riapribile da qualsiasi telefono.
- **Sigillo QR sul PDF**: il footer anonimo è diventato un timbro con
  numero di registro e un QR che incapsula un breve testo di verifica
  (studio, numero, data) — mai dati sensibili, non punta a nessun server.
- **Vetrina spenta**: pulsante nel rail (e nella barra mobile) che sfoca
  il contenuto a schermo per qualche secondo, per quando qualcuno passa
  in reception. Solo visivo: nessun logout, nessuna perdita di sessione.

**Rimandato apposta** (dipendono da un modulo agenda non ancora fatto):
notifiche WhatsApp automatiche da calendario, waitlist disdette, guest
artist con scadenza, contabilità/percentuali/caparre, flash book pubblico.

### Skill di design usate per il restyling

Prima di toccare CSS/markup: **frontend-design** (per la direzione
estetica e le regole di implementazione — niente font/palette di
default, un'unica direzione dichiarata) e **ui-ux-pro-max** (ricerche
mirate di palette/tipografia via il suo tool di search, più la checklist
contrasto/touch-target/accessibilità). La skill **mobile-design** è
stata consultata ma è tarata su app native (React Native/Flutter,
AsyncStorage, gesture di sistema): da lì ho preso solo i principi
generici applicabili a una PWA touch (target di tocco ≥44px, zona
pollice per le azioni primarie, niente azioni solo-gesture), non i
pattern nativi specifici.

I contrasti colore del nuovo tema scuro sono stati verificati a mano
(calcolo WCAG 2.1) prima di fissare i valori finali in `:root`, non solo
a occhio — cerca "contrast" nei commenti di `index.html` se li rivedi.

## Moduli nuovi (agenda, contabilità, guest artist)

Cinque moduli operativi in più, costruiti sopra il motore esistente.
**Tutto locale, IndexedDB su questo dispositivo — niente di questo passa
da Supabase, nemmeno in forma aggregata.** L'unico contatto con Supabase
resta la licenza/abbonamento (vedi sezione dedicata più sotto), esattamente
come prima: nessuna riga di questi moduli tocca quella parte di codice.

- **Agenda** (nav "Agenda"): appuntamenti con data/ora, cliente (collegato
  a una richiesta preventivo o a un consenso esistente, oppure inserito a
  mano), tatuatore assegnato (solo se ce n'è più di uno in Impostazioni),
  stato (da confermare/confermato/saltato). Vista giorno e vista
  settimana, si passa da un giorno/settimana all'altro con le frecce.
  Toccare un appuntamento collegato apre la scheda del cliente
  (richiesta o consenso); la matita apre invece la modifica
  dell'appuntamento stesso.
- **Promemoria WhatsApp**: quando un appuntamento è a esattamente 2 giorni
  di distanza, compare un banner in cima all'Agenda con un pulsante che
  apre WhatsApp già precompilato per quel cliente. Nessun invio
  automatico reale (servirebbe un backend WhatsApp Business a pagamento,
  fuori scopo): è un promemoria, parte con un tap, e si segna da solo
  come "inviato" quando lo tocchi.
- **Lista d'attesa** (raggiungibile dall'Agenda): clienti da ricontattare
  se si libera un posto prima del previsto. Quando segni un appuntamento
  come "saltato", l'Agenda mostra subito la lista con un tap per
  contattare ciascuno via WhatsApp — la compatibilità con lo slot libero
  la valuti tu, l'app non prova a indovinarla.
- **Contabilità** (nav "Contabilità"): sul preventivo trovi ora caparra
  richiesta/versata, metodo (contanti/bonifico/Satispay) e stato
  (da saldare/pagata) — attenzione, sono riferiti alla **caparra**, non
  a un prezzo totale del tatuaggio: quel campo non esiste da nessuna
  parte nell'app, non l'ho inventato. La sezione Contabilità mostra per
  mese: entrate (caparre versate + movimenti manuali), uscite (spese
  materiali già tracciate in Magazzino + movimenti manuali), percentuali
  di split per artista (impostabili lì), e una ripartizione automatica —
  **solo sulle caparre collegate a un appuntamento con un tatuatore
  assegnato**: caparre senza collegamento e movimenti manuali restano
  interamente allo studio, per scelta, per non spartire soldi a caso su
  dati che non li descrivono bene.
- **Guest artist** (Impostazioni → "Guest artist"): generi un codice/link
  a tempo per un artista ospite, con un limite annuo di inviti legato al
  piano (SoloPro 4, StudioPro 10, AtelierPro 20 — vedi `GUEST_LIMITI` in
  `index.html`). Durante la validità il dispositivo passa in "modalità
  guest": rail ridotta ad Agenda/Magazzino/Nuovo consenso/Importa
  consenso + una vista "I miei consensi" per esportare in PDF solo quelli
  firmati a suo nome (con l'avviso esplicito richiesto sul rischio di
  tenerli sul proprio telefono). Alla scadenza, schermata di blocco
  "È finita la tua sessione di guest" finché il titolare non esce dalla
  modalità guest.
  **Limite onesto da sapere**: non è un vero multi-utente con login
  separato — per scelta, per restare un'app a dispositivo singolo come
  tutto il resto. "Modalità guest" è solo un livello di interfaccia che
  restringe cosa si vede *dopo* essere entrati, non un vero confine di
  sicurezza: se lo studio ha il blocco d'accesso con password attivo,
  quello resta l'unica vera protezione dei dati, e il guest deve comunque
  riuscire a sbloccare il dispositivo (di norma perché il titolare
  glielo consegna già sbloccato per la giornata). Il codice/link serve a
  limitare cosa vede la persona, non a dargli un accesso indipendente
  cifrato con una password diversa dalla tua.

## Cosa fa

L'app fa **una sola cosa e la fa bene: il consenso informato**, in due fasi che
rispecchiano come funziona davvero in studio.

**Fase cliente (passi 1-6):** anagrafica → questionario sanitario → zona e
disegno → rischi e consenso → privacy e conferma disegno → firma. Il cliente
la compila sul proprio telefono, in studio (touch-free, via link/QR — non più
"da casa": vedi il passaggio con codice/QR più sotto), oppure insieme a te.

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

- **Sezione consensi "Premium" (fase di lancio)**: la dispensa/magazzino è
  libera per tutti; la parte consensi (nuovo consenso, archivio, registro) è
  mostrata come Premium con una vetrina. Per i test si sblocca con una
  password-master (in "Impostazioni → Sezione consensi" vedi lo stato e puoi
  ri-bloccare). Nota: è una vetrina di lancio, non una protezione anti-copia.
- **PDF professionale**: intestazione con logo e numero di registro, sezioni con
  bande titolate, campi allineati, questionario sanitario su due colonne, box
  firme incorniciati e footer con paginazione. Contenuto giuridico invariato.
- **Accesso protetto (ID + password)** con recupero a due vie:
  - *Codice di recupero*: al primo avvio l'app genera un codice
    (`INK-XXXX-XXXX-XXXX`) da conservare. Se dimentichi la password, dalla
    schermata di accesso lo inserisci e imposti una password nuova.
  - *Ripristino da backup*: sempre dalla schermata di accesso, un pulsante
    carica un file di backup e rientra (le credenziali sono nel backup). Utile
    anche per cambio dispositivo.
  La password non è mai recuperabile in chiaro (è salvata come hash con salt):
  entrambi i sistemi ti fanno rientrare e reimpostarne una nuova.
- **Backup e ripristino**: esporta tutto (impostazioni, consensi, richieste,
  codice) in un file unico, e re-importalo. Scegli se **cifrarlo** (AES-GCM con
  password: illeggibile senza, ma password persa = dati persi) o lasciarlo in
  chiaro. Un avviso al momento dell'export spiega le conseguenze di ciascuna via.
  Fai backup regolari: è anche la rete di sicurezza se dimentichi il PIN.
- **Personalizzazione (stile MenuFlex)**: nome, città, sigla, artisti, URL,
  tre colori e quattro temi di font, tutti modificabili dall'app e applicati dal
  vivo.
- **Archivio** consensi ricercabile per nome, con stato.
- **Richieste preventivo**: link pubblico, sagoma corpo, contatti, notifica
  push opzionale, WhatsApp con un click, conversione in consenso.
- **PDF** client-side, firme incluse, sezioni separate cliente/seduta.
- **Magazzino a schede (dispensa)**: tre sezioni — Forniture, Inchiostri, Aghi.
  - *Forniture* (guanti, pellicole, disinfettanti, ecc.): dispensa visiva a card
    con icona di categoria (sostituibile con foto), quantità, barra di livello e
    badge di stato (OTTIMO / BUONO / BASSA / IN ESAURIMENTO). Pulsanti +/− per
    consumo/carico rapido, ⟳ per registrare un acquisto con prezzo. Fascia in
    alto con Totale materiale, Scorta bassa e Spesa del mese (confronto col mese
    precedente). Soglia di riordino per articolo.
  - *Inchiostri e Aghi*: archivio lotti a norma (marca, tipo, lotto, scadenza),
    selezionabili nel consenso. Le icone categoria sono i file `cat-*.png`.
- **Sagoma anatomica** fronte/retro (M/F): la zona si segna su vere immagini
  del corpo (`body-man_front.png`, `body-man_back.png`, `body-girl_front.png`,
  `body-girl_back.png`), con due modi a scelta — **📍 Punto** (pin numerati) o
  **✏️ Disegna** (traccia libera col dito) — più "Cancella". I segni finiscono
  anche nel PDF. Per cambiare le sagome, sostituisci i 4 PNG mantenendo i nomi
  (interno bianco + sfondo trasparente così restano leggibili su ogni tema).

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
fissi la consulenza → in studio dai il preventivo, chiudi con caparra (importo
richiesto/versato, metodo, stato — si registrano nella scheda della richiesta
stessa, vedi "Moduli nuovi" sotto), e con un click trasformi la richiesta in un
consenso già intestato a quel cliente.

### Notifiche push gratis (ntfy.sh)

Per ricevere ogni richiesta come notifica sul telefono, senza account:
1. Installa l'app **ntfy** (Android/iOS/desktop) — gratis.
2. Iscriviti a un topic con nome lungo e non indovinabile, es.
   `tuostudio-xk92q` (il topic è pubblico su ntfy.sh, quindi non usare
   "tuostudio" liscio).
3. Incolla quel nome in `NOTIFY_CONFIG.ntfyTopic` in `index.html`.

Senza questa configurazione l'app funziona lo stesso: controlli la sezione
"Richieste preventivo" quando vuoi (il badge conta le nuove).

## Personalizzare per uno studio (whitelabel)

Ora ci sono **due modi**, e per la vendita conta il primo:

1. **Dall'app (nessun codice).** In "Impostazioni studio → Setup studio" ogni
   studio modifica nome, città, sigla/logo testuale, artisti, numero di sedi
   e i colori. Si salva sul dispositivo e si applica subito. È il percorso
   pensato per studi non tecnici.
2. **Dal codice** (per il rivenditore, una volta per studio al deploy): i
   testi legali del consenso, la versione informativa e i default di
   fabbrica stanno in `STUDIO_DEFAULTS` e `STUDIO_CONFIG` in `index.html`.
   Qui vivono anche i valori che il tatuatore NON deve poter toccare —
   `publicUrl` (l'URL pubblica di questo deploy) e `SUPABASE_CONFIG`
   (url/anonKey della licenza): niente campo Settings per questi, per
   evitare che vengano toccati per sbaglio e rompano i link/QR o
   l'abbonamento. Vanno anche aggiornati `manifest.json` (`name`) e il
   `<title>` di fabbrica in `index.html` se vuoi che il nome dello studio
   compaia già nell'app installata prima che qualcuno apra le Impostazioni
   (il `<title>` comunque si aggiorna da solo non appena lo studio salva
   il proprio nome, vedi `applyStudioConfig`).

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

## Deploy (Cloudflare Pages, un deploy per studio)

Ogni studio ha il suo deploy separato — non un'app multi-tenant con un
dominio condiviso. Attualmente in produzione su Cloudflare Pages
(`inkonsens-studio.pages.dev`), ma qualunque hosting statico va bene
(Vercel, Netlify...): è solo file statici, nessun backend da gestire.

1. Metti `index.html`, `manifest.json`, `sw.js` e le altre risorse nella
   root del repo/progetto.
2. Collega il repo all'hosting scelto, deploy.
3. Aggiorna `STUDIO_DEFAULTS.publicUrl` in `index.html` con il dominio
   reale di **questo** deploy — è un valore fisso iniettato qui, non un
   campo Settings (vedi "Due livelli di credenziali" più sotto per la
   stessa logica applicata a `SUPABASE_CONFIG`): serve per i link/QR di
   richiesta, compilazione, aftercare e guest artist.
4. Aggiorna anche `manifest.json` (`name`) e il `<title>` di fabbrica in
   `index.html` con il nome dello studio, se vuoi che compaia già
   nell'app installata prima ancora che qualcuno apra le Impostazioni.
5. `icon-192.png`/`icon-512.png` sono già PNG reali nella root: per uno
   studio diverso basta sostituirli mantenendo gli stessi nomi (vedi
   sezione whitelabel).

## Trasferimento consenso cliente → studio: solo locale, mai un server

Un consenso compilato dal cliente sul *suo* telefono viaggia verso lo
studio **solo** tramite il codice/QR generato a fine compilazione
(`encodeHandoff`/`decodeHandoff` in `index.html`): il cliente lo mostra,
lo studio lo scansiona (o lo incolla) da "Importa consenso", e da quel
momento il consenso completo — anagrafica, sanitario, firme, disegni —
è nell'archivio locale dello studio. Nessun payload cliente tocca mai un
server, nemmeno opzionalmente: in una versione precedente esisteva un
bridge che sincronizzava il consenso completo su una tabella `consents`
di Supabase, rimosso di proposito perché in contrasto con l'architettura
offline-first/dati-solo-locali di questa app.

Le **richieste preventivo** restano allo stesso modo solo locali/notifica
push (mai su un server): arrivano dal telefono del cliente e la notifica
ntfy è sufficiente a farti sapere subito che c'è una richiesta nuova.

## Due livelli di credenziali, mai mescolati

Nell'app esistono **due sistemi di credenziali completamente separati**,
per due scopi diversi. Vale la pena scriverlo qui in modo esplicito
perché i nomi nell'interfaccia potevano sembrare la stessa cosa:

1. **Nome di accesso al dispositivo** (Impostazioni → "Accesso e
   credenziali"): apre l'app su *questo* tablet/telefono. È l'hash con
   salt che c'è da sempre (`AUTH_KEY`, `checkCredentials()` in
   `index.html`), **resta sempre e solo su questo dispositivo**
   (`localStorage`), cifrato in locale: non parte mai una richiesta di
   rete che lo contenga, in nessuna forma, nemmeno come hash. Chi scrive
   queste righe (o Supabase) non può mai risalirci.
2. **Codice licenza studio** (Impostazioni → "Licenza e consensi
   gratuiti"): un UUID opaco generato dal dispositivo al primo avvio
   (`licenseIds()`, `LICENSE_IDS_KEY`), usato **solo** per contare i
   consensi gratuiti e verificare l'abbonamento su Supabase
   (`licenza_studi`/`licenza_dispositivi`, vedi sotto). Non è un login:
   non c'è una password associata, non identifica una persona, serve
   solo a distinguere uno studio dall'altro nel pannello di gestione.

**Verifica fatta prima di scrivere codice** (come richiesto nel giro di
lavoro che ha aggiunto questa nota): nell'app non esiste, e non è mai
esistito, un vero "account studio" con email e password lato Supabase —
l'idea era di usarlo per identificare piano/abbonamento, ma costruirlo
oggi (Supabase Auth, verifica email, schermata di login dedicata) è
un'infrastruttura nuova, non una correzione, e quel giro di lavoro era
esplicitamente limitato a correzioni. Quello che già esiste e resta
sufficiente per lo scopo — sapere quale studio sta scrivendo per
attivarsi — è il codice licenza sopra: nel muro del piano gratuito
(vedi sotto) il pulsante di ogni piano apre WhatsApp con "Sono
[studio], ID studio [codice], voglio attivare [piano]", e chi gestisce
gli abbonamenti verifica quel codice su Supabase prima di attivare a
mano. Se un domani servirà davvero un account con login proprio, è un
lavoro a parte, consapevole, non un effetto collaterale di aver
rinominato due campi.

Per adesso, l'unica cosa che serve è **non far mai coincidere** nome e
password di sblocco locale con qualunque credenziale usi altrove: sono
in due punti dell'interfaccia apposta separati, con un avviso a schermo
nella schermata "Accesso e credenziali" che lo ricorda.

## Consensi gratuiti e licenza (opzionale, Supabase)

Ogni studio/dispositivo ha diritto a `FREE_CONSENSI_LIMIT` (10 di default,
si cambia in un solo punto in `index.html`) consensi archiviati gratis.
Il conteggio "vero" è **locale** (quanti consensi risultano `archiviato`
su questo dispositivo — vedi `consensiArchiviatiCount()`), perché l'app
deve continuare a firmare consensi anche offline. Se configuri Supabase,
il conteggio viene anche rispecchiato lato server come riscontro più
difficile da aggirare svuotando i dati del browser, e come base per un
vero gate multi-dispositivo per studio.

**Importante**: verso Supabase viaggiano SOLO due UUID opachi (licenza
dello studio e del dispositivo, generati dal client, mai scelti da una
persona) più lo stato abbonamento. **Nessun dato del cliente** (anagrafica,
sanitario, firme, disegni) tocca mai queste tabelle né alcun'altra: quello
resta locale sul dispositivo (IndexedDB), esattamente come per l'archivio
dei consensi (vedi sezione sopra). Queste due tabelle di licenza sono
l'unico punto di contatto fra questa app e un server.

Tutto l'SQL (9 blocchi commentati, eseguibili in ordine dall'inizio alla
fine) sta in **[`supabase-licenza.sql`](./supabase-licenza.sql)**, non
qui nel README: sono ~230 righe di SQL, tenerle inline rendeva il file
illeggibile. Incollalo nell'SQL editor di Supabase (stesso progetto
della sezione sopra, o uno dedicato) e eseguilo — o blocco per blocco se
preferisci controllare ogni passaggio.

In sintesi, cosa crea:

1. Estensione `pgcrypto` per generare UUID lato database.
2. `licenza_studi` — stato abbonamento (`gratuito`/`attivo`/`scaduto`/`sospeso`) e `piano` (`solopro`/`studiopro`/`atelierpro`/`multi-studio`, nullable — legato al numero di tatuatori in Impostazioni → "Artisti", vedi `pianoConsigliato()` in `index.html`).
3. `licenza_dispositivi` — un dispositivo per riga, con il contatore `consensi_firmati` (si somma per studio).
4. RLS a "nega tutto": nessuna query diretta dal client, solo tramite le funzioni sotto.
5. `register_consenso_firmato(...)` — il gate vero: chiamata da `index.html` a ogni archiviazione, incrementa il contatore e blocca oltre i 10 gratuiti se non c'è abbonamento attivo. Accetta anche un `piano` opzionale, già pronto ma non ancora inviato dal client (vedi blocco 9 del file).
6. `get_stato_licenza(...)` — sola lettura, usata da "Verifica su Supabase" e dal muro del limite raggiunto.
7. Query di esempio per attivare/disattivare un abbonamento a mano (o valorizzare il piano) quando uno studio paga.
8. Query di esempio per controllare lo stato di uno studio dal pannello.
9. Nota su come collegare l'invio automatico del piano, quando vorrai.

In `index.html`, `SUPABASE_CONFIG` (url + anonKey) è dedicato solo a
questa licenza: nessun dato del cliente lo attraversa mai, vedi sezione
sopra. Senza Supabase configurato, il gate dei 10 consensi gratuiti
funziona comunque, solo interamente locale: puoi anche sbloccarlo
manualmente per un singolo dispositivo dal pulsante "Segna abbonamento
come attivo" nelle Impostazioni, utile in fase di test o finché non
colleghi un vero sistema di pagamento.

### Due modelli di business, entrambi supportati dal codice così com'è

- **Bring-your-own-Supabase**: ogni studio che compra l'app crea il proprio
  progetto Supabase gratuito e incolla le proprie chiavi. Zero infrastruttura
  da mantenere per te. Coerente con come vendi già i temi InkAnimus.
- **SaaS centralizzato**: un solo progetto Supabase tuo, condiviso da tutti
  gli studi clienti — è già così che sono pensate `licenza_studi`/
  `licenza_dispositivi`: ogni studio è isolato dal proprio `id` (uuid
  opaco generato dal client), non da un `tenant_id` o da un login, e le
  funzioni `security definer` impediscono a un client di leggere o alterare
  lo stato di un altro studio. Più lavoro di manutenzione per te, ma
  consente un modello ad abbonamento gestito da un unico pannello.

## Roadmap ragionevole per le prossime iterazioni

- Multilingua (come il menu QR della pizzeria) per clienti turisti.
- Mappa corpo interattiva al posto dei chip di zona, se serve più precisione.
- Esportazione massiva dell'archivio (per backup o cambio dispositivo).
- Autenticazione staff se più persone dello studio useranno l'app.

## Per venderla agli studi: cosa manca davvero

Il cuore funziona. Per farne un prodotto che uno studio compra e usa senza
pensarci, i pezzi che contano di più (in ordine di impatto):

1. **Multi-dispositivo per lo stesso studio.** Oggi i dati sono per-device
   per scelta (mai un server per i dati cliente, vedi sopra). Uno studio
   con tablet in reception + telefono del tatuatore che vuole vedere gli
   stessi consensi ovunque deve passare da backup/export manuale (punto 2)
   finché non c'è un modo di farlo senza far transitare dati cliente da un
   server: sincronizzazione diretta device-to-device (es. WebRTC/rete
   locale) invece di un bridge verso un database remoto.

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
