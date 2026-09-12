# Hoopoe setup runbook

From "project created" to "ready to run DR". Follow top to bottom. Every step has a check: if the check fails, stop there rather than carrying on.

macOS. Terminal app. `$` marks a command you type; don't type the `$` itself.

Conventions used below:
- `<new-ref>` = the new project's reference id
- `xkhulybdrxdzakarivvi` = the OLD project's reference id, used as-is

---

## 0. Tools

Three things to install. If a command prints a version number, it's installed and you can skip it.

```bash
brew --version
```

No Homebrew? Install it from https://brew.sh, then reopen Terminal.

```bash
brew install supabase/tap/supabase
brew install libpq && brew link --force libpq
brew install gh
```

**Check:**

```bash
supabase --version
pg_dump --version
gh --version
```

Three version numbers, no "command not found". If `pg_dump` isn't found after the link, run `echo 'export PATH="/opt/homebrew/opt/libpq/bin:$PATH"' >> ~/.zshrc` then open a new Terminal window.

---

## 1. Collect what you need

Open the new project in the Supabase dashboard and gather 4 things. Put all of them in your password manager as you go.

1. **Project ref.** Project Settings, General. A 20-character string. This is `<new-ref>`.
2. **Database password.** The one you set at creation. Not recoverable later.
3. **Connection string.** Click Connect at the top of the dashboard. Choose **Session pooler**, port 5432. It looks like `postgresql://postgres.<ref>:[YOUR-PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres`. Replace `[YOUR-PASSWORD]` with your actual password. Use the pooler one, not "Direct connection", which is IPv6 only.
4. **service_role key.** Project Settings, API keys. Long string starting `eyJ`. This one is a full-access key: never commit it, never paste it into a chat, never put it in a file inside the repo.

Then do the same for the **old** project to get its connection string. You need it once, for the data copy.

---

## 2. Get the repo onto your machine

```bash
cd ~
gh auth login
```

Follow the prompts: GitHub.com, HTTPS, authenticate via browser.

```bash
gh repo clone mharb92/hoopoe
cd hoopoe
```

**Check:** `pwd` prints something ending in `/hoopoe`.

Now copy in the bootstrap files I gave you: `README.md`, `CLAUDE.md`, `.gitignore`, the `docs/dr/` folder with its 3 files, and the empty `tools/dr/` folder. Drag them into the folder in Finder (cmd+shift+. shows hidden files like `.gitignore`).

```bash
git add -A
git commit -m "Bootstrap: docs, DR spec, session rules"
git push
```

**Check:** open https://github.com/mharb92/hoopoe in a browser. The files are there.

---

## 3. Wire the Supabase CLI to the project

```bash
supabase init
supabase login
supabase link --project-ref <new-ref>
```

`supabase login` opens a browser. `link` asks for the database password.

**Check:** `ls supabase` lists `config.toml`.

---

## 4. Migration 1: the dictionary table

```bash
supabase migration new dictionary_table
```

It prints a path like `supabase/migrations/20260912093000_dictionary_table.sql`. Open that file in a text editor and paste this in, then save:

```sql
create table dictionary (
  id           serial primary key,
  rank         int,
  arabic       text,
  romanization text,
  english      text,
  pos          text,
  category     text,
  root         text,
  conjugation  text,
  gender       text,
  dialect_tag  text,
  notes        text,
  confidence   int,
  created_at   timestamptz default now()
);

alter table dictionary enable row level security;
```

Apply it:

```bash
supabase db push
```

**Check:** dashboard, Table Editor. `dictionary` exists and is empty.

---

## 5. Copy the dictionary data across

Put both connection strings into your shell. `read -rs` means: paste, press Enter, nothing appears on screen. That's normal.

```bash
read -rs OLD; export OLD
read -rs NEW; export NEW
```

Paste the old string, Enter, then the new string, Enter.

**Check both work before copying:**

```bash
psql "$OLD" -c "select count(*) from dictionary;"
psql "$NEW" -c "select count(*) from dictionary;"
```

Expect 2728 and 0. If you get a connection error, the password inside the string is wrong or still says `[YOUR-PASSWORD]`.

Now the copy:

```bash
pg_dump "$OLD" --data-only --no-owner --table=public.dictionary -f dict-preDR.sql
psql "$NEW" -f dict-preDR.sql
shasum -a 256 dict-preDR.sql
```

Write that hash down. `dict-preDR.sql` is the pre-DR snapshot the runbook asks for, and your rollback if anything goes wrong. Keep it somewhere outside the repo, like `~/Documents/hoopoe-backups/`.

If `pg_dump` complains about a server version mismatch, run `brew upgrade libpq && brew link --force libpq` and try again.

---

