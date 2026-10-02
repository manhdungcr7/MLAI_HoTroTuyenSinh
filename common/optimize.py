"""Thuật toán chọn danh mục 15 nguyện vọng.

THIẾT KẾ: tối ưu lợi ích kỳ vọng thuần tuý (greedy đơn giản) có xu hướng chọn
toàn nguyện vọng "an toàn" nếu chúng cũng tình cờ có lợi ích cao (học phí rẻ,
gần nhà...) — thử trên dữ liệu thật cho ra danh mục 15/15 đều p_admit=1.00,
không có nguyện vọng mơ ước nào. Một tư vấn viên tuyển sinh thật sẽ không đưa
ra danh mục như vậy.

Sửa bằng cách chia 15 suất thành 3 "giỏ" theo băng xác suất đỗ mục tiêu (mạo
hiểm / vừa tầm / an toàn), số suất mỗi giỏ do `ambition_level` (0-1, học sinh
tự chọn) quyết định — KHÔNG áp tỷ lệ cứng cho mọi người. Trong mỗi giỏ vẫn
chọn theo lợi ích kỳ vọng cao nhất như cũ. `risk_tolerance` (xác suất trượt
TẤT CẢ) là ràng buộc CỨNG nằm ngoài ambition_level: nếu đa dạng hoá theo
ambition_level khiến P(trượt hết) vượt ngưỡng, hệ thống tự thêm suất an toàn
để kéo xuống — không có mức "thử thách" nào được phép đẩy học sinh tới nguy
cơ trượt đại học vượt ngưỡng họ đã chấp nhận.
"""

from __future__ import annotations

from common.canonical import COMBO_SUBJECTS
from common.simulate import run_monte_carlo
from common.utility import calculate_utility

ROLE_BREAKS = (0.4, 0.8)  # < 0.4 mạo hiểm, 0.4-0.8 vừa tầm, > 0.8 an toàn


def role_of(prob: float) -> str:
    if prob < ROLE_BREAKS[0]:
        return "mao_hiem"
    if prob < ROLE_BREAKS[1]:
        return "vua_tam"
    return "an_toan"


def band_quota(max_wishes: int, ambition_level: float) -> dict[str, int]:
    """Số suất mục tiêu cho mỗi băng rủi ro, nội suy tuyến tính giữa hai đầu:

        ambition=0.0  ->   0% mạo hiểm / 20% vừa tầm / 80% an toàn
        ambition=1.0  ->  45% mạo hiểm / 35% vừa tầm / 20% an toàn

    Vẫn giữ tối thiểu 20% an toàn ngay cả ở mức thử thách tối đa — một danh
    mục 0% an toàn không phải "thử thách", mà là đánh cược, đề bài yêu cầu hệ
    thống không được đẩy rủi ro vượt mức người dùng ý thức được.
    """
    a = max(0.0, min(1.0, ambition_level))
    mao_hiem_pct = 0.0 + a * 0.45
    an_toan_pct = 0.80 - a * 0.60
    vua_tam_pct = 1.0 - mao_hiem_pct - an_toan_pct

    n_mao_hiem = round(max_wishes * mao_hiem_pct)
    n_an_toan = round(max_wishes * an_toan_pct)
    n_vua_tam = max_wishes - n_mao_hiem - n_an_toan
    return {"mao_hiem": n_mao_hiem, "vua_tam": n_vua_tam, "an_toan": n_an_toan}


def _program_score_for_combo(program: dict, exam_scores: dict, user_scores: dict) -> float | None:
    """Điểm dùng để xét chương trình này: nếu biết tổ hợp cụ thể (A00, D01...)
    và đủ điểm môn, tính điểm CHÍNH XÁC theo tổ hợp đó; nếu không, lùi về
    user_scores['thpt'] (điểm tổng hợp thô) đã tính sẵn."""
    raw_combos = program.get("combinations_seen")
    # `raw_combos or ""` is not enough: a missing Parquet value round-trips
    # as float NaN, and `nan or ""` evaluates to `nan` (NaN is truthy in
    # Python), not "" - isinstance() is the only check that also catches that.
    combos_str = raw_combos if isinstance(raw_combos, str) else ""
    combos = [c for c in combos_str.split(",") if c]
    combo_subjects = COMBO_SUBJECTS
    valid_scores = []
    p_max = float(user_scores.get("priority_bonus_max", 0.0)) if user_scores else 0.0
    for c in combos:
        needed = combo_subjects.get(c.strip())
        if not needed:
            continue
        vals = [exam_scores.get(s) for s in needed]
        if all(v is not None for v in vals):
            raw = float(sum(vals))
            if p_max > 0.0:
                bonus = p_max * ((30.0 - raw) / 7.5) if raw >= 22.5 else p_max
                raw = min(30.0, max(0.0, raw + max(0.0, bonus)))
            valid_scores.append(raw)
    if valid_scores:
        return max(valid_scores)
    return user_scores.get("thpt")



