# Groups Feature: Implementation Instructions for the Coding Agent

You are implementing the front end of a group system for a property wholesaling app. The database side is finished and tested. Your job is limited to one file: `admin-access-panel.tsx`.

Read this whole document before writing any code.

---

## 0. Ground rules

1. **All group settings and UI live in `admin-access-panel.tsx`.** Do not create new component files, hooks files, or utility files for this feature. Define the types, data functions, and UI inside that file, under clearly marked sections. Only touch another file if the panel cannot render without it (for example, an existing tab registry), and say so in your report.
2. **Follow the brandbook that already exists in this codebase.** Do not invent colors, fonts, radii, spacing, or copy style. Section 1 tells you how to find and apply it.
3. **Do not touch the database, policies, or migrations.** The backend is done. If you think something is missing on the backend, list it in your report instead of working around it.
4. **Do not add group filtering to queries as a security measure.** Row Level Security already does that. Any group filter you add is for UI convenience only.
5. **Never use the Supabase service role key in front-end code.**
6. **No emojis** in UI text, code comments, or copy.

---

## 1. Step 0: Discovery (do this before editing anything)

### 1.1 Find and read the brandbook

Search the repository for it. Likely names and places:

- files or folders named `brandbook`, `brand-book`, `brand`, `BRAND.md`, `design-system`, `style-guide`, `tokens`, `theme`
- `docs/`, `design/`, `public/`, or the repo root
- theme definitions: `tailwind.config.*`, `globals.css` (CSS variables), a `theme.ts`, or a shadcn `components.json`

Read it fully. Then write down, for yourself, the following (you will summarise it in your final report):

- colors and their semantic roles (primary, surface, border, success, danger, muted text)
- typography (families, sizes, weights, heading levels)
- spacing scale, radii, shadows, borders
- how buttons, inputs, selects, badges, tables, cards, dialogs, and tabs are meant to look
- voice and copywriting rules (tone, capitalisation, how errors and empty states are worded)
- iconography rules and any "do not" list

If the brandbook and the code disagree, the brandbook wins for new UI, but reuse the code's existing component primitives wherever they implement it.

### 1.2 Read the existing panel

Open `admin-access-panel.tsx` and note:

- how it is structured (tabs, sections, cards, tables) so the new Groups section matches
- which UI primitives it already imports (Button, Input, Badge, Dialog, Table, and so on). **Reuse those.**
- how it gets the Supabase browser client. Reuse that exact import and pattern
- how it is gated (which check decides who can open it, for example `profiles.role === 'admin'`)
- its conventions: `"use client"`, async/error/loading patterns, toast or notification system, naming

### 1.3 Report your findings first

Before editing, output 5 to 8 lines: where the brandbook is, the tokens and components you will use, and how the panel is gated. Then proceed.

---

## 2. Backend contract (already live, do not change)

Group membership is **optional**. A user is either working solo or inside one or more groups.

| Situation | What the user sees |
|---|---|
| Not in any group | Only their own personal records. The app works fully. This is a normal state, never an error. |
| In one or more groups | Records belonging to those groups, plus any personal records they created before joining. |

Records affected: `property_leads`, `skiptrace`, `conversations`, `contracts`, `LeadsUploads`, `tulsa_county_excess_resale`, `ContactInfo`, and the `lead_pipeline` view. Each row has a nullable `group_id`. A null `group_id` means personal, owned by `created_by`.

Behaviours to know:

- A user who is in a group and inserts a record without a `group_id` gets it placed in their earliest group automatically.
- A user in no group gets a personal record.
- A group record cannot be turned back into a personal one by a user.
- A user can push their personal records into a group they belong to (one-way, see `share_my_data_with_group`).

Tables and functions this task uses:

| Object | Access |
|---|---|
| `groups` (`id`, `name`, `created_at`) | Members can read. Owners and admins can rename. |
| `group_members` (`group_id`, `user_id`, `role`, `created_at`) | Members can read the member list of their groups. Owners/admins can remove non-owners. A non-owner can remove themselves (leave). |
| `profiles` (`id`, `email`) | A user can read profiles of people who share a group with them. |
| `create_group(p_name text)` returns uuid | RPC. Caller becomes `owner`. Name must be 1 to 100 characters. |
| `add_group_member(p_group_id uuid, p_email text, p_role text)` | RPC. Owners/admins only. `p_role` is `member` or `admin`. The person must already have an account. |
| `share_my_data_with_group(p_group_id uuid)` returns json | RPC. Moves the caller's personal records into the group. Returns counts: `{ leads, uploads, tulsa, contacts }`. Related skiptrace, conversations, and contracts move with their lead. |

