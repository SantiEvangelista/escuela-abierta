\set ON_ERROR_STOP on
SELECT dataset_id AS dataset FROM publication \gset
EXPLAIN (ANALYZE,BUFFERS) SELECT card FROM institution_read
 WHERE dataset_id=:dataset ORDER BY cueanexo LIMIT 5;
EXPLAIN (ANALYZE,BUFFERS) SELECT card FROM institution_read
 WHERE dataset_id=:dataset AND province='90' ORDER BY cueanexo LIMIT 5 OFFSET 95;
EXPLAIN (ANALYZE,BUFFERS) SELECT card FROM institution_read
 WHERE dataset_id=:dataset AND name LIKE '%LORENZO%' ORDER BY cueanexo LIMIT 5;
EXPLAIN (ANALYZE,BUFFERS) SELECT card FROM institution_read
 WHERE dataset_id=:dataset AND members @> ARRAY['900058300'] LIMIT 5;
EXPLAIN (ANALYZE,BUFFERS) SELECT count(*) FROM institution_read WHERE dataset_id=:dataset
 AND members && ARRAY(SELECT s.cueanexo FROM schools s WHERE s.dataset_id=:dataset AND s.cue='9000583');
EXPLAIN (ANALYZE,BUFFERS) SELECT count(*),count(*) FILTER (WHERE location_batches && ARRAY(SELECT id FROM location_import_batches WHERE status='active'))
 FROM institution_read WHERE dataset_id=:dataset AND name LIKE '%ESCUELA%';
SELECT count(*) AS cards,sum(cardinality(members)) AS members,pg_size_pretty(pg_total_relation_size('institution_read')) AS disk FROM institution_read WHERE dataset_id=:dataset;
