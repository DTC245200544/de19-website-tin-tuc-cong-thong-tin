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
| Website qua Nginx | http://bantinmoi.test |
| Trang quản trị | http://bantinmoi.test/admin |
| phpMyAdmin | http://localhost:8081 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3000 |

Admin dùng `ADMIN_EMAIL` và `ADMIN_PASSWORD` trong `.env`. phpMyAdmin đăng nhập bằng `MYSQL_USER`/`MYSQL_PASSWORD`.

## Chức năng

- Trang chủ liệt kê và lọc tin theo danh mục; trang chi tiết bài viết.
- Có 14 chuyên mục, mỗi chuyên mục có trang tin và breadcrumb riêng; bài mẫu dùng ảnh chụp minh họa khác nhau theo chủ đề.
- Khu vực admin đăng nhập, lưu bản nháp và xuất bản bài.
- MySQL lưu bài viết và danh mục; dữ liệu mẫu được nạp khi database khởi tạo lần đầu.
- Nginx reverse proxy, security headers, giới hạn kích thước request và giới hạn tần suất đăng nhập.
- Prometheus, exporters và Grafana giám sát Nginx, MySQL và Docker containers.
- Ảnh minh họa được tải sẵn từ [Unsplash](https://unsplash.com/license), vì vậy website không phụ thuộc dịch vụ ảnh bên ngoài khi chạy.

`bantinmoi.test` là tên local dành cho demo, không phải tên miền Internet công khai. Lần đầu tiên, chạy `.\scripts\setup-local-domain.ps1` trong PowerShell để thêm tên này vào Windows hosts; chấp nhận hộp thoại quyền quản trị. Nếu không muốn thay đổi hosts, tiếp tục dùng `http://localhost`. Tên miền công khai `.com.vn` cần đăng ký riêng và DNS trỏ tới máy chủ công khai.

Nguồn ảnh chụp mẫu:

| Chuyên mục | Nguồn |
|---|---|
| Thời sự | [Unsplash](https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b) |
| Kinh doanh | [Unsplash](https://images.unsplash.com/photo-1460925895917-afdab827c52f) |
| Công nghệ | [Unsplash](https://images.unsplash.com/photo-1518770660439-4636190af475) |
| Giáo dục | [Unsplash](https://images.unsplash.com/photo-1509062522246-3755977927d7) |
| Sức khỏe | [Unsplash](https://images.unsplash.com/photo-1576091160399-112ba8d25d1d) |
| Đời sống | [Unsplash](https://images.unsplash.com/photo-1517248135467-4c7edcad34c4) |
| Văn hóa | [Unsplash](https://images.unsplash.com/photo-1577083552431-6e5fd01aa342) |
| Thể thao | [Unsplash](https://images.unsplash.com/photo-1461896836934-ffe607ba8211) |
| Du lịch | [Unsplash](https://images.unsplash.com/photo-1464822759023-fed622ff2c3b) |
| Ô tô - Xe máy | [Unsplash](https://images.unsplash.com/photo-1492144534655-ae79c964c9d7) |
| Thời trang | [Unsplash](https://images.unsplash.com/photo-1539109136881-3be0616acf4b) |
| Pháp luật | [Unsplash](https://images.unsplash.com/photo-1589829545856-d10d557cf95f) |
| Môi trường | [Unsplash](https://images.unsplash.com/photo-1441974231531-c6227db76b6e) |
| Thế giới | [Unsplash](https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1) |

## Monitoring

Grafana dùng `GRAFANA_ADMIN_USER`/`GRAFANA_ADMIN_PASSWORD` trong `.env`. Prometheus → **Status → Targets** cần có các job `prometheus`, `nginx`, `mysql`, `containers` ở trạng thái **UP**. Grafana provision sẵn dashboard **News Portal Overview**; các metric gồm `news_portal_container_cpu_percent`, `news_portal_container_memory_usage_bytes`, `nginx_http_requests_total`, và `mysql_global_status_threads_connected`.

MySQL exporter dùng tài khoản chỉ có quyền `PROCESS`, `REPLICATION CLIENT`, `SELECT`; Docker stats exporter truy cập Docker Engine để lấy CPU/RAM/network của container. Docker socket là quyền nhạy cảm gần tương đương quyền điều khiển Docker daemon, chỉ dùng cấu hình này trên máy demo tin cậy và không công khai cổng exporter.

## Logging và truy vấn LogQL

Promtail gửi log container tới Loki; trong Grafana → **Explore**, chọn datasource Loki và chạy:

```logql
{service="nginx"}
```

```logql
{service="app"} |= "error"
```

```logql
{service="nginx"} |~ " 4[0-9][0-9] "
```

Truy vấn thứ hai chỉ có kết quả khi ứng dụng ghi dòng có `error`; truy vấn thứ ba lọc HTTP 4xx theo định dạng access log.

## Hardening và giới hạn demo

Ứng dụng chạy non-root; root filesystem của app chỉ đọc, capabilities bị loại bỏ và cookie admin là HttpOnly/SameSite. Nginx chạy non-root, thêm security headers và giới hạn tần suất đăng nhập. MySQL không publish cổng ra host và chỉ nằm trong network nội bộ; phpMyAdmin/Grafana/Prometheus chỉ bind loopback máy local.

Promtail và Docker stats exporter cần quyền đọc Docker socket, nên chạy root trong container. Docker socket có quyền điều khiển Docker daemon: không công khai socket/exporter, chỉ dùng trên máy tin cậy. Đây là stack demo học tập, Nginx hiện dùng HTTP với security headers, chưa bật TLS và chưa phải cấu hình production.

## Lệnh hữu ích

```powershell
docker compose ps
docker compose logs -f app
docker compose logs -f mysql
docker compose down
```

`docker compose down -v` sẽ xóa volume database và toàn bộ dữ liệu, chỉ dùng khi muốn bắt đầu lại.

## Mốc triển khai

1. `feat: add news portal with mysql and nginx` — ứng dụng, MySQL/phpMyAdmin, Nginx reverse proxy.
2. `feat: add prometheus and grafana monitoring` — exporters, Prometheus, datasource và dashboard Grafana.
3. `feat: add loki promtail centralized logging` — Loki, Promtail, LogQL và tài liệu hardening.