def _greedy_fill(candidates: list[dict], selected: list[dict], n_slots: int,
                 band: str | None, user_scores: dict,
                 national_shock_std: float, idio_std: float) -> list[dict]:
    """Điền tối đa n_slots suất vào `selected`, chọn theo lợi ích kỳ vọng cao
    nhất tại mỗi bước; nếu `band` được chỉ định, chỉ xét ứng viên mà xác suất
    đỗ (tính trên portfolio HIỆN TẠI, trước khi thêm) rơi vào đúng băng đó."""
    for _ in range(n_slots):
        best_candidate, best_marginal_utility, best_probs = None, -1.0, None

        for candidate in candidates:
            if any(c["program_key"] == candidate["program_key"] for c in selected):
                continue

            if band is not None:
                solo_probs, _ = run_monte_carlo(
                    [candidate], {candidate["method"]: candidate["_effective_score"] or 0.0},
                    num_simulations=1500,
                    national_shock_std=national_shock_std, idio_std=idio_std)
                solo_p = solo_probs.get(candidate["program_key"], 0.0)
                if role_of(solo_p) != band:
                    continue

            test_portfolio = selected + [candidate]
            scores_for_sim = {p["method"]: (p["_effective_score"] or 0.0) for p in test_portfolio}
            probs_dict, _ = run_monte_carlo(
                test_portfolio, scores_for_sim, num_simulations=3000,
                national_shock_std=national_shock_std, idio_std=idio_std)
            expected_utility = sum(
                p["utility"] * probs_dict.get(p["program_key"], 0.0) for p in test_portfolio)

            if expected_utility > best_marginal_utility:
                best_marginal_utility = expected_utility
                best_candidate = candidate
                best_probs = probs_dict

        if best_candidate is None:
            break  # hết ứng viên phù hợp băng này, không ép chọn bừa
        selected.append(best_candidate)
        for p in selected:
            p["admit_prob"] = best_probs.get(p["program_key"], p.get("admit_prob", 0.0))

    return selected


