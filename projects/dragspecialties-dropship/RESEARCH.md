# Research: Is Drag Specialties' catalog API "open"?

## Short answer

**No.** Drag Specialties does not have a public, self-serve developer API that
a stranger could sign up for and build an independent ecommerce site on top
of. What actually exists is a **dealer-gated B2B system**, and the "open API"
the brother heard about is almost certainly a third-party integration
platform that still requires an authorized Drag Specialties dealer account
behind it — not open access to their catalog.

## What Drag Specialties actually is

- Part of **LeMans Corporation / Motorsport Aftermarket Group (MAG)**, which
  also owns **Parts Unlimited**, Custom Chrome, Bikers Choice, etc. — the
  dominant powersports parts distributors in the US.
- `dragspecialties.com` is a **catalog/marketing site, not a checkout**. It
  has a "Catalog Search" so end users can find parts, and a **"Find Dealer"**
  page/widget — this is exactly the flow the brother described: a consumer
  searches a part, the site geo-locates them, and points them at the nearest
  *authorized dealer* (in this case, apparently the Appleton/Hamilton dealer)
  rather than letting them buy directly.
- There is no "Add to Cart" for the public on that site. To transact, a
  business has to be an authorized Drag Specialties dealer.

## The actual dealer ordering system

- Dealers log in at `dealer.dragspecialties.com` (and the sister site
  `dealer.parts-unlimited.com`, aka the "PartsNetWeb"-style B2B portal shared
  across MAG brands). This is a credentialed B2B ordering system — real-time
  pricing, inventory-by-warehouse, and order entry.
- There's a documented **$7 drop-ship fee** for any order shipped somewhere
  other than the dealer's own address — confirming drop-ship-to-customer is a
  standard, supported feature of the dealer program, not something 43moto
  hacked together. Drag Specialties ships from multiple US warehouses and
  will fulfill from whichever is closest to the end customer.
- Some MAG-brand distributors (Parts Unlimited/Drag Specialties) also
  integrate with dealer **DMS platforms** like ADP Lightspeed, letting a
  dealer's own management software pull warehouse inventory and push
  purchase orders — another sign the "API" lives inside the dealer
  relationship/DMS ecosystem, not in a public developer portal.

## The "API" the brother is thinking of

Search turned up **MindCloud** (mindcloud.co), an iPaaS (integration
middleware) vendor that publishes "Drag Specialties API" and
"Drag Specialties (Website) API" docs under their "Universal API" product.
Key details:

- It's MindCloud's own wrapper/connector, not something Drag Specialties
  itself publishes as a public developer API.
- To use it you need **a MindCloud account and API key**, plus a
  **"connectionId" tied to your own connected Drag Specialties account** —
  i.e., you still need to already be an authorized dealer with portal
  credentials; MindCloud just normalizes that dealer-portal access (pricing,
  pricing files, etc.) into a modern REST shape so it's easier to plug into
  a website, DMS, or order system.
- This is a common pattern in this industry: legacy B2B distributors expose
  data via old-school EDI/FTP/pricing-file mechanisms, and companies like
  MindCloud (or Actian/Celigo/etc.) sell "we already built the connector"
  middleware on top, marketed loosely as an "API."

## What 43moto.com / Route 43 Motorsports is actually doing

Route 43 Motorsports is a real, HD-focused powersports dealer in Sheboygan,
WI that runs 43moto.com as its consumer storefront. Based on how this
industry works (and matches the drop-ship-fee evidence above), the likely
setup is:

1. Route 43 is an **authorized Drag Specialties / Parts Unlimited dealer**
   (prerequisite — not optional).
2. They ingest the distributor's **dealer catalog/pricing/fitment data
   feed** (via the dealer portal, EDI files, or a middleware connector like
   MindCloud) to power their own website's product catalog and live pricing.
3. When a customer buys on 43moto.com, their backend **programmatically
   submits the order** into the same dealer ordering system the brother's
   shop uses manually, with the drop-ship-to-customer address — the
   distributor's warehouse network picks the closest one and ships direct.
4. So 43moto.com didn't get "extra" access Drag Specialties doesn't offer to
   everyone — they automated the exact manual workflow the brother's shop
   does by phone/form, by building (or buying) integration software on top
   of their own dealer account.

## Bottom line / what this means for a hypothetical project

- You can't build this as an outside/independent ecommerce site — **step
  zero is becoming an authorized Drag Specialties (and/or Parts Unlimited)
  dealer**, which likely means partnering with, or operating through, an
  actual licensed powersports dealership (the brother's dealership is
  already one — that's the real asset here).
- Once you have a dealer account, the realistic technical paths are:
  - Use the dealer portal's data exports/feeds directly, or
  - Pay for a middleware connector (MindCloud or similar) to get a cleaner
    REST interface over that same dealer access, or
  - Ask Drag Specialties/Parts Unlimited directly what "dealer.com"-style
    integration options they officially support (dealer reps typically
    know this cold since it's a common ask).
- There is real precedent (43moto.com, RevZilla, Dennis Kirk, PartsGiant,
  GetLowered, RidersAddiction) for dealers running full dropship storefronts
  on this distributor network, so the business model is proven — it's just
  gated behind a dealer relationship, not a public API anyone can sign up
  for.

## Sources

- https://mindcloud.co/docs/universal/rest/drag-specialties/latest
- https://mindcloud.co/docs/universal/rest/drag-specialties-website/latest/introduction/getting-started
- https://mindcloud.co/docs/universal/rest/drag-specialties/latest/actions/list-part-pricing
- https://www.dragspecialties.com/ (catalog search, find-dealer, become-a-dealer, login)
- https://dealer.dragspecialties.com/login
- https://www.dragspecialties.com/find-dealer
- https://www.motorcyclepowersportsnews.com/parts-unlimited-and-drag-specialties-integrate-with-adp-lightspeed/
- https://www.lightspeeddms.com/third-party-partners/partsunlimited/
- https://43moto.com/blog/post/welcome-to-the-new-43Moto.com (Route 43 Motorsports' own site, blocked by network egress proxy for direct fetch — title/snippet only)
- https://www.dealerorders.com/cgi-bin/dealer/dealerterms.html ($7 drop-ship fee term)
- https://www.revzilla.com/drag-specialties, https://www.partsgiant.com/drag-specialties, https://www.getlowered.com/brands/Drag-Specialties.html, https://ridersaddiction.com/drag-specialties/ (other storefronts reselling this same distributor's catalog)

Note: direct WebFetch to dragspecialties.com, 43moto.com, and mindcloud.co was
blocked by this session's network egress proxy — findings above come from
search-result snippets, not full page reads. Worth re-fetching directly (or
having the brother's dealer rep confirm) before committing to a build.
