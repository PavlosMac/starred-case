# Keymap Profiles Architecture Overview

## Purpose

Allows users to customize keyboard shortcuts for application functions. The system provides defaults (static actions (video control, table navigation, some PATCH actions) + dynamic species mappings), and users can override keys. Supports i18n with language-specific species display names.

---

## Technical Summary

### Problem Statement

Users need to customize keyboard shortcuts while the system must:
- Maintain system defaults that can evolve independently
- Support incremental updates (PATCH semantics, not full replacement)
- Track which mappings are user-customized vs system defaults
- Serve responses in the user's preferred language
- Perform efficiently at scale
- Allow extension of the keymaps object, e.g organisation level kepmaps

### Key Technical Decisions

| Challenge | Solution |
|-----------|----------|
| **Merge complexity** | Two-layer merge: Layer 1 (PATCH → user DB) + Layer 2 (GET → system + user) |
| **Change tracking** | `source` field (`system` / `user_override` / `user_custom`) computed at read-time |
| **i18n at scale** | Per-language Redis cache keys; translations resolved once, cached 8 days |
| **Race conditions** | Atomic `find_one_and_update` with `upsert=True` |
| **Cache consistency** | Wildcard invalidation (`user:id:keymap:*`) on any write |
| **Dynamic species** | Composed at runtime from species collection, not pre-stored |

### Stack

**FastAPI** (async Python) → **MongoDB** (persistence) → **Redis** (caching)

Clean architecture: Router → Service → Repository layers

---

## Architecture Diagrams

### 1. High-Level Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              KEYMAP PROFILES SYSTEM                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────┐     ┌──────────────────────────────────────────────────────┐  │
│  │   CLIENT    │     │                    FASTAPI LAYER                      │  │
│  │  (Frontend) │     │  ┌────────────────┐      ┌─────────────────────────┐ │  │
│  │             │────▶│  │  users_router  │      │  keymap_profiles_router │ │  │
│  │  Language:  │     │  │                │      │                         │ │  │
│  │  Accept-    │     │  │ GET/PATCH/DEL  │      │  GET /keymaps/functions │ │  │
│  │  Language   │     │  │ /users/{id}/   │      │                         │ │  │
│  │  header     │     │  │    keymap      │      │                         │ │  │
│  └─────────────┘     │  └───────┬────────┘      └────────────┬────────────┘ │  │
│                      └──────────┼────────────────────────────┼──────────────┘  │
│                                 │                            │                 │
│                                 ▼                            ▼                 │
│                      ┌──────────────────────────────────────────────────────┐  │
│                      │              SERVICE LAYER (Business Logic)           │  │
│                      │                                                       │  │
│                      │  ┌─────────────────────────────────────────────────┐ │  │
│                      │  │           KeymapProfilesService                 │ │  │
│                      │  │                                                 │ │  │
│                      │  │  • get_resolved_keymaps()    ─── Two-Layer     │ │  │
│                      │  │  • update_user_keymaps()     ─── Merge Logic   │ │  │
│                      │  │  • _merge_keymaps()          ─── Source Field  │ │  │
│                      │  │  • _enrich_with_translations()                 │ │  │
│                      │  └─────────────────────────────────────────────────┘ │  │
│                      └───────────────┬───────────────────────────────────────┘  │
│                                      │                                         │
│        ┌─────────────────────────────┼─────────────────────────────┐           │
│        │                             │                             │           │
│        ▼                             ▼                             ▼           │
│  ┌───────────┐              ┌─────────────────┐           ┌─────────────────┐  │
│  │   REDIS   │              │     MONGODB     │           │     MONGODB     │  │
│  │   CACHE   │              │   keymap_       │           │     species     │  │
│  │           │              │   profiles      │           │   (translations)│  │
│  │ Per-lang  │              │                 │           │                 │  │
│  │ 8-day TTL │              │ • system (1)    │           │ • name (en)     │  │
│  │           │              │ • user (N)      │           │ • translations  │  │
│  │ user:id:  │              │                 │           │   {sv, no, ...} │  │
│  │ keymap:sv │              │                 │           │                 │  │
│  └───────────┘              └─────────────────┘           └─────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2. GET Request Flow (Read Path with Cache + Two-Layer Merge)

