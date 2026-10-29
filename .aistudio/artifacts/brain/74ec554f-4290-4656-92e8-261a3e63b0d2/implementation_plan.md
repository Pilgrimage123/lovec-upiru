# Úprava tahové ekonomiky fronty, žluté zobrazení a vyřazení Stagger mechaniky

Na základě požadavků uživatele implementujeme následující herní a vizuální úpravy:

## 1. Tahová ekonomika fronty
- **Umístění destičky do fronty stojí 1 tah**: Každé přidání destičky z inventáře/nabídky do Vencovy fronty spotřebuje hráčův tah a předá tah nepřátelům k reakci (synchronní tahový systém).
- **Příprava na odpálení fronty stojí 1 tah**: Odpálení fronty je rozděleno do dvou fází:
  1. *Fáze 1 (Příprava)*: Hráč stiskne tlačítko „Připravit odpal (1 tah)“ (nebo Mezerník při nepřipravené frontě). Venca napřáhne své kombo (`isQueuePrepared = true`), což spotřebuje tah a nepřátelé provedou svou fázi.
  2. *Fáze 2 (Odpal)*: Jakmile je fronta připravena, tlačítko se změní na „🔥 ODPÁLIT KOMBO!“. Další stisknutí (Mezerník nebo klik) provede sekvenční odpal komba.
  3. Pokud hráč během připravené fronty udělá jinou akci (pohyb, otočení, přidání destičky), příprava se zruší a musí se napřáhnout znovu.

## 2. Vizuální zobrazení destiček ve frontě (žluté a vysoce kontrastní)
- Destičky ve Vencově frontě budou výrazně žluté (`bg-amber-400`/`bg-yellow-400`, syté žluté akcenty `#facc15` / `#fde047`), s tmavým ostrým textem a pevným kontrastním ohraničením.
- Při stavu připravenosti k odpalu (`isQueuePrepared`) navíc sloty dostanou pulzující zlatý lem a záři.

## 3. Kompletní vyřazení mechaniky Stagger
- Odstranit status `stagger` ze souboru `js/config/statuses.js`.
- V `js/engine/board.js` zrušit aplikaci staggeru při nárazu do zdi nebo jiné entity (ponechat poškození z kolize).
- Zrušit efekt staggeru z talismanů (`holy_aspergillum`, `notary_stamp`) v `js/engine/rules.js` a `js/config/talismans.js`.
- Odstranit stagger indikátory a texty z `threatOverlay.js`, `tooltips.js` a testů v `tests/engine.test.js`.
