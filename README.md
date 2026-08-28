# InkConsent

Consenso informato digitale per studi di tatuaggio. File singolo, offline-first,
zero dipendenze runtime pesanti — stessa filosofia di InkAnimus.

Testato end-to-end con browser headless (flusso completo: nuova sessione →
6 step → doppia firma → archiviazione → ricerca in archivio) prima della consegna.

## 🔒 Dove vivono i dati (leggi questo prima di tutto il resto)

Due categorie di dati, **mai mescolate**, con destinazioni diverse:

- **Dati del cliente finale** — anagrafica, questionario sanitario,
  firme, foto di riferimento, consensi, magazzino: restano **sempre e
  solo su questo dispositivo**, cifrati in IndexedDB. Non toccano mai
  Supabase, nessun server, nessun cookie. L'unica eccezione, dichiarata
  esplicitamente, è la tabella `richieste` (i lead da un link pubblico
  di preventivo, quando configurata — vedi "Un'eccezione dichiarata: le
  richieste di preventivo" più sotto): lì arrivano nome/telefono/email
  del cliente, mai foto, mai dati sanitari.
- **Dati di licenza/identità dello studio** — email dell'account
  studio, telefono, nome del titolare, nome dello studio, città, ID
  opachi (studio/dispositivo/tatuatore), stato dell'abbonamento: questi
  SÌ vanno su Supabase (tabelle `licenza_studi`/`licenza_dispositivi`/
  `licenza_tatuatori`), servono solo a riconoscere lo studio per la
  gestione del piano — mai un dato clinico o del cliente finale.

**Nessun cookie.** L'app non ne usa: solo `localStorage`/IndexedDB sul
dispositivo (mai inviati altrove) e chiamate `fetch` dirette alle API
REST di Supabase quando serve la licenza. Nessun tracciamento, nessun
analytics di terze parti.

## Novità dell'ultimo giro (nono giro): rifiniture UI

Giro di sola interfaccia, nessuna modifica a Supabase/logica di
licenza.

- **Menu contestuale: click diretto, non più una tendina.** Toccando
  una delle 4 icone in basso (Consensi/Preventivi/Studio/Account) si
  apre SUBITO la prima schermata di quella sezione (es. Studio →
  Magazzino diretto). Sotto il topbar, una riga di tab orizzontali
  scorrevoli mostra le sotto-voci della sezione corrente, sempre
  visibile — sostituisce la tendina che si apriva/chiudeva (giro
  sesto/settimo). Colore del tab attivo legato agli stessi accenti già
  personalizzabili in Impostazioni (stencil per Consensi/Studio/
  Account, flesh per Preventivi — stesso principio già usato per le
  shell cliente), mai un colore fisso.
- **Agenda: vista mese.** Oltre a giorno/settimana, una griglia
  calendario classica con un pallino/numero per gli appuntamenti di
  ogni giorno; tocco su un giorno apre la vista giorno di quella data.
- **Questionario sanitario: verde per "nessun problema".** Il
  meccanismo di blocco (una risposta positiva ferma il flusso finché
  il tatuatore non conferma) era già corretto e verificato di nuovo in
  questo giro — mancava solo il colore: prima "no" e "non ancora
  risposto" erano quasi lo stesso grigio, difficile capire a colpo
  d'occhio cosa restava da compilare. Ora "no" è verde, "sì" resta
  rosso, "non risposto" resta il violetto neutro di prima.
- **Avviso backup mancante: layout verticale.** Testo sopra, bottone
  "Salva backup di oggi" a piena larghezza sotto, invece di testo a
  sinistra e bottone stretto a destra sulla stessa riga.

Verificato con Chrome headless (stessa configurazione dei giri
precedenti: nessuna estensione Chrome disponibile in questo ambiente,
Puppeteer con Chrome installato in locale) — click diretto sulle 4
sezioni, tab attivo evidenziato, griglia mese e navigazione tra mesi,
colori del questionario sanitario, layout del banner backup: tutto
verificato visivamente, zero errori console.

## Novità dell'ottavo giro: onboarding reale — conferma email vera, dati studio obbligatori, primo tatuatore nato insieme

Tre bug collegati, trovati testando dal vivo su
`inkonsens-studio.pages.dev`:

- **Conferma email: da "mi fido" a verifica vera.** Il vecchio bottone
  "Ho confermato, accedi" si limitava a fidarsi della parola
  dell'utente e lo faceva proseguire alla schermata di accesso — non
  verificava nulla. Ora: dopo il click sul link nella mail, Supabase
  reindirizza con una sessione vera nell'URL (token che emette SOLO
  dopo una conferma reale) — l'app la legge e la verifica
  (`completaSessioneDaRedirect()` in `index.html`), niente
  autocertificazione. Se l'utente prova ad accedere da un altro
  dispositivo prima di aver confermato, è la vera chiamata di login a
  Supabase a rifiutarlo con un errore chiaro, non un controllo nostro.
