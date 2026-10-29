# 🧄 LOVEC UPÍRŮ: Venca Česnekáč & Hradní Byrokracie

1D tahová taktická roguelite hra s deterministickým deckbuildingem (mechanicky inspirovaná *Shogun Showdown*) ve výtvarném stylu groteskní perokresby **Jiřího Wintera Neprakty**. Postaveno v čistém **HTML5 + CSS3 + Vanilla JavaScript (ES moduly)** bez externích runtime knihoven.

---

## 1. Spuštění hry a testů

### A) Lokální HTTP server (bez build kroku)
V kořenové složce projektu spusťte libovolný statický server:

```bash
# Python 3
python3 -m http.server 8000

# Nebo Node npx serve
npx serve .
```
Poté otevřete v prohlížeči `http://localhost:8000`.

### B) Spuštění unit testů enginu (Node.js bez frameworku)
Herní engine (`js/engine/`) je 100% oddělený od DOMu a běží přímo v Node.js pomocí vestavěného `node:assert`:

```bash
node tests/engine.test.js
```

---

## 2. Ovládání

| Klávesa / Myš | Akce | Cena v tazích |
| :--- | :--- | :--- |
| **`A` / `⬅`** | Krok vlevo o 1 pole (nebo **Swap/Leapfrog** přes entitu, je-li pole za ní volné) | **1 tah** |
| **`D` / `➡`** | Krok vpravo o 1 pole (nebo **Swap/Leapfrog** přes entitu, je-li pole za ní volné) | **1 tah** |
| **`W` / `⬆`** | Otočení čelem vzad (`◀` / `▶`). V **Česnekovém oblaku** je otočení **ZDARMA**! | **1 tah** (0 v česneku) |
| **`S` / `⬇`** | Čekání na místě (zkrátí cooldowny destiček) | **1 tah** |
| **`1` – `9` / Klik** | Vložení destičky do Fronty akcí (max. 3 sloty, s Vlhkým šátkem 4) | **1 tah** (0 pro *Rychlovku*) |
| **Klik na slot fronty / `Backspace`** | Vyjmutí destičky z fronty zpět do ruky | **0 tahů (zdarma)** |
| **`Space` (Mezerník)** | **PROVÉST KOMBO!** Odpálí všechny destičky ve frontě zleva doprava | **1 tah** za celou frontu |
| **`F1`** | Otevře manuál pravidel | — |

---

## 3. Jak přidat novou destičku, nepřítele nebo asset

1. **Nová destička hráče:** Přidejte záznam do `js/config/tiles.js` do objektu `HERO_TILES` (včetně `pattern`, `openerBonus`, `finisherBonus`, `resonance` a pole `upgrades`). Není nutný žádný zásah do enginu!
2. **Nový nepřítel nebo boss:** Přidejte akce do `ENEMY_TILES` a definici postavy do `ENEMIES` v `js/config/enemies.js`.
3. **Nový obrázek (PNG):** Uložte průhledný PNG soubor do `assets/...` a zaregistrujte klíč v `assets/manifest.json`. Pokud PNG soubor chybí, `js/ui/assets.js` automaticky vykreslí stylový Neprakta SVG placeholder a vypíše seznam chybějících souborů do konzole.

---

## 4. ASSET CHECKLIST & Generování grafiky (Styl Jiří Winter Neprakta)

### Sjednocující stylový prefix pro generátor obrázků (Prompt Prefix)
Při generování všech postav, ikon a terénu použijte tento jednotný prefix:

> **STYLE PREFIX:**
> *"Grotesque humorous Czech comic illustration in the style of Jiří Winter Neprakta, thick dark ink outlines, cross-hatching in shadows, bulbous red noses, bulging expressive eyes, vampire fangs, muted watercolor washes (brick red, dark purple, garlic yellow, pond green), isolated on transparent background, full body side-profile facing RIGHT, bottom-center pivot, PG-13 comedic castle bureaucracy vibe."*

