# Đề 19 — Website Tin tức / Cổng thông tin

Ứng dụng tin tức viết bằng Next.js, TypeScript và MySQL. Hệ thống chạy bằng Docker Compose; Nginx là reverse proxy và phpMyAdmin cung cấp giao diện quản lý database.

## Yêu cầu

- Windows 10/11, Docker Desktop với WSL 2 backend
- VS Code và Git
- Khuyến nghị cấp Docker Desktop 6–8 GB RAM; máy 16 GB nên tắt ứng dụng nặng khi chạy toàn bộ stack.

## Chạy lần đầu

Mở thư mục trong VS Code, bật Docker Desktop, rồi dùng Terminal PowerShell:

```powershell
Copy-Item .env.example .env
```

Mở `.env` và thay từng giá trị `CHANGE_ME_...` bằng mật khẩu riêng, mạnh. `SESSION_SECRET` cần tối thiểu 32 ký tự. Không commit `.env`.

```powershell
docker compose up -d --build
docker compose ps
```

## Địa chỉ local

| Thành phần | URL |
|---|---|
| Website qua Nginx | http://localhost:8080 |
| Trang quản trị | http://localhost:8080/admin |
| phpMyAdmin | http://localhost:8081 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3000 |

Admin dùng `ADMIN_EMAIL` và `ADMIN_PASSWORD` trong `.env`. phpMyAdmin đăng nhập bằng `MYSQL_USER`/`MYSQL_PASSWORD`.

## Chức năng

- Trang chủ liệt kê và lọc tin theo danh mục; trang chi tiết bài viết.
- Khu vực admin đăng nhập, lưu bản nháp và xuất bản bài.
- MySQL lưu bài viết và danh mục; dữ liệu mẫu được nạp khi database khởi tạo lần đầu.
- Nginx reverse proxy, security headers, giới hạn kích thước request và giới hạn tần suất đăng nhập.
- Prometheus, exporters và Grafana giám sát Nginx, MySQL và Docker containers.

## Monitoring

Grafana dùng `GRAFANA_ADMIN_USER`/`GRAFANA_ADMIN_PASSWORD` trong `.env`. Prometheus → **Status → Targets** cần có các job `prometheus`, `nginx`, `mysql`, `containers` ở trạng thái **UP**. Grafana provision sẵn dashboard **News Portal Overview**; các metric gồm `news_portal_container_cpu_percent`, `news_portal_container_memory_usage_bytes`, `nginx_http_requests_total`, và `mysql_global_status_threads_connected`.

MySQL exporter dùng tài khoản chỉ có quyền `PROCESS`, `REPLICATION CLIENT`, `SELECT`; Docker stats exporter truy cập Docker Engine để lấy CPU/RAM/network của container. Docker socket là quyền nhạy cảm gần tương đương quyền điều khiển Docker daemon, chỉ dùng cấu hình này trên máy demo tin cậy và không công khai cổng exporter.

Ứng dụng chạy non-root; MySQL không publish cổng ra host và chỉ nằm trong network nội bộ. phpMyAdmin chỉ bind vào loopback máy local. Đây là cấu hình demo học tập, chưa phải cấu hình production.

## Lệnh hữu ích

```powershell
docker compose logs -f app
docker compose logs -f mysql
docker compose down
```

`docker compose down -v` sẽ xóa volume database và toàn bộ dữ liệu, chỉ dùng khi muốn bắt đầu lại.