- **Dati reali dello studio, obbligatori prima di entrare.** La
  schermata "Inizia la prova gratuita" (già esistente) ora chiede anche
  nome dello studio e città, non solo titolare e telefono — sostituendo
  subito i placeholder di `STUDIO_DEFAULTS` invece di lasciare che
  l'utente li scopra per caso aprendo le Impostazioni. P.IVA, ragione
  sociale e indirizzo restano facoltativi, si compilano quando serve in
  Impostazioni → "Consenso e testi legali" (un avviso non bloccante lo
  ricorda, una volta sola, appena entrati).
- **Il titolare nasce come primo tatuatore, nello stesso istante.**
  Prima, creare l'account studio non creava anche il profilo tatuatore
  corrispondente: al primo utilizzo di "Artisti" nelle Impostazioni,
  l'app credeva che fosse un tatuatore nuovo. Ora `avvia_trial()` crea
  atomicamente sia `licenza_studi` sia la prima riga di
  `licenza_tatuatori`, stesso studio_id, stesso momento. Un dispositivo
  NUOVO che fa login su uno studio già esistente recupera questi dati
  da Supabase invece di richiederli di nuovo (`dati_studio()`), cosi'
  non nasce un secondo profilo con un nome diverso per la stessa
  persona. SQL in **[`supabase-onboarding-titolare.sql`](./prompt%20e%20sql/supabase-onboarding-titolare.sql)**,
  il quinto file — da eseguire dopo tutti i precedenti.

**Decisione confermata esplicitamente**: uno studio con un solo
tatuatore (il titolare unico, il caso più comune) resta sul conteggio
dispositivi PER STUDIO già esistente — `licenza_tatuatori` nasce
comunque per l'anagrafica e il tetto del piano, ma non cambia come si
contano i dispositivi in quel caso (è lo stesso numero: un tatuatore,
uno studio).

## Novità del settimo giro: asset riorganizzati, pacchetti icone, bottom bar corretta

Giro di sola UI/asset, nessuna nuova logica di business.

- **Cartelle riorganizzate**: `icons/` (icona app), `assets/body/`
  (sagome anatomiche), `assets/icon-packs/<nome>/` (icone categoria
  magazzino, un pacchetto per sottocartella) — vedi la sezione dedicata
  più sotto, "Pacchetti icone magazzino", per i dettagli e come
  aggiungerne uno nuovo.
