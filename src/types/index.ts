export type UserRole = 'CONTRIBUTOR' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type SubmissionStatus =
  | 'PENDING_REVIEW'
  | 'NEEDS_CLARIFICATION'
  | 'UNKNOWN'
  | 'APPROVED'
  | 'REJECTED';

export type VerificationStatus = 'VERIFIED' | 'UNVERIFIED' | 'ARCHIVED';

export type MediaStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface MediaItem {
  id: string;
  submission_id?: string;
  organism_id?: string;
  file_path: string;
  original_filename: string;
  file_type: 'image' | 'video';
  file_size: number;
  mime_type: string;
  original_source_url?: string;
  source_organization?: string;
  creator_name?: string;
  copyright_holder?: string;
  license_type: string;
  attribution_text?: string;
  owns_media: number;
  public_display_permission: number;
  ai_reference_permission: number;
  status: MediaStatus;
  is_primary: number;
  created_at: string;
  updated_at: string;
  organism_common_name?: string;
  organism_scientific_name?: string;
}

export interface ReviewLog {
  id: string;
  submission_id: string;
  reviewer_id: string;
  reviewer_name?: string;
  action: string;
  notes?: string;
  created_at: string;
}

export interface Submission {
  id: string;
  user_id: string;
  contributor_email?: string;
  contributor_name?: string;
  submission_type: 'DISCOVERY' | 'IDENTIFY_REQUEST';
  title?: string;
  suspected_common_name?: string;
  suspected_scientific_name?: string;
  observation_location?: string;
  observation_date?: string;
  depth_meters?: number;
  habitat_notes?: string;
  contributor_notes?: string;
  contributor_attribution?: string;
  source_url?: string;
  owns_media: number;
  original_source?: string;
  attribution_name?: string;
  public_display_permission: number;
  ai_reference_permission: number;
  status: SubmissionStatus;
  reviewer_notes?: string;
  resolved_organism_id?: string;
  created_at: string;
  updated_at: string;
  media?: MediaItem[];
  reviews?: ReviewLog[];
}

export interface Organism {
  id: string;
  common_name: string;
  scientific_name: string;
  kingdom?: string;
  phylum?: string;
  class_name?: string;
  order_name?: string;
  family?: string;
  genus?: string;
  species?: string;
  description?: string;
  habitat?: string;
  min_depth_m?: number;
  max_depth_m?: number;
  geographic_distribution?: string;
  morphology?: string;
  behavior?: string;
  id_features?: string;
  verification_status: VerificationStatus;
  created_by_user_id?: string;
  created_at: string;
  updated_at: string;
  primaryMedia?: MediaItem;
  mediaCount?: number;
}