Error messages come back as the plain exception text. Known ones: `not allowed`, `no user with that email`, `role must be member or admin`, `group name must be 1 to 100 characters`, `not authenticated`.

Important behaviour: when RLS forbids a `delete` or `update`, Supabase returns **no error and zero rows**. Always ask for the affected rows back (`.select()`) and treat an empty result as "not allowed".

---

## 3. Product rules for the UI

1. **Never force a group.** No blocking modal, no "you must create a group". If the user has no group, show a calm explanation that they are working solo and that groups are optional, with a way to create one.
2. **The section must work for both states**: no groups, one group, many groups.
3. **Roles drive controls.** Owners and admins see rename and add-member. Everyone sees the member list. Owners cannot be removed and cannot leave. Members and admins can leave.
4. **Destructive or irreversible actions need confirmation** (remove member, leave group, share personal data). Use the panel's existing dialog component if one exists, not `window.confirm`.
5. **Sharing personal data is opt-in and one-way.** Show that action only when the user is in at least one group and has personal records to share (see the count query below). Explain that the records become visible to every member of the chosen group and cannot be made personal again from the UI.
6. **Leaving a group** means losing access to that group's records. Personal records stay with the user. Say this in the confirmation.
7. **Copy** follows the brandbook voice. Keep messages short and specific.

