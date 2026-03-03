# NodeCMS Website

Dette er en separat Next.js-nettside som konsumerer publisert innhold fra CMS.

## Kjøring lokalt

1. Start CMS-backend i prosjektroten:

```bash
npm run start
```

2. Start denne nettsiden:

```bash
npm run dev
```

Nettsiden kjører på `http://127.0.0.1:3001`.

## Ruting

- Appen bruker optional catch-all route: `src/app/[[...slug]]/page.tsx`.
- Root (`/`) mapes til slug `home`.
- F.eks. `/about/team?locale=en` henter CMS-slug `about/team`.

## CMS-tilkobling

- Default CMS-base: `http://127.0.0.1:3000`
- Kan overstyres med miljøvariabel:

```bash
CMS_BASE_URL=http://127.0.0.1:3000 npm run dev
```

Nettsiden viser kun publisert innhold (public endpoint i CMS).

## Komponent-rendering fra CMS

Website støtter nå komponentlisten fra CMS-public payload (`components`) med følgende typer:

- `hero`
- `section`

Ukjente komponenttyper rendres som en tydelig "unknown component"-fallback i siden.

## Related pages (valgfritt)

Du kan vise related pages ved å konfigurere slugs som skal hentes fra CMS:

```bash
CMS_RELATED_SLUGS=home,about,contact npm run dev
```

- Slugs som ikke finnes/publisert blir automatisk ignorert.
- Nåværende side-slug filtreres bort fra related-listen.
