import "./nap-du-lieu";
import assert from "node:assert/strict";
import { taoHoSoMau } from "../src/state/mau";
import { taoBanChup, apDungDeXuat } from "../src/state/ket-noi";
import { lamSachBanChup, type DeXuat } from "../src/engine/ket-noi-kieu";

const now = new Date("2026-10-16T10:00:00+07:00");
const state = taoHoSoMau();
const task = state.viec[0];
assert.ok(task, "fixture has a real study task");
state.khoiHoc = [{ id: "qa-study-block", viecId: task.id, ten: task.tieuDe, loai: "tuHoc", ngay: "2026-10-16", batDau: "19:00", ketThuc: "20:00", khoa: true }];
state.trangThaiViec = { [task.id]: "chua" };
const snapshot = taoBanChup(state, now);
assert.equal(snapshot.keHoachTuan[0].taskId, task.id);
assert.equal(snapshot.keHoachTuan[0].progressStatus, "chua");
assert.deepEqual(lamSachBanChup(snapshot), snapshot, "task metadata survives server sanitation");

const proposal: DeXuat = { id: "qa-proposal", loai: "cap-nhat-tien-do", tomTat: "Đánh dấu đã học", taoLuc: now.getTime(), duLieu: { taskId: task.id, status: "xong", expectedStatus: "chua", snapshotUpdatedAt: snapshot.capNhat } };
const applied = apDungDeXuat(state, proposal);
assert.ok(applied.ok);
assert.equal(applied.capNhat.trangThaiViec?.[task.id], "xong");
assert.equal(state.trangThaiViec[task.id], "chua", "preparing confirmation never mutates student state");
const done = { ...state, trangThaiViec: { [task.id]: "xong" as const } };
assert.deepEqual(apDungDeXuat(done, proposal), { ok: true, capNhat: {}, chu: "Tiến độ đã được cập nhật." }, "retry is idempotent");
assert.equal(apDungDeXuat({ ...state, trangThaiViec: { [task.id]: "boQua" } }, proposal).ok, false, "stale proposal cannot overwrite new progress");
assert.equal(apDungDeXuat({ ...state, viec: [] }, proposal).ok, false, "deleted task cannot be updated");
assert.equal(apDungDeXuat(state, { ...proposal, duLieu: { taskId: task.id, status: "xong" } }).ok, false, "missing expected state fails closed");
console.log("study-progress: snapshot, explicit confirmation, stale-state rejection and idempotency pass");
