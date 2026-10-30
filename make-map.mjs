// Natural Earth (world-atlas 50m) -> assets/map.json: outlines of Austria, Slovakia, Switzerland and neighbours,
// projected (equirectangular, cos(47.5 deg) aspect) into a unit box, plus the five city pins.
import fs from 'node:fs';
import { feature } from 'topojson-client';
const topo = JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-50m.json', 'utf8'));
const all = feature(topo, topo.objects.countries).features;
const WANT = { '040': 'Austria', '703': 'Slovakia', '756': 'Switzerland', '276': 'Germany', '203': 'Czechia', '348': 'Hungary',
  '380': 'Italy', '250': 'France', '705': 'Slovenia', '616': 'Poland', '438': 'Liechtenstein', '191': 'Croatia', '804': 'Ukraine' };
const BBOX = { lon0: 4.6, lon1: 24.2, lat0: 44.6, lat1: 51.6 };
const k = Math.cos((47.5 * Math.PI) / 180);
const wx = (BBOX.lon1 - BBOX.lon0) * k, wy = BBOX.lat1 - BBOX.lat0;
const proj = ([lon, lat]) => [+(((lon - BBOX.lon0) * k) / wx).toFixed(4), +((BBOX.lat1 - lat) / wy).toFixed(4)];
const countries = all.filter((f) => WANT[f.id]).map((f) => {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  return { id: f.id, name: WANT[f.id], focus: ['040', '703', '756'].includes(f.id), rings: polys.map((p) => p[0].map(proj)) };
});
const cities = [['Bratislava', 48.1486, 17.1077, 'Slovakia'], ['Vienna', 48.2082, 16.3738, 'Austria'], ['Linz', 48.3069, 14.2858, 'Austria'],
  ['Salzburg', 47.8095, 13.055, 'Austria'], ['Visp', 46.2937, 7.8813, 'Switzerland']].map(([name, lat, lon, country]) => ({ name, country, at: proj([lon, lat]) }));
fs.writeFileSync('assets/map.json', JSON.stringify({ aspect: wx / wy, countries, cities }));
console.log('aspect', (wx / wy).toFixed(3), countries.map((c) => `${c.name}:${c.rings.length}`).join(' '));