```
   CLIENT                  ROUTER               SERVICE                 CACHE              MONGODB
     │                       │                     │                      │                   │
     │  GET /users/123/      │                     │                      │                   │
     │  keymap               │                     │                      │                   │
     │  Accept-Language: sv  │                     │                      │                   │
     │──────────────────────▶│                     │                      │                   │
     │                       │                     │                      │                   │
     │                       │ get_resolved_       │                      │                   │
     │                       │ keymaps(123, sv)    │                      │                   │
     │                       │────────────────────▶│                      │                   │
     │                       │                     │                      │                   │
     │                       │                     │  get_user_keymap     │                   │
     │                       │                     │  (123, "sv")         │                   │
     │                       │                     │─────────────────────▶│                   │
     │                       │                     │                      │                   │
     │                       │                     │◀─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│                   │
     │                       │                     │   HIT: Return cached │                   │
     │                       │                     │   MISS: Continue ──┐ │                   │
     │                       │                     │                    │ │                   │
     │                       │                     │                    ▼ │                   │
     │                       │                     │  ┌────────────────────────────────────┐  │
     │                       │                     │  │         CACHE MISS PATH            │  │
     │                       │                     │  │                                    │  │
     │                       │                     │  │ 1. Fetch system defaults (sv)  ───────▶│
     │                       │                     │  │    + compose species mappings     │  │
     │                       │                     │  │    with Swedish translations      │◀──│
     │                       │                     │  │                                    │  │
     │                       │                     │  │ 2. Fetch user overrides  ─────────────▶│
     │                       │                     │  │                                    │◀──│
     │                       │                     │  │                                    │  │
     │                       │                     │  │ 3. TWO-LAYER MERGE:               │  │
     │                       │                     │  │    ┌─────────────────────────┐    │  │
     │                       │                     │  │    │ _merge_keymaps()        │    │  │
     │                       │                     │  │    │                         │    │  │
     │                       │                     │  │    │ • User wins on key      │    │  │
     │                       │                     │  │    │   conflicts             │    │  │
     │                       │                     │  │    │ • Calculate source:     │    │  │
     │                       │                     │  │    │   system/user_override/ │    │  │
     │                       │                     │  │    │   user_custom           │    │  │
     │                       │                     │  │    │ • Track unmapped        │    │  │
     │                       │                     │  │    │   functions             │    │  │
     │                       │                     │  │    └─────────────────────────┘    │  │
     │                       │                     │  │                                    │  │
     │                       │                     │  │ 4. Cache result (8-day TTL)  ─────▶│  │
     │                       │                     │  │    key: user:123:keymap:sv        │  │
     │                       │                     │  └────────────────────────────────────┘  │
     │                       │                     │                      │                   │
     │                       │◀────────────────────│                      │                   │
     │                       │  ResolvedKeymapResponse                    │                   │
     │◀──────────────────────│  {resolved_mappings, unmapped_functions,   │                   │
     │   200 OK              │   level, user_has_customizations}          │                   │
     │                       │                     │                      │                   │
```

### 3. PATCH Request Flow (Write Path with Layer 1 Merge + Invalidation)

