// Fighter image overrides.
//
// Fighter `imageUrl` normally comes from the DB (set by the seed / ESPN headshot
// script). This map lets us pin a specific local image for a fighter by name
// WITHOUT a DB write — useful for custom portraits we ship in /public. An entry
// here wins over whatever the DB has; fall through to the DB url otherwise.
//
// Keys are matched case-insensitively on the fighter's display name.
const OVERRIDES: Record<string, string> = {
  'josh hokit': '/fighters/josh-hokit.jpg',
};

export function fighterImage(name: string | null | undefined, dbUrl: string | null | undefined): string | null {
  const key = (name ?? '').trim().toLowerCase();
  return OVERRIDES[key] ?? dbUrl ?? null;
}
