import fs from 'node:fs';

const FILE_PATH = 'src/data/du-lieu-that.json';
const data = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));

let fixedCount = 0;

// Helper to update program
function updateProgram(id, updates) {
  const item = data.find(x => x.id === id);
  if (item) {
    Object.assign(item, updates);
    fixedCount++;
    console.log(`Updated [${id}] ${item.truong} - ${item.nganh}: dk=${item.dk}`);
  } else {
    console.warn(`Item not found: ${id}`);
  }
}

// 1. QST - ĐH Khoa học Tự nhiên ĐHQG TP.HCM
updateProgram('qst-5caf16b0', {
  dk: 28.5,
  diem: { '2022': 28.2, '2023': 28.05, '2024': 28.5 },
  toHop: ['A00', 'A01', 'B08', 'D07']
});
updateProgram('qst-257323bc', {
  dk: 28.5,
  diem: { '2022': 28.2, '2023': 28.05, '2024': 28.5 },
  toHop: ['A00', 'A01', 'B08', 'D07']
});
updateProgram('qst-3e3df2ad', {
  dk: 28.5,
  diem: { '2022': 28.2, '2023': 28.05, '2024': 28.5 },
  toHop: ['A00', 'A01', 'B08', 'D07']
});
updateProgram('qst-16d4f5fa', {
  dk: 26.85,
  diem: { '2022': 26.7, '2023': 26.4, '2024': 26.85 },
  toHop: ['A00', 'A01', 'B08', 'D07']
});
updateProgram('qst-f9045073', {
  dk: 24.9,
  diem: { '2022': 23.75, '2023': 24.68, '2024': 24.9 },
  toHop: ['A02', 'B00', 'B08', 'D90']
});
updateProgram('qst-e0f5eaba', {
  dk: 25.0,
  diem: { '2022': 24.65, '2023': 24.7, '2024': 25.0 },
  toHop: ['A00', 'B00', 'D07', 'D90']
});
updateProgram('qst-38180567', {
  dk: 26.0,
  diem: { '2022': 27.2, '2023': 26.0, '2024': 26.0 },
  toHop: ['A00', 'A01', 'B08', 'D07']
});
updateProgram('qst-1ead1b6b', {
  dk: 24.65,
  diem: { '2022': 23.6, '2023': 24.2, '2024': 24.65 },
  toHop: ['A00', 'B00', 'D07', 'D90']
});
updateProgram('qst-8a6166a1', {
  dk: 18.5,
  diem: { '2022': 17.0, '2023': 17.0, '2024': 18.5 },
  toHop: ['A00', 'B00', 'B08', 'D07']
});
updateProgram('qst-c1b7641f', {
  dk: 22.3,
  diem: { '2022': 17.0, '2023': 17.0, '2024': 22.3 },
  toHop: ['A00', 'A01', 'B00', 'D07']
});
updateProgram('qst-ecdc0ca1', {
  dk: 25.4,
  diem: { '2022': 25.25, '2023': 23.25, '2024': 25.4 },
  toHop: ['A00', 'A01', 'B08', 'D07']
});
updateProgram('qst-b5bb5fce', {
  dk: 23.5,
  diem: { '2022': 17.0, '2023': 21.5, '2024': 23.5 },
  toHop: ['A02', 'B00', 'B08']
});
updateProgram('qst-de6f66f8', {
  dk: 22.0,
  diem: { '2022': 20.0, '2023': 22.0, '2024': 22.0 },
  toHop: ['A00', 'A01', 'A02', 'D90']
});

// 2. QHS - ĐH Giáo dục ĐHQGHN
updateProgram('qhs-7acc5e8f', {
  dk: 28.57,
  diem: { '2023': 26.58, '2024': 28.57 },
  toHop: ['A00', 'A01', 'D01', 'D07']
});
updateProgram('qhs-ce305719', {
  dk: 23.5,
  diem: { '2023': 20.0, '2024': 23.5 },
  toHop: ['A00', 'A01', 'A02', 'D01']
});
updateProgram('qhs-8a844622', {
  toHop: ['M00', 'M01', 'M02', 'M03']
});
updateProgram('qhs-7a0cc7a6', {
  toHop: ['A00', 'C00', 'D01', 'D03']
});
updateProgram('qhs-d3be5846', {
  toHop: ['A00', 'B00', 'D07']
});
updateProgram('qhs-bfb2ce19', {
  toHop: ['A00', 'A02', 'B00', 'D07']
});
updateProgram('qhs-6f0253c1', {
  toHop: ['C00', 'D01', 'D14', 'D78']
});
updateProgram('qhs-60f3df92', {
  toHop: ['C00', 'D01', 'D14', 'D15']
});
updateProgram('qhs-334f8c34', {
  toHop: ['C00', 'D01', 'D14', 'D15']
});
updateProgram('qhs-2b4f51f1', {
  toHop: ['B00', 'A00', 'B08', 'D08']
});
updateProgram('qhs-d84026d1', {
  toHop: ['A00', 'A01', 'D01', 'D07']
});
updateProgram('qhs-0e790636', {
  toHop: ['A00', 'A01', 'A02', 'D01']
});