```
   CLIENT                  ROUTER               SERVICE               MONGODB              CACHE
     │                       │                     │                      │                   │
     │  PATCH /users/123/    │                     │                      │                   │
     │  keymap               │                     │                      │                   │
     │  {mappings: [...]}    │                     │                      │                   │
     │──────────────────────▶│                     │                      │                   │
     │                       │                     │                      │                   │
     │                       │ update_user_        │                      │                   │
     │                       │ keymaps(123, [...]) │                      │                   │
     │                       │────────────────────▶│                      │                   │
     │                       │                     │                      │                   │
     │                       │                     │  ┌────────────────────────────────────┐  │
     │                       │                     │  │      LAYER 1: USER-LEVEL MERGE    │  │
     │                       │                     │  │                                    │  │
     │                       │                     │  │ 1. Validate incoming:             │  │
     │                       │                     │  │    • No duplicate keys            │  │
     │                       │                     │  │    • No duplicate functions       │  │
     │                       │                     │  │    • Valid function_ids           │  │
     │                       │                     │  │                                    │  │
     │                       │                     │  │ 2. Fetch existing user mappings ─────▶│
     │                       │                     │  │                                    │◀──│
     │                       │                     │  │                                    │  │
     │                       │                     │  │ 3. Merge by key_combination:      │  │
     │                       │                     │  │    ┌─────────────────────────────┐│  │
     │                       │                     │  │    │ Existing: {"1": add_comment}││  │
     │                       │                     │  │    │ Incoming: {"2": validate}   ││  │
     │                       │                     │  │    │           ↓                 ││  │
     │                       │                     │  │    │ Merged: {"1": add_comment,  ││  │
     │                       │                     │  │    │         "2": validate}      ││  │
     │                       │                     │  │    │                             ││  │
     │                       │                     │  │    │ • New keys: added           ││  │
     │                       │                     │  │    │ • Existing: updated         ││  │
     │                       │                     │  │    │   (preserves created_at)    ││  │
     │                       │                     │  │    │ • Unlisted: unchanged       ││  │
     │                       │                     │  │    └─────────────────────────────┘│  │
     │                       │                     │  │                                    │  │
     │                       │                     │  │ 4. Atomic upsert ─────────────────────▶│
     │                       │                     │  │    find_one_and_update             │◀──│
     │                       │                     │  │    with upsert=True                │  │
     │                       │                     │  │    (prevents race conditions)      │  │
     │                       │                     │  │                                    │  │
     │                       │                     │  └────────────────────────────────────┘  │
     │                       │                     │                      │                   │
     │                       │                     │  5. Invalidate ALL language caches ─────▶│
     │                       │                     │     pattern: user:123:keymap:*          │
     │                       │                     │     (sv, en, no all deleted)            │
     │                       │                     │                      │                   │
     │                       │◀────────────────────│                      │                   │
     │◀──────────────────────│                     │                      │                   │
     │   204 No Content      │                     │                      │                   │
     │                       │                     │                      │                   │
     │   (Frontend should    │                     │                      │                   │
     │    revalidate with    │                     │                      │                   │
     │    GET request)       │                     │                      │                   │
```

