# Lead Comments: Frontend Implementation Instructions

You are implementing comments on individual leads. The database side is finished and tested. Your job is the frontend.

Read this whole document before writing any code.

---

## 0. What changed in the database

Commenting means multiple timestamped, attributable entries per lead over time, not one free-text field, so this was built as a table rather than a single column.

- **New table `lead_notes`**: `id`, `property_lead_id`, `group_id` (mirrors the lead's, nullable), `created_by`, `body` (1 to 4000 characters), `created_at`, `updated_at`.
- **`lead_pipeline` view** gained two columns for list-view display: `notes_count` (integer) and `last_note_at` (timestamp, null if no notes yet). The view does not carry the full comment thread — fetch that from `lead_notes` when a lead is opened.
- **Access follows the lead.** Whoever can see a lead (a group member, or the personal owner of an ungrouped lead) can read and add comments on it. Editing or deleting a comment is restricted to the person who wrote it, even for group admins.
- **`group_id` is automatic.** Do not set it from the client; a trigger copies it from the parent lead on insert.

---

## 1. Step 0: Discovery

1. Find where a single lead's details are shown today — a drawer, a modal, or a dedicated page (search for where `lead_pipeline` or `property_leads` is queried by id, or where the leads table row expands).
2. Note the Supabase client import and pattern already used elsewhere in the app, and reuse it exactly.
3. Note existing UI primitives (Button, Textarea, Avatar, Card, and so on) and the project's brandbook or design tokens if one exists in the codebase. Reuse them; do not introduce new styling conventions or new dependencies.
4. Note how the leads list/table is built, since it needs a small addition (a comment count) next to each row.
5. Report back in a few lines: where the lead detail view lives, which components you'll reuse, and where the leads list is rendered, before writing code.

---

## 2. Data layer

Add this near wherever similar data functions for leads already live, or inline in the lead detail component if the codebase doesn't separate concerns that way. Match the file's existing conventions.

```ts
export type LeadNote = {
  id: number;
  property_lead_id: number;
  created_by: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  author_email?: string | null; // resolved separately, see getLeadNotes
};

async function getLeadNotes(supabase: SupabaseClient, propertyLeadId: number): Promise<LeadNote[]> {
  const { data: notes, error } = await supabase
    .from("lead_notes")
    .select("id, property_lead_id, created_by, body, created_at, updated_at")
    .eq("property_lead_id", propertyLeadId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  if (!notes?.length) return [];

  // created_by references auth.users, not profiles, so PostgREST cannot embed profiles.
  // Resolve author emails in a second query, same pattern used for group members.
  const authorIds = [...new Set(notes.map((n) => n.created_by).filter((id): id is string => !!id))];
  if (authorIds.length === 0) return notes;

  const { data: profiles, error: pErr } = await supabase
    .from("profiles").select("id, email").in("id", authorIds);
  if (pErr) throw pErr;
  const emailById = new Map((profiles ?? []).map((p) => [p.id, p.email as string]));
  return notes.map((n) => ({ ...n, author_email: n.created_by ? emailById.get(n.created_by) ?? null : null }));
}

async function addLeadNote(supabase: SupabaseClient, propertyLeadId: number, body: string): Promise<LeadNote> {
  const trimmed = body.trim();
  const { data, error } = await supabase
    .from("lead_notes")
    .insert({ property_lead_id: propertyLeadId, body: trimmed })
    .select("id, property_lead_id, created_by, body, created_at, updated_at")
    .single();
  if (error) throw error;
  return data;
}

async function updateLeadNote(supabase: SupabaseClient, noteId: number, body: string) {
  const { data, error } = await supabase
    .from("lead_notes").update({ body: body.trim() }).eq("id", noteId)
    .select("id");
  if (error) throw error;
  if (!data?.length) throw new Error("not allowed"); // RLS silently returns 0 rows if not the author
}

async function deleteLeadNote(supabase: SupabaseClient, noteId: number) {
  const { data, error } = await supabase
    .from("lead_notes").delete().eq("id", noteId).select("id");
  if (error) throw error;
  if (!data?.length) throw new Error("not allowed");
}
```

Validation to match the database constraint: reject empty/whitespace-only comments and cap input at 4000 characters client-side too, so the user gets immediate feedback instead of a round trip.

---

## 3. UI: comment thread on the lead detail view

Add a "Notes" or "Comments" section to the existing lead detail component:

- **List**: each comment shows its author (email, or "You" for the current user's own), a relative timestamp ("2 hours ago"), and the body. Order oldest to newest, newest at the bottom, auto-scrolled into view, the common chat/thread pattern.
- **Composer**: a text area plus a submit button (or Cmd/Ctrl+Enter to submit). Disable submit while empty or while a request is in flight. Clear the field on success and append the new comment optimistically or by refetching.
- **Edit/delete**: only on the current user's own comments (compare `created_by` to the logged-in user's id). Use the app's existing confirm pattern for delete, not `window.confirm`, if one exists.
- **Empty state**: "No comments yet" plus the composer, not an error.
- **Errors**: show a message and re-enable the form; do not lose what the user typed.
- **Loading state**: skeleton or spinner while the thread loads, separate from the rest of the lead detail load if they are fetched independently.

Keep this self-contained enough that it could be its own small component (`LeadNotes` or similar) if the codebase's existing pattern favors that, but match whatever convention the lead detail view already follows rather than introducing a new one.

---

## 4. UI: comment count in the leads list

Wherever `lead_pipeline` rows are rendered as a table or list, add a small indicator using the `notes_count` field already in the view — a comment icon with a number, or just a number, next to each row. Zero comments can show nothing rather than "0" to reduce clutter. `last_note_at` is available if the list should support sorting or a "recently discussed" indicator, but only add that if it fits naturally; do not over-build.

---

## 5. Things to get right

1. **Do not send `group_id` when inserting a note.** It is filled in automatically from the parent lead.
2. **RLS returns success with zero rows on a forbidden update or delete, not an error.** Always check the returned rows and throw if empty, exactly as shown in `updateLeadNote`/`deleteLeadNote` above.
3. **Only the author can edit or delete**, including in a group. There is no admin override in the database; do not build one in the UI unless a follow-up task adds it server-side first.
4. **Realtime is optional.** If the app already uses Supabase Realtime subscriptions elsewhere, wiring `lead_notes` in for live updates when teammates comment is a nice addition but not required. If added, subscribe scoped to `property_lead_id` and clean up the subscription when the detail view closes.

---

## 6. Test plan

1. Open a lead you can see, add a comment, confirm it appears immediately and persists on refresh.
2. Edit your own comment; confirm it updates and `updated_at` changes.
3. Delete your own comment; confirm it disappears.
4. As a second account with no shared group, confirm the first account's comments and leads are not visible at all.
5. As a group member (not the comment's author), confirm you can read the comment but have no edit/delete control on it.
6. Confirm the leads list shows the correct comment count next to each row and updates after adding a comment.
7. Try submitting an empty comment and a 4000+ character comment; confirm client-side validation catches both before a network request.

---

## 7. Report back

When finished, state: which component now hosts the comment thread, which file(s) you touched, and anything left for the product owner to decide (for example, whether group admins should be able to moderate others' comments later).