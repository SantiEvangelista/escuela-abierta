CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE TABLE IF NOT EXISTS institution_read (
 dataset_id integer NOT NULL REFERENCES datasets,
 cueanexo text NOT NULL,
 province text NOT NULL,
 department text NOT NULL,
 locality text NOT NULL,
 name text NOT NULL,
 name_rank integer NOT NULL,
 reverse_rank integer NOT NULL,
 members text[] NOT NULL,
 sectors text[] NOT NULL,
 areas text[] NOT NULL,
 offers text[] NOT NULL,
 card jsonb NOT NULL,
 PRIMARY KEY(dataset_id,cueanexo)
);
CREATE INDEX IF NOT EXISTS institution_province_page ON institution_read(dataset_id,province,cueanexo);
CREATE INDEX IF NOT EXISTS institution_name_search ON institution_read USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS institution_member ON institution_read USING gin(members);

ALTER TABLE institution_read ADD COLUMN IF NOT EXISTS location_batches bigint[] NOT NULL DEFAULT '{}';
CREATE OR REPLACE FUNCTION refresh_institution_coverage(target integer) RETURNS void
LANGUAGE sql AS $$
 WITH located AS (
   SELECT r.cueanexo, array_agg(DISTINCT il.import_batch_id ORDER BY il.import_batch_id) AS batches
   FROM institution_read r CROSS JOIN LATERAL unnest(r.members) m(cue)
   JOIN institution_locations il ON il.dataset_id=r.dataset_id AND il.institution_key='cue-'||m.cue
     AND il.source_cueanexo=m.cue
   WHERE r.dataset_id=target GROUP BY r.cueanexo
 ), coverage AS (
   SELECT r.cueanexo,coalesce(l.batches,'{}'::bigint[]) AS batches
   FROM institution_read r LEFT JOIN located l USING(cueanexo) WHERE r.dataset_id=target
 )
 UPDATE institution_read r SET location_batches=c.batches FROM coverage c
 WHERE r.dataset_id=target AND r.cueanexo=c.cueanexo AND r.location_batches<>c.batches;
$$;