### 4. Source Field Determination Logic

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         SOURCE FIELD DETERMINATION                              │
│                                                                                 │
│  For each user mapping, compare against system defaults to determine source:   │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                           │ │
│  │   User has mapping for key "X"                                           │ │
│  │              │                                                            │ │
│  │              ▼                                                            │ │
│  │   ┌─────────────────────────────┐                                        │ │
│  │   │ Does system have key "X"?   │                                        │ │
│  │   └──────────────┬──────────────┘                                        │ │
│  │          YES     │      NO                                                │ │
│  │    ┌─────────────┴─────────────┐                                         │ │
│  │    │                           │                                         │ │
│  │    ▼                           ▼                                         │ │
│  │  ┌─────────────────┐   ┌─────────────────────┐                          │ │
│  │  │ Does user       │   │                     │                          │ │
│  │  │ mapping EXACTLY │   │   "user_custom"     │                          │ │
│  │  │ match system?   │   │                     │                          │ │
│  │  │ (key + func +   │   │   Key doesn't exist │                          │ │
│  │  │  params)        │   │   in system.        │                          │ │
│  │  └────────┬────────┘   │   User added it.    │                          │ │
│  │     YES   │    NO      │                     │                          │ │
│  │  ┌────────┴────────┐   │   Frontend: Show    │                          │ │
│  │  │                 │   │   "Delete" button   │                          │ │
│  │  ▼                 ▼   └─────────────────────┘                          │ │
│  │ ┌────────┐  ┌─────────────────┐                                         │ │
│  │ │"system"│  │ "user_override" │                                         │ │
│  │ │        │  │                 │                                         │ │
│  │ │ Exact  │  │ Key exists in   │                                         │ │
│  │ │ match. │  │ system but user │                                         │ │
│  │ │ Treated│  │ changed func or │                                         │ │
│  │ │ as     │  │ params.         │                                         │ │
│  │ │ default│  │                 │                                         │ │
│  │ │        │  │ Frontend: Show  │                                         │ │
│  │ │ No UI  │  │ "Reset" button  │                                         │ │
│  │ │ action │  │                 │                                         │ │
│  │ └────────┘  └─────────────────┘                                         │ │
│  │                                                                           │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  EXAMPLES:                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │ System: {"1": set_species(salmon)}   User: {"1": set_species(salmon)}     ││
│  │ Result: source = "system" (exact match → treated as default)              ││
│  ├────────────────────────────────────────────────────────────────────────────┤│
│  │ System: {"1": set_species(salmon)}   User: {"1": set_species(trout)}      ││
│  │ Result: source = "user_override" (same key, different params)             ││
│  ├────────────────────────────────────────────────────────────────────────────┤│
│  │ System: (no key "888")               User: {"888": validate}              ││
│  │ Result: source = "user_custom" (new key not in system)                    ││
│  └────────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5. Language-Aware Caching Strategy (i18n)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      LANGUAGE-AWARE CACHING STRATEGY                            │
│                                                                                 │
│  Problem: Species names need translation per user's language preference.        │
│                                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │                         SPECIES COLLECTION                                 ││
│  │  {                                                                         ││
│  │    species_id: "123",                                                      ││
│  │    name: "Salmon",           ◀── English canonical name                    ││
│  │    default_sort_key: 1,      ◀── Key "1" by default                        ││
│  │    translations: {                                                         ││
│  │      sv: "Lax",              ◀── Swedish                                   ││
│  │      no: "Laks",             ◀── Norwegian                                 ││
│  │      fi: "Lohi"              ◀── Finnish                                   ││
│  │    }                                                                       ││
│  │  }                                                                         ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                 │
│  Solution: Per-language cache keys with fully resolved translations.            │
│                                                                                 │
│        ┌──────────────────────────────────────────────────────────────────┐    │
│        │                    REDIS CACHE STRUCTURE                         │    │
│        │                                                                  │    │
│        │   user:123:keymap:en ──▶ {...display_name: "Salmon"...}         │    │
│        │   user:123:keymap:sv ──▶ {...display_name: "Lax"...}            │    │
│        │   user:123:keymap:no ──▶ {...display_name: "Laks"...}           │    │
│        │                                                                  │    │
│        │   TTL: 8 days (691,200 seconds)                                 │    │
│        └──────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│  Cache Invalidation (on PATCH/DELETE):                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │                                                                            ││
│  │   pattern: user:123:keymap:*   ◀── Wildcard matches ALL languages         ││
│  │                                                                            ││
│  │   SCAN + DELETE:                                                           ││
│  │   ┌────────────────────────┐                                               ││
│  │   │ user:123:keymap:en  ✗  │                                               ││
│  │   │ user:123:keymap:sv  ✗  │  All deleted                                  ││
│  │   │ user:123:keymap:no  ✗  │                                               ││
│  │   └────────────────────────┘                                               ││
│  │                                                                            ││
│  │   Next GET in any language triggers fresh merge + cache rebuild           ││
│  │                                                                            ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                 │
│  Benefits:                                                                      │
│  • No re-translation on cache hit (~99% of requests)                           │
│  • Single invalidation clears all language variants                            │
│  • Cache stores fully resolved response (ready to return)                      │
│  • Language isolated: Swedish user's change doesn't affect English cache       │
│    for same user                                                               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 6. Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           COMPLETE DATA FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   READ PATH (GET)                        WRITE PATH (PATCH/DELETE)              │
│   ═══════════════                        ════════════════════════               │
│                                                                                 │
│   ┌─────────┐                            ┌─────────┐                           │
│   │ Request │                            │ Request │                           │
│   └────┬────┘                            └────┬────┘                           │
│        │                                      │                                 │
│        ▼                                      ▼                                 │
│   ┌─────────────┐                        ┌─────────────┐                       │
│   │Check Cache  │                        │ Validate    │                       │
│   │user:id:     │                        │ Input       │                       │
│   │keymap:lang  │                        │             │                       │
│   └──────┬──────┘                        └──────┬──────┘                       │
│      HIT │ MISS                                 │                               │
│    ┌─────┴─────┐                                ▼                               │
│    │           │                         ┌─────────────┐                       │
│    ▼           ▼                         │LAYER 1 MERGE│                       │
│ ┌──────┐ ┌──────────┐                    │ (User DB)   │                       │
│ │Return│ │Fetch from│                    │             │                       │
│ │cached│ │ MongoDB  │                    │ Existing +  │                       │
│ └──────┘ │          │                    │ Incoming =  │                       │
│          │ • system │                    │ Merged      │                       │
│          │ • user   │                    └──────┬──────┘                       │
│          │ • species│                           │                               │
│          └────┬─────┘                           ▼                               │
│               │                          ┌─────────────┐                       │
│               ▼                          │Atomic Upsert│                       │
│        ┌─────────────┐                   │ MongoDB     │                       │
│        │LAYER 2 MERGE│                   └──────┬──────┘                       │
│        │(Read-time)  │                          │                               │
│        │             │                          ▼                               │
│        │ System +    │                   ┌─────────────┐                       │
│        │ User =      │                   │ Invalidate  │                       │
│        │ Resolved    │                   │ Cache       │                       │
│        │             │                   │ user:id:    │                       │
│        │ + source    │                   │ keymap:*    │                       │
│        │ + unmapped  │                   └──────┬──────┘                       │
│        └──────┬──────┘                          │                               │
│               │                                 ▼                               │
│               ▼                          ┌─────────────┐                       │
│        ┌─────────────┐                   │ 204 No      │                       │
│        │Enrich with  │                   │ Content     │                       │
│        │translations │                   └─────────────┘                       │
│        └──────┬──────┘                                                         │
│               │                                                                 │
│               ▼                                                                 │
│        ┌─────────────┐                                                         │
│        │Cache Result │                                                         │
│        │TTL: 8 days  │                                                         │
│        └──────┬──────┘                                                         │
│               │                                                                 │
│               ▼                                                                 │
│        ┌─────────────┐                                                         │
│        │ 200 OK      │                                                         │
│        │ Response    │                                                         │
│        └─────────────┘                                                         │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Two-Layer Merge Architecture

