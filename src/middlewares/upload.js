const multer = require('multer');

// 메모리 저장 (Cloudinary로 바로 업로드할 거라서 디스크 저장 안 함)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 제한
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
    }
  },
});

module.exports = upload;