// 3. BVH - Học viện Công nghệ Bưu chính Viễn thông
updateProgram('bvh-d30c9d47', {
  dk: 26.4,
  diem: { '2022': 27.25, '2023': 26.59, '2024': 26.4 },
  toHop: ['A00', 'A01']
});
updateProgram('bvh-f846d4e2', {
  dk: 25.5,
  diem: { '2023': 25.8, '2024': 25.5 },
  toHop: ['A00', 'A01']
});
updateProgram('bvh-221d6fd7', {
  dk: 25.1,
  diem: { '2023': 25.3, '2024': 25.1 },
  toHop: ['A00', 'A01']
});
updateProgram('bvh-403a54cb', {
  dk: 25.8,
  diem: { '2023': 26.0, '2024': 25.8 },
  toHop: ['A00', 'A01']
});
updateProgram('bvh-8cca31af', {
  dk: 26.15,
  diem: { '2022': 26.7, '2023': 26.0, '2024': 26.15 },
  toHop: ['A00', 'A01']
});
updateProgram('bvh-5df1ed3b', {
  dk: 25.2,
  diem: { '2023': 25.5, '2024': 25.2 },
  toHop: ['A00', 'A01']
});
updateProgram('bvh-2b568164', {
  dk: 26.8,
  diem: { '2023': 26.9, '2024': 26.8 },
  toHop: ['A00', 'A01']
});
updateProgram('bvh-4caba84b', {
  dk: 26.2,
  diem: { '2023': 26.35, '2024': 26.2 },
  toHop: ['A00', 'A01', 'D01']
});
updateProgram('bvh-a2082cb1', {
  dk: 26.1,
  diem: { '2023': 26.33, '2024': 26.1 },
  toHop: ['A00', 'A01', 'D01']
});
updateProgram('bvh-920504a7', {
  dk: 25.2,
  diem: { '2023': 25.4, '2024': 25.2 },
  toHop: ['A00', 'A01', 'D01']
});
updateProgram('bvh-b10d77d4', {
  dk: 25.8,
  diem: { '2023': 25.89, '2024': 25.8 },
  toHop: ['A00', 'A01', 'D01']
});
updateProgram('bvh-14388130', {
  dk: 25.0,
  diem: { '2023': 25.2, '2024': 25.0 },
  toHop: ['A00', 'A01', 'D01']
});
updateProgram('bvh-ef957d56', {
  dk: 25.5,
  diem: { '2023': 25.55, '2024': 25.5 },
  toHop: ['A00', 'A01', 'D01']
});
updateProgram('bvh-55a63ca8', {
  dk: 25.2,
  diem: { '2023': 25.3, '2024': 25.2 },
  toHop: ['A00', 'A01', 'D01']
});
updateProgram('bvh-1239967e', {
  dk: 24.5,
  diem: { '2023': 24.6, '2024': 24.5 },
  toHop: ['A00', 'A01', 'D01']
});

// 4. HPN - Học viện Phụ nữ Việt Nam
updateProgram('hpn-cb7bdca8', {
  dk: 23.0,
  diem: { '2024': 23.0 },
  toHop: ['A00', 'A01', 'C03', 'D01', 'D07']
});
updateProgram('hpn-f07c6a18', {
  dk: 24.27,
  diem: { '2024': 24.27 },
  toHop: ['A00', 'A01', 'C00', 'C03', 'D01', 'D14', 'D15']
});

// 5. DHY - ĐH Y Dược Huế
updateProgram('dhy-4ca93d26', { toHop: ['B00'] });
updateProgram('dhy-b24097e9', { toHop: ['B00', 'A00'] });
updateProgram('dhy-3a58a384', { toHop: ['B00', 'A00'] });
updateProgram('dhy-7727d92c', { toHop: ['B00'] });
updateProgram('dhy-5a8ca80e', { toHop: ['B00'] });
updateProgram('dhy-70da8149', { toHop: ['B00'] });

// 6. YDS - ĐH Y Dược TP.HCM
updateProgram('yds-69b5d369', { toHop: ['B00', 'A00', 'B08'] });
updateProgram('yds-5385542a', { toHop: ['B00', 'A00', 'B08'] });

// 7. DDF - ĐH Ngoại ngữ Đà Nẵng
updateProgram('ddf-6275c358', { toHop: ['D01', 'A01', 'D78', 'D96'] });
updateProgram('ddf-67e41bd6', { toHop: ['D01', 'A01', 'D78', 'D96'] });
updateProgram('ddf-28157b3b', { toHop: ['D01', 'D02', 'D78', 'D96'] });
updateProgram('ddf-96c5d423', { toHop: ['D01', 'D03', 'D78', 'D96'] });

// 8. BKA - Populate null dk with latest score
let bkaFixed = 0;
for (const item of data) {
  if (item.ma === 'BKA' && item.dk === null && item.diem) {
    const years = Object.keys(item.diem).sort();
    if (years.length > 0) {
      item.dk = item.diem[years[years.length - 1]];
      bkaFixed++;
    }
  }
}
console.log(`Populated null dk for ${bkaFixed} BKA programs.`);

// Save back to file
fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
console.log(`Successfully updated ${fixedCount + bkaFixed} program records in ${FILE_PATH}`);
