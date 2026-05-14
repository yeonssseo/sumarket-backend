-- 수마켓 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS sumarket DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sumarket;

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE COMMENT '@suwon.ac.kr 이메일',
  password VARCHAR(255) NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  college VARCHAR(100) NOT NULL COMMENT '단과대학',
  department VARCHAR(100) NOT NULL COMMENT '학과',
  is_verified TINYINT(1) DEFAULT 0 COMMENT '이메일 인증 여부',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 도서 테이블
CREATE TABLE IF NOT EXISTS books (
  book_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL COMMENT '도서 제목',
  author VARCHAR(100) DEFAULT NULL COMMENT '저자',
  publisher VARCHAR(100) DEFAULT NULL COMMENT '출판사',
  price INT NOT NULL COMMENT '판매 가격',
  description TEXT DEFAULT NULL COMMENT '상세 설명',
  college VARCHAR(100) DEFAULT NULL COMMENT '관련 단과대학',
  department VARCHAR(100) DEFAULT NULL COMMENT '관련 학과',
  trade_status ENUM('판매중', '예약중', '판매완료') DEFAULT '판매중',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 도서 이미지 테이블
CREATE TABLE IF NOT EXISTS book_images (
  image_id INT AUTO_INCREMENT PRIMARY KEY,
  book_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  cloudinary_id VARCHAR(255) DEFAULT NULL COMMENT 'Cloudinary public_id (삭제용)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE
);

-- 찜 테이블
CREATE TABLE IF NOT EXISTS wishlists (
  wishlist_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  book_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE,
  UNIQUE KEY unique_wishlist (user_id, book_id)
);
