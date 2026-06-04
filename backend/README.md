# QuanLyDN - Backend

Môi trường Spring Boot trống cho phần mềm quản lý doanh nghiệp.
Dự án mới khởi tạo, chưa có business logic, sẵn sàng để phát triển.

## Stack

- Java 17+ (đang test trên Java 24)
- Spring Boot 3.5.x
- Spring Web, Validation, Security, Data JPA
- MySQL (production) + H2 (dev)
- Lombok, DevTools
- Maven (qua Maven Wrapper)

## Yêu cầu

- JDK 17 trở lên (bạn đang có Java 24)
- Không cần cài Maven, dùng `mvnw` đi kèm dự án

## Cấu trúc thư mục

```
backend/
├── pom.xml                                  Khai báo dependencies
├── mvnw, mvnw.cmd                           Maven Wrapper (chạy được không cần cài Maven)
├── .mvn/wrapper/                            Cấu hình wrapper
└── src/
    ├── main/
    │   ├── java/com/quanlydn/
    │   │   ├── QuanLyDnBackendApplication.java   Entry point
    │   │   ├── config/                      Cấu hình Spring (CORS, Security, ...)
    │   │   ├── controller/                  REST controller
    │   │   ├── service/                     Business logic
    │   │   ├── repository/                  Spring Data JPA repository
    │   │   ├── entity/                      JPA entity
    │   │   ├── dto/                         Data Transfer Object
    │   │   ├── security/                    JWT, filter, ...
    │   │   ├── exception/                   Exception handler
    │   │   └── util/                        Tiện ích
    │   └── resources/
    │       ├── application.yml              Cấu hình chung
    │       ├── application-dev.yml          Profile dev (H2 in-memory)
    │       └── application-prod.yml         Profile prod (MySQL)
    └── test/java/com/quanlydn/              Test
```

## Set JAVA_HOME (nếu chưa có)

Trên máy bạn, JDK đang ở `C:\Program Files\Java\jdk-24`.
Chạy lệnh sau trong cửa sổ PowerShell trước khi dùng `mvnw`:

```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-24"
```

Hoặc set vĩnh viễn qua System Properties → Environment Variables.

## Các lệnh thường dùng

Cài + compile:

```cmd
mvnw.cmd -DskipTests compile
```

Chạy server (mặc định profile `dev`, dùng H2 in-memory, port 8080, prefix `/api`):

```cmd
mvnw.cmd spring-boot:run
```

Build file `.jar`:

```cmd
mvnw.cmd -DskipTests package
```

Chạy test:

```cmd
mvnw.cmd test
```

## Cấu hình môi trường

- **Dev (mặc định)**: dùng H2 in-memory, console DB tại `http://localhost:8080/api/h2-console`
- **Prod**: dùng MySQL. Đặt biến môi trường:
  ```
  DB_URL=jdbc:mysql://localhost:3306/quanlydn
  DB_USERNAME=root
  DB_PASSWORD=your_password
  ```
  Rồi chạy:
  ```cmd
  mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=prod
  ```

## API Base URL

Server chạy tại `http://localhost:8080/api`

Hiện tại chưa có endpoint nào (môi trường trống). Sau này khi tạo controller, ví dụ
`@GetMapping("/users")` sẽ truy cập tại `http://localhost:8080/api/users`.

## Kết nối với frontend Electron

Frontend gọi API qua `fetch("http://localhost:8080/api/...")`. Khi triển khai
controller đầu tiên, nhớ thêm cấu hình CORS trong `config/` cho phép origin
`http://localhost:5173` (dev) và `file://` (production Electron).
