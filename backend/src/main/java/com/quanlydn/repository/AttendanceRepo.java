package com.quanlydn.repository;

import com.quanlydn.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepo extends JpaRepository<Attendance, Long> {

    List<Attendance> findByUserId(Long userId);

    List<Attendance> findByWorkDate(LocalDate workDate);

    Optional<Attendance> findByUserIdAndWorkDate(Long userId, LocalDate workDate);
}
