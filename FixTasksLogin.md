Riprendiamo un problema urgente su InkConsent, già diagnosticato in
un'altra conversazione, prima di andare avanti con altro.

BUG: quando cancello i dati di navigazione del telefono (o cambio
dispositivo), il device_id locale (identificativo anonimo salvato in
localStorage) viene rigenerato da zero. La licenza dello studio su
Supabase (tabella licenza_studi: stato_abbonamento="attivo",
piano="studiopro", legata al mio UID auth) resta corretta e intatta —
ma la verifica lato app (subscriptionActive()/get_stato_licenza) sembra
controllare lo stato per DEVICE specifico (tabella licenza_dispositivi),
non solo per studio/UID auth. Il nuovo device_id, mai registrato prima
su licenza_dispositivi con licenza attiva, risulta "non attivo" — quindi
l'app mostra "trial" anche se il piano Pro è realmente attivo su
Supabase.

Confermato con screenshot Supabase: licenza_studi ha 1 riga corretta
(piano attivo); licenza_dispositivi ha 4 righe per lo stesso studio_id
(dispositivi diversi nel tempo); licenza_tatuatori ha 3 righe duplicate
(create ogni volta che ho dovuto rifare l'onboarding da zero dopo aver
perso il riconoscimento del device).

SERVE: un modo per RI-REGISTRARE il device_id nuovo sulla licenza dello
studio esistente (es. un flusso "attiva questo dispositivo con il codice
licenza"), invece di richiedere di ricreare tutto da zero. Deve
funzionare bene prima che io giri l'app a un amico per farla testare —
priorità alta.

Guarda il codice reale di subscriptionActive(), get_stato_licenza, e
come device_id viene generato/salvato, per confermare questa diagnosi e
proporre il fix.