import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';

const dbPath = process.env.DATABASE_PATH || './data/marinebio.db';
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'CONTRIBUTOR' CHECK(role IN ('CONTRIBUTOR', 'ADMIN')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS organisms (
      id TEXT PRIMARY KEY,
      common_name TEXT NOT NULL,
      scientific_name TEXT NOT NULL,
      kingdom TEXT,
      phylum TEXT,
      class_name TEXT,
      order_name TEXT,
      family TEXT,
      genus TEXT,
      species TEXT,
      description TEXT,
      habitat TEXT,
      min_depth_m REAL,
      max_depth_m REAL,
      geographic_distribution TEXT,
      morphology TEXT,
      behavior TEXT,
      id_features TEXT,
      verification_status TEXT NOT NULL DEFAULT 'UNVERIFIED' CHECK(verification_status IN ('VERIFIED', 'UNVERIFIED', 'ARCHIVED')),
      created_by_user_id TEXT REFERENCES users(id),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      submission_type TEXT NOT NULL DEFAULT 'DISCOVERY' CHECK(submission_type IN ('DISCOVERY', 'IDENTIFY_REQUEST')),
      title TEXT,
      suspected_common_name TEXT,
      suspected_scientific_name TEXT,
      observation_location TEXT,
      observation_date TEXT,
      depth_meters REAL,
      habitat_notes TEXT,
      contributor_notes TEXT,
      contributor_attribution TEXT,
      source_url TEXT,
      owns_media INTEGER NOT NULL DEFAULT 1,
      original_source TEXT,
      attribution_name TEXT,
      public_display_permission INTEGER NOT NULL DEFAULT 0,
      ai_reference_permission INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'PENDING_REVIEW' CHECK(status IN ('PENDING_REVIEW', 'NEEDS_CLARIFICATION', 'UNKNOWN', 'APPROVED', 'REJECTED')),
      reviewer_notes TEXT,
      resolved_organism_id TEXT REFERENCES organisms(id),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY,
      submission_id TEXT REFERENCES submissions(id) ON DELETE SET NULL,
      organism_id TEXT REFERENCES organisms(id) ON DELETE SET NULL,
      file_path TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      file_type TEXT NOT NULL CHECK(file_type IN ('image', 'video')),
      file_size INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      original_source_url TEXT,
      source_organization TEXT,
      creator_name TEXT,
      copyright_holder TEXT,
      license_type TEXT NOT NULL DEFAULT 'Contributor Owned',
      attribution_text TEXT,
      owns_media INTEGER NOT NULL DEFAULT 1,
      public_display_permission INTEGER NOT NULL DEFAULT 0,
      ai_reference_permission INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED')),
      is_primary INTEGER NOT NULL DEFAULT 0,
      category TEXT DEFAULT 'In Situ / Live Organism',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS media_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      display_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
      reviewer_id TEXT NOT NULL REFERENCES users(id),
      action TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_organisms_scientific_name ON organisms(scientific_name);
    CREATE INDEX IF NOT EXISTS idx_organisms_common_name ON organisms(common_name);
    CREATE INDEX IF NOT EXISTS idx_organisms_status ON organisms(verification_status);
    CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
    CREATE INDEX IF NOT EXISTS idx_media_organism_id ON media(organism_id);
    CREATE INDEX IF NOT EXISTS idx_media_submission_id ON media(submission_id);
    CREATE INDEX IF NOT EXISTS idx_media_status ON media(status);
  `);

  // Safe migration for existing media table
  try {
    db.exec("ALTER TABLE media ADD COLUMN category TEXT DEFAULT 'In Situ / Live Organism'");
  } catch {
    // Column already exists
  }

  // Populate default media categories if table is empty
  const catCount = (db.prepare('SELECT COUNT(*) as count FROM media_categories').get() as { count: number }).count;
  if (catCount === 0) {
    const insertCat = db.prepare('INSERT INTO media_categories (id, name, description, display_order) VALUES (?, ?, ?, ?)');
    const defaultCats = [
      { id: 'in_situ', name: 'In Situ / Live Organism', desc: 'Living specimen observed in its natural marine habitat', order: 1 },
      { id: 'morphology', name: 'Morphological Detail', desc: 'Close-up of anatomical features, fins, tentacles, or textures', order: 2 },
      { id: 'behavior', name: 'Behavior & Interaction', desc: 'Feeding, swimming, mating, defense, or symbiotic behavior', order: 3 },
      { id: 'habitat', name: 'Habitat & Environment', desc: 'Surrounding reef, seafloor, or water column context', order: 4 },
      { id: 'life_stage', name: 'Egg / Larval / Juvenile', desc: 'Early developmental or juvenile life cycle stages', order: 5 },
      { id: 'specimen', name: 'Specimen / Microscopic', desc: 'Collected research specimen or microscopic imaging', order: 6 },
    ];
    for (const c of defaultCats) {
      insertCat.run(c.id, c.name, c.desc, c.order);
    }
  }

  // Optional automatic bootstrap of initial administrator ONLY if explicitly configured in env and no admin exists
  const initialEmail = process.env.INITIAL_ADMIN_EMAIL;
  const initialPassword = process.env.INITIAL_ADMIN_PASSWORD;

  const adminCount = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'ADMIN'").get() as { count: number }).count;

  if (adminCount === 0 && initialEmail && initialPassword) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(initialEmail.toLowerCase().trim());
    const now = new Date().toISOString();
    const id = 'admin_' + Math.random().toString(36).substring(2, 10);
    const passwordHash = bcrypt.hashSync(initialPassword, 10);

    if (!existing) {
      db.prepare(`
        INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'ADMIN', ?, ?)
      `).run(id, initialEmail.toLowerCase().trim(), passwordHash, 'Marine Bio Administrator', now, now);
      console.log(`[Database] Initial administrator provisioned for: ${initialEmail}`);
    } else {
      db.prepare("UPDATE users SET role = 'ADMIN', updated_at = ? WHERE email = ?").run(now, initialEmail.toLowerCase().trim());
      console.log(`[Database] Granted ADMIN role to existing user: ${initialEmail}`);
    }
  }

  // Double check library data rule: exactly 0 organisms, 0 media records, 0 dummy data
  const orgCount = (db.prepare('SELECT COUNT(*) as count FROM organisms').get() as { count: number }).count;
  const mediaCount = (db.prepare('SELECT COUNT(*) as count FROM media').get() as { count: number }).count;
  console.log(`[Database] Initialized. Current verified organisms: ${orgCount}, Approved media records: ${mediaCount}`);
}
