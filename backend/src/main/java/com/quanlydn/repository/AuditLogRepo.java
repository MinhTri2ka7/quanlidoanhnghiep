package com.quanlydn.repository;

import com.quanlydn.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepo extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<AuditLog> findByModuleName(String moduleName);
}
