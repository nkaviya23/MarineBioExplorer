import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from './db.js';
import {
  getUserFromRequest,
  requireAuth,
  requireAdmin,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  hasAnyAdmin,
  getAdminSetupSecret,
} from './auth.js';
import { uploadMiddleware, storageService } from './storage.js';

export const apiRouter = express.Router();

// -------------------------------------------------------------
// Health & System
// -------------------------------------------------------------
apiRouter.get('/health', (_req, res) => {
  const orgCount = (db.prepare("SELECT COUNT(*) as count FROM organisms WHERE verification_status != 'ARCHIVED'").get() as { count: number }).count;
  const mediaCount = (db.prepare("SELECT COUNT(*) as count FROM media WHERE status = 'APPROVED' AND public_display_permission = 1").get() as { count: number }).count;
  const adminExists = hasAnyAdmin();

  res.json({
    status: 'ok',
    organismsCount: orgCount,
    mediaCount: mediaCount,
    hasAdmin: adminExists,
    emptyByDefault: orgCount === 0 && mediaCount === 0,
  });
});

apiRouter.get('/admin/setup-status', (_req, res) => {
  res.json({
    hasAdmin: hasAnyAdmin(),
  });
});

// Initial Administrator Setup
apiRouter.post('/admin/setup', (req, res) => {
  const { email, password, fullName, setupSecret } = req.body;

  if (!email || !password || !fullName || !setupSecret) {
    res.status(400).json({ error: 'All fields (email, password, full name, setup secret) are required.' });
    return;
  }

  const expectedSecret = getAdminSetupSecret();
  if (setupSecret.trim() !== expectedSecret.trim()) {
    res.status(403).json({ error: 'Invalid administrator setup secret key.' });
    return;
  }

  const trimmedEmail = email.toLowerCase().trim();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(trimmedEmail) as { id: string } | undefined;
  const now = new Date().toISOString();

  if (existing) {
    // Elevate existing user
    const passwordHash = bcrypt.hashSync(password, 10);
    db.prepare(`
      UPDATE users SET role = 'ADMIN', password_hash = ?, full_name = ?, updated_at = ?
      WHERE id = ?
    `).run(passwordHash, fullName.trim(), now, existing.id);

    const token = createSessionToken(existing.id, 'ADMIN');
    setSessionCookie(res, token);
    res.json({
      success: true,
      message: 'Account successfully configured as Administrator.',
      user: { id: existing.id, email: trimmedEmail, full_name: fullName.trim(), role: 'ADMIN' },
    });
    return;
  }

  const newId = 'adm_' + Math.random().toString(36).substring(2, 10);
  const passwordHash = bcrypt.hashSync(password, 10);

  db.prepare(`
    INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'ADMIN', ?, ?)
  `).run(newId, trimmedEmail, passwordHash, fullName.trim(), now, now);

  const token = createSessionToken(newId, 'ADMIN');
  setSessionCookie(res, token);

  res.json({
    success: true,
    message: 'Administrator account successfully initialized.',
    user: { id: newId, email: trimmedEmail, full_name: fullName.trim(), role: 'ADMIN' },
  });
});

// -------------------------------------------------------------
// Authentication (Contributor & Admin)
// -------------------------------------------------------------

// Contributor Registration - Strictly restricted to CONTRIBUTOR role
apiRouter.post('/auth/register', (req, res) => {
  const { email, password, fullName } = req.body;

  if (!email || !password || !fullName) {
    res.status(400).json({ error: 'Full name, email, and password are required.' });
    return;
  }

  const trimmedEmail = email.toLowerCase().trim();
  if (!trimmedEmail.includes('@') || trimmedEmail.length < 5) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(trimmedEmail);
  if (existing) {
    res.status(409).json({ error: 'An account with this email address already exists. Please log in.' });
    return;
  }

  const userId = 'usr_' + Math.random().toString(36).substring(2, 10);
  const passwordHash = bcrypt.hashSync(password, 10);
  const now = new Date().toISOString();

  // Public registration ALWAYS assigns role CONTRIBUTOR
  db.prepare(`
    INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'CONTRIBUTOR', ?, ?)
  `).run(userId, trimmedEmail, passwordHash, fullName.trim(), now, now);

  const token = createSessionToken(userId, 'CONTRIBUTOR');
  setSessionCookie(res, token);

  res.status(201).json({
    user: {
      id: userId,
      email: trimmedEmail,
      full_name: fullName.trim(),
      role: 'CONTRIBUTOR',
    },
  });
});

