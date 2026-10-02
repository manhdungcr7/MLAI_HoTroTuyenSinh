import numpy as np

# Cú sốc toàn quốc theo năm và nhiễu riêng trường, ước lượng THẬT từ dữ liệu
# đã cào (common/national_shock.py) — thay cho beta_shock/sigma_idio ngẫu
# nhiên trong bản cũ, vốn không liên hệ gì tới biến động điểm chuẩn thực tế.
# Nếu chưa nạp được ước lượng thật (chưa chạy national_shock), dùng giá trị
# sàn thận trọng — RỘNG hơn không sao, hẹp hơn thực tế mới nguy hiểm vì làm
# học sinh tưởng chắc đỗ trong khi không chắc.
DEFAULT_NATIONAL_SHOCK_STD = 1.3
DEFAULT_IDIO_STD = 1.3


def run_monte_carlo(programs, user_scores, num_simulations=10000,
                    national_shock_std: float | None = None,
                    idio_std: float | None = None,
                    random_seed: int | None = None,
                    calculate_sequential: bool = False):
    """
    Chạy mô phỏng Monte Carlo có tương quan để tính xác suất đỗ của từng chương trình
    và xác suất trượt tất cả các nguyện vọng.

    programs: List các dict, mỗi dict đại diện cho 1 chương trình học (đã lọc theo tổ hợp).
              Mỗi dict cần có 'forecast_p50' (điểm dự báo trung tâm) và tuỳ chọn
              'beta_program' (độ nhạy CỦA CHƯƠNG TRÌNH NÀY với cú sốc toàn quốc,
              mặc định 1.0 = nhạy trung bình; trường hợp cạnh tranh cao thường nhạy
              hơn (>1), trường hợp điểm sàn/ít cạnh tranh thường ít nhạy hơn (<1)).
    user_scores: Dict điểm của user (VD: {'thpt': 24.5, 'hoc_ba': 26.0})
    national_shock_std, idio_std: độ lệch chuẩn ước lượng thật từ
              common.national_shock.estimate_national_shock(); nếu không truyền,
              dùng giá trị sàn thận trọng ở trên.
    random_seed: Seed ngẫu nhiên để tái lập hoàn toàn kết quả kiểm định.
    calculate_sequential: Nếu True, tính xác suất nhập học tuần tự theo quy chế lọc ảo:
              P(đỗ NV_k và trượt tất cả NV_1..k-1).
    """
    if not programs:
        return ({}, 1.0) if not calculate_sequential else ({}, 1.0, {})

    rng = np.random.default_rng(random_seed)

    shock_std = national_shock_std if national_shock_std is not None else DEFAULT_NATIONAL_SHOCK_STD
    residual_std = idio_std if idio_std is not None else DEFAULT_IDIO_STD

    n_programs = len(programs)

    # Rút ra N cú sốc toàn quốc (Z ~ N(0, shock_std)) — CÙNG một Z cho mọi
    # chương trình trong một lần mô phỏng, vì đây chính là "năm đề dễ/khó",
    # ảnh hưởng đồng thời tới điểm chuẩn cả nước.
    Z = rng.normal(0, shock_std, num_simulations)

    mu = np.zeros(n_programs)
    beta = np.zeros(n_programs)
    sigma = np.zeros(n_programs)
    scores = np.zeros(n_programs)

    for i, p in enumerate(programs):
        mu[i] = p.get('forecast_p50', 20.0)
        beta[i] = p.get('beta_program', 1.0)
        sigma[i] = p.get('idio_std', residual_std)

        # Điểm của user tương ứng với phương thức của chương trình này
        method = p['method']
        scores[i] = user_scores.get(method, 0.0)
    
    # Ma trận Nhiễu riêng của từng trường (epsilon ~ N(0, sigma))
    epsilon = rng.normal(0, 1, (num_simulations, n_programs)) * sigma
    
    # Ma trận Điểm chuẩn dự phóng: d_p = mu + beta*Z + epsilon
    simulated_cutoffs = mu + np.outer(Z, beta) + epsilon
    
    # Đánh giá xem user có đủ điểm đỗ không ở mỗi simulation
    is_admitted = scores >= simulated_cutoffs
    
    # Xác suất đỗ độc lập từng trường
    admit_probs = np.mean(is_admitted, axis=0)
    
    # Tính xác suất trượt TẤT CẢ
    fail_all_mask = ~np.any(is_admitted, axis=1)
    p_fail_all = np.mean(fail_all_mask)
    
    # Map kết quả trả về
    results = {}
    for i, p in enumerate(programs):
        results[p['program_key']] = float(admit_probs[i])
        
    if not calculate_sequential:
        return results, float(p_fail_all)

    # Tính xác suất đỗ tuần tự (Sequential Admission under MOET rule)
    # Thí sinh chỉ được vào chương trình ĐẦU TIÊN (thứ tự ưu tiên 1..N) mà mình đủ điểm
    first_choice_idx = np.full(num_simulations, -1)
    for k in range(n_programs):
        eligible_and_not_assigned = (first_choice_idx == -1) & is_admitted[:, k]
        first_choice_idx[eligible_and_not_assigned] = k

    sequential_results = {}
    for i, p in enumerate(programs):
        sequential_results[p['program_key']] = float(np.mean(first_choice_idx == i))

    return results, float(p_fail_all), sequential_results



