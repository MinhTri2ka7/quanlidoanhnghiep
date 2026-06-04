# QuanLyDN - Phần mềm quản lý doanh nghiệp

Phần mềm desktop (Windows .exe) viết bằng ReactJS + Electron.
Bao gồm các màn hình Đăng nhập / Đăng ký / Quên mật khẩu (qua Gmail) theo
phong cách Modern Enterprise.

## Stack

- ReactJS 18 + React Router (giao diện)
- TailwindCSS (style)
- Vite (build tool)
- Electron (đóng gói thành phần mềm desktop)
- electron-builder (tạo file cài đặt .exe)

## Cài đặt

```cmd
npm install
```

## Chạy ở chế độ phát triển

Lệnh dưới sẽ mở Vite dev server và bật cửa sổ Electron cùng lúc:

```cmd
npm run dev
```

## Đóng gói thành phần mềm cài đặt (.exe)

```cmd
npm run build:win
```

Sau khi chạy xong, file cài đặt sẽ nằm trong thư mục `release/`.
Người dùng cuối chỉ cần chạy file `QuanLyDN Setup x.x.x.exe` để cài như phần
mềm bình thường trên Windows.

## Cấu trúc thư mục

```
electron/             Code chạy ở main process của Electron
├── main.cjs          Tạo cửa sổ ứng dụng, load React app
└── preload.cjs       Cầu nối an toàn giữa Electron và React

src/                  Code React
├── components/       Component tái sử dụng
├── pages/            3 màn hình: Login, Register, ForgotPassword
├── utils/            Validators
├── App.jsx           Cấu hình route
└── main.jsx          Entry point React (dùng HashRouter)

dist/                 Output sau khi vite build (React đã build)
release/              Output sau khi electron-builder build (file .exe)
```

## Tích hợp backend

Trong các trang `LoginPage`, `RegisterPage`, `ForgotPasswordPage`, các handler
hiện đang giả lập bằng `setTimeout`. Mỗi chỗ đều có comment đánh dấu để thay
bằng API thật khi tích hợp với backend.
