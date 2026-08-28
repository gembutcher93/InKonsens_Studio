/* InkConsent — service worker v12
   Cambiato rispetto alla v11:
   • jspdf e qrcodejs ora sono file locali e vanno in cache: senza,
     in un seminterrato senza campo il PDF e il QR non partono.
   • precache completo di sagome e icone categoria.
   • navigate: network-first con fallback all'index in cache, così
     un aggiornamento arriva subito ma offline l'app si apre lo stesso.
   v24: consensi.json aggiornato (ingestione dati regionali da
   tabella-comparativa-requisiti-regionali.xlsx) — versione bump solo
   per far scaricare ai device già installati il nuovo consensi.json,
   che qui è in precache "cache-first" e altrimenti resterebbe quello vecchio.
   v25: rimossa la sync consensi su Supabase, aggiunti piani/trial,
   restyling dark-mode nativo, statistiche, tracciabilità lotti,
   aftercare con barra di guarigione, sigillo QR sul PDF — index.html
   e' cambiato parecchio, bump per far arrivare tutto ai device già
   installati.
   v26: agenda appuntamenti, promemoria WhatsApp, waitlist disdette,
   contabilità (caparre/movimenti/chiusura periodica), guest artist —
   moduli nuovi, tutti locali. Bump per lo stesso motivo di sempre.
   v27: restyling strutturale vero (non solo colori), muro del piano
   gratuito propositivo con i 3 piani, tolto il toggle di test
   abbonamento, URL pubblica/Supabase bloccate (non più in Settings),
   via ogni riferimento a "Podere 173" dai default, due livelli di
   credenziali chiariti nel README. manifest.json e theme-color
   aggiornati al nuovo tema scuro.
   v28: rimosso del tutto il vecchio gate "Premium a password" (bloccava
   l'accesso a tutti i dispositivi nuovi, bug reale trovato testando su
   inkonsens-studio.pages.dev); account studio vero email+password via
   Supabase Auth con limite di 2 dispositivi; bottom bar mobile;
   "Richieste preventivo" tornata voce di menu di primo livello;
   Impostazioni riorganizzate in blocchi a fisarmonica; testo ddl
   melanoma riscritto.
   v29: profili tatuatore locali (username+password solo sul dispositivo,
   solo un ID opaco su Supabase) con limite 2 dispositivi PER TATUATORE;
   prova gratuita avviata esplicitamente (telefono+titolare) invece di
   nascere in automatico — corregge il bug per cui l'attivazione manuale
   via SQL non trovava nessuna licenza da aggiornare; muro del piano
   sempre raggiungibile da Impostazioni, tetto AtelierPro a 5 tatuatori
   + pulsante Multi-studio/catena; conteggio dei 10 consensi gratuiti
   ora aggregato per studio (non più solo locale) e sempre bypassato da
   un piano attivo; export/import solo consensi (additivo, dedup per
   id); sezione Preventivi riorganizzata (link pubblico + "Nuovo
   preventivo" compilato in studio, scelta del tatuatore nel form
   pubblico); richieste preventivo ora arrivano anche via Supabase
   (tabella dedicata, unica eccezione al "zero dati cliente" — vedi
   README) con polling ogni 20s e avviso in app; contabilità riscritta
   (percentuale sul totale caparra+saldo o quota fissa mensile, per
   tatuatore, confermata alla chiusura dell'appuntamento); footer
   "Engine vX" letto da manifest.json invece di un testo fisso; doppio
   menu bottom bar (4 sezioni) + tendina contestuale per le sotto-voci.
   v30: FIX ARCHITETTURALE — register_consenso_firmato/get_stato_licenza
   si fidavano di un studio_id passato dal client, scollegato dal vero
   utente Supabase Auth (auth.uid()) usato da avvia_trial e dalle
   funzioni più recenti: due sistemi di licenza paralleli sulla stessa
   tabella, per questo il trial non risultava mai attivo e l'attivazione
   manuale via SQL non trovava la riga giusta. Ora auth.uid() è l'unica
   fonte di verità (licenza_studi.id ha un vincolo FK vero verso
   auth.users), le due funzioni richiedono una sessione autenticata
   invece dell'anon key — vedi supabase-consolidamento-licenza.sql.
   v31: riorganizzazione cartelle asset (icons/, assets/body/,
   assets/icon-packs/<nome>/) + sistema a pacchetti per le icone
   categoria magazzino, selezionabile in Impostazioni, estendibile
   aggiungendo una cartella + una riga in assets/icon-packs/manifest.json
   (zero codice) — due pacchetti di partenza, "default" (PNG, i file di
   sempre) e "studio-svg" (SVG, nuovo); FIX VERO della bottom bar
   mobile: un bug di ordine nel CSS (una regola @media veniva scritta
   PRIMA della dichiarazione base invece che dopo, quindi la base
   vinceva sempre) la teneva nascosta su ogni schermo da quando è stata
   introdotta — segnata "completata" nei giri scorsi ma mai visibile
   davvero, ora corretta; icone anche nei titoli delle sezioni
   Impostazioni.
   v32: onboarding reale — conferma email verificata davvero (token dal
   redirect Supabase, non più un bottone che si fida), nome
   studio/città obbligatori insieme al titolare nella stessa schermata
   "Inizia la prova gratuita", primo profilo tatuatore creato
   atomicamente con l'account studio (avvia_trial ora crea anche
   licenza_tatuatori), dispositivo nuovo su studio esistente recupera i
   dati invece di richiederli di nuovo.
   v33: rifiniture UI — menu contestuale: click diretto sulla sezione
   invece di una tendina da aprire, riga di tab sempre visibile sotto
   il topbar (colore legato agli accenti già personalizzabili, non
   fisso); agenda: vista mese (griglia calendario, tocco su un giorno
   apre la vista giorno di quella data); questionario sanitario: sfondo
   verde per "nessun problema", non più grigio neutro indistinguibile
   da "non risposto"; avviso backup mancante in layout verticale
   (testo sopra, bottone a piena larghezza sotto) invece di testo-
   sinistra/bottone-destra sulla stessa riga.

   Nota: i dati (consensi, magazzino) NON passano da qui. Stanno in
   IndexedDB sul dispositivo e il service worker non li tocca mai.   */