def optimize_portfolio(programs_pool: list[dict], user_scores: dict, family: dict,
                       preferences: dict, exam_scores: dict, max_wishes: int = 15,
                       risk_tolerance: float = 0.05, ambition_level: float = 0.5,
                       weights: dict | None = None,
                       national_shock_std: float = 1.3, idio_std: float = 1.3):
    candidates = []
    for p in programs_pool:
        util_info = calculate_utility(p, family, preferences, exam_scores, weights)
        if util_info.get("excluded"):
            continue
        p = dict(p)
        p["utility"] = util_info["utility"]
        p["util_breakdown"] = util_info["breakdown"]
        p["util_meta"] = util_info["meta"]
        # `method` doubles as the lookup key run_monte_carlo uses to find
        # this exact program's score inside the flat user_scores dict - each
        # program gets its OWN key (its program_key) so a program evaluated
        # by combination A00 and one by D01 each get their correct
        # combo-specific composite score, not one shared "thpt" figure.
        p["method"] = p["program_key"]
        p["_effective_score"] = _program_score_for_combo(p, exam_scores, user_scores)
        candidates.append(p)

    candidates = [c for c in candidates if c["utility"] > 0]
    candidates.sort(key=lambda x: x["utility"], reverse=True)
    candidates = candidates[:150]  # giới hạn để Monte Carlo chạy nhanh

    quota = band_quota(max_wishes, ambition_level)
    selected: list[dict] = []
    # Điền an toàn trước (đảm bảo sàn an toàn luôn có), rồi vừa tầm, rồi mạo
    # hiểm - thứ tự này không ảnh hưởng kết quả cuối (mỗi giỏ độc lập theo
    # băng của chính nó) nhưng đảm bảo nếu một băng thiếu ứng viên, băng an
    # toàn - băng quan trọng nhất cho việc "chắc đỗ ít nhất 1 trường" - được
    # ưu tiên lấp đầy trước.
    for band in ("an_toan", "vua_tam", "mao_hiem"):
        selected = _greedy_fill(candidates, selected, quota[band], band,
                                user_scores, national_shock_std, idio_std)

    # Nếu 3 giỏ cộng lại chưa đủ max_wishes (một băng hết ứng viên phù hợp),
    # lấp nốt bằng lợi ích kỳ vọng cao nhất không phân biệt băng.
    if len(selected) < max_wishes:
        selected = _greedy_fill(candidates, selected, max_wishes - len(selected), None,
                                user_scores, national_shock_std, idio_std)

    # RÀNG BUỘC CỨNG: nếu P(trượt tất cả) vẫn vượt risk_tolerance sau khi đã
    # điền theo ambition_level, thay dần nguyện vọng mạo hiểm yếu nhất bằng
    # ứng viên an toàn tốt nhất còn lại cho tới khi đạt ngưỡng hoặc hết cách.
    # Đây là lằn ranh brief yêu cầu: con người có thể MUỐN mạo hiểm, nhưng hệ
    # thống không được để họ mạo hiểm QUÁ mức chính họ đã đặt ra.
    scores_for_sim = {p["method"]: (p["_effective_score"] or 0.0) for p in selected}
    probs_dict, p_fail_all = run_monte_carlo(
        selected, scores_for_sim, num_simulations=5000,
        national_shock_std=national_shock_std, idio_std=idio_std)
    for p in selected:
        p["admit_prob"] = probs_dict.get(p["program_key"], 0.0)

    guard = 0
    while p_fail_all > risk_tolerance and guard < max_wishes:
        guard += 1
        risky_sorted = sorted(selected, key=lambda p: p["admit_prob"])
        weakest = risky_sorted[0]
        safer_pool = [c for c in candidates
                     if not any(s["program_key"] == c["program_key"] for s in selected)]
        safer_pool.sort(key=lambda c: c["utility"], reverse=True)
        replacement = None
        for cand in safer_pool[:40]:
            test = [p for p in selected if p["program_key"] != weakest["program_key"]] + [cand]
            sc = {p["method"]: (p["_effective_score"] or 0.0) for p in test}
            probs, fail = run_monte_carlo(test, sc, num_simulations=2000,
                                          national_shock_std=national_shock_std, idio_std=idio_std)
            if fail < p_fail_all:
                replacement = (cand, test, probs, fail)
                break
        if replacement is None:
            break
        cand, selected, probs_dict, p_fail_all = replacement
        for p in selected:
            p["admit_prob"] = probs_dict.get(p["program_key"], 0.0)

    for p in selected:
        p["role"] = role_of(p["admit_prob"])

    # TUÂN THỦ QUY CHẾ TUYỂN SINH BỘ GD&ĐT:
    # Thí sinh đỗ nguyện vọng trên sẽ bị hủy toàn bộ nguyện vọng dưới.
    # Do đó danh mục BẮT BUỘC phải xếp theo thứ tự: Mạo hiểm (Mơ ước) -> Vừa tầm -> An toàn.
    # Trong từng tầng, ưu tiên sắp xếp theo hàm thỏa dụng (Utility) giảm dần.
    reach_group = [p for p in selected if p["role"] == "mao_hiem"]
    target_group = [p for p in selected if p["role"] == "vua_tam"]
    safety_group = [p for p in selected if p["role"] == "an_toan"]

    reach_group.sort(key=lambda x: x["utility"], reverse=True)
    target_group.sort(key=lambda x: x["utility"], reverse=True)
    safety_group.sort(key=lambda x: x["utility"], reverse=True)

    ordered_selected = reach_group + target_group + safety_group
    for i, p in enumerate(ordered_selected, 1):
        p["rank"] = i

    return ordered_selected, p_fail_all