- **BUG REALE corretto: la bottom bar mobile non è mai stata visibile.**
  Il giro scorso l'avevo segnata "completata" basandomi solo su
  controlli statici (nessun browser disponibile in quell'ambiente): una
  regola CSS `@media` era scritta PRIMA della dichiarazione base
  `.bottom-bar{display:none}` invece che dopo — a parità di specificità
  vince l'ultima nell'ordine del sorgente, quindi il `display:none`
  base sovrascriveva sempre quella dei media query, su qualunque
  schermo. Trovato leggendo il CSS riga per riga, corretto, e
  **verificato stavolta con un browser reale** (Chrome headless via
  Puppeteer, non l'estensione Chrome-in-Claude — non disponibile in
  questo ambiente): bottom bar a 4 sezioni visibile sotto gli 860px,
  nascosta sopra, tendina contestuale che si apre con le sotto-voci
  corrette per ognuna delle 4 sezioni, nessun errore in console.
- **Icone anche nei titoli delle sezioni Impostazioni**: usano lo
  stesso set SVG già in uso in tutta l'app (rail, bottom bar, pulsanti)
  — non i pacchetti magazzino, che restano un concetto diverso (foto
  swappabili di prodotti reali, non simboli di navigazione). Vedi nota
  nella sezione dedicata sotto se preferivi altrimenti.

## Fix urgente (sesto giro): due sistemi di licenza scollegati

Bug architetturale reale su Supabase, trovato testando l'attivazione
manuale: `register_consenso_firmato`/`get_stato_licenza` (le funzioni
più vecchie, da prima che esistesse un vero account Supabase Auth) si
fidavano di uno `studio_id` passato dal client, mai legato all'utente
Auth vero (`auth.uid()`) usato invece da `avvia_trial` e dalle funzioni
più recenti — due sistemi paralleli sulla stessa tabella `licenza_studi`,
per questo il trial non risultava mai attivo e l'attivazione manuale
via SQL non trovava la riga giusta.

**Fix**: `auth.uid()` è ora l'unica fonte di verità per lo studio_id.
`licenza_studi.id` ha un vincolo (foreign key) vero verso `auth.users`:
non è più possibile creare una riga con un UUID inventato dal client.
Le due funzioni vecchie sono state riscritte per usare `auth.uid()`
esattamente come le altre, e richiedono ora una sessione autenticata
(non più l'anon key). **Conseguenza**: uno studio senza account Supabase
funziona come uno studio senza Supabase configurato — gate solo
locale, nessuna sync, mai un blocco per questo (offline-first
invariato). SQL in
**[`supabase-consolidamento-licenza.sql`](./prompt%20e%20sql/supabase-consolidamento-licenza.sql)**,
da eseguire dopo gli altri tre file — contiene anche, commentata di
default, la pulizia dei dati di test.

## Novità del quinto giro

Giro ampio: correzioni a bug reali del giro precedente (attivazione
prova gratuita, conteggio consensi gratuiti) più diverse funzionalità
nuove esplicitamente richieste — non solo un restyling.

- **Profili tatuatore locali** (Impostazioni → "Sicurezza e accesso"):
  se lo studio ha più di un tatuatore in "Artisti", ognuno ha ora un
  proprio username+password per il dispositivo condiviso (schermata
  "Chi sta lavorando ora?" dopo lo sblocco del dispositivo) — usati per
  attribuire consensi/preventivi/appuntamenti al tatuatore giusto e per
  contare **2 dispositivi per tatuatore** invece che 2 per l'intero
  studio. Username e password restano sempre e solo locali (stesso
  hash+salt dello sblocco dispositivo): su Supabase va solo un ID
  opaco, mai nome o credenziali. Con un solo tatuatore, tutto questo
  resta invisibile — nessuna schermata in più.
- **Prova gratuita avviata esplicitamente**: al primo accesso
  all'account studio, un passaggio dedicato chiede telefono e nome del
  titolare e SOLO allora crea la riga su Supabase — prima nasceva in
  automatico al primo consenso o al primo controllo abbonamento, il che
  significava che l'attivazione manuale via SQL falliva se il titolare
  scriveva per attivarsi prima di quel momento (bug reale, corretto).
- **Muro del piano gratuito sempre raggiungibile** (Impostazioni →
  "Licenza e piano" → "Vedi i piani"), non solo quando il limite
  blocca l'archiviazione. AtelierPro ora ha un tetto di 5 tatuatori
  (il prezzo copre virtualmente un sesto, comunicato come vantaggio);
  oltre i 5, o multi-sede, un quarto pulsante "Multi-studio / catena"
  apre WhatsApp con un messaggio dedicato — nessuna autoattivazione in
  nessuno dei due casi.
- **Conteggio dei 10 consensi gratuiti aggregato per studio**: prima il
  gate guardava solo il conteggio locale del dispositivo, quindi uno
  studio con più device poteva superare la soglia usandone 10 su
  ognuno. Ora il client tiene anche una cache dell'ultimo conteggio
  aggregato visto da Supabase e usa il più alto dei due. Un piano a
  pagamento attivo continua a non bloccare mai, qualunque sia il
  conteggio.
- **Export/import solo consensi**: diverso dal backup completo, sposta
  SOLO l'archivio consensi (tutti o dei mesi scelti) tra i dispositivi
  consentiti — l'import è additivo, dedup per id, non sovrascrive nulla.
- **Sezione Preventivi riorganizzata**: il link pubblico "Richiedi
  preventivo" e il suo stato notifica si sono spostati lì dalle
  Impostazioni; nuovo pulsante "Nuovo preventivo" per compilarlo tu in
  studio mentre parli col cliente (stesso modulo del form pubblico); il
  form pubblico ora chiede anche "con chi vorresti parlare" se lo
  studio ha più di un tatuatore.
- **Richieste preventivo anche via Supabase**: fin qui restavano solo
  sul dispositivo del cliente più una notifica ntfy troncata — vedi la
  nuova eccezione documentata sotto "Due livelli di credenziali". Lo
  studio controlla le nuove richieste con un polling ogni 20 secondi
  (non il Realtime vero di Supabase, che richiederebbe supabase-js o un
  client WebSocket scritto a mano — vedi il file SQL) e un avviso
  compare in app appena arrivano.
- **Contabilità riscritta**: non più una percentuale fissa sulla sola
  caparra. Per ogni tatuatore, percentuale sul TOTALE del lavoro
  (caparra + saldo) oppure quota fissa mensile, a scelta — confermato
  quando l'appuntamento in agenda viene chiuso (nuova card "Chiusura
  lavoro" in ogni appuntamento). Per chi lavora come SoloPro ospite in
  uno studio non suo, un campo percentuale da versare al titolare
  ospitante.
- **Footer motore dinamico**: "Engine vX" letto da `manifest.json`
  invece di un testo fisso da aggiornare a mano ogni giro.
- **Doppio menu**: bottom bar a 4 sezioni (Consensi/Preventivi/Studio/
  Account) che apre una tendina contestuale con le sotto-voci di ogni
  sezione; il menu laterale a tre righe resta come scorciatoia globale,
  invariato.

Nessun test dal vivo in browser in questo giro (l'estensione Chrome non
era connessa in questo ambiente): verifica solo statica.

## Correzioni del quarto giro

Giro dedicato a correggere bug reali trovati testando l'app live su
`inkonsens-studio.pages.dev`, più due funzionalità esplicitamente
richieste (account studio, limite dispositivi) e una riorganizzazione
della navigazione — non un restyling.

- **Rimosso del tutto il vecchio gate "Premium a password"**: era un
  bug in produzione, non solo codice morto — bloccava l'accesso su
  ogni dispositivo nuovo perché restava "in parallelo" al nuovo muro
  del piano gratuito invece di essere sostituito. Tolti `renderPremiumGate`,
  `PREMIUM_MASTER_HASH`, `PREMIUM_KEY`, `PREMIUM_VIEWS`,
  `premiumUnlocked`/`setPremiumUnlocked`/`checkMasterPassword`/
  `isPremiumView`, i relativi `data-action`, il campo in Impostazioni e
  il CSS non condiviso con il muro del piano gratuito (`.premium-features`,
  `.pf`, `.premium-cta`, `.premium-unlock`) — verificato che nessun
  percorso dell'app possa ancora arrivarci. Resta solo `renderPaywall`,
  basato sul conteggio consensi reale.
- **Account studio email+password vero** (Supabase Auth, via `fetch`
  diretto alle API GoTrue — niente SDK, coerente con il resto dell'app):
  al primo avvio, se Supabase è configurato e il dispositivo non ha
  ancora un'identità di licenza, appare `renderStudioAccountSetup()`
  invece del vecchio percorso silenzioso a UUID anonimo. Vedi
  "Due livelli di credenziali" più sotto (ora un terzo livello, tenuto
  volutamente separato dagli altri due) e il nuovo file
  `supabase-auth-dispositivi.sql`.
- **Limite di 2 dispositivi per studio**: riusa `licenza_dispositivi`
  (già esistente per il conteggio consensi) per contare anche i device
  attivi per uno studio autenticato; un terzo dispositivo mostra un
  messaggio chiaro (`renderDeviceLimitBlock`) invece di sbloccarsi in
  silenzio. Backup/ripristino (già in app) resta il modo per spostare i
  dati tra i 2 dispositivi consentiti — nessuna sync automatica aggiunta.
- **Bottom bar mobile aggiunta** (in più, non al posto del menu
  laterale), con le stesse voci principali e icone, pattern coerente
  con InkAnimus/VolleyTeam Manager.
- **"Richiesta preventivo" tornata voce di primo livello**: la causa
  reale per cui sembrava "sepolta nelle Impostazioni" era
  `FEATURES.richieste: false`, che nascondeva l'intera sezione di menu
  — corretto alla radice (`true`), non solo spostata.
- **Impostazioni riorganizzate in blocchi a fisarmonica** (accordion,
  più sezioni apribili insieme): stesso contenuto di prima, stesso
  ordine delle card esistenti, solo raggruppato in 7 blocchi tematici
  invece di un'unica lista lunga.
- **Testo ddl melanoma riscritto**: non più "aggiornalo tu quando esce
  il decreto", ma corretto — finché non è operativo l'app usa i moduli
  per regione già implementati, quando lo sarà è un aggiornamento
  dell'app (non dello studio) a passare al consenso unico nazionale; i
  consensi già firmati restano storicizzati con la versione regionale
  con cui sono stati firmati (`informativaVersion`, logica invariata).
- **Verificati due residui del terzo giro, entrambi già a posto**: il
  campo "URL pubblico dell'app" non è tornato nelle Impostazioni (URL e
  config Supabase restano valori fissi da deploy); i due avvisi
  testuali email/password (account studio vs sblocco locale) erano già
  presenti nella schermata di onboarding.

Nessun test dal vivo in browser in questo giro (l'estensione Chrome non
era connessa in questo ambiente): verifica solo statica — sintassi JS
(`new Function` sull'intero script estratto), bilanciamento parentesi
CSS, e controlli incrociati `var(--x)`↔`--x:`, `data-action`↔handler,
`icon("x")`↔`ICON_PATHS`. Da testare dal vivo su
`inkonsens-studio.pages.dev` prima di considerarlo definitivo.

## Correzioni del terzo giro (non nuove funzionalità)

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

## Novità del secondo giro (fix + migliorie)

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
  `licenza_studi` in [`supabase-licenza.sql`](./prompt%20e%20sql/supabase-licenza.sql)
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

`icons/icon-192.png` e `icons/icon-512.png` sono l'icona dell'app
(macchinetta-penna) — da quando la struttura è stata riorganizzata
(vedi sotto), vivono in una sottocartella, non più nella root insieme a
`index.html`. Il `manifest.json` e i tag `apple-touch-icon` le usano
per l'installazione su iOS/Android. Per uno studio diverso, basta
sostituire questi due PNG mantenendo stessi nomi e stessa cartella.

## Struttura cartelle asset

Riorganizzata per tenere insieme cose diverse (icona app, sagome,
icone categoria magazzino), che prima stavano tutte alla rinfusa nella
root accanto a `index.html`:

```
icons/                          icona dell'app (manifest, apple-touch-icon)
  icon-192.png
  icon-512.png
assets/
  body/                          sagome anatomiche (mappa zone, sempre PNG)
    body-man_front.png
    body-man_back.png
    body-girl_front.png
    body-girl_back.png
  icon-packs/                    icone categoria magazzino, a pacchetti
    manifest.json                elenco dei pacchetti disponibili
    default/                     pacchetto PNG (i file originali)
      cat-guanti.png  cat-pellicole.png  cat-disinfettante.png  ...
    studio-svg/                  pacchetto SVG curato, generato in questo giro
      cat-guanti.svg  cat-pellicole.svg  cat-disinfettante.svg  ...
```

Se sposti `index.html`/`sw.js`/`manifest.json` altrove, questa struttura
deve seguirli mantenendo gli stessi percorsi relativi — sono referenziati
così ovunque nel codice (`bodyImg()`, `catIconUrl()`, `sw.js` PRECACHE,
i `<link>` nell'head).

### Pacchetti icone magazzino

Le icone delle 11 categorie del magazzino (guanti, disinfettanti,
cartucce, ecc. — vedi `CATEGORIE_FORNITURE` in `index.html`) vengono da
un **pacchetto** scelto in Impostazioni → "Studio e branding" → "Icone
magazzino", non da un percorso fisso scritto nel codice.

**Aggiungere un pacchetto nuovo — zero modifiche al codice:**

1. Crea `assets/icon-packs/<nome-pacchetto>/`.
2. Mettici le 11 icone con **esattamente questi nomi** (estensione `.png`
   o `.svg`, puoi anche mischiare i due nella stessa cartella — il
   codice tenta prima l'estensione dichiarata nel manifest, poi
   l'altra): `cat-guanti`, `cat-pellicole`, `cat-disinfettante`,
   `cat-greensoap`, `cat-carta`, `cat-cartastesa`, `cat-rasoi`,
   `cat-inkcaps`, `cat-cartucce`, `cat-stencil`, `cat-macchinette`.
3. Aggiungi una riga a `assets/icon-packs/manifest.json`:
   ```json
   { "name": "<nome-pacchetto>", "format": "png" }
   ```
   (`format` è facoltativo — indica solo quale estensione provare per
   prima; senza indicazione parte da `.png`.)
4. Aggiungi i nuovi file anche al `PRECACHE` di `sw.js` (altrimenti
   funzionano solo online) e bump la versione `CACHE`.

Due pacchetti già pronti: **`default`** (i PNG originali — sostituiscili
con le tue foto vere mantenendo gli stessi nomi file, quando vuoi) e
**`studio-svg`** (icone SVG disegnate per questo giro, stile a linee
coerente — placeholder curato, non foto reali di prodotto).

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

## Livelli di credenziali, mai mescolati

Nell'app esistono **sistemi di credenziali completamente separati**,
per scopi diversi. Vale la pena scriverlo qui in modo esplicito perché
i nomi nell'interfaccia potevano sembrare la stessa cosa:

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

**Aggiornamento (giro successivo a questa nota)**: da questo giro esiste
anche un vero **account studio email+password** via Supabase Auth (primo
avvio → `renderStudioAccountSetup()` in `index.html`, se Supabase è
configurato), usato **solo** per riconoscere lo stesso studio su più
dispositivi e applicare il limite di 2 dispositivi per studio (vedi
sotto) — non per il conteggio consensi in sé, che resta come descritto
sopra. Resta comunque **un terzo livello di credenziali**, separato dai
due precedenti: la password dell'account studio serve solo a Supabase
(gestione abbonamento/dispositivi), non apre mai l'app sul dispositivo
(quello resta *sempre* il nome di accesso locale al punto 1) e non deve
mai coincidere con esso — la schermata di creazione account lo ricorda
a video, così come la schermata di sblocco locale ricorda di non
riusare la password dell'account studio (vedi Task 8, entrambi gli
avvisi sono solo testuali, nessun controllo automatico che le confronti).
Per gli studi che non configurano Supabase, o che non completano la
creazione dell'account, resta valido il percorso legacy descritto sopra
(UUID anonimo generato dal dispositivo, nessun login) — `licenseIds()`
usa l'account autenticato quando c'è, altrimenti ricade su quello.

Per adesso, l'unica cosa che serve è **non far mai coincidere** nome e
password di sblocco locale con qualunque credenziale usi altrove (né
con quella dell'account studio, né con altro): sono in punti
dell'interfaccia apposta separati, con avvisi a schermo che lo
ricordano.

**Aggiornamento (quinto giro): profilo tatuatore, un quarto livello.**
Se lo studio dichiara più di un tatuatore in Impostazioni → "Artisti",
ogni tatuatore ha un proprio username+password locale (schermata "Chi
sta lavorando ora?" dopo lo sblocco del dispositivo, vedi
`renderTatuatoreSwitch()` in `index.html`) — stesso principio del punto
1 (hash+salt, mai su Supabase), ma un profilo per persona invece che
uno per dispositivo. Serve ad attribuire consensi/preventivi/
appuntamenti al tatuatore giusto e a contare 2 dispositivi PER
TATUATORE (non più 2 per l'intero studio). Su Supabase va solo un ID
opaco per tatuatore (`licenza_tatuatori`), collegato allo studio_id,
mai un nome o una credenziale. Con un solo tatuatore dichiarato, questo
intero livello resta invisibile — nessuna schermata di scelta.

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
fine) sta in **[`supabase-licenza.sql`](./prompt%20e%20sql/supabase-licenza.sql)**, non
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

**Account studio + limite dispositivi**: un secondo file, **[`supabase-auth-dispositivi.sql`](./prompt%20e%20sql/supabase-auth-dispositivi.sql)**,
tenuto apposta separato da `supabase-licenza.sql` (non lo sostituisce,
non lo tocca) aggiunge l'account studio email+password vero (Supabase
Auth) e il limite di **massimo 2 dispositivi per studio in
contemporanea** (riusa `licenza_dispositivi`, la stessa tabella del
conteggio consensi, per contare anche i device attivi). Vai eseguito
*dopo* `supabase-licenza.sql`, almeno una volta. Senza questo secondo
file, o senza Supabase configurato, l'app resta comunque utilizzabile:
niente account, niente limite dispositivi, solo il percorso legacy a
UUID anonimo per la licenza.

**Prova gratuita esplicita, profili tatuatore, richieste preventivo**:
un terzo file, **[`supabase-tatuatori-trial-richieste.sql`](./prompt%20e%20sql/supabase-tatuatori-trial-richieste.sql)**,
sempre separato e sempre da eseguire dopo gli altri due, aggiunge: la
funzione che crea la riga di licenza SOLO quando il titolare avvia
esplicitamente la prova gratuita (vedi "Novità dell'ultimo giro" in
cima); la tabella `licenza_tatuatori` (solo un ID opaco per tatuatore,
mai nome/credenziali) e il limite di 2 dispositivi per tatuatore; e la
tabella `richieste` — vedi il paragrafo dedicato qui sotto, è un'
eccezione al principio generale di questo file.

### Un'eccezione dichiarata: le richieste di preventivo

Ovunque in questo documento vale "nessun dato del cliente tocca mai
Supabase" — tranne qui. Una richiesta di preventivo arriva da un
cliente **remoto**, che potrebbe non venire mai in studio di persona:
senza un canale di rete non c'è modo che lo studio la riceva prima che
il cliente si presenti. Per questo, se configuri Supabase, il form
pubblico invia anche lì (oltre a salvarla in locale sul telefono del
cliente) nome/cognome, telefono, email, stile e descrizione del
tatuaggio richiesto — **mai foto di riferimento**, quelle restano solo
sul dispositivo del cliente. La tabella `richieste` è leggibile
**solo** dallo studio proprietario autenticato (RLS su `auth.uid()`),
mai da altri studi né in forma anonima. Se preferisci restare
interamente locali anche per questo, non eseguire il blocco 6 del file
sopra: l'app continua a funzionare, la richiesta resta solo sul
telefono del cliente più la notifica ntfy (se configurata) — nessun
avviso in tempo reale in app in quel caso.

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