### Layer 1: User-Level Merge (on PATCH)

When a user updates their keymap, incoming mappings are **merged** with existing user mappings:

- New keys → Added
- Existing keys → Updated (preserves `created_at`)
- Unlisted keys → Preserved unchanged

**Location**: `update_user_keymaps()` in `keymap_profiles_service.py`

```
Existing User DB: [{"key": "1", "func": "add_comment"}]
Incoming PATCH:   [{"key": "2", "func": "validate"}]
                         ↓ User-Level Merge
Result (stored):  [{"key": "1", "func": "add_comment"},
                   {"key": "2", "func": "validate"}]
```

### Layer 2: System-Level Merge (on GET)

At read-time, system defaults are merged with user overrides:

- User mappings **win** over system defaults for the same key
- System functions that lose their key go into `unmapped_functions`
- Each mapping gets a `source` field: `"system"`, `"user_override"`, or `"user_custom"`

**Location**: `_merge_keymaps()` in `keymap_profiles_service.py`

```
System Defaults:  [{"key": "k", "func": "add_comment"},
                   {"key": "1", "func": "set_species", "params": {"id": "123"}}]
User Overrides:   [{"key": "1", "func": "add_comment"},
                   {"key": "2", "func": "validate"}]
                         ↓ System-Level Merge
Resolved:         [{"key": "k" → removed (conflict)},
                   {"key": "1", "func": "add_comment"},  ← User wins
                   {"key": "2", "func": "validate"},
                   ...system defaults...]
Unmapped:         [{"key": "1", "func": "set_species"}]  ← Lost its key
```

