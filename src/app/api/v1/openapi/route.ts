import specification from "@/lib/openapi.json";
export function GET(){return Response.json(specification,{headers:{"Cache-Control":"no-cache"}})}
