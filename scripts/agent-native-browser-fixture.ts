import { taoHoSoMau } from '../src/state/mau';
import { napDanhMuc } from '../src/data/lua-chon-mau';

await napDanhMuc();
console.log(JSON.stringify(taoHoSoMau()));
