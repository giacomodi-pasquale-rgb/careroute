CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE facility_care_type AS ENUM ('emergency', 'urgent-care');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'verified-with-unknowns', 'stale', 'suppressed');
CREATE TYPE evidence_method AS ENUM ('authoritative-provider-source', 'government-dataset', 'facility-confirmed');

CREATE TABLE facilities (
  id text PRIMARY KEY,
  name text NOT NULL,
  organization text,
  care_type facility_care_type NOT NULL,
  type_label text NOT NULL,
  pediatric_specific boolean NOT NULL,
  phone_e164 text NOT NULL,
  website_url text NOT NULL,
  booking_url text,
  min_age_months integer,
  max_age_months integer,
  age_limits_verified boolean NOT NULL DEFAULT false,
  verification_status verification_status NOT NULL DEFAULT 'pending',
  reviewed_at timestamptz,
  review_by timestamptz,
  verification_method evidence_method,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((age_limits_verified AND min_age_months IS NOT NULL AND max_age_months IS NOT NULL) OR (NOT age_limits_verified AND min_age_months IS NULL AND max_age_months IS NULL)),
  CHECK (min_age_months IS NULL OR max_age_months >= min_age_months)
);

CREATE TABLE facility_locations (
  facility_id text PRIMARY KEY REFERENCES facilities(id) ON DELETE CASCADE,
  address1 text NOT NULL,
  city text NOT NULL,
  state char(2) NOT NULL,
  postal_code varchar(10) NOT NULL,
  latitude double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  timezone text NOT NULL
);

CREATE TABLE facility_capabilities (
  facility_id text NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  capability_code text NOT NULL,
  PRIMARY KEY (facility_id, capability_code)
);

CREATE TABLE facility_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id text NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  hours_kind text NOT NULL CHECK (hours_kind IN ('always', 'weekly', 'live', 'unknown')),
  day_of_week smallint CHECK (day_of_week BETWEEN 0 AND 6),
  opens_at time,
  closes_at time,
  display_label text NOT NULL,
  valid_from date,
  valid_through date
);

CREATE TABLE evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_key text NOT NULL UNIQUE,
  facility_id text NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  source_url text NOT NULL,
  publisher text NOT NULL,
  checked_at timestamptz NOT NULL,
  supports text[] NOT NULL,
  excerpt_hash text,
  archived_reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE facility_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id text NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  revision integer NOT NULL,
  snapshot jsonb NOT NULL,
  changed_by text NOT NULL,
  change_reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (facility_id, revision)
);

CREATE INDEX facilities_review_queue_idx ON facilities (verification_status, review_by);
CREATE INDEX facility_locations_geo_idx ON facility_locations (latitude, longitude);
CREATE INDEX evidence_facility_idx ON evidence (facility_id, checked_at DESC);