### Tabulka všech potřebných PNG assetů (`assets/manifest.json`)

| Klíč v manifestu | Cesta k souboru | Rozměr | Stav | Popis / Prompt subjektu |
| :--- | :--- | :--- | :--- | :--- |
| `hero.idle` | `assets/characters/venca_idle.png` | 512×512 | ✅ Přiloženo | Venca Česnekáč: mrzutý starý lovec, bílý knír, kulaté brýle, červený nos, olivový klobouk, zelený kabát, Bible s křížem, česnek u pasu, krucifix a kolík s lucernou |
| `hero.attack` | `assets/characters/venca_attack.png` | 512×512 | Fallback SVG | Venca v bojovém výpadu s napřaženým dubovým kolíkem a svítícím krucifixem |
| `hero.hurt` | `assets/characters/venca_hurt.png` | 512×512 | Fallback SVG | Venca ucukávající po zásahu, nadzvednutý klobouk |
| `hero.dead` | `assets/characters/venca_dead.png` | 512×512 | Fallback SVG | Poražený Venca sedící na zemi s boulí na hlavě |
| `enemy.praktikant` | `assets/enemies/praktikant.png` | 512×512 | Fallback SVG | Upír-praktikant Ignác: hubený vykulený upír v příliš velkém plášti s cedulkou „Zácvik“ |
| `enemy.urednik` | `assets/enemies/urednik.png` | 512×512 | Fallback SVG | Krvavý berní úředník: upír s klotovými rukávy, cvikrem, lejstrama a obřím úředním razítkem |
| `enemy.drab` | `assets/enemies/drab.png` | 512×512 | ✅ Přiloženo | Krvavá drábová Božena se sekáčkem a zástěrou |
| `enemy.vratny_stit` | `assets/enemies/vratny_stit.png` | 512×512 | Fallback SVG | Vrátný se štítem: bručounský upír v uniformě vrátného držící těžké dubové dveře jako štít |
| `enemy.netopyr` | `assets/enemies/netopyr.png` | 512×512 | Fallback SVG | Netopýr-kurýr: baculatý netopýr s pošťáckou brašnou a doporučeným dopisem v zubech |
| `enemy.ucetni_buffer` | `assets/enemies/ucetni_buffer.png` | 512×512 | ✅ Přiloženo | Upíří účetní Květuše s holí s lebkou a lahvičkami krve |
| `boss.arcikniaze_sosak` | `assets/bosses/arcikniaze_sosak.png` | 512×512 | Fallback SVG | Arcikníže von Sosák: napudrovaný aristokratický upír v zrcadlovém plášti s kordem |
| `boss.hrabenka_dagmar` | `assets/bosses/hrabenka_dagmar.png` | 512×512 | ✅ Přiloženo | Hraběnka Dagmar v černo-rudých krajkových šatech s růžemi a holí s netopýrem |
| `boss.drakula_generalni_reditel` | `assets/bosses/drakula_generalni_reditel.png` | 512×512 | Fallback SVG | Drákula, generální ředitel Krvavé a.s., v pruhovaném obleku, cylindru a s aktovkou plnou směnek |
| `tile.oak_stake` | `assets/tiles/oak_stake.png` | 256×256 | Fallback SVG | Ikona ořezaného dubového kolíku s kapkou česneku |
| `tile.garlic_belch` | `assets/tiles/garlic_belch.png` | 256×256 | Fallback SVG | Ikona zeleného česnekového oblaku a paličky česneku |
| `tile.holy_syringe` | `assets/tiles/holy_syringe.png` | 256×256 | Fallback SVG | Ikona mosazné hasičské stříkačky stříkající svěcenou vodu |
| `tile.belly_vault` | `assets/tiles/belly_vault.png` | 256×256 | Fallback SVG | Ikona akrobatického přemetu přes hospodský pupík |
| `tile.rosary_slap` | `assets/tiles/rosary_slap.png` | 256×256 | Fallback SVG | Ikona dřevěného růžence v prudkém švihu |
| `tile.funeral_hook` | `assets/tiles/funeral_hook.png` | 256×256 | Fallback SVG | Ikona kovaného pohřebního háku na laně |
| `tile.manhole_shield` | `assets/tiles/manhole_shield.png` | 256×256 | Fallback SVG | Ikona litinového kanálového poklopu |
| `tile.sacristy_bell` | `assets/tiles/sacristy_bell.png` | 256×256 | Fallback SVG | Ikona mosazného kostelního zvonce se zvukovými vlnami |
| `tile.wood_axe` | `assets/tiles/wood_axe.png` | 256×256 | Fallback SVG | Ikona oboustranné sekery na polena |
| `tile.plank_stomp` | `assets/tiles/plank_stomp.png` | 256×256 | Fallback SVG | Ikona okované boty dupající na prkno s hřeby |
| `tile.funeral_shroud` | `assets/tiles/funeral_shroud.png` | 256×256 | Fallback SVG | Ikona černé pohřební plachty se stříbrným křížkem |
| `tile.silver_crucifix_beam` | `assets/tiles/silver_crucifix_beam.png` | 256×256 | Fallback SVG | Ikona zářícího krucifixu vysílajícího paprsek světla |
| `intent.step` | `assets/intents/krok.png` | 128×128 | Fallback SVG | Ikona šouravého kroku (bota se šipkou) |
| `intent.strike` | `assets/intents/uder.png` | 128×128 | Fallback SVG | Ikona upířích drápů / sekáčku (blízký úder) |
| `intent.shoot` | `assets/intents/strela.png` | 128×128 | Fallback SVG | Ikona letícího úředního razítka (střela) |
| `intent.windup` | `assets/intents/naprah.png` | 128×128 | Fallback SVG | Ikona napjatého bicepsu a vzteklých jisker (nápřah) |
| `intent.shield` | `assets/intents/stit.png` | 128×128 | Fallback SVG | Ikona dubového štítu |
| `intent.heal` | `assets/intents/leceni.png` | 128×128 | Fallback SVG | Ikona krevní transfuze / účetní knihy (léčení) |
| `intent.summon` | `assets/intents/privolani.png` | 128×128 | Fallback SVG | Ikona pískající píšťalky a netopýra (přivolání) |
| `intent.turn` | `assets/intents/otoceni.png` | 128×128 | Fallback SVG | Ikona zatočené šipky (otočení) |
| `terrain.stone` | `assets/terrain/dlazdice_kamen.png` | 256×256 | Fallback SVG | Kamenná hradní dlaždice |
| `terrain.barrel` | `assets/terrain/sud_zeli.png` | 256×256 | Fallback SVG | Dubový sud s kyselým zelím |
| `terrain.plank_intact` | `assets/terrain/prkno_cele.png` | 256×128 | Fallback SVG | Staré dřevěné prkno přes šachtu |
| `terrain.plank_cracked` | `assets/terrain/prkno_praskle.png` | 256×128 | Fallback SVG | Napůl zlomené prkno s třískami |
| `terrain.pit` | `assets/terrain/propast.png` | 256×128 | Fallback SVG | Černá hradní propast |
| `terrain.spikes` | `assets/terrain/kuly.png` | 256×128 | Fallback SVG | Naostřené dubové kůly trčící z podlahy |
| `terrain.garlic_cloud` | `assets/terrain/cesnekovy_oblak.png` | 256×256 | Fallback SVG | Žlutozelený oblak česnekového odéru |
| `terrain.gate` | `assets/terrain/brana.png` | 256×384 | Fallback SVG | Kovaná hradní brána pro příchod posil |
| `map.battle` .. `map.boss` | `assets/map/*.png` | 128×128 | Fallback SVG | 7 ikon uzlů mapy (`bitva`, `elita`, `hospoda`, `dilna`, `udalost`, `poklad`, `boss`) |