## API Endpoints

| Endpoint | Method | Description | Response |
|----------|--------|-------------|----------|
| `/users/{id}/keymap` | GET | Get resolved keymap (system + user merged) | 200 + `ResolvedKeymapResponse` |
| `/users/{id}/keymap` | PATCH | Update user keymap (merge semantics) | 204 No Content |
| `/users/{id}/keymap` | DELETE | Reset all to system defaults | 204 No Content |
| `/users/{id}/keymap/{key}` | DELETE | Delete single key mapping | 204 No Content |
| `/keymaps/functions` | GET | List available functions | 200 + `AvailableFunctionsResponse` |

**Authorization**: Editor role only, users can only access their own keymaps.

## Storage

### MongoDB (`keymap_profiles` collection)

**System Defaults** (1 document):
```js
{
  level: "system",
  entity_id: null,
  mappings: [
    {key_combination: "k", function_id: "add_comment", params: {}},
    // 14 static mappings + runtime-composed species mappings
  ]
}
```

**User Overrides** (1 per user):
```js
{
  level: "user",
  entity_id: ObjectId("user_id"),
  is_active: true,
  mappings: [
    {key_combination: "1", function_id: "add_comment", params: {},
     created_at: ISODate, modified_at: ISODate}
  ],
  version: 1
}
```

**Unique Index**: `{level: 1, entity_id: 1, is_active: 1}` - Ensures one active keymap per user.

### Redis Cache

The `KeymapCache` class (`cache_manager.py`) handles caching with language-specific keys.

#### Cache Key Structure
```
user:{user_id}:keymap:{language}
```
Example: `user:68494ed7384ec13e00b23456:keymap:sv`

#### Configuration
- **TTL**: 691,200 seconds (8 days)
- **Version**: `v3` (bumped when cache structure changes)

#### Cache Operations

| Method | When Called | What It Does |
|--------|-------------|--------------|
| `get_user_keymap(user_id, lang)` | On GET request | Returns cached `ResolvedKeymapResponse` or `None` |
| `set_user_keymap(user_id, lang, data)` | After cache miss | Stores fully resolved keymap with 8-day TTL |
| `invalidate_user_keymap(user_id)` | On PATCH/DELETE | Deletes **all language caches** for user |

#### Cache Flow

```
GET /users/{id}/keymap
    │
    ├─► Check Redis: user:{id}:keymap:{lang}
    │
    ├─► Cache HIT ──► Return cached ResolvedKeymapResponse
    │
    └─► Cache MISS
            │
            ├─► Fetch system defaults from MongoDB
            ├─► Fetch user overrides from MongoDB
            ├─► Merge (Layer 2)
            ├─► Enrich with translations
            ├─► Store in Redis (TTL: 8 days)
            └─► Return response
```

#### Why Per-Language Caching?

Species mappings have translated `display_name` values. A Swedish user sees `"Lax"` while an English user sees `"Salmon"`. The cache stores the **fully resolved** response including translations, so each language needs its own cache entry.

#### Invalidation

On PATCH or DELETE, **all** language caches for the user are invalidated:

```python
pattern = f"user:{user_id}:keymap:*"  # Matches all languages
keys_to_delete = await RedisClient.scan_keys(pattern)
await RedisClient.delete_many(keys_to_delete)
```

## Key Behaviors

### 1. PATCH Accumulates

