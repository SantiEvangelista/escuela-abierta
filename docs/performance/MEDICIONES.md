# Mediciones de tráfico mixto

Latencias en milisegundos; se incluyen fallos y el límite de 30 s del cliente. RPS incluye todas las respuestas, incluso errores. La columna TTFB sólo tiene sentido cuando llegó la cabecera. Una muestra insuficiente no permite inferir percentiles estables.

## 1 clientes

| Variante | Solicitudes | Errores | RPS |
|---|---:|---:|---:|
| Original | 1 | 1 | 0.03 |
| Preparada | 871 | 0 | 43.52 |

| Operación | Original p50 / p95 / p99 | Preparada p50 / p95 / p99 | TTFB p95 original / preparada |
|---|---:|---:|---:|
| home | 34772 / 34772 / 34772 | 17 / 98 / 767 | — / 60 |
| national | — | 2 / 12 / 122 | — / 10 |
| tucuman | — | 2 / 6 / 130 | — / 6 |
| buenosAires | — | 1 / 8 / 4947 | — / 7 |
| search | — | 3 / 11 / 2054 | — / 11 |
| search2 | — | 21 / 65 / 1694 | — / 65 |
| miss | — | 3 / 9 / 58 | — / 9 |
| page | — | 3 / 16 / 58 | — / 15 |
| card | — | 2 / 7 / 16 | — / 7 |
| map | — | 15 / 68 / 274 | — / 43 |

## 10 clientes

| Variante | Solicitudes | Errores | RPS |
|---|---:|---:|---:|
| Original | 11 | 10 | 0.32 |
| Preparada | 2143 | 0 | 106.36 |

| Operación | Original p50 / p95 / p99 | Preparada p50 / p95 / p99 | TTFB p95 original / preparada |
|---|---:|---:|---:|
| home | 16606 / 30077 / 30077 | 116 / 451 / 714 | — / 272 |
| national | 30004 / 30004 / 30004 | 20 / 195 / 332 | — / 194 |
| tucuman | 22337 / 22337 / 22337 | 25 / 148 / 298 | 22300 / 147 |
| buenosAires | 30009 / 30009 / 30009 | 22 / 136 / 302 | — / 135 |
| search | 30008 / 30008 / 30008 | 71 / 337 / 584 | — / 336 |
| search2 | 30016 / 30016 / 30016 | 106 / 450 / 729 | — / 448 |
| miss | 30016 / 30016 / 30016 | 71 / 279 / 523 | — / 278 |
| page | 22345 / 22345 / 22345 | 76 / 292 / 564 | 22344 / 292 |
| card | 22337 / 22337 / 22337 | 79 / 332 / 559 | 22337 / 330 |
| map | 17880 / 17880 / 17880 | 58 / 207 / 385 | 17790 / 200 |

## 25 clientes

| Variante | Solicitudes | Errores | RPS |
|---|---:|---:|---:|
| Original | 428 | 302 | 1.35 |
| Preparada | 62987 | 0 | 209.78 |

| Operación | Original p50 / p95 / p99 | Preparada p50 / p95 / p99 | TTFB p95 original / preparada |
|---|---:|---:|---:|
| home | 28076 / 30585 / 31556 | 94 / 263 / 495 | — / 161 |
| national | 14278 / 30118 / 31580 | 27 / 108 / 257 | — / 107 |
| tucuman | 14368 / 30238 / 31597 | 28 / 114 / 266 | — / 114 |
| buenosAires | 14691 / 30191 / 31614 | 30 / 118 / 286 | — / 118 |
| search | 14362 / 30025 / 31111 | 127 / 365 / 675 | — / 365 |
| search2 | 14595 / 30027 / 30099 | 160 / 427 / 791 | — / 427 |
| miss | 14265 / 30031 / 30052 | 132 / 380 / 690 | — / 380 |
| page | 16135 / 30019 / 30032 | 142 / 390 / 704 | — / 387 |
| card | 16121 / 30025 / 30105 | 142 / 393 / 701 | — / 391 |
| map | 11309 / 30109 / 31395 | 53 / 169 / 338 | — / 158 |

## 50 clientes

| Variante | Solicitudes | Errores | RPS |
|---|---:|---:|---:|
| Original | 131 | 107 | 3.83 |
| Preparada | 3957 | 0 | 196.58 |

| Operación | Original p50 / p95 / p99 | Preparada p50 / p95 / p99 | TTFB p95 original / preparada |
|---|---:|---:|---:|
| home | 15960 / 22789 / 22789 | 120 / 464 / 1061 | 22761 / 358 |
| national | 9632 / 22679 / 22679 | 71 / 289 / 700 | 22678 / 289 |
| tucuman | 9622 / 22562 / 22562 | 73 / 304 / 712 | 22562 / 304 |
| buenosAires | 8335 / 16541 / 16541 | 74 / 288 / 717 | 16541 / 287 |
| search | 9621 / 16540 / 16540 | 269 / 811 / 2268 | 16540 / 811 |
| search2 | 9683 / 23837 / 23837 | 295 / 890 / 2402 | 23834 / 889 |
| miss | 9634 / 18091 / 18091 | 273 / 869 / 2266 | 18091 / 868 |
| page | 8359 / 18085 / 18085 | 281 / 816 / 2201 | 18085 / 815 |
| card | 9108 / 18151 / 18151 | 282 / 815 / 2198 | 18151 / 814 |
| map | 4931 / 11373 / 11373 | 92 / 353 / 852 | 8377 / 344 |

## Contraprueba: 25 clientes, doce nombres de búsqueda

Cinco minutos por imagen, sin builds simultáneas, después de 20 s de precalentamiento. Se conserva el perfil de búsquedas amplias, sin resultados y navegación.

| Operación | Original p50 / p95 / p99 | Final p50 / p95 / p99 | TTFB p95 original / final |
|---|---:|---:|---:|
| map | 788 / 2488 / 4354 | 85 / 204 / 400 | 2481 / 196 |
| search | 2574 / 5004 / 9638 | 230 / 637 / 1273 | 5003 / 637 |
| buenosAires | 2630 / 5075 / 9784 | 77 / 188 / 383 | 5074 / 188 |
| search2 | 2541 / 4953 / 9587 | 368 / 948 / 1761 | 4953 / 947 |
| miss | 2518 / 5075 / 12951 | 258 / 681 / 1355 | 5075 / 681 |
| card | 2611 / 5849 / 8793 | 259 / 674 / 1387 | 5849 / 673 |
| page | 2623 / 5483 / 9319 | 265 / 702 / 1430 | 5483 / 701 |
| tucuman | 2647 / 5530 / 8447 | 77 / 189 / 380 | 5530 / 189 |
| national | 2649 / 5188 / 11368 | 76 / 188 / 364 | 5187 / 188 |
| home | 3499 / 6658 / 15645 | 99 / 243 / 441 | 5616 / 201 |

| Imagen | RPS | Solicitudes | Errores |
|---|---:|---:|---:|
| Original | 8.75 | 2649 | 14 |
| Final | 116.93 | 35160 | 0 |
