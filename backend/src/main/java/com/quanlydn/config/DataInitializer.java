package com.quanlydn.config;

import com.quanlydn.entity.Department;
import com.quanlydn.entity.Project;
import com.quanlydn.entity.Role;
import com.quanlydn.entity.Task;
import com.quanlydn.entity.User;
import com.quanlydn.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private RoleRepo roleRepo;

    @Autowired
    private DepartmentRepo departmentRepo;

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private ProjectRepo projectRepo;

    @Autowired
    private TaskRepo taskRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("====== BẮT ĐẦU KHỞI TẠO DỮ LIỆU MẪU ======");

        // 1. Tạo các Roles mặc định (ID 1: Employee, ID 2: Manager, ID 3: Admin)
        Role employeeRole = null;
        Role managerRole = null;
        Role adminRole = null;

        if (roleRepo.count() == 0) {
            employeeRole = new Role();
            employeeRole.setName("Employee");
            employeeRole.setDescription("Nhân viên bình thường");
            roleRepo.save(employeeRole);

            managerRole = new Role();
            managerRole.setName("Manager");
            managerRole.setDescription("Quản lý bộ phận");
            roleRepo.save(managerRole);

            adminRole = new Role();
            adminRole.setName("Admin");
            adminRole.setDescription("Quản trị viên hệ thống");
            roleRepo.save(adminRole);

            System.out.println("-> Đã khởi tạo 3 vai trò mẫu (Employee, Manager, Admin).");
        } else {
            employeeRole = roleRepo.findById(1L).orElse(null);
            managerRole = roleRepo.findById(2L).orElse(null);
            adminRole = roleRepo.findById(3L).orElse(null);
        }

        // 2. Tạo các Phòng ban mặc định (Departments)
        Department techDept = null;
        Department salesDept = null;
        Department designDept = null;

        if (departmentRepo.count() == 0) {
            techDept = new Department();
            techDept.setName("Kỹ thuật");
            techDept.setDescription("Bộ phận phát triển phần mềm và hạ tầng công nghệ");
            departmentRepo.save(techDept);

            salesDept = new Department();
            salesDept.setName("Kinh doanh");
            salesDept.setDescription("Bộ phận phát triển thị trường và kinh doanh sản phẩm");
            departmentRepo.save(salesDept);

            designDept = new Department();
            designDept.setName("Thiết kế");
            designDept.setDescription("Bộ phận thiết kế giao diện UX/UI và truyền thông sáng tạo");
            departmentRepo.save(designDept);

            System.out.println("-> Đã khởi tạo 3 phòng ban mẫu (Kỹ thuật, Kinh doanh, Thiết kế).");
        } else {
            techDept = departmentRepo.findById(1L).orElse(null);
            salesDept = departmentRepo.findById(2L).orElse(null);
            designDept = departmentRepo.findById(3L).orElse(null);
        }

        // 3. Tạo các tài khoản Users mẫu
        User adminUser = null;
        User empA = null;
        User empB = null;

        if (userRepo.count() == 0) {
            // Admin account
            adminUser = new User();
            adminUser.setFullname("TechCorp Admin");
            adminUser.setEmail("admin@techcorp.com");
            adminUser.setPassword(passwordEncoder.encode("password123"));
            adminUser.setPhone("0123456789");
            adminUser.setAvatar("A");
            adminUser.setIsActive(true);
            adminUser.setRole(adminRole);
            adminUser.setDepartment(techDept);
            userRepo.save(adminUser);

            // Employee A (Kỹ thuật)
            empA = new User();
            empA.setFullname("Nguyễn Văn A");
            empA.setEmail("nva@techcorp.com");
            empA.setPassword(passwordEncoder.encode("password123"));
            empA.setPhone("0987654321");
            empA.setAvatar("A");
            empA.setIsActive(true);
            empA.setRole(employeeRole);
            empA.setDepartment(techDept);
            userRepo.save(empA);

            // Employee B (Kinh doanh)
            empB = new User();
            empB.setFullname("Trần Thị B");
            empB.setEmail("ttb@techcorp.com");
            empB.setPassword(passwordEncoder.encode("password123"));
            empB.setPhone("0912345678");
            empB.setAvatar("B");
            empB.setIsActive(true);
            empB.setRole(employeeRole);
            empB.setDepartment(salesDept);
            userRepo.save(empB);

            System.out.println("-> Đã tạo 3 tài khoản mẫu (Admin, nva@techcorp.com, ttb@techcorp.com). Mật khẩu: password123");
        } else {
            adminUser = userRepo.findByEmail("admin@techcorp.com").orElse(null);
            empA = userRepo.findByEmail("nva@techcorp.com").orElse(null);
            empB = userRepo.findByEmail("ttb@techcorp.com").orElse(null);
        }

        // 4. Tạo các Dự án mẫu (Projects)
        Project prj1 = null;
        Project prj2 = null;

        if (projectRepo.count() == 0 && adminUser != null) {
            // Project 1
            prj1 = new Project();
            prj1.setName("Hệ thống ERP Doanh nghiệp");
            prj1.setDescription("Xây dựng cổng thông tin quản trị và quản lý nội bộ doanh nghiệp ERP thế hệ mới.");
            prj1.setStartDate(LocalDate.now());
            prj1.setEndDate(LocalDate.now().plusMonths(3));
            prj1.setStatus("active");
            prj1.setCreatedBy(adminUser);
            projectRepo.save(prj1);

            // Project 2
            prj2 = new Project();
            prj2.setName("Chiến dịch Marketing Hè");
            prj2.setDescription("Chiến dịch truyền thông quảng bá sản phẩm mới và tri ân khách hàng thân thiết hè 2026.");
            prj2.setStartDate(LocalDate.now().minusDays(15));
            prj2.setEndDate(LocalDate.now().plusDays(15));
            prj2.setStatus("completed");
            prj2.setCreatedBy(adminUser);
            projectRepo.save(prj2);

            System.out.println("-> Đã khởi tạo 2 dự án mẫu.");
        } else {
            prj1 = projectRepo.findById(1L).orElse(null);
            prj2 = projectRepo.findById(2L).orElse(null);
        }

        // 5. Tạo các Task mẫu (Tasks)
        if (taskRepo.count() == 0 && prj1 != null && empA != null && adminUser != null) {
            // Task 1 for Project 1 (In Progress)
            Task t1 = new Task();
            t1.setTitle("Thiết kế Cơ sở dữ liệu");
            t1.setDescription("Phân tích thực thể, thiết kế sơ đồ quan hệ ERD và viết script tạo các bảng cho ERP.");
            t1.setStatus("inProgress");
            t1.setPriority("high");
            t1.setDeadline(LocalDateTime.now().plusDays(7));
            t1.setProject(prj1);
            t1.setAssignedTo(empA);
            t1.setCreatedBy(adminUser);
            taskRepo.save(t1);

            // Task 2 for Project 1 (Todo)
            Task t2 = new Task();
            t2.setTitle("Viết APIs Đăng nhập & Đăng ký");
            t2.setDescription("Hiện thực các endpoint đăng nhập, đăng ký sử dụng Spring Boot và lưu thông tin vào database.");
            t2.setStatus("todo");
            t2.setPriority("medium");
            t2.setDeadline(LocalDateTime.now().plusDays(14));
            t2.setProject(prj1);
            t2.setAssignedTo(empA);
            t2.setCreatedBy(adminUser);
            taskRepo.save(t2);

            System.out.println("-> Đã khởi tạo 2 task mẫu thuộc dự án ERP.");
        }

        System.out.println("====== KHỞI TẠO DỮ LIỆU MẪU THÀNH CÔNG ======");
    }
}