Sequential PATCH requests **accumulate** mappings:
```
State: []
PATCH [{"key": "1", "func": "add_comment"}]    → Result: ["1"]
PATCH [{"key": "2", "func": "validate"}]       → Result: ["1", "2"]  ← Merged!
PATCH [{"key": "1", "func": "set_size"}]       → Result: ["1"*, "2"] ← Updated!
```

### 2. Source Field Logic

Each mapping in `resolved_mappings` includes a `source` field:

| Source | Meaning | Frontend Action |
|--------|---------|-----------------|
| `system` | Mapping matches system default exactly (key + function + params) | No action button needed |
| `user_override` | User changed a key that exists in system defaults | Show "reset to default" button |
| `user_custom` | User added a key not in system defaults | Show "delete" button |

**Examples:**

```
# system - exact match with system default
System: {"key": "1", "func": "set_species", "params": {"species_id": "123"}}
User:   {"key": "1", "func": "set_species", "params": {"species_id": "123"}}
Result: source = "system"

# user_override - same key, different function/params
System: {"key": "1", "func": "set_species", "params": {"species_id": "123"}}
User:   {"key": "1", "func": "set_species", "params": {"species_id": "456"}}
Result: source = "user_override"

# user_custom - key doesn't exist in system
System: (no key "888")
User:   {"key": "888", "func": "validate", "params": {}}
Result: source = "user_custom"
```

### 3. Unique Function Enforcement

Same function can't map to multiple keys. If user maps same function to new key, old key is removed:
```
System: {"key": "1", "func": "set_species", "params": {"id": "123"}}
User:   {"key": "q", "func": "set_species", "params": {"id": "123"}}
Result: Only "q" has set_species(123), "1" is freed
```

### 4. Unmapped Functions

System functions that **lost their keys** due to user overrides:
```
System: "k" → add_comment, "1" → set_species(Salmon)
User:   "1" → add_comment
Result:
  - resolved_mappings: ["1" → add_comment (source: user_override), ...other system defaults]
  - unmapped_functions: [set_species(Salmon) with source: "system"]
```

Frontend can display these for user to reassign.

### 5. Atomic Operations

Uses `find_one_and_update` with `upsert=True` to prevent race conditions with concurrent PATCH requests.

### 6. Species Enrichment

Species mappings get translated `display_name` based on user's language preference:
```js
// From species collection
{species_id: "123", keynum: 1, name: "Salmon",
 translations: {en: "Salmon", sv: "Lax", no: "Laks"}}

// Becomes (for Swedish user)
{key: "1", func: "set_species", params: {species_id: "123",
         species_name: "Salmon", display_name: "Lax"}}
```

## DELETE Behavior

**DELETE /users/{id}/keymap (Reset All)**:
- Deletes MongoDB user document
- Invalidates Redis cache (all languages)
- Returns 204 No Content
- Frontend revalidates → GET rebuilds cache with system defaults
- Idempotent (succeeds even if no customizations exist)

**DELETE /users/{id}/keymap/{key} (Delete Single Key)**:
- If key is `user_override`: Reverts to system default (source becomes "system")
- If key is `user_custom`: Removes entirely
- If last key deleted: Deletes entire user document
- Returns 204 No Content

## File Structure

```
keymap_profiles/
├── keymap_profiles_router.py      # Routes for /keymaps/functions
├── keymap_profiles_service.py     # Business logic (merge, validation)
├── keymap_profiles_repository.py  # DB access (MongoDB operations)
└── keymap_profiles_schema.py      # Pydantic models (request/response)

users/
└── users_router.py                # Routes for /users/{id}/keymap

core/cache/
└── cache_manager.py               # KeymapCache class (Redis operations)
```

## Performance

- **Redis Cache**: 8-day TTL reduces DB reads by ~99%
- **Species Composition**: Dynamic (not pre-stored), ensures species list always current
- **Cache Invalidation**: Only on PATCH/DELETE, not GET
- **Per-Language Caching**: Avoids re-translation on each request
- **Atomic Upsert**: Single DB round-trip, no read-then-write race conditions