## 6. Fix the id counter

The copy brought ids across but not the counter that hands out new ones. Without this, the next inserted row collides with id 1.

```bash
psql "$NEW" -c "select setval('dictionary_id_seq', (select max(id) from dictionary));"
```

**Check:** it prints 2728.

---

## 7. Verify the copy is exact

Run the same command against both, and compare the two outputs by eye.

```bash
psql "$OLD" -c "select count(*), md5(string_agg(id::text || '|' || arabic, E'\n' order by id)) from dictionary;"
psql "$NEW" -c "select count(*), md5(string_agg(id::text || '|' || arabic, E'\n' order by id)) from dictionary;"
```

Both must print 2728 and the **same** 32-character hash.

If the hashes differ, stop. Don't continue, don't try to patch it. Tell me and we'll work out what moved.

---

## 8. Migration 2: the DR schema

```bash
supabase migration new dr_schema
```

Open the new file and paste in the whole SQL block from `docs/dr/dr-runbook.md` section 1, the 5 `alter table` lines and the 3 `create table` statements. Then add these 3 lines at the bottom:

```sql
alter table dictionary_review enable row level security;
alter table formula_pair      enable row level security;
alter table function_words    enable row level security;
```

Apply and commit:

```bash
supabase db push
git add -A
git commit -m "Schema: dictionary, DR staging, formula_pair, function_words"
git push
```

**Check:** Table Editor shows 4 tables. `dictionary` still reads 2728 rows, and now has empty `level`, `arabic_vocalised`, `register`, `form_origin` columns plus a `track_id` column reading `palestinian` on every row.

From here on, every schema change goes through `supabase migration new`. Never the SQL Editor. If you change the database by hand, the repo starts lying about what's in it.

---

## 9. Smoke test the service_role key

This is the exact path the DR runner uses, so it needs to work before anything else happens.

```bash
read -rs SRK; export SRK
curl -s -I "https://<new-ref>.supabase.co/rest/v1/dictionary?select=id" \
  -H "Authorization: Bearer $SRK" \
  -H "Prefer: count=exact" -H "Range: 0-0"
```

**Check:** a `content-range` header ending in `/2728`.

If you get a 401 or an empty range, the "Automatically expose new tables" setting we turned off has also blocked service_role. Fix:

```bash
psql "$NEW" -c "grant all on table dictionary, dictionary_review, formula_pair, function_words to service_role;"
```

Then curl again. `anon` stays locked out either way, which is the point.

---

## 10. Edge function (only if routing batch calls through it)

Skip if you're putting the Anthropic key in the cloud environment instead.

```bash
supabase functions download claude --project-ref xkhulybdrxdzakarivvi
supabase functions deploy claude --project-ref <new-ref>
supabase secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref <new-ref>
git add -A && git commit -m "Port claude edge function" && git push
```

Do **not** port `elevenlabs`. It's queued for deletion, and its key still needs rotating separately.

---

## 11. Cloud environment for Claude Code

1. claude.ai/code. Click the cloud button showing "Default", above the message box.
2. **Add cloud environment**. Name it `hoopoe-dr`.
3. Network access: **Custom**. Allowed domains: `<new-ref>.supabase.co` on its own line. Tick the box to also include the default package-manager list. Create.
4. Reopen it with the gear icon. **API credentials** only appears on an environment that already exists, which is why this is a second pass.
5. **Add credential.** Type Bearer. Allowed websites: `<new-ref>.supabase.co`. Custom header: name `Authorization`, prefix `Bearer`, value = service_role key. Save. You can't view it again afterwards.
6. If you skipped step 10, add `ANTHROPIC_API_KEY=...` under Environment variables. Anyone using this environment can read it, so use a key you're willing to rotate.

**Check:** start a session in `hoopoe-dr` with the `hoopoe` repo attached and ask it to curl the dictionary row count. It should come back 2728 without you giving it any key.

---

## 12. Where this leaves you

Done: clean repo, clean database, dictionary migrated with ids intact, DR schema in place, snapshot taken, agent environment working.

Not done, and not startable yet: the DR batch runner itself. That's a build, so it needs a spec and your approval before any code gets written. Bring me the checks from steps 7, 9 and 11 and we'll scope it.

Also outstanding, unrelated to this runbook: rotate the ElevenLabs key sitting in `arabic-app` git history.

---

## If something goes wrong

- **Anything in steps 5 to 7.** The old project is untouched and read-only. Drop the new tables, redo the migration, copy again. Nothing is lost.
- **After step 8.** `dict-preDR.sql` restores the dictionary to exactly its pre-DR state.
- **Password lost.** Project Settings, Database, Reset database password. The connection strings change, the data doesn't.
