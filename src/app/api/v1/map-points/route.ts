import {getPool} from '@/lib/db';

export async function GET(request: Request) {
  const province = new URL(request.url).searchParams.get('province');
  if (!province || !/^\d{2}$/.test(province)) {
    return Response.json({error:{message:'Seleccioná una provincia.'}}, {status:400});
  }
  const {rows} = await getPool().query(`
    WITH points AS MATERIALIZED (
      SELECT il.dataset_id, il.source_cueanexo, il.latitude, il.longitude, il.source_url
      FROM institution_locations il
      JOIN publication pub ON pub.dataset_id=il.dataset_id AND pub.singleton
      JOIN location_import_batches b ON b.id=il.import_batch_id AND b.status='active'
      WHERE il.institution_key >= 'cue-'||$1||'0000000'
        AND il.institution_key <= 'cue-'||$1||'9999999'
    )
    SELECT s.cueanexo, s.name, s.address, l.name AS locality_name, s.sector_code,
           il.latitude, il.longitude, il.source_url
    FROM points il
    JOIN schools s ON s.dataset_id=il.dataset_id AND s.cueanexo=il.source_cueanexo
    JOIN localities l ON l.dataset_id=s.dataset_id AND l.code=s.locality_code
    JOIN departments d ON d.dataset_id=l.dataset_id AND d.code=l.department_code
    WHERE d.province_code=$1 ORDER BY s.cueanexo
  `, [province]);
  return Response.json({data:rows});
}