Suggested layout inside the panel (map it to the brandbook's components):

```
Groups
  Short description: groups are optional; solo users only see their own records.

  Workspace summary   ->  "Working solo" or the active group name + your role

  [ if in groups ]
  Group switcher      ->  tabs / segmented control / select (per brandbook)
  Rename group        ->  owner/admin only
  Members table       ->  email | role badge | Remove or Leave action
  Add member form     ->  email + role (Member/Admin), owner/admin only
  Share my records    ->  shown only when personal record count > 0

  Create a group      ->  name field + button (always available)
```

---

## 4. Logic to implement (style-agnostic reference)

Define this at the top of `admin-access-panel.tsx` in a section marked `// ===== Groups: data layer =====`. Adjust the Supabase client import to the one the file already uses. Keep it strictly typed to match the file's TypeScript settings.

```ts
export type GroupRole = "owner" | "admin" | "member";

type Group = { id: string; name: string; created_at: string; myRole: GroupRole };
type Member = { user_id: string; role: GroupRole; created_at: string; email: string | null };
type ShareResult = { leads: number; uploads: number; tulsa: number; contacts: number };

const ERROR_MESSAGES: Record<string, string> = {
  "not allowed": "Only group owners and admins can do that.",
  "no user with that email": "No account exists with that email yet.",
  "role must be member or admin": "Choose either Member or Admin.",
  "group name must be 1 to 100 characters": "Group name must be 1 to 100 characters.",
  "not authenticated": "Please sign in again.",
};
// Reword these to match the brandbook voice.

function friendlyError(err: { message?: string } | null | undefined): string {
  const msg = err?.message ?? "Something went wrong.";
  return ERROR_MESSAGES[msg] ?? msg;
}

async function getMyGroups(supabase: SupabaseClient): Promise<Group[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const { data, error } = await supabase
    .from("group_members")
    .select("role, groups(id, name, created_at)")
    .eq("user_id", auth.user.id);
  if (error) throw error;
  return (data ?? [])
    .map((row: any) => {
      const g = Array.isArray(row.groups) ? row.groups[0] : row.groups;
      return g ? ({ ...g, myRole: row.role } as Group) : null;
    })
    .filter((g): g is Group => g !== null)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

async function getMembers(supabase: SupabaseClient, groupId: string): Promise<Member[]> {
  const { data: members, error } = await supabase
    .from("group_members")
    .select("user_id, role, created_at")
    .eq("group_id", groupId)
    .order("created_at");
  if (error) throw error;
  if (!members?.length) return [];

  // group_members.user_id references auth.users, not profiles, so PostgREST cannot
  // embed profiles. Use a second query.
  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("id, email")
    .in("id", members.map((m) => m.user_id));
  if (pErr) throw pErr;
  const emailById = new Map((profiles ?? []).map((p) => [p.id, p.email as string]));
  return members.map((m) => ({ ...m, email: emailById.get(m.user_id) ?? null })) as Member[];
}

async function createGroup(supabase: SupabaseClient, name: string): Promise<string> {
  const { data, error } = await supabase.rpc("create_group", { p_name: name });
  if (error) throw error;
  return data as string;
}

async function addMember(supabase: SupabaseClient, groupId: string, email: string, role: "member" | "admin") {
  const { error } = await supabase.rpc("add_group_member", {
    p_group_id: groupId, p_email: email.trim(), p_role: role,
  });
  if (error) throw error;
}

async function removeMember(supabase: SupabaseClient, groupId: string, userId: string) {
  const { data, error } = await supabase
    .from("group_members").delete()
    .eq("group_id", groupId).eq("user_id", userId)
    .select("user_id");
  if (error) throw error;
  if (!data?.length) throw new Error("not allowed");
}

async function renameGroup(supabase: SupabaseClient, groupId: string, name: string) {
  const { data, error } = await supabase
    .from("groups").update({ name: name.trim() }).eq("id", groupId).select("id");
  if (error) throw error;
  if (!data?.length) throw new Error("not allowed");
}

// Number of the user's personal (non-group) leads. Group rows have a non-null group_id,
// so this only counts personal records the user owns.
async function countPersonalLeads(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from("property_leads")
    .select("id", { count: "exact", head: true })
    .is("group_id", null);
  if (error) throw error;
  return count ?? 0;
}

async function shareMyData(supabase: SupabaseClient, groupId: string): Promise<ShareResult> {
  const { data, error } = await supabase.rpc("share_my_data_with_group", { p_group_id: groupId });
  if (error) throw error;
  return data as ShareResult;
}
```

### Component state to manage

- `groups`, `activeGroupId`, `members`, `myId`
- `personalCount` (refresh after sharing)
- `loading`, `error`, `notice` (or the panel's existing toast system)
- form fields: new group name, invite email, invite role, rename value

Behaviour details:

- Persist `activeGroupId` in `localStorage` inside `try/catch`, and fall back to the first group if the stored id is not in the list.
- After every mutation, re-fetch the affected data. After leaving a group, re-fetch the group list.
- Disable submit buttons while a request is in flight, and prevent double submission.
- Show errors through `friendlyError`. Announce errors to screen readers (`role="alert"` or the panel's equivalent).
- Every input needs a visible label or an `aria-label`. All controls must be keyboard-operable.
- Layout must work on narrow screens (the members table should scroll or stack per the brandbook).

---

## 5. Gating note

The Groups section inherits whatever gate the panel already has. If the panel is restricted to app admins, then only app admins can reach group management from the UI. Do **not** change the gating. State clearly in your report how the panel is gated so the product owner can decide whether regular users need another entry point.

---

## 6. Out of scope (list these in your report, do not implement)

- Passing `group_id` explicitly on inserts elsewhere in the app. Users in several groups currently get new records placed in their earliest group. A group switcher affecting the rest of the app would need changes in other files.
- Showing "added by" on lead rows (`created_by` is available on `property_leads` and `lead_pipeline`).
- Ownership transfer, deleting a group, pending invites for people without an account, changing a member's role after adding them.
- Scoping the `contracts` storage bucket by group (a backend task).
- Any change to n8n workflows or server routes. If they use the service role key they bypass RLS, which is expected but worth reviewing separately.

---

## 7. Definition of done

- [ ] Brandbook located, read, and applied. No hard-coded colors or sizes where a token exists.
- [ ] Existing UI primitives reused. No new dependency added.
- [ ] Everything lives in `admin-access-panel.tsx`.
- [ ] Works with no groups, one group, and several groups.
- [ ] Owner, admin, and member each see the correct controls.
- [ ] Loading, empty, error, and success states are all present.
- [ ] Confirmation dialogs for remove, leave, and share.
- [ ] Keyboard navigation and screen-reader labels work.
- [ ] TypeScript compiles with no new errors and no `any` beyond the Supabase embed cast above. Lint is clean.

## 8. Manual test plan

1. **Solo user:** sign in with an account that has no group. The panel shows the solo state, no errors, and the create form. The rest of the app still shows that user's own records.
2. **Create a group:** the user becomes owner, sees themselves in the member list, and the group appears in the switcher.
3. **Add a member** by email of an existing account. The new row appears. An unknown email shows the "no account" message. Try both Member and Admin.
4. **Roles:** sign in as the added member. Rename and add-member controls are hidden. Remove buttons for others are hidden. Leave is available.
5. **Leave:** the member leaves; the group disappears from their panel and its records disappear from the rest of the app.
6. **Share personal records:** as a solo user with personal leads who then joins a group, the share action appears with the correct count. After confirming, group members can see those leads.
7. **Owner protections:** the owner has no Leave or Remove control on their own row.
8. **Errors:** simulate a failed request and confirm the message is shown and the buttons re-enable.

---

## 9. Report back

When finished, reply with:

1. The brandbook location and the tokens and components you used.
2. How the panel is gated.
3. A short summary of what you added to `admin-access-panel.tsx`.
4. Anything you could not do or want the product owner to decide.