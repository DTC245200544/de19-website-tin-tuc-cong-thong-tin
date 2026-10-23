SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS news_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE news_portal;

CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS articles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  slug VARCHAR(190) NOT NULL UNIQUE,
  content TEXT NOT NULL,
  status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  category_id INT UNSIGNED NOT NULL,
  published_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_articles_category FOREIGN KEY (category_id) REFERENCES categories(id),
  INDEX idx_articles_status_published (status, published_at)
);

INSERT IGNORE INTO categories (name, slug) VALUES
  ('Công nghệ', 'cong-nghe'),
  ('Đời sống', 'doi-song'),
  ('Thế giới', 'the-gioi');

INSERT IGNORE INTO articles (title, slug, content, status, category_id, published_at)
SELECT 'Không gian số mở ra cách kể chuyện mới', 'khong-gian-so-mo-ra-cach-ke-chuyen-moi',
  'Công nghệ đang thay đổi cách chúng ta tiếp nhận thông tin mỗi ngày.\n\nCác nền tảng số giúp những câu chuyện địa phương tiếp cận độc giả rộng hơn, đồng thời đặt ra yêu cầu cao hơn về độ tin cậy và trách nhiệm biên tập.',
  'published', id, NOW() FROM categories WHERE slug = 'cong-nghe';

INSERT IGNORE INTO articles (title, slug, content, status, category_id, published_at)
SELECT 'Những thay đổi nhỏ tạo nên đô thị đáng sống', 'nhung-thay-doi-nho-tao-nen-do-thi-dang-song',
  'Một thành phố thân thiện bắt đầu từ những trải nghiệm gần gũi: con đường an toàn, không gian xanh và phương tiện công cộng thuận tiện.\n\nNhiều sáng kiến cộng đồng cho thấy sự tham gia của người dân có thể tạo ra khác biệt bền vững.',
  'published', id, NOW() FROM categories WHERE slug = 'doi-song';

INSERT IGNORE INTO articles (title, slug, content, status, category_id, published_at)
SELECT 'Kết nối tri thức trong một thế giới nhiều biến động', 'ket-noi-tri-thuc-trong-mot-the-gioi-nhieu-bien-dong',
  'Khả năng tiếp cận tri thức và trao đổi cởi mở góp phần giúp cộng đồng hiểu rõ hơn các vấn đề toàn cầu.\n\nĐọc nhiều nguồn và kiểm chứng thông tin là những thói quen quan trọng trong môi trường truyền thông hiện đại.',
  'published', id, NOW() FROM categories WHERE slug = 'the-gioi';
