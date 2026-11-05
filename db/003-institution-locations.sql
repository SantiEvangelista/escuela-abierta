CREATE TABLE IF NOT EXISTS location_import_batches (
 id bigserial PRIMARY KEY,
 sha256 text UNIQUE NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
 artifact_name text NOT NULL,
 source_cartographic_cut_date date NOT NULL,
 source_metadata_reference_date date NOT NULL,
 record_count integer NOT NULL CHECK (record_count > 0),
 status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','rolled_back')),
 created_at timestamptz NOT NULL DEFAULT now(),
 last_activated_at timestamptz NOT NULL DEFAULT now(),
 rolled_back_at timestamptz
);
CREATE TABLE IF NOT EXISTS institution_locations (
 dataset_id integer NOT NULL REFERENCES datasets(id),
 institution_key text NOT NULL,
 member_cueanexos text[] NOT NULL CHECK (cardinality(member_cueanexos) > 0),
 source_cueanexo text NOT NULL,
 latitude double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
 longitude double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
 coordinate_precision text NOT NULL CHECK (coordinate_precision IN ('building','approximate_address')),
 source_precision_original text NOT NULL CHECK (source_precision_original IN ('PRECISA','APROXIMADA')),
 source_url text NOT NULL,
 source_name text NOT NULL,
 attribution text NOT NULL,
 source_license text NOT NULL,
 source_cartographic_cut_date date NOT NULL,
 source_metadata_reference_date date NOT NULL,
 checked_at date NOT NULL,
 import_batch_id bigint NOT NULL REFERENCES location_import_batches(id),
 raw jsonb NOT NULL,
 PRIMARY KEY(dataset_id,institution_key),
 FOREIGN KEY(dataset_id,source_cueanexo) REFERENCES schools(dataset_id,cueanexo),
 CHECK (source_cueanexo = ANY(member_cueanexos))
);
CREATE INDEX IF NOT EXISTS institution_locations_source_cue ON institution_locations(dataset_id,source_cueanexo);
CREATE INDEX IF NOT EXISTS institution_locations_batch ON institution_locations(import_batch_id);