const CACHE = "inkconsent-v33";

const PRECACHE = [
  "./",
  "index.html",
  "manifest.json",
  "consensi.json",

  /* librerie — prima erano su cdnjs, ora locali */
  "jspdf.umd.min.js",
  "qrcode.min.js",

  /* sagome anatomiche */
  "assets/body/body-man_front.png",
  "assets/body/body-man_back.png",
  "assets/body/body-girl_front.png",
  "assets/body/body-girl_back.png",

  /* icone app */
  "icons/icon-192.png",
  "icons/icon-512.png",

  /* pacchetti icone magazzino (prompt8ui): elenco pacchetti + le icone
     di ognuno. Se aggiungi un pacchetto nuovo, aggiungi qui le sue
     icone — il manifest lo trova da solo, ma il precache resta
     esplicito (niente scoperta dinamica delle cartelle da un service
     worker, non è possibile con le API cache di base). */
  "assets/icon-packs/manifest.json",
  "assets/icon-packs/default/cat-carta.png",
  "assets/icon-packs/default/cat-cartastesa.png",
  "assets/icon-packs/default/cat-cartucce.png",
  "assets/icon-packs/default/cat-disinfettante.png",
  "assets/icon-packs/default/cat-greensoap.png",
  "assets/icon-packs/default/cat-guanti.png",
  "assets/icon-packs/default/cat-inkcaps.png",
  "assets/icon-packs/default/cat-macchinette.png",
  "assets/icon-packs/default/cat-pellicole.png",
  "assets/icon-packs/default/cat-rasoi.png",
  "assets/icon-packs/default/cat-stencil.png",
  "assets/icon-packs/studio-svg/cat-carta.svg",
  "assets/icon-packs/studio-svg/cat-cartastesa.svg",
  "assets/icon-packs/studio-svg/cat-cartucce.svg",
  "assets/icon-packs/studio-svg/cat-disinfettante.svg",
  "assets/icon-packs/studio-svg/cat-greensoap.svg",
  "assets/icon-packs/studio-svg/cat-guanti.svg",
  "assets/icon-packs/studio-svg/cat-inkcaps.svg",
  "assets/icon-packs/studio-svg/cat-macchinette.svg",
  "assets/icon-packs/studio-svg/cat-pellicole.svg",
  "assets/icon-packs/studio-svg/cat-rasoi.svg",
  "assets/icon-packs/studio-svg/cat-stencil.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    /* uno alla volta: se manca un file, non deve far fallire tutto
       il precache come farebbe addAll() */
    await Promise.all(PRECACHE.map(async (url) => {
      try { await cache.add(new Request(url, { cache: "reload" })); }
      catch (e) { console.warn("[sw] non messo in cache:", url); }
    }));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  /* i font di Google restano online: se non ci sono, l'app usa i
     font di sistema e funziona comunque */
  if (url.origin !== self.location.origin) return;

  /* navigazione: prima la rete (così gli aggiornamenti arrivano),
     se non c'è si apre la copia in cache */
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put("index.html", fresh.clone());
        return fresh;
      } catch (e) {
        const cache = await caches.open(CACHE);
        return (await cache.match("index.html")) || (await cache.match("./")) || Response.error();
      }
    })());
    return;
  }

  /* tutto il resto: prima la cache, poi la rete (e ci si tiene la copia) */
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const fresh = await fetch(req);
      if (fresh && fresh.status === 200) cache.put(req, fresh.clone());
      return fresh;
    } catch (e) {
      return Response.error();
    }
  })());
});