// Contributor Login
apiRouter.post('/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const trimmedEmail = email.toLowerCase().trim();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(trimmedEmail) as any;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const token = createSessionToken(user.id, user.role);
  setSessionCookie(res, token);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    },
  });
});

// Dedicated Administrator Login - Enforces ADMIN role verification
apiRouter.post('/auth/admin-login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const trimmedEmail = email.toLowerCase().trim();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(trimmedEmail) as any;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid administrator credentials.' });
    return;
  }

  // Explicit role verification
  if (user.role !== 'ADMIN') {
    res.status(403).json({
      error: 'Access denied. This account has Contributor status. Only authorized administrators may log in to the administrative console.',
    });
    return;
  }

  const token = createSessionToken(user.id, 'ADMIN');
  setSessionCookie(res, token);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: 'ADMIN',
    },
  });
});

// Logout
apiRouter.post('/auth/logout', (_req, res) => {
  clearSessionCookie(res);
  res.json({ success: true, message: 'Logged out successfully.' });
});

// Current User Session
apiRouter.get('/auth/me', (req, res) => {
  const user = getUserFromRequest(req);
  if (!user) {
    res.json({ user: null });
    return;
  }
  res.json({ user });
});

// -------------------------------------------------------------
// Submissions & Media (Contributor)
// -------------------------------------------------------------

apiRouter.post('/submissions', requireAuth, uploadMiddleware.array('files', 2), (req, res) => {
  const user = (req as any).user;
  const files = (req.files as Express.Multer.File[]) || [];

  if (files.length === 0) {
    res.status(400).json({ error: 'At least one media file (photograph or video) is required for submission.' });
    return;
  }

  const {
    submissionType = 'DISCOVERY',
    title = '',
    suspectedCommonName = '',
    suspectedScientificName = '',
    observationLocation = '',
    observationDate = '',
    depthMeters,
    habitatNotes = '',
    contributorNotes = '',
    contributorAttribution = '',
    sourceUrl = '',
    // Ownership & Rights Questions
    ownsMedia = 'true',
    originalSource = '',
    attributionName = '',
    publicDisplayPermission = 'false',
    aiReferencePermission = 'false',
    licenseType = 'Contributor Owned',
  } = req.body;

  const parsedOwnsMedia = ownsMedia === 'true' || ownsMedia === true ? 1 : 0;
  const parsedPublicDisplay = publicDisplayPermission === 'true' || publicDisplayPermission === true ? 1 : 0;
  const parsedAiReference = aiReferencePermission === 'true' || aiReferencePermission === true ? 1 : 0;
  const parsedDepth = depthMeters ? parseFloat(depthMeters) : null;

  const submissionId = 'sub_' + Math.random().toString(36).substring(2, 10);
  const now = new Date().toISOString();

  const insertSubmission = db.prepare(`
    INSERT INTO submissions (
      id, user_id, submission_type, title,
      suspected_common_name, suspected_scientific_name,
      observation_location, observation_date, depth_meters,
      habitat_notes, contributor_notes, contributor_attribution, source_url,
      owns_media, original_source, attribution_name,
      public_display_permission, ai_reference_permission,
      status, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?,
      ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?,
      'PENDING_REVIEW', ?, ?
    )
  `);

  const insertMedia = db.prepare(`
    INSERT INTO media (
      id, submission_id, file_path, original_filename,
      file_type, file_size, mime_type, original_source_url,
      source_organization, creator_name, copyright_holder,
      license_type, attribution_text, owns_media,
      public_display_permission, ai_reference_permission,
      status, is_primary, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?,
      'PENDING', ?, ?, ?
    )
  `);

  const tx = db.transaction(() => {
    insertSubmission.run(
      submissionId,
      user.id,
      submissionType,
      title.trim() || (suspectedCommonName ? `Observation of ${suspectedCommonName}` : 'Marine Observation'),
      suspectedCommonName.trim(),
      suspectedScientificName.trim(),
      observationLocation.trim(),
      observationDate.trim(),
      parsedDepth,
      habitatNotes.trim(),
      contributorNotes.trim(),
      contributorAttribution.trim() || attributionName.trim() || user.full_name,
      sourceUrl.trim(),
      parsedOwnsMedia,
      originalSource.trim(),
      attributionName.trim() || user.full_name,
      parsedPublicDisplay,
      parsedAiReference,
      now,
      now
    );

    files.forEach((file, index) => {
      const mediaId = 'med_' + Math.random().toString(36).substring(2, 10);
      const isVideo = file.mimetype.startsWith('video');
      insertMedia.run(
        mediaId,
        submissionId,
        storageService.getUrl(file.filename),
        file.originalname,
        isVideo ? 'video' : 'image',
        file.size,
        file.mimetype,
        sourceUrl.trim(),
        originalSource.trim(),
        attributionName.trim() || user.full_name,
        attributionName.trim() || user.full_name,
        licenseType.trim() || 'Contributor Owned',
        contributorAttribution.trim() || attributionName.trim() || user.full_name,
        parsedOwnsMedia,
        parsedPublicDisplay,
        parsedAiReference,
        index === 0 ? 1 : 0,
        now,
        now
      );
    });
  });

  try {
    tx();
    const created = db.prepare('SELECT * FROM submissions WHERE id = ?').get(submissionId) as Record<string, any>;
    const attachedMedia = db.prepare('SELECT * FROM media WHERE submission_id = ?').all(submissionId);

    res.status(201).json({
      message: 'Submission received and placed in the review queue.',
      submission: { ...created, media: attachedMedia },
    });
  } catch (error: any) {
    console.error('Submission failed:', error);
    res.status(500).json({ error: 'Failed to record submission: ' + error.message });
  }
});

