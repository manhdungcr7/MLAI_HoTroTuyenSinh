-- ============================================================================
-- NGUYEN VONG AI - ENTERPRISE RELATIONAL SCHEMA (SQLITE / POSTGRESQL COMPATIBLE)
-- Phiên bản: 2.0 Production-Ready
-- Hệ quản trị cơ sở dữ liệu: SQLite 3 (có hỗ trợ Foreign Keys & Indexes)
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ----------------------------------------------------------------------------
-- 1. USER & AUTHENTICATION
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,                       -- UUID v4
    email TEXT UNIQUE,                         -- Email liên hệ (nullable cho khách ẩn danh)
    phone TEXT,                                -- Số điện thoại
    full_name TEXT NOT NULL,                   -- Họ và tên hiển thị
    role TEXT NOT NULL DEFAULT 'student'       -- 'student', 'parent', 'counselor', 'admin'
        CHECK (role IN ('student', 'parent', 'counselor', 'admin')),
    auth_provider TEXT NOT NULL DEFAULT 'guest'-- 'local', 'google', 'guest'
        CHECK (auth_provider IN ('local', 'google', 'guest')),
    password_hash TEXT,                        -- Mật khẩu băm (nếu dùng local auth)
    avatar_url TEXT,                           -- Ảnh đại diện
    is_active INTEGER NOT NULL DEFAULT 1,      -- 1: Hoạt động, 0: Khóa
    last_login_at TEXT,                        -- ISO-8601 Timestamp
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ----------------------------------------------------------------------------
-- 2. STUDENT PROFILE (Hồ sơ học sinh & nhân khẩu học)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_profiles (
    id TEXT PRIMARY KEY,                       -- UUID v4
    user_id TEXT NOT NULL,                     -- Khóa ngoại liên kết bảng users
    full_name TEXT NOT NULL,                   -- Họ tên học sinh
    dob TEXT,                                  -- Ngày sinh (YYYY-MM-DD)
    gender TEXT DEFAULT 'khac'                 -- 'nam', 'nu', 'khac'
        CHECK (gender IN ('nam', 'nu', 'khac')),
    phone TEXT,                                -- Điện thoại cá nhân
    current_grade TEXT NOT NULL DEFAULT '12'   -- '10', '11', '12', 'da_tot_nghiep'
        CHECK (current_grade IN ('10', '11', '12', 'da_tot_nghiep')),
    high_school_name TEXT,                     -- Tên trường THPT đang/đã học
    high_school_code TEXT,                     -- Mã định danh trường THPT (nếu có)
    home_province TEXT NOT NULL,               -- Tỉnh/Thành phố cư trú
    home_district TEXT,                        -- Quận/Huyện cư trú
    priority_area TEXT NOT NULL DEFAULT 'KV3'  -- 'KV1', 'KV2-NT', 'KV2', 'KV3'
        CHECK (priority_area IN ('KV1', 'KV2-NT', 'KV2', 'KV3')),
    priority_object TEXT NOT NULL DEFAULT 'none' -- 'none', 'uu_tien_1', 'uu_tien_2', 'uu_tien_3'
        CHECK (priority_object IN ('none', 'uu_tien_1', 'uu_tien_2', 'uu_tien_3')),
    policy_status TEXT NOT NULL DEFAULT 'none' -- 'none', 'ho_ngheo', 'can_ngheo', 'dan_toc_thieu_so', 'khuyet_tat', 'mo_coi', 'vung_dbkk'
        CHECK (policy_status IN ('none', 'ho_ngheo', 'can_ngheo', 'dan_toc_thieu_so', 'khuyet_tat', 'mo_coi', 'vung_dbkk')),
    available_hours_per_week REAL DEFAULT 28.0 CHECK (available_hours_per_week >= 0),
    active_combination TEXT DEFAULT 'A01',     -- Tổ hợp thi trọng tâm hiện tại (e.g. 'A00', 'A01', 'D01')
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_province ON student_profiles(home_province);

-- ----------------------------------------------------------------------------
-- 3. ACADEMIC RECORD (Học bạ từng năm / học kỳ)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS academic_records (
    id TEXT PRIMARY KEY,                       -- UUID v4
    profile_id TEXT NOT NULL,                  -- Khóa ngoại hồ sơ học sinh
    academic_year TEXT NOT NULL,               -- Ví dụ "2023-2024", "2024-2025"
    grade_level INTEGER NOT NULL               -- 10, 11, 12
        CHECK (grade_level IN (10, 11, 12)),
    semester INTEGER NOT NULL DEFAULT 0        -- 1: Học kỳ 1, 2: Học kỳ 2, 0: Cả năm
        CHECK (semester IN (0, 1, 2)),
    gpa REAL CHECK (gpa >= 0.0 AND gpa <= 10.0),-- Điểm trung bình học tập
    conduct TEXT DEFAULT 'tot'                 -- Hạnh kiểm: 'tot', 'kha', 'trung_binh', 'yeu'
        CHECK (conduct IN ('tot', 'kha', 'trung_binh', 'yeu')),
    transcript_image_url TEXT,                 -- URL ảnh chụp học bạ minh chứng
    is_verified INTEGER NOT NULL DEFAULT 0,    -- 0: Tự khai, 1: Đã xác thực qua OCR / duyệt
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
    UNIQUE (profile_id, academic_year, grade_level, semester)
);

CREATE INDEX IF NOT EXISTS idx_academic_records_profile ON academic_records(profile_id);

-- ----------------------------------------------------------------------------
-- 4. SUBJECT SCORE (Điểm chi tiết từng môn theo học bạ hoặc kỳ thi)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subject_scores (
    id TEXT PRIMARY KEY,                       -- UUID v4
    profile_id TEXT NOT NULL,                  -- Khóa ngoại hồ sơ học sinh
    academic_record_id TEXT,                   -- Liên kết học bạ (NULL nếu điểm thi THPT/thi thử)
    subject_code TEXT NOT NULL                 -- 'toan', 'van', 'anh', 'ly', 'hoa', 'sinh', 'su', 'dia', 'gdcd', 'tin_hoc', 'cong_nghe'
        CHECK (subject_code IN ('toan', 'van', 'anh', 'ly', 'hoa', 'sinh', 'su', 'dia', 'gdcd', 'tin_hoc', 'cong_nghe')),
    subject_name_vi TEXT NOT NULL,             -- Tên tiếng Việt: 'Toán', 'Ngữ văn', 'Tiếng Anh'...
    score REAL NOT NULL CHECK (score >= 0.0 AND score <= 10.0), -- Điểm số thang 10
    score_type TEXT NOT NULL                   -- 'hoc_ba_hk1', 'hoc_ba_hk2', 'hoc_ba_ca_nam', 'thi_thpt_chinh_thuc', 'thi_thu_hien_tai', 'muc_tieu'
        CHECK (score_type IN ('hoc_ba_hk1', 'hoc_ba_hk2', 'hoc_ba_ca_nam', 'thi_thpt_chinh_thuc', 'thi_thu_hien_tai', 'muc_tieu')),
    semester INTEGER,                          -- 1, 2, NULL
    grade_level INTEGER CHECK (grade_level IN (10, 11, 12, NULL)),
    exam_year INTEGER,                         -- Năm thi (e.g. 2024, 2025, 2026)
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (academic_record_id) REFERENCES academic_records(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_subject_scores_profile_subj ON subject_scores(profile_id, subject_code);
CREATE INDEX IF NOT EXISTS idx_subject_scores_type ON subject_scores(score_type);

-- ----------------------------------------------------------------------------
-- 5. MOCK EXAM RESULT (Kết quả thi thử, ĐGNL, ĐGTD, Chứng chỉ ngoại ngữ)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mock_exam_results (
    id TEXT PRIMARY KEY,                       -- UUID v4
    profile_id TEXT NOT NULL,                  -- Khóa ngoại hồ sơ học sinh
    exam_name TEXT NOT NULL,                   -- Ví dụ: "Thi thử Sở GD Hà Nội Lần 1", "ĐGNL ĐHQG-HCM Đợt 1 2025"
    exam_type TEXT NOT NULL                    -- 'thpt_mock', 'dgnl_hcm', 'dgnl_hn', 'dgtd_bk', 'ielts', 'toefl', 'sat'
        CHECK (exam_type IN ('thpt_mock', 'dgnl_hcm', 'dgnl_hn', 'dgtd_bk', 'ielts', 'toefl', 'sat')),
    exam_date TEXT NOT NULL,                   -- Ngày thi (YYYY-MM-DD)
    total_score REAL NOT NULL,                 -- Tổng điểm đạt được
    max_scale REAL NOT NULL,                   -- Thang điểm tối đa (10, 30, 100, 150, 1200, 9.0, 1600)
    reliability_tier TEXT NOT NULL DEFAULT 'tier_2_so_gd' -- 'tier_1_chuan_hoa', 'tier_2_so_gd', 'tier_3_truong_lop', 'tier_4_tu_luyen'
        CHECK (reliability_tier IN ('tier_1_chuan_hoa', 'tier_2_so_gd', 'tier_3_truong_lop', 'tier_4_tu_luyen')),
    reliability_weight REAL NOT NULL DEFAULT 1.0 CHECK (reliability_weight >= 0.1 AND reliability_weight <= 1.0),
    details_json TEXT,                         -- Chi tiết điểm từng môn/phần thi dạng JSON
    notes TEXT,                                -- Ghi chú nhận xét
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_mock_exam_results_profile ON mock_exam_results(profile_id, exam_date);
CREATE INDEX IF NOT EXISTS idx_mock_exam_type ON mock_exam_results(exam_type);

-- ----------------------------------------------------------------------------
-- 6. UNIVERSITY (Cơ sở giáo dục đại học)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS universities (
    id TEXT PRIMARY KEY,                       -- Mã trường hoặc UUID, e.g. "BKA", "QHI", "KHA"
    code TEXT UNIQUE NOT NULL,                 -- Mã tuyển sinh chính thức (e.g. "BKA", "QHI", "UEH")
    name_vi TEXT NOT NULL,                     -- Tên tiếng Việt đầy đủ
    name_en TEXT,                              -- Tên tiếng Anh
    short_name TEXT,                           -- Tên viết tắt thông dụng (e.g. "Bách Khoa HN")
    type TEXT NOT NULL DEFAULT 'cong_lap'      -- 'cong_lap', 'ngoai_cong_lap', 'quoc_te', 'lien_ket'
        CHECK (type IN ('cong_lap', 'ngoai_cong_lap', 'quoc_te', 'lien_ket')),
    ranking_national INTEGER,                  -- Xếp hạng đại học quốc nội
    province TEXT NOT NULL,                    -- Tỉnh/Thành phố đặt trụ sở chính
    region TEXT NOT NULL                       -- 'bac', 'trung', 'nam'
        CHECK (region IN ('bac', 'trung', 'nam')),
    address TEXT,                              -- Địa chỉ trụ sở chính
    website TEXT,                              -- Website chính thức
    logo_url TEXT,                             -- URL logo trường
    admission_url TEXT,                        -- Cổng thông tin tuyển sinh
    dean_doc_url TEXT,                         -- Link Đề án tuyển sinh gốc đã đối soát
    established_year INTEGER,                  -- Năm thành lập
    is_active INTEGER NOT NULL DEFAULT 1,      -- 1: Hoạt động tuyển sinh, 0: Tạm dừng
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_universities_code ON universities(code);
CREATE INDEX IF NOT EXISTS idx_universities_province ON universities(province);
CREATE INDEX IF NOT EXISTS idx_universities_region ON universities(region);

-- ----------------------------------------------------------------------------
-- 7. MAJOR (Ngành & Chuyên ngành đào tạo)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS majors (
    id TEXT PRIMARY KEY,                       -- ID duy nhất e.g. "7480201" hoặc "BKA_7480201"
    code TEXT NOT NULL,                        -- Mã ngành cấp 4 theo Bộ GD-ĐT (e.g. "7480201")
    name_vi TEXT NOT NULL,                     -- Tên tiếng Việt: "Công nghệ thông tin"
    name_en TEXT,                              -- Tên tiếng Anh
    major_group_code TEXT NOT NULL             -- 'cntt', 'ky_thuat', 'kinh_te', 'luat', 'ngon_ngu', 'y_duoc', 'su_pham', 'xa_hoi', 'du_lich', 'nong_lam', 'kien_truc', 'the_thao'
        CHECK (major_group_code IN ('cntt', 'ky_thuat', 'kinh_te', 'luat', 'ngon_ngu', 'y_duoc', 'su_pham', 'xa_hoi', 'du_lich', 'nong_lam', 'kien_truc', 'the_thao')),
    major_group_name TEXT NOT NULL,            -- Tên nhóm ngành hiển thị
    degree_level TEXT DEFAULT 'cu_nhan'        -- 'cu_nhan', 'ky_su', 'thac_si', 'bac_si', 'duoc_si'
        CHECK (degree_level IN ('cu_nhan', 'ky_su', 'thac_si', 'bac_si', 'duoc_si')),
    training_duration_years REAL DEFAULT 4.0,  -- Số năm đào tạo chuẩn
    ai_exposure_index REAL DEFAULT 0.5 CHECK (ai_exposure_index >= 0.0 AND ai_exposure_index <= 1.0), -- Tác động tự động hóa AI 2030
    employment_rate_benchmark REAL,            -- Tỷ lệ việc làm chuẩn của ngành (%)
    avg_starting_salary_mvnd REAL,             -- Lương khởi điểm bình quân tham khảo (triệu VNĐ)
    description TEXT,                          -- Mô tả ngành học
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_majors_code ON majors(code);
CREATE INDEX IF NOT EXISTS idx_majors_group ON majors(major_group_code);

-- ----------------------------------------------------------------------------
-- 8. ADMISSION METHOD (Phương thức tuyển sinh)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admission_methods (
    id TEXT PRIMARY KEY,                       -- e.g. "PT100", "PT200", "PT402"
    code TEXT NOT NULL,                        -- Mã phương thức quy định: "100", "200", "402", "409", "301"
    name_vi TEXT NOT NULL,                     -- Tên phương thức tiếng Việt
    scale REAL NOT NULL DEFAULT 30.0,          -- Thang điểm xét tuyển chuẩn (30, 100, 150, 1200)
    description TEXT,                          -- Mô tả quy chế xét tuyển
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ----------------------------------------------------------------------------
-- 9. SUBJECT COMBINATION (Tổ hợp môn xét tuyển)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subject_combinations (
    id TEXT PRIMARY KEY,                       -- e.g. "A00", "A01", "D01"
    code TEXT UNIQUE NOT NULL,                 -- Mã tổ hợp (e.g. "A00", "A01", "B00", "C00", "D01")
    subject_1 TEXT NOT NULL,                   -- Môn 1 (e.g. "toan")
    subject_2 TEXT NOT NULL,                   -- Môn 2 (e.g. "ly")
    subject_3 TEXT NOT NULL,                   -- Môn 3 (e.g. "hoa")
    subject_weights_json TEXT,                 -- Trọng số môn thi (JSON, e.g. '{"toan": 2, "anh": 1, "van": 1}')
    description TEXT                           -- Diễn giải tên các môn
);

-- ----------------------------------------------------------------------------
-- 10. DATA SOURCE & PROVENANCE (Nguồn dữ liệu & Bảo chứng xuất xứ)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS data_sources (
    id TEXT PRIMARY KEY,                       -- UUID v4 hoặc mã định danh nguồn (e.g. "SRC_BKA_2024_DEAN")
    name TEXT NOT NULL,                        -- Tên nguồn e.g. "Đề án Tuyển sinh ĐH Bách Khoa Hà Nội 2024"
    source_type TEXT NOT NULL DEFAULT 'official_pdf' -- 'regulation', 'official_pdf', 'official_web', 'secondary', 'estimated_fallback'
        CHECK (source_type IN ('regulation', 'official_pdf', 'official_web', 'secondary', 'estimated_fallback')),
    publisher TEXT,                            -- Đơn vị ban hành (e.g. "ĐH Bách Khoa Hà Nội", "Bộ GD&ĐT")
    document_title TEXT,                       -- Tiêu đề văn bản
    document_number TEXT,                      -- Số hiệu văn bản / Quyết định (e.g. "2145/QĐ-ĐHBK")
    document_url TEXT,                         -- Đường dẫn URL văn bản / file PDF
    published_at TEXT,                         -- Ngày ban hành (YYYY-MM-DD)
    retrieved_at TEXT,                         -- Ngày thu thập
    content_hash TEXT,                         -- Mã băm SHA-256 bất biến của tài liệu
    parser_version TEXT DEFAULT 'pipeline.clean@2.1.0', -- Phiên bản parser bóc tách
    verification_status TEXT NOT NULL DEFAULT 'cross_checked' -- 'unverified', 'cross_checked', 'human_audited', 'conflict_flagged'
        CHECK (verification_status IN ('unverified', 'cross_checked', 'human_audited', 'conflict_flagged')),
    confidence REAL DEFAULT 1.0 CHECK (confidence >= 0.0 AND confidence <= 1.0),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_data_sources_publisher ON data_sources(publisher);
CREATE INDEX IF NOT EXISTS idx_data_sources_type ON data_sources(source_type);

-- ----------------------------------------------------------------------------
-- 11. HISTORICAL CUTOFF (Điểm chuẩn lịch sử tuyển sinh & Data Provenance)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS historical_cutoffs (
    id TEXT PRIMARY KEY,                       -- UUID v4
    university_id TEXT NOT NULL,               -- Khóa ngoại trường
    major_id TEXT NOT NULL,                    -- Khóa ngoại ngành
    method_id TEXT NOT NULL,                   -- Khóa ngoại phương thức tuyển sinh
    combination_id TEXT NOT NULL,              -- Khóa ngoại tổ hợp xét tuyển
    year INTEGER NOT NULL                      -- Năm tuyển sinh (e.g. 2021, 2022, 2023, 2024, 2025)
        CHECK (year >= 2018 AND year <= 2030),
    cutoff_score REAL NOT NULL,                -- Điểm chuẩn trúng tuyển
    quota INTEGER,                             -- Chỉ tiêu tuyển sinh của ngành/tổ hợp
    secondary_criteria TEXT,                   -- Tiêu chí phụ (e.g. "Toán >= 8.0, TT NV <= 2")
    source_url TEXT,                           -- Link đề án / quyết định công bố điểm trúng tuyển (legacy)
    source_id TEXT,                            -- Khóa ngoại nguồn dữ liệu (Data Provenance)
    document_url TEXT,                         -- URL tài liệu chính thức xác thực
    page_number INTEGER,                       -- Số trang cụ thể trong văn bản / đề án
    extracted_at TEXT,                         -- Thời điểm bóc tách dữ liệu
    parser_version TEXT,                       -- Phiên bản pipeline parser bóc tách
    content_hash TEXT,                         -- Mã băm SHA-256 xác thực bất biến
    data_quality TEXT NOT NULL DEFAULT 'day_du'-- 'day_du', 'thieu_mot_phan', 'chi_1_nam', 'uoc_luong'
        CHECK (data_quality IN ('day_du', 'thieu_mot_phan', 'chi_1_nam', 'uoc_luong')),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE,
    FOREIGN KEY (major_id) REFERENCES majors(id) ON DELETE CASCADE,
    FOREIGN KEY (method_id) REFERENCES admission_methods(id) ON DELETE RESTRICT,
    FOREIGN KEY (combination_id) REFERENCES subject_combinations(id) ON DELETE RESTRICT,
    FOREIGN KEY (source_id) REFERENCES data_sources(id) ON DELETE SET NULL,
    UNIQUE (university_id, major_id, method_id, combination_id, year)
);

CREATE INDEX IF NOT EXISTS idx_cutoffs_univ_major ON historical_cutoffs(university_id, major_id);
CREATE INDEX IF NOT EXISTS idx_cutoffs_year ON historical_cutoffs(year);
CREATE INDEX IF NOT EXISTS idx_cutoffs_comb ON historical_cutoffs(combination_id);
CREATE INDEX IF NOT EXISTS idx_cutoffs_source_id ON historical_cutoffs(source_id);

-- ----------------------------------------------------------------------------
-- 12. TUITION (Học phí trường / ngành & Data Provenance)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tuitions (
    id TEXT PRIMARY KEY,                       -- UUID v4
    university_id TEXT NOT NULL,               -- Khóa ngoại trường
    major_id TEXT,                             -- Khóa ngoại ngành (NULL nếu áp dụng toàn trường)
    academic_year TEXT NOT NULL,               -- Năm học, e.g. "2024-2025"
    tuition_min_mvnd REAL NOT NULL,            -- Học phí tối thiểu (triệu VNĐ/năm)
    tuition_max_mvnd REAL NOT NULL,            -- Học phí tối đa (triệu VNĐ/năm)
    cost_per_credit_vnd INTEGER,               -- Đơn giá mỗi tín chỉ (VNĐ)
    program_type TEXT NOT NULL DEFAULT 'chuan' -- 'chuan', 'chat_luong_cao', 'tien_tien', 'quoc_te'
        CHECK (program_type IN ('chuan', 'chat_luong_cao', 'tien_tien', 'quoc_te')),
    is_estimated INTEGER NOT NULL DEFAULT 0,   -- 1: Ước lượng, 0: Trích từ Đề án công khai
    escalation_rate_pct REAL DEFAULT 10.0,     -- Dự kiến tăng học phí hàng năm (%)
    source_id TEXT,                            -- Khóa ngoại nguồn dữ liệu (Data Provenance)
    document_url TEXT,                         -- URL tài liệu chính thức xác thực
    page_number INTEGER,                       -- Số trang cụ thể trong văn bản / đề án
    extracted_at TEXT,                         -- Thời điểm bóc tách dữ liệu
    parser_version TEXT,                       -- Phiên bản pipeline parser bóc tách
    content_hash TEXT,                         -- Mã băm SHA-256 xác thực bất biến
    notes TEXT,                                -- Ghi chú chi tiết
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE,
    FOREIGN KEY (major_id) REFERENCES majors(id) ON DELETE SET NULL,
    FOREIGN KEY (source_id) REFERENCES data_sources(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tuitions_univ ON tuitions(university_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_tuitions_source_id ON tuitions(source_id);

-- ----------------------------------------------------------------------------
-- 13. LOCATION (Địa điểm đào tạo & Chi phí sinh hoạt vùng)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,                       -- UUID v4
    university_id TEXT NOT NULL,               -- Khóa ngoại trường
    campus_name TEXT NOT NULL,                 -- Tên cơ sở / phân hiệu
    province TEXT NOT NULL,                    -- Tỉnh / Thành phố
    district TEXT,                             -- Quận / Huyện
    address TEXT NOT NULL,                     -- Địa chỉ chi tiết
    latitude REAL,                             -- Vĩ độ GPS
    longitude REAL,                            -- Kinh độ GPS
    monthly_living_cost_estimate_mvnd REAL DEFAULT 4.5, -- Chi phí sinh hoạt ước tính (triệu VNĐ/tháng)
    is_headquarter INTEGER NOT NULL DEFAULT 1, -- 1: Cơ sở chính, 0: Phân hiệu/cơ sở phụ
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_locations_univ ON locations(university_id);
CREATE INDEX IF NOT EXISTS idx_locations_province ON locations(province);

-- ----------------------------------------------------------------------------
-- 14. OCCUPATION (Danh mục Nghề nghiệp & Thị trường lao động)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS occupations (
    id TEXT PRIMARY KEY,                       -- UUID v4 hoặc mã nghề (e.g. "OCC_SWE")
    code TEXT NOT NULL UNIQUE,                 -- Mã nghề chuẩn hóa (e.g. "2512-SWE")
    title_vi TEXT NOT NULL,                    -- Tên nghề nghiệp tiếng Việt
    title_en TEXT,                             -- Tên nghề nghiệp tiếng Anh
    soc_code TEXT,                             -- Mã Standard Occupational Classification (SOC)
    description TEXT,                          -- Mô tả công việc, trách nhiệm chính
    growth_outlook TEXT DEFAULT 'cao'          -- 'rat_cao', 'cao', 'on_dinh', 'giam'
        CHECK (growth_outlook IN ('rat_cao', 'cao', 'on_dinh', 'giam')),
    ai_exposure_score REAL DEFAULT 0.5         -- Điểm tác động AI 2030 (0.0 -> 1.0)
        CHECK (ai_exposure_score >= 0.0 AND ai_exposure_score <= 1.0),
    ai_risk_level TEXT DEFAULT 'trung_binh'    -- Mức rủi ro tự động hóa: 'thap', 'trung_binh', 'cao'
        CHECK (ai_risk_level IN ('thap', 'trung_binh', 'cao')),
    entry_salary_avg_mvnd REAL,                -- Lương khởi điểm trung bình (triệu VNĐ/tháng)
    mid_career_salary_avg_mvnd REAL,            -- Lương sau 3-5 năm (triệu VNĐ/tháng)
    work_environment TEXT,                     -- Môi trường làm việc
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_occupations_code ON occupations(code);
CREATE INDEX IF NOT EXISTS idx_occupations_ai_risk ON occupations(ai_risk_level);

-- ----------------------------------------------------------------------------
-- 15. MAJOR OCCUPATION MAPPING (Ánh xạ Ngành đào tạo sang Nghề nghiệp)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS major_occupations (
    id TEXT PRIMARY KEY,                       -- UUID v4
    major_id TEXT NOT NULL,                    -- Khóa ngoại ngành đào tạo
    occupation_id TEXT NOT NULL,               -- Khóa ngoại nghề nghiệp
    relevance_score REAL DEFAULT 1.0           -- Điểm liên quan / phù hợp (0.0 -> 1.0)
        CHECK (relevance_score >= 0.0 AND relevance_score <= 1.0),
    employment_rate_pct REAL,                  -- Tỷ lệ sinh viên làm đúng nghề này (%)
    transition_friction TEXT DEFAULT 'thap'    -- Độ khó chuyển nghề: 'thap', 'trung_binh', 'cao'
        CHECK (transition_friction IN ('thap', 'trung_binh', 'cao')),
    career_pathway_notes TEXT,                 -- Lộ trình chuyển tiếp từ ngành ra nghề
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (major_id) REFERENCES majors(id) ON DELETE CASCADE,
    FOREIGN KEY (occupation_id) REFERENCES occupations(id) ON DELETE CASCADE,
    UNIQUE (major_id, occupation_id)
);

CREATE INDEX IF NOT EXISTS idx_major_occupations_major ON major_occupations(major_id);
CREATE INDEX IF NOT EXISTS idx_major_occupations_occ ON major_occupations(occupation_id);

-- ----------------------------------------------------------------------------
-- 16. SKILL REQUIREMENT (Kỹ năng cốt lõi theo Nghề nghiệp)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS skill_requirements (
    id TEXT PRIMARY KEY,                       -- UUID v4
    occupation_id TEXT NOT NULL,               -- Khóa ngoại nghề nghiệp
    skill_name TEXT NOT NULL,                  -- Tên kỹ năng (hard skill, soft skill, tool)
    skill_type TEXT NOT NULL DEFAULT 'hard_skill' -- 'hard_skill', 'soft_skill', 'domain_knowledge', 'tool_technology'
        CHECK (skill_type IN ('hard_skill', 'soft_skill', 'domain_knowledge', 'tool_technology')),
    proficiency_level TEXT DEFAULT 'intermediate' -- 'basic', 'intermediate', 'advanced', 'expert'
        CHECK (proficiency_level IN ('basic', 'intermediate', 'advanced', 'expert')),
    importance_weight REAL DEFAULT 1.0         -- Trọng số quan trọng (0.0 -> 1.0)
        CHECK (importance_weight >= 0.0 AND importance_weight <= 1.0),
    market_demand_trend TEXT DEFAULT 'tang_manh' -- Xu hướng thị trường: 'tang_manh', 'tang_nhe', 'on_dinh', 'giam'
        CHECK (market_demand_trend IN ('tang_manh', 'tang_nhe', 'on_dinh', 'giam')),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (occupation_id) REFERENCES occupations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_skills_occ ON skill_requirements(occupation_id);
CREATE INDEX IF NOT EXISTS idx_skills_type ON skill_requirements(skill_type);

-- ----------------------------------------------------------------------------
-- 17. TARGET (Mục tiêu tuyển sinh cá nhân)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS targets (
    id TEXT PRIMARY KEY,                       -- UUID v4
    profile_id TEXT NOT NULL,                  -- Khóa ngoại học sinh
    university_id TEXT NOT NULL,               -- Trường mục tiêu
    major_id TEXT NOT NULL,                    -- Ngành mục tiêu
    admission_method_id TEXT,                  -- Phương thức dự kiến xét tuyển
    subject_combination_id TEXT,               -- Tổ hợp môn dự kiến
    priority_order INTEGER NOT NULL DEFAULT 1  -- Thứ tự ưu tiên (1 = Mục tiêu số 1)
        CHECK (priority_order >= 1),
    target_type TEXT NOT NULL DEFAULT 'target_primary' -- 'dream', 'target_primary', 'backup'
        CHECK (target_type IN ('dream', 'target_primary', 'backup')),
    target_score REAL,                         -- Điểm số mục tiêu cần đạt
    current_gap REAL,                          -- Độ lệch hiện tại (Điểm hiện có - Điểm cần đạt)
    status TEXT NOT NULL DEFAULT 'active'      -- 'active', 'achieved', 'abandoned', 'revising'
        CHECK (status IN ('active', 'achieved', 'abandoned', 'revising')),
    notes TEXT,                                -- Ghi chú mục tiêu
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE RESTRICT,
    FOREIGN KEY (major_id) REFERENCES majors(id) ON DELETE RESTRICT,
    FOREIGN KEY (admission_method_id) REFERENCES admission_methods(id) ON DELETE SET NULL,
    FOREIGN KEY (subject_combination_id) REFERENCES subject_combinations(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_targets_profile ON targets(profile_id, priority_order);

-- ----------------------------------------------------------------------------
-- 18. PREFERENCE (Sở thích, tính cách nghề nghiệp & thiên hướng)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS preferences (
    id TEXT PRIMARY KEY,                       -- UUID v4
    profile_id TEXT NOT NULL,                  -- Khóa ngoại học sinh
    major_group_code TEXT NOT NULL             -- Nhóm ngành yêu thích
        CHECK (major_group_code IN ('cntt', 'ky_thuat', 'kinh_te', 'luat', 'ngon_ngu', 'y_duoc', 'su_pham', 'xa_hoi', 'du_lich', 'nong_lam', 'kien_truc', 'the_thao')),
    weight REAL NOT NULL DEFAULT 1.0 CHECK (weight >= 0.0 AND weight <= 1.0),
    career_importance REAL DEFAULT 0.5 CHECK (career_importance >= 0.0 AND career_importance <= 1.0),
    school_prestige_sensitivity REAL DEFAULT 0.5 CHECK (school_prestige_sensitivity >= 0.0 AND school_prestige_sensitivity <= 1.0),
    holland_r REAL DEFAULT 0.0,                -- Điểm Holland Realistic (Kỹ thuật)
    holland_i REAL DEFAULT 0.0,                -- Điểm Holland Investigative (Nghiên cứu)
    holland_a REAL DEFAULT 0.0,                -- Điểm Holland Artistic (Nghệ thuật)
    holland_s REAL DEFAULT 0.0,                -- Điểm Holland Social (Xã hội)
    holland_e REAL DEFAULT 0.0,                -- Điểm Holland Enterprising (Quản lý)
    holland_c REAL DEFAULT 0.0,                -- Điểm Holland Conventional (Nghiệp vụ)
    environment_preference TEXT DEFAULT 'nang_dong' -- 'nang_dong', 'nghien_cuu', 'quoc_te', 'ky_luat'
        CHECK (environment_preference IN ('nang_dong', 'nghien_cuu', 'quoc_te', 'ky_luat')),
    is_favorite INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_preferences_profile ON preferences(profile_id);

-- ----------------------------------------------------------------------------
-- 19. CONSTRAINT (Ràng buộc cứng & mềm của gia đình / cá nhân)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS constraints (
    id TEXT PRIMARY KEY,                       -- UUID v4
    profile_id TEXT NOT NULL,                  -- Khóa ngoại học sinh
    max_annual_budget_vnd INTEGER NOT NULL CHECK (max_annual_budget_vnd >= 0), -- Ngân sách gia đình tối đa / năm
    relocation_willingness TEXT NOT NULL DEFAULT 'trong_vung' -- 'chi_tinh_nha', 'trong_vung', 'khong_gioi_han'
        CHECK (relocation_willingness IN ('chi_tinh_nha', 'trong_vung', 'khong_gioi_han')),
    must_stay_near_home INTEGER NOT NULL DEFAULT 0, -- 1: Ràng buộc cứng phải ở gần nhà
    preferred_regions TEXT,                    -- JSON array: '["bac", "nam"]'
    excluded_university_ids TEXT,              -- JSON array các mã trường bị loại trừ
    excluded_major_groups TEXT,                -- JSON array các nhóm ngành bị loại trừ
    max_daily_commute_km REAL,                 -- Khoảng cách đi lại tối đa hàng ngày (km)
    special_health_conditions TEXT,            -- Ràng buộc sức khỏe (nếu có)
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_constraints_profile ON constraints(profile_id);

-- ----------------------------------------------------------------------------
-- 20. RECOMMENDATION (Phiên tư vấn & Danh mục danh mục nguyện vọng)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recommendations (
    id TEXT PRIMARY KEY,                       -- UUID v4
    profile_id TEXT NOT NULL,                  -- Khóa ngoại học sinh
    session_id TEXT NOT NULL,                  -- Định danh phiên tư vấn
    risk_tolerance REAL NOT NULL CHECK (risk_tolerance >= 0.001 AND risk_tolerance <= 0.5), -- Ngưỡng rủi ro trượt trắng
    ambition_level REAL NOT NULL CHECK (ambition_level >= 0.0 AND ambition_level <= 1.0),   -- Độ mạo hiểm
    max_wishes INTEGER NOT NULL DEFAULT 15 CHECK (max_wishes >= 1 AND max_wishes <= 15),
    p_fail_all REAL NOT NULL,                  -- Xác suất trượt tất cả các nguyện vọng
    n_selected INTEGER NOT NULL,               -- Số lượng nguyện vọng đã phân bổ
    strategy_type TEXT NOT NULL DEFAULT 'monte_carlo_portfolio' -- 'monte_carlo_portfolio', 'quantile_risk_balanced'
        CHECK (strategy_type IN ('monte_carlo_portfolio', 'quantile_risk_balanced')),
    request_payload_json TEXT NOT NULL,        -- Bản sao đầy đủ request đầu vào (SSOT)
    summary_metrics_json TEXT,                 -- Tóm tắt chỉ số phân bổ (số lượng an toàn, vừa tầm, mạo hiểm)
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_recommendations_profile ON recommendations(profile_id, created_at);
CREATE INDEX IF NOT EXISTS idx_recommendations_session ON recommendations(session_id);

-- ----------------------------------------------------------------------------
-- 21. RECOMMENDATION REASON (Chi tiết giải trình từng nguyện vọng)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recommendation_reasons (
    id TEXT PRIMARY KEY,                       -- UUID v4
    recommendation_id TEXT NOT NULL,           -- Khóa ngoại danh mục gợi ý
    wish_rank INTEGER NOT NULL CHECK (wish_rank >= 1 AND wish_rank <= 15), -- Thứ tự NV 1..15
    university_id TEXT NOT NULL,               -- Trường đề xuất
    major_id TEXT NOT NULL,                    -- Ngành đề xuất
    combination_id TEXT,                       -- Tổ hợp tối ưu được chọn
    role TEXT NOT NULL                         -- 'mao_hiem', 'vua_tam', 'an_toan'
        CHECK (role IN ('mao_hiem', 'vua_tam', 'an_toan')),
    admit_probability REAL NOT NULL CHECK (admit_probability >= 0.0 AND admit_probability <= 1.0),
    predicted_cutoff_p10 REAL,                 -- Điểm chuẩn dự báo bách phân vị 10
    predicted_cutoff_p50 REAL,                 -- Điểm chuẩn dự báo trung vị
    predicted_cutoff_p90 REAL,                 -- Điểm chuẩn dự báo bách phân vị 90
    user_simulated_score REAL,                 -- Điểm thi mô phỏng của học sinh
    score_gap REAL,                            -- Độ chênh lệch điểm (user - p50)
    fit_utility REAL DEFAULT 0.0,              -- Điểm thành phần: Đam mê / sở thích
    cost_utility REAL DEFAULT 0.0,             -- Điểm thành phần: Phù hợp tài chính
    location_utility REAL DEFAULT 0.0,         -- Điểm thành phần: Khoảng cách địa lý
    career_utility REAL DEFAULT 0.0,           -- Điểm thành phần: Triển vọng nghề nghiệp
    capability_utility REAL DEFAULT 0.0,       -- Điểm thành phần: Độ an toàn năng lực
    total_utility REAL NOT NULL,               -- Tổng điểm thỏa dụng đa mục tiêu
    data_quality TEXT NOT NULL DEFAULT 'day_du',
    explanation_vi TEXT NOT NULL,              -- Lời giải thích minh bạch vì sao chọn nguyện vọng này
    warnings_vi_json TEXT,                     -- Danh sách cảnh báo rủi ro (JSON array)
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (recommendation_id) REFERENCES recommendations(id) ON DELETE CASCADE,
    FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE RESTRICT,
    FOREIGN KEY (major_id) REFERENCES majors(id) ON DELETE RESTRICT,
    FOREIGN KEY (combination_id) REFERENCES subject_combinations(id) ON DELETE SET NULL,
    UNIQUE (recommendation_id, wish_rank)
);

CREATE INDEX IF NOT EXISTS idx_rec_reasons_rec_rank ON recommendation_reasons(recommendation_id, wish_rank);
CREATE INDEX IF NOT EXISTS idx_rec_reasons_role ON recommendation_reasons(role);

-- ----------------------------------------------------------------------------
-- 22. SCENARIO (Mô phỏng Kịch bản What-If)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scenarios (
    id TEXT PRIMARY KEY,                       -- UUID v4
    profile_id TEXT,                           -- Khóa ngoại học sinh (nullable cho kịch bản độc lập/demo)
    name TEXT NOT NULL,                        -- Tên kịch bản: e.g. "Toán +1.0, Tiếng Anh +0.5"
    score_deltas_json TEXT,                    -- JSON thay đổi điểm từng môn: '{"toan": 1.0, "anh": 0.5}'
    national_shock_delta REAL DEFAULT 0.0,     -- Biến động điểm chuẩn toàn quốc giả định
    budget_delta_vnd INTEGER DEFAULT 0,        -- Thay đổi ngân sách gia đình
    prev_p_fail_all REAL,                      -- Xác suất trượt ban đầu
    new_p_fail_all REAL,                       -- Xác suất trượt sau khi mô phỏng
    unlocked_programs_count INTEGER DEFAULT 0, -- Số ngành/trường mới được mở ra
    promotions_json TEXT,                      -- JSON danh sách nguyện vọng được nâng hạng an toàn
    notes TEXT,                                -- Ghi chú phân tích kịch bản
    data_json TEXT,                            -- Lưu trữ payload kịch bản mở rộng
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scenarios_profile ON scenarios(profile_id);

-- ----------------------------------------------------------------------------
-- 23. STUDY PLAN (Kế hoạch ôn thi cá nhân hóa)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS study_plans (
    id TEXT PRIMARY KEY,                       -- UUID v4
    profile_id TEXT NOT NULL,                  -- Khóa ngoại học sinh
    recommendation_id TEXT,                    -- Khóa ngoại danh mục nguyện vọng định hướng
    target_id TEXT,                            -- Khóa ngoại mục tiêu số 1
    total_available_hours_per_week REAL NOT NULL DEFAULT 40.0 CHECK (total_available_hours_per_week > 0),
    start_date TEXT NOT NULL,                  -- Ngày bắt đầu (YYYY-MM-DD)
    exam_date TEXT NOT NULL,                   -- Ngày thi chính thức (YYYY-MM-DD)
    total_weeks INTEGER NOT NULL CHECK (total_weeks >= 1),
    current_week INTEGER NOT NULL DEFAULT 1 CHECK (current_week >= 1),
    time_deduction_json TEXT,                  -- JSON chi tiết khấu trừ quỹ thời gian 168 giờ
    convergence_velocity_note TEXT,            -- Nhận xét tốc độ hội tụ điểm số
    status TEXT NOT NULL DEFAULT 'active'      -- 'active', 'paused', 'completed'
        CHECK (status IN ('active', 'paused', 'completed')),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (recommendation_id) REFERENCES recommendations(id) ON DELETE SET NULL,
    FOREIGN KEY (target_id) REFERENCES targets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_study_plans_profile ON study_plans(profile_id);

-- ----------------------------------------------------------------------------
-- 24. STUDY TASK (Nhiệm vụ & Slot học tập cụ thể)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS study_tasks (
    id TEXT PRIMARY KEY,                       -- UUID v4
    study_plan_id TEXT,                        -- Khóa ngoại kế hoạch học tập
    day_of_week TEXT DEFAULT 'T2'              -- 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'
        CHECK (day_of_week IN ('T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN')),
    time_block TEXT DEFAULT 'Sáng (08:00 - 10:00)', -- e.g. "Sáng (08:00 - 10:00)", "Tối (19:30 - 21:30)"
    subject_code TEXT,                         -- 'toan', 'anh', 'ly', 'buffer_review'...
    subject TEXT,                              -- Tên môn rút gọn
    session_type TEXT NOT NULL DEFAULT 'deep_work' -- 'deep_work', 'speed_drill', 'review_mistakes', 'mock_test'
        CHECK (session_type IN ('deep_work', 'speed_drill', 'review_mistakes', 'mock_test')),
    task_title TEXT,                           -- Tiêu đề công việc ôn tập
    title TEXT,                                -- Tên nhiệm vụ (tương thích UI)
    topic_name TEXT,                           -- Chủ đề kiến thức
    allocated_hours REAL DEFAULT 2.0,          -- Số giờ phân bổ
    weight INTEGER DEFAULT 1,                  -- Trọng số ưu tiên (1-5)
    progress_text TEXT,                        -- Tiến độ dạng text
    target_metric TEXT,                        -- Chỉ số mục tiêu
    is_completed INTEGER NOT NULL DEFAULT 0,   -- 1: Đã hoàn thành, 0: Chưa
    completed INTEGER NOT NULL DEFAULT 0,      -- 1: Đã hoàn thành (alias)
    skipped INTEGER NOT NULL DEFAULT 0,        -- 1: Bỏ qua
    scheduled_date TEXT,                       -- Ngày dự kiến làm
    completed_at TEXT,                         -- Timestamp hoàn thành
    actual_hours_spent REAL,                   -- Thời gian thực tế đã bỏ ra (giờ)
    difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
    note TEXT,                                 -- Ghi chú nhiệm vụ
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (study_plan_id) REFERENCES study_plans(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_study_tasks_plan_day ON study_tasks(study_plan_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_study_tasks_completed ON study_tasks(is_completed);

-- ----------------------------------------------------------------------------
-- 25. PROGRESS RECORD (Nhật ký tiến độ học tập & Check-in)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS progress_records (
    id TEXT PRIMARY KEY,                       -- UUID v4
    profile_id TEXT NOT NULL,                  -- Khóa ngoại học sinh
    study_plan_id TEXT,                        -- Khóa ngoại kế hoạch học tập
    recorded_date TEXT NOT NULL,               -- Ngày ghi nhận (YYYY-MM-DD)
    weekly_hours_studied REAL NOT NULL,        -- Tổng giờ học thực tế trong tuần
    planned_hours REAL NOT NULL,               -- Tổng giờ học theo kế hoạch
    completion_rate_pct REAL NOT NULL,         -- Tỷ lệ hoàn thành nhiệm vụ (%)
    mock_exam_result_id TEXT,                  -- Kết quả thi thử tương ứng (nếu có)
    score_snapshot_json TEXT,                  -- Ảnh chụp bộ điểm tại thời điểm này (JSON)
    delta_vs_target REAL,                      -- Độ chênh so với mục tiêu chuẩn
    stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 5), -- Mức độ căng thẳng (1-5)
    notes TEXT,                                -- Ghi chú tâm lý / cảm nhận
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (study_plan_id) REFERENCES study_plans(id) ON DELETE SET NULL,
    FOREIGN KEY (mock_exam_result_id) REFERENCES mock_exam_results(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_progress_records_profile_date ON progress_records(profile_id, recorded_date);

-- ----------------------------------------------------------------------------
-- 26. AI ANALYSIS (Báo cáo phân tích AI chuyên sâu)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_analyses (
    id TEXT PRIMARY KEY,                       -- UUID v4
    profile_id TEXT NOT NULL,                  -- Khóa ngoại học sinh
    recommendation_id TEXT,                    -- Khóa ngoại danh mục gợi ý (nếu có)
    analysis_type TEXT NOT NULL                -- 'subject_roi', 'gap_analysis', 'swot_profile', 'shock_resilience'
        CHECK (analysis_type IN ('subject_roi', 'gap_analysis', 'swot_profile', 'shock_resilience')),
    summary_conclusion TEXT NOT NULL,          -- Kết luận cốt lõi của AI
    roi_metrics_json TEXT,                     -- Chỉ số ROI theo môn (JSON)
    swot_strengths_json TEXT,                  -- Điểm mạnh hồ sơ (JSON array)
    swot_weaknesses_json TEXT,                 -- Điểm yếu / nguy cơ rủi ro (JSON array)
    swot_opportunities_json TEXT,              -- Cơ hội mở rộng (JSON array)
    swot_threats_json TEXT,                    -- Thách thức biến động điểm (JSON array)
    recommended_actions_json TEXT,             -- Hành động khuyến nghị (JSON array)
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (recommendation_id) REFERENCES recommendations(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_analyses_profile ON ai_analyses(profile_id, analysis_type);

-- ----------------------------------------------------------------------------
-- 27. ANALYSIS SNAPSHOT (Bản lưu Snapshot trạng thái toàn diện)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS analysis_snapshots (
    id TEXT PRIMARY KEY,                       -- UUID v4
    profile_id TEXT NOT NULL,                  -- Khóa ngoại học sinh
    snapshot_tag TEXT NOT NULL,                -- Thẻ mốc thời gian (e.g. "tuan_01", "sau_thi_thu_so_gd", "giai_doan_nuoc_rut")
    profile_state_json TEXT NOT NULL,          -- Trạng thái hồ sơ tại thời điểm chụp
    exam_scores_json TEXT NOT NULL,            -- Trạng thái điểm số tại thời điểm chụp
    study_plan_state_json TEXT,                -- Trạng thái kế hoạch ôn tập
    recommendation_snapshot_json TEXT,         -- Danh mục 15 nguyện vọng tại thời điểm chụp
    p_fail_all REAL,                           -- Xác suất trượt tại thời điểm chụp
    snapshot_timestamp TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_snapshots_profile_time ON analysis_snapshots(profile_id, snapshot_timestamp);

-- ----------------------------------------------------------------------------
-- 28. USER FEEDBACK (Phản hồi người dùng & Vòng lặp kiểm chứng thực tế)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_feedbacks (
    id TEXT PRIMARY KEY,                       -- UUID v4
    user_id TEXT,                              -- Người dùng gửi phản hồi
    profile_id TEXT,                           -- Hồ sơ liên quan
    recommendation_id TEXT,                    -- Danh mục gợi ý được đánh giá
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5), -- Đánh giá 1 đến 5 sao
    feedback_type TEXT NOT NULL                -- 'recommendation_quality', 'ui_ux', 'feature_request', 'actual_admission_result'
        CHECK (feedback_type IN ('recommendation_quality', 'ui_ux', 'feature_request', 'actual_admission_result')),
    feedback_text TEXT,                        -- Nội dung góp ý
    actual_enrolled_university_id TEXT,        -- Trường thực tế trúng tuyển nhập học (kiểm chứng sau kỳ tuyển sinh)
    actual_enrolled_major_id TEXT,             -- Ngành thực tế trúng tuyển nhập học
    actual_admission_year INTEGER,             -- Năm trúng tuyển thực tế
    was_predicted_in_wishlist INTEGER,         -- 1: Nằm trong danh mục gợi ý, 0: Nằm ngoài
    predicted_probability REAL,                -- Xác suất hệ thống đã dự báo trước đó
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (recommendation_id) REFERENCES recommendations(id) ON DELETE SET NULL,
    FOREIGN KEY (actual_enrolled_university_id) REFERENCES universities(id) ON DELETE SET NULL,
    FOREIGN KEY (actual_enrolled_major_id) REFERENCES majors(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_user ON user_feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_type ON user_feedbacks(feedback_type);

-- ----------------------------------------------------------------------------
-- 29. USER EVENTS STREAM (Telemetry & Closed-Loop Flywheel)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_events (
    id TEXT PRIMARY KEY,                           -- UUID v4
    session_id TEXT NOT NULL,                      -- Phiên làm việc (UUID)
    pseudo_user_id TEXT NOT NULL,                  -- Mã người dùng băm ẩn danh HMAC (Zero PII)
    event_name TEXT NOT NULL,                      -- profile_created, program_viewed, scenario_saved...
    event_timestamp TEXT NOT NULL,                 -- ISO-8601 UTC
    page_route TEXT NOT NULL,                      -- /dashboard, /options, /study-plan...
    entity_id TEXT,                                -- ID của program, scenario, task liên quan
    dwell_time_ms INTEGER,                         -- Thời gian dừng đọc (ms)
    payload_json TEXT,                             -- Chi tiết ngữ cảnh tương tác
    shown_candidates_json TEXT,                    -- BẮT BUỘC: Danh sách ID các ngành đã hiển thị để chống Selection Bias
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_events_pseudo_user ON user_events(pseudo_user_id);
CREATE INDEX IF NOT EXISTS idx_events_name_time ON user_events(event_name, event_timestamp);
CREATE INDEX IF NOT EXISTS idx_events_session ON user_events(session_id);

-- ----------------------------------------------------------------------------
-- 30. DATASET VERSION (Quản lý phiên bản dữ liệu & Snapshot SSOT)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dataset_versions (
    id TEXT PRIMARY KEY,                       -- UUID v4 hoặc mã phiên bản (e.g. "DSV_2026_09_V1")
    version_tag TEXT NOT NULL UNIQUE,          -- Định danh phiên bản (e.g. "2026.09-release")
    description TEXT,                          -- Diễn giải phạm vi dữ liệu
    schema_version TEXT NOT NULL DEFAULT '2.1.0', -- Phiên bản lược đồ cơ sở dữ liệu tương ứng
    total_records INTEGER DEFAULT 0,           -- Tổng số bản ghi thực tế
    checksum TEXT,                             -- Mã băm SHA-256 toàn vẹn dataset
    status TEXT NOT NULL DEFAULT 'active'      -- 'draft', 'active', 'archived', 'deprecated'
        CHECK (status IN ('draft', 'active', 'archived', 'deprecated')),
    released_at TEXT,                          -- Ngày phát hành (YYYY-MM-DD)
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_dataset_versions_tag ON dataset_versions(version_tag);

-- ----------------------------------------------------------------------------
-- 31. SCHEMA MIGRATION (Nhật ký di chuyển lược đồ an toàn)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schema_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version TEXT NOT NULL UNIQUE,              -- Mã migration (e.g. "001_core_schema")
    name TEXT NOT NULL,                        -- Tên mô tả nhiệm vụ migration
    applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    execution_time_ms INTEGER DEFAULT 0,       -- Thời gian thực thi (ms)
    checksum TEXT                              -- Mã băm xác minh tính toàn vẹn
);


-- ----------------------------------------------------------------------------
-- INITIAL REFERENCE SEED DATA
-- ----------------------------------------------------------------------------

-- Admission Methods
INSERT OR IGNORE INTO admission_methods (id, code, name_vi, scale, description) VALUES
('PT100', '100', 'Xét kết quả thi tốt nghiệp THPT', 30.0, 'Xét tuyển dựa trên điểm thi tốt nghiệp THPT theo các tổ hợp môn truyền thống.'),
('PT200', '200', 'Xét kết quả học tập cấp THPT (học bạ)', 30.0, 'Xét tuyển dựa trên điểm trung bình các môn trong học bạ 3 năm hoặc 5-6 học kỳ.'),
('PT402', '402', 'Xét tuyển kết quả thi ĐGNL / ĐGTD', 1200.0, 'Dựa trên kỳ thi Đánh giá năng lực ĐHQG-HCM (1200), ĐHQG-HN (150) hoặc ĐGTD Bách Khoa (100).'),
('PT409', '409', 'Xét tuyển kết hợp chứng chỉ ngoại ngữ quốc tế', 30.0, 'Kết hợp chứng chỉ quốc tế (IELTS, TOEFL, SAT) với điểm thi THPT hoặc học bạ.'),
('PT301', '301', 'Tuyển thẳng và ưu tiên xét tuyển', 30.0, 'Tuyển thẳng học sinh giỏi quốc gia, quốc tế theo quy chế tuyển sinh của Bộ GD-ĐT.');

-- Standard Subject Combinations
INSERT OR IGNORE INTO subject_combinations (id, code, subject_1, subject_2, subject_3, subject_weights_json, description) VALUES
('A00', 'A00', 'toan', 'ly', 'hoa', '{"toan": 1.0, "ly": 1.0, "hoa": 1.0}', 'Toán, Vật lý, Hóa học'),
('A01', 'A01', 'toan', 'ly', 'anh', '{"toan": 1.0, "ly": 1.0, "anh": 1.0}', 'Toán, Vật lý, Tiếng Anh'),
('B00', 'B00', 'toan', 'hoa', 'sinh', '{"toan": 1.0, "hoa": 1.0, "sinh": 1.0}', 'Toán, Hóa học, Sinh học'),
('C00', 'C00', 'van', 'su', 'dia', '{"van": 1.0, "su": 1.0, "dia": 1.0}', 'Ngữ văn, Lịch sử, Địa lý'),
('D01', 'D01', 'toan', 'van', 'anh', '{"toan": 1.0, "van": 1.0, "anh": 1.0}', 'Toán, Ngữ văn, Tiếng Anh'),
('D07', 'D07', 'toan', 'hoa', 'anh', '{"toan": 1.0, "hoa": 1.0, "anh": 1.0}', 'Toán, Hóa học, Tiếng Anh'),
('A02', 'A02', 'toan', 'ly', 'sinh', '{"toan": 1.0, "ly": 1.0, "sinh": 1.0}', 'Toán, Vật lý, Sinh học'),
('B08', 'B08', 'toan', 'sinh', 'anh', '{"toan": 1.0, "sinh": 1.0, "anh": 1.0}', 'Toán, Sinh học, Tiếng Anh'),
('C01', 'C01', 'van', 'toan', 'ly', '{"van": 1.0, "toan": 1.0, "ly": 1.0}', 'Ngữ văn, Toán, Vật lý'),
('D08', 'D08', 'toan', 'sinh', 'anh', '{"toan": 1.0, "sinh": 1.0, "anh": 1.0}', 'Toán, Sinh học, Tiếng Anh');

-- Standard Data Sources (Nguồn tuyển sinh chính thống)
INSERT OR IGNORE INTO data_sources (
    id, name, source_type, publisher, document_title, document_number,
    document_url, published_at, verification_status, confidence, parser_version
) VALUES
('SRC_MOET_REG_2024', 'Quy chế Tuyển sinh ĐH 2024', 'regulation', 'Bộ GD&ĐT',
 'Quy chế tuyển sinh đại học, tuyển sinh cao đẳng ngành Giáo dục Mầm non', 'Thông tư 08/2022/TT-BGDĐT',
 'https://moet.gov.vn/van-ban/vbdh/Pages/chi-tiet-van-ban.aspx?ItemID=8123', '2022-06-06', 'human_audited', 1.0, 'pipeline.clean@2.1.0'),
('SRC_BKA_DEAN_2024', 'Đề án Tuyển sinh ĐH Bách Khoa Hà Nội 2024', 'official_pdf', 'ĐH Bách Khoa Hà Nội',
 'Đề án Tuyển sinh Đại học năm 2024', 'QĐ số 2145/QĐ-ĐHBK',
 'https://ts.hust.edu.vn/de-an-tuyen-sinh-2024.pdf', '2024-05-15', 'human_audited', 1.0, 'pipeline.clean@2.1.0'),
('SRC_NEU_DEAN_2024', 'Đề án Tuyển sinh ĐH Kinh tế Quốc dân 2024', 'official_pdf', 'ĐH Kinh tế Quốc dân',
 'Đề án Tuyển sinh Đại học năm 2024', 'QĐ số 892/QĐ-ĐHKTQD',
 'https://daotao.neu.edu.vn/de-an-tuyen-sinh-2024.pdf', '2024-05-10', 'human_audited', 1.0, 'pipeline.clean@2.1.0'),
('SRC_UET_DEAN_2024', 'Đề án Tuyển sinh ĐH Công nghệ - ĐHQGHN 2024', 'official_pdf', 'Trường ĐH Công nghệ - ĐHQGHN',
 'Đề án Tuyển sinh Đại học chính quy năm 2024', 'QĐ số 412/QĐ-ĐHCN',
 'https://uet.vnu.edu.vn/tuyen-sinh-2024.pdf', '2024-05-12', 'cross_checked', 0.98, 'pipeline.clean@2.1.0'),
('SRC_HCMUS_DEAN_2024', 'Đề án Tuyển sinh ĐH KHTN - ĐHQG-HCM 2024', 'official_pdf', 'Trường ĐH Khoa học Tự nhiên - ĐHQG TP.HCM',
 'Đề án Tuyển sinh Đại học năm 2024', 'QĐ số 638/QĐ-KHTN',
 'https://hcmus.edu.vn/de-an-tuyen-sinh-2024.pdf', '2024-05-08', 'cross_checked', 0.98, 'pipeline.clean@2.1.0');

-- Standard Occupations (Nghề nghiệp chuẩn hóa thị trường)
INSERT OR IGNORE INTO occupations (
    id, code, title_vi, title_en, soc_code, description,
    growth_outlook, ai_exposure_score, ai_risk_level,
    entry_salary_avg_mvnd, mid_career_salary_avg_mvnd, work_environment
) VALUES
('OCC_SWE', '2512-SWE', 'Kỹ sư phát triển phần mềm', 'Software Engineer', '15-1252',
 'Thiết kế, xây dựng và tối ưu hóa hệ thống phần mềm, dịch vụ backend/frontend.',
 'rat_cao', 0.65, 'trung_binh', 15.0, 38.0, 'Văn phòng / Hybrid'),
('OCC_DATA_ENG', '2512-DE', 'Kỹ sư dữ liệu', 'Data Engineer', '15-1259',
 'Xây dựng pipeline ETL/ELT, kho dữ liệu lớn Lakehouse và hạ tầng phân tích.',
 'rat_cao', 0.50, 'thap', 16.5, 42.0, 'Văn phòng / Cloud'),
('OCC_AI_SPEC', '2511-AIML', 'Chuyên viên Trí tuệ Nhân tạo & Học máy', 'AI/ML Specialist', '15-1221',
 'Huấn luyện, tinh chỉnh mô hình máy học, LLM, Computer Vision và tích hợp ứng dụng.',
 'rat_cao', 0.80, 'thap', 18.0, 50.0, 'Phòng thí nghiệm / Tech Lab'),
('OCC_DATA_ANALYST', '2513-DA', 'Chuyên viên phân tích dữ liệu', 'Data Analyst', '15-2051',
 'Khai thác dữ liệu kinh doanh, xây dựng dashboard trực quan và dự báo chỉ số.',
 'cao', 0.70, 'trung_binh', 13.0, 28.0, 'Văn phòng kinh doanh'),
('OCC_FIN_ANALYST', '2413-FA', 'Chuyên viên phân tích tài chính', 'Financial Analyst', '13-2051',
 'Định giá doanh nghiệp, phân tích danh mục đầu tư và kiểm soát rủi ro tài chính.',
 'cao', 0.60, 'trung_binh', 14.0, 32.0, 'Ngân hàng / Quỹ đầu tư'),
('OCC_AUTO_ENG', '2152-ROBOT', 'Kỹ sư Tự động hóa & Robot', 'Automation & Robotics Engineer', '17-2199',
 'Lập trình điều khiển PLC, thiết kế cánh tay robot công nghiệp và dây chuyền thông minh.',
 'cao', 0.40, 'thap', 14.5, 30.0, 'Nhà máy thông minh / R&D Lab'),
('OCC_MED_DOCTOR', '2211-GP', 'Bác sĩ đa khoa / chuyên khoa', 'General Practitioner / Physician', '29-1216',
 'Khám, chẩn đoán, điều trị bệnh và chăm sóc sức khỏe cộng đồng.',
 'rat_cao', 0.30, 'thap', 12.0, 35.0, 'Bệnh viện / Phòng khám');

-- Standard Skill Requirements
INSERT OR IGNORE INTO skill_requirements (
    id, occupation_id, skill_name, skill_type, proficiency_level, importance_weight, market_demand_trend
) VALUES
('SKL_SWE_PY', 'OCC_SWE', 'Python / Java / Golang', 'hard_skill', 'advanced', 0.95, 'tang_manh'),
('SKL_SWE_ARCH', 'OCC_SWE', 'Thiết kế kiến trúc hệ thống & Clean Code', 'hard_skill', 'intermediate', 0.90, 'tang_manh'),
('SKL_SWE_GIT', 'OCC_SWE', 'Git / CI-CD / Docker', 'tool_technology', 'intermediate', 0.85, 'tang_manh'),
('SKL_DE_SQL', 'OCC_DATA_ENG', 'SQL nâng cao & Data Modeling', 'hard_skill', 'advanced', 0.95, 'tang_manh'),
('SKL_DE_SPARK', 'OCC_DATA_ENG', 'Apache Spark / DuckDB / Airflow', 'tool_technology', 'intermediate', 0.90, 'tang_manh'),
('SKL_AI_MATH', 'OCC_AI_SPEC', 'Đại số tuyến tính & Xác suất thống kê', 'domain_knowledge', 'advanced', 0.95, 'tang_manh'),
('SKL_AI_PYTORCH', 'OCC_AI_SPEC', 'PyTorch / Transformers / HuggingFace', 'tool_technology', 'advanced', 0.95, 'tang_manh'),
('SKL_FA_MODEL', 'OCC_FIN_ANALYST', 'Mô hình hóa tài chính & DCF', 'hard_skill', 'advanced', 0.90, 'on_dinh');

-- Active Dataset Version Snapshot
INSERT OR IGNORE INTO dataset_versions (
    id, version_tag, description, schema_version, total_records, status, released_at
) VALUES (
    'DSV_2026_09_V1', '2026.09-release',
    'Dữ liệu tuyển sinh chuẩn hóa 2024-2025 tích hợp Data Provenance & Career Intelligence',
    '2.1.0', 1250, 'active', '2026-09-17'
);
