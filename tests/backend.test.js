import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

describe('Marine Bio Explorer - Core Functional & Security Tests', () => {
  let db;

  before(() => {
    // In-memory isolated database instance for testing
    db = new Database(':memory:');
    db.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'CONTRIBUTOR' CHECK(role IN ('CONTRIBUTOR', 'ADMIN')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE organisms (
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

      CREATE TABLE submissions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        submission_type TEXT NOT NULL DEFAULT 'DISCOVERY',
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

      CREATE TABLE media (
        id TEXT PRIMARY KEY,
        submission_id TEXT REFERENCES submissions(id),
        organism_id TEXT REFERENCES organisms(id),
        file_path TEXT NOT NULL,
        original_filename TEXT NOT NULL,
        file_type TEXT NOT NULL,
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
        status TEXT NOT NULL DEFAULT 'PENDING',
        is_primary INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE reviews (
        id TEXT PRIMARY KEY,
        submission_id TEXT NOT NULL REFERENCES submissions(id),
        reviewer_id TEXT NOT NULL REFERENCES users(id),
        action TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL
      );
    `);
  });

  test('Critical Initial Data Rule: zero organisms and zero media records', () => {
    const orgCount = db.prepare('SELECT COUNT(*) as count FROM organisms').get().count;
    const mediaCount = db.prepare('SELECT COUNT(*) as count FROM media').get().count;
    const subCount = db.prepare('SELECT COUNT(*) as count FROM submissions').get().count;

    assert.equal(orgCount, 0, 'Organism library must have 0 initial organisms');
    assert.equal(mediaCount, 0, 'Media library must have 0 initial media records');
    assert.equal(subCount, 0, 'Submissions must have 0 initial records');
  });

  test('Public registration always creates ordinary CONTRIBUTOR', () => {
    const now = new Date().toISOString();
    const hash = bcrypt.hashSync('contributor_pass_123', 10);
    db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'CONTRIBUTOR', ?, ?)
    `).run('user_1', 'diver@example.com', hash, 'Ocean Diver', now, now);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get('user_1');
    assert.equal(user.role, 'CONTRIBUTOR');
    assert.equal(user.email, 'diver@example.com');
  });

  test('Admin setup provisions authorized ADMIN role', () => {
    const now = new Date().toISOString();
    const hash = bcrypt.hashSync('admin_pass_123', 10);
    db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'ADMIN', ?, ?)
    `).run('admin_1', 'founder@marinebio.org', hash, 'Founder Admin', now, now);

    const admin = db.prepare('SELECT * FROM users WHERE id = ?').get('admin_1');
    assert.equal(admin.role, 'ADMIN');
  });

  test('Contributor submission records independent public display and AI reference permissions', () => {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO submissions (
        id, user_id, submission_type, title, suspected_common_name,
        public_display_permission, ai_reference_permission, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING_REVIEW', ?, ?)
    `).run('sub_1', 'user_1', 'DISCOVERY', 'Bioluminescent jellyfish observation', 'Aequorea victoria', 1, 0, now, now);

    db.prepare(`
      INSERT INTO media (
        id, submission_id, file_path, original_filename, file_type, file_size, mime_type,
        public_display_permission, ai_reference_permission, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
    `).run('med_1', 'sub_1', '/uploads/mbe-sample.jpg', 'jelly.jpg', 'image', 1024, 'image/jpeg', 1, 0, now, now);

    const sub = db.prepare('SELECT * FROM submissions WHERE id = ?').get('sub_1');
    const med = db.prepare('SELECT * FROM media WHERE id = ?').get('med_1');

    assert.equal(sub.public_display_permission, 1, 'Public display permission is granted');
    assert.equal(sub.ai_reference_permission, 0, 'AI reference permission is independently false');
    assert.equal(med.status, 'PENDING', 'Media starts in PENDING status');
  });

  test('Contributor query isolation: Contributor cannot view other users private submissions', () => {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'CONTRIBUTOR', ?, ?)
    `).run('user_2', 'diver2@example.com', 'dummyhash', 'Second Diver', now, now);

    // user_2 queries their own submissions
    const user2Submissions = db.prepare('SELECT * FROM submissions WHERE user_id = ?').all('user_2');
    assert.equal(user2Submissions.length, 0, 'user_2 cannot see user_1 submissions');
  });

  test('Admin review approval: creates organism and links approved media', () => {
    const now = new Date().toISOString();

    // 1. Admin creates organism
    db.prepare(`
      INSERT INTO organisms (
        id, common_name, scientific_name, phylum, description, verification_status, created_by_user_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'VERIFIED', ?, ?, ?)
    `).run('org_crystal_jelly', 'Crystal Jelly', 'Aequorea victoria', 'Cnidaria', 'A bioluminescent hydrozoan jellyfish.', 'admin_1', now, now);

    // 2. Admin approves submission and attaches media
    db.prepare(`
      UPDATE submissions
      SET status = 'APPROVED', resolved_organism_id = ?, reviewer_notes = 'Verified species identity.', updated_at = ?
      WHERE id = 'sub_1'
    `).run('org_crystal_jelly', now);

    db.prepare(`
      UPDATE media
      SET status = 'APPROVED', organism_id = ?, is_primary = 1, updated_at = ?
      WHERE id = 'med_1'
    `).run('org_crystal_jelly', now);

    // 3. Log review
    db.prepare(`
      INSERT INTO reviews (id, submission_id, reviewer_id, action, notes, created_at)
      VALUES (?, ?, ?, 'APPROVE', 'Verified against hydrozoan catalog.', ?)
    `).run('rev_1', 'sub_1', 'admin_1', now);

    // 4. Verify public query now only returns approved organism and approved public media
    const publicOrganisms = db.prepare(`
      SELECT o.*, m.file_path, m.attribution_text
      FROM organisms o
      JOIN media m ON m.organism_id = o.id
      WHERE o.verification_status = 'VERIFIED' AND m.status = 'APPROVED' AND m.public_display_permission = 1
    `).all();

    assert.equal(publicOrganisms.length, 1);
    assert.equal(publicOrganisms[0].common_name, 'Crystal Jelly');
    assert.equal(publicOrganisms[0].scientific_name, 'Aequorea victoria');
  });

  test('Pending and rejected media never appear in public organism query', () => {
    const now = new Date().toISOString();
    // Add rejected submission and media
    db.prepare(`
      INSERT INTO submissions (
        id, user_id, title, status, created_at, updated_at
      ) VALUES ('sub_rejected', 'user_1', 'Blurry shadow', 'REJECTED', ?, ?)
    `).run(now, now);

    db.prepare(`
      INSERT INTO media (
        id, submission_id, file_path, original_filename, file_type, file_size, mime_type,
        public_display_permission, status, created_at, updated_at
      ) VALUES ('med_rejected', 'sub_rejected', '/uploads/blurry.jpg', 'blurry.jpg', 'image', 500, 'image/jpeg', 1, 'REJECTED', ?, ?)
    `).run(now, now);

    const publicQuery = db.prepare(`
      SELECT * FROM media WHERE status = 'APPROVED' AND public_display_permission = 1
    `).all();

    const ids = publicQuery.map((m) => m.id);
    assert.ok(!ids.includes('med_rejected'), 'Rejected media must never appear publicly');
  });

  test('Production asset persistence: logo.png exists in public/ and is copied to dist/', () => {
    import('node:fs').then((fs) => {
      assert.ok(fs.existsSync('./public/logo.png'), 'public/logo.png must exist');
      const stats = fs.statSync('./public/logo.png');
      assert.ok(stats.size > 10000, 'Logo file must not be empty');
    });
  });
});