// Contributor's Own Submissions - Strictly scoped to authenticated user
apiRouter.get('/submissions/mine', requireAuth, (req, res) => {
  const user = (req as any).user;

  const submissions = db.prepare(`
    SELECT * FROM submissions
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(user.id) as any[];

  const submissionsWithMedia = submissions.map((sub) => {
    const media = db.prepare('SELECT * FROM media WHERE submission_id = ?').all(sub.id);
    const reviews = db.prepare(`
      SELECT r.*, u.full_name as reviewer_name
      FROM reviews r
      LEFT JOIN users u ON r.reviewer_id = u.id
      WHERE r.submission_id = ?
      ORDER BY r.created_at DESC
    `).all(sub.id);
    return { ...sub, media, reviews };
  });

  res.json({ submissions: submissionsWithMedia });
});

// Submission Detail - Allowed for Author or Admin
apiRouter.get('/submissions/:id', requireAuth, (req, res) => {
  const user = (req as any).user;
  const sub = db.prepare('SELECT * FROM submissions WHERE id = ?').get(req.params.id) as any;

  if (!sub) {
    res.status(404).json({ error: 'Submission not found.' });
    return;
  }

  // Security check: Contributors can only see their own submissions
  if (user.role !== 'ADMIN' && sub.user_id !== user.id) {
    res.status(403).json({ error: 'Forbidden. You do not have permission to view this submission.' });
    return;
  }

  const media = db.prepare('SELECT * FROM media WHERE submission_id = ?').all(sub.id);
  const reviews = db.prepare(`
    SELECT r.*, u.full_name as reviewer_name
    FROM reviews r
    LEFT JOIN users u ON r.reviewer_id = u.id
    WHERE r.submission_id = ?
    ORDER BY r.created_at DESC
  `).all(sub.id);

  res.json({ submission: { ...sub, media, reviews } });
});

// -------------------------------------------------------------
// Administrator Endpoints
// -------------------------------------------------------------

apiRouter.get('/admin/overview', requireAdmin, (_req, res) => {
  const pendingCount = (db.prepare("SELECT COUNT(*) as c FROM submissions WHERE status = 'PENDING_REVIEW'").get() as any).c;
  const unknownCount = (db.prepare("SELECT COUNT(*) as c FROM submissions WHERE status = 'UNKNOWN'").get() as any).c;
  const clarificationCount = (db.prepare("SELECT COUNT(*) as c FROM submissions WHERE status = 'NEEDS_CLARIFICATION'").get() as any).c;
  const approvedSubmissions = (db.prepare("SELECT COUNT(*) as c FROM submissions WHERE status = 'APPROVED'").get() as any).c;
  const rejectedSubmissions = (db.prepare("SELECT COUNT(*) as c FROM submissions WHERE status = 'REJECTED'").get() as any).c;

  const organismsCount = (db.prepare("SELECT COUNT(*) as c FROM organisms WHERE verification_status != 'ARCHIVED'").get() as any).c;
  const totalMedia = (db.prepare("SELECT COUNT(*) as c FROM media").get() as any).c;
  const approvedMedia = (db.prepare("SELECT COUNT(*) as c FROM media WHERE status = 'APPROVED'").get() as any).c;

  res.json({
    pendingSubmissions: pendingCount,
    unknownSubmissions: unknownCount,
    clarificationSubmissions: clarificationCount,
    approvedSubmissions,
    rejectedSubmissions,
    totalOrganisms: organismsCount,
    totalMedia,
    approvedMedia,
  });
});

apiRouter.get('/admin/submissions', requireAdmin, (req, res) => {
  const status = req.query.status as string;
  let query = `
    SELECT s.*, u.email as contributor_email, u.full_name as contributor_name
    FROM submissions s
    JOIN users u ON s.user_id = u.id
  `;
  const params: any[] = [];

  if (status && status !== 'all') {
    query += ` WHERE s.status = ?`;
    params.push(status);
  }

  query += ` ORDER BY s.created_at DESC`;

  const rows = db.prepare(query).all(...params) as any[];
  const results = rows.map((sub) => {
    const media = db.prepare('SELECT * FROM media WHERE submission_id = ?').all(sub.id);
    const reviews = db.prepare(`
      SELECT r.*, u.full_name as reviewer_name
      FROM reviews r
      LEFT JOIN users u ON r.reviewer_id = u.id
      WHERE r.submission_id = ?
      ORDER BY r.created_at DESC
    `).all(sub.id);
    return { ...sub, media, reviews };
  });

  res.json({ submissions: results });
});

// Admin Review Decision
apiRouter.patch('/admin/submissions/:id/review', requireAdmin, (req, res) => {
  const admin = (req as any).user;
  const submissionId = req.params.id;
  const {
    action, // 'APPROVE', 'REJECT', 'REQUEST_CLARIFICATION', 'MARK_UNKNOWN', 'LINK_ORGANISM'
    notes = '',
    publicDisplayPermission,
    aiReferencePermission,
    organismId,
    // Optional: create organism inline
    createOrganismData,
  } = req.body;

  const sub = db.prepare('SELECT * FROM submissions WHERE id = ?').get(submissionId) as any;
  if (!sub) {
    res.status(404).json({ error: 'Submission not found.' });
    return;
  }

  const now = new Date().toISOString();
  const reviewId = 'rev_' + Math.random().toString(36).substring(2, 10);

  const tx = db.transaction(() => {
    let resolvedOrgId = organismId || sub.resolved_organism_id || null;

    // Inline organism creation if requested during review
    if (createOrganismData && createOrganismData.commonName && createOrganismData.scientificName) {
      const newOrgId = 'org_' + Math.random().toString(36).substring(2, 10);
      db.prepare(`
        INSERT INTO organisms (
          id, common_name, scientific_name, kingdom, phylum, class_name, order_name,
          family, genus, species, description, habitat, min_depth_m, max_depth_m,
          geographic_distribution, morphology, behavior, id_features, verification_status,
          created_by_user_id, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, 'VERIFIED',
          ?, ?, ?
        )
      `).run(
        newOrgId,
        createOrganismData.commonName.trim(),
        createOrganismData.scientificName.trim(),
        createOrganismData.kingdom || null,
        createOrganismData.phylum || null,
        createOrganismData.className || null,
        createOrganismData.orderName || null,
        createOrganismData.family || null,
        createOrganismData.genus || null,
        createOrganismData.species || null,
        createOrganismData.description || null,
        createOrganismData.habitat || null,
        createOrganismData.minDepthM ? parseFloat(createOrganismData.minDepthM) : null,
        createOrganismData.maxDepthM ? parseFloat(createOrganismData.maxDepthM) : null,
        createOrganismData.geographicDistribution || null,
        createOrganismData.morphology || null,
        createOrganismData.behavior || null,
        createOrganismData.idFeatures || null,
        admin.id,
        now,
        now
      );
      resolvedOrgId = newOrgId;
    }

    let newStatus = sub.status;
    let mediaStatus = 'PENDING';

    switch (action) {
      case 'APPROVE':
        newStatus = 'APPROVED';
        mediaStatus = 'APPROVED';
        break;
      case 'REJECT':
        newStatus = 'REJECTED';
        mediaStatus = 'REJECTED';
        break;
      case 'REQUEST_CLARIFICATION':
        newStatus = 'NEEDS_CLARIFICATION';
        mediaStatus = 'PENDING';
        break;
      case 'MARK_UNKNOWN':
        newStatus = 'UNKNOWN';
        mediaStatus = 'APPROVED'; // media is visible in unknown pool if display permitted
        break;
      case 'LINK_ORGANISM':
        newStatus = 'APPROVED';
        mediaStatus = 'APPROVED';
        break;
      default:
        throw new Error(`Unsupported review action: ${action}`);
    }

    // Determine final permissions (explicitly preserving independent AI vs Public Display separation)
    const finalPublicDisplay = publicDisplayPermission !== undefined
      ? (publicDisplayPermission ? 1 : 0)
      : sub.public_display_permission;

    const finalAiReference = aiReferencePermission !== undefined
      ? (aiReferencePermission ? 1 : 0)
      : sub.ai_reference_permission;

    // Update submission
    db.prepare(`
      UPDATE submissions
      SET status = ?, reviewer_notes = ?, resolved_organism_id = ?,
          public_display_permission = ?, ai_reference_permission = ?, updated_at = ?
      WHERE id = ?
    `).run(newStatus, notes.trim(), resolvedOrgId, finalPublicDisplay, finalAiReference, now, submissionId);

    // Update media records
    db.prepare(`
      UPDATE media
      SET status = ?, organism_id = COALESCE(?, organism_id),
          public_display_permission = ?, ai_reference_permission = ?, updated_at = ?
      WHERE submission_id = ?
    `).run(mediaStatus, resolvedOrgId, finalPublicDisplay, finalAiReference, now, submissionId);

    // Record review audit log
    db.prepare(`
      INSERT INTO reviews (id, submission_id, reviewer_id, action, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(reviewId, submissionId, admin.id, action, notes.trim(), now);
  });

  try {
    tx();
    const updated = db.prepare('SELECT * FROM submissions WHERE id = ?').get(submissionId) as Record<string, any>;
    const media = db.prepare('SELECT * FROM media WHERE submission_id = ?').all(submissionId);
    res.json({
      success: true,
      submission: { ...updated, media },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record review: ' + err.message });
  }
});

// Admin Organism CRUD
apiRouter.post('/admin/organisms', requireAdmin, (req, res) => {
  const admin = (req as any).user;
  const {
    commonName,
    scientificName,
    kingdom,
    phylum,
    className,
    orderName,
    family,
    genus,
    species,
    description,
    habitat,
    minDepthM,
    maxDepthM,
    geographicDistribution,
    morphology,
    behavior,
    idFeatures,
    verificationStatus = 'VERIFIED',
  } = req.body;

  if (!commonName || !scientificName) {
    res.status(400).json({ error: 'Common name and scientific name are required.' });
    return;
  }

  // Check potential duplicate warning
  const existingWithSameScientific = db.prepare(`
    SELECT id, common_name, scientific_name FROM organisms
    WHERE LOWER(scientific_name) = LOWER(?) AND verification_status != 'ARCHIVED'
  `).get(scientificName.trim()) as any;

  const orgId = 'org_' + Math.random().toString(36).substring(2, 10);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO organisms (
      id, common_name, scientific_name, kingdom, phylum, class_name, order_name,
      family, genus, species, description, habitat, min_depth_m, max_depth_m,
      geographic_distribution, morphology, behavior, id_features, verification_status,
      created_by_user_id, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?
    )
  `).run(
    orgId,
    commonName.trim(),
    scientificName.trim(),
    kingdom?.trim() || null,
    phylum?.trim() || null,
    className?.trim() || null,
    orderName?.trim() || null,
    family?.trim() || null,
    genus?.trim() || null,
    species?.trim() || null,
    description?.trim() || null,
    habitat?.trim() || null,
    minDepthM ? parseFloat(minDepthM) : null,
    maxDepthM ? parseFloat(maxDepthM) : null,
    geographicDistribution?.trim() || null,
    morphology?.trim() || null,
    behavior?.trim() || null,
    idFeatures?.trim() || null,
    verificationStatus,
    admin.id,
    now,
    now
  );

  const created = db.prepare('SELECT * FROM organisms WHERE id = ?').get(orgId);
  res.status(201).json({
    organism: created,
    duplicateWarning: existingWithSameScientific ? `Note: An organism with scientific name "${existingWithSameScientific.scientific_name}" (${existingWithSameScientific.common_name}) already exists.` : null,
  });
});

apiRouter.patch('/admin/organisms/:id', requireAdmin, (req, res) => {
  const organismId = req.params.id;
  const existing = db.prepare('SELECT * FROM organisms WHERE id = ?').get(organismId);

  if (!existing) {
    res.status(404).json({ error: 'Organism record not found.' });
    return;
  }

  const {
    commonName,
    scientificName,
    kingdom,
    phylum,
    className,
    orderName,
    family,
    genus,
    species,
    description,
    habitat,
    minDepthM,
    maxDepthM,
    geographicDistribution,
    morphology,
    behavior,
    idFeatures,
    verificationStatus,
  } = req.body;

  const now = new Date().toISOString();

  db.prepare(`
    UPDATE organisms SET
      common_name = COALESCE(?, common_name),
      scientific_name = COALESCE(?, scientific_name),
      kingdom = ?,
      phylum = ?,
      class_name = ?,
      order_name = ?,
      family = ?,
      genus = ?,
      species = ?,
      description = ?,
      habitat = ?,
      min_depth_m = ?,
      max_depth_m = ?,
      geographic_distribution = ?,
      morphology = ?,
      behavior = ?,
      id_features = ?,
      verification_status = COALESCE(?, verification_status),
      updated_at = ?
    WHERE id = ?
  `).run(
    commonName?.trim() || null,
    scientificName?.trim() || null,
    kingdom?.trim() || null,
    phylum?.trim() || null,
    className?.trim() || null,
    orderName?.trim() || null,
    family?.trim() || null,
    genus?.trim() || null,
    species?.trim() || null,
    description?.trim() || null,
    habitat?.trim() || null,
    minDepthM !== undefined && minDepthM !== '' ? parseFloat(minDepthM) : null,
    maxDepthM !== undefined && maxDepthM !== '' ? parseFloat(maxDepthM) : null,
    geographicDistribution?.trim() || null,
    morphology?.trim() || null,
    behavior?.trim() || null,
    idFeatures?.trim() || null,
    verificationStatus || null,
    now,
    organismId
  );

  const updated = db.prepare('SELECT * FROM organisms WHERE id = ?').get(organismId);
  res.json({ organism: updated });
});

apiRouter.post('/admin/organisms/:id/attach-media', requireAdmin, (req, res) => {
  const organismId = req.params.id;
  const { mediaId, isPrimary } = req.body;

  if (!mediaId) {
    res.status(400).json({ error: 'mediaId is required.' });
    return;
  }

  const now = new Date().toISOString();

  if (isPrimary) {
    db.prepare('UPDATE media SET is_primary = 0 WHERE organism_id = ?').run(organismId);
  }

  db.prepare(`
    UPDATE media
    SET organism_id = ?, is_primary = COALESCE(?, is_primary), updated_at = ?
    WHERE id = ?
  `).run(organismId, isPrimary ? 1 : 0, now, mediaId);

  res.json({ success: true, message: 'Media attached to organism successfully.' });
});

// Admin Media Browser
apiRouter.get('/admin/media', requireAdmin, (_req, res) => {
  const mediaList = db.prepare(`
    SELECT m.*, o.common_name as organism_common_name, o.scientific_name as organism_scientific_name,
           s.suspected_common_name, s.title as submission_title
    FROM media m
    LEFT JOIN organisms o ON m.organism_id = o.id
    LEFT JOIN submissions s ON m.submission_id = s.id
    ORDER BY m.created_at DESC
  `).all();

  res.json({ media: mediaList });
});

// -------------------------------------------------------------
// Public Endpoints (Strictly Approved & Public-Display Permitted)
// -------------------------------------------------------------

// Explore Organisms Library - Real data only. Empty by default!
apiRouter.get('/organisms', (req, res) => {
  const search = (req.query.q as string)?.trim() || '';
  const phylum = (req.query.phylum as string)?.trim() || '';
  const habitat = (req.query.habitat as string)?.trim() || '';

  let query = `
    SELECT o.*
    FROM organisms o
    WHERE o.verification_status != 'ARCHIVED'
  `;
  const params: any[] = [];

  if (search) {
    query += ` AND (o.common_name LIKE ? OR o.scientific_name LIKE ? OR o.description LIKE ?)`;
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  if (phylum) {
    query += ` AND o.phylum = ?`;
    params.push(phylum);
  }

  if (habitat) {
    query += ` AND o.habitat LIKE ?`;
    params.push(`%${habitat}%`);
  }

  query += ` ORDER BY o.common_name ASC`;

  const organisms = db.prepare(query).all(...params) as any[];

  // Attach primary approved media for card previews
  const organismsWithMedia = organisms.map((org) => {
    const primaryMedia = db.prepare(`
      SELECT * FROM media
      WHERE organism_id = ? AND status = 'APPROVED' AND public_display_permission = 1
      ORDER BY is_primary DESC, created_at ASC
      LIMIT 1
    `).get(org.id);

    const mediaCount = (db.prepare(`
      SELECT COUNT(*) as c FROM media
      WHERE organism_id = ? AND status = 'APPROVED' AND public_display_permission = 1
    `).get(org.id) as any).c;

    return { ...org, primaryMedia, mediaCount };
  });

  res.json({ organisms: organismsWithMedia });
});

// Single Organism Detail
apiRouter.get('/organisms/:id', (req, res) => {
  const org = db.prepare(`
    SELECT * FROM organisms
    WHERE id = ? AND verification_status != 'ARCHIVED'
  `).get(req.params.id) as any;

  if (!org) {
    res.status(404).json({ error: 'Organism record not found in the verified library.' });
    return;
  }

  // Only approved media with explicit public display permission
  const approvedMedia = db.prepare(`
    SELECT id, file_path, original_filename, file_type, mime_type,
           creator_name, copyright_holder, license_type, attribution_text,
           source_organization, original_source_url, is_primary, created_at
    FROM media
    WHERE organism_id = ? AND status = 'APPROVED' AND public_display_permission = 1
    ORDER BY is_primary DESC, created_at ASC
  `).all(org.id);

  res.json({ organism: org, media: approvedMedia });
});

// Search Library for Identification Helper (Option 2)
apiRouter.get('/search/library', (req, res) => {
  const query = (req.query.q as string)?.trim() || '';
  if (!query) {
    res.json({ results: [] });
    return;
  }

  const term = `%${query}%`;
  const results = db.prepare(`
    SELECT id, common_name, scientific_name, phylum, habitat, description
    FROM organisms
    WHERE verification_status != 'ARCHIVED'
      AND (common_name LIKE ? OR scientific_name LIKE ?)
    LIMIT 20
  `).all(term, term);

  res.json({ results });
});

// Unknown Observations (Public community review)
apiRouter.get('/unknowns', (_req, res) => {
  const unknowns = db.prepare(`
    SELECT s.id, s.title, s.suspected_common_name, s.observation_location,
           s.observation_date, s.depth_meters, s.habitat_notes, s.contributor_notes,
           s.contributor_attribution, s.created_at
    FROM submissions s
    WHERE s.status = 'UNKNOWN' AND s.public_display_permission = 1
    ORDER BY s.created_at DESC
  `).all() as any[];

  const results = unknowns.map((u) => {
    const media = db.prepare(`
      SELECT id, file_path, file_type, creator_name, attribution_text, license_type
      FROM media
      WHERE submission_id = ? AND public_display_permission = 1
    `).all(u.id);
    return { ...u, media };
  });

  res.json({ unknowns: results });
});
